import express from 'express';
import request from 'supertest';
import {createFarmOperationsRouter} from '../routes/farmOperations.js';
import {FarmService,FarmGateway} from '../domains/farm/farmService.js';
import {FarmError} from '../domains/farm/farmRules.js';
jest.mock('../middleware/auth.js',()=>({authenticateToken:(req:any,res:any,next:any)=>{
 if(!req.headers.authorization)return res.status(401).json({success:false,error:'AUTHENTICATION_REQUIRED'});
 req.user={id:'60000000-0000-4000-8000-000000000001'};next();
}}));
jest.mock('../middleware/tenant.js',()=>({resolveTenant:(req:any,res:any,next:any)=>{
 if(req.headers['x-organization-id']!=='60000000-0000-4000-8000-000000000001')return res.status(403).json({success:false,error:'TENANT_ACCESS_DENIED'});
 req.tenant={id:req.headers['x-organization-id']};next();
}}));
jest.mock('../middleware/requireFeature.js',()=>({requireFeature:(key:string)=>((req:any,res:any,next:any)=>{
 if(req.headers['x-test-flag']==='off'||req.headers['x-disabled-feature']===key)return res.status(503).json({success:false,error:'FEATURE_DISABLED'});next();
})}));
const gateway:FarmGateway={command:jest.fn(),read:jest.fn()};
const app=express();app.use(express.json());app.use('/api/farm-operations',createFarmOperationsRouter(new FarmService(gateway)));
const auth={Authorization:'Bearer synthetic-fixture','X-Organization-ID':'60000000-0000-4000-8000-000000000001'};
const command={id:'60000000-0000-4000-8000-000000000010',farmId:'60000000-0000-4000-8000-000000000010',kind:'farm',version:0,state:'DRAFT',data:{name:'Farm',operationType:'mixed',tenure:'owned'}};
beforeEach(()=>jest.clearAllMocks());
test('requires authentication and active tenant selection',async()=>{
 await request(app).get('/api/farm-operations').expect(401);
 await request(app).get('/api/farm-operations').set('Authorization',auth.Authorization).expect(403);
 expect(gateway.read).not.toHaveBeenCalled();
});
test('disabled rollout blocks writes but retains read access',async()=>{
 (gateway.read as jest.Mock).mockResolvedValue({items:[]});
 await request(app).get('/api/farm-operations').set(auth).set('X-Test-Flag','off').expect(200);
 await request(app).post('/api/farm-operations/commands').set(auth).set('X-Test-Flag','off').send(command).expect(503);
 expect(gateway.command).not.toHaveBeenCalled();
});
test('requires operation id and sends server-derived actor and organization',async()=>{
 await request(app).post('/api/farm-operations/commands').set(auth).send(command).expect(400);
 const op='60000000-0000-4000-8000-000000000099';
 (gateway.command as jest.Mock).mockResolvedValue({id:command.id});
 await request(app).post('/api/farm-operations/commands').set(auth).set('Idempotency-Key',op).send(command).expect(200);
 expect(gateway.command).toHaveBeenCalledWith({actorId:auth['X-Organization-ID'],organizationId:auth['X-Organization-ID']},op,command);
});
test('rejects invalid pagination and query injection',async()=>{
 await request(app).get('/api/farm-operations?limit=101').set(auth).expect(400);
 await request(app).get('/api/farm-operations?organizationId=foreign').set(auth).expect(400);
});
test.each([['FARM_ACCESS_DENIED',403],['FARM_VERSION_CONFLICT',409],['FARM_IDEMPOTENCY_CONFLICT',409]])('exposes stable %s error',async(code,status)=>{
 (gateway.command as jest.Mock).mockRejectedValue(new FarmError(String(code),Number(status)));
 const response=await request(app).post('/api/farm-operations/commands').set(auth).set('Idempotency-Key','60000000-0000-4000-8000-000000000099').send(command).expect(Number(status));
 expect(response.body).toEqual({success:false,error:code});
});
test('redacts arbitrary database errors',async()=>{
 (gateway.read as jest.Mock).mockRejectedValue(new Error('internal database connection details'));
 const response=await request(app).get('/api/farm-operations').set(auth).expect(503);
 expect(response.body).toEqual({success:false,error:'FARM_SERVICE_UNAVAILABLE'});
});
test('accounting posting has its own gate without blocking ordinary expense recording',async()=>{
 const expense={...command,kind:'expense',state:'RECORDED',data:{category:'transport',description:'Transport cost',amountMinor:500,currency:'NGN',occurredOn:'2026-09-01'}};
 (gateway.command as jest.Mock).mockResolvedValue({id:command.id});
 await request(app).post('/api/farm-operations/commands').set(auth).set('Idempotency-Key','60000000-0000-4000-8000-000000000099').set('X-Disabled-Feature','financial.accounting.post').send(expense).expect(200);
 await request(app).post('/api/farm-operations/commands').set(auth).set('Idempotency-Key','60000000-0000-4000-8000-000000000099').set('X-Disabled-Feature','financial.accounting.post').send({...expense,data:{...expense.data,debitAccountId:command.id,creditAccountId:command.id}}).expect(503);
 expect(gateway.command).toHaveBeenCalledTimes(1);
});
