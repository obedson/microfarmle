export interface OperationField { name:string; label:string; type?:string; required?:boolean; options?:string[]; relation?:string; multiple?:boolean; }
const f=(name:string,label:string,required=false,type='text'):OperationField=>({name,label,required,type});
const choose=(name:string,label:string,options:string[],required=true):OperationField=>({name,label,options,required});
const relation=(name:string,label:string,kind:string,required=false,multiple=false):OperationField=>({name,label,relation:kind,required,multiple});
const notes=f('notes','Notes',false,'textarea');
const links=[relation('unitId','Production unit','unit'),relation('cycleId','Production cycle','cycle'),relation('livestockId','Livestock operation','livestock'),relation('taskId','Task','task'),relation('workerId','Worker','worker')];
const event=[f('occurredOn','Date',true,'date'),...links,notes];
export const initialStates:Record<string,string>={farm:'DRAFT',unit:'AVAILABLE',cycle:'PLANNED',livestock:'ACTIVE',worker:'ACTIVE',task:'PLANNED',input:'RECORDED',yield:'RECORDED',expense:'RECORDED',livestock_event:'RECORDED',evidence:'RECORDED'};
export const stateChoices:Record<string,string[]>={farm:['DRAFT','ACTIVE','INACTIVE','ARCHIVED'],unit:['AVAILABLE','ACTIVE','RESTING','INACTIVE','ARCHIVED'],
 cycle:['PLANNED','ACTIVE','COMPLETED','CANCELLED'],livestock:['ACTIVE'],worker:['ACTIVE','INACTIVE'],task:['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED']};
export const operationFields:Record<string,OperationField[]>={
 farm:[f('name','Farm name',true),f('description','Description',false,'textarea'),f('operationType','Operation type',true),f('address','Address'),f('location','Location'),
 f('latitude','Latitude',false,'number'),f('longitude','Longitude',false,'number'),f('area','Area'),f('areaUnit','Area unit'),f('tenure','Tenure / ownership',true),
 f('managerId','Responsible manager user ID'),f('contacts','Authorized contacts'),notes],
 unit:[f('name','Unit name',true),f('identifier','Unit identifier',true),f('quantity','Size / capacity',true),f('unit','Measurement unit',true),
 f('productionType','Production type',true),f('location','Location'),f('latitude','Latitude',false,'number'),f('longitude','Longitude',false,'number'),f('soilNotes','Land / soil notes'),notes],
 cycle:[f('name','Cycle name',true),relation('unitId','Production unit','unit',true),f('product','Crop / product',true),f('variety','Variety'),
 f('plannedStart','Planned start',true,'date'),f('actualStart','Actual start',false,'date'),f('expectedCompletion','Expected completion',true,'date'),
 f('actualCompletion','Actual completion',false,'date'),f('plannedQuantity','Planned quantity / area',true),f('unit','Measurement unit',true),
 relation('workerIds','Responsible workers','worker',false,true),notes],
 livestock:[f('name','Livestock name',true),relation('unitId','Livestock unit','unit',true),choose('model','Model',['batch','individual']),f('species','Species',true),
 f('breed','Breed'),f('identifier','Animal / batch identifier',true),f('acquiredOn','Acquisition / birth / hatch date',true,'date'),
 choose('sex','Sex',['female','male','mixed','unknown'],false),f('source','Source'),f('purpose','Purpose'),notes],
 worker:[f('name','Worker name',true),f('linkedUserId','Member user ID (optional)'),f('contact','Authorized contact'),
 choose('accessRole','Farm access',['manager','worker','viewer']),f('operationalRole','Operational role',true),f('startOn','Start date',true,'date'),f('endOn','End date',false,'date'),notes],
 task:[f('name','Task title',true),f('description','Description',false,'textarea'),f('type','Activity type',true),...links.filter(v=>v.name!=='taskId'),
 relation('workerIds','Assigned workers','worker',true,true),choose('priority','Priority',['low','normal','high','urgent']),
 f('scheduledOn','Scheduled date',true,'date'),f('startedOn','Start date',false,'date'),f('dueOn','Due date',true,'date'),f('completedOn','Completion date',false,'date'),
 choose('recurrence','Recurrence',['none','daily','weekly','monthly']),notes],
 input:[...event,f('item','Input item',true),choose('category','Category',['seed','feed','fertilizer','chemical','medication','fuel','consumable','other']),
 f('quantity','Quantity',true),f('unit','Measurement unit',true),f('inventoryItemId','Inventory item ID (if stock tracked)'),f('costMinor','Cost in minor currency units',false,'number'),choose('currency','Currency',['NGN','USD','EUR','GBP'],false),f('reversesId','Original input ID to reverse')],
 yield:[...event,f('product','Product',true),f('quantity','Production quantity',true),f('unit','Measurement unit',true),f('grade','Quality / grade'),
 f('inventoryItemId','Inventory item ID (if stock tracked)'),f('reversesId','Original yield ID to reverse')],
 expense:[...event,f('category','Expense category',true),f('description','Description',true),f('amountMinor','Amount in minor currency units',true,'number'),
 choose('currency','Currency',['NGN','USD','EUR','GBP']),f('payee','Payee / vendor'),f('paymentReference','Payment reference'),
 f('debitAccountId','Expense account ID (for journal posting)'),f('creditAccountId','Offset account ID (for journal posting)'),f('reversesId','Original expense ID to reverse')],
 livestock_event:[...event.filter(v=>v.name!=='livestockId'),relation('livestockId','Livestock operation','livestock',true),
 choose('eventType','Event type',['acquisition','birth','hatching','feeding','treatment','vaccination','mortality','sale','transfer_out','transfer_in','production','movement','closure']),
 f('quantity','Quantity (zero for non-quantity events)',true),relation('destinationUnitId','Destination unit for movement','unit'),
 f('description','Event description'),f('legacyRecordId','Related historical farm record ID'),f('reversesId','Original event ID to reverse')],
 evidence:[relation('parentId','Attach to record','any',true),f('caption','Caption'),notes],
};
