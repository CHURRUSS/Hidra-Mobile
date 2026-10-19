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
// Assuntos indexados pelo GitHub Actions. Buscas livres consultam os titulos DE TODAS
// as categorias publicadas: nunca trocar silenciosamente o assunto por "Brasil".
const CATEGORIES={
 brasil:'brasil',brazil:'brasil',geral:'brasil',noticias:'brasil','do dia':'brasil','noticias do dia':'brasil',
 tecnologia:'tecnologia',tech:'tecnologia',mundo:'mundo',internacional:'mundo',
 economia:'economia',financas:'economia',esporte:'esportes',esportes:'esportes',futebol:'esportes',
 games:'games',game:'games',videogame:'games',videogames:'games','video game':'games','video games':'games',
 jogos:'games','jogos eletronicos':'games','jogos digitais':'games',
 ciencia:'ciencia',cientifico:'ciencia',saude:'saude',medicina:'saude',
 entretenimento:'entretenimento',cinema:'entretenimento',filmes:'entretenimento',series:'entretenimento',musica:'entretenimento',
 politica:'politica','inteligencia artificial':'ia',ia:'ia'
};
const normalize=s=>String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const STOPWORDS=new Set(['de','do','da','dos','das','sobre','em','no','na','nos','nas','para','por','com','um','uma','e','o','a','os','as','hoje','ultimas','noticias']);
const articleValid=x=>x&&typeof x.title==='string'&&typeof x.url==='string'&&/^https:\/\//.test(x.url);
function uniqueArticles(arr){
 const seen=new Set();return arr.filter(articleValid).filter(x=>{
  const key=x.url; if(seen.has(key))return false; seen.add(key);return true;
 }).map(x=>({title:x.title,url:x.url,source:x.source||'RSS',date:x.date||'',description:''}));
}
function byDate(a,b){return (Date.parse(b.date)||0)-(Date.parse(a.date)||0)}
async function news(topic='Brasil'){
 topic=String(topic||'Brasil').trim().slice(0,100)||'Brasil';
 const query=normalize(topic);
 const category=CATEGORIES[query]||null;
 // Cache por consulta, nunca por uma categoria substituta. Evita o bug de
 // "Video Game" reutilizar noticias de "Brasil" quando a rede falha.
 const cacheKey=NCACHE+'.v2.'+encodeURIComponent(query);
 try{
  const data=await getJSON('./data/noticias.json?t='+Math.floor(Date.now()/60000));
  const categories=data?.categories;
  if(!categories||typeof categories!=='object')throw Error('Arquivo de notícias incompleto');
  let items=[],notice='';
  if(category){
   items=uniqueArticles(Array.isArray(categories[category])?categories[category]:[]);
   if(!items.length)notice='Ainda não há notícias de '+topic+' no arquivo publicado. Execute "Atualizar notícias HIDRA" no GitHub Actions e aguarde a publicação.';
  }else{
   // Busca livre local entre manchetes de TODAS as categorias indexadas;
   // o PWA não tem acesso direto ao RSS por causa das regras CORS.
   const all=uniqueArticles(Object.values(categories).flatMap(list=>Array.isArray(list)?list:[]));
   const terms=query.split(' ').filter(t=>t.length>2&&!STOPWORDS.has(t));
   if(terms.length){items=all.filter(x=>{
    const title=normalize(x.title);
    return title.includes(query)||terms.every(term=>title.includes(term));
   }).sort(byDate)}
   if(!items.length)notice='Nenhuma manchete sobre "'+topic+'" nas categorias disponíveis. A pesquisa funciona sobre as notícias coletadas pelo GitHub, não sobre toda a internet.';
  }
  const result={items:items.slice(0,30),topic,provider:'github',updated:Date.parse(data.updated_at)||Date.now(),stale:false,notice};
  safeWrite(cacheKey,result);return result;
 }catch(e){
  const old=safeRead(cacheKey);
  if(old&&normalize(old.topic)===query&&Array.isArray(old.items))return {...old,stale:true,error:e.message};
  throw Error('Notícias indisponíveis: '+e.message);
 }
}
window.HIDRAMobilePublic={weather,news,getWeatherCity:()=>localStorage.getItem(WKEY)||'',setWeatherCity:city=>localStorage.setItem(WKEY,String(city||'').trim().slice(0,90))};
})();