import { Router, Response } from 'express';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { resolveTenant, TenantRequest } from '../middleware/tenant.js';
import { requireFeature } from '../middleware/requireFeature.js';
import { farmService, FarmService } from '../domains/farm/farmService.js';
import { FarmError, farmKinds } from '../domains/farm/farmRules.js';
const querySchema=Joi.object({farmId:Joi.string().uuid(),id:Joi.string().uuid(),kind:Joi.string().valid(...farmKinds),
  search:Joi.string().max(160).allow(''),state:Joi.string().max(20),view:Joi.string().valid('upcoming','overdue','completed','history','evidence'),
  limit:Joi.number().integer().min(1).max(100).default(50),offset:Joi.number().integer().min(0).max(100000).default(0)});
const failure=(res:Response,error:unknown)=>{
  const known=error instanceof FarmError;
  return res.status(known?error.status:503).json({success:false,error:known?error.code:'FARM_SERVICE_UNAVAILABLE'});
};
export function createFarmOperationsRouter(service:FarmService=farmService) {
  const router=Router();
  router.use(authenticateToken,resolveTenant,(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
  router.get('/',async(req:TenantRequest,res:Response)=>{
    const {value,error}=querySchema.validate(req.query,{allowUnknown:false});
    if(error)return res.status(400).json({success:false,error:'FARM_QUERY_INVALID'});
    try {return res.json({success:true,data:await service.read({actorId:req.user.id,organizationId:req.tenant!.id},value)});}
    catch(e){return failure(res,e);}
  });
  router.post('/commands',rateLimit({windowMs:60000,limit:120,standardHeaders:true,legacyHeaders:false,
    message:{success:false,error:'FARM_RATE_LIMITED'},
    keyGenerator:req=>{const scoped=req as TenantRequest;return scoped.tenant!.id+':'+scoped.user.id;},
  }),
    requireFeature('farm_erp.operations'),(req,res,next)=>{
      if(req.body?.kind==='expense' && req.body?.data?.debitAccountId) return requireFeature('financial.accounting.post')(req,res,next);
      next();
    },async(req:TenantRequest,res:Response)=>{
    try {
      const result=await service.command({actorId:req.user.id,organizationId:req.tenant!.id},String(req.headers['idempotency-key']??''),req.body);
      return res.status(200).json({success:true,data:result});
    }catch(e){return failure(res,e);}
  });
  return router;
}
export default createFarmOperationsRouter();
