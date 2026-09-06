// Only the static application shell is cached. Authenticated API responses,
// attachments and tenant data are never placed in the shared HTTP cache.
const CACHE='microfams-farm-shell-v1';
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const manifest=await fetch('/asset-manifest.json',{cache:'no-store'});
  if(!manifest.ok)throw new Error('Farm offline shell manifest unavailable');
  const data=await manifest.json();
  const assets=(data.entrypoints||[]).map(p=>'/'+p.replace(/^\//,''));
  if(!assets.length)throw new Error('Farm offline shell assets unavailable');
  await cache.addAll(['/farm-operations',...assets]);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname!=='/farm-operations'&&!url.pathname.startsWith('/static/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request);
   if(response.ok)await cache.put(event.request,response.clone());
   return response;
  }catch{
   const saved=await cache.match(event.request);
   return saved||Response.error();
  }
 })());
});
