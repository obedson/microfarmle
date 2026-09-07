import { FarmOperation, FarmResource } from './farmOperationsAPI';
export type SyncState='PENDING'|'SYNCING'|'SYNCED'|'FAILED'|'CONFLICT';
export interface QueuedFarmOperation { operation:FarmOperation; state:SyncState; error?:string; }
export interface FarmSnapshot { resources:FarmResource[]; operations:QueuedFarmOperation[]; }
let epoch=0;
const DB='microfams-farm-offline';
const empty=():FarmSnapshot=>({resources:[],operations:[]});
function database():Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('partitions');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(new Error('Offline storage unavailable'));
 });
}
async function record(mode:IDBTransactionMode,key:string,value?:FarmSnapshot):Promise<FarmSnapshot> {
 const requestEpoch=epoch;
 const revision=localStorage.getItem('farm-offline-revision');
 const db=await database();
 try {
  const principal=JSON.parse(localStorage.getItem('auth-storage')??'null')?.state?.user?.id;
  if(requestEpoch!==epoch||revision!==localStorage.getItem('farm-offline-revision')||!principal||!key.startsWith(principal+':')){
   if(value)throw new Error('Offline authentication changed. Sign in again before saving.');
   return empty();
  }
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction('partitions',mode);
   const store=tx.objectStore('partitions');
   const request=store.get(key);
   let result:FarmSnapshot=empty();
   request.onsuccess=()=>{
    const stored:FarmSnapshot=request.result??empty();
    if(value){
     const operations=new Map(stored.operations.map(q=>[q.operation.operationId,q]));
     for(const incoming of value.operations){
      const prior=operations.get(incoming.operation.operationId);
      if(prior?.state!=='SYNCED')operations.set(incoming.operation.operationId,incoming);
     }
     result={...value,operations:Array.from(operations.values())};
     store.put(result,key);
    }else result=stored;
   };
   tx.oncomplete=()=>resolve(result);
   tx.onerror=()=>reject(new Error('Unable to preserve offline changes'));
  });
 } finally{db.close();}
}
export async function clearFarmOffline() {
 epoch+=1;
 localStorage.setItem('farm-offline-revision',String(Date.now())+':'+epoch);
 if(typeof indexedDB==='undefined')return;
 const db=await database();
 try {await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('partitions','readwrite');tx.objectStore('partitions').clear();
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('Unable to clear offline storage'));
 });}finally{db.close();}
}
export const farmPartition=(userId:string,organizationId:string)=>userId+':'+organizationId;
export const loadFarmSnapshot=async(partition:string)=>{
 if(localStorage.getItem('farm-offline-clear-required')){
  await clearFarmOffline();localStorage.removeItem('farm-offline-clear-required');
 }
 return record('readonly',partition);
};
export const saveFarmSnapshot=(partition:string,snapshot:FarmSnapshot)=>record('readwrite',partition,snapshot);
export function retryFarmOperation(snapshot:FarmSnapshot,operationId:string) {
 const queued=snapshot.operations.find(candidate=>candidate.operation.operationId===operationId);
 if(queued?.state!=='FAILED')return false;
 queued.state='PENDING';
 return true;
}
export async function synchronizeFarmOperations(
 snapshot:FarmSnapshot, send:(operation:FarmOperation)=>Promise<FarmResource>,
 persist:(snapshot:FarmSnapshot)=>Promise<unknown>, isCurrent:()=>boolean,
) {
 for(const queued of snapshot.operations) {
  if(!isCurrent()) break;
  if(!['PENDING','SYNCING'].includes(queued.state)) continue;
  queued.state='SYNCING';await persist(snapshot);
  if(!isCurrent()) break;
  try {
   const resource=await send(queued.operation);
   if(!isCurrent()) break;
   queued.state='SYNCED';delete queued.error;
   // Successful media is private on the server; only unsent media remains local.
   if(queued.operation.kind==='evidence')delete queued.operation.data.content;
   snapshot.resources=[resource,...snapshot.resources.filter(r=>r.id!==resource.id)];
  }catch(error:any){
   const status=error.response?.status;
   queued.state=status===409?'CONFLICT':status?'FAILED':'PENDING';
   queued.error=status ? String(error.response?.data?.error??'Request rejected') : 'Offline. Your change is preserved.';
   await persist(snapshot);
   if(!status || status===401 || status===403)break;
  }
  await persist(snapshot);
 }
 return snapshot;
}
