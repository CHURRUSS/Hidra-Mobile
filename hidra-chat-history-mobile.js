/* HIDRA Mobile: histórico persistente, sem alterar roteamento ou Biblioteca. */
(()=>{'use strict';
const KEY='hidra.mobile.chat.history.v1', MAX=300;
const history=document.getElementById('history');
if(!history)return;
let records=[];
try{
 const data=JSON.parse(localStorage.getItem(KEY)||'[]');
 if(Array.isArray(data))records=data.filter(x=>x&&['me','hidra'].includes(x.who)&&typeof x.text==='string').slice(-MAX);
}catch(e){console.warn('HIDRA: histórico anterior inválido',e);}
let restoring=true;
function add(text,who){
 const el=document.createElement('div');
 el.className='bubble '+who;
 el.textContent=text;
 history.appendChild(el);
}
records.forEach(x=>add(x.text,x.who));
restoring=false;
history.scrollTop=history.scrollHeight;
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(records.slice(-MAX)));}
 catch(e){console.warn('HIDRA: não foi possível salvar histórico local',e);}
}
function collect(){
 if(restoring)return;
 const bubbles=Array.from(history.querySelectorAll('.bubble'));
 // Observe apenas mensagens novas. Remoções ou restauração não criam duplicatas.
 if(bubbles.length<=knownCount)return;
 const added=bubbles.slice(knownCount);
 for(const el of added){
   const who=el.classList.contains('me')?'me':'hidra';
   records.push({who,text:el.textContent||''});
 }
 knownCount=bubbles.length;
 if(records.length>MAX){
   const excess=records.length-MAX;
   records.splice(0,excess);
   for(let i=0;i<excess;i++){
     const first=history.querySelector('.bubble');
     if(first)first.remove();
   }
   knownCount=history.querySelectorAll('.bubble').length;
 }
 persist();
}
let knownCount=history.querySelectorAll('.bubble').length;
const observer=new MutationObserver(collect);
observer.observe(history,{childList:true});
// Notícias: manter somente o primeiro botão da grade; remover botão criado na barra inferior.
function tidyNews(){
 const nav=document.querySelector('nav.bottom');
 if(nav)nav.querySelectorAll('[data-tab="hidraNewsScreen"]').forEach(b=>b.remove());
 const modules=document.querySelector('.modules');
 if(modules){
   const matches=Array.from(modules.querySelectorAll('button')).filter(b=>b.textContent.trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-zA-Z]/g,'').toLowerCase()==='noticias');
   matches.slice(1).forEach(b=>b.remove());
 }
}
tidyNews();
const nav=document.querySelector('nav.bottom'),modules=document.querySelector('.modules');
if(nav)new MutationObserver(tidyNews).observe(nav,{childList:true});
if(modules)new MutationObserver(tidyNews).observe(modules,{childList:true});
window.HIDRAChatHistory={version:'1.0',count:()=>records.length};
})();
