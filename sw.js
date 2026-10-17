/* SW 13: precache obrigatório do núcleo procedural para conversa offline. */
const CACHE='hidra-mobile-v13-news';
const FILES=['./','./index.html','./app.js?v=11','./hidra-intelligence.js?v=12','./news.js?v=13','./style.css?v=11','./manifest.webmanifest','./icon.svg','./neural-core.js?v=11','./gps.js?v=11','./lembretes.js?v=2','./vision.js?v=1'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(p=>c.add(p).catch(err=>console.warn('HIDRA cache:',p,err))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hidra-mobile-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('/mobile/api/'))return;
 if(new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{if(res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return res}).catch(()=>caches.match(e.request).then(res=>res||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))
});
