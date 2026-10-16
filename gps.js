(()=>{'use strict';
const $=id=>document.getElementById(id);
const panel=$('gpsPanel'),status=$('gpsStatus'),results=$('gpsResults');
let point=null,address='',map=null,me=null,markers=[],lastCategory='';
const names={market:'mercados',pharmacy:'farmácias',bakery:'padarias',fuel:'postos de combustível',restaurant:'restaurantes'};
const escapeRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function note(t){status.textContent=t}
function open(){panel.hidden=false;document.body.classList.add('gps-open');if(!point)locate();else setTimeout(()=>map?.invalidateSize(),120)}
function close(){panel.hidden=true;document.body.classList.remove('gps-open')}
function ensureMap(){
 if(map||!window.L)return !!map;
 map=L.map('gpsMap',{zoomControl:false,attributionControl:true,scrollWheelZoom:false,dragging:true,doubleClickZoom:false,touchZoom:false});
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
 L.control.zoom({position:'bottomright'}).addTo(map);
 return true;
}
function clearMarkers(){markers.forEach(m=>map?.removeLayer(m));markers=[]}
function draw(){
 if(!point)return;
 if(!ensureMap()){note('GPS obtido. Mapa indisponível; confira sua conexão com a internet.');return}
 map.invalidateSize();map.setView([point.lat,point.lon],16);
 if(me)map.removeLayer(me);
 me=L.circleMarker([point.lat,point.lon],{radius:10,color:'#b7faff',fillColor:'#00bce9',fillOpacity:.85,weight:3}).addTo(map).bindPopup('Sua localização aproximada');
 L.circle([point.lat,point.lon],{radius:Math.min(point.accuracy||30,1500),color:'#4ddaff',fillColor:'#13a8d3',fillOpacity:.06,weight:1}).addTo(map);
}
function coordsText(){return point?`${point.lat.toFixed(6)}, ${point.lon.toFixed(6)} • precisão aproximada ${Math.round(point.accuracy)} m`:''}
async function reverse(){
 try{
  const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(point.lat)}&lon=${encodeURIComponent(point.lon)}&zoom=18&addressdetails=1&accept-language=pt-BR`;
  const r=await fetch(u,{headers:{'Accept':'application/json'}});
  if(!r.ok)throw Error('Serviço de endereço indisponível');
  const j=await r.json();const a=j.address||{};
  address=[a.road||a.pedestrian||a.residential,a.house_number,a.suburb||a.neighbourhood,a.city||a.town||a.village||a.municipality,a.state].filter(Boolean).join(', ')||j.display_name||coordsText();
 }catch(e){address='Endereço não disponível — coordenadas obtidas'}
 $('gpsAddress').textContent=address;
}
function locate(){
 openNoLocate();
 if(!navigator.geolocation){note('Seu navegador não disponibiliza GPS.');return}
 note('Obtendo posição do celular…');
 navigator.geolocation.getCurrentPosition(async p=>{
  point={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy};
  $('gpsCoords').textContent=coordsText();
  $('gpsAddress').textContent='Consultando endereço…';
  note('Localização obtida • GPS do celular');
  clearMarkers();draw();await reverse();if(lastCategory){const category=lastCategory;lastCategory='';nearby(category)}
 },e=>{
  note(e.code===1?'Permita o acesso à localização nas configurações do navegador.':e.code===3?'Tempo esgotado ao consultar GPS. Tente novamente.':'Não foi possível obter a localização. Ative a localização do Android.');
 },{enableHighAccuracy:true,timeout:18000,maximumAge:15000});
}
function openNoLocate(){panel.hidden=false;document.body.classList.add('gps-open');setTimeout(()=>map?.invalidateSize(),120)}
// Servidores públicos podem ficar indisponíveis ou limitar requisições.
// Consultas GET simples evitam preflight CORS; tentamos alternativas sequencialmente.
async function fetchPlaces(query){
 const servers=[
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
 ];
 let lastError=null;
 const failures=[];
 for(const endpoint of servers){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),16000);
  try{
   const url=endpoint+'?data='+encodeURIComponent(query);
   const response=await fetch(url,{method:'GET',mode:'cors',signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data.elements))throw new Error('Resposta inesperada');
   return data;
  }catch(err){lastError=err;failures.push(new URL(endpoint).hostname+': '+(err.name==='AbortError'?'tempo esgotado':err.message));console.warn('[HIDRA GPS] Falha na consulta de locais:',endpoint,err.message)}
  finally{clearTimeout(timer)}
 }
 throw new Error(failures.join(' | ')||'Serviços indisponíveis');
}
async function nearby(category){
 if(!names[category])return;
 lastCategory=category;openNoLocate();
 if(!point){note('Primeiro precisamos obter sua localização.');locate();return}
 results.replaceChildren();note('Buscando '+names[category]+' nas proximidades…');
 clearMarkers();
 const tags={market:'["shop"~"supermarket|convenience|grocery"]',pharmacy:'["amenity"="pharmacy"]',bakery:'["shop"="bakery"]',fuel:'["amenity"="fuel"]',restaurant:'["amenity"="restaurant"]'};
 const query=`[out:json][timeout:15];(node${tags[category]}(around:1500,${point.lat},${point.lon});way${tags[category]}(around:1500,${point.lat},${point.lon}););out center 35;`;
 try{
  const data=await fetchPlaces(query);
  const list=(data.elements||[]).map(e=>({lat:e.lat??e.center?.lat,lon:e.lon??e.center?.lon,name:e.tags?.name||'Estabelecimento sem nome',street:e.tags?.['addr:street']||'',number:e.tags?.['addr:housenumber']||''})).filter(e=>Number.isFinite(e.lat)&&Number.isFinite(e.lon));
  list.forEach(e=>e.distance=distance(point.lat,point.lon,e.lat,e.lon));
  list.sort((a,b)=>a.distance-b.distance);
  const nearest=list.slice(0,12);
  note(nearest.length?`${nearest.length} resultados próximos • até 1,5 km`:'Nenhum resultado cadastrado num raio de 1,5 km.');
  if(!nearest.length)return;
  nearest.forEach((e,i)=>{
   const item=document.createElement('div');item.className='gps-result';
   const title=document.createElement('strong');title.textContent=`${i+1}. ${e.name}`;
   const detail=document.createElement('span');detail.textContent=`${Math.round(e.distance)} m em linha reta${e.street?' • '+e.street+(e.number?', '+e.number:''):''}`;
   const button=document.createElement('button');button.type='button';button.textContent='Ver no mapa';
   button.onclick=()=>{if(map){map.setView([e.lat,e.lon],17);markers[i]?.openPopup()}};
   item.append(title,detail,button);results.append(item);
   if(map){const marker=L.circleMarker([e.lat,e.lon],{radius:6,color:'#51d7ef',fillColor:'#14a8d0',fillOpacity:.9}).addTo(map).bindPopup(e.name);markers.push(marker)}
  });
 }catch(e){
  note('Busca interna indisponível. Você ainda pode procurar '+names[category]+' no mapa externo.');
  const info=document.createElement('div');info.className='gps-result';
  const msg=document.createElement('span');msg.textContent='Diagnóstico: '+e.message;
  const btn=document.createElement('button');btn.textContent='Abrir no Google Maps';btn.type='button';
  btn.onclick=()=>window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(names[category]+' perto de '+point.lat+','+point.lon),'_blank','noopener,noreferrer');
  const copy=document.createElement('button');copy.textContent='Copiar diagnóstico';copy.type='button';
  copy.onclick=()=>navigator.clipboard?.writeText(e.message).then(()=>note('Diagnóstico copiado.')).catch(()=>note('Não foi possível copiar.'));
  info.append(msg,btn,copy);results.append(info);
 }
}
function distance(a,b,c,d){const rad=Math.PI/180,x=(c-a)*rad,y=(d-b)*rad,h=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))}
function handle(text){
 const t=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[?!.,]/g,' ').replace(/\s+/g,' ').trim();
 const intent=/\b(onde (eu )?estou|minha localizacao|mostr(e|a|ar) (a )?(minha )?localizacao|abr(a|ir) (o )?mapa|me localiz(e|a|ar))\b/.test(t);
 const asksNearby=/\b(proxim\w*|perto|ao redor|nas redondezas|nas proximidades)\b/.test(t);
 const patterns={market:/\b(mercad|supermercad|mercearia)/,pharmacy:/\b(farmaci|drogaria)/,bakery:/\b(padaria)/,fuel:/\b(posto|combustivel)/,restaurant:/\b(restaurante)/};
 const cat=Object.keys(patterns).find(k=>patterns[k].test(t));
 if(cat&&(asksNearby||/^(hidra |hydra )?(mostre|mostrar|procure|buscar|encontre|onde tem)/.test(t))){open();nearby(cat);return true}
 if(intent){open();return true}
 return false;
}
$('gpsTile').onclick=open;$('gpsClose').onclick=close;$('gpsRefresh').onclick=locate;
$('gpsCopy').onclick=async()=>{
 if(!point){note('Localização ainda não disponível.');return}
 try{await navigator.clipboard.writeText(`${address}\n${coordsText()}`);note('Endereço copiado.')}catch(e){note('Não foi possível copiar automaticamente.')}
};
document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{open();nearby(b.dataset.place)});
window.HidraGPS={handle,open,locate,nearby};
})();