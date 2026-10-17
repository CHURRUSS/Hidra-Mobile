/* HIDRA Mobile 3.0 — roteador local / IA Python / comandos do Desktop.
   Compatível com a estrutura do repositório CHURRUSS/Hidra-Mobile em 17/10/2026. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={base:localStorage.getItem('hidra.base')||'',token:localStorage.getItem('hidra.token')||'',audio:null,busy:false,
 localOnly:localStorage.getItem('hidra.localOnly')==='true',privacy:localStorage.getItem('hidra.privacy')==='true',
 silent:localStorage.getItem('hidra.silent')==='true',pendingFact:false};
$('endpoint').value=state.base;$('token').value=state.token;
const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const plain=t=>norm(t).replace(/^(?:(?:ei|ola|oi)\s+)?(?:hidra|hydra|idra)\s*/, '').trim();
function base(){return(state.base||location.origin).replace(/\/$/,'')}
function status(t,ok){$('connection').textContent=t;$('connection').classList.toggle('ok',!!ok);$('hint').textContent=t==='CONECTADA'?'Núcleo local e servidor disponíveis':t}
function tab(name){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===name));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.tab===name))}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
function bubble(t,who){const el=document.createElement('div');el.className='bubble '+who;el.textContent=String(t||'');$('history').appendChild(el);$('history').scrollTop=$('history').scrollHeight;tab('conversation')}
async function api(path,opt={}){
 if(!state.token)throw Error('Configure a chave de pareamento nos Ajustes.');
 const timeout=path.startsWith('developer/')?195000:(path==='ai/chat'?155000:120000),ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),timeout);
 try{const res=await fetch(base()+'/mobile/api/'+path,{...opt,signal:ctl.signal,headers:{'Authorization':'Bearer '+state.token,'Content-Type':'application/json',...(opt.headers||{})}});
  if(!res.ok){let err='Erro '+res.status;try{err=(await res.json()).error||err}catch(e){}throw Error(err)}return res;
 }finally{clearTimeout(tm)}
}
async function ping(){if(state.privacy){status('PRIVACIDADE • LOCAL',true);return}if(state.localOnly){status('SOMENTE LOCAL',true);return}if(!state.token){status('MODO LOCAL',true);return}try{await api('health');status('CONECTADA',true)}catch(e){status('MODO LOCAL',true)}}
function browserSpeak(t){if(state.silent)return;try{if('speechSynthesis'in window&&'SpeechSynthesisUtterance'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=.93;u.pitch=.96;speechSynthesis.speak(u)}}catch(e){}}
async function speak(t){if(state.silent||!t)return;if(!state.privacy&&!state.localOnly&&state.token&&navigator.onLine){
 try{const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8500);let res;
 try{res=await fetch(base()+'/mobile/api/tts',{method:'POST',signal:ctl.signal,headers:{Authorization:'Bearer '+state.token,'Content-Type':'application/json'},body:JSON.stringify({text:t})})}finally{clearTimeout(timer)}
 if(!res.ok)throw Error('Voz do servidor indisponível');const blob=await res.blob();
 if(state.audio){state.audio.pause();if(state.audio._url)URL.revokeObjectURL(state.audio._url)}
 const url=URL.createObjectURL(blob),audio=new Audio(url);audio._url=url;state.audio=audio;audio.onended=()=>URL.revokeObjectURL(url);await audio.play();return
 }catch(e){} }
 browserSpeak(t); // Voz do navegador, quando suportada offline.
}
function localIntent(raw){const s=plain(raw);if(state.pendingFact)return true;
 if(!s||/^(hidra|hydra|idra)$/.test(norm(raw)))return true;
 if(/^(?:que horas|qual a hora|hora atual|me diga a hora|me fale a hora|que dia e hoje|qual a data|data de hoje|dia de hoje)/.test(s))return true;
 if(/^(?:oi|ola|bom dia|boa tarde|boa noite)(?:\s|$)/.test(s))return true;
 if(/\b(?:quem e voce|se apresente|seu nome|o que voce faz|quais comandos)\b/.test(s))return true;
 if(/^(?:ajuda|voce e inteligente|voce tem senso de humor|estou entediado|estou com tedio)$/.test(s))return true;
 if(/^(?:o que voce lembra|o que sabe sobre mim|liste minhas memorias|mostrar memorias|me lembra|me lembre|voce lembra|voce se lembra|repete|repita|pode repetir|me fala de novo|o que voce disse|o que voce falou)/.test(s))return true;
 if(/^(?:meu|minha)\s+.+\s+(?:se chama|e|eh|vale|tem o nome de)\s+.+$/.test(s))return true;
 if(/^(?:lembre|lembra|guarde|guarda|anote|anota|salve|salva)\s+(?:que\s+)?(?:meu|minha)\s+/.test(s))return true;
 if(/^(?:qual|como|o que|fale|lembra|se lembra|e sobre|sobre)\b/.test(s)&&/(?:meu|minha|sobre isso|nome dele|nome dela|assunto anterior|informacao anterior)/.test(s))return true;
 if(/^(?:esqueca|apague|remova|delete)\s+(?:a informacao\s+)?(?:sobre\s+)?/.test(s)&&s.length>8)return true;
 if(/^(?:e\s+)?(?:o que mais|tem mais alguma coisa|sabe mais alguma coisa|o assunto anterior|a informacao anterior)/.test(s))return true;
 return false;
}
function localAnswer(text){const s=plain(text);
 if(!s||/^(?:hidra|hydra|idra)$/.test(norm(text)))return 'Estou ouvindo, chefe.';
 const r=window.HIDRAIntelligence?.handle(text)?.text;
 if(!r)return 'O núcleo local ainda não carregou. Abra o aplicativo conectado uma vez para concluir a instalação offline.';
 if(/^(?:meu|minha)\s+.+\s+(?:se chama|e|eh|vale|tem o nome de)\s+.+$/.test(s)||/^(?:lembre|lembra|guarde|guarda|anote|anota|salve|salva)\s+(?:que\s+)?(?:meu|minha)/.test(s))state.pendingFact=/quer que eu guarde|deseja que eu me lembre|posso guardar/i.test(r);
 else if(state.pendingFact&&!/ainda preciso da sua confirmacao/i.test(norm(r)))state.pendingFact=false;
 return r;
}
function control(raw){const s=plain(raw);
 if(/^(?:modo offline|ficar offline|trabalhe offline|apenas offline|somente local)$/.test(s)){state.localOnly=true;localStorage.setItem('hidra.localOnly','true');status('SOMENTE LOCAL',true);return 'Modo local ativado. Continuarei disponível sem o computador e sem o servidor.'}
 if(/^(?:modo normal|modo online|voltar online|reconectar ao servidor)$/.test(s)){state.localOnly=false;state.privacy=false;localStorage.setItem('hidra.localOnly','false');localStorage.setItem('hidra.privacy','false');ping();return 'Modo normal ativado. Vou usar o servidor quando estiver acessível.'}
 if(/^(?:modo privacidade|ativar privacidade)$/.test(s)){state.privacy=true;localStorage.setItem('hidra.privacy','true');status('PRIVACIDADE • LOCAL',true);return 'Modo privacidade ativado. Não enviarei comandos ao servidor.'}
 if(/^(?:modo silencioso|ficar em silencio|silenciar)$/.test(s)){state.silent=true;localStorage.setItem('hidra.silent','true');try{speechSynthesis.cancel()}catch(e){}return 'Modo silencioso ativado. Vou responder apenas por texto.'}
 if(/^(?:modo ativo|modo voz|voltar a falar|pode falar)$/.test(s)){state.silent=false;localStorage.setItem('hidra.silent','false');return 'Modo de voz ativado, quando o celular disponibilizar síntese de fala.'}
 if(/^(?:pode descansar|pode repousar|encerre a conversa|encerrar conversa|fim da conversa|pare de me ouvir|ate depois|ate logo)$/.test(s))return 'Certo, chefe. Vou aguardar você me chamar.';
 if(/\b(?:abrir|abra|mostrar|mostre|meus|listar|liste|criar|crie)\b.*\blembretes?\b|^lembretes?$/.test(s)){if($('remindersTile'))$('remindersTile').click();return 'Abri seus lembretes locais. Você pode usá-los mesmo sem o servidor.'}
 if(/^(?:analisar arquivo|corrigir arquivo|abrir developer|abrir desenvolvedor|criar codigo|criar projeto)$/.test(s)){openDev();return 'Abri o HIDRA Developer. A análise com IA exige que o servidor e o Ollama estejam ligados.'}
 return null;
}
function newsIntent(raw){const s=plain(raw);return /^(?:noticias|ultimas noticias|noticias sobre .+|noticias de hoje|quais as noticias de hoje|mostre as noticias|me mostre as ultimas noticias|abra noticias|pesquise noticias sobre .+|quero ver noticias sobre .+)$/.test(s)}
function newsTopic(raw){const s=plain(raw),m=s.match(/(?:sobre|noticias de)\s+(.+)$/);return m?m[1]:'Brasil'}
function desktopIntent(raw){const s=plain(raw);
 return /(?:laboratorio cientifico|laboratorio atomico|orbital|simule o sistema solar|janela de noticias|mostre o estado do sistema|estado do computador|desempenho do pc|abra o painel|controle a janela)/.test(s);
}
async function remoteDesktop(text){const health=await(await api('desktop/status')).json();if(!health.online)throw Error('Esse módulo ainda exige a HIDRA Desktop aberta. A conversação comum e os comandos locais não exigem.');const res=await api('message',{method:'POST',body:JSON.stringify({text})});const {id}=await res.json();if(!id)throw Error('Desktop não aceitou o comando');for(let i=0;i<24;i++){
 await new Promise(r=>setTimeout(r,1000));const result=await(await api('result/'+encodeURIComponent(id))).json();if(result.status==='done')return result.text||'Comando concluído pelo Desktop.';if(result.status==='error')throw Error(result.error||'Falha no Desktop')}
 throw Error('O Desktop não respondeu. Essa função ainda exige a interface do computador aberta.');
}
async function send(input){const text=String(input||'').trim();if(!text||state.busy)return;state.busy=true;let handled=false;
 try{bubble(text,'me');if(window.HidraGPS&&window.HidraGPS.handle(text)){handled=true;return}
  if(newsIntent(text)&&window.HidraNews){window.HidraNews.open(newsTopic(text));handled=true;return}
  let response=control(text);if(response!==null){bubble(response,'hidra');await speak(response);handled=true;return}
  if(localIntent(text)){response=localAnswer(text);bubble(response,'hidra');await speak(response);handled=true;return}
  if(state.privacy||state.localOnly||!state.token||!navigator.onLine){response='Este pedido precisa do servidor. O núcleo local continua funcionando para comandos offline.';bubble(response,'hidra');await speak(response);handled=true;return}
  $('hint').textContent=desktopIntent(text)?'Consultando o Desktop…':(newsIntent(text)?'Buscando notícias pelo servidor…':'Conversando com o núcleo de IA…');
  if(newsIntent(text)){const res=await api('news?q='+encodeURIComponent(newsTopic(text)));const news=await res.json();response=(news.items||[]).slice(0,5).map((item,i)=>(i+1)+'. '+item.title+' — '+item.source).join('\n')||'Nenhuma notícia encontrada.'}
  else if(desktopIntent(text))response=await remoteDesktop(text);
  else{const res=await api('ai/chat',{method:'POST',body:JSON.stringify({text})});response=(await res.json()).text||'O servidor não retornou uma resposta.'}
  bubble(response,'hidra');$('hint').textContent='Pronta para conversar';await speak(response);handled=true;
 }catch(e){const message='Não consegui completar: '+(e.name==='AbortError'?'tempo limite da conexão':e.message);bubble(message,'hidra');$('hint').textContent='Núcleo local disponível';}
 finally{state.busy=false;if(!handled&&(!state.token||!navigator.onLine))status('MODO LOCAL',true)}
}
$('sendform').onsubmit=e=>{e.preventDefault();const t=$('message').value;$('message').value='';send(t)};
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.command)));
$('settingsTile').onclick=()=>{$('settings').hidden=false};$('closeSettings').onclick=()=>{$('settings').hidden=true};
$('save').onclick=()=>{state.base=$('endpoint').value.trim().replace(/\/$/,'');state.token=$('token').value.trim();localStorage.setItem('hidra.base',state.base);localStorage.setItem('hidra.token',state.token);$('settings').hidden=true;ping()};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('talk').onclick=()=>{if(!SR){$('hint').textContent='Reconhecimento de voz indisponível neste navegador. Use o campo de texto.';return}const r=new SR();r.lang='pt-BR';r.interimResults=false;r.maxAlternatives=1;$('talk').classList.add('listening');$('talk').textContent='🎙 OUVINDO...';r.onresult=e=>{const t=e.results[0][0].transcript;$('message').value=t;send(t)};r.onerror=e=>{$('hint').textContent='Microfone: '+e.error};r.onend=()=>{$('talk').classList.remove('listening');$('talk').textContent='🎙 ATIVAR MICROFONE'};try{r.start()}catch(e){$('hint').textContent='Não foi possível abrir o microfone'}};
const newsScript=document.createElement('script');newsScript.src='./news.js?v=13';newsScript.defer=true;document.head.appendChild(newsScript);
// Motor 1.2 extraído do CAPX, carregado como script local. O Service Worker o guarda para uso offline.
const core=document.createElement('script');core.src='./hidra-intelligence.js?v=12';core.async=false;core.onerror=()=>{$('hint').textContent='Falha ao carregar motor local. Conecte uma vez e recarregue.'};document.head.appendChild(core);
// Ferramentas de desenvolvimento, em um painel que não altera o layout original do PWA.
const style=document.createElement('style');style.textContent='#hidraDevPanel[hidden]{display:none}#hidraDevPanel{position:fixed;inset:0;z-index:9999;background:#04131cf5;color:#dffbff;overflow:auto;padding:12px;font:14px Arial,sans-serif}#hidraDevPanel .box{max-width:680px;margin:12px auto;background:#092438;border:1px solid #338ca5;padding:18px;border-radius:14px}#hidraDevPanel input,#hidraDevPanel textarea{display:block;width:100%;max-width:100%;box-sizing:border-box;background:#112e41;color:#eff;border:1px solid #528ca6;padding:10px;border-radius:8px;margin:7px 0}#hidraDevPanel button{margin:5px;padding:9px;border-radius:7px;background:#134258;color:#fff;border:1px solid #399ab6}#hidraDevOutput{white-space:pre-wrap;overflow-wrap:anywhere;max-height:40vh;overflow:auto}';document.head.appendChild(style);
const panel=document.createElement('section');panel.id='hidraDevPanel';panel.hidden=true;panel.innerHTML='<div class="box"><div style="display:flex;justify-content:space-between;align-items:center"><h2>HIDRA Developer</h2><button id="devClose" type="button">Fechar ✕</button></div><p>Arquivos são enviados somente ao servidor HIDRA configurado; não são executados. Preserve seus originais.</p><label>Arquivo para análise (até 2 MB)<input id="devFile" type="file" accept=".js,.py,.html,.css,.json,.xml,.txt,.capx,.zip,.md,.bat"></label><label>O que deseja verificar ou corrigir?<textarea id="devInstruction" rows="3" placeholder="Ex.: encontre erros neste código e proponha uma correção"></textarea></label><button type="button" id="devAnalyze">Analisar arquivo</button><button type="button" id="devRepair">Gerar cópia corrigida (texto)</button><button type="button" id="devGenerate">Criar arquivo do zero</button><pre id="hidraDevOutput" aria-live="polite"></pre></div>';document.body.appendChild(panel);
function openDev(){panel.hidden=false}
$('devClose').onclick=()=>{panel.hidden=true};const tile=document.createElement('button');tile.type='button';tile.className='module';tile.innerHTML='<span class="symbol">⌘</span><span>Developer</span>';tile.onclick=openDev;const tiles=document.querySelector('.modules');if(tiles)tiles.append(tile);
async function encodedFile(file){if(!file)throw Error('Escolha um arquivo.');if(file.size>2_000_000)throw Error('O arquivo excede o limite de 2 MB.');const b=new Uint8Array(await file.arrayBuffer());let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return {filename:file.name,data: btoa(s)}}
async function devPost(action,body){if(state.privacy||state.localOnly)throw Error('Desative o modo local/privacidade para usar a IA.');if(!state.token)throw Error('Configure o servidor e a chave de pareamento.');const r=await api('developer/'+action,{method:'POST',body:JSON.stringify(body)});return r.json()}
async function devAction(action){const output=$('hidraDevOutput'),instruction=$('devInstruction').value.trim();output.textContent='Processando no servidor HIDRA…';try{let body={instruction};if(action!=='generate')body={...body,...await encodedFile($('devFile').files[0])};else{body.filename=prompt('Nome do arquivo a criar (ex.: meu_script.py):','novo_codigo.py')||'';if(!body.filename)return}
 const result=await devPost(action,body);output.textContent=(result.report||result.message||'Resposta recebida')+(result.validation?'\nValidação: '+result.validation:'');
 if(result.file_base64&&result.filename){const bytes=atob(result.file_base64),a=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)a[i]=bytes.charCodeAt(i);const url=URL.createObjectURL(new Blob([a],{type:'application/octet-stream'}));const link=document.createElement('a');link.href=url;link.download=result.filename;link.textContent='⬇ Baixar '+result.filename+' (cópia de teste)';link.style.cssText='display:block;padding:12px;color:#a6f1ff';output.after(link);link.onclick=()=>setTimeout(()=>URL.revokeObjectURL(url),10000)}
 }catch(e){output.textContent='Não consegui concluir: '+e.message}}
$('devAnalyze').onclick=()=>devAction('analyze');$('devRepair').onclick=()=>devAction('repair');$('devGenerate').onclick=()=>devAction('generate');
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
window.addEventListener('online',ping);window.addEventListener('offline',()=>status('MODO LOCAL',true));ping();
})();
