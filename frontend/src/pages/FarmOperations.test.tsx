import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
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
 const resource={id:'farm-a',farm_id:'farm-a',kind:'farm',state:'DRAFT',version:1,data:{name:'Private farm A'}};
 (loadFarmSnapshot as jest.Mock).mockImplementation(async key=>({resources:key==='actor-a:organization-a'?[resource]:[],operations:[]}));
 (farmOperationsAPI.list as jest.Mock).mockImplementation(async()=>({items:mockOrganization==='organization-a'?[resource]:[],hasMore:false}));
 const view=render(<FarmOperations/>);
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Private farm A'})).toBeInTheDocument());
 mockOrganization='organization-b';view.rerender(<FarmOperations/>);
 expect(screen.queryByRole('heading',{name:'Private farm A'})).not.toBeInTheDocument();
 await waitFor(()=>expect(loadFarmSnapshot).toHaveBeenCalledWith('actor-a:organization-b'));
});
