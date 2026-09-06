// Disposable E2E composition: production authentication, tenant resolution,
// feature gate, farm router, and Supabase gateway against local PostgREST.
import express from 'express';
import cors from 'cors';
import { login } from '../src/controllers/authController.js';
import { authenticateToken } from '../src/middleware/auth.js';
import { SupabaseTenantRepository } from '../src/repositories/tenantRepository.js';
import farmOperations from '../src/routes/farmOperations.js';
const app=express();
app.use(cors({origin:'http://127.0.0.1:4174'}));
app.use(express.json({limit:'10mb'}));
app.get('/health',(_req,res)=>res.json({status:'ok'}));
app.post('/api/auth/login',login);
app.get('/api/organizations',authenticateToken,async(req:any,res)=>{
 try{res.json({success:true,data:await new SupabaseTenantRepository().listActiveMemberships(req.user.id)});}
 catch{res.status(503).json({success:false,error:'TENANT_SERVICE_UNAVAILABLE'});}
});
app.use('/api/farm-operations',farmOperations);
app.listen(3002,'127.0.0.1',()=>console.log('Disposable farm API ready'));
