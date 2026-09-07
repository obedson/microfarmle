import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { FarmOperation, FarmResource, farmOperationsAPI } from '../services/farmOperationsAPI';
import { FarmSnapshot, farmPartition, loadFarmSnapshot, retryFarmOperation, saveFarmSnapshot, synchronizeFarmOperations } from '../services/farmOffline';
import { initialStates, operationFields, stateChoices } from './farmOperationFields';

const label=(value:string)=>value.replace(/_/g,' ');
const blank:FarmSnapshot={resources:[],operations:[]};
export default function FarmOperations() {
 useEffect(()=>{
  if('serviceWorker' in navigator && process.env.NODE_ENV==='production') {
   navigator.serviceWorker.register('/farm-offline-sw.js').catch(()=>setError('Offline application installation failed. Keep this page open while offline.'));
  }
 },[]);
 const userId=useAuthStore(s=>s.user?.id);
 const organizationId=useOrganizationStore(s=>s.activeOrganizationId);
 const partition=userId&&organizationId?farmPartition(userId,organizationId):'';
 const current=useRef(partition);current.current=partition;
 const working=useRef(false);
 const retryTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const retryDelay=useRef(2000);
 const snapshotRef=useRef<FarmSnapshot>(blank);
 const loadedPartition=useRef('');
 const [snapshotScope,setSnapshotScope]=useState('');
 const [snapshot,setSnapshot]=useState<FarmSnapshot>(blank);
 const [farmId,setFarmId]=useState('');
 const [kind,setKind]=useState('farm');
 const [editing,setEditing]=useState<FarmResource|null>(null);
 const [data,setData]=useState<Record<string,any>>({});
 const [state,setState]=useState('DRAFT');
 const [search,setSearch]=useState('');
 const [view,setView]=useState('');
 const [error,setError]=useState('');
 const [online,setOnline]=useState(navigator.onLine);
 const [busy,setBusy]=useState(false);
 const [storageReady,setStorageReady]=useState(false);
 const [history,setHistory]=useState<any[]>([]);
 const [historyMore,setHistoryMore]=useState(false);
 const [historyScope,setHistoryScope]=useState('');
 const selectedFarm=useRef(farmId);selectedFarm.current=farmId;
 const persist=async(next:FarmSnapshot,key=partition)=>{
  if(!key||current.current!==key)return;
  const saved=await saveFarmSnapshot(key,next);
  if(current.current!==key)return;
  snapshotRef.current=saved;setSnapshotScope(key);setSnapshot({...saved,operations:saved.operations.map(o=>({...o}))});
 };
 async function refresh(key=partition) {
  if(!key)return;
  const resources:FarmResource[]=[];
  for(let offset=0;offset<=100000;offset+=100) {
   const page=await farmOperationsAPI.list({limit:100,offset});
   if(current.current!==key)return;
   resources.push(...page.items);
   if(!page.hasMore)break;
  }
  await persist({...snapshotRef.current,resources},key);
 }
 async function sync(key=partition) {
  if(working.current||!key||loadedPartition.current!==key||!navigator.onLine)return;
  working.current=true;setBusy(true);
  try{
   await synchronizeFarmOperations(snapshotRef.current,farmOperationsAPI.command,s=>persist(s,key),()=>current.current===key);
   if(current.current===key)await refresh(key);
  }catch{if(current.current===key)setError('Unable to synchronize. Saved changes remain in the queue.');}
  finally{
   working.current=false;setBusy(false);
   if(retryTimer.current)clearTimeout(retryTimer.current);
   if(current.current===key&&navigator.onLine&&snapshotRef.current.operations.some(q=>q.state==='PENDING')){
    retryTimer.current=setTimeout(()=>void sync(key),retryDelay.current);
    retryDelay.current=Math.min(retryDelay.current*2,30000);
   }else retryDelay.current=2000;
   if(current.current&&current.current!==key&&loadedPartition.current===current.current)void sync(current.current);
  }
 }
 useEffect(()=>{
  let cancelled=false;current.current=partition;
  setStorageReady(false);setSnapshot(blank);snapshotRef.current=blank;setFarmId('');setEditing(null);setData({});
  if(partition)loadFarmSnapshot(partition).then(saved=>{
   if(cancelled)return;
   snapshotRef.current=saved;loadedPartition.current=partition;setSnapshotScope(partition);setSnapshot(saved);setStorageReady(true);
   return sync(partition);
  }).catch(()=>setError('Offline storage is unavailable. Changes cannot be queued safely.'));
  return()=>{cancelled=true;current.current='';loadedPartition.current='';if(retryTimer.current)clearTimeout(retryTimer.current);};
  // A partition change must never reuse another organization's in-memory records.
 },[partition]);
 useEffect(()=>{
  const reconnect=()=>{retryDelay.current=2000;setOnline(true);void sync(current.current);};
  const disconnect=()=>setOnline(false);
  window.addEventListener('online',reconnect);window.addEventListener('offline',disconnect);
  return()=>{window.removeEventListener('online',reconnect);window.removeEventListener('offline',disconnect);};
 },[]);
 const selectKind=(next:string)=>{
  setKind(next);setView('');setEditing(null);setData({});setState(initialStates[next]);setError('');
 };
 const visibleSnapshot=snapshotScope===partition?snapshot:blank;
 const resources=visibleSnapshot.resources;
 const scoped=resources.filter(r=>!farmId||r.farm_id===farmId);
 const today=new Date().toISOString().slice(0,10);
 const shown=scoped.filter(r=>r.kind===kind && JSON.stringify(r.data).toLowerCase().includes(search.toLowerCase()))
 .filter(r=>!view||view==='completed'&&r.state==='COMPLETED'||view==='overdue'&&['PLANNED','IN_PROGRESS'].includes(r.state)&&r.data.dueOn<today||view==='upcoming'&&['PLANNED','IN_PROGRESS'].includes(r.state)&&r.data.dueOn>=today);
 async function submit(e:React.FormEvent) {
  e.preventDefault();setError('');
  if(!partition){setError('Select an organization first.');return;}
  if(kind!=='farm'&&!farmId){setError('Select a farm first.');return;}
  if(!online&&['farm','unit','cycle','worker','livestock'].includes(kind)){setError('Administrative changes require connectivity.');return;}
  const id=editing?.id??crypto.randomUUID();
  const clean=Object.fromEntries(Object.entries(data).filter(([,v])=>v!==''&&v!==undefined));
  if(kind==='farm'&&!editing)clean.managerId??=userId;
  if(kind==='task')clean.recurrence??='none';
  if(kind==='cycle')clean.workerIds??=[];
  const operation:FarmOperation={operationId:crypto.randomUUID(),id,farmId:kind==='farm'?id:farmId,kind,version:editing?.version??0,state,data:clean};
  try{
   await persist({...snapshotRef.current,operations:[...snapshotRef.current.operations,{operation,state:'PENDING'}]});
   setData({});setEditing(null);setState(initialStates[kind]);
   await sync();
  }catch{setError('Unable to save this change locally. Keep this form open and retry.');}
 }
 async function upload(file?:File) {
  if(!file)return;
  if(file.size>5*1024*1024){setError('Choose a file no larger than 5 MB.');return;}
  const scope=partition;
  const reader=new FileReader();
  reader.onload=()=>{if(current.current===scope)setData(previous=>({...previous,filename:file.name,mediaType:file.type,content:String(reader.result).split(',')[1]}));};
  reader.onerror=()=>setError('The file could not be read.');
  reader.readAsDataURL(file);
 }
 async function download(id:string) {
  const scope=partition;
  try{
   const result=await farmOperationsAPI.evidence(id);
   if(current.current!==scope)return;
   const bytes=Uint8Array.from(atob(result.content.replace(/\s/g,'')),c=>c.charCodeAt(0));
   const url=URL.createObjectURL(new Blob([bytes],{type:result.metadata.data.mediaType}));
   const link=document.createElement('a');link.href=url;link.download=result.metadata.data.filename;link.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{setError('Evidence is unavailable or you no longer have access.');}
 }
 async function readHistory(older=false) {
  const scope=partition,selected=farmId;
  try{const page=await farmOperationsAPI.list({farmId,view:'history',limit:100,offset:older?history.length:0});
   if(current.current!==scope||selectedFarm.current!==selected)return;
   setHistoryScope(scope+':'+selected);setHistory(previous=>older?[...previous,...page.items]:page.items);setHistoryMore(page.hasMore);}
  catch{setError('Unable to load operational history.');}
 }
 return <main className="max-w-6xl mx-auto p-4 space-y-5">
  <h1 className="text-2xl font-bold">Farm Operations</h1>
  <p role="status">{online?'Online':'Offline'} · {visibleSnapshot.operations.filter(o=>o.state!=='SYNCED').length} changes awaiting synchronization</p>
  {!partition&&<p role="alert">Select your active organization using the organization switcher.</p>}
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  <div className="flex flex-wrap gap-3">
   <label>Farm<select aria-label="Farm" className="block max-w-full border p-2" value={farmId} onChange={e=>{setFarmId(e.target.value);setEditing(null);setData({});}}>
    <option value="">Select farm</option>{resources.filter(r=>r.kind==='farm').map(r=><option key={r.id} value={r.id}>{r.data.name}</option>)}
   </select></label>
   <label>Record type<select aria-label="Record type" className="block border p-2" value={kind} onChange={e=>selectKind(e.target.value)}>
    {Object.keys(operationFields).map(k=><option key={k} value={k}>{label(k)}</option>)}
   </select></label>
   <button type="button" disabled={busy||!online} onClick={()=>void sync()} className="border p-2">Synchronize now</button>
   <button type="button" disabled={!farmId||!online} onClick={()=>void readHistory()} className="border p-2">View operational history</button>
  </div>
  <form onSubmit={submit} className="border rounded p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
   <h2 className="sm:col-span-2 font-semibold">{editing?'Update':'Record'} {label(kind)}</h2>
   {operationFields[kind].map(field=><label key={field.name} className="min-w-0">{field.label}{field.required?' *':''}
    {field.options||field.relation?<select aria-label={field.label} className="block w-full border p-2" required={field.required} multiple={field.multiple}
     value={data[field.name]??(field.multiple?[]:'')} onChange={e=>setData({...data,[field.name]:field.multiple?Array.from(e.target.selectedOptions,o=>o.value):e.target.value})}>
     {!field.multiple&&<option value="">Select</option>}
     {field.options?.map(o=><option key={o} value={o}>{label(o)}</option>)}
     {field.relation&&scoped.filter(r=>field.relation==='any'?r.kind!=='evidence':r.kind===field.relation).map(r=><option key={r.id} value={r.id}>{r.data.name??r.data.item??r.data.product??r.data.description??r.kind+' '+r.created_at}</option>)}
    </select>:field.type==='textarea'?<textarea aria-label={field.label} className="block w-full border p-2" required={field.required} value={data[field.name]??''} onChange={e=>setData({...data,[field.name]:e.target.value})}/>:
    <input aria-label={field.label} className="block w-full border p-2" type={field.type??'text'} step="any" required={field.required} value={data[field.name]??''}
     onChange={e=>setData({...data,[field.name]:field.type==='number'&&e.target.value!==''?Number(e.target.value):e.target.value})}/>}
   </label>)}
   {kind==='evidence'&&<label>Evidence file *<input className="block w-full" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>void upload(e.target.files?.[0])}/></label>}
   {editing&&stateChoices[kind]&&<label>Status<select aria-label="Status" className="block w-full border p-2" value={state} onChange={e=>setState(e.target.value)}>
    {stateChoices[kind].map(s=><option key={s}>{s}</option>)}</select></label>}
   <button className="border bg-green-800 text-white rounded p-3 sm:col-span-2" disabled={!partition||snapshotScope!==partition||!storageReady||busy} type="submit">{online?'Save operation':'Save offline'}</button>
   <p className="text-sm sm:col-span-2">Posted expenses use the existing accounting journal. Use compensating events to correct transactions; historical records are retained.</p>
  </form>
  <section aria-label="Synchronization queue" className="space-y-2">
   <h2 className="font-semibold">Synchronization queue</h2>
   <p className="text-sm">If authentication has expired, <a className="underline" href="/login">sign in again</a> to retry. Explicit logout clears this device’s protected farm cache and unsynchronized changes.</p>
   {visibleSnapshot.operations.slice().reverse().map(q=><div className="border rounded p-3 break-words" key={q.operation.operationId}>
    <strong>{label(q.operation.kind)}: {q.state}</strong><p>{q.error}</p>
    {['FAILED','CONFLICT'].includes(q.state)&&<button className="border p-2" onClick={async()=>{
     if(q.state==='CONFLICT'){setEditing(resources.find(r=>r.id===q.operation.id)??null);setKind(q.operation.kind);setFarmId(q.operation.farmId);setData(q.operation.data);setState(q.operation.state);setError('Review the latest record and submit an explicit correction. The original conflicting operation is retained.');return;}
     if(!retryFarmOperation(snapshotRef.current,q.operation.operationId))return;
     await persist({...snapshotRef.current});void sync();
    }}>{q.state==='CONFLICT'?'Review conflict':'Retry'}</button>}
   </div>)}
  </section>
  <section className="space-y-3">
   <h2 className="font-semibold">Operational records</h2>
   <label>Search records<input className="block w-full border p-2" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {kind==='task'&&<label>Calendar view<select aria-label="Calendar view" className="block border p-2" value={view} onChange={e=>setView(e.target.value)}><option value="">All tasks</option><option value="upcoming">Upcoming</option><option value="overdue">Overdue</option><option value="completed">Completed</option></select></label>}
   {shown.map(r=><article key={r.id} className="border rounded p-3 break-words">
    <h3 className="font-semibold">{r.data.name??r.data.item??r.data.product??r.data.description??r.data.filename??label(r.kind)}</h3>
    <p>{r.state} · version {r.version}{r.kind==='livestock'?' · Starting quantity '+r.starting_quantity+' · Current quantity '+r.quantity:''}</p>
    {r.accounting_status&&<p>Accounting: {r.accounting_status}</p>}{r.reversed_by&&<p>Corrected by a retained reversal event.</p>}
    <dl>{Object.entries(r.data).filter(([k])=>!['content','storageReference'].includes(k)).map(([k,v])=><div className="flex flex-wrap gap-2" key={k}><dt>{label(k)}:</dt><dd>{Array.isArray(v)?v.join(', '):String(v)}</dd></div>)}</dl>
    {stateChoices[r.kind]&&<button className="border p-2" onClick={()=>{setEditing(r);setFarmId(r.farm_id);setData(r.data);setState(r.state);}}>Edit record</button>}
    {['input','yield','expense','livestock_event'].includes(r.kind)&&!r.data.reversesId&&!r.reversed_by&&<button className="border p-2" onClick={()=>{setEditing(null);setFarmId(r.farm_id);setKind(r.kind);setState('RECORDED');setData({...r.data,reversesId:r.id,occurredOn:today});setError('Review this compensating event. Original values are retained; the server validates whether reversal is safe.');}}>Prepare reversal</button>}
    {r.kind==='evidence'&&<button className="border p-2" onClick={()=>void download(r.id)}>Download evidence</button>}
   </article>)}
   {shown.length===0&&<p>No matching records.</p>}
  </section>
  {historyScope===partition+':'+farmId&&history.length>0&&<section><h2>Operational history</h2>{history.map(h=><p key={h.id} className="break-words" >{h.occurred_at} · {h.action} · actor {h.actor_id}</p>)}{historyMore&&<button disabled={!online} className="border p-2" onClick={()=>void readHistory(true)}>Load older history</button>}</section>}
 </main>;
}
