/* HIDRA 2.0 / 3D STUDIO MOBILE - V18
   Editor procedural local, sem API, sem comandos de texto/voz.
   Formato de projeto: .hidra3d (JSON com primitivas independentes).
   Este modulo nao altera a Biblioteca, o servidor ou o visualizador existente.
*/
(()=>{'use strict';
if(window.HIDRA3DStudioMobile)return;
const $=id=>document.getElementById(id);
const STORE='hidra.mobile.3dstudio.projects.v1';
const CURRENT='hidra.mobile.3dstudio.current.v1';
const TYPES={cube:'Cubo',sphere:'Esfera',cylinder:'Cilindro',cone:'Cone'};
const COLORS=['#57b9d7','#7cc7da','#5da0be','#a1d6e8','#a9aecf'];
const css=`
#h3sModal[hidden]{display:none!important}
#h3sModal{position:fixed;z-index:10001;inset:0;background:rgba(1,9,18,.94);display:flex;justify-content:center;align-items:center;padding:calc(7px + env(safe-area-inset-top)) 6px calc(7px + env(safe-area-inset-bottom));box-sizing:border-box;color:#d7f7ff;font:12px/1.4 Arial,sans-serif}
#h3sModal *{box-sizing:border-box}
#h3sModal .h3s-window{display:flex;flex-direction:column;width:100%;max-width:780px;height:100%;max-height:960px;min-height:0;overflow:hidden;background:#061c2b;border:1px solid #41b6d2;border-radius:14px;box-shadow:0 0 34px #03bde84a,0 18px 48px #000d}
#h3sModal .h3s-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:7px;padding:8px 10px;background:linear-gradient(90deg,#134b64,#061a2b);border-bottom:1px solid #286985}
#h3sModal .h3s-head strong{display:block;font-size:13px;letter-spacing:1px;color:#b4f5ff}
#h3sModal .h3s-head small{display:block;color:#89c3d5;font-size:10px;max-width:62vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#h3sModal button,#h3sModal select,#h3sModal input{font:inherit;border-radius:6px;border:1px solid #397a91;color:#dbf7ff;background:#0c344a;min-height:32px}
#h3sModal button{cursor:pointer;padding:6px 9px;touch-action:manipulation;white-space:nowrap}
#h3sModal button:active,#h3sModal button.active{background:#176783;border-color:#84f1ff}
#h3sModal button:disabled{opacity:.4;cursor:not-allowed}
#h3sModal select{padding:5px;min-width:0}
#h3sModal input{padding:4px 6px;min-width:0;max-width:100%;background:#061c2b}
#h3sModal .h3s-strip{flex:0 0 auto;display:flex;gap:5px;padding:6px;overflow-x:auto;scrollbar-width:thin;border-bottom:1px solid #205a70;background:#082435}
#h3sModal .h3s-strip button{flex:0 0 auto}
#h3sModal .h3s-stage{position:relative;flex:1 1 auto;min-height:170px;background:#03131e;overflow:hidden}
#h3sModal canvas{width:100%;height:100%;display:block;touch-action:none;user-select:none}
#h3sModal .h3s-overlay{position:absolute;pointer-events:none;top:8px;left:9px;font-size:10px;letter-spacing:1.1px;color:#75d8f2;text-shadow:0 1px 3px #000}
#h3sModal .h3s-help{position:absolute;pointer-events:none;bottom:7px;left:7px;right:7px;text-align:center;font-size:10px;color:#abd5e3;text-shadow:0 1px 3px #000}
#h3sModal .h3s-bottom{flex:0 0 auto;max-height:min(42%,310px);display:flex;flex-direction:column;background:#071d2c;border-top:1px solid #246078;min-height:120px}
#h3sModal .h3s-list{display:flex;flex:0 0 auto;gap:5px;padding:6px;min-height:42px;overflow-x:auto;scrollbar-width:thin}
#h3sModal .h3s-list button{font-weight:normal;max-width:160px;overflow:hidden;text-overflow:ellipsis}
#h3sModal .h3s-list button.selected{background:#17617c;border-color:#9cf5ff}
#h3sModal .h3s-edit{display:flex;flex-direction:column;gap:6px;padding:6px 9px;overflow-y:auto;min-height:0}
#h3sModal .h3s-info-row{display:flex;align-items:center;gap:6px;justify-content:space-between}
#h3sModal .h3s-info-row input[type=text]{flex:1;max-width:190px}
#h3sModal .h3s-info-row input[type=color]{width:36px;height:32px;padding:2px;flex:0 0 36px}
#h3sModal .h3s-axes{display:grid;grid-template-columns:60px repeat(3,minmax(0,1fr));gap:5px;align-items:center}
#h3sModal .h3s-axes label{text-align:center;color:#8bd2e9;display:flex;align-items:center;gap:3px}
#h3sModal .h3s-axes label input{width:100%;text-align:center;font-size:12px}
#h3sModal .h3s-act{display:flex;gap:5px;padding-bottom:3px;flex-wrap:wrap}
#h3sModal .h3s-status{flex:0 0 auto;min-height:23px;padding:5px 9px;color:#94d4e5;background:#071c2b;font-size:10px;overflow-wrap:anywhere}
#h3sModal .h3s-status.error{color:#ffd6d6}
@media (max-width:390px){#h3sModal .h3s-head{padding:6px 8px}#h3sModal button{padding:6px 7px}#h3sModal .h3s-axes{grid-template-columns:53px repeat(3,minmax(0,1fr));gap:3px}}
@media (orientation:landscape) and (max-height:520px){#h3sModal .h3s-bottom{max-height:45%}#h3sModal .h3s-list{min-height:34px;padding:3px}#h3sModal .h3s-strip{padding:3px}}
`;
const stylesheet=document.createElement('style');stylesheet.id='h3sStyles';stylesheet.textContent=css;document.head.appendChild(stylesheet);
const modal=document.createElement('section');modal.id='h3sModal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','HIDRA 3D Studio - Editor procedural');
modal.innerHTML=`<div class="h3s-window">
 <div class="h3s-head"><div><strong>⬡ HIDRA / 3D STUDIO</strong><small id="h3sProjectTitle">PROJETO PROCEDURAL</small></div><button id="h3sClose" type="button">✕ Fechar</button></div>
 <div class="h3s-strip" aria-label="Projetos"><button data-action="new">＋ Novo</button><select id="h3sProjects" aria-label="Projetos salvos"></select><button data-action="open">Abrir</button><button data-action="save">Salvar</button><button data-action="export">⬇ Projeto</button><button data-action="import">⬆ Importar</button></div>
 <div class="h3s-strip" aria-label="Adicionar objetos"><button data-add="cube">＋ Cubo</button><button data-add="sphere">＋ Esfera</button><button data-add="cylinder">＋ Cilindro</button><button data-add="cone">＋ Cone</button></div>
 <div class="h3s-strip" aria-label="Manipulação"><button data-mode="view" class="active">◎ Câmera</button><button data-mode="move">✥ Mover</button><button data-mode="rotate">⟳ Girar</button><button data-mode="scale">⤢ Escalar</button><button data-action="resetview">⌖ Enquadrar</button><button data-action="undo">↶</button><button data-action="redo">↷</button></div>
 <div class="h3s-stage"><canvas id="h3sCanvas" aria-label="Área de modelagem procedural"></canvas><div class="h3s-overlay" id="h3sOverlay">CENA / EDITOR LIVRE</div><div class="h3s-help" id="h3sHelp">1 dedo: girar câmera · toque: selecionar · 2 dedos: zoom e deslocamento</div></div>
 <div class="h3s-bottom"><div class="h3s-list" id="h3sList" aria-label="Objetos do projeto"></div>
 <div class="h3s-edit" id="h3sEdit"><div class="h3s-info-row"><input type="text" id="h3sName" maxlength="65" placeholder="Nome da peça" aria-label="Nome do objeto"><input type="color" id="h3sColor" aria-label="Cor da peça" value="#57b9d7"><button data-action="duplicate">Duplicar</button><button data-action="delete">Excluir</button></div>
 <div class="h3s-axes" id="h3sAxes"><span>Posição</span><label>X<input type="number" data-prop="position" data-axis="0" step="0.1"></label><label>Y<input type="number" data-prop="position" data-axis="1" step="0.1"></label><label>Z<input type="number" data-prop="position" data-axis="2" step="0.1"></label>
 <span>Rotação</span><label>X<input type="number" data-prop="rotation" data-axis="0" step="5"></label><label>Y<input type="number" data-prop="rotation" data-axis="1" step="5"></label><label>Z<input type="number" data-prop="rotation" data-axis="2" step="5"></label>
 <span>Escala</span><label>X<input type="number" data-prop="scale" data-axis="0" step="0.1" min="0.05"></label><label>Y<input type="number" data-prop="scale" data-axis="1" step="0.1" min="0.05"></label><label>Z<input type="number" data-prop="scale" data-axis="2" step="0.1" min="0.05"></label></div>
 <div class="h3s-act"><button data-action="hide">◉ Ocultar/Mostrar</button><button data-action="restore">↺ Restaurar peça</button><button data-action="clear">Limpar cena</button></div></div></div>
 <div class="h3s-status" id="h3sStatus" role="status" aria-live="polite">Modelagem local: não precisa do servidor Python.</div>
 <input id="h3sImportFile" type="file" accept=".hidra3d,.json" hidden>
</div>`;
document.body.appendChild(modal);
const canvas=$('h3sCanvas'),ctx=canvas.getContext('2d',{alpha:false}),statusEl=$('h3sStatus');
const RAD=Math.PI/180,DEG=180/Math.PI;
let opened=false,raf=0,lastFrame=0,lastFaces=[],selectedId=null,mode='view';
let yaw=.48,pitch=-.16,dist=9.5,panX=0,panY=0;
let project={id:'',name:'Novo projeto',objects:[],created:null,updated:null},projects={};
let nextId=0,undoStack=[],redoStack=[],saveTimer=null;
const pointers=new Map();let pinch=null,press=null,dragging=false,dragSnapshot=null;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const uid=()=>`part_${++nextId}_${Date.now().toString(36)}`;
const newId=()=>`projeto_${Date.now().toString(36)}_${Math.floor(Math.random()*100000).toString(36)}`;
const clone=v=>JSON.parse(JSON.stringify(v));
function notice(text,error=false){statusEl.textContent=text;statusEl.classList.toggle('error',error);}
function current(){return project.objects.find(o=>o.id===selectedId)||null;}
function safeName(value,def='Objeto'){return String(value||'').replace(/[<>\r\n]/g,'').trim().slice(0,65)||def;}
function loadStorage(){try{const d=JSON.parse(localStorage.getItem(STORE)||'{}');if(d&&typeof d==='object'&&!Array.isArray(d))projects=d;}catch(e){projects={};}}
function saveNow(){
 try{project.updated=new Date().toISOString();projects[project.id]=clone(project);localStorage.setItem(STORE,JSON.stringify(projects));localStorage.setItem(CURRENT,project.id);updateProjectList();notice('Projeto salvo neste celular.');return true;}
 catch(e){notice('Não foi possível salvar no celular: '+(e.message||e),true);return false;}
}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,550);}
function historyPush(snapshot){undoStack.push(snapshot||clone(project.objects));if(undoStack.length>45)undoStack.shift();redoStack.length=0;}
function modified(){renderPartsList();renderInspector();scheduleSave();}
function newProject(name){
 clearTimeout(saveTimer);const now=new Date().toISOString();project={id:newId(),name:safeName(name,'Projeto sem título'),objects:[],created:now,updated:now};
 selectedId=null;undoStack=[];redoStack=[];resetCamera();saveNow();renderPartsList();renderInspector();notice('Projeto vazio criado. Adicione uma forma para começar.');
}
function openProject(id){const saved=projects[id];if(!saved)return notice('Projeto não encontrado.',true);
 clearTimeout(saveTimer);project=clone(saved);selectedId=null;undoStack=[];redoStack=[];resetCamera();renderPartsList();renderInspector();updateProjectList();notice('Projeto aberto: '+project.name);}
