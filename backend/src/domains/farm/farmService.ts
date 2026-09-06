import { supabase } from '../../utils/supabase.js';
import { FarmCommand, FarmError, validateFarmCommand } from './farmRules.js';
export interface FarmActor { organizationId: string; actorId: string; }
export interface FarmGateway {
  command(actor: FarmActor, operationId:string, command:FarmCommand): Promise<unknown>;
  read(actor: FarmActor, query:Record<string,unknown>): Promise<any>;
}
const codes: Record<string,number> = { FARM_ACCESS_DENIED:403, FARM_NOT_FOUND:404, FARM_EVENT_REQUIRED:409, FARM_STATE_CONFLICT:409,
  FARM_VERSION_CONFLICT:409, FARM_IDEMPOTENCY_CONFLICT:409, FARM_RELATION_INVALID:400, FARM_VALIDATION_FAILED:400,
  FARM_ARCHIVED:409, FARM_EVENT_IMMUTABLE:409, FARM_QUANTITY_INVALID:409, FARM_FINANCE_PERMISSION_REQUIRED:403,
  FARM_INVENTORY_INVALID:409, FARM_REVERSAL_INVALID:409, FARM_ASSIGNMENT_INVALID:400 };
export class SupabaseFarmGateway implements FarmGateway {
  private async rpc(name:string, args:Record<string,unknown>) {
    const {data,error}=await supabase.rpc(name,args);
    if(error) {
      const code=Object.keys(codes).find(c=>error.message===c);
      throw new FarmError(code ?? 'FARM_SERVICE_UNAVAILABLE',code ? codes[code] : 503);
    }
    return data;
  }
  command(actor:FarmActor,operationId:string,command:FarmCommand) {
    return this.rpc('execute_farm_command',{p_organization:actor.organizationId,p_actor:actor.actorId,p_operation:operationId,p_command:command});
  }
  read(actor:FarmActor,query:Record<string,unknown>) {
    return this.rpc('read_farm_operations',{p_organization:actor.organizationId,p_actor:actor.actorId,p_query:query});
  }
}
export class FarmService {
  constructor(private readonly gateway:FarmGateway=new SupabaseFarmGateway()) {}
  async command(actor:FarmActor,operationId:string,raw:unknown) {
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)) throw new FarmError('FARM_OPERATION_ID_REQUIRED');
    return this.gateway.command(actor,operationId,validateFarmCommand(raw));
  }
  read(actor:FarmActor,query:Record<string,unknown>) { return this.gateway.read(actor,query); }
}
export const farmService=new FarmService();
