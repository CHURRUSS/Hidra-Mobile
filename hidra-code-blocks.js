/* HIDRA Mobile - blocos de codigo com copia independente. Apenas apresentacao. */
(()=>{'use strict';
const history=document.getElementById('history');
if(!history)return;
const style=document.createElement('style');
style.textContent=`.hidra-code{margin:10px 0;border:1px solid #356c82;border-radius:10px;background:#071622;overflow:hidden}.hidra-code-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 9px;background:#103246;color:#9bd8e9;font-size:11px}.hidra-copy{border:1px solid #4b9db5;border-radius:7px;background:#14506a;color:#e0faff;padding:6px 9px;font-size:11px;cursor:pointer}.hidra-code pre{margin:0;padding:12px;overflow-x:auto;white-space:pre;tab-size:2;font:12px/1.6 Consolas,monospace;color:#d8f5ff;user-select:text}.hidra-code code{font:inherit}.hidra-prose{white-space:pre-wrap;overflow-wrap:anywhere}`;
document.head.appendChild(style);
function parse(text){
 const rx=/```([^\n`]*?)\n([\s\S]*?)```|```\s*([a-zA-Z0-9_+#.-]+)?\s+([\s\S]*?)\s*```/g;
 const parts=[];let last=0,m;
 while((m=rx.exec(text))!==null){
  if(m.index>last)parts.push({type:'text',value:text.slice(last,m.index)});
  parts.push({type:'code',lang:(m[1]||m[3]||'código').trim()||'código',value:m[2]!==undefined?m[2]:m[4]});
  last=rx.lastIndex;
 }
 if(!parts.length)return null;
 if(last<text.length)parts.push({type:'text',value:text.slice(last)});
 return parts;
}
function copyFallback(value){const t=document.createElement('textarea');t.value=value;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}t.remove();return ok;}
async function copyCode(value,button){
 let ok=false;
 try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);ok=true;}else ok=copyFallback(value)}catch(e){ok=copyFallback(value)}
 const label=button.textContent;button.textContent=ok?'✓ Copiado!':'Selecione o código';
 if(!ok){const pre=button.closest('.hidra-code').querySelector('code');const range=document.createRange();range.selectNodeContents(pre);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range)}
 setTimeout(()=>{if(button.isConnected)button.textContent=label},1700);
}
function render(el){
 if(el.dataset.hidraCodeRendered==='1'||!el.classList.contains('hidra'))return;
 const original=el.textContent||'';
 const parts=parse(original);if(!parts)return;
 el.dataset.hidraCodeRendered='1';
 const frag=document.createDocumentFragment();
 for(const part of parts){
  if(part.type==='text'){const p=document.createElement('div');p.className='hidra-prose';p.textContent=part.value;frag.appendChild(p);continue;}
  const wrapper=document.createElement('div');wrapper.className='hidra-code';
  const head=document.createElement('div');head.className='hidra-code-head';
  const lang=document.createElement('span');lang.textContent=part.lang;
  const btn=document.createElement('button');btn.type='button';btn.className='hidra-copy';btn.textContent='Copiar código';
  btn.addEventListener('click',()=>copyCode(part.value,btn));
  head.append(lang,btn);
  const pre=document.createElement('pre');const code=document.createElement('code');code.textContent=part.value;pre.appendChild(code);
  wrapper.append(head,pre);frag.appendChild(wrapper);
 }
 el.replaceChildren(frag);
}
function scan(){history.querySelectorAll('.bubble.hidra').forEach(render)}
scan();new MutationObserver(scan).observe(history,{childList:true});
})();