function updateProjectList(){const select=$('h3sProjects');const keep=select.value;select.replaceChildren();
 const all=Object.values(projects).filter(p=>p&&p.id&&Array.isArray(p.objects)).sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||'')));
 all.forEach(p=>{const opt=document.createElement('option');opt.value=p.id;opt.textContent=safeName(p.name)+' ('+p.objects.length+')';select.appendChild(opt);});
 select.value=projects[project.id]?project.id:keep;
 $('h3sProjectTitle').textContent=project.name+' · '+project.objects.length+' peça(s)';
}
function cleanImported(raw){
 if(!raw||typeof raw!=='object'||raw.format!=='HIDRA3D'||!Array.isArray(raw.objects)||raw.objects.length>80)throw Error('Formato de projeto inválido ou muito grande (máximo 80 objetos).');
 const cleaned=[];const ids=new Set();
 for(const source of raw.objects){
  if(!source||!TYPES[source.type])throw Error('Tipo de geometria não reconhecido.');
  const validate=(value,limits)=>Array.isArray(value)&&value.length===3&&value.every(x=>Number.isFinite(x)&&Math.abs(x)<=limits);
  if(!validate(source.position,1000)||!validate(source.rotation,360000)||!validate(source.scale,100))throw Error('Parâmetros de objeto inválidos.');
  const safeScale=source.scale.map(v=>clamp(Math.abs(v),.05,100));
  const id=typeof source.id==='string'&&source.id.length<80&&!ids.has(source.id)?source.id:uid();ids.add(id);
  cleaned.push({id,name:safeName(source.name,TYPES[source.type]),type:source.type,color:/^#[0-9a-fA-F]{6}$/.test(source.color)?source.color:'#57b9d7',position:source.position.slice(),rotation:source.rotation.slice(),scale:safeScale,visible:source.visible!==false});
 }
 return {objects:cleaned,name:safeName(raw.name,'Projeto importado')};
}
function exportProject(){const data={format:'HIDRA3D',version:1,name:project.name,objects:project.objects,updated:new Date().toISOString()};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=project.name.replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,55)+'.hidra3d';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);notice('Projeto exportado como .hidra3d.');}
function add(type){if(project.objects.length>=80)return notice('Limite de 80 peças por projeto nesta versão.',true);
 historyPush();const index=project.objects.length;const starts=[[0,0,0],[1.3,0,0],[-1.3,0,0],[0,0,-1.3],[0,1.3,0]];const pos=starts[index%starts.length].slice();pos[2]-=Math.floor(index/starts.length)*1.4;const obj={id:uid(),name:TYPES[type]+' '+(index+1),type,color:COLORS[index%COLORS.length],position:pos,rotation:[0,0,0],scale:[1,1,1],visible:true};
 project.objects.push(obj);selectedId=obj.id;modified();notice('Peça adicionada: '+obj.name+'. Selecione Mover para arrastá-la.');}
