import { apiClient } from '../api/client';
export interface FarmResource {
 id:string; farm_id:string; kind:string; state:string; version:number; data:Record<string,any>;
 starting_quantity?:string; accounting_status?:string; reversed_by?:string; completed_at?:string; quantity:string; journal_entry_id?:string; created_by:string; created_at:string;
}
export interface FarmOperation { operationId:string; id:string; farmId:string; kind:string; version:number; state:string; data:Record<string,unknown>; }
export const farmOperationsAPI = {
 async list(query:Record<string,unknown>) {return (await apiClient.get('/farm-operations',{params:query})).data.data as {items:FarmResource[];hasMore:boolean};},
 async command(op:FarmOperation) {
  const {operationId,...command}=op;
  return (await apiClient.post('/farm-operations/commands',command,{headers:{'Idempotency-Key':operationId}})).data.data as FarmResource;
 },
 async evidence(id:string) {return (await apiClient.get('/farm-operations',{params:{id,view:'evidence'}})).data.data as {content:string;metadata:FarmResource};}
};
