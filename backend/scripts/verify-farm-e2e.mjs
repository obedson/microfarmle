// Real local PostgreSQL + PostgREST + Express + browser journey.
// Explicit clean child environments; never consumes hosted database configuration.
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'backend/package.json'));
const suffix=process.pid+'-'+Date.now();
const network='microfams-farm-e2e-'+suffix;
const database=network+'-db',rest=network+'-rest';
const children=[];
let proxy;
function run(command,args,input) {
 const r=spawnSync(command,args,{cwd:root,input,encoding:'utf8',stdio:input?['pipe','pipe','pipe']:['ignore','pipe','pipe']});
 if(r.status!==0)throw new Error(command+' failed: '+String(r.stderr).slice(-2000));
 return r.stdout;
}
const baseEnv={PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'test',CI:'true'};
async function ready(url){for(let i=0;i<90;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,1000));}throw new Error('Local service did not become ready');}
try{
 run('docker',['network','create',network]);
 run('docker',['run','-d','--name',database,'--network',network,'-e','POSTGRES_PASSWORD=postgres','-e','POSTGRES_DB=microfams','postgres:16-alpine']);
 for(let i=0;i<60;i++){
  const r=spawnSync('docker',['exec',database,'pg_isready','-U','postgres'],{stdio:'ignore'});
  if(r.status===0){await new Promise(r=>setTimeout(r,3000));break;}
  await new Promise(r=>setTimeout(r,1000));
 }
 const sql=input=>run('docker',['exec','-i',database,'psql','-U','postgres','-d','microfams','-v','ON_ERROR_STOP=1'],input);
 sql(readFileSync(path.join(root,'backend/tests/schema/test-schema-bootstrap.sql'),'utf8'));
 for(const migration of readFileSync(path.join(root,'backend/migrations/schema-manifest.txt'),'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#'))) {
  if(migration==='install_farm_inventory_bridge.sql')sql(readFileSync(path.join(root,'backend/tests/schema/farm-upgrade-fixture.sql'),'utf8'));
  sql(readFileSync(path.join(root,'backend/migrations',migration),'utf8'));
 }
 sql(readFileSync(path.join(root,'backend/tests/schema/test-farm-upgrade.sql'),'utf8'));
 sql(readFileSync(path.join(root,'backend/tests/schema/test-farm-operations.sql'),'utf8'));
 console.log('Farm additive upgrade and database invariants passed');
 sql(readFileSync(path.join(root,'backend/tests/schema/farm-e2e-fixtures.sql'),'utf8'));
 const fixtureSigningKey=randomBytes(32).toString('hex');
 const serviceToken=require('jsonwebtoken').sign({role:'service_role'},fixtureSigningKey);
 run('docker',['run','-d','--name',rest,'--network',network,'-p','127.0.0.1:55434:3000',
 '-e','PGRST_DB_URI=postgres://postgres:postgres@'+database+':5432/microfams',
 '-e','PGRST_DB_SCHEMAS=public','-e','PGRST_DB_ANON_ROLE=anon','-e','PGRST_JWT_SECRET='+fixtureSigningKey,'postgrest/postgrest:v12.2.3']);
 await ready('http://127.0.0.1:55434/');
 proxy=http.createServer((req,res)=>{
  if(!req.url?.startsWith('/rest/v1/')){res.writeHead(404);res.end();return;}
  const upstream=http.request({hostname:'127.0.0.1',port:55434,path:req.url.slice('/rest/v1'.length),method:req.method,headers:req.headers},reply=>{
   res.writeHead(reply.statusCode??502,reply.headers);reply.pipe(res);
  });
  upstream.on('error',()=>{res.writeHead(502);res.end();});req.pipe(upstream);
 });
 await new Promise(resolve=>proxy.listen(55435,'127.0.0.1',resolve));
 const backend=spawn(path.join(root,'backend/node_modules/.bin/tsx'),['tests/farmOperationsServer.ts'],{
  cwd:path.join(root,'backend'),env:{...baseEnv,SUPABASE_URL:'http://127.0.0.1:55435',SUPABASE_SERVICE_KEY:serviceToken,
  JWT_SECRET:randomBytes(32).toString('hex'),JWT_REFRESH_SECRET:randomBytes(32).toString('hex')},stdio:['ignore','pipe','pipe']
 });
 children.push(backend);
 backend.stdout.on('data',buffer=>{if(buffer.toString().includes('Disposable farm API ready'))console.log('Disposable farm API ready');});
 // Do not print backend diagnostics: providers/configuration are irrelevant here.
 await ready('http://127.0.0.1:3002/health');
 const fixtureClient=require('@supabase/supabase-js').createClient('http://127.0.0.1:55435',serviceToken);
 const probe=await fixtureClient.from('users').select('id').eq('email','farm-owner@example.com').single();
 if(probe.error || !probe.data)throw new Error('Disposable authentication fixture is not readable'+(probe.error?.code && /^[A-Z0-9]+$/.test(probe.error.code)?' ('+probe.error.code+')':''));
 const build=spawn('npm',['run','build'],{cwd:path.join(root,'frontend'),
  env:{...baseEnv,REACT_APP_API_URL:'http://127.0.0.1:3002/api',REACT_APP_SUPABASE_URL:'',REACT_APP_SUPABASE_ANON_KEY:'',GENERATE_SOURCEMAP:'false'},stdio:'inherit'});
 children.push(build);
 const buildCode=await new Promise(resolve=>build.on('exit',resolve));
 if(buildCode!==0)throw new Error('Farm production build failed');
 const browser=spawn(path.join(root,'frontend/node_modules/.bin/playwright'),['test','--config=playwright.farm.config.ts'],{
  cwd:path.join(root,'frontend'),env:{...baseEnv,FARM_E2E_DATABASE_CONTAINER:database},stdio:'inherit'
 });
 children.push(browser);
 const code=await new Promise(resolve=>browser.on('exit',resolve));
 if(code!==0)throw new Error('Farm browser acceptance failed');
 console.log('Real farm API/database/browser acceptance passed');
}catch(error){console.error(error.message);process.exitCode=1;}
finally{
 if(proxy)proxy.close();
 for(const child of children)child.kill('SIGTERM');
 for(const container of [rest,database])spawnSync('docker',['rm','-f',container],{stdio:'ignore'});
 spawnSync('docker',['network','rm',network],{stdio:'ignore'});
}