function setMode(name){mode=name;modal.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===name));
 const instructions={view:'1 dedo: girar câmera · toque: selecionar · 2 dedos: zoom e deslocamento',move:'Toque numa peça e arraste para movê-la · 2 dedos: zoom',rotate:'Toque numa peça e arraste para girá-la · 2 dedos: zoom',scale:'Toque numa peça e arraste para dimensionar · 2 dedos: zoom'};
 $('h3sHelp').textContent=instructions[name]||'';
 $('h3sOverlay').textContent='CENA / '+({view:'CÂMERA',move:'MOVER',rotate:'GIRAR',scale:'ESCALAR'}[name]||'EDITOR');
}
function renderPartsList(){const el=$('h3sList');el.replaceChildren();const all=project.objects;
 if(!all.length){const help=document.createElement('span');help.textContent='Cena vazia · adicione um cubo, esfera, cilindro ou cone';help.style.cssText='padding:7px;color:#90c5d7;white-space:nowrap';el.appendChild(help);}
 for(const obj of all){const b=document.createElement('button');b.type='button';b.className=obj.id===selectedId?'selected':'';b.textContent=(obj.visible?'⬡ ':'◌ ')+obj.name;b.title=obj.name;
 b.addEventListener('click',()=>{selectedId=obj.id;renderPartsList();renderInspector();notice('Selecionado: '+obj.name);});el.appendChild(b)}updateProjectList();}
