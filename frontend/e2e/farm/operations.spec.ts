import {expect,test,Page} from '@playwright/test';
import {execFileSync} from 'node:child_process';
const organization='61000000-0000-4000-8000-000000000001';
const worker='61000000-0000-4000-8000-000000000002';
async function login(page:Page,email='farm-manager@example.com',org=organization) {
 await page.goto('/login');
 await page.getByLabel('Email Address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill('Synthetic-field-test-42!');
 const response=page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Sign In'}).click();
 expect((await response).status()).toBe(200);
 await expect(page).toHaveURL(/dashboard/);
 // Each synthetic actor starts with freshly loaded membership UI.
 await page.reload();
 const menu=page.getByRole('button',{name:'Toggle menu'});
 if(await menu.isVisible())await menu.click();
 const switcher=page.locator('label[aria-label="Active organization"] select:visible').first();
 await expect(switcher.locator('option[value="'+org+'"]')).toHaveCount(1);
 await Promise.all([page.waitForNavigation(),switcher.selectOption(org)]);
 await page.goto('/farm-operations');
 await expect(page.getByRole('heading',{name:'Farm Operations',exact:true})).toBeVisible();
}
async function kind(page:Page,value:string){await page.getByLabel('Record type',{exact:true}).selectOption(value);}
async function save(page:Page) {
 const result=page.waitForResponse(r=>r.url().endsWith('/farm-operations/commands')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Save operation',exact:true}).click();
 const response=await result;expect(response.status()).toBe(200);
 const resource=(await response.json()).data;
 await expect(page.getByRole('button',{name:'Save operation',exact:true})).toBeEnabled();
 return resource;
}
async function api(page:Page,path:string,body?:unknown,operationId?:string,org=organization) {
 return page.evaluate(async({path,body,operationId,organization})=>{
  const response=await fetch('http://127.0.0.1:3002/api/farm-operations'+path,{
   method:body?'POST':'GET',headers:{Authorization:'Bearer '+localStorage.getItem('token'),'X-Organization-ID':organization,
   'Content-Type':'application/json',...(operationId?{'Idempotency-Key':operationId}:{})},body:body?JSON.stringify(body):undefined});
  return {status:response.status,body:await response.json()};
 },{path,body,operationId,organization:org});
}
test('real farm setup, operations, evidence, offline replay, conflict and revoked access',async({page,context},info)=>{
 test.setTimeout(180000);
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await login(page);
 await page.getByLabel('Farm name').fill('Acceptance '+info.project.name);
 await page.getByLabel('Operation type').fill('Mixed agriculture');
 await page.getByLabel('Tenure / ownership').fill('Owned');
 const farm=await save(page);
 expect(farm.created_by).toBe('61000000-0000-4000-8000-000000000004');
 expect(farm.data.managerId).toBe(farm.created_by);
 await page.getByLabel('Farm',{exact:true}).selectOption(farm.id);
 await kind(page,'unit');
 await page.getByLabel('Unit name').fill('Production unit');
 await page.getByLabel('Unit identifier').fill('P1');
 await page.getByLabel('Size / capacity').fill('10');
 await page.getByLabel('Measurement unit').fill('m2');
 await page.getByLabel('Production type').fill('crop');
 const unit=await save(page);
 await kind(page,'worker');
 await page.getByLabel('Worker name').fill('Assigned farm worker');
 await page.getByLabel('Member user ID (optional)').fill(worker);
 await page.getByLabel('Farm access').selectOption('worker');
 await page.getByLabel('Operational role').fill('Field worker');
 await page.getByLabel('Start date').fill('2026-01-01');
 const assigned=await save(page);
 await kind(page,'cycle');
 await page.getByLabel('Cycle name').fill('Maize cycle');
 await page.getByLabel('Production unit',{exact:true}).selectOption(unit.id);
 await page.getByLabel('Crop / product').fill('Maize');
 await page.getByLabel('Planned start').fill('2026-01-01');
 await page.getByLabel('Expected completion').fill('2027-01-01');
 await page.getByLabel('Planned quantity / area').fill('10');
 await page.getByLabel('Measurement unit').fill('m2');
 await page.getByLabel('Responsible workers').selectOption([assigned.id]);
 const cycle=await save(page);
 await kind(page,'task');
 await page.getByLabel('Task title').fill('Harvest maize');
 await page.getByLabel('Activity type').fill('harvest');
 await page.getByLabel('Production unit',{exact:true}).selectOption(unit.id);
 await page.getByLabel('Production cycle',{exact:true}).selectOption(cycle.id);
 await page.getByLabel('Assigned workers').selectOption([assigned.id]);
 await page.getByLabel('Priority',{exact:true}).selectOption('normal');
 await page.getByLabel('Scheduled date').fill('2026-01-01');
 await page.getByLabel('Due date').fill('2027-01-01');
 await page.getByLabel('Recurrence').selectOption('none');
 const task=await save(page);
 await page.getByRole('article').filter({hasText:'Harvest maize'}).getByRole('button',{name:'Edit record'}).click();
 await page.getByLabel('Status',{exact:true}).selectOption('IN_PROGRESS');await save(page);
 await page.getByRole('article').filter({hasText:'Harvest maize'}).getByRole('button',{name:'Edit record'}).click();
 await page.getByLabel('Status',{exact:true}).selectOption('COMPLETED');await save(page);
 await kind(page,'input');await page.getByLabel('Date',{exact:true}).fill('2026-09-01');
 await page.getByLabel('Input item').fill('Seed');await page.getByLabel('Category',{exact:true}).selectOption('seed');
 await page.getByLabel('Quantity',{exact:true}).fill('2');await page.getByLabel('Measurement unit').fill('kg');await save(page);
 await kind(page,'yield');await page.getByLabel('Date',{exact:true}).fill('2026-09-01');
 await page.getByLabel('Product',{exact:true}).fill('Maize');await page.getByLabel('Production quantity').fill('10');
 await page.getByLabel('Measurement unit').fill('kg');await save(page);
 await kind(page,'evidence');await page.getByLabel('Attach to record').selectOption(task.id);
 await page.getByLabel('Evidence file').setInputFiles({name:'receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic acceptance receipt\n%%EOF')});
 const attachment=await save(page);
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download evidence'}).click();
 expect((await download).suggestedFilename()).toBe('receipt.pdf');
 await page.getByRole('button',{name:'View operational history'}).click();await expect(page.getByRole('heading',{name:'Operational history'})).toBeVisible();
 await kind(page,'expense');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await context.setOffline(true);
 await page.getByLabel('Date',{exact:true}).fill('2026-09-01');
 await page.getByLabel('Expense category').fill('transport');await page.getByLabel('Description',{exact:true}).fill('Harvest transport');
 await page.getByLabel('Amount in minor currency units').fill('500');await page.getByLabel('Currency',{exact:true}).selectOption('NGN');
 await page.getByRole('button',{name:'Save offline'}).click();
 await expect(page.getByLabel('Synchronization queue')).toContainText('expense: PENDING');
 await page.reload();
 await expect(page.getByRole('heading',{name:'Farm Operations',exact:true})).toBeVisible();
 await expect(page.getByLabel('Synchronization queue')).toContainText('expense: PENDING');
 await expect(page.getByRole('option',{name:'Acceptance '+info.project.name,exact:true})).toHaveCount(1);
 const syncResponse=page.waitForResponse(r=>r.url().endsWith('/farm-operations/commands')&&r.request().method()==='POST');
 await context.setOffline(false);
 const response=await syncResponse;expect(response.status()).toBe(200);
 const request=response.request();const command=request.postDataJSON();const operationId=request.headers()['idempotency-key'];
 expect((await api(page,'/commands',command,operationId)).status).toBe(200);
 const listing=await api(page,'?farmId='+farm.id+'&kind=expense');
 expect(listing.body.data.items).toHaveLength(1);
 const stale={id:unit.id,farmId:farm.id,kind:'unit',version:unit.version,state:unit.state,data:{...unit.data,name:'Updated unit'}};
 expect((await api(page,'/commands',stale,crypto.randomUUID())).status).toBe(200);
 expect((await api(page,'/commands',{...stale,data:{...stale.data,name:'Stale overwrite'}},crypto.randomUUID())).status).toBe(409);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 // Real second-tenant authentication cannot retrieve this farm or attachment.
 await login(page,'farm-outsider@example.com','61000000-0000-4000-8000-000000000003');
 expect((await api(page,'?id='+farm.id)).status).toBe(403);
 expect((await api(page,'?id='+attachment.id+'&view=evidence')).status).toBe(403);
 const crossTenantMutation={id:unit.id,farmId:farm.id,kind:'unit',version:unit.version+1,state:unit.state,data:{...unit.data,name:'Cross-tenant overwrite'}};
 // Reject both a forged tenant selection and a foreign ID under the actor's own tenant.
 expect((await api(page,'/commands',crossTenantMutation,crypto.randomUUID())).status).toBe(403);
 expect((await api(page,'/commands',crossTenantMutation,crypto.randomUUID(),'61000000-0000-4000-8000-000000000003')).status).toBe(404);
 await login(page);
 const retained=await api(page,'?id='+unit.id);
 expect(retained.body.data.items[0].data.name).toBe('Updated unit');
 expect(retained.body.data.items[0].version).toBe(unit.version+1);
 await login(page,'farm-worker@example.com');
 await page.getByLabel('Farm',{exact:true}).selectOption(farm.id);
 await kind(page,'expense');
 const forbidden={id:crypto.randomUUID(),farmId:farm.id,kind:'unit',version:0,state:'AVAILABLE',data:unit.data};
 expect((await api(page,'/commands',forbidden,crypto.randomUUID())).status).toBe(403);
 await context.setOffline(true);
 await page.getByLabel('Date',{exact:true}).fill('2026-09-01');
 await page.getByLabel('Expense category').fill('transport');await page.getByLabel('Description',{exact:true}).fill('Revoked queued expense');
 await page.getByLabel('Amount in minor currency units').fill('300');await page.getByLabel('Currency',{exact:true}).selectOption('NGN');
 await page.getByRole('button',{name:'Save offline'}).click();
 await expect(page.getByLabel('Synchronization queue')).toContainText('expense: PENDING');
 const container=process.env.FARM_E2E_DATABASE_CONTAINER;
 if(!container?.startsWith('microfams-farm-e2e-'))throw new Error('Disposable database identifier required');
 execFileSync('docker',['exec',container,'psql','-U','postgres','-d','microfams','-v','ON_ERROR_STOP=1','-c',
  "UPDATE organization_memberships SET status='suspended' WHERE organization_id='"+organization+"' AND user_id='"+worker+"'"],{stdio:'ignore'});
 const revokedSync=page.waitForResponse(r=>r.url().endsWith('/farm-operations/commands')&&r.request().method()==='POST');
 await context.setOffline(false);
 expect((await revokedSync).status()).toBe(403);
 await expect(page.getByLabel('Synchronization queue')).toContainText('expense: FAILED');
 expect((await api(page,'/commands',command,crypto.randomUUID())).status).toBe(403);
 execFileSync('docker',['exec',container,'psql','-U','postgres','-d','microfams','-v','ON_ERROR_STOP=1','-c',
  "UPDATE organization_memberships SET status='active' WHERE organization_id='"+organization+"' AND user_id='"+worker+"'"],{stdio:'ignore'});
});
