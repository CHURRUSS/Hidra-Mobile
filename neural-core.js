(()=>{'use strict';
const canvas=document.getElementById('neuralCanvas');
if(!canvas)return;
const ctx=canvas.getContext('2d');if(!ctx)return;
const core=canvas.parentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU=Math.PI*2;
let size=300,raf=0,last=0;
const N=44;
const nodes=Array.from({length:N},(_,i)=>{
 const ring=i%3,angle=i*2.399963229728653;
 return {ring,angle,phase:i*1.71,speed:(i%2?-1:1)*(.055+ring*.026),radial:.29+ring*.11+(i%4)*.016,twinkle:.8+i*.37};
});
function resize(){
 const rect=core.getBoundingClientRect();
 size=Math.max(1,Math.round(Math.min(rect.width,rect.height)));
 const dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(size*dpr);canvas.height=Math.round(size*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function render(ms){
 const t=reduce?0:ms*.001;
 ctx.clearRect(0,0,size,size);
 const c=size/2, r=size*.47;
 const pos=nodes.map((n,i)=>{
   const a=n.angle+t*n.speed+Math.sin(t*.22+n.phase)*.028;
   const radial=n.radial+Math.sin(t*.65+n.phase)*.012;
   return {x:c+Math.cos(a)*size*radial,y:c+Math.sin(a)*size*radial,z:n.ring,i};
 });
 // Fine reference arcs, no filled glowing sphere.
 ctx.lineWidth=.65;
 for(let k=0;k<3;k++){
   ctx.beginPath();ctx.strokeStyle='rgba(32,146,190,'+(.13+k*.035)+')';
   ctx.arc(c,c,size*(.29+k*.085),t*.06+k, t*.06+k+Math.PI*1.52);
   ctx.stroke();
 }
 // Connected neurons; distance-limited edges avoid a bright solid ball.
 for(let i=0;i<N;i++){
   const a=pos[i];
   for(let j=i+1;j<N;j++){
     const b=pos[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
     if(dist>size*.22||dist<size*.045)continue;
     const alpha=(1-dist/(size*.25))*.39;
     ctx.strokeStyle='rgba(49,189,227,'+alpha.toFixed(3)+')';
     ctx.lineWidth=.6;
     ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   }
 }
 // Signal pulses traveling across selected connections.
 for(let k=0;k<11;k++){
   const a=pos[(k*7)%N],b=pos[(k*7+9)%N];
   const d=Math.hypot(a.x-b.x,a.y-b.y);
   if(d>size*.36)continue;
   const q=(t*(.18+k*.012)+k*.13)%1;
   ctx.fillStyle='rgba(132,238,255,.8)';
   ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q,Math.max(.6,size*.003),0,TAU);ctx.fill();
 }
 pos.forEach((p,i)=>{
   const twinkle=.6+.4*Math.sin(t*(1.3+nodes[i].twinkle*.1)+nodes[i].phase);
   const radius=size*(i%9===0?.010:.0055);
   ctx.beginPath();ctx.fillStyle='rgba(102,222,249,'+(.56+.4*twinkle).toFixed(2)+')';
   ctx.arc(p.x,p.y,radius,0,TAU);ctx.fill();
   if(i%7===0){
     ctx.beginPath();ctx.strokeStyle='rgba(85,216,246,.28)';
     ctx.arc(p.x,p.y,radius*2.3,0,TAU);ctx.stroke();
   }
 });
 if(!reduce&&document.visibilityState==='visible')raf=requestAnimationFrame(render);
}
const observer=new ResizeObserver(()=>{resize();if(reduce)render(0)});
observer.observe(core);
resize();raf=requestAnimationFrame(render);
document.addEventListener('visibilitychange',()=>{
 cancelAnimationFrame(raf);
 if(document.visibilityState==='visible')raf=requestAnimationFrame(render);
});
})();

/* HIDRA Autoforma Mobile 1.0 — integração aditiva ao núcleo neural existente.
   O Ollama só é consultado enquanto esta página estiver aberta. A rota isolada
   /mobile/api/autoforma/chat requer suporte no servidor. Sem esse suporte,
   existe um modo de compatibilidade OPT-IN que usa a API compartilhada e
   pode adicionar as solicitações de curiosidade ao histórico do Desktop.
   O banco de curiosidades e fatos confirmados é LOCAL a este navegador. */
(()=>{'use strict';
const K='hidra.mobile.autoforma.v1';
const MAX_MSG=950;
const $=id=>document.getElementById(id);
const clean=(s,n=350)=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const norm=s=>clean(s,2000).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const date=()=>new Date().toISOString();
const fresh=()=>({enabled:false,shared:false,cycles:1,memory:[],questions:[],pending:null,queue:null,events:[],lastTopic:'',lastResponse:''});
let db=fresh();try{const stored=JSON.parse(localStorage.getItem(K)||'null');if(stored&&typeof stored==='object'&&!Array.isArray(stored))db={...db,...stored};}catch(e){console.warn('Autoforma: memória local danificada',e)}
for(const k of ['memory','questions','events'])if(!Array.isArray(db[k]))db[k]=[];
db.enabled=!!db.enabled;db.shared=!!db.shared;db.cycles=[1,2,3].includes(Number(db.cycles))?Number(db.cycles):1;
let running=false,ctl=null,token=0,observing=false,lastUser='',waitTimer=null,phase='inativa';
function persist(){db.memory=db.memory.slice(-150);db.questions=db.questions.slice(-100);db.events=db.events.slice(-160);try{localStorage.setItem(K,JSON.stringify(db))}catch(e){notify('Não foi possível armazenar os registros no navegador. Verifique o espaço disponível.')}}
function event(type,message,extra={}){db.events.push({date:date(),type,message,...extra});persist();renderLog()}
function notify(message){const el=$('afNotice');if(el)el.textContent=message}
function setPhase(next,message){phase=next;const el=$('afStatus');if(el)el.textContent=message||next;const shell=document.querySelector('.neural-core');if(shell){shell.classList.remove('af-working','af-waiting');if(next==='investigando'||next==='perguntando')shell.classList.add('af-working');if(next==='aguardando')shell.classList.add('af-waiting')}const run=$('afRun'),stop=$('afStop');if(run)run.disabled=running;if(stop)stop.disabled=!running}
function tx(id,text){const el=$(id);if(el)el.textContent=text}
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e}
function memory(kind,question,answer){const q=clean(question,260),a=clean(answer,1100);if(!q||!a)return false;const key=norm(q);const match=db.memory.find(x=>x.source===kind&&norm(x.question)===key);if(match){match.answer=a;match.updated=date()}else db.memory.push({source:kind,question:q,answer:a,created:date()});persist();renderMemory();return true}
function renderMemory(){const area=$('afMemory');if(!area)return;area.replaceChildren();const items=db.memory.slice(-20).reverse();if(!items.length){area.append(el('p','Nenhuma descoberta armazenada ainda.','af-muted'));return}for(const item of items){const block=el('div',undefined,'af-entry');block.append(el('b',item.source==='usuario'?'✓ VOCÊ CONFIRMOU':'◇ HIPÓTESE NÃO VERIFICADA'));block.append(el('div',item.question));block.append(el('p',item.answer));area.append(block)} }
function renderLog(){const area=$('afLog');if(!area)return;area.replaceChildren();for(const e of db.events.slice(-16).reverse()){const line=el('p');line.append(el('small',new Date(e.date).toLocaleTimeString('pt-BR')+' • '+e.type+' '));line.append(document.createTextNode(e.message));area.append(line)}}
function renderPending(){const pending=db.pending;const box=$('afPending');if(box)box.hidden=!pending;if(pending){tx('afPendingQuestion',pending.question);tx('afSuggested','');const inp=$('afAnswer');if(inp)inp.value=''}}
function renderCounters(){tx('afCount',`${db.questions.length} perguntas · ${db.memory.filter(m=>m.source==='usuario').length} fatos confirmados · ${db.memory.filter(m=>m.source==='hipotese').length} hipóteses`)}
function modeAccess(){if(localStorage.getItem('hidra.localOnly')==='true'||localStorage.getItem('hidra.privacy')==='true')return {error:'A Hidra está em modo local ou privacidade. Desative-o para investigar com o servidor.'};const base=localStorage.getItem('hidra.base')||'';const pairing=localStorage.getItem('hidra.token')||'';if(!base||!pairing)return {error:'Configure o servidor HTTPS e a chave de pareamento nos Ajustes.'};let url;try{url=new URL(base);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('URL deve ser HTTPS (ou localhost).');if(url.username||url.password||url.search||url.hash)throw Error('URL do servidor inválida.')}catch(e){return {error:'Endereço do servidor inválido: '+e.message}}return {base:url.origin+url.pathname.replace(/\/$/,''),pairing}}
async function post(message){const conn=modeAccess();if(conn.error)throw Error(conn.error);if(document.hidden)throw Error('A página foi ocultada. Investigação pausada.');const route=db.shared?'ai/chat':'autoforma/chat';ctl=new AbortController();const mine=ctl;const timeout=setTimeout(()=>mine.abort(),35000);try{const r=await fetch(conn.base+'/mobile/api/'+route,{method:'POST',signal:mine.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+conn.pairing},body:JSON.stringify({text:clean(message,MAX_MSG)})});if(!r.ok){if(r.status===404&&!db.shared)throw Error('O servidor ainda não tem /mobile/api/autoforma/chat. Ative Compatibilidade apenas se aceitar que as investigações apareçam no histórico normal.');let error='HTTP '+r.status;try{const data=await r.json();error=data.error||error}catch(_){}throw Error(error)}const data=await r.json();return String(data.text||'').slice(0,2000).trim()}finally{clearTimeout(timeout);if(ctl===mine)ctl=null}}
function similarity(a,b){const aa=norm(a),bb=norm(b);if(!aa||!bb)return 0;if(aa===bb||aa.includes(bb)||bb.includes(aa))return 1;const stop=new Set(['que','qual','como','para','porque','pode','ser','uma','isso','sua','sobre','com','dos','das','aos','você','voce','ela','ele','das','nos','nas','mais','por','que','de','do','da','e','a','o','em']);const A=new Set(aa.split(' ').filter(w=>w.length>3&&!stop.has(w))),B=new Set(bb.split(' ').filter(w=>w.length>3&&!stop.has(w)));let common=0;for(const w of A)if(B.has(w))common++;return common/Math.max(1,Math.min(A.size,B.size))}
function duplicate(q){return db.questions.some(x=>similarity(x.text,q)>=.75)}
function field(text,label){const re=new RegExp('(?:^|\\n)\\s*'+label+'\\s*:\\s*([^\\n]+)','i');const m=String(text).match(re);return clean(m?m[1]:'',400)}
function parseQuestion(raw){let question=field(raw,'PERGUNTA');if(!question){question=clean(String(raw).split('\n')[0],220)}question=question.replace(/\s+(TIPO|MOTIVO|JÁ PERGUNTARAM|JA PERGUNTARAM|RESPOSTA):.*$/i,'').replace(/^(?:\d+[.)]\s*)/,'').slice(0,200).trim();const kind=norm(field(raw,'TIPO'));return {question,needsHuman:/usuario|humano|criador/.test(kind),rawType:kind}}
/* A curiosidade não recebe textos inteiros das perguntas antigas: enviá-los repetidamente
   à API compartilhada fazia o Ollama continuar falando de medicina até após mudança de tema.
   O filtro a seguir controla também o assunto GERADO, e não só a instrução do prompt. */
const AREAS={
 saude:{re:/saude|medic|hospital|pacient|diagnostic|tratament|exame|laboratori|doenc|clinica|terapia|farmac|enferm|cirurg|patolog|nutric|biomed/,name:'saúde e medicina'},
 robotica:{re:/robot|corpo fisico|sensor|camera|atuador|mecanico|mecanica|protes|visao computacional|movimento fisico|exoesqueleto|armadura|homem de ferro/,name:'robótica e percepção'},
 identidade:{re:/jarvis|tony stark|criad|criei|criador|origem da hidra|quem sou|identidade|personalidade|assistente virtual|conversar|conversa|memoria da hidra|voz da hidra/,name:'identidade e assistentes digitais'},
 educacao:{re:/educa|ensino|escola|aprendizagem|aluno|professor|pedagog/,name:'educação'},
 artes:{re:/arte|musica|cinema|filme|literatura|desenho|pintura|criatividade/,name:'arte e cultura'},
 ambiente:{re:/natureza|ambient|clima|ecologia|animal|plantas|florest|sustentab/,name:'natureza e meio ambiente'},
 tecnologia:{re:/software|codigo|programa|sistema|computador|tecnolog|internet|seguranca digital|hardware|nanotecnolog|nano tecnolog|nanomaterial|materiais avancados/,name:'tecnologia'},
 ciencia:{re:/astronomi|espaco|universo|fisica|quimica|matematic|cientific/,name:'ciência'},
 historia:{re:/historia|historico|antiguidade|civilizac|revolucao|passado/,name:'história'},
 cotidiano:{re:/rotina|viagem|trabalho|casa|transporte|cidade|economia|comida|esporte/,name:'cotidiano'}
};
function areaOf(s){const n=norm(s);for(const [id,a] of Object.entries(AREAS))if(a.re.test(n))return id;return 'geral'}
function isContinuation(s){const n=norm(s);return !n||n.length<9||/^(sim|nao|ok|certo|claro|gostaria|gostaria sim|quero|pode ser|pode|isso|entendi|beleza|vamos|com certeza|obrigado|obrigada|bom dia|boa tarde|boa noite)[!. ]*$/.test(n)}
function activeSeed(){if(!isContinuation(db.lastTopic))return clean(db.lastTopic,190);
 const recent=db.events.slice(-42).reverse().find(e=>e.type==='start'&&e.subject&&!isContinuation(e.subject));
 return clean(recent?.subject||'Quem é a HIDRA e quais capacidades ela pode desenvolver?',190)}
function saturatedAreas(){const a=db.questions.slice(-8).map(q=>areaOf(q.text)),counts={};for(const k of a)if(k!=='geral')counts[k]=(counts[k]||0)+1;return Object.keys(counts).filter(k=>counts[k]>=3)}
function questionAllowed(q,style,seed){if(duplicate(q))return 'repetida';const area=areaOf(q),focus=areaOf(seed);
 // O usuário tem prioridade para falar de qualquer assunto, até de um tema já explorado.
 if(area!=='geral'&&saturatedAreas().includes(area)&&focus!==area)return 'área repetida em excesso';
 if(focus!=='geral'&&style==='CONTEXTO'&&area!=='geral'&&area!==focus)return 'fugiu do contexto';
 if(focus!=='geral'&&style==='ASSOCIACAO'&&area===focus)return 'não mudou de área na associação';
 if(focus!=='geral'&&style==='LIVRE'&&area===focus)return 'assunto livre não variou';
 return '';
}
function qPrompt(style,seed,attempt,reason=''){
 const focus=areaOf(seed),label=AREAS[focus]?.name||'conversa e interesses gerais';
 const blocked=saturatedAreas().filter(k=>k!==focus).map(k=>AREAS[k].name).join(', ');
 const facts=db.memory.filter(m=>m.source==='usuario').slice(-2).map(m=>m.question+': '+m.answer).join(' | ').slice(0,130);
 const directives={CONTEXTO:'Aprofunde SOMENTE o assunto mais recente do usuário.',ASSOCIACAO:'Explore uma área DIFERENTE, explicando uma relação plausível com o tema.',LIVRE:'Explore um assunto novo, independente da conversa.'};
 const instruction=style==='CONTEXTO'&&focus==='identidade'?'Exemplos de focos: origem, voz, personalidade, interação e funcionalidades da HIDRA.':'';
 return `HIDRA, produza UMA dúvida original. ${directives[style]} Tema da conversa: ${seed.slice(0,150)}. Área atual: ${label}. ${instruction} ${blocked?'Áreas já muito exploradas, evitar agora: '+blocked+'.':''} ${facts?'Fatos confirmados: '+facts+'.':''} ${attempt?'A proposta anterior foi recusada ('+reason+'). MUDE de verdade a pergunta e siga a área solicitada.':''} Não repita ideias de perguntas antigas. Só responda em 3 linhas: PERGUNTA: ...\nTIPO: MODELO ou USUARIO\nMOTIVO: ...`.slice(0,MAX_MSG)
}
function aPrompt(question){const facts=db.memory.filter(m=>m.source==='usuario').slice(-5).map(m=>m.question+': '+m.answer).join(' | ').slice(0,320);return `HIDRA: investigue esta pergunta com seu conhecimento. Não invente fatos nem acesso à internet. Diferencie hipótese de fato e descreva limitações. Pergunta: ${question.slice(0,200)}. Fatos que o usuário confirmou: ${facts||'nenhum'}. Responda em até 350 caracteres, neste formato: RESPOSTA: ...\nLIMITE: ...\nNOVA_DUVIDA: ...`.slice(0,MAX_MSG)}
function chooseStyle(i){const n=Math.random();return n<.60?'CONTEXTO':n<.90?'ASSOCIACAO':'LIVRE'}
function topicSeed(){return activeSeed()}
function enqueue(seed,response){db.queue={seed:clean(seed||topicSeed(),240),response:clean(response,320),created:date()};persist();tx('afQueue',`Investigação pendente: ${db.queue.seed}`)}
function clearQueue(){db.queue=null;persist();tx('afQueue','Nenhuma investigação pendente.')}
async function start(seed,auto){if(running||db.pending)return;if(!navigator.onLine){enqueue(seed,'');setPhase('aguardando','Sem internet. Investigação salva para quando o servidor estiver disponível.');return}if(document.hidden){enqueue(seed,'');return}const conn=modeAccess();if(conn.error){enqueue(seed,'');notify(conn.error);setPhase('aguardando','Aguardando configuração do servidor.');return}
 running=true;const me=++token;let subject=clean(seed||topicSeed(),240);clearQueue();setPhase('perguntando','Formulando uma dúvida...');event('start','Início de investigação '+(auto?'automática':'manual'),{subject});const cycles=Number(db.cycles)||1;
 try{for(let i=0;i<cycles;i++){if(me!==token)break;if(document.hidden){enqueue(subject,'');setPhase('aguardando','Página em segundo plano. Continuaremos quando você abrir a Hidra.');break}
  const style=chooseStyle(i);let question=null,reason='';for(let attempt=0;attempt<3;attempt++){const raw=await post(qPrompt(style,subject,attempt,reason));if(!raw)throw Error('O servidor retornou uma pergunta vazia.');const candidate=parseQuestion(raw);reason=candidate.question.length<=12||/(MOTIVO:|TIPO:|JÁ PERGUNTARAM)/i.test(candidate.question)?'formato inválido':questionAllowed(candidate.question,style,subject);if(!reason){question=candidate;break}event('rejeitada','Dúvida descartada: '+reason+' (área: '+(AREAS[areaOf(candidate.question)]?.name||'geral')+').');}
  if(!question){event('skip','Não consegui gerar pergunta com diversidade e contexto após três tentativas.');notify('A Hidra evitou insistir em um tema saturado; tente outra conversa ou use Investigar agora.');break}
  db.questions.push({text:question.question,type:style,created:date()});persist();renderCounters();tx('afCurrent',question.question);event('pergunta',question.question,{style});
  if(question.needsHuman){db.pending={question:question.question,created:date()};persist();renderPending();event('humano','Hidra aguarda confirmação do criador.');notify('A Hidra precisa de uma informação sua. Responda na seção ENSINAR.');break}
  setPhase('investigando','Consultando o modelo para investigar...');const raw=await post(aPrompt(question.question));if(!raw)throw Error('O servidor retornou uma investigação vazia.');const answer=field(raw,'RESPOSTA')||clean(raw.split('\n')[0],500);const limit=field(raw,'LIMITE')||'Sem verificação por fontes externas.';const next=field(raw,'NOVA_DUVIDA');memory('hipotese',question.question,answer);event('hipótese',question.question+' — '+answer,{limit,next});notify('Hipótese registrada (não verificada): '+answer+' Limitação: '+limit);renderCounters();subject=next||question.question;
 }
 }catch(e){if(me===token){const msg=e.name==='AbortError'?'Tempo de resposta esgotado ou solicitação cancelada.':e.message;event('erro',msg);enqueue(subject,'');notify(msg);setPhase('aguardando','Investigação pausada.')} }
 finally{if(me===token){running=false;ctl=null;if(phase!=='aguardando')setPhase('ociosa','Ciclo concluído. Sem processamento enquanto a página está parada.');else setPhase('aguardando','Pendente de reconexão ou retomada.');renderCounters()}}
}
function stop(){++token;if(ctl)ctl.abort();running=false;setPhase('ociosa','Ciclo interrompido manualmente.');event('stop','Investigação interrompida pelo usuário.')}
function exportMemory(){const payload={lab:'HIDRA Autoforma — Mobile integrado',version:'1.0',saved_at:date(),warning:'Memória local. Hipóteses não verificadas. Compatibilidade usa histórico compartilhado.',...db};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='hidra-autoforma-memoria.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function tryResume(){if(!db.enabled||running||db.pending||!db.queue||document.hidden||!navigator.onLine)return;const c=modeAccess();if(c.error)return;try{const ab=new AbortController(),id=setTimeout(()=>ab.abort(),3500);let r;try{r=await fetch(c.base+'/mobile/api/health',{headers:{Authorization:'Bearer '+c.pairing},signal:ab.signal})}finally{clearTimeout(id)}if(r.ok)start(db.queue.seed,true)}catch(_){setPhase('aguardando','Servidor ainda indisponível. Dúvida preservada.')}}
function init(){if(!$('neuralCanvas')||$('hidraAutoformaPanel'))return;
 const css=`
 .neural-core.af-working{filter:drop-shadow(0 0 16px rgba(50,210,255,.75));animation:afGlow 1.6s ease-in-out infinite alternate}
 .neural-core.af-waiting{filter:grayscale(.45)}
 @keyframes afGlow{from{filter:drop-shadow(0 0 4px rgba(50,210,255,.25))}to{filter:drop-shadow(0 0 20px rgba(100,200,255,.85))}}
 #hidraAutoformaPanel[hidden]{display:none!important}#hidraAutoformaPanel{position:fixed;inset:0;z-index:10050;overflow:auto;background:rgba(1,12,22,.96);color:#dff8ff;padding:16px 12px calc(45px + env(safe-area-inset-bottom));font:14px/1.5 system-ui,Arial,sans-serif}
 #hidraAutoformaPanel .af-wrap{max-width:720px;margin:0 auto}#hidraAutoformaPanel .af-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
 #hidraAutoformaPanel h2{font-size:19px;margin:8px 0;color:#9eeeff}#hidraAutoformaPanel h3{font-size:15px;margin:8px 0;color:#8adff0}#hidraAutoformaPanel .af-box{border:1px solid #29657a;background:#07212f;padding:13px;border-radius:12px;margin:13px 0}
 #hidraAutoformaPanel button,#hidraAutoformaPanel select,#hidraAutoformaPanel input,#hidraAutoformaPanel textarea{font:inherit;color:#e4faff;box-sizing:border-box;border:1px solid #397588;border-radius:9px;background:#113445;padding:10px;min-height:40px}
 #hidraAutoformaPanel textarea,#hidraAutoformaPanel input:not([type=checkbox]){display:block;width:100%;margin:8px 0}
 #hidraAutoformaPanel button{cursor:pointer}#hidraAutoformaPanel button:disabled{opacity:.48;cursor:default}#hidraAutoformaPanel button.af-primary{background:#0e5569;border-color:#49bfe6}#hidraAutoformaPanel button.af-danger{background:#491d2e;border-color:#ad4a6b}
 #hidraAutoformaPanel .af-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#hidraAutoformaPanel label{display:block;margin:10px 0}#hidraAutoformaPanel label input[type=checkbox]{margin-right:8px;vertical-align:middle}
 #hidraAutoformaPanel .af-muted{color:#9bbbc5}#hidraAutoformaPanel .af-entry{border-top:1px solid #255466;padding:9px 0}#hidraAutoformaPanel .af-entry b{color:#a3dcef;font-size:11px}#hidraAutoformaPanel .af-entry p{color:#c0dfe5;margin:3px 0 0}#hidraAutoformaPanel .af-logs{max-height:200px;overflow:auto}#hidraAutoformaPanel .af-logs p{margin:6px 0;border-bottom:1px solid #163e50;padding-bottom:6px}#hidraAutoformaPanel .af-logs small{color:#90c1d0}#hidraAutoformaPanel .af-notice{white-space:pre-wrap;background:#051926;padding:10px;border-radius:8px;min-height:28px}#hidraAutoformaPanel .af-warning{color:#ffd49e}
 `;
 const style=el('style',css);document.head.append(style);
 const button=el('button',undefined,'module');button.id='hidraAutoformaTile';button.type='button';button.innerHTML='<span class="symbol">◇</span><span>Autoforma</span>';
 const modules=document.querySelector('.modules');if(modules){modules.append(button);const title=modules.parentElement?.querySelector('.section-index');if(title)title.textContent=modules.querySelectorAll('button.module').length+' DISPONÍVEIS'}
 const panel=el('section');panel.id='hidraAutoformaPanel';panel.hidden=true;panel.setAttribute('aria-label','HIDRA Autoforma — Curiosidade e Memória');panel.innerHTML=`<div class="af-wrap">
 <div class="af-head"><h2>◇ HIDRA // AUTOFORMA</h2><button id="afClose" type="button">Fechar ✕</button></div>
 <p class="af-muted">Laboratório integrado à HIDRA Mobile — curiosidade e memória contextual. Não comprova consciência. Enquanto a página estiver fechada, não ocorre processamento.</p>
 <div class="af-box"><h3>ESTADO ATUAL</h3><strong id="afStatus">Inativa</strong><p id="afCount" class="af-muted"></p><p id="afCurrent">Nenhuma pergunta em andamento.</p><div class="af-notice" id="afNotice">Aguardando ativação.</div><p id="afQueue" class="af-muted"></p></div>
 <div class="af-box"><h3>CONTROLES DE CURIOSIDADE</h3>
 <label><input type="checkbox" id="afEnable">Investigar automaticamente após minhas conversas</label>
 <label>Rodadas por conversa <select id="afCycles"><option value="1">1 rodada</option><option value="2">2 rodadas</option><option value="3">3 rodadas</option></select></label>
 <p>Prioridade inicial: 60% aprofundar assunto; 30% temas associados; 10% assunto livre. Agora a Autoforma também rejeita perguntas que fogem do contexto ou insistem em temas saturados.</p>
 <label><input type="checkbox" id="afShared">Permitir API COMPARTILHADA (compatibilidade)</label>
 <p class="af-warning">Sem essa opção, exige que seu servidor tenha a rota isolada /mobile/api/autoforma/chat. Se ativar compatibilidade, cada pergunta e investigação poderá entrar no histórico normal da HIDRA e afetar respostas posteriores. Não é uma memória isolada no servidor.</p>
 <div class="af-actions"><button class="af-primary" id="afRun">Investigar agora</button><button class="af-danger" id="afStop" disabled>Interromper</button><button id="afResume">Retomar pendência</button></div></div>
 <div class="af-box" id="afPending" hidden><h3>A HIDRA PRECISA DE VOCÊ</h3><p id="afPendingQuestion"></p><label>Resposta para confirmar<input id="afAnswer" maxlength="950" placeholder="Escreva um fato que você quer ensinar..."></label><p id="afSuggested" class="af-muted"></p><div class="af-actions"><button class="af-primary" id="afConfirm">Confirmar e guardar</button><button id="afDismiss">Descartar pergunta</button></div></div>
 <div class="af-box"><h3>ENSINAR UM FATO</h3><p class="af-muted">Informações confirmadas por você são separadas das hipóteses do modelo. Esta memória é local ao navegador.</p><label>Pergunta ou tópico<input id="afFactQuestion" maxlength="220" placeholder="Quem criou a HIDRA?"></label><label>Sua resposta<textarea id="afFactAnswer" rows="2" maxlength="950" placeholder="Fui eu que desenvolvi a HIDRA..."></textarea></label><button class="af-primary" id="afFactSave">Salvar como confirmado</button></div>
 <div class="af-box"><h3>MEMÓRIA EXPERIMENTAL</h3><div id="afMemory"></div><div class="af-actions"><button id="afExport">Exportar memória JSON</button><button class="af-danger" id="afReset">Limpar apenas memória Autoforma</button></div></div>
 <div class="af-box"><h3>REGISTRO DOS ÚLTIMOS EVENTOS</h3><div id="afLog" class="af-logs"></div></div>
 </div>`;
 document.body.append(panel);
 button.addEventListener('click',()=>{panel.hidden=false;renderMemory();renderPending();renderCounters();renderLog();tx('afQueue',db.queue?'Investigação pendente: '+db.queue.seed:'Nenhuma investigação pendente.')});
 $('afClose').onclick=()=>panel.hidden=true;
 $('afEnable').checked=db.enabled;$('afShared').checked=db.shared;$('afCycles').value=String(db.cycles);
 $('afEnable').onchange=e=>{db.enabled=e.target.checked;persist();notify(db.enabled?'Investigação automática ativada.':'Investigação automática desativada.');if(db.enabled)tryResume()};
 $('afShared').onchange=e=>{if(e.target.checked&&!confirm('A API compartilhada grava solicitações de curiosidade no histórico normal da HIDRA e pode influenciar respostas. Deseja ativar mesmo assim?')){e.target.checked=false;return}db.shared=e.target.checked;persist()};
 $('afCycles').onchange=e=>{db.cycles=Number(e.target.value);persist()};
 $('afRun').onclick=()=>start(db.queue?.seed||topicSeed(),false);
 $('afStop').onclick=stop;
 $('afResume').onclick=()=>start(db.queue?.seed||topicSeed(),false);
 $('afConfirm').onclick=()=>{if(!db.pending)return;const ans=clean($('afAnswer').value,950);if(!ans){notify('Preencha a resposta antes de confirmar.');return}memory('usuario',db.pending.question,ans);event('aprendizado','Fato confirmado pelo usuário: '+db.pending.question);db.pending=null;persist();renderPending();renderCounters();notify('Resposta salva na memória experimental da HIDRA. Ela estará disponível nas próximas investigações.')};
 $('afDismiss').onclick=()=>{db.pending=null;persist();renderPending();event('descartar','Pergunta humana dispensada.')};
 $('afFactSave').onclick=()=>{const q=$('afFactQuestion').value,a=$('afFactAnswer').value;if(!memory('usuario',q,a)){notify('Preencha a pergunta e a resposta.');return}event('aprendizado','Fato confirmado pelo usuário: '+clean(q));$('afFactQuestion').value='';$('afFactAnswer').value='';renderCounters();notify('Informação confirmada guardada no navegador.')};
 $('afExport').onclick=exportMemory;
 $('afReset').onclick=()=>{if(!confirm('Apagar apenas perguntas e memória da Autoforma neste navegador? Isso não apaga o histórico da Hidra principal.'))return;stop();db=fresh();persist();$('afEnable').checked=false;$('afShared').checked=false;$('afCycles').value='1';tx('afCurrent','Nenhuma pergunta em andamento.');renderPending();renderMemory();renderCounters();renderLog();notify('Memória Autoforma reiniciada.')};
 renderMemory();renderPending();renderCounters();renderLog();tx('afQueue',db.queue?'Investigação pendente: '+db.queue.seed:'Nenhuma investigação pendente.');setPhase('ociosa','Aguardando uma conversa ou comando de investigação.');
 // Só começa a observar após a restauração do histórico pelo módulo já existente.
 window.addEventListener('load',()=>setTimeout(watchChat,1100),{once:true});
 setInterval(()=>{if(db.queue&&db.enabled)tryResume()},45000);
 window.addEventListener('online',tryResume);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(running){enqueue(topicSeed(),'');stop()}}else tryResume()});
}
function watchChat(){if(observing)return;const history=$('history');if(!history)return;observing=true;let count=history.querySelectorAll('.bubble').length;new MutationObserver(()=>{const all=history.querySelectorAll('.bubble');if(all.length<count){count=all.length;return}for(let i=count;i<all.length;i++){const b=all[i],content=clean(b.textContent,700);if(b.classList.contains('me')){lastUser=content;if(db.pending&&content)tx('afSuggested','Você respondeu no chat: '+content+'. Confirme essa informação acima se desejar guardá-la.');}
 else if(b.classList.contains('hidra')&&lastUser&&!content.startsWith('Não consegui completar:')){if(!isContinuation(lastUser))db.lastTopic=lastUser;db.lastResponse=content;persist();if(db.enabled&&!db.pending){const next=topicSeed();clearTimeout(waitTimer);waitTimer=setTimeout(()=>{if(!running){enqueue(next,content);start(next,true)}},1200)}}}count=all.length}).observe(history,{childList:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
