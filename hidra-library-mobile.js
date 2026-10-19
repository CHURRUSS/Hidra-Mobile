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
#hlAttachmentChip{display:flex;align-items:center;gap:8px;margin:5px 0 8px;padding:7px 10px;border:1px solid #368ca6;border-radius:9px;background:#09283b;color:#d5f8ff;font:12px Arial,sans-serif}
#hlAttachmentChip[hidden]{display:none!important}
#hlAttachmentChip span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hlAttachmentChip button{border:0;background:transparent;color:#d5f8ff;font-size:19px;padding:0 5px}
#hidraLibraryMobile .hlstatus{font-size:12px;color:#8cc8dd;min-height:16px}
`;document.head.appendChild(css);
const panel=document.createElement('section');panel.id='hidraLibraryMobile';panel.hidden=true;
panel.innerHTML=`<div class="hlbox"><div class="hlrow hlhead"><strong>HIDRA / BIBLIOTECA</strong><button id="hlClose" type="button">FECHAR ✕</button></div>
<input id="hlSearch" placeholder="Pesquisar arquivos da Biblioteca" aria-label="Pesquisar na biblioteca">
<div class="hlrow"><button type="button" id="hlUpload">+ ANEXAR</button><button type="button" id="hlAnalyze">ANALISAR</button><button type="button" id="hlPreview">VER CONTEÚDO</button><button type="button" id="hlAiEdit">CORRIGIR COM IA</button><button type="button" id="hlEdit">EDITAR CÓPIA</button><button type="button" id="hlDownload">BAIXAR</button><button type="button" id="hlDelete">EXCLUIR</button></div>
<input id="hlFile" type="file" hidden accept=".txt,.md,.py,.js,.json,.html,.css,.xml,.csv,.bat,.ini,.log,.yaml,.yml,.sql,.capx,.zip,.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp">
<div class="hlstatus" id="hlStatus" aria-live="polite"></div>
<div class="hlfiles" id="hlFiles"></div><div id="hlOutput" class="hltext" hidden></div></div>`;
document.body.appendChild(panel);
let items=[],selected=null,busy=false,timer=null,pendingFile=null,pendingBytes=null,pendingLoading=false,pickEpoch=0,lastFile=null;
function status(t){$('hlStatus').textContent=t}
function config(){const url=(localStorage.getItem('hidra.base')||'').trim().replace(/\/$/,'');const token=(localStorage.getItem('hidra.token')||'').trim();if(!url||!token)throw Error('Configure o endereço HTTPS e a chave em Ajustes para usar a Biblioteca do PC.');if(!/^https:\/\//i.test(url)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url))throw Error('Para conexão remota use HTTPS nos Ajustes.');return {url,token}}
async function req(path,data){const cfg=config();const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),150000);
 try{const r=await fetch(cfg.url+'/mobile/api/library/'+path,{method:data===undefined?'GET':'POST',headers:{Authorization:'Bearer '+cfg.token,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:ctrl.signal});if(!r.ok){let msg='Erro HTTP '+r.status;try{msg=(await r.json()).error||msg}catch(e){}throw Error(msg)}return r}finally{clearTimeout(timeout)}}
function lock(on){busy=on;['hlUpload','hlAnalyze','hlPreview','hlAiEdit','hlEdit','hlDownload','hlDelete'].forEach(id=>$(id).disabled=on)}
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
$('hlFile').onchange=()=>action(async()=>{const f=$('hlFile').files[0];if(!f)return;if(f.size>8*1024*1024)throw Error('Limite máximo de 8 MB por arquivo.');status('Armazenando '+f.name+'…');const arr=new Uint8Array(await f.arrayBuffer());const v=await(await req('upload',{name:f.name,data:b64(arr)})).json();lastFile=v.file||null;$('hlFile').value='';await refresh();status('Arquivo salvo permanentemente na Biblioteca: '+f.name)});
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
$('hlDelete').onclick=()=>action(async()=>{const f=chosen();if(!confirm('Excluir permanentemente '+f.name+' da Biblioteca? Esta ação não pode ser desfeita.'))return;await req('delete',{id:f.id});if(lastFile?.id===f.id)lastFile=null;if(pendingFile?.id===f.id){pendingFile=null;document.getElementById('hlAttachmentChip')?.setAttribute('hidden','')}selected=null;await refresh();status('Arquivo excluído: '+f.name)});
$('hlDownload').onclick=()=>action(async()=>{const f=chosen();const r=await req('download?id='+encodeURIComponent(f.id));const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status('Download iniciado: '+f.name)});
const tile=document.createElement('button');tile.type='button';tile.className='module';tile.id='libraryTile';tile.innerHTML='<span class="symbol">▧</span><span>Biblioteca</span>';tile.onclick=()=>{panel.hidden=false;$('hlOutput').hidden=true;refresh()};document.querySelector('.modules')?.appendChild(tile);
// Anexo no compositor: escolha primeiro, escreva a instrução e envie ambos juntos.
const form=document.getElementById('sendform');
if(form && !document.getElementById('hlComposerAttach')){
 const attach=document.createElement('button');attach.type='button';attach.id='hlComposerAttach';attach.textContent='＋';
 attach.setAttribute('aria-label','Selecionar arquivo para a conversa');attach.title='Anexar arquivo à mensagem';
 attach.style.cssText='flex:0 0 42px;min-width:42px;height:42px;border:1px solid #398ba7;border-radius:10px;background:#10394e;color:#d5f8ff;font-size:26px;line-height:1;cursor:pointer;';
 const picker=document.createElement('input');picker.type='file';picker.id='hlChatFile';picker.hidden=true;
 picker.accept=$('hlFile').accept;document.body.appendChild(picker);
 attach.addEventListener('click',()=>picker.click());form.insertBefore(attach,form.firstChild);
 const chip=document.createElement('div');chip.id='hlAttachmentChip';chip.hidden=true;
 const name=document.createElement('span');const remove=document.createElement('button');remove.type='button';remove.textContent='✕';remove.setAttribute('aria-label','Remover anexo');
 chip.append(name,remove);form.parentElement.insertBefore(chip,form);
 function renderPending(){chip.hidden=!pendingFile;if(pendingFile)name.textContent='📎 '+pendingFile.name}
 remove.onclick=()=>{pickEpoch++;pendingFile=null;pendingBytes=null;pendingLoading=false;picker.value='';renderPending();clearProgress();};
 // No Android, o provedor de arquivos pode invalidar a referencia depois que o seletor fecha.
 // Fazemos a leitura AGORA e guardamos apenas os bytes na memoria, antes do clique em Enviar.
 picker.onchange=async()=>{
   const file=picker.files[0];if(!file)return;
   const ticket=++pickEpoch;
   pendingFile=null;pendingBytes=null;pendingLoading=true;renderPending();
   if(file.size>8*1024*1024){pendingLoading=false;picker.value='';progress('Arquivo maior que 8 MB. Escolha um arquivo menor.',true);return;}
   progress('Lendo o arquivo '+file.name+' no celular...');
   try{
     const bytes=new Uint8Array(await file.arrayBuffer());
     if(ticket!==pickEpoch)return;
     if(!bytes.length)throw Error('O arquivo está vazio.');
     pendingFile={name:file.name,size:file.size};
     pendingBytes=bytes;
     picker.value=''; // os bytes ja estao em memoria; nao precisamos mais do acesso ao arquivo original
     renderPending();
     progress('Anexo pronto para enviar: '+file.name+'.');
   }catch(err){
     if(ticket!==pickEpoch)return;
     pendingFile=null;pendingBytes=null;picker.value='';renderPending();
     const cause=err?.name==='NotFoundError'?'O Android não conseguiu localizar os dados do arquivo selecionado.':(err?.message||'Falha de leitura.');
     const help='Abra o app Arquivos, procure na pasta Downloads e selecione o arquivo salvo no armazenamento interno. Se estiver em Recentes, Drive ou outro app, salve uma cópia em Downloads primeiro.';
     progress('Falha ao ler '+file.name+': '+cause+' '+help,true);
     status('Falha ao ler o anexo no celular: '+cause);
   }finally{if(ticket===pickEpoch)pendingLoading=false;}
 };
 // Mostra o andamento ao lado do campo de mensagem; nao esconde falhas na Biblioteca.
 const transferStatus=document.createElement('div');
 transferStatus.id='hlChatTransferStatus';transferStatus.hidden=true;
 transferStatus.setAttribute('role','status');transferStatus.setAttribute('aria-live','polite');
 transferStatus.style.cssText='box-sizing:border-box;width:100%;margin:4px 0 9px;padding:9px 11px;border:1px solid #398ba7;border-radius:9px;background:#09283b;color:#b4edfb;font:12px/1.45 Arial,sans-serif;overflow-wrap:anywhere';
 form.parentElement.insertBefore(transferStatus,form);
 function progress(message,isError=false){
   transferStatus.hidden=false;transferStatus.textContent=message;
   transferStatus.style.borderColor=isError?'#df7777':'#398ba7';
   transferStatus.style.color=isError?'#ffd3d3':'#b4edfb';
 }
 function clearProgress(){transferStatus.hidden=true;transferStatus.textContent='';}
 function chatMessage(message,who='hidra'){
   const history=$('history');if(!history)return null;
   const el=document.createElement('div');el.className='bubble '+who;el.textContent=message;
   history.appendChild(el);history.scrollTop=history.scrollHeight;
   document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id==='conversation'));
   document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab==='conversation'));
   return el;
 }
 function reportError(err,operation){
   let message=err?.name==='AbortError'?'Tempo limite de conexão com o servidor.':(err?.message||String(err));
   if(operation==='edit'&&/(?:a[cç][aã]o desconhecida|HTTP 404|rota n[aã]o encontrada)/i.test(message))
     message='O servidor Python não reconhece a rota de correção de arquivos (/mobile/api/library/edit). É necessário atualizar hidra_mobile_bridge.py no PC.';
   return String(message).slice(0,380);
 }
 const originalFormSubmit=e=>{
   const message=$('message');
   const instruction=message.value.trim();
   // Reutilize o ultimo arquivo somente quando a mensagem se referir explicitamente a ele.
   const followup=!pendingFile&&!!lastFile&&
     /(?:\barquivo\b|\bc[oó]digo\b|\bvers[aã]o\b|\bfun[cç][aã]o\b)/i.test(instruction)&&
     /(?:corrig|corrij|consert|modifi|alter|edit|reescrev|melhor|ajust|refator|devolv|analis|analise|verifi|mostr|explic)/i.test(instruction);
   if(!pendingFile&&!followup&&!pendingLoading)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(pendingLoading){progress('Aguarde a leitura do anexo terminar antes de enviar.');return;}
   if(busy){progress('Aguarde: ainda estou processando o arquivo anterior.');return}
   if(!instruction){progress('Escreva o que a HIDRA deve fazer com o arquivo.',true);return}
   const selectedFile=pendingFile;
   const selectedBytes=pendingBytes;
   const filename=selectedFile?selectedFile.name:lastFile.name;
   const wantsEdit=/(?:corrig|corrij|consert|modifi|alter|edit|reescrev|melhor|ajust|refator|devolv|gere|crie|atualiz)/i.test(instruction);
   const operation=wantsEdit?'edit':'analyze';
   (async()=>{
     lock(true);
     let phase='conexao';
     try{
       config(); // verificar HTTPS e pareamento antes de registrar a solicitacao
       chatMessage('📎 '+filename+'\n'+instruction,'me');
       // Apos Enviar, a mensagem vai para o historico e o compositor fica livre.
       message.value='';
       if(selectedFile){pendingFile=null;pendingBytes=null;picker.value='';renderPending();}
       clearProgress();
       let info=lastFile;
       if(selectedFile){
         if(!selectedBytes?.length)throw Error('Anexo não carregado. Selecione o arquivo novamente.');
         phase='envio';
         // Andamento interno; a barra do terminal nao deve permanecer visivel.
         const uploaded=await(await req('upload',{name:selectedFile.name,data:b64(selectedBytes)})).json();
         info=uploaded.file;
         if(!info?.id)throw Error('O servidor não confirmou o recebimento do arquivo.');
         lastFile=info;
       }
       if(!info?.id)throw Error('O servidor não retornou o identificador do arquivo.');
       phase=operation==='edit'?'correcao':'analise';
       // O resultado sera apresentado apenas na conversa.
       const result=await(await req(operation,{id:info.id,instruction})).json();
       if(operation==='edit'){
         if(!result.file?.id)throw Error('O servidor não retornou uma versao corrigida.');
         lastFile=result.file;
         const bubble=chatMessage('HIDRA · Arquivo corrigido: '+result.file.name+'\n'+(result.message||'Versão salva na Biblioteca.'),'hidra');
         if(bubble){
           const download=document.createElement('button');download.type='button';download.textContent='⬇ Baixar '+result.file.name;
           download.style.cssText='display:block;margin-top:9px;padding:9px 12px;border:1px solid #4ba4c4;border-radius:8px;background:#104258;color:#dffaff;cursor:pointer';
           download.onclick=async()=>{
             if(busy)return;
             lock(true);
             try{
               clearProgress();
               const response=await req('download?id='+encodeURIComponent(result.file.id));
               const blob=await response.blob();const url=URL.createObjectURL(blob);
               const a=document.createElement('a');a.href=url;a.download=result.file.name;document.body.appendChild(a);a.click();a.remove();
               setTimeout(()=>URL.revokeObjectURL(url),30000);
               clearProgress(); // O Android confirma o download na barra de notificacoes.
             }catch(err){const msg=reportError(err,'download');clearProgress();chatMessage('HIDRA · Não consegui baixar o arquivo: '+msg,'hidra')}
             finally{lock(false)}
           };
           bubble.appendChild(download);
         }
         clearProgress();
       }else{
         sendToChat(result.analysis||'A análise não retornou texto.',info.name);
         clearProgress();
       }
     }catch(err){
       const reason=reportError(err,operation);
       const step={conexao:'conexão com o servidor',envio:'envio do arquivo',correcao:'correção pelo servidor',analise:'análise pelo servidor'}[phase]||'processamento';
       clearProgress();
       status('Falha na etapa '+step+': '+reason);
       chatMessage('HIDRA · Não consegui processar '+filename+'.\nEtapa: '+step+'.\nMotivo: '+reason,'hidra');
       // Em caso de falha, restaurar o rascunho para facilitar nova tentativa.
       if(!message.value.trim())message.value=instruction;
       if(selectedFile&&selectedBytes?.length&&!pendingFile){pendingFile=selectedFile;pendingBytes=selectedBytes;renderPending();}
     }finally{lock(false)}
   })();
 };
 form.addEventListener('submit',originalFormSubmit,true);
 // Keep send button working even if other scripts call submit programmatically.
}
window.HIDRALibraryMobile={open:()=>tile.click(),refresh};
})();
