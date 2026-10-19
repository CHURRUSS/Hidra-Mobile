/* HIDRA Mobile — consultas públicas independentes do PC (Open-Meteo e RSS). */
(()=>{'use strict';
const WKEY='hidra2.weather.city.v1', WCACHE='hidra.mobile.weather.cache.v1';
const timeout=(url,ms=14000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(url,{signal:c.signal,cache:'no-store'}).finally(()=>clearTimeout(t))};
const getJSON=async url=>{const r=await timeout(url);if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
const safeRead=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}};
const desc=code=>code===0?'céu limpo':code<=3?'parcialmente nublado':[45,48].includes(code)?'neblina':code>=51&&code<=67?'chuva':code>=71&&code<=77?'neve':code>=80&&code<=82?'pancadas de chuva':code>=95?'trovoadas':'nublado';
async function weather(city){city=String(city||localStorage.getItem(WKEY)||'').trim().slice(0,90);if(!city)throw Error('Configure uma cidade para o clima.');
 try{const g=await getJSON('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=1&language=pt&format=json');if(!g.results?.length)throw Error('Cidade não encontrada');const loc=g.results[0];const w=await getJSON('https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(loc.latitude)+'&longitude='+encodeURIComponent(loc.longitude)+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto');if(!Number.isFinite(Number(w.current?.temperature_2m)))throw Error('Dados meteorológicos indisponíveis');const out={city:loc.name,temp:Number(w.current.temperature_2m),description:desc(Number(w.current.weather_code)),humidity:Number(w.current.relative_humidity_2m),feelsLike:Number(w.current.apparent_temperature),wind:Number(w.current.wind_speed_10m),updated:Date.now(),stale:false,source:'Open-Meteo'};safeWrite(WCACHE,out);localStorage.setItem(WKEY,city);return out}catch(e){const old=safeRead(WCACHE);if(old)return {...old,stale:true,error:e.message};throw e}}
// Notícias: mesma rota do HIDRA Desktop/servidor, sem GitHub Actions nem APIs terceiras.
// Clima (acima) continua diretamente na Open-Meteo e nao exige o servidor.
async function news(topic='Brasil'){
 topic=String(topic||'Brasil').trim().slice(0,100)||'Brasil';
 if(localStorage.getItem('hidra.privacy')==='true')
  throw Error('O modo privacidade impede consultas ao servidor. Desative-o nos Ajustes.');
 if(localStorage.getItem('hidra.localOnly')==='true')
  throw Error('As notícias precisam do servidor. Use o comando "modo normal" para sair do modo somente local.');
 const endpoint=(localStorage.getItem('hidra.base')||'').trim().replace(/\/+$/,'');
 const token=(localStorage.getItem('hidra.token')||'').trim();
 if(!endpoint||!token)
  throw Error('As notícias exigem o servidor HIDRA. Configure a conexão e a chave de pareamento nos Ajustes.');
 let base;
 try{base=new URL(endpoint)}catch(e){throw Error('Endereço do servidor inválido nos Ajustes.');}
 if(!['http:','https:'].includes(base.protocol))throw Error('O endereço do servidor deve começar por http:// ou https://.');
 if(!navigator.onLine)throw Error('Sem internet ou rede para consultar o servidor HIDRA.');
 const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),45000);
 try{
  const url=endpoint+'/mobile/api/news?q='+encodeURIComponent(topic);
  const res=await fetch(url,{
   method:'GET',cache:'no-store',signal:ctl.signal,
   headers:{Authorization:'Bearer '+token,Accept:'application/json'}
  });
  if(!res.ok){
   if(res.status===404)throw Error('A rota de notícias não foi encontrada no servidor. Verifique hidra_mobile_bridge.py.');
   let message='HTTP '+res.status;
   try{const json=await res.json();message=String(json.error||message).slice(0,250)}catch(e){}
   throw Error(message);
  }
  const data=await res.json();
  if(!Array.isArray(data.items))throw Error('O servidor retornou dados de notícias em formato inesperado.');
  const items=data.items.filter(x=>x&&typeof x.title==='string'&&/^https?:\/\//.test(String(x.url||'')))
   .map(x=>({title:x.title,url:x.url,source:x.source||data.source||'Notícias',date:x.date||'',description:x.description||''})).slice(0,30);
  return {items,topic,provider:'server',source:data.source||'RSS',updated:Date.now(),stale:false,
   notice:items.length?'':'O servidor não encontrou notícias sobre "'+topic+'" neste momento.'};
 }catch(e){
  if(e.name==='AbortError')throw Error('Tempo limite ao consultar notícias no servidor HIDRA.');
  if(e instanceof TypeError)throw Error('Não foi possível conectar ao servidor HIDRA. Verifique a conexão, o endereço configurado e o servidor Python.');
  throw e;
 }finally{clearTimeout(timer)}
}
window.HIDRAMobilePublic={weather,news,getWeatherCity:()=>localStorage.getItem(WKEY)||'',setWeatherCity:city=>localStorage.setItem(WKEY,String(city||'').trim().slice(0,90))};
})();