function renderInspector(){const o=current();$('h3sName').disabled=!o;$('h3sColor').disabled=!o;
 modal.querySelectorAll('[data-action="duplicate"],[data-action="delete"],[data-action="hide"],[data-action="restore"]').forEach(b=>b.disabled=!o);
 $('h3sName').value=o?.name||'';$('h3sColor').value=o?.color||'#57b9d7';
 modal.querySelectorAll('input[data-prop]').forEach(input=>{input.disabled=!o;const arr=o?.[input.dataset.prop];const axis=Number(input.dataset.axis);input.value=o?(input.dataset.prop==='rotation'?(arr[axis]).toFixed(0):Number(arr[axis]).toFixed(2)):'';});}
function resetCamera(){yaw=.48;pitch=-.16;dist=9.5;panX=0;panY=0;}
function undo(){if(!undoStack.length)return notice('Não há alterações para desfazer.');redoStack.push(clone(project.objects));project.objects=undoStack.pop();if(!current())selectedId=null;modified();notice('Alteração desfeita.');}
function redo(){if(!redoStack.length)return notice('Não há alterações para refazer.');undoStack.push(clone(project.objects));project.objects=redoStack.pop();if(!current())selectedId=null;modified();notice('Alteração refeita.');}
function applyAction(action){const obj=current();switch(action){
 case 'new':{const name=prompt('Nome do novo projeto 3D:',`Projeto ${Object.keys(projects).length+1}`);if(name!==null)newProject(name);break;}
 case 'open':openProject($('h3sProjects').value);break;
 case 'save':saveNow();break;
 case 'export':saveNow();exportProject();break;
 case 'import':$('h3sImportFile').click();break;
 case 'resetview':resetCamera();notice('Câmera restaurada.');break;
 case 'undo':undo();break;
 case 'redo':redo();break;
 case 'duplicate':if(obj){if(project.objects.length>=80)return notice('Limite de 80 peças.',true);historyPush();const dup=clone(obj);dup.id=uid();dup.name=safeName(obj.name+' cópia');dup.position[0]+=.65;dup.position[1]+=.25;project.objects.push(dup);selectedId=dup.id;modified();notice('Peça duplicada.');}break;
 case 'delete':if(obj){historyPush();project.objects=project.objects.filter(o=>o.id!==obj.id);selectedId=null;modified();notice('Peça excluída.');}break;
 case 'hide':if(obj){historyPush();obj.visible=!obj.visible;modified();notice(obj.visible?'Peça visível.':'Peça oculta.');}break;
 case 'restore':if(obj){historyPush();obj.position=[0,0,0];obj.rotation=[0,0,0];obj.scale=[1,1,1];obj.visible=true;modified();notice('Transformações da peça restauradas.');}break;
 case 'clear':if(project.objects.length&&confirm('Apagar todas as peças da cena?')){historyPush();project.objects=[];selectedId=null;modified();notice('Cena limpa.');}break;
 }}
