/* HIDRA Mobile — consultas públicas independentes do PC (Open-Meteo e RSS). */
(()=>{'use strict';
const WKEY='hidra2.weather.city.v1', NCACHE='hidra.mobile.news.cache.v1', WCACHE='hidra.mobile.weather.cache.v1';
const timeout=(url,ms=14000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(url,{signal:c.signal,cache:'no-store'}).finally(()=>clearTimeout(t))};
const getJSON=async url=>{const r=await timeout(url);if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
const safeRead=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}};
const desc=code=>code===0?'céu limpo':code<=3?'parcialmente nublado':[45,48].includes(code)?'neblina':code>=51&&code<=67?'chuva':code>=71&&code<=77?'neve':code>=80&&code<=82?'pancadas de chuva':code>=95?'trovoadas':'nublado';
async function weather(city){city=String(city||localStorage.getItem(WKEY)||'').trim().slice(0,90);if(!city)throw Error('Configure uma cidade para o clima.');
 try{const g=await getJSON('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=1&language=pt&format=json');if(!g.results?.length)throw Error('Cidade não encontrada');const loc=g.results[0];const w=await getJSON('https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(loc.latitude)+'&longitude='+encodeURIComponent(loc.longitude)+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto');if(!Number.isFinite(Number(w.current?.temperature_2m)))throw Error('Dados meteorológicos indisponíveis');const out={city:loc.name,temp:Number(w.current.temperature_2m),description:desc(Number(w.current.weather_code)),humidity:Number(w.current.relative_humidity_2m),feelsLike:Number(w.current.apparent_temperature),wind:Number(w.current.wind_speed_10m),updated:Date.now(),stale:false,source:'Open-Meteo'};safeWrite(WCACHE,out);localStorage.setItem(WKEY,city);return out}catch(e){const old=safeRead(WCACHE);if(old)return {...old,stale:true,error:e.message};throw e}}
const urlRSS=(provider,topic)=>provider==='bing'?'https://www.bing.com/news/search?q='+encodeURIComponent(topic)+'&format=rss&setmkt=pt-BR':'https://news.google.com/rss/search?q='+encodeURIComponent(topic)+'&hl=pt-BR&gl=BR&ceid=BR%3Apt-419';
async function rss(provider,topic){const feed=urlRSS(provider,topic);const result=await getJSON('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(feed));if(result.status!=='ok'||!Array.isArray(result.items))throw Error('RSS indisponível');return result.items.slice(0,5).map(x=>({title:String(x.title||'').replace(/<[^>]*>/g,'').trim(),url:x.link,source:provider==='bing'?'Bing Notícias':'Google Notícias',date:x.pubDate||'',description:''})).filter(x=>x.title&&/^https:\/\//.test(x.url||''))}
async function gdelt(topic){
 const query=topic.toLowerCase()==='brasil'?'(Brasil OR Brazil)':topic;
 const url='https://api.gdeltproject.org/api/v2/doc/doc?query='+encodeURIComponent(query)+'&mode=artlist&maxrecords=12&timespan=24h&format=json';
 const data=await getJSON(url);
 if(!Array.isArray(data.articles)||!data.articles.length)throw Error('GDELT sem resultados');
 return data.articles.map(x=>({title:String(x.title||'').replace(/<[^>]*>/g,'').trim(),url:x.url,source:x.domain||'GDELT',date:x.seendate||'',description:''})).filter(x=>x.title&&/^https:\/\//.test(x.url||''));
}
async function news(topic='Brasil'){topic=String(topic||'Brasil').trim().slice(0,100)||'Brasil';let lastError;for(const provider of ['gdelt','bing','google'])try{const items=provider==='gdelt'?await gdelt(topic):await rss(provider,topic);if(items.length){const result={items,topic,provider,updated:Date.now(),stale:false};safeWrite(NCACHE,result);return result}}catch(e){lastError=e}
 const old=safeRead(NCACHE);if(old&&old.topic.toLowerCase()===topic.toLowerCase())return {...old,stale:true,error:lastError?.message||'Fonte indisponível'};throw Error('Fontes públicas de notícias indisponíveis. '+(lastError?.message||''))}
window.HIDRAMobilePublic={weather,news,getWeatherCity:()=>localStorage.getItem(WKEY)||'',setWeatherCity:city=>localStorage.setItem(WKEY,String(city||'').trim().slice(0,90))};
})();