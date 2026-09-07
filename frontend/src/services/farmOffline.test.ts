import {retryFarmOperation,synchronizeFarmOperations,FarmSnapshot} from './farmOffline';
import {FarmOperation,FarmResource} from './farmOperationsAPI';
const operation:FarmOperation={operationId:'operation-1',id:'task-1',farmId:'farm-1',kind:'task',version:2,state:'COMPLETED',data:{name:'Feed'}};
const resource={id:'task-1',farm_id:'farm-1',kind:'task',version:3,state:'COMPLETED',data:{name:'Feed'},quantity:'0',created_by:'user-1',created_at:'2026-09-01'} as FarmResource;
const snapshot=():FarmSnapshot=>({resources:[],operations:[{operation:{...operation},state:'PENDING'}]});
test('persists syncing before sending and uses the unchanged replay identity',async()=>{
 const s=snapshot();const states:string[]=[];const send=jest.fn(async()=>resource);
 await synchronizeFarmOperations(s,send,async state=>{states.push(state.operations[0].state);},()=>true);
 expect(states).toEqual(['SYNCING','SYNCED']);expect(send).toHaveBeenCalledWith(operation);
 expect(s.resources).toEqual([resource]);
});
test('network failure retains data and pending operation for retry',async()=>{
 const s=snapshot();await synchronizeFarmOperations(s,async()=>{throw new Error('offline');},async()=>{},()=>true);
 expect(s.operations[0].state).toBe('PENDING');expect(s.operations[0].operation).toEqual(operation);
});
test('version conflicts are visible and do not silently retry',async()=>{
 const s=snapshot();const send=jest.fn(async()=>{throw {response:{status:409,data:{error:'FARM_VERSION_CONFLICT'}}};});
 await synchronizeFarmOperations(s,send,async()=>{},()=>true);await synchronizeFarmOperations(s,send,async()=>{},()=>true);
 expect(send).toHaveBeenCalledTimes(1);expect(s.operations[0].state).toBe('CONFLICT');
});
test('revocation rejects and retains queued work',async()=>{
 const s=snapshot();s.operations.push({operation:{...operation,operationId:'operation-2'},state:'PENDING'});
 const send=jest.fn(async()=>{throw {response:{status:403,data:{error:'FARM_ACCESS_DENIED'}}};});
 await synchronizeFarmOperations(s,send,async()=>{},()=>true);
 expect(send).toHaveBeenCalledTimes(1);expect(s.operations[0].state).toBe('FAILED');expect(s.operations[1].state).toBe('PENDING');
});
test('retry selects one failed authoritative operation by stable replay identity',()=>{
 const s=snapshot();
 s.operations[0].state='FAILED';s.operations[0].error='FEATURE_DISABLED';
 s.operations.push(
  {operation:{...operation,operationId:'operation-2'},state:'FAILED',error:'FARM_ACCESS_DENIED'},
  {operation:{...operation,operationId:'operation-3'},state:'CONFLICT',error:'FARM_VERSION_CONFLICT'},
 );
 const retried=s.operations[0];
 expect(retryFarmOperation(s,'operation-1')).toBe(true);
 expect(s.operations[0]).toBe(retried);
 expect(s.operations[0]).toEqual(expect.objectContaining({state:'PENDING',error:'FEATURE_DISABLED'}));
 expect(s.operations[0].operation.operationId).toBe('operation-1');
 expect(s.operations[1].state).toBe('FAILED');
 expect(s.operations[2].state).toBe('CONFLICT');
 expect(retryFarmOperation(s,'operation-3')).toBe(false);
});
test('changing principal stops sync and cannot publish another tenant response',async()=>{
 const s=snapshot();let current=true;
 await synchronizeFarmOperations(s,async()=>{current=false;return resource;},async()=>{},()=>current);
 expect(s.resources).toEqual([]);expect(s.operations[0].state).toBe('SYNCING');
});
test('already synchronized operations are never resent',async()=>{
 const s=snapshot();s.operations[0].state='SYNCED';const send=jest.fn();
 await synchronizeFarmOperations(s,send,async()=>{},()=>true);expect(send).not.toHaveBeenCalled();
});