function geom(type){
 if(type==='cube'){const v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
 return {v,f:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]]};}
 if(type==='sphere'){const v=[],f=[],lat=11,lon=18;for(let i=0;i<=lat;i++){const phi=Math.PI*i/lat;for(let j=0;j<=lon;j++){const t=2*Math.PI*j/lon;v.push([.5*Math.sin(phi)*Math.cos(t),.5*Math.cos(phi),.5*Math.sin(phi)*Math.sin(t)]);}}
 for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const a=i*(lon+1)+j;f.push([a,a+1,a+lon+2,a+lon+1]);}return{v,f};}
 const n=18,v=[],f=[];for(let j=0;j<n;j++){const a=2*Math.PI*j/n;v.push([Math.cos(a)*.5,-.5,Math.sin(a)*.5]);v.push([Math.cos(a)*.5,.5,Math.sin(a)*.5]);}
 if(type==='cone'){v.push([0,.5,0]);for(let j=0;j<n;j++)f.push([j*2,((j+1)%n)*2,n*2]);f.push(Array.from({length:n},(_,i)=>(n-1-i)*2));}
 else {for(let j=0;j<n;j++)f.push([2*j,2*((j+1)%n),2*((j+1)%n)+1,2*j+1]);f.push(Array.from({length:n},(_,i)=>2*(n-1-i)));f.push(Array.from({length:n},(_,i)=>2*i+1));}
 return {v,f};
}
const meshes={cube:geom('cube'),sphere:geom('sphere'),cylinder:geom('cylinder'),cone:geom('cone')};
function transform(v,obj){let x=v[0]*obj.scale[0],y=v[1]*obj.scale[1],z=v[2]*obj.scale[2];
 const rx=obj.rotation[0]*RAD,ry=obj.rotation[1]*RAD,rz=obj.rotation[2]*RAD;
 let c=Math.cos(rx),s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c];
 c=Math.cos(ry);s=Math.sin(ry);[x,z]=[x*c-z*s,x*s+z*c];
 c=Math.cos(rz);s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c];
 return [x+obj.position[0],y+obj.position[1],z+obj.position[2]];
}
function projectPoint(p,w,h){const x=p[0],y=p[1],z=p[2];const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const x1=x*cy-z*sy,z1=x*sy+z*cy,y2=y*cp-z1*sp,z2=y*sp+z1*cp;
 const depth=clamp(dist-z2,.3,999),scale=Math.min(w*1.45,h*2.40);
 return{x:w/2+panX+scale*x1/depth,y:h/2+panY-scale*y2/depth,d:depth};}
