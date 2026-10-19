/* HIDRA 2.0 — Biblioteca Mobile, conectada à mesma biblioteca do servidor Desktop.
   Não guarda conteúdo na nuvem/GitHub; usa chave e endpoint salvos em Ajustes. */
(()=>{'use strict';
if(window.HIDRALibraryMobile)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s||'');
const css=document.createElement('style');css.textContent=`
#hidraLibraryMobile[hidden]{display:none!important}
#hidraLibraryMobile{position:fixed;z-index:9998;inset:0;background:#04121cf5;padding:calc(12px + env(safe-area-inset-top)) 10px 18px;overflow-y:auto;color:#d5f8ff;font:13px Arial,sans-serif}
#hidraLibraryMobile .hlbox{max-width:620px;margin:auto;padding:13px;background:#082437;border:1px solid #3787a1;border-radius:13px;display:flex;flex-direction:column;gap:10px;min-height:65dvh}
#hidraLibraryMobile .hlrow{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#hidraLibraryMobile .hlhead{justify-content:space-between}
#hidraLibraryMobile button{border:1px solid #42a2c2;background:#10394e;color:#d2f9ff;border-radius:6px;padding:9px;cursor:pointer}
#hidraLibraryMobile button:disabled{opacity:.5;cursor:not-allowed}
#hidraLibraryMobile input,#hidraLibraryMobile textarea{background:#061b2d;border:1px solid #28647d;border-radius:7px;color:#e3fbff;padding:11px;width:100%;font:inherit;box-sizing:border-box}
#hidraLibraryMobile .hlfiles{display:flex;flex-direction:column;gap:5px;max-height:38dvh;overflow:auto}
#hidraLibraryMobile .hlfile{width:100%;text-align:left;overflow-wrap:anywhere}
#hidraLibraryMobile .hlfile.active{background:#145b75;border-color:#83eaff}
#hidraLibraryMobile .hltext{white-space:pre-wrap;overflow-wrap:anywhere;max-height:46dvh;overflow:auto;background:#02101c;border:1px solid #2d5a71;border-radius:7px;padding:11px;font:12px/1.55 monospace}
#hidraLibraryMobile .hlstatus{font-size:12px;color:#8cc8dd;min-height:16px}
`;document.head.appendChild(css);
const panel=document.createElement('section');panel.id='hidraLibraryMobile';panel.hidden=true;
panel.innerHTML=`<div class="hlbox"><div class="hlrow hlhead"><strong>HIDRA / BIBLIOTECA</strong><button id="hlClose" type="button">FECHAR ✕</button></div>
<input id="hlSearch" placeholder="Pesquisar arquivos da Biblioteca" aria-label="Pesquisar na biblioteca">
<div class="hlrow"><button type="button" id="hlUpload">+ ANEXAR</button><button type="button" id="hlAnalyze">ANALISAR</button><button type="button" id="hlPreview">VER CONTEÚDO</button><button type="button" id="hlAiEdit">CORRIGIR COM IA</button><button type="button" id="hlEdit">EDITAR CÓPIA</button><button type="button" id="hlDownload">BAIXAR</button></div>
<input id="hlFile" type="file" hidden accept=".txt,.md,.py,.js,.json,.html,.css,.xml,.csv,.bat,.ini,.log,.yaml,.yml,.sql,.capx,.zip,.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp">
<div class="hlstatus" id="hlStatus" aria-live="polite"></div>
<div class="hlfiles" id="hlFiles"></div><div id="hlOutput" class="hltext" hidden></div></div>`;
document.body.appendChild(panel);
let items=[],selected=null,busy=false,timer=null;
function status(t){$('hlStatus').textContent=t}
function config(){const url=(localStorage.getItem('hidra.base')||'').trim().replace(/\/$/,'');const token=(localStorage.getItem('hidra.token')||'').trim();if(!url||!token)throw Error('Configure o endereço HTTPS e a chave em Ajustes para usar a Biblioteca do PC.');if(!/^https:\/\//i.test(url)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url))throw Error('Para conexão remota use HTTPS nos Ajustes.');return {url,token}}
async function req(path,data){const cfg=config();const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),150000);
 try{const r=await fetch(cfg.url+'/mobile/api/library/'+path,{method:data===undefined?'GET':'POST',headers:{Authorization:'Bearer '+cfg.token,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:ctrl.signal});if(!r.ok){let msg='Erro HTTP '+r.status;try{msg=(await r.json()).error||msg}catch(e){}throw Error(msg)}return r}finally{clearTimeout(timeout)}}
function lock(on){busy=on;['hlUpload','hlAnalyze','hlPreview','hlAiEdit','hlEdit','hlDownload'].forEach(id=>$(id).disabled=on)}
function show(t){$('hlOutput').hidden=false;$('hlOutput').textContent=String(t||'')}
function listRender(){const el=$('hlFiles');el.replaceChildren();if(!items.length){el.textContent='Nenhum arquivo encontrado.';return}
 items.forEach(f=>{const b=document.createElement('button');b.type='button';b.className='hlfile'+(selected===f.id?' active':'');b.textContent=f.name+' · '+(f.size/1024).toFixed(1)+' KB'+(f.version>1?' · v'+f.version:'');b.onclick=()=>{selected=f.id;listRender();status('Selecionado: '+f.name)};el.appendChild(b)})}
async function refresh(){try{const r=await req('list?q='+encodeURIComponent($('hlSearch').value.trim()));items=(await r.json()).items||[];if(!items.some(x=>x.id===selected))selected=null;listRender();status(items.length+' arquivo(s) disponíveis.')}catch(e){status('Biblioteca: '+e.message)}}
async function action(fn){if(busy)return;lock(true);try{await fn()}catch(e){status('Não foi possível concluir: '+e.message)}finally{lock(false)}}
function chosen(){if(!selected)throw Error('Selecione um arquivo da lista.');return items.find(x=>x.id===selected)}
function b64(array){let s='';for(let i=0;i<array.length;i+=16384)s+=String.fromCharCode(...array.subarray(i,i+16384));return btoa(s)}
function sendToChat(text,filename){const history=$('history');if(history){const bubble=document.createElement('div');bubble.className='bubble hidra';bubble.textContent='HIDRA · Análise de '+filename+'\n\n'+text;history.appendChild(bubble);history.scrollTop=history.scrollHeight;document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id==='conversation'));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab==='conversation'));}}
$('hlClose').onclick=()=>panel.hidden=true;
$('hlSearch').oninput=()=>{clearTimeout(timer);timer=setTimeout(refresh,300)};
$('hlUpload').onclick=()=>$('hlFile').click();
$('hlFile').onchange=()=>action(async()=>{const f=$('hlFile').files[0];if(!f)return;if(f.size>8*1024*1024)throw Error('Limite máximo de 8 MB por arquivo.');status('Armazenando '+f.name+'…');const arr=new Uint8Array(await f.arrayBuffer());await req('upload',{name:f.name,data:b64(arr)});$('hlFile').value='';await refresh();status('Arquivo salvo permanentemente na Biblioteca: '+f.name)});
$('hlPreview').onclick=()=>action(async()=>{const f=chosen();status('Lendo '+f.name+'…');const v=await(await req('preview?id='+encodeURIComponent(f.id))).json();show(v.text||'Sem prévia de texto disponível.');status('Conteúdo recuperado: '+f.name)});
$('hlAnalyze').onclick=()=>action(async()=>{const f=chosen();status('Analisando '+f.name+' com a HIDRA…');const v=await(await req('analyze',{id:f.id,instruction:'Analise objetivamente este arquivo: resumo, problemas e melhorias, sem repetir listas.'})).json();const text=v.analysis||'Sem resposta da IA.';show(text);sendToChat(text,f.name);status('Análise concluída e enviada para Conversas.');});
$('hlAiEdit').onclick=()=>action(async()=>{
 const f=chosen();
 if(!['.txt','.md','.py','.js','.json','.html','.css','.xml','.csv','.bat','.ini','.log','.yaml','.yml','.sql'].includes(f.ext))throw Error('Correção automática disponível somente para arquivos de texto e código.');
 const instruction=prompt('O que a HIDRA deve corrigir em '+f.name+'?', 'Corrija os erros deste arquivo, preserve as funções e devolva uma versão completa para download.');
 if(instruction===null)return;
 if(!instruction.trim())throw Error('Descreva a correção desejada.');
 status('A HIDRA está corrigindo '+f.name+'; aguarde a validação…');
 const v=await(await req('edit',{id:f.id,instruction:instruction.trim()})).json();
 if(!v.file||!v.file.id)throw Error('O servidor não retornou um arquivo corrigido.');
 await refresh();
 selected=v.file.id;listRender();
 const notice='Arquivo corrigido: '+v.file.name+' (v'+v.file.version+'). '+(v.message||'')+' Selecione BAIXAR para receber a versão modificada.';
 show(notice);sendToChat(notice,v.file.name);
 status('Correção salva. Arquivo selecionado para download: '+v.file.name);
});
$('hlEdit').onclick=()=>action(async()=>{const f=chosen();const v=await(await req('preview?id='+encodeURIComponent(f.id))).json();if(!['.txt','.md','.py','.js','.json','.html','.css','.xml','.csv','.bat','.ini','.log','.yaml','.yml','.sql'].includes(f.ext))throw Error('Edição de cópia disponível apenas para arquivos de texto/código.');const edited=prompt('Editar uma cópia de '+f.name+' (o original não será alterado):',v.text);if(edited===null)return;await req('version',{id:f.id,text:edited});await refresh();status('Nova versão criada; original preservado.');});
$('hlDownload').onclick=()=>action(async()=>{const f=chosen();const r=await req('download?id='+encodeURIComponent(f.id));const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status('Download iniciado: '+f.name)});
const tile=document.createElement('button');tile.type='button';tile.className='module';tile.id='libraryTile';tile.innerHTML='<span class="symbol">▧</span><span>Biblioteca</span>';tile.onclick=()=>{panel.hidden=false;$('hlOutput').hidden=true;refresh()};document.querySelector('.modules')?.appendChild(tile);
window.HIDRALibraryMobile={open:()=>tile.click(),refresh};
})();
