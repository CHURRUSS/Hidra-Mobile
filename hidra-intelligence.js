/* HIDRA Intelligence Core 1.2 - contexto de conversa - aprendizado confirmado e consulta local */
(function(){
'use strict';
var KEY='hidra2.memory.v1',CONTEXT_KEY='hidra2.context.v1',memory={},pending=null,topic='',recent=[],clarify=null,conversation={lastTopic:'',previousTopic:'',lastValue:''};
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function strip(s){return norm(s).replace(/^(?:(?:ei|ola|oi)\s+)?(?:hidra|hydra)\s*/, '').trim();}
function key(s){return norm(s).replace(/^(?:o nome d[ao]\s+|nome d[ao]\s+|d[ao]\s+|o\s+|a\s+|meu\s+|minha\s+)+/g,'').replace(/\s+$/,'');}
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');if(d&&typeof d==='object'&&!Array.isArray(d))Object.keys(d).forEach(function(k){if(typeof d[k]==='string')memory[k]=d[k];});}catch(e){console.warn('HIDRA: falha ao ler memoria',e);}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(memory));return true;}catch(e){console.warn('HIDRA: falha ao salvar',e);return false;}}
function out(s){return {text:s};}
function saveContext(){try{localStorage.setItem(CONTEXT_KEY,JSON.stringify({lastTopic:conversation.lastTopic,previousTopic:conversation.previousTopic}));}catch(e){}}
function activeTopic(){
 if(topic&&Object.prototype.hasOwnProperty.call(memory,topic))return topic;
 if(conversation.lastTopic&&Object.prototype.hasOwnProperty.call(memory,conversation.lastTopic))return conversation.lastTopic;
 var keys=Object.keys(memory);
 return keys.length===1?keys[0]:null;
}
function rememberTopic(k){if(k){if(conversation.lastTopic!==k){conversation.previousTopic=conversation.lastTopic;conversation.lastTopic=k;}topic=k;recent.push(k);if(recent.length>8)recent.shift();saveContext();}}
function resolve(k){k=key(k);if(Object.prototype.hasOwnProperty.call(memory,k))return k;
 var words=k.split(' ').filter(Boolean);var matches=Object.keys(memory).filter(function(x){return x===k||x.split(' ').some(function(w){return words.indexOf(w)>=0;});});
 return matches.length===1?matches[0]:null;}
function responseFor(k){if(k&&Object.prototype.hasOwnProperty.call(memory,k)){rememberTopic(k);conversation.lastValue=memory[k];return 'Você me informou que '+k+' é '+memory[k]+'.';}return null;}
function contextual(s){
 if(/^(?:e\s+)?(?:qual\s+(?:e|era)\s+)?(?:o\s+)?nome\s+d(?:ele|ela|isso)(?:\s+mesmo)?$/.test(s)||/^(?:e\s+)?(?:qual\s+(?:e|era)\s+)?(?:o\s+)?nome\s+(?:dele|dela)(?:\s+mesmo)?$/.test(s)||/^(?:e\s+)?(?:qual\s+(?:e|era)\s+)?(?:o\s+)?nome\s+mesmo(?:\s+dele|\s+dela)?$/.test(s)||/^(?:e\s+)?(?:qual\s+(?:e|era)\s+)?(?:o\s+)?nome\s+dele\s+mesmo$/.test(s)||/^(?:e\s+)?(?:ele|ela|isso)(?:\s+mesmo)?$/.test(s)||/^(?:e\s+)?(?:o\s+que\s+voce\s+sabe\s+)?sobre\s+isso$/.test(s)||/^(?:lembra|se lembra)\s+d(?:ele|ela|isso)$/.test(s)){
  if(topic&&memory[topic])return responseFor(topic);
  return 'De qual informação você está falando? Pode mencionar o assunto?';
 }
 return null;
}
function queryKey(s){var m=s.match(/^(?:qual (?:e|era|eh)\s+|me (?:diga|fale|lembre)\s+|voce (?:sabe|lembra)\s+)(?:o nome\s+)?(?:d[ao]\s+)?(?:meu|minha)\s+(.+?)\s*(?:mesmo)?$/);
 if(m)return key(m[1]);m=s.match(/^(?:como (?:se chama|chama)|qual (?:e|era) o nome de)\s+(?:o|a)?\s*(?:meu|minha)\s+(.+)$/);if(m)return key(m[1]);
 m=s.match(/^(?:o que (?:voce )?(?:sabe|lembra) sobre|fale sobre|lembra de|se lembra de)\s+(.+)$/);return m?key(m[1]):null;}

function fact(s){s=strip(s).replace(/^(?:lembre|lembra|guarde|guarda|anote|anota|salve|salva)\s+(?:que\s+)?/,'');
 var m=s.match(/^(?:o\s+)?(meu|minha)\s+(.+?)\s+(?:se chama|e|eh|vale|tem o nome de)\s+(.+)$/);
 if(!m)return null;var subject=key(m[2]),value=m[3].trim();if(!subject||!value)return null;return {key:subject,label:m[1]+' '+m[2],value:value};}
function lookup(s){var m=s.match(/^(?:qual (?:e|eh)\s+|me diga\s+|me fale\s+|voce sabe\s+)(?:o nome\s+)?(?:d[ao]\s+)?(?:meu|minha)\s+(.+?)\s*$/);
 if(m)return key(m[1]);m=s.match(/^(?:o que voce sabe sobre|o que lembra sobre|fale sobre|lembra de)\s+(.+)$/);return m?key(m[1]):null;}
function handle(input){var s=strip(input),d=new Date(),m,k,p;if(!s)return out('Não entendi. Pode repetir?');
 if(pending){if(/^(sim|sim pode|pode sim|pode|pode guardar|confirmo|confirmado|salve|salvar|guarde|claro|isso|correto|com certeza|sim guarde|sim pode guardar)(\s+.*)?$/.test(s)){
  p=pending;pending=null;memory[p.key]=p.value;rememberTopic(p.key);return out(save()?'Informação sobre '+p.label+' armazenada.':'Não consegui salvar a informação.');}
  if(/^(nao|cancela|cancelar|esquece|deixa pra la)(\s+.*)?$/.test(s)){pending=null;return out('Certo, não vou guardar essa informação.');}
  return out('Ainda preciso da sua confirmação. Diga sim para guardar ou não para cancelar.');}
 if(/^(que horas|qual a hora|hora atual|me diga a hora|me fale a hora)/.test(s))return out('Agora são '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.');
 if(/(que dia e hoje|qual a data|data de hoje|dia de hoje)/.test(s))return out('Hoje é '+d.toLocaleDateString('pt-BR',{dateStyle:'full'})+'.');
 if(/(quem e voce|se apresente|seu nome)/.test(s))return out('Eu sou HIDRA, Hub de Inteligência Digital e Respostas Adaptáveis. Minha memória é local.');
 if(/^(oi|ola|bom dia|boa tarde|boa noite)(\s|$)/.test(s))return out('Olá! Estou ouvindo você.');
 if(/(ajuda|o que voce faz|quais comandos)/.test(s))return out('Você pode dizer: meu jogo se chama MiniRP. Depois confirme com sim e pergunte: qual é o nome do meu jogo?');
 if(/^(o que voce lembra|o que sabe sobre mim|liste minhas memorias|mostrar memorias)$/.test(s)){var ks=Object.keys(memory);return out(ks.length?'Lembro destas informações: '+ks.map(function(x){return x+': '+memory[x];}).join('; ')+'.':'Ainda não tenho informações guardadas.');}
 m=s.match(/^(?:esqueca|apague|remova|delete)\s+(?:a informacao\s+)?(?:sobre\s+)?(.+)$/);if(m){k=key(m[1]);if(Object.prototype.hasOwnProperty.call(memory,k)){delete memory[k];if(topic===k)topic='';if(conversation.lastTopic===k)conversation.lastTopic='';if(conversation.previousTopic===k)conversation.previousTopic='';saveContext();save();return out('Esqueci a informação sobre '+k+'.');}return out('Não encontrei informação sobre '+k+'.');}
 p=fact(s);if(p){pending=p;rememberTopic(p.key);return out('Entendi: '+p.label+' é '+p.value+'. Quer que eu guarde essa informação?');}
 // Contexto de fatos: a HIDRA responde sem exigir que o usuário repita o assunto.
 if(/^(?:e )?(?:qual era|qual e|qual eh|me lembra|me lembre|voce lembra|voce se lembra)(?: o nome)?(?: mesmo)?(?: disso|dele|dela|desse assunto)?(?: mesmo)?$/.test(s) || /^(?:repete|repita|pode repetir|me fala de novo|me diga novamente|o que voce disse|o que voce falou)(?: por favor)?$/.test(s)){
  var last=activeTopic();if(last)return out(responseFor(last));
  return out(Object.keys(memory).length?'Sobre o que deseja que eu lembre, senhor? Tenho informações sobre '+Object.keys(memory).join(', ')+'.':'Ainda não tenho informações guardadas, senhor.');
 }
 if(/^(?:e )?(?:o que mais|tem mais alguma coisa|sabe mais alguma coisa|o que mais voce sabe)(?: sobre isso| sobre esse assunto)?$/.test(s)){
  var last=activeTopic();if(last)return out('Por enquanto, sobre '+last+', sei que '+memory[last]+'. Se quiser, pode me ensinar outra informação.');
  return out(Object.keys(memory).length?'Tenho informações sobre '+Object.keys(memory).join(', ')+'. Qual assunto deseja explorar?':'Ainda não tenho informações guardadas, senhor.');
 }
 if(/^(?:e )?(?:volta|volte|retorna|retorne|voltar)(?: para| ao)?(?: o)? assunto anterior$/.test(s) || /^(?:e )?(?:o assunto anterior|a informacao anterior)$/.test(s)){
  if(conversation.previousTopic&&Object.prototype.hasOwnProperty.call(memory,conversation.previousTopic))return out(responseFor(conversation.previousTopic));
  return out('Ainda não tenho uma informação anterior para recuperar.');
 }
 var subject=s.match(/^(?:e |agora )?(?:sobre|e sobre|o que voce sabe sobre|o que lembra sobre) (?:o |a |meu |minha )?(.+)$/);
 if(subject){var known=resolve(subject[1]);if(known)return out(responseFor(known));}
 var contextAnswer=contextual(s);if(contextAnswer)return out(contextAnswer);
 k=queryKey(s);if(k===null)k=lookup(s);
 if(k!==null){var resolved=resolve(k);if(resolved)return out(responseFor(resolved));return out('Ainda não tenho informação sobre '+k+'. Você pode me ensinar.');}
 if(clarify){var target=resolve(s);clarify=null;if(target)return out(responseFor(target));}
 if(/^(e (ele|ela|isso)|e sobre isso)/.test(s)&&topic&&memory[topic])return out(responseFor(topic));
 return out('Não consegui identificar o assunto. Você pode reformular a pergunta ou mencionar o que deseja saber?');}
load();try{var stored=JSON.parse(localStorage.getItem(CONTEXT_KEY)||'{}');if(stored&&typeof stored==='object'){if(Object.prototype.hasOwnProperty.call(memory,stored.lastTopic)){conversation.lastTopic=stored.lastTopic;topic=stored.lastTopic;}if(Object.prototype.hasOwnProperty.call(memory,stored.previousTopic))conversation.previousTopic=stored.previousTopic;}}catch(e){}window.HIDRAIntelligence={handle:handle,getMemory:function(){return Object.assign({},memory);},version:'1.2'};
})();


/* HIDRA Personality Engine 1.0: respostas variadas, tom equilibrado, sarcasmo 35%.
   Não altera fatos, confirmações ou armazenamento; sem APIs externas. */
(function(){
'use strict';
var count=0;
var sets={
 greeting:['Olá, senhor. Estou à disposição.','Olá! Em que posso ajudar?','Às suas ordens. O que temos para hoje?'],
 identity:['Sou a HIDRA, sua assistente digital. Ainda estou aprendendo, mas já tenho uma memória bastante útil.','HIDRA, Hub de Inteligência Digital e Respostas Adaptáveis. Um nome longo, admito, mas combina com a função.'],
 help:['Posso guardar informações com sua confirmação, lembrar o que me ensinou e responder sobre data e hora.','Por enquanto, cuido da memória, de perguntas simples e do contexto. Experimente me ensinar alguma coisa.'],
 unknown:['Não encontrei uma resposta para isso. Pode tentar explicar de outra maneira?','Ainda não aprendi esse assunto. Se reformular, talvez eu consiga ajudar.','Receio que essa informação ainda esteja fora do meu repertório, senhor.'],
 stored:['Informação guardada, senhor.','Pronto. Guardei essa informação na memória.','Registrado. Pode me perguntar sobre isso depois.'],
 cancelled:['Tudo bem, não vou guardar.','Entendido. Essa informação não será armazenada.'],
 question:['Entendi. Posso guardar essa informação na memória?','Certo. Deseja que eu me lembre disso nas próximas conversas?'],
 memoryEmpty:['Ainda não tenho informações guardadas.','Minha memória está vazia por enquanto. Podemos resolver isso.'],
 clarify:['Não tenho certeza a que você se refere. Pode mencionar o assunto?','Sobre qual informação estamos falando, senhor?']
};
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function pick(type){var a=sets[type];return a[(count++)%a.length];}
function decorate(q,r){if(!r||typeof r.text!=='string')return r;
 var t=r.text, n=norm(t), input=norm(q);
 // Nunca alterar o conteúdo de respostas que contenham fatos salvos, datas ou horários.
 if(/^ola estou ouvindo voce/.test(n))return {text:pick('greeting')};
 if(/^eu sou hidra/.test(n))return {text:pick('identity')};
 if(/^voce pode dizer/.test(n))return {text:pick('help')};
 if(/^(?:hidra )?(?:voce e inteligente|voce tem senso de humor)$/.test(input))return {text:"Eu diria que estou evoluindo, senhor. E, felizmente, minha memória não depende de café."};
 if(/^(?:hidra )?(?:estou entediado|estou com tedio)$/.test(input))return {text:"Posso sugerir uma atividade. Ou podemos continuar testando minha impressionante habilidade de ouvir o senhor."};
 if(/^nao consegui identificar o assunto/.test(n))return {text:pick('unknown')};
 if(/^ainda nao tenho informacoes guardadas/.test(n))return {text:pick('memoryEmpty')};
 if(/^de qual informacao voce esta falando/.test(n))return {text:pick('clarify')};
 if(/^certo nao vou guardar/.test(n))return {text:pick('cancelled')};
 if(/^informacao sobre .+ armazenada/.test(n))return {text:pick('stored')};
 if(/^entendi .+ quer que eu guarde essa informacao/.test(n))return {text:t.replace(/Quer que eu guarde essa informação\?$/,pick('question'))};
 if(/^(voce e inteligente|hidra voce e inteligente|voce tem senso de humor)$/.test(input))return {text:'Eu diria que estou evoluindo, senhor. E, felizmente, minha memória não depende de café.'};
 if(/^(estou entediado|estou com tedio)$/.test(input))return {text:'Posso sugerir uma atividade. Ou podemos continuar testando minha impressionante habilidade de ouvir o senhor.'};
 return r;
}
function attach(){if(!window.HIDRAIntelligence||window.HIDRAIntelligence.personalityVersion)return;
 var old=window.HIDRAIntelligence.handle;
 window.HIDRAIntelligence.handle=function(q){var n=String(q||" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").trim(); if(/^(?:hidra )?(?:voce e inteligente|voce tem senso de humor|estou entediado|estou com tedio)$/.test(n)){return decorate(q,{text:"Não consegui identificar o assunto. Você pode reformular a pergunta ou mencionar o que deseja saber?"});} return decorate(q,old(q));};
 window.HIDRAIntelligence.personalityVersion='1.0';
 window.HIDRAIntelligence.personality={style:'equilibrado',sarcasm:35};
}
attach();
})();

/* HIDRA Mobile 3.0: compatibilidade com consultas comuns do guia de comandos.
   O motor original e a personalidade 1.2/1.0 acima permanecem preservados. */
;(function(){'use strict';
 var h=window.HIDRAIntelligence;if(!h||!h.handle)return;
 var original=h.handle;
 h.handle=function(input){
  var n=String(input||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()
  .replace(/^(?:(?:ei|ola|oi)\s+)?(?:hidra|hydra)\s*/, '');
  var m=n.match(/^qual (?:e )?(?:o )?nome (?:do|da) (?:meu|minha) (.+)$/);
  if(m)return original('qual e o nome do meu '+m[1]);
  return original(input);
 };
})();
