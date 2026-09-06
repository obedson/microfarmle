import {validateFarmCommand,validateFarmData,validateTransition} from '../domains/farm/farmRules.js';
const id='60000000-0000-4000-8000-000000000010';
describe('approved farm command validation',()=>{
 test.each(['2026-02-30','2026-13-01','2026-00-01','2026-01-00','yesterday'])('rejects impossible date %s',occurredOn=>{
  expect(()=>validateFarmData('yield',{product:'Maize',quantity:'1',unit:'kg',occurredOn})).toThrow('FARM_VALIDATION_FAILED');
 });
 test.each(['0','-1','1e5','NaN','0.0001'])('rejects invalid consumption %s',quantity=>{
  expect(()=>validateFarmData('input',{item:'Feed',category:'feed',quantity,unit:'g',occurredOn:'2026-09-01'})).toThrow();
 });
 test('rejects caller supplied tenant, quantity projection and arbitrary metadata',()=>{
  expect(()=>validateFarmCommand({id,farmId:id,kind:'farm',version:0,state:'DRAFT',organizationId:id,data:{name:'Farm',operationType:'mixed',tenure:'owned'}})).toThrow();
  expect(()=>validateFarmData('livestock',{name:'Goats',unitId:id,model:'batch',species:'goat',identifier:'G1',acquiredOn:'2026-09-01',currentQuantity:100})).toThrow();
 });
 test('allows fixed precision production without binary rounding',()=>{
  expect(validateFarmData('yield',{product:'Maize',quantity:'0.125',unit:'kg',occurredOn:'2026-09-01'}).quantity).toBe('0.125');
 });
 test('requires existing stock integer units for inventory integration',()=>{
  expect(()=>validateFarmData('yield',{product:'Maize',quantity:'0.125',unit:'kg',inventoryItemId:id,occurredOn:'2026-09-01'})).toThrow('INVENTORY_QUANTITY_MUST_USE_EXISTING_INTEGER_UNIT');
 });
 test('prevents overwriting immutable financial events',()=>{
  expect(()=>validateFarmCommand({id,farmId:id,kind:'expense',version:1,state:'RECORDED',data:{category:'fuel',description:'Diesel',amountMinor:500,currency:'NGN',occurredOn:'2026-09-01'}})).toThrow('FARM_EVENT_IMMUTABLE');
 });
 test.each([0,-1,0.5,Number.MAX_SAFE_INTEGER+1])('rejects invalid expense minor amount %s',amountMinor=>{
  expect(()=>validateFarmData('expense',{category:'fuel',description:'Diesel',amountMinor,currency:'NGN',occurredOn:'2026-09-01'})).toThrow();
 });
 test('requires paired accounting accounts',()=>{
  expect(()=>validateFarmData('expense',{category:'fuel',description:'Diesel',amountMinor:500,currency:'NGN',occurredOn:'2026-09-01',debitAccountId:id})).toThrow();
 });
 test('rejects evidence content that lies about MIME type',()=>{
  expect(()=>validateFarmData('evidence',{parentId:id,filename:'receipt.pdf',mediaType:'application/pdf',content:Buffer.from('<script>unsafe</script>').toString('base64')})).toThrow('FARM_EVIDENCE_INVALID');
 });
 test('rejects path traversal filenames',()=>{
  expect(()=>validateFarmData('evidence',{parentId:id,filename:'../receipt.pdf',mediaType:'application/pdf',content:Buffer.from('%PDF-1.4 fixture').toString('base64')})).toThrow();
 });
 test('rejects blind terminal-state edits and cross-kind transitions',()=>{
  expect(()=>validateTransition('farm','ARCHIVED','ACTIVE')).toThrow();
  expect(()=>validateTransition('cycle','PLANNED','IN_PROGRESS')).toThrow();
  expect(()=>validateTransition('task','IN_PROGRESS','COMPLETED')).not.toThrow();
 });
});
test('animal count events reject fractional animals',()=>{
 expect(()=>validateFarmData('livestock_event',{livestockId:id,eventType:'acquisition',quantity:'1.5',occurredOn:'2026-09-01'})).toThrow('LIVESTOCK_EVENT_QUANTITY_INVALID');
});
