/* HIDRA Mobile — aba de Notícias independente dos Lembretes. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const css=document.createElement('style');
css.textContent=`
#hidraNewsScreen{padding:12px 16px 100px;color:#d9faff}
#hidraNewsScreen:not(.active){display:none!important}
#hidraNewsScreen .news-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
#hidraNewsScreen .news-actions{display:flex;gap:8px;margin:12px 0}
#hidraNewsScreen input{min-width:0;flex:1;background:#092537;color:#e5faff;border:1px solid #3e8fa5;border-radius:8px;padding:12px}
#hidraNewsScreen button{background:#15506a;color:#eff;border:1px solid #4aa7c0;border-radius:8px;padding:10px}
#hidraNewsScreen article{background:#092537;border:1px solid #2b6377;border-radius:12px;padding:14px;margin:10px 0}
#hidraNewsScreen article a{color:#b9f5ff;text-decoration:none;font-weight:600}
#hidraNewsScreen .news-meta{font-size:12px;opacity:.75;margin-top:8px}
#hidraNewsScreen .news-state{padding:10px 0;opacity:.85}
`;
document.head.appendChild(css);
const screen=document.createElement('section');screen.id='hidraNewsScreen';screen.className='screen';
screen.innerHTML='<div class="news-head"><h2>▤ NOTÍCIAS</h2><button id="hidraNewsClose" type="button">Fechar ✕</button></div><form id="hidraNewsForm" class="news-actions"><input id="hidraNewsQuery" aria-label="Assunto das notícias" placeholder="Assunto (ex.: Brasil)" maxlength="100" value="Brasil"><button type="submit">Buscar</button></form><p id="hidraNewsState" class="news-state" role="status">Consulte notícias pelo servidor HIDRA.</p><div id="hidraNewsList"></div>';
const main=document.querySelector('main.app')||document.querySelector('main')||document.body;
const conversation=$('conversation');
if(conversation)conversation.after(screen);else main.appendChild(screen);
const nav=document.querySelector('nav.bottom');
if(nav){
 const btn=document.createElement('button');btn.type='button';btn.className='nav';btn.dataset.tab='hidraNewsScreen';btn.innerHTML='▤<small>Notícias</small>';
 btn.onclick=()=>open();
 nav.appendChild(btn);
 nav.querySelectorAll('.nav:not([data-tab="hidraNewsScreen"])').forEach(b=>b.addEventListener('click',()=>screen.classList.remove('active')));
}
function open(topic){
 document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab==='hidraNewsScreen'));
 screen.classList.add('active');
 if(topic)$('hidraNewsQuery').value=topic;
 load($('hidraNewsQuery').value.trim()||'Brasil');
}
function close(){
 screen.classList.remove('active');
 const home=$('home');if(home)home.classList.add('active');
 document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab==='home'));
}
function validUrl(value){
 try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:null}catch(e){return null}
}
async function load(topic){
 const state=$('hidraNewsState'),list=$('hidraNewsList');
 state.textContent='Buscando notícias sobre '+topic+'…';list.replaceChildren();
 const base=(localStorage.getItem('hidra.base')||'').replace(/\/$/,'');
 const token=localStorage.getItem('hidra.token')||'';
 if(!base||!token){state.textContent='Configure o endereço do servidor e a chave em Ajustes para consultar notícias.';return}
 try{
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),18000);
 let res;
 try{res=await fetch(base+'/mobile/api/news?q='+encodeURIComponent(topic),{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:ctl.signal})}
 finally{clearTimeout(timer)}
 if(!res.ok)throw Error('Servidor respondeu HTTP '+res.status);
 const data=await res.json(),items=Array.isArray(data.items)?data.items:[];
 if(!items.length){state.textContent='Nenhuma notícia encontrada sobre '+topic+'.';return}
 state.textContent=items.length+' notícia(s) encontrada(s).';
 items.slice(0,30).forEach(item=>{
 const article=document.createElement('article'),a=document.createElement('a');
 const url=validUrl(item.url||item.link);
 a.textContent=String(item.title||'Notícia sem título');
 if(url){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}else{a.removeAttribute('href')}
 const meta=document.createElement('div');meta.className='news-meta';
 meta.textContent=[item.source,item.published_at||item.date].filter(Boolean).join(' • ');
 article.append(a,meta);
 if(item.description||item.summary){const p=document.createElement('p');p.textContent=String(item.description||item.summary);article.appendChild(p)}
 list.appendChild(article);
 });
 }catch(e){state.textContent='Não foi possível consultar notícias: '+(e.name==='AbortError'?'tempo limite':e.message)+'. Verifique o servidor.'}
}
$('hidraNewsClose').onclick=close;
$('hidraNewsForm').onsubmit=e=>{e.preventDefault();load($('hidraNewsQuery').value.trim()||'Brasil')};
const tile=document.createElement('button');tile.className='module';tile.type='button';tile.innerHTML='<span class="symbol">▤</span><span>Notícias</span>';tile.onclick=()=>open();
const modules=document.querySelector('.modules');
if(modules&&!Array.from(modules.querySelectorAll('button')).some(b=>b.textContent.trim()==='Notícias'))modules.appendChild(tile);
document.querySelectorAll('[data-command]').forEach(b=>{
 if(/not[ií]cias/i.test(b.dataset.command||'')){b.addEventListener('click',e=>{e.stopImmediatePropagation();open()},true)}
});
window.HidraNews={open,close,load};
})();
