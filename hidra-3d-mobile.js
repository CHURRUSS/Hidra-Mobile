/* HIDRA Mobile / VISUALIZADOR HOLOGRAFICO 3D - V17
   Adaptado do renderizador Canvas utilizado no Desktop da HIDRA 2.0.
   Sem bibliotecas, APIs, chaves ou servidores para as cenas locais.
   Importacao local experimental: .obj e .stl (maximo 12 MB).
*/
(()=>{'use strict';
if(window.HIDRA3DMobile)return;
const $=id=>document.getElementById(id);
const css=`
#hidra3dMobile[hidden]{display:none!important}
#hidra3dMobile{position:fixed;z-index:9997;inset:0;background:rgba(1,10,19,.88);padding:calc(8px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom));display:flex;justify-content:center;align-items:center;font-family:Arial,Segoe UI,sans-serif;color:#d2f4ff;box-sizing:border-box}
#hidra3dMobile *{box-sizing:border-box}
#hidra3dMobile .h3mwin{height:100%;width:100%;max-width:740px;max-height:900px;display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;border-radius:15px;border:1px solid #40c9ed;background:#051927;box-shadow:0 0 32px #02ccfa66,0 25px 60px #000b}
#hidra3dMobile button{appearance:none;border:1px solid #347a96;border-radius:8px;background:#0d354b;color:#d3f7ff;font:600 12px Arial,sans-serif;padding:9px 10px;cursor:pointer;touch-action:manipulation;white-space:nowrap}
#hidra3dMobile button:active,#hidra3dMobile button.active{background:#17627d;border-color:#62e6ff}
#hidra3dMobile button:focus-visible{outline:2px solid #9ff4ff;outline-offset:2px}
#hidra3dMobile .h3mhead{min-height:59px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:linear-gradient(90deg,#13435e,#061b2c);border-bottom:1px solid #2b8bac}
#hidra3dMobile .h3mtitle{letter-spacing:1.2px;font-size:13px;font-weight:700;color:#b2f4ff}
#hidra3dMobile .h3msub{font-size:10px;color:#77b5c8;margin-top:4px;letter-spacing:1px}
#hidra3dMobile .h3mclose{font-size:17px;padding:8px 12px}
#hidra3dMobile .h3mscenes{display:flex;gap:7px;padding:9px 10px 7px;flex:0 0 auto;background:#071d2d;overflow-x:auto}
#hidra3dMobile .h3mscenes button{flex:1}
#hidra3dMobile .h3mstage{position:relative;flex:1 1 auto;min-height:190px;overflow:hidden;background:#02121f}
#hidra3dMobile canvas{width:100%;height:100%;display:block;touch-action:none;user-select:none}
#hidra3dMobile .h3mbadge{position:absolute;top:12px;left:12px;color:#70dcfa;pointer-events:none;font-size:10px;letter-spacing:1.8px;text-shadow:0 1px 2px #000}
#hidra3dMobile .h3mhint{position:absolute;left:10px;right:10px;bottom:8px;font-size:10px;line-height:1.45;color:#9bd0de;text-shadow:0 2px 3px #000;pointer-events:none;text-align:center}
#hidra3dMobile .h3mtools{display:flex;gap:6px;padding:8px 9px;flex:0 0 auto;overflow-x:auto;scrollbar-width:thin;border-top:1px solid #1e617b;background:#071f30}
#hidra3dMobile .h3mtools button{flex:0 0 auto}
#hidra3dMobile .h3minfo{display:block;font-size:11px;line-height:1.55;white-space:pre-line;padding:8px 12px;flex:0 0 auto;background:#071c2d;border-top:1px solid #25637c;color:#a7dbe9;max-height:103px;overflow:auto}
#hidra3dMobile .h3mstatus{padding:6px 12px 9px;min-height:25px;color:#78c1d4;background:#071c2d;font-size:11px;overflow-wrap:anywhere}
#hidra3dMobile .h3mstatus.error{color:#ffcbcb}
@media (max-width:390px){#hidra3dMobile .h3mscenes{gap:5px;padding:8px 7px}#hidra3dMobile button{padding:8px 8px;font-size:11px}#hidra3dMobile .h3msub{font-size:9px}#hidra3dMobile .h3minfo{max-height:82px}}
@media (orientation:landscape) and (max-height:540px){#hidra3dMobile .h3mhead{min-height:45px;padding:6px 10px}#hidra3dMobile .h3mscenes{padding:5px}#hidra3dMobile .h3mtools{padding:5px}#hidra3dMobile .h3minfo{max-height:55px;padding:4px 10px}#hidra3dMobile .h3mstatus{padding:3px 10px}}
`;
const style=document.createElement('style');style.id='hidra3dMobileStyles';style.textContent=css;document.head.appendChild(style);
const modal=document.createElement('section');modal.id='hidra3dMobile';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Visualizador tridimensional holográfico da HIDRA');
modal.innerHTML=`<div class="h3mwin">
<div class="h3mhead"><div><div class="h3mtitle">⬡ HIDRA / VISUALIZAÇÃO 3D</div><div class="h3msub">LABORATÓRIO HOLOGRÁFICO · MOBILE</div></div><button type="button" class="h3mclose" aria-label="Fechar visualizador">✕</button></div>
<div class="h3mscenes"><button data-scene="armor" type="button">⬡ Armadura</button><button data-scene="atom" type="button">⚛ Átomo</button><button data-scene="solar" type="button">◎ Sistema Solar</button></div>
<div class="h3mstage"><canvas aria-label="Modelo 3D. Arraste um dedo para girar, use dois dedos para zoom e deslocamento."></canvas><div class="h3mbadge">HOLOGRAMA / 3D</div><div class="h3mhint">1 dedo: girar e selecionar · 2 dedos: zoom e deslocamento</div></div>
<div class="h3mtools"><button data-tool="reset" type="button">↺ Restaurar</button><button data-tool="zoomout" type="button">− Zoom</button><button data-tool="zoomin" type="button">＋ Zoom</button><button data-tool="wire" type="button">◇ Wireframe</button><button data-tool="explode" type="button">⇆ Separar</button><button data-tool="spin" type="button">⟳ Giro</button><button data-tool="import" type="button">＋ OBJ / STL</button></div>
<div class="h3minfo" aria-live="polite"></div><div class="h3mstatus" role="status" aria-live="polite">Modelos demonstrativos disponíveis sem conexão com o servidor.</div>
<input id="hidra3dMobileInput" type="file" accept=".stl,.obj" hidden>
</div>`;
document.body.appendChild(modal);
const panel=modal, canvas=modal.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false}),stat=modal.querySelector('.h3minfo');
const infoStatus=modal.querySelector('.h3mstatus'),fileInput=$('hidra3dMobileInput');
const names={armor:'PROTÓTIPO / ARMADURA',atom:'ESTRUTURA ATÔMICA',solar:'SISTEMA SOLAR',external:'MODELO IMPORTADO'};
let alive=true,opened=false,wire=false,explode=false,autoSpin=false,scene='armor';
let angle=.35,pitch=-.12,dist=8.9,panX=0,panY=0,selected=-1,parts=[],frames=0,lastTime=0,lastDraw=0,lastProj=[],raf=0;
const legend=modal.querySelector('.h3mhint');
function notice(msg,isError=false){infoStatus.textContent=msg;infoStatus.classList.toggle('error',isError)}
function V(x,y,z){return [x,y,z]};
function color(hex){return parseInt(hex.replace('#',''),16);}
function rgb(hex,shade,alpha){var c=color(hex),r=(c>>16)&255,g=(c>>8)&255,b=c&255;return 'rgba('+Math.round(r*shade)+','+Math.round(g*shade)+','+Math.round(b*shade)+','+alpha+')';}
function put(name,vertices,faces,mat,offset,grp){parts.push({name:name,vertices:vertices,faces:faces,mat:mat||'#56899d',offset:offset||[0,0,0],group:grp||name});}
function cube(name,x,y,z,sx,sy,sz,mat,grp){var vx=[],f=[],corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];corners.forEach(function(a){vx.push(V(x+a[0]*sx/2,y+a[1]*sy/2,z+a[2]*sz/2));});f=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]];put(name,vx,f,mat,[x,y,z],grp);}
function cyl(name,x,y,z,r,h,mat,axis,grp){var v=[],f=[],n=12;for(var row=0;row<2;row++)for(var j=0;j<n;j++){var a=2*Math.PI*j/n;var px=Math.cos(a)*r,pz=Math.sin(a)*r,py=(row?1:-1)*h/2;
 if(axis==='x')v.push(V(x+py,y+px,z+pz));else if(axis==='z')v.push(V(x+px,y+pz,z+py));else v.push(V(x+px,y+py,z+pz));}
 f.push(Array.from({length:n},function(_,i){return n-1-i}));f.push(Array.from({length:n},function(_,i){return i+n}));for(var k=0;k<n;k++)f.push([k,(k+1)%n,(k+1)%n+n,k+n]);put(name,v,f,mat,[x,y,z],grp);}