function rgb(hex,shade,alpha){const h=parseInt(hex.slice(1),16);return`rgba(${clamp(Math.round(((h>>16)&255)*shade),0,255)},${clamp(Math.round(((h>>8)&255)*shade),0,255)},${clamp(Math.round((h&255)*shade),0,255)},${alpha})`;}
function draw(ts){if(!opened)return;raf=requestAnimationFrame(draw);if(ts-lastFrame<29)return;lastFrame=ts;
 const r=canvas.getBoundingClientRect(),w=r.width,h=r.height;if(w<20||h<20)return;const dpr=Math.min(1.5,devicePixelRatio||1);
 if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#03121e';ctx.fillRect(0,0,w,h);
 const grad=ctx.createRadialGradient(w/2,h*.48,5,w/2,h*.51,Math.max(w,h)*.69);grad.addColorStop(0,'#0e3850');grad.addColorStop(1,'#03111b');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 // Referencia no plano XZ.
 ctx.strokeStyle='#2e77944a';ctx.lineWidth=.75;
 for(let n=-6;n<=6;n++){for(const [a,b] of [[[-6,-2,n],[6,-2,n]],[[n,-2,-6],[n,-2,6]]]){const pa=projectPoint(a,w,h),pb=projectPoint(b,w,h);ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();}}
 const o=projectPoint([0,0,0],w,h);ctx.strokeStyle='#4abbdc80';ctx.beginPath();ctx.moveTo(o.x-8,o.y);ctx.lineTo(o.x+8,o.y);ctx.moveTo(o.x,o.y-8);ctx.lineTo(o.x,o.y+8);ctx.stroke();
 const faces=[];
 for(const obj of project.objects){if(!obj.visible)continue;const mesh=meshes[obj.type];if(!mesh)continue;const world=mesh.v.map(v=>transform(v,obj)),pts=world.map(v=>projectPoint(v,w,h));
 for(const ids of mesh.f){const vertices=ids.map(i=>pts[i]);if(vertices.some(p=>!p))continue;const depth=vertices.reduce((sum,p)=>sum+p.d,0)/vertices.length;
 const u=world[ids[0]],v=world[ids[1]],t=world[ids[2]];const aa=[v[0]-u[0],v[1]-u[1],v[2]-u[2]],bb=[t[0]-u[0],t[1]-u[1],t[2]-u[2]];
 const n=[aa[1]*bb[2]-aa[2]*bb[1],aa[2]*bb[0]-aa[0]*bb[2],aa[0]*bb[1]-aa[1]*bb[0]],nl=Math.hypot(...n)||1;
 const shade=clamp(.52+.57*Math.abs((n[0]*.35+n[1]*.65+n[2]*.62)/nl),.4,1.18);
 faces.push({obj,pts:vertices,depth,shade});}}
 faces.sort((a,b)=>b.depth-a.depth);lastFaces=faces;
 for(const face of faces){const isSelected=face.obj.id===selectedId;ctx.beginPath();const pts=face.pts;ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=rgb(face.obj.color,face.shade,isSelected?.94:.87);ctx.fill();ctx.strokeStyle=isSelected?'#9df9ff':'#43a4c785';ctx.lineWidth=isSelected?1.3:.6;ctx.stroke();}
 const obj=current();if(obj?.visible){const p=projectPoint(obj.position,w,h);ctx.strokeStyle='#96faff';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#c1f9ff';ctx.font='11px Arial';ctx.fillText(obj.name,p.x+18,p.y-10);}
}
function hitPolygon(pt,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>pt.y)!==(b.y>pt.y)&&pt.x<(b.x-a.x)*(pt.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function selectAt(clientX,clientY){const r=canvas.getBoundingClientRect(),p={x:clientX-r.left,y:clientY-r.top};for(let i=lastFaces.length-1;i>=0;i--){if(hitPolygon(p,lastFaces[i].pts)){selectedId=lastFaces[i].obj.id;renderPartsList();renderInspector();return true;}}
 // Permitir seleção pela lista quando a superfície não foi tocada.
 return false;
}
function changeZoom(mult){dist=clamp(dist*mult,2.5,55);}
function pinchState(){const a=[...pointers.values()];if(a.length<2)return null;return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.max(5,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y))};}
function down(e){e.preventDefault();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});
 if(pointers.size===1){const hit=selectAt(e.clientX,e.clientY);press={x:e.clientX,y:e.clientY,button:e.button,hit,moved:false};dragging=false;dragSnapshot=hit&&mode!=='view'?clone(project.objects):null;}
 else if(pointers.size===2){pinch=pinchState();if(press)press.moved=true;dragSnapshot=null;}}
