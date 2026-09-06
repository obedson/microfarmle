import {InventoryService} from '../domains/inventory/inventoryService.js';
import {supabase} from '../utils/supabase.js';
jest.mock('../utils/supabase.js',()=>({supabase:{rpc:jest.fn()}}));
beforeEach(()=>jest.clearAllMocks());
test('inventory movement delegates once to the shared atomic ledger command',async()=>{
 (supabase.rpc as jest.Mock).mockResolvedValue({data:{id:'item',organization_id:'org',name:'Feed',unit:'g',quantity_minor:90,reorder_level_minor:0},error:null});
 const result=await new InventoryService().move('org','item',{quantityMinor:-10,reason:' farm.input ',idempotencyKey:' operation-id '});
 expect(supabase.rpc).toHaveBeenCalledTimes(1);
 expect(supabase.rpc).toHaveBeenCalledWith('apply_inventory_movement',{p_organization:'org',p_item:'item',p_quantity:-10,p_reason:'farm.input',p_key:'operation-id'});
 expect(result.quantityMinor).toBe(90);
});
test('shared movement errors cannot expose database details',async()=>{
 (supabase.rpc as jest.Mock).mockResolvedValue({data:null,error:{message:'private database diagnostics'}});
 await expect(new InventoryService().move('org','item',{quantityMinor:1,reason:'farm.yield',idempotencyKey:'operation-id'})).rejects.toThrow(/^INVENTORY_MOVEMENT_REJECTED$/);
});
