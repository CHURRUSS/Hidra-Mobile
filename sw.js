/* HIDRA Mobile - cache Biblioteca + historico de chat. */
const CACHE='hidra-mobile-v27-anexos-leitura-memoria';
const FILES=['./','./index.html','./app.js?v=22','./hidra-intelligence.js?v=12','./news.js?v=25','./style.css?v=11','./manifest.webmanifest','./icon.svg','./neural-core.js?v=11','./gps.js?v=11','./lembretes.js?v=2','./vision.js?v=1','./hidra-library-mobile.js?v=9','./hidra-chat-history-mobile.js?v=1','./hidra-code-blocks.js?v=1','./hidra-public-data.js?v=13','./hidra-weather-mobile.js?v=3'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(p=>c.add(p).catch(err=>console.warn('HIDRA cache:',p,err))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hidra-mobile-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('/mobile/api/'))return;
 if(new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{if(res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return res}).catch(()=>caches.match(e.request).then(res=>res||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))
});