function move(e){const p=pointers.get(e.pointerId);if(!p)return;e.preventDefault();const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(pointers.size>=2){const next=pinchState();if(pinch){panX+=next.x-pinch.x;panY+=next.y-pinch.y;changeZoom(pinch.d/next.d);}pinch=next;return;}
 if(!press)return;const movement=Math.abs(e.clientX-press.x)+Math.abs(e.clientY-press.y);if(movement>6)press.moved=true;
 if(!press.moved)return;
 const obj=current();if(mode==='view'||!press.hit||!obj||e.button===2){yaw-=dx*.010;pitch=clamp(pitch+dy*.01,-1.4,1.4);return;}
 if(!dragging)dragging=true;
 if(mode==='move'){const rect=canvas.getBoundingClientRect();const size=Math.min(rect.width*1.45,rect.height*2.40),unit=Math.max(.004,dist/Math.max(80,size));obj.position[0]+=dx*unit*Math.cos(yaw);obj.position[2]-=dx*unit*Math.sin(yaw);obj.position[1]-=dy*unit;}
 else if(mode==='rotate'){obj.rotation[1]+=dx*.65;obj.rotation[0]+=dy*.65;}
 else if(mode==='scale'){const factor=clamp(Math.exp((dx-dy)*.005),.80,1.25);obj.scale=obj.scale.map(v=>clamp(v*factor,.05,100));}
}
function up(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);
 if(!pointers.size){if(dragging&&dragSnapshot){historyPush(dragSnapshot);modified();}else if(press&&!press.moved&&!press.hit){selectedId=null;renderPartsList();renderInspector();}dragging=false;dragSnapshot=null;press=null;pinch=null;}
 else if(pointers.size===1){const p=[...pointers.values()][0];press={x:p.x,y:p.y,button:p.button,hit:false,moved:true};pinch=null;dragSnapshot=null;}}
