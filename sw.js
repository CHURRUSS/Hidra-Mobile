/* HIDRA Mobile - cache Biblioteca + historico de chat. */
const CACHE='hidra-mobile-v19-sync';
const FILES=['./','./index.html','./app.js?v=11','./hidra-intelligence.js?v=12','./news.js?v=13','./style.css?v=11','./manifest.webmanifest','./icon.svg','./neural-core.js?v=11','./gps.js?v=11','./lembretes.js?v=4','./vision.js?v=1','./hidra-library-mobile.js?v=2','./hidra-chat-history-mobile.js?v=1','./hidra-code-blocks.js?v=1','./hidra-shared-history.js?v=1'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(p=>c.add(p).catch(err=>console.warn('HIDRA cache:',p,err))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hidra-mobile-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('/mobile/api/'))return;
 if(new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{if(res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return res}).catch(()=>caches.match(e.request).then(res=>res||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))
});

/* Notificações de lembretes HIDRA, inclusive com a PWA fechada. */
self.addEventListener('push', event => {
 let payload={};try{payload=event.data?event.data.json():{}}catch(e){}
 event.waitUntil(self.registration.showNotification(payload.title||'HIDRA • Lembrete',{
  body:payload.body||'Chegou o horário do lembrete.',icon:'./logo-desktop.png',badge:'./logo-desktop.png',
  tag:payload.tag||'hidra-reminder',renotify:true,data:{url:self.registration.scope}
 }));
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 event.waitUntil((async()=>{
  const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const win of windows){if(win.url.startsWith(self.registration.scope)){await win.focus();return}}
  await clients.openWindow(self.registration.scope);
 })());
});