function demoArmor(){parts=[];var steel='#6a8898',shadow='#304b5f',blue='#2b89a4',lit='#4fd9f4',dark='#243e4f';
 cube('Estrutura torácica',0,.72,0,1.30,1.23,.65,shadow,'Tórax');cube('Peitoral reforçado',0,.82,.39,1.36,.93,.21,steel,'Tórax');
 cube('Blindagem peitoral esquerda',-.39,1.03,.54,.54,.5,.18,steel,'Tórax');cube('Blindagem peitoral direita',.39,1.03,.54,.54,.5,.18,steel,'Tórax');
 cyl('Núcleo de energia',0,.77,.57,.205,.085,lit,'z','Tórax');cyl('Reator interno',0,.77,.64,.115,.05,blue,'z','Tórax');
 cube('Abdômen articulado',0,-.10,0,.83,.67,.47,dark,'Tronco');cube('Cintura',0,-.59,0,1.04,.33,.64,steel,'Tronco');
 cube('Pescoço',0,1.50,0,.32,.34,.32,steel,'Capacete');cube('Capacete',0,1.91,0,.67,.66,.63,steel,'Capacete');cube('Viseira',0,1.96,.34,.62,.20,.07,lit,'Capacete');
 cube('Crista superior',0,2.28,-.03,.25,.13,.40,blue,'Capacete');
 [-1,1].forEach(function(s){var side=s<0?'esquerdo':'direito',gA='Braço '+side,gL='Perna '+side;
 cube('Ombreira '+side,s*.93,1.13,-.02,.70,.56,.73,steel,gA);
 cyl('Articulação do ombro '+side,s*.95,.75,.0,.28,.31,dark,'x',gA);
 cube('Braço superior '+side,s*1.02,.36,0,.43,.69,.45,shadow,gA);
 cyl('Cotovelo '+side,s*1.02,-.06,.0,.25,.32,lit,'x',gA);
 cube('Antebraço '+side,s*1.05,-.46,.11,.48,.73,.46,steel,gA);
 cube('Mão '+side,s*1.04,-.98,.15,.38,.31,.32,dark,gA);
 cube('Quadril '+side,s*.45,-.84,0,.53,.43,.55,steel,gL);
 cube('Coxa '+side,s*.46,-1.30,.04,.53,.68,.56,shadow,gL);
 cyl('Joelho '+side,s*.46,-1.78,.16,.275,.39,lit,'z',gL);
 cube('Canela '+side,s*.47,-2.18,.05,.52,.71,.55,steel,gL);
 cube('Bota '+side,s*.47,-2.67,.21,.63,.36,.88,dark,gL);
 });
 cube('Módulo dorsal',0,.81,-.48,1.12,.92,.35,blue,'Costas');
}
function demoAtom(){parts=[];cyl('Núcleo atômico',0,0,0,.43,.68,'#33afc9','y','Núcleo');
 for(var a=0;a<3;a++){var theta=Math.PI*a/3;for(var i=0;i<28;i++){var t=2*Math.PI*i/28;var x=2.0*Math.cos(t),y=1.23*Math.sin(t),z=0;
 var yy=y*Math.cos(theta)-z*Math.sin(theta),zz=y*Math.sin(theta)+z*Math.cos(theta);
 cube('Órbita '+(a+1),x,yy,zz,.045,.045,.045,a===1?'#62deed':'#2f7fa5','Órbita '+(a+1));}
 cube('Elétron '+(a+1),1.8*Math.cos(a*2),.95*Math.sin(a*2)*Math.cos(theta),.95*Math.sin(a*2)*Math.sin(theta),.19,.19,.19,'#8cffff','Órbita '+(a+1));}
}
function demoSolar(){parts=[];var data=[['Sol',0,.62,'#ffca58'],['Mercúrio',1.1,.11,'#999cac'],['Vênus',1.55,.20,'#d0ad79'],['Terra',2.16,.23,'#4bbfe6'],['Marte',2.77,.16,'#da7c5b']];
 data.forEach(function(r,i){var x=i?Math.cos(i*1.7)*r[1]:0,z=i?Math.sin(i*1.7)*r[1]:0;var n=i===0?14:10;var v=[],f=[];for(var lat=0;lat<=n;lat++)for(var lon=0;lon<=n*2;lon++){var a=Math.PI*lat/n,b=2*Math.PI*lon/(2*n);v.push([x+Math.sin(a)*Math.cos(b)*r[2],Math.cos(a)*r[2],z+Math.sin(a)*Math.sin(b)*r[2]]);}
 for(var k=0;k<n;k++)for(var j=0;j<2*n;j++){var m=k*(2*n+1)+j;f.push([m,m+2*n+1,m+2*n+2,m+1]);}put(r[0],v,f,r[3],[x,0,z],r[0]);});
}
function normalizeImported(){var min=[1e20,1e20,1e20],max=[-1e20,-1e20,-1e20];parts.forEach(function(p){p.vertices.forEach(function(v){for(var k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}});});var center=min.map(function(x,i){return(x+max[i])/2;}),s=Math.max.apply(Math,max.map(function(x,i){return x-min[i];}));if(!isFinite(s)||s<=0)s=1;var fac=4.65/s;parts.forEach(function(p){p.vertices=p.vertices.map(function(v){return v.map(function(t,i){return(t-center[i])*fac;});});p.offset=p.offset.map(function(t,i){return(t-center[i])*fac;});});}
function loadOBJ(raw){
  const vertices=[], chunks=[]; let current={name:'Objeto OBJ',faces:[]};
  function endChunk(){if(current.faces.length)chunks.push(current);}
  for(const lineRaw of raw.split(/\r?\n/)){
    const line=lineRaw.trim();
    if(line.startsWith('v ')){
      const v=line.split(/\s+/).slice(1,4).map(Number);
      if(v.length===3&&v.every(Number.isFinite))vertices.push(v);
      if(vertices.length>80000)throw Error('OBJ muito grande para o protótipo Mobile (limite: 80 mil vértices).');
    }else if(/^(?:o|g)\s+/.test(line)){
      endChunk();current={name:line.slice(2).trim().slice(0,100)||'Peça',faces:[]};
    }else if(line.startsWith('f ')){
      const ids=line.split(/\s+/).slice(1).map(t=>{
        const n=parseInt(t.split('/')[0],10);return n<0?vertices.length+n:n-1;
      });
      if(ids.length>=3 && ids.every(i=>Number.isInteger(i)&&i>=0&&i<vertices.length))current.faces.push(ids);
    }
  }
  endChunk();
  let count=chunks.reduce((n,c)=>n+c.faces.length,0);
  if(!count)throw Error('OBJ sem faces válidas.');
  const step=Math.max(1,Math.ceil(count/5500));let pos=0;
  parts=[];
  chunks.forEach((c,i)=>{
    const faces=c.faces.filter(()=>!(pos++%step));
    if(faces.length)put(c.name,vertices,faces,['#3f8498','#648d9b','#285d75','#89b4c4'][i%4],[0,0,0],c.name);
  });
  normalizeImported();
}
function loadSTL(buffer){
  const dv=new DataView(buffer);
  const n=buffer.byteLength>=84?dv.getUint32(80,true):0;
  const vertices=[],faces=[];
  if(n>0 && 84+n*50===buffer.byteLength){
    const step=Math.max(1,Math.ceil(n/5500));
    for(let i=0;i<n;i+=step){
      const start=84+i*50,ids=[];
      for(let j=0;j<3;j++){
        const k=start+12+j*12;
        const v=[dv.getFloat32(k,true),dv.getFloat32(k+4,true),dv.getFloat32(k+8,true)];
        if(!v.every(Number.isFinite))continue;
        ids.push(vertices.length);vertices.push(v);
      }
      if(ids.length===3)faces.push(ids);
    }
  }else{
    const txt=new TextDecoder().decode(buffer), matches=[...txt.matchAll(/vertex\s+([\-\d.eE+]+)\s+([\-\d.eE+]+)\s+([\-\d.eE+]+)/g)];
    const step=Math.max(1,Math.ceil((matches.length/3)/5500));
    for(let i=0;i+2<matches.length;i+=3*step){
      const ids=[];
      for(let j=0;j<3;j++){
        const m=matches[i+j],v=[+m[1],+m[2],+m[3]];
        if(!v.every(Number.isFinite))continue;
        ids.push(vertices.length);vertices.push(v);
      }
      if(ids.length===3)faces.push(ids);
    }
  }
  if(!faces.length)throw Error('STL sem faces válidas.');
  parts=[];put('Peça STL',vertices,faces,'#6b9fb0',[0,0,0]);normalizeImported();
}
function project(p,w,h,offset){var x=p[0],y=p[1],z=p[2];if(offset){x+=offset[0];y+=offset[1];z+=offset[2];}var cy=Math.cos(angle),sy=Math.sin(angle),cp=Math.cos(pitch),sp=Math.sin(pitch);
 var x1=x*cy-z*sy,z1=x*sy+z*cy,y2=y*cp-z1*sp,z2=y*sp+z1*cp;
 var depth=Math.max(.35,dist-z2),scale=Math.min(w*1.20,h*2.50);return{x:w/2+panX+scale*x1/depth,y:h/2+panY-scale*y2/depth,d:depth,z:z2};}