function attachEvents(){
 modal.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>add(b.dataset.add)));
 modal.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 modal.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>applyAction(b.dataset.action)));
 $('h3sName').addEventListener('change',e=>{const o=current();if(!o)return;historyPush();o.name=safeName(e.target.value,TYPES[o.type]);modified();});
 $('h3sColor').addEventListener('change',e=>{const o=current();if(!o)return;historyPush();o.color=e.target.value;modified();});
 modal.querySelectorAll('input[data-prop]').forEach(input=>input.addEventListener('change',()=>{const o=current();if(!o)return;
 const n=Number(input.value),prop=input.dataset.prop,axis=Number(input.dataset.axis);if(!Number.isFinite(n)||Math.abs(n)>10000)return renderInspector();
 historyPush();o[prop][axis]=prop==='scale'?clamp(Math.abs(n),.05,100):prop==='position'?clamp(n,-1000,1000):n;modified();}));
 $('h3sClose').addEventListener('click',close);
 canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY>0?1.12:.9);},{passive:false});
 $('h3sImportFile').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>2*1024*1024)return notice('Projeto acima de 2 MB. Este protótipo aceita até 80 peças.',true);
 try{const data=JSON.parse(await file.text());const clean=cleanImported(data);newProject(clean.name);project.objects=clean.objects;selectedId=null;modified();saveNow();notice('Projeto importado: '+project.name+' ('+clean.objects.length+' peças).');}
 catch(err){notice('Falha ao importar: '+(err.message||err),true);}});
}
let previousOverflow='';
function open(){if(opened)return;window.HIDRA3DMobile?.close?.();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';modal.hidden=false;opened=true;
 if(!project.id){loadStorage();const id=localStorage.getItem(CURRENT);if(id&&projects[id])openProject(id);else newProject('Meu primeiro projeto');}
 renderPartsList();renderInspector();setMode('view');lastFrame=0;raf=requestAnimationFrame(draw);notice('Editor livre pronto. As alterações são salvas automaticamente neste celular.');}
function close(){if(!opened)return;clearTimeout(saveTimer);saveNow();opened=false;modal.hidden=true;document.body.style.overflow=previousOverflow;if(raf)cancelAnimationFrame(raf);raf=0;pointers.clear();}
attachEvents();
// Entradas integradas ao visualizador que ja existe na V17.
function addEntry(){const viewer=$('hidra3dMobile');const bar=viewer?.querySelector('.h3mscenes');if(bar&&!bar.querySelector('#h3sOpenFromViewer')){
 const b=document.createElement('button');b.type='button';b.id='h3sOpenFromViewer';b.textContent='✎ Criar projeto';b.style.cssText='flex:1 0 auto;border-color:#59bbd9';b.addEventListener('click',open);bar.appendChild(b);}
 const grid=document.querySelector('.modules');if(grid&&!$('h3sTile')){const tile=document.createElement('button');tile.className='module';tile.type='button';tile.id='h3sTile';tile.innerHTML='<span class="symbol">✎</span><span>3D Studio</span>';tile.addEventListener('click',open);grid.appendChild(tile);}}
addEntry();
window.HIDRA3DStudioMobile={open,close,version:'18.0',getProject:()=>clone(project),getMode:()=>mode};
})();
