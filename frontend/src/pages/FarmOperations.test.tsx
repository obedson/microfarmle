import React from 'react';
import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import FarmOperations from './FarmOperations';
import {farmOperationsAPI} from '../services/farmOperationsAPI';
import {loadFarmSnapshot,saveFarmSnapshot} from '../services/farmOffline';
let mockOrganization:string|null='organization-a';
jest.mock('../store/authStore',()=>({useAuthStore:(select:any)=>select({user:{id:'actor-a'}})}));
jest.mock('../store/organizationStore',()=>({useOrganizationStore:(select:any)=>select({activeOrganizationId:mockOrganization})}));
jest.mock('../services/farmOperationsAPI',()=>({farmOperationsAPI:{list:jest.fn(),command:jest.fn(),evidence:jest.fn()}}));
jest.mock('../services/farmOffline',()=>{
 const real=jest.requireActual('../services/farmOffline');
 return {...real,loadFarmSnapshot:jest.fn(),saveFarmSnapshot:jest.fn()};
});
beforeEach(()=>{
 jest.clearAllMocks();mockOrganization='organization-a';
 Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
 Object.defineProperty(globalThis,'crypto',{value:{randomUUID:()=> '60000000-0000-4000-8000-000000000099'},configurable:true});
 (loadFarmSnapshot as jest.Mock).mockResolvedValue({resources:[],operations:[]});
 (saveFarmSnapshot as jest.Mock).mockImplementation(async(_key,snapshot)=>snapshot);
 (farmOperationsAPI.list as jest.Mock).mockResolvedValue({items:[],hasMore:false});
});
test('requires an active organization before accepting work',()=>{
 mockOrganization=null;render(<FarmOperations/>);
 expect(screen.getByRole('alert')).toHaveTextContent('Select your active organization');
 expect(screen.getByRole('button',{name:'Save operation'})).toBeDisabled();
 expect(farmOperationsAPI.command).not.toHaveBeenCalled();
});
test('preserves a validated form operation before sending through the shared API',async()=>{
 (farmOperationsAPI.command as jest.Mock).mockResolvedValue({id:'farm-a',kind:'farm',data:{name:'Test farm'}});
 render(<FarmOperations/>);
 await waitFor(()=>expect(screen.getByRole('button',{name:'Save operation'})).toBeEnabled());
 fireEvent.change(screen.getByLabelText('Farm name'),{target:{value:'Test farm'}});
 fireEvent.change(screen.getByLabelText('Operation type'),{target:{value:'mixed'}});
 fireEvent.change(screen.getByLabelText('Tenure / ownership'),{target:{value:'leased'}});
 fireEvent.click(screen.getByRole('button',{name:'Save operation'}));
 await waitFor(()=>expect(farmOperationsAPI.command).toHaveBeenCalledTimes(1));
 expect(farmOperationsAPI.command).toHaveBeenCalledWith(expect.objectContaining({kind:'farm',version:0,state:'DRAFT',data:expect.objectContaining({name:'Test farm',managerId:'actor-a'})}));
 expect((saveFarmSnapshot as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((farmOperationsAPI.command as jest.Mock).mock.invocationCallOrder[0]);
 await waitFor(()=>expect(screen.getByLabelText('Synchronization queue')).toHaveTextContent('farm: SYNCED'));
});
test('network rejection retains a visible pending operation',async()=>{
 (farmOperationsAPI.command as jest.Mock).mockRejectedValue(new Error('offline'));
 render(<FarmOperations/>);
 await waitFor(()=>expect(screen.getByRole('button',{name:'Save operation'})).toBeEnabled());
 fireEvent.change(screen.getByLabelText('Farm name'),{target:{value:'Test farm'}});
 fireEvent.change(screen.getByLabelText('Operation type'),{target:{value:'mixed'}});
 fireEvent.change(screen.getByLabelText('Tenure / ownership'),{target:{value:'leased'}});
 fireEvent.click(screen.getByRole('button',{name:'Save operation'}));
 await waitFor(()=>expect(screen.getByLabelText('Synchronization queue')).toHaveTextContent('farm: PENDING'));
 expect(screen.getByLabelText('Synchronization queue')).toHaveTextContent('Your change is preserved');
});
test('switching organization cannot display the previous tenant snapshot',async()=>{
 const privateOperation={operation:{operationId:'private-operation-a',id:'farm-a',farmId:'farm-a',kind:'farm',version:1,state:'DRAFT',data:{name:'Private farm A'}},state:'FAILED',error:'Private tenant error'};
 const resource={id:'farm-a',farm_id:'farm-a',kind:'farm',state:'DRAFT',version:1,data:{name:'Private farm A'}};
 (loadFarmSnapshot as jest.Mock).mockImplementation(async key=>({resources:key==='actor-a:organization-a'?[resource]:[],operations:key==='actor-a:organization-a'?[privateOperation]:[]}));
 (farmOperationsAPI.list as jest.Mock).mockImplementation(async()=>({items:mockOrganization==='organization-a'?[resource]:[],hasMore:false}));
 const view=render(<FarmOperations/>);
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Private farm A'})).toBeInTheDocument());
 expect(screen.getByLabelText('Synchronization queue')).toHaveTextContent('Private tenant error');
 mockOrganization='organization-b';view.rerender(<FarmOperations/>);
 expect(screen.queryByRole('heading',{name:'Private farm A'})).not.toBeInTheDocument();
 expect(screen.getByLabelText('Synchronization queue')).not.toHaveTextContent('Private tenant error');
 await waitFor(()=>expect(loadFarmSnapshot).toHaveBeenCalledWith('actor-a:organization-b'));
});
test('retry persists and sends only the selected authoritative failed operation',async()=>{
 const target={operation:{operationId:'operation-retry',id:'task-retry',farmId:'farm-a',kind:'task',version:2,state:'COMPLETED',data:{name:'Feed'}},state:'FAILED',error:'FEATURE_DISABLED'};
 const unrelated={operation:{...target.operation,operationId:'operation-unrelated',id:'task-unrelated'},state:'FAILED',error:'FARM_ACCESS_DENIED'};
 const conflict={operation:{...target.operation,operationId:'operation-conflict',id:'task-conflict'},state:'CONFLICT',error:'FARM_VERSION_CONFLICT'};
 (loadFarmSnapshot as jest.Mock).mockResolvedValue({resources:[],operations:[target,unrelated,conflict]});
 const persisted:any[]=[];
 (saveFarmSnapshot as jest.Mock).mockImplementation(async(_key,saved)=>{
  persisted.push(JSON.parse(JSON.stringify(saved)));
  return saved;
 });
 (farmOperationsAPI.command as jest.Mock).mockResolvedValue({id:'task-retry',farm_id:'farm-a',kind:'task',version:3,state:'COMPLETED',data:{name:'Feed'}});
 render(<FarmOperations/>);
 await waitFor(()=>expect(screen.getByText('FEATURE_DISABLED')).toBeInTheDocument());
 await waitFor(()=>expect(saveFarmSnapshot).toHaveBeenCalled());
 expect(farmOperationsAPI.command).not.toHaveBeenCalled();
 persisted.length=0;
 (saveFarmSnapshot as jest.Mock).mockClear();

 const retryRow=screen.getByText('FEATURE_DISABLED').closest('div');
 expect(retryRow).not.toBeNull();
 fireEvent.click(within(retryRow!).getByRole('button',{name:'Retry'}));

 await waitFor(()=>expect(farmOperationsAPI.command).toHaveBeenCalledTimes(1));
 expect(farmOperationsAPI.command).toHaveBeenCalledWith(expect.objectContaining({operationId:'operation-retry'}));
 expect((saveFarmSnapshot as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((farmOperationsAPI.command as jest.Mock).mock.invocationCallOrder[0]);
 expect(persisted[0].operations).toEqual(expect.arrayContaining([
  expect.objectContaining({operation:expect.objectContaining({operationId:'operation-retry'}),state:'PENDING'}),
  expect.objectContaining({operation:expect.objectContaining({operationId:'operation-unrelated'}),state:'FAILED'}),
  expect.objectContaining({operation:expect.objectContaining({operationId:'operation-conflict'}),state:'CONFLICT'}),
 ]));
 await waitFor(()=>expect(persisted.some(saved=>saved.operations.some((queued:any)=>queued.operation.operationId==='operation-retry'&&queued.state==='SYNCED'&&!queued.error))).toBe(true));
 expect(screen.queryByText('FEATURE_DISABLED')).not.toBeInTheDocument();
 expect(screen.getByText('FARM_ACCESS_DENIED')).toBeInTheDocument();
 expect(screen.getByText('FARM_VERSION_CONFLICT')).toBeInTheDocument();
 expect(within(screen.getByText('FARM_VERSION_CONFLICT').closest('div')!).getByRole('button',{name:'Review conflict'})).toBeInTheDocument();
 expect(farmOperationsAPI.command).not.toHaveBeenCalledWith(expect.objectContaining({operationId:'operation-unrelated'}));
 expect(farmOperationsAPI.command).not.toHaveBeenCalledWith(expect.objectContaining({operationId:'operation-conflict'}));
});