function render(ts){if(!alive||!opened)return;raf=requestAnimationFrame(render);if(!canvas||!ctx||ts-lastDraw<33)return;lastDraw=ts;
 if(autoSpin){angle+=Math.min(.025,Math.max(.001,(ts-lastTime||16)/1000*.16));}lastTime=ts;
 var rect=canvas.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1),w=rect.width,h=rect.height;if(w<20||h<20)return;
 if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 var gg=ctx.createRadialGradient(w/2,h*.58,20,w/2,h*.55,Math.max(w,h)*.7);gg.addColorStop(0,'#0e3d54');gg.addColorStop(1,'#03101b');ctx.fillStyle=gg;ctx.fillRect(0,0,w,h);
 // Plano de referência em perspectiva, coordenadas 3D reais
 ctx.strokeStyle='#17537455';ctx.lineWidth=1;
 for(var g=-4;g<=4;g++){var a=project([-4,-3.05,g],w,h),b=project([4,-3.05,g],w,h);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();a=project([g,-3.05,-4],w,h);b=project([g,-3.05,4],w,h);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 var faces=[],centers=[];lastProj=[];
 for(var pi=0;pi<parts.length;pi++){
  var part=parts[pi];var offs=explode?[part.offset[0]*.42,part.offset[1]*.24,part.offset[2]*.42]:[0,0,0];var pts=part.vertices.map(function(v){return project(v,w,h,offs);});var avgx=0,avgy=0,avgz=0;pts.forEach(function(p){avgx+=p.x;avgy+=p.y;avgz+=p.d;});centers.push({index:pi,x:avgx/pts.length,y:avgy/pts.length,d:avgz/pts.length});
 for(var fi=0;fi<part.faces.length;fi++){var ids=part.faces[fi],pp=ids.map(function(j){return pts[j];}).filter(Boolean);if(pp.length<3)continue;var depth=pp.reduce(function(z,p){return z+p.d;},0)/pp.length;
 var u=part.vertices[ids[0]],v=part.vertices[ids[1]],t=part.vertices[ids[2]],ax=v[0]-u[0],ay=v[1]-u[1],az=v[2]-u[2],bx=t[0]-u[0],by=t[1]-u[1],bz=t[2]-u[2],nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
 var nn=Math.hypot(nx,ny,nz)||1;var shade=Math.min(1.45,.35+.75*Math.abs((nx*.35+ny*.66+nz*.60)/nn));
 faces.push({pts:pp,depth:depth,mat:part.mat,shade:shade,index:pi});}}
 faces.sort(function(a,b){return b.depth-a.depth;});
 ctx.lineWidth=wire?1.25:.7;
 for(var f=0;f<faces.length;f++){
  var face=faces[f],pts=face.pts;if(pts.length>50)continue;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(var k=1;k<pts.length;k++)ctx.lineTo(pts[k].x,pts[k].y);ctx.closePath();
  ctx.fillStyle=wire?'rgba(4,29,43,.02)':rgb(face.mat,face.shade,face.index===selected?.93:.86);ctx.strokeStyle=face.index===selected?'#adffff':wire?'#41daed99':'#3fb6d566';
  if(!wire)ctx.fill();ctx.stroke();}
 if(scene==='armor'&&!wire){var en=project([0,.77,.72],w,h,explode?[0,.12,0]:null);ctx.shadowColor='#38eaff';ctx.shadowBlur=24;ctx.strokeStyle='#a6faff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(en.x,en.y,Math.max(3,21/dist),0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
 // Mira holográfica, ao redor do modelo.
 ctx.strokeStyle='#21ddff55';ctx.lineWidth=1;ctx.setLineDash([5,8]);ctx.beginPath();ctx.ellipse(w/2+panX,h/2+panY,Math.min(w*.41,220),Math.min(h*.41,240),0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 lastProj=centers;
 frames++;
}
function selectAt(x,y){var best=-1,bd=55;lastProj.forEach(function(p){var d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p.index;}});selected=best;updateInfo();}
function updateInfo(){
  if(!stat)return;
  const part=parts[selected];
  stat.textContent='MODELO: '+(names[scene]||scene)+'\nCOMPONENTES: '+parts.length+'\nMODO: '+(wire?'Wireframe':'Sólido / Holográfico')+'\nPEÇA SELECIONADA: '+(part?part.name:'Toque na peça para inspecionar.');
}
function reset(){angle=.35;pitch=-.12;dist=scene==='solar'?8.7:8.9;panX=panY=0;selected=-1;updateInfo();}
function chooseScene(name){scene=name;selected=-1;wire=false;explode=false;autoSpin=false;
 if(name==='atom')demoAtom();else if(name==='solar')demoSolar();else if(name==='armor')demoArmor();reset();if(legend)legend.textContent=(names[scene]||scene)+' · ARRASTE PARA GIRAR';
 if(panel){panel.querySelectorAll('[data-scene]').forEach(function(b){b.classList.toggle('active',b.dataset.scene===name);});panel.querySelectorAll('[data-tool=wire],[data-tool=explode],[data-tool=spin]').forEach(function(b){b.classList.remove('active');});}updateInfo();}


function open(name){
  if(name&&['armor','atom','solar'].includes(name)&&name!==scene)chooseScene(name);
  modal.hidden=false;opened=true;document.body.style.overflow='hidden';
  updateInfo();notice('Visualizador local pronto. Use um ou dois dedos para manipular o modelo.');
  if(!raf){lastDraw=0;raf=requestAnimationFrame(render);}
}
function close(){opened=false;modal.hidden=true;if(raf)cancelAnimationFrame(raf);raf=0;document.body.style.overflow=previousBodyOverflow;}
const previousBodyOverflow=document.body.style.overflow;
function changeZoom(mult){dist=Math.max(3.5,Math.min(24,dist*mult));}
modal.querySelector('.h3mclose').addEventListener('click',close);
modal.querySelectorAll('[data-scene]').forEach(btn=>btn.addEventListener('click',()=>{
  chooseScene(btn.dataset.scene);notice('Cena carregada: '+names[scene]+'.');
}));
modal.querySelector('[data-tool="reset"]').onclick=()=>{reset();notice('Visualização restaurada.');};
modal.querySelector('[data-tool="zoomin"]').onclick=()=>changeZoom(.83);
modal.querySelector('[data-tool="zoomout"]').onclick=()=>changeZoom(1.20);
modal.querySelector('[data-tool="wire"]').onclick=e=>{wire=!wire;e.currentTarget.classList.toggle('active',wire);updateInfo();};
modal.querySelector('[data-tool="explode"]').onclick=e=>{explode=!explode;e.currentTarget.classList.toggle('active',explode);updateInfo();};
modal.querySelector('[data-tool="spin"]').onclick=e=>{autoSpin=!autoSpin;e.currentTarget.classList.toggle('active',autoSpin);};
modal.querySelector('[data-tool="import"]').onclick=()=>fileInput.click();
fileInput.onchange=async()=>{
  const f=fileInput.files?.[0];fileInput.value='';if(!f)return;
  if(f.size>12*1024*1024){notice('O arquivo excede o limite experimental de 12 MB.',true);return;}
  const ext=f.name.split('.').pop().toLowerCase();if(!['obj','stl'].includes(ext)){notice('Use arquivos OBJ ou STL nesta versão.',true);return;}
  notice('Lendo '+f.name+' no celular...');
  try{
    const buffer=await f.arrayBuffer();
    if(!buffer.byteLength)throw Error('O arquivo está vazio.');
    if(ext==='obj')loadOBJ(new TextDecoder().decode(buffer));else loadSTL(buffer);
    scene='external';names.external=f.name;reset();
    modal.querySelectorAll('[data-scene]').forEach(btn=>btn.classList.remove('active'));
    notice('Modelo carregado localmente: '+f.name+' ('+parts.length+' componente(s)).');
  }catch(err){notice('Não consegui abrir '+f.name+': '+(err?.message||err),true);chooseScene('armor');}
};
// Pointer Events permitem mouse e toque. Com dois dedos, gesto combinado de pinça e deslocamento.
const pointers=new Map();let twoFinger=null,press=null;
function midpointAndDistance(){
 const a=[...pointers.values()];if(a.length<2)return null;
 return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.max(4,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y))};
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  e.preventDefault();canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});
  if(pointers.size===1){press={x:e.clientX,y:e.clientY,moved:false,button:e.button};twoFinger=null;}
  if(pointers.size===2){twoFinger=midpointAndDistance();if(press)press.moved=true;}
});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;
 e.preventDefault();const old=pointers.get(e.pointerId);
 const dx=e.clientX-old.x,dy=e.clientY-old.y;
 old.x=e.clientX;old.y=e.clientY;
 if(pointers.size>=2){
   const next=midpointAndDistance();
   if(twoFinger){panX+=next.x-twoFinger.x;panY+=next.y-twoFinger.y;changeZoom(twoFinger.d/next.d);}
   twoFinger=next;if(press)press.moved=true;
 }else if(press){
   if(Math.abs(e.clientX-press.x)+Math.abs(e.clientY-press.y)>8)press.moved=true;
   if(old.button===2||e.shiftKey){panX+=dx;panY+=dy;}
   else{angle-=dx*.011;pitch=Math.max(-1.35,Math.min(1.35,pitch+dy*.011));}
 }
});
function pointerEnd(e){
 if(!pointers.has(e.pointerId))return;
 pointers.delete(e.pointerId);
 if(!pointers.size){
   if(press&&!press.moved&&press.button!==2){const rect=canvas.getBoundingClientRect();selectAt(e.clientX-rect.left,e.clientY-rect.top);}
   press=null;twoFinger=null;
 }else if(pointers.size===1){const val=[...pointers.values()][0];press={x:val.x,y:val.y,moved:true,button:val.button};twoFinger=null;}
}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);
canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY>0?1.12:.90);},{passive:false});
// Botão novo: segue a identidade dos demais módulos sem alterar seus handlers.
const tile=document.createElement('button');tile.id='hidra3dMobileTile';tile.className='module';tile.type='button';
tile.innerHTML='<span class="symbol">⬡</span><span>Modelo 3D</span>';
tile.addEventListener('click',()=>open('armor'));
const grid=document.querySelector('.modules');if(grid)grid.appendChild(tile);
window.HIDRA3DMobile={open,close,version:'17.0',getScene:()=>scene};
chooseScene('armor');
})();
