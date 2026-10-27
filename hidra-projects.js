/* HIDRA Mobile — Projetos ZIP e limpeza de fala, v1.
   Extensao nao executa arquivos gerados e nao grava no servidor. */
(()=>{'use strict';
if(window.HIDRAProjects)return;
const $=id=>document.getElementById(id);
const MAX_FILES=12,MAX_FILE_BYTES=500000,MAX_TOTAL_BYTES=3000000;
const state={files:[],working:false,completed:false,lastSpec:localStorage.getItem('hidra.projects.lastSpec')||''};
const norm=t=>String(t||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function readable(t){
 return String(t??'')
  .replace(/```[\s\S]*?```/g,' Trecho de código disponível na tela. ')
  .replace(/!\[([^\]]*)\]\([^)]+\)/g,'$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
  .replace(/`([^`]+)`/g,'$1')
  .replace(/^\s{0,3}#{1,6}\s*/gm,'')
  .replace(/^\s*[-+*]\s+/gm,'')
  .replace(/\*\*|__|~~/g,'')
  .replace(/[\*#]/g,'')
  .replace(/<[^>]*>/g,' ')
  .replace(/https?:\/\/\S+/g,' link disponível na tela ')
  .replace(/[|]{2,}/g,' ')
  .replace(/[ \t]+/g,' ')
  .replace(/\n{3,}/g,'\n\n').trim();
}
// A API TTS recebe apenas a versao falada. Requisicoes nao-TTS seguem intactas.
const nativeFetch=window.fetch.bind(window);
window.fetch=function(input,init){
 try{
  const target=typeof input==='string'?input:(input&&input.url?input.url:String(input));
  if(/\/mobile\/api\/tts(?:[?#]|$)/.test(target)&&init&&typeof init.body==='string'){
   const data=JSON.parse(init.body);
   if(data&&typeof data.text==='string')return nativeFetch(input,{...init,body:JSON.stringify({...data,text:readable(data.text)})});
  }
 }catch(e){console.warn('HIDRA voz: limpeza ignorada',e)}
 return nativeFetch(input,init);
};
// A voz offline usa SpeechSynthesisUtterance, enquanto a online usa /tts.
try{
 const Native=window.SpeechSynthesisUtterance;
 if(typeof Native==='function')window.SpeechSynthesisUtterance=new Proxy(Native,{
  construct(Target,args,newTarget){return Reflect.construct(Target,[readable(args[0]),...args.slice(1)],Target)}
 });
}catch(e){console.warn('HIDRA voz offline indisponivel',e)}

function safeName(raw){
 const name=String(raw||'').trim().replace(/\\/g,'/');
 if(!name||name.length>120||name.startsWith('/')||/^[a-zA-Z]:/.test(name)||/[\u0000-\u001f<>:"|?*]/.test(name))throw Error('Nome de arquivo inválido: '+name);
 const segments=name.split('/');
 if(segments.some(p=>!p||p==='.'||p==='..'||p.length>80))throw Error('Caminho inseguro: '+name);
 return name;
}
function namesFrom(text){
 const names=String(text||'').split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean);
 if(!names.length||names.length>MAX_FILES)throw Error('Informe entre 1 e '+MAX_FILES+' arquivos.');
 const unique=new Set();return names.map(x=>{const n=safeName(x),k=n.toLowerCase();if(unique.has(k))throw Error('Arquivo duplicado: '+n);unique.add(k);return n});
}
function defaultNames(spec){const s=norm(spec);
 if(/pwa|aplicativo|site|pagina|web|roleta/.test(s))return 'index.html\nstyle.css\napp.js\nmanifest.webmanifest\nsw.js';
 if(/python|script.*py/.test(s))return 'main.py\nREADME.md';
 return 'index.html\nstyle.css\napp.js';
}
function downloadBlob(blob,name){const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),60000)}
const utf8=s=>new TextEncoder().encode(s);
const crcTable=(()=>{let out=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);out[n]=c>>>0}return out})();
function crc32(data){let c=0xffffffff;for(const v of data)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function w16(dv,o,v){dv.setUint16(o,v,true)}
function w32(dv,o,v){dv.setUint32(o,v>>>0,true)}
// ZIP valido (metodo STORE, sem compactacao), sem biblioteca ou CDN externa.
function makeZip(files){
 const parts=[],directory=[];let offset=0,total=0;
 for(const file of files){
  const nameBytes=utf8(safeName(file.name)),bytes=file.bytes;
  if(nameBytes.length>65535||bytes.length>MAX_FILE_BYTES)throw Error('Arquivo grande demais para o ZIP.');
  total+=bytes.length;if(total>MAX_TOTAL_BYTES)throw Error('Projeto excede 3 MB.');
  const crc=crc32(bytes),local=new Uint8Array(30+nameBytes.length),lh=new DataView(local.buffer);
  w32(lh,0,0x04034b50);w16(lh,4,20);w16(lh,6,0x0800);w16(lh,8,0);
  w32(lh,14,crc);w32(lh,18,bytes.length);w32(lh,22,bytes.length);w16(lh,26,nameBytes.length);
  local.set(nameBytes,30);parts.push(local,bytes);
  const cent=new Uint8Array(46+nameBytes.length),ch=new DataView(cent.buffer);
  w32(ch,0,0x02014b50);w16(ch,4,20);w16(ch,6,20);w16(ch,8,0x0800);w16(ch,10,0);
  w32(ch,16,crc);w32(ch,20,bytes.length);w32(ch,24,bytes.length);w16(ch,28,nameBytes.length);
  w32(ch,42,offset);cent.set(nameBytes,46);directory.push(cent);
  offset+=local.length+bytes.length;
 }
 const dirSize=directory.reduce((a,b)=>a+b.length,0),end=new Uint8Array(22),dv=new DataView(end.buffer);
 w32(dv,0,0x06054b50);w16(dv,8,files.length);w16(dv,10,files.length);w32(dv,12,dirSize);w32(dv,16,offset);
 return new Blob([...parts,...directory,end],{type:'application/zip'});
}
function bytesFromBase64(encoded){
 const b=atob(encoded),out=new Uint8Array(b.length);
 if(out.length>MAX_FILE_BYTES)throw Error('Arquivo gerado ultrapassou 500 KB.');
 for(let i=0;i<b.length;i++)out[i]=b.charCodeAt(i);return out;
}
function stripFence(text){let s=String(text||'').trim();const fenced=s.match(/^```(?:[a-zA-Z0-9_+.-]+)?\s*\n([\s\S]*?)\n```\s*$/);if(fenced)s=fenced[1];return s}
function checkGenerated(name,bytes){
 if(!bytes.length)throw Error('Servidor retornou arquivo vazio: '+name);
 if(bytes.length>MAX_FILE_BYTES)throw Error('Arquivo excedeu 500 KB: '+name);
 if(/\.(?:json|webmanifest)$/i.test(name)){
  try{JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch(e){throw Error(name+' não contém JSON válido. Nenhum ZIP incompleto será oferecido.')}
 }
 if(/\.html?$/i.test(name)){
  const source=new TextDecoder().decode(bytes);
  if(!/<html\b/i.test(source)||!/<\/html\s*>/i.test(source))throw Error(name+' parece incompleto: não há documento HTML completo.');
 }
}
function serverAccess(){
 if(localStorage.getItem('hidra.privacy')==='true'||localStorage.getItem('hidra.localOnly')==='true')throw Error('Desative modo privacidade/local para gerar com o servidor.');
 const root=localStorage.getItem('hidra.base')||'',token=localStorage.getItem('hidra.token')||'';
 if(!root||!token)throw Error('Configure URL e chave de pareamento nos Ajustes.');
 const url=new URL(root);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('Use servidor HTTPS ou localhost.');
 if(url.username||url.password||url.search||url.hash)throw Error('URL do servidor inválida.');
 return{root:url.origin+url.pathname.replace(/\/$/,''),token};
}
async function request(route,body,timeout=180000){
 const c=serverAccess(),ctl=new AbortController(),id=setTimeout(()=>ctl.abort(),timeout);
 try{
  const resp=await nativeFetch(c.root+'/mobile/api/'+route,{method:'POST',signal:ctl.signal,headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!resp.ok){let err='HTTP '+resp.status;try{const j=await resp.json();err=j.error||err}catch(_){}const e=new Error(err);e.status=resp.status;throw e}
  return await resp.json();
 }finally{clearTimeout(id)}
}
async function generateFile(spec,name,all,useChat){
 const instruction=[`Crie o arquivo ${name} para um projeto.`, `Objetivo: ${spec}`,`Arquivos do projeto: ${all.join(', ')}.`,`Use referências e caminhos relativos corretos. Entregue conteúdo funcional e completo.`,`Não acrescente explicações ao conteúdo do arquivo.`].join('\n').slice(0,1500);
 try{
  const data=await request('developer/generate',{filename:name,instruction});
  if(typeof data.file_base64==='string'&&data.file_base64){return{bytes:bytesFromBase64(data.file_base64),source:'developer/generate'}}
  throw Error('O servidor não retornou um arquivo para download.');
 }catch(error){
  if(!useChat)throw Error('Rota de geração de arquivos indisponível para '+name+': '+error.message+'. Confira o suporte de /developer/generate no servidor.');
  if(error.name==='AbortError')throw error;
  const prompt=`HIDRA, produza SOMENTE o código/texto COMPLETO do arquivo ${name}. Projeto: ${spec.slice(0,400)}. Outros arquivos: ${all.join(', ').slice(0,180)}. Não escreva introdução, comentários fora do arquivo ou blocos Markdown. Use caminhos relativos e resposta curta mas funcional.`.slice(0,940);
  const data=await request('ai/chat',{text:prompt},155000);
  let answer=stripFence(data.text||'');
  if(!answer||/^(?:desculpe|não consigo|nao consigo|claro|aqui está|aqui esta)/i.test(answer))throw Error('O modelo não retornou conteúdo de arquivo válido: '+name);
  return{bytes:utf8(answer),source:'ai/chat (histórico compartilhado)'};
 }
}
function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el}
function status(text){const el=$('hpStatus');if(el)el.textContent=text}
function renderFiles(){const list=$('hpFiles');if(!list)return;list.replaceChildren();$('hpZip').disabled=state.working||!state.completed||!state.files.length;
 for(const file of state.files){
  const item=node('div');item.className='hp-file';
  const label=node('span',file.name+' · '+file.bytes.length+' bytes');
  const button=node('button','Baixar');button.type='button';button.onclick=()=>downloadBlob(new Blob([file.bytes],{type:'application/octet-stream'}),file.name.split('/').pop());
  item.append(label,button);list.append(item);
 }
}
async function generate(){if(state.working)return;
 const spec=$('hpSpec').value.trim();if(spec.length<12){status('Descreva o projeto com mais detalhes.');return}
 let names;try{names=namesFrom($('hpNames').value)}catch(e){status(e.message);return}
 try{serverAccess()}catch(e){status(e.message);return}
 state.working=true;state.completed=false;state.files=[];renderFiles();$('hpGenerate').disabled=true;const fallback=$('hpFallback').checked;
 localStorage.setItem('hidra.projects.lastSpec',spec.slice(0,1200));state.lastSpec=spec;
 try{
  let total=0;
  for(let i=0;i<names.length;i++){
   status(`Gerando ${i+1}/${names.length}: ${names[i]} (aguarde a resposta do servidor)...`);
   const generated=await generateFile(spec,names[i],names,fallback);
   checkGenerated(names[i],generated.bytes);
   total+=generated.bytes.length;if(total>MAX_TOTAL_BYTES)throw Error('O projeto excedeu 3 MB.');
   state.files.push({name:names[i],bytes:generated.bytes,source:generated.source});renderFiles();
  }
  state.completed=true;status(`Projeto pronto: ${state.files.length} arquivos. Toque em BAIXAR ZIP. Confira e teste o código antes de publicar. Os arquivos não foram executados.`);
 }catch(e){
  status('Geração interrompida em '+(state.files.length+1)+'/'+names.length+': '+(e.name==='AbortError'?'tempo limite':e.message)+' Os arquivos concluídos permanecem disponíveis individualmente.');
 }finally{state.working=false;$('hpGenerate').disabled=false;renderFiles()}
}
function open(spec){const p=$('hidraProjectsPanel');if(!p)return;
 if(spec&&spec.trim()){const value=spec.trim().slice(0,2500);$('hpSpec').value=value;$('hpNames').value=defaultNames(value);state.lastSpec=value;try{localStorage.setItem('hidra.projects.lastSpec',value.slice(0,1200))}catch(_){}}else if(!$('hpSpec').value&&state.lastSpec){$('hpSpec').value=state.lastSpec;$('hpNames').value=defaultNames(state.lastSpec)}
 p.hidden=false;$('hpSpec').focus();
}
function mount(){if($('hidraProjectsPanel'))return;
 const css=node('style');css.textContent=`#hidraProjectsPanel[hidden]{display:none!important}#hidraProjectsPanel{position:fixed;inset:0;z-index:10010;background:#04131cf5;color:#dcf8ff;overflow:auto;padding:12px;font:14px/1.5 Arial,sans-serif}#hidraProjectsPanel .hp-box{max-width:700px;margin:12px auto;background:#0a2939;border:1px solid #368cac;border-radius:15px;padding:17px}#hidraProjectsPanel textarea{width:100%;display:block;box-sizing:border-box;background:#092033;color:#e6faff;border:1px solid #4789a3;border-radius:9px;padding:10px;margin:7px 0 14px;resize:vertical}#hidraProjectsPanel button{color:#dffaff;background:#15516c;border:1px solid #4ba6c3;border-radius:8px;padding:10px;margin:4px;cursor:pointer}#hidraProjectsPanel button:disabled{opacity:.4;cursor:default}.hp-file{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#0e3648;border-radius:8px;margin-top:7px;padding:7px;overflow-wrap:anywhere}.hp-file span{flex:1}#hpStatus{padding:10px;border-left:3px solid #5fcde4;white-space:pre-wrap}#hidraProjectsPanel label{display:block;margin-top:12px}.bubble.hidra-projects-notice{background:#103446;color:#d7f4ff;border-left:3px solid #50c5e4}#hidraProjectsPanel h2{margin:4px 0}#hidraProjectsPanel p{color:#b4d7e3}`;document.head.append(css);
 const panel=node('section');panel.id='hidraProjectsPanel';panel.hidden=true;panel.setAttribute('aria-label','HIDRA Criador de Arquivos');
 panel.innerHTML=`<div class="hp-box"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><h2>HIDRA / CRIADOR DE ARQUIVOS</h2><button type="button" id="hpClose">Fechar ✕</button></div><p>Cria arquivos reais usando o servidor da HIDRA e reúne tudo em um ZIP baixado diretamente pelo celular. Os arquivos não são executados nem enviados ao GitHub automaticamente.</p><label for="hpSpec">Descreva o projeto</label><textarea id="hpSpec" rows="5" placeholder="Ex.: Crie um PWA com uma roleta de prêmios. Preciso adicionar prêmios por texto e sortear."></textarea><label for="hpNames">Nomes dos arquivos (um por linha, até 12)</label><textarea id="hpNames" rows="6">index.html\nstyle.css\napp.js\nmanifest.webmanifest\nsw.js</textarea><label><input type="checkbox" id="hpFallback"> Permitir alternativa pelo chat se o servidor não suportar geração de arquivos. Atenção: isso usa histórico compartilhado e pode produzir código incompleto.</label><div><button id="hpGenerate" type="button">⚙ Gerar arquivos</button><button id="hpZip" type="button" disabled>⬇ Baixar projeto ZIP</button></div><div id="hpStatus" role="status">Descreva o projeto e toque em Gerar arquivos. O ZIP só é liberado quando todos os arquivos forem produzidos.</div><div id="hpFiles"></div><p>Arquivos grandes ou incompletos podem exigir um gerador no servidor Python. Confira os arquivos antes de publicar. Sem servidor, só é possível baixar arquivos já gerados nesta sessão.</p></div>`;
 document.body.append(panel);
 $('hpClose').onclick=()=>{if(!state.working)panel.hidden=true;else status('A geração está em andamento. Aguarde ou feche ao concluir.');};
 $('hpGenerate').onclick=generate;
 $('hpZip').onclick=()=>{if(state.working||!state.completed||!state.files.length)return;try{downloadBlob(makeZip(state.files),'projeto-hidra.zip')}catch(e){status(e.message)}};
 const modules=document.querySelector('.modules');if(modules){const tile=node('button');tile.type='button';tile.className='module';tile.innerHTML='<span class="symbol">▣</span><span>Projetos ZIP</span>';tile.onclick=()=>open();modules.append(tile)}
 const dev=$('hidraDevPanel .box')||document.querySelector('#hidraDevPanel .box');
 if(dev){const extra=node('button','Criar projeto com vários arquivos e ZIP');extra.type='button';extra.onclick=()=>{const ins=$('devInstruction')?.value||'';const d=$('hidraDevPanel');if(d)d.hidden=true;open(ins)};dev.append(extra)}
}
function projectIntent(value){const t=norm(value).trim();
 const create=/(?:crie|criar|cria|gerar|gere|monte|montar|desenvolv|construa|faca|faça|preciso|quero)/.test(t);
 const file=/(?:arquivos?|projeto|\.zip\b|zip\b|pwa\b|aplicativo|site|pagina web)/.test(t);
 const followup=/(?:envie|enviar|manda|mandar|baixar|download|disponibiliz)/.test(t)&&/(?:arquivos?|zip|projeto)/.test(t);
 return(create&&file)||followup;
}
function interceptChat(e){const field=$('message');if(!field)return;const text=field.value.trim();if(!text||!projectIntent(text))return;
 e.preventDefault();e.stopImmediatePropagation();field.value='';
 const followup=/^(?:consegue|pode|me)?\s*(?:enviar|envie|mandar|manda|baixar)/i.test(text);
 const spec=followup&&state.lastSpec?state.lastSpec:text;
 // Mostra pedido em conversa, mas nao simula que gerou arquivos antes da geracao.
 const history=$('history');if(history){const bubble=node('div',text);bubble.className='bubble me';history.append(bubble);const ack=node('div','Abri o Criador de Arquivos. Confira a descrição e toque em Gerar arquivos. Quando terminar, você poderá baixar um ZIP com os arquivos de verdade.');ack.className='bubble hidra-projects-notice';history.append(ack)}
 open(spec);
}
function init(){mount();const form=$('sendform');if(form)form.addEventListener('submit',interceptChat,true)}
window.HIDRAProjects={open,readable,makeZip,defaultNames};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
