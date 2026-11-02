/* HIDRA Mobile — geração de arquivos NA CONVERSA (v2).
   Substitui a antiga tela Projetos ZIP. Reaproveita developer/generate e ai/chat,
   sem executar nenhum conteúdo retornado pela IA. */
(()=>{'use strict';
if(window.HIDRAChatFiles)return;
const $=id=>document.getElementById(id);
const MAX_FILES=12,MAX_FILE=1600000,MAX_TOTAL=8000000;
const ALLOWED=new Set(['txt','md','csv','json','xml','svg','html','htm','css','js','mjs','ts','py','java','c','cpp','h','sql','yaml','yml','ini','bat','ps1','sh','webmanifest','rtf','pdf','docx','xlsx']);
const mime={txt:'text/plain',md:'text/markdown',csv:'text/csv',json:'application/json',xml:'application/xml',svg:'image/svg+xml',html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',py:'text/plain',pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',zip:'application/zip'};
const UTF8=new TextEncoder(), memory=new Map();
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const utf8=s=>UTF8.encode(String(s??''));
const ext=name=>(name.split('.').pop()||'').toLowerCase();
function safeName(raw,internal=false){
 const name=String(raw||'').trim().replace(/\\/g,'/');
 if(!name||name.length>150||name.startsWith('/')||/^[A-Za-z]:/.test(name)||/[\u0000-\u001f<>:"|?*]/.test(name))throw Error('Nome de arquivo inválido: '+name);
 if(name.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Caminho inseguro: '+name);
 if(!ALLOWED.has(ext(name))&&!(internal&&ext(name)==='rels'))throw Error('Formato ainda não suportado para geração no celular: '+name);
 return name;
}
function namesFor(raw){
 const original=String(raw||'');const s=norm(original);
 const matched=original.match(/[\p{L}\p{N}_./-]+\.(?:txt|md|csv|json|xml|svg|html?|css|m?js|ts|py|java|cpp|sql|ya?ml|ini|bat|ps1|sh|webmanifest|rtf|pdf|docx|xlsx)\b/giu)||[];
 const unique=new Map();for(const found of matched){let f=found.replace(/^[./]+/,'');try{f=safeName(f);unique.set(f.toLowerCase(),f)}catch(_){}}
 if(unique.size)return Array.from(unique.values()).slice(0,MAX_FILES);
 if(/\b(pdf)\b/.test(s))return ['documento.pdf'];
 if(/\b(docx|word)\b/.test(s))return ['documento.docx'];
 if(/\b(xlsx|excel|planilha)\b/.test(s))return ['planilha.xlsx'];
 if(/\b(csv)\b/.test(s))return ['dados.csv'];
 if(/\b(svg|vetor|vetorial)\b/.test(s))return ['imagem.svg'];
 if(/\b(json)\b/.test(s))return ['dados.json'];
 if(/\b(markdown|\.md)\b/.test(s))return ['documento.md'];
 if(/\b(html|pagina|site|pwa|aplicativo web)\b/.test(s))return ['index.html','style.css','app.js','README.md'];
 if(/\b(python|script)\b/.test(s))return ['main.py','README.md'];
 if(/\b(txt|texto|anotacoes)\b/.test(s))return ['documento.txt'];
 if(/\b(codigo|programa|projeto)\b/.test(s))return ['main.py','README.md'];
 return ['documento.md'];
}
function wantsFiles(t){
 const s=norm(t).trim();
 const action=/(?:^|\b)(?:crie|criar|cria|gere|gerar|gera|produza|fa[cç]a|monte|montar|prepare|desenvolva|construa|exporte|salve|envie|manda|quero|preciso)(?:\b|$)/.test(s);
 const obj=/(?:\b)(?:arquivos?|documentos?|planilhas?|relatorio|curriculo|apresentacao|codigo|script|projeto|site|pwa|pdf|docx|word|xlsx|excel|csv|json|txt|markdown|zip|svg|html)(?:\b)|\.(?:md|pdf|docx|xlsx|csv|txt|html|js|py|json|svg)\b/.test(s);
 const howTo=/^(?:como|qual|explique|o que|por que|me ensine)\b/.test(s);
 return action&&obj&&!howTo;
}
// ZIP com entradas STORE, válido offline e sem biblioteca externa.
const crcTable=(()=>{const a=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;a[n]=c>>>0}return a})();
function crc32(a){let c=0xffffffff;for(const v of a)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function w16(v,o,x){v.setUint16(o,x,true)}function w32(v,o,x){v.setUint32(o,x>>>0,true)}
function zip(files){
 if(!files.length||files.length>MAX_FILES)throw Error('Quantidade inválida de arquivos.');
 const localParts=[],centParts=[];let offset=0,total=0;
 for(const f of files){const n=utf8(safeName(f.name,true)),b=f.bytes;if(!(b instanceof Uint8Array)||b.length>MAX_FILE)throw Error('Arquivo excede o tamanho máximo: '+f.name);
  total+=b.length;if(total>MAX_TOTAL)throw Error('Arquivos grandes demais para o ZIP.');
  const local=new Uint8Array(30+n.length),v=new DataView(local.buffer),crc=crc32(b);
  w32(v,0,0x04034b50);w16(v,4,20);w16(v,6,0x0800);w16(v,8,0);w32(v,14,crc);w32(v,18,b.length);w32(v,22,b.length);w16(v,26,n.length);local.set(n,30);
  const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);
  w32(cv,0,0x02014b50);w16(cv,4,20);w16(cv,6,20);w16(cv,8,0x0800);w32(cv,16,crc);w32(cv,20,b.length);w32(cv,24,b.length);w16(cv,28,n.length);w32(cv,42,offset);c.set(n,46);
  localParts.push(local,b);centParts.push(c);offset+=local.length+b.length;
 }
 const dirSize=centParts.reduce((a,b)=>a+b.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);
 w32(v,0,0x06054b50);w16(v,8,files.length);w16(v,10,files.length);w32(v,12,dirSize);w32(v,16,offset);
 return new Blob([...localParts,...centParts,end],{type:'application/zip'});
}
function xml(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');}
function docx(source){
 const lines=String(source).replace(/\r/g,'').split('\n').slice(0,5000);
 const paras=lines.map(line=>{let heading=false;const m=line.match(/^#{1,3}\s+/);if(m){heading=true;line=line.slice(m[0].length)}
  return `<w:p>${heading?'<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>':''}<w:r><w:t xml:space="preserve">${xml(line)}</w:t></w:r></w:p>`}).join('');
 const d=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
 const ct=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
 const rel=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
 return zip([{name:'[Content_Types].xml',bytes:utf8(ct)},{name:'_rels/.rels',bytes:utf8(rel)},{name:'word/document.xml',bytes:utf8(d)}]);
}
// Planilha básica: usa CSV como representação intermediária e cria OOXML real.
function csvRows(text){
 const t=String(text||'').replace(/^```(?:csv)?\s*\n|\n```$/g,'').replace(/\r\n/g,'\n');
 const first=t.split('\n')[0]||'';const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<t.length&&rows.length<5000;i++){const ch=t[i];if(ch==='"'){if(quoted&&t[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
  else if(ch===sep&&!quoted){row.push(cell);cell=''}else if(ch==='\n'&&!quoted){row.push(cell);rows.push(row);row=[];cell=''}else cell+=ch}
 if(cell||row.length){row.push(cell);rows.push(row)}return rows;
}
function colName(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
function xlsx(source){
 const rows=csvRows(source),body=rows.map((r,ri)=>`<row r="${ri+1}">${r.slice(0,100).map((value,ci)=>{
 const pos=colName(ci)+(ri+1);return /^-?\d+(?:[.,]\d+)?$/.test(value.trim())?`<c r="${pos}"><v>${xml(value.replace(',','.'))}</v></c>`:`<c r="${pos}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;}).join('')}</row>`).join('');
 const ws=`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
 const ct=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
 const rel=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
 const wb=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Dados" sheetId="1" r:id="rId1"/></sheets></workbook>`;
 const wrel=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
 return zip([{name:'[Content_Types].xml',bytes:utf8(ct)},{name:'_rels/.rels',bytes:utf8(rel)},{name:'xl/workbook.xml',bytes:utf8(wb)},{name:'xl/_rels/workbook.xml.rels',bytes:utf8(wrel)},{name:'xl/worksheets/sheet1.xml',bytes:utf8(ws)}]);
}
// Documento PDF A4, texto e múltiplas páginas, fontes base WinAnsi. Sem dependências.
function cp1252(source){const pairs={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};let out=[];for(const ch of source){const c=ch.charCodeAt(0);out.push((c>=32&&c<=255)?c:(pairs[ch]|| (ch==='\n'?10:63)))}return Uint8Array.from(out)}
function pdf(source){
 const lines=[];for(const line of String(source||'').replace(/\r/g,'').split('\n')){
  let rest=line||' ';while(rest.length>92){let cut=rest.lastIndexOf(' ',92);if(cut<30)cut=92;lines.push(rest.slice(0,cut));rest=rest.slice(cut).trimStart()}lines.push(rest);
 }
 if(lines.length>3000)throw Error('PDF muito longo para geração no celular.');
 const chunks=[];for(let i=0;i<lines.length;i+=46)chunks.push(lines.slice(i,i+46));if(!chunks.length)chunks.push([' ']);
 const objects=[];objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Kids [${chunks.map((_,i)=>`${4+i*2} 0 R`).join(' ')}] /Count ${chunks.length} >>`;
 objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
 chunks.forEach((page,i)=>{const p=4+i*2,c=p+1;objects[p]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${c} 0 R >>`;
  const stream='BT /F1 11 Tf 48 794 Td 15 TL\n'+page.map(line=>`(${line.replace(/[\\()]/g,'\\$&')}) Tj T*`).join('\n')+'\nET';
  const bytes=cp1252(stream);objects[c]={header:`<< /Length ${bytes.length} >>\nstream\n`,bytes,footer:'\nendstream'};
 });
 const parts=[cp1252('%PDF-1.4\n')],offset=[0];let length=parts[0].length;
 function append(a){parts.push(a);length+=a.length}
 for(let i=1;i<objects.length;i++){offset[i]=length;append(cp1252(`${i} 0 obj\n`));let obj=objects[i];if(typeof obj==='string')append(cp1252(obj+'\n'));else{append(cp1252(obj.header));append(obj.bytes);append(cp1252(obj.footer+'\n'))}append(cp1252('endobj\n'))}
 const xref=length;let xs=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)xs+=`${String(offset[i]).padStart(10,'0')} 00000 n \n`;
 xs+=`trailer\n<< /Root 1 0 R /Size ${objects.length} >>\nstartxref\n${xref}\n%%EOF\n`;append(cp1252(xs));return new Blob(parts,{type:'application/pdf'});
}
async function blobBytes(blob){return new Uint8Array(await blob.arrayBuffer())}
function decode64(b64){const s=atob(b64.replace(/\s/g,'')),out=new Uint8Array(s.length);if(out.length>MAX_FILE)throw Error('Arquivo gerado maior que 1,6 MB.');for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out}
function stripFence(v){const s=String(v||'').trim(),m=s.match(/^```[^\n]*\n([\s\S]*?)\n```\s*$/);return m?m[1]:s}
function validate(name,bytes){if(!bytes.length||bytes.length>MAX_FILE)throw Error('Tamanho inválido: '+name);
 const type=ext(name);if(type==='json'||type==='webmanifest')try{JSON.parse(new TextDecoder().decode(bytes))}catch(_){throw Error(name+': JSON inválido.')}if(type==='svg'&&!/<svg\b/i.test(new TextDecoder().decode(bytes)))throw Error('SVG inválido: '+name)}
function access(){const root=(localStorage.getItem('hidra.base')||'').replace(/\/$/,''),token=localStorage.getItem('hidra.token')||'';
 if(localStorage.getItem('hidra.localOnly')==='true'||localStorage.getItem('hidra.privacy')==='true')throw Error('Desative o modo local/privacidade para gerar arquivos.');
 if(!root||!token)throw Error('Configure o servidor HTTPS e a chave de pareamento em Ajustes.');
 const u=new URL(root);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('Configure um servidor HTTPS.');
 if(u.username||u.password||u.search||u.hash)throw Error('Endereço do servidor inválido.');return{root:u.origin+u.pathname.replace(/\/$/,''),token};
}
async function post(route,body,timeout=170000){const c=access(),ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),timeout);
 try{const r=await fetch(c.root+'/mobile/api/'+route,{method:'POST',signal:ctl.signal,headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok){let reason='HTTP '+r.status;try{const e=await r.json();reason=e.error||reason}catch(_){}throw Error(reason)}return await r.json();}finally{clearTimeout(tm)}
}
async function generateContent(prompt,name,others){
 const typ=ext(name);const documentType=['pdf','docx','xlsx'].includes(typ);
 let specification=`Crie o conteúdo INTEGRAL de ${name}. Pedido do usuário: ${prompt}. Arquivos previstos: ${others.join(', ')}. `;
 specification+=typ==='xlsx'?'Responda SOMENTE uma tabela CSV completa, com cabeçalho, separada por ponto e vírgula. Não use Markdown.':documentType?'Responda SOMENTE o texto final do documento, com títulos e parágrafos. Sem introdução nem cercas Markdown.':`Responda SOMENTE o conteúdo exato do arquivo ${name}, completo e válido. Não use cercas Markdown nem introdução.`;
 specification=specification.slice(0,2800);
 const tryChat=async()=>{const data=await post('ai/chat',{text:specification},155000);const answer=stripFence(data.text||'');if(!answer||/^\s*(?:desculpe|não consigo|nao consigo|não posso|nao posso)\b/i.test(answer))throw Error('A IA não retornou conteúdo utilizável para '+name);return utf8(answer)};
 let bytes;
 if(documentType){try{bytes=await tryChat()}catch(e){const v=await post('developer/generate',{filename:typ==='xlsx'?'dados.csv':'documento.txt',instruction:specification},195000);if(!v.file_base64)throw e;bytes=decode64(v.file_base64)}}
 else{try{const data=await post('developer/generate',{filename:name,instruction:specification},195000);if(!data.file_base64)throw Error('O servidor não retornou arquivo');bytes=decode64(data.file_base64)}catch(e){if(e.name==='AbortError')throw e;bytes=await tryChat()}}
 if(bytes.length>MAX_FILE)throw Error(name+' excedeu 1,6 MB.');
 if(typ==='pdf')bytes=await blobBytes(pdf(new TextDecoder().decode(bytes)));
 if(typ==='docx')bytes=await blobBytes(docx(new TextDecoder().decode(bytes)));
 if(typ==='xlsx')bytes=await blobBytes(xlsx(new TextDecoder().decode(bytes)));
 validate(name,bytes);return {name,bytes};
}
let database=null;
function openDb(){if(!('indexedDB'in window))return Promise.resolve(null);if(database)return Promise.resolve(database);return new Promise(resolve=>{
 let req;try{req=indexedDB.open('hidra.chat.attachments.v1',1)}catch(_){resolve(null);return}req.onupgradeneeded=()=>{req.result.createObjectStore('groups',{keyPath:'id'})};req.onsuccess=()=>{database=req.result;resolve(database)};req.onerror=()=>resolve(null);
 })}
async function save(group){memory.set(group.id,group);const db=await openDb();if(!db)return false;
 return new Promise(resolve=>{try{const tx=db.transaction('groups','readwrite');tx.objectStore('groups').put(group);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false)}catch(_){resolve(false)}})}
async function load(id){if(memory.has(id))return memory.get(id);const db=await openDb();if(!db)return null;return new Promise(resolve=>{try{const r=db.transaction('groups','readonly').objectStore('groups').get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch(_){resolve(null)}})}
function download(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function button(text,handler){const b=document.createElement('button');b.type='button';b.className='hidra-download';b.textContent=text;b.onclick=handler;return b}
function attachments(group,el){if(el.querySelector('.hidra-file-list'))return;
 const bar=document.createElement('div');bar.className='hidra-file-list';const title=document.createElement('div');title.textContent='ARQUIVOS PARA BAIXAR';title.className='hidra-files-title';bar.append(title);
 for(const f of group.files){const b=button('⬇ '+f.name,()=>download(f.name.split('/').pop(),new Blob([f.bytes],{type:mime[ext(f.name)]||'application/octet-stream'})));bar.append(b)}
 const zipped=button('⬇ Baixar tudo em ZIP',()=>{try{download('hidra-arquivos-'+group.id+'.zip',zip(group.files))}catch(e){alert(e.message)}});bar.append(zipped);el.append(bar);
}
async function restore(){const history=$('history');if(!history)return;for(const el of history.querySelectorAll('.bubble.hidra')){
 const found=(el.textContent||'').match(/\[Arquivos #([A-Za-z0-9_-]{8,24})\]/);if(found&&!el.querySelector('.hidra-file-list')){const group=await load(found[1]);if(group&&el.isConnected)attachments(group,el)}
 }}
function chatTab(){const b=document.querySelector('.nav[data-tab="conversation"]');if(b&&!b.classList.contains('active'))b.click();document.body.classList.add('hidra-chat-open');scrollBottom()}
function scrollBottom(){const h=$('history');if(!h)return;requestAnimationFrame(()=>{h.scrollTop=h.scrollHeight;requestAnimationFrame(()=>{h.scrollTop=h.scrollHeight})})}
function bubble(text,who){const el=document.createElement('div');el.className='bubble '+who;el.textContent=text;$('history').append(el);chatTab();return el}
let working=false;
async function intercept(e){const field=$('message'),text=field?.value.trim();if(!text||!wantsFiles(text))return;
 e.preventDefault();e.stopImmediatePropagation();if(working){field.value='';return}field.value='';working=true;
 bubble(text,'me');const progress=document.createElement('div');progress.className='hidra-progress';$('history').append(progress);
 const update=s=>{progress.textContent=s;scrollBottom()};
 try{const names=namesFor(text);update('HIDRA está preparando '+names.length+' arquivo(s)…');access();const files=[];let total=0;
 for(let i=0;i<names.length;i++){update(`Criando ${i+1}/${names.length}: ${names[i]}…`);const file=await generateContent(text,names[i],names);total+=file.bytes.length;if(total>MAX_TOTAL)throw Error('Conjunto excede 8 MB.');files.push(file)}
 const id='F'+Math.random().toString(36).slice(2,11),group={id,files,at:Date.now()};const stored=await save(group);
 progress.remove();const answer=`Pronto! Criei ${files.length} arquivo(s) para você baixar aqui na conversa.\n[Arquivos #${id}]`+(stored?'':'\nAtenção: o navegador não permitiu salvar os anexos para acessos futuros. Baixe agora.');
 const el=bubble(answer,'hidra');queueMicrotask(()=>{if(el.isConnected)attachments(group,el)});scrollBottom();
 }catch(err){progress.remove();bubble('Não consegui gerar os arquivos: '+(err.name==='AbortError'?'tempo limite do servidor':err.message)+'\nNenhum download incompleto foi apresentado como pronto.','hidra')}
 finally{working=false;scrollBottom()}
}
function initUI(){
 const css=document.createElement('style');css.textContent=`
  body.hidra-chat-open .hero{display:none!important}
  body.hidra-chat-open #conversation.active{min-height:0}
  body.hidra-chat-open #conversation.active .history{height:clamp(270px,calc(100dvh - 305px),760px);max-height:none;overscroll-behavior:contain}
  .hidra-progress{border-left:2px solid #8deaff;padding:11px;margin:8px 22px 8px 0;background:#0a2a3c;color:#9ddfed;border-radius:10px;font:13px/1.5 Segoe UI,Arial}
  .hidra-file-list{display:flex;flex-direction:column;gap:7px;margin-top:12px;border-top:1px solid #39748a;padding-top:10px;white-space:normal}
  .hidra-files-title{font:700 10px Segoe UI,Arial;letter-spacing:1.3px;color:#8cd7e8}
  .hidra-download{display:block;width:100%;text-align:left;padding:10px 12px;border-radius:9px;border:1px solid #50aec3;background:#10445b;color:#d6faff;overflow-wrap:anywhere;font:12px Segoe UI,Arial}
  @media(max-height:650px){body.hidra-chat-open #conversation.active .history{height:clamp(220px,calc(100dvh - 235px),620px)}}`;
 document.head.append(css);
 const form=$('sendform');if(form)form.addEventListener('submit',intercept,true);
 const screen=$('conversation'),history=$('history');
 const sync=()=>{const open=screen?.classList.contains('active');document.body.classList.toggle('hidra-chat-open',!!open);if(open){scrollBottom();restore()}};
 if(screen)new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['class']});
 if(history)new MutationObserver(()=>{if(screen?.classList.contains('active'))scrollBottom();restore()}).observe(history,{childList:true});
 document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(sync)));
 sync();restore();
}
// Preserva a limpeza de caracteres do antigo hidra-projects.js, sem abrir o módulo.
function spoken(value){return String(value||'').replace(/```[\s\S]*?```/g,' Trecho disponível na tela. ').replace(/\*\*|__|~~|#/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/https?:\/\/\S+/g,' link disponível na tela ').trim()}
function cleanVoice(){const original=window.fetch.bind(window);window.fetch=function(input,init){try{const url=typeof input==='string'?input:input?.url||'';if(/\/mobile\/api\/tts(?:[?#]|$)/.test(url)&&typeof init?.body==='string'){const body=JSON.parse(init.body);if(typeof body.text==='string')return original(input,{...init,body:JSON.stringify({...body,text:spoken(body.text)})})}}catch(_){}return original(input,init)};
 try{const Native=window.SpeechSynthesisUtterance;if(typeof Native==='function')window.SpeechSynthesisUtterance=new Proxy(Native,{construct(T,args){return Reflect.construct(T,[spoken(args[0]),...args.slice(1)])}})}catch(_){}
}
window.HIDRAChatFiles={version:'2.0',wantsFiles,namesFor,zip,pdf,docx,xlsx};
cleanVoice();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initUI,{once:true});else initUI();
})();
