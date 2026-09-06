import Joi from 'joi';

export const farmKinds = ['farm', 'unit', 'cycle', 'livestock', 'worker', 'task', 'input', 'yield', 'expense', 'livestock_event', 'evidence'] as const;
export type FarmKind = typeof farmKinds[number];
export const eventKinds: readonly FarmKind[] = ['input', 'yield', 'expense', 'livestock_event', 'evidence'];
export class FarmError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const text = (max = 1000) => Joi.string().trim().max(max);
const id = () => Joi.string().uuid();
const date = () => Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((v, h) => {
  const d = new Date(v + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? h.error('any.invalid') : v;
});
const quantity = () => Joi.string().pattern(/^(0|[1-9]\d{0,11})(\.\d{1,3})?$/);
const positive = () => quantity().custom((v, h) => Number(v) > 0 ? v : h.error('any.invalid'));
const money = () => Joi.number().integer().min(1).max(Number.MAX_SAFE_INTEGER);
const relation = { unitId: id(), cycleId: id(), livestockId: id(), taskId: id(), workerId: id() };
const common = { notes: text(4000) };
const location = { location: text(), latitude: Joi.number().min(-90).max(90), longitude: Joi.number().min(-180).max(180) };
const dated = { occurredOn: date().required(), ...relation, ...common };
const schemas: Record<FarmKind, Joi.ObjectSchema> = {
  farm: Joi.object({ name: text(160).required(), description: text(4000), operationType: text(80).required(), ...location,
    address: text(), area: quantity(), areaUnit: text(30), tenure: text(80).required(), managerId: id(), contacts: text(), ...common }),
  unit: Joi.object({ name: text(160).required(), identifier: text(80).required(), quantity: positive().required(), unit: text(30).required(),
    productionType: text(80).required(), soilNotes: text(), ...location, ...common }),
  cycle: Joi.object({ name: text(160).required(), unitId: id().required(), product: text(160).required(), variety: text(160),
    plannedStart: date().required(), actualStart: date(), expectedCompletion: date().required(), actualCompletion: date(),
    plannedQuantity: positive().required(), unit: text(30).required(), workerIds: Joi.array().items(id()).unique().max(100).default([]), ...common }),
  livestock: Joi.object({ name: text(160).required(), unitId: id().required(), model: Joi.string().valid('batch', 'individual').required(),
    species: text(80).required(), breed: text(80), identifier: text(80).required(), acquiredOn: date().required(),
    sex: Joi.string().valid('female', 'male', 'mixed', 'unknown'), source: text(200), purpose: text(200), ...common }),
  worker: Joi.object({ name: text(160).required(), linkedUserId: id(), contact: text(200),
    accessRole: Joi.string().valid('manager', 'worker', 'viewer').required(), operationalRole: text(100).required(),
    startOn: date().required(), endOn: date(), ...common }),
  task: Joi.object({ name: text(160).required(), description: text(4000), type: text(80).required(), ...relation,
    workerIds: Joi.array().items(id()).unique().min(1).max(100).required(), priority: Joi.string().valid('low', 'normal', 'high', 'urgent').required(),
    scheduledOn: date().required(), startedOn: date(), dueOn: date().required(), completedOn: date(),
    recurrence: Joi.string().valid('none', 'daily', 'weekly', 'monthly').default('none'), ...common }),
  input: Joi.object({ ...dated, item: text(160).required(), category: Joi.string().valid('seed', 'feed', 'fertilizer', 'chemical', 'medication', 'fuel', 'consumable', 'other').required(),
    quantity: positive().required(), unit: text(30).required(), inventoryItemId: id(), costMinor: Joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER),
    currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP'), reversesId: id() }),
  yield: Joi.object({ ...dated, product: text(160).required(), quantity: positive().required(), unit: text(30).required(),
    grade: text(80), inventoryItemId: id(), reversesId: id() }),
  expense: Joi.object({ ...dated, category: text(80).required(), description: text(500).min(2).required(), amountMinor: money().required(),
    currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP').required(), payee: text(200), paymentReference: text(200),
    debitAccountId: id(), creditAccountId: id(), reversesId: id() }).and('debitAccountId', 'creditAccountId'),
  livestock_event: Joi.object({ ...dated, livestockId: id().required(), eventType: Joi.string().valid('acquisition', 'birth', 'hatching', 'feeding', 'treatment', 'vaccination', 'mortality', 'sale', 'transfer_out', 'transfer_in', 'production', 'movement', 'closure').required(),
    quantity: quantity().required(), destinationUnitId: id(), description: text(), legacyRecordId: id(), reversesId: id() }),
  evidence: Joi.object({ parentId: id().required(), filename: text(180).pattern(/^[^/\\]+$/).required(),
    mediaType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp', 'application/pdf').required(),
    caption: text(1000), content: Joi.string().base64().max(7000000).required(), ...common }),
};
export const initialStates: Record<FarmKind, string> = { farm:'DRAFT', unit:'AVAILABLE', cycle:'PLANNED', livestock:'ACTIVE', worker:'ACTIVE', task:'PLANNED', input:'RECORDED', yield:'RECORDED', expense:'RECORDED', livestock_event:'RECORDED', evidence:'RECORDED' };
const transitions: Partial<Record<FarmKind, Record<string, string[]>>> = {
  farm: { DRAFT:['ACTIVE','ARCHIVED'], ACTIVE:['INACTIVE'], INACTIVE:['ACTIVE','ARCHIVED'], ARCHIVED:[] },
  unit: { AVAILABLE:['ACTIVE','INACTIVE','ARCHIVED'], ACTIVE:['RESTING','INACTIVE'], RESTING:['ACTIVE','INACTIVE','ARCHIVED'], INACTIVE:['AVAILABLE','ARCHIVED'], ARCHIVED:[] },
  cycle: { PLANNED:['ACTIVE','CANCELLED'], ACTIVE:['COMPLETED','CANCELLED'], COMPLETED:[], CANCELLED:[] },
  livestock: { ACTIVE:[], CLOSED:[] }, worker: { ACTIVE:['INACTIVE'], INACTIVE:['ACTIVE'] },
  task: { PLANNED:['IN_PROGRESS','CANCELLED'], IN_PROGRESS:['COMPLETED','CANCELLED'], COMPLETED:[], CANCELLED:[] },
};
export function validateTransition(kind: FarmKind, from: string, to: string) {
  if (from !== to && !transitions[kind]?.[from]?.includes(to)) throw new FarmError('FARM_STATE_CONFLICT', 409);
}
export function validateFarmData(kind: FarmKind, data: unknown): Record<string, unknown> {
  const {value,error} = schemas[kind].validate(data, {convert:false, abortEarly:false, allowUnknown:false});
  if(error) throw new FarmError('FARM_VALIDATION_FAILED');
  const d = value as Record<string, any>;
  for(const [start,end] of [['plannedStart','expectedCompletion'],['actualStart','actualCompletion'],['startOn','endOn'],['scheduledOn','dueOn'],['startedOn','completedOn']]) {
    if(d[start] && d[end] && d[start] > d[end]) throw new FarmError('FARM_DATE_RANGE_INVALID');
  }
  if (kind === 'livestock_event') {
    const changes = ['acquisition','birth','hatching','mortality','sale','transfer_out','transfer_in'];
    if(!Number.isInteger(Number(d.quantity))) throw new FarmError('LIVESTOCK_EVENT_QUANTITY_INVALID');
    if(changes.includes(d.eventType) !== (Number(d.quantity) > 0)) throw new FarmError('LIVESTOCK_EVENT_QUANTITY_INVALID');
    if((d.eventType === 'movement') !== Boolean(d.destinationUnitId)) throw new FarmError('LIVESTOCK_DESTINATION_INVALID');
  }
  if (d.inventoryItemId && !/^\d+$/.test(d.quantity)) throw new FarmError('INVENTORY_QUANTITY_MUST_USE_EXISTING_INTEGER_UNIT');
  if (kind === 'evidence') {
    const buffer = Buffer.from(d.content, 'base64');
    const signatures: Record<string, boolean> = {
      'image/png': buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
      'image/jpeg': buffer[0]===255 && buffer[1]===216 && buffer[2]===255,
      'image/webp': buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP',
      'application/pdf': buffer.toString('ascii',0,5)==='%PDF-',
    };
    if(buffer.length > 5*1024*1024 || !signatures[d.mediaType]) throw new FarmError('FARM_EVIDENCE_INVALID');
  }
  return value;
}
export interface FarmCommand {
  id: string;
  farmId: string;
  kind: FarmKind;
  version: number;
  state: string;
  data: Record<string, unknown>;
}
const commandSchema = Joi.object({id:id().required(),farmId:id().required(),kind:Joi.string().valid(...farmKinds).required(),
  version:Joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER).required(),state:Joi.string().pattern(/^[A-Z_]{3,20}$/).required(),data:Joi.object().required()});
export function validateFarmCommand(raw: unknown): FarmCommand {
  const {value,error}=commandSchema.validate(raw,{convert:false,allowUnknown:false});
  if(error) throw new FarmError('FARM_COMMAND_INVALID');
  const result=value as FarmCommand;
  result.data=validateFarmData(result.kind,result.data);
  if(result.version===0 && result.state!==initialStates[result.kind]) throw new FarmError('FARM_INITIAL_STATE_INVALID');
  if(eventKinds.includes(result.kind) && result.version!==0) throw new FarmError('FARM_EVENT_IMMUTABLE',409);
  if(result.kind==='farm' && result.id!==result.farmId) throw new FarmError('FARM_ID_INVALID');
  return result;
}
