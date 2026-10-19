/* HIDRA 3D Studio V20 - formatos experimentais STL, OBJ, 3MF.
   Arquivos 3MF: objetos separados, cor de referencia por objeto, unidade mm.
   Importador: malhas leves sem edicao de vertices; projetos editaveis em .hidra3d.
*/
(()=>{'use strict';
if(window.HIDRA3DIO)return;
const TAU=Math.PI*2,RAD=Math.PI/180;
const enc=new TextEncoder(),dec=new TextDecoder();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Number(n.toFixed(6)).toString();
function primitive(type){
 if(type==='cube'){const v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
 return {v,f:[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[1,2,6,5],[0,4,7,3]]};}
 if(type==='sphere'){const v=[],f=[],rings=12,segs=20;
 for(let i=0;i<=rings;i++){const phi=Math.PI*i/rings;for(let j=0;j<segs;j++){const a=TAU*j/segs;v.push([.5*Math.sin(phi)*Math.cos(a),.5*Math.sin(phi)*Math.sin(a),.5*Math.cos(phi)]);}}
 for(let i=0;i<rings;i++)for(let j=0;j<segs;j++){const a=i*segs+j,b=i*segs+(j+1)%segs,c=(i+1)*segs+(j+1)%segs,d=(i+1)*segs+j;
 if(i>0)f.push([a,b,d]);if(i<rings-1)f.push([b,c,d]);}return{v,f};}
 const segs=24,v=[],f=[];
 for(let j=0;j<segs;j++){const a=TAU*j/segs;v.push([.5*Math.cos(a),.5*Math.sin(a),-.5]);}
 if(type==='cylinder'){for(let j=0;j<segs;j++){const a=TAU*j/segs;v.push([.5*Math.cos(a),.5*Math.sin(a),.5]);}
 for(let j=0;j<segs;j++){const k=(j+1)%segs;f.push([j,k,segs+k],[j,segs+k,segs+j]);}
 for(let j=1;j<segs-1;j++){f.push([0,j+1,j]);f.push([segs,segs+j,segs+j+1]);}
 }else if(type==='cone'){v.push([0,0,.5]);for(let j=0;j<segs;j++)f.push([j,(j+1)%segs,segs]);for(let j=1;j<segs-1;j++)f.push([0,j+1,j]);}
 return{v,f};
}
function transformed(v,o){let [x,y,z]=v.map((n,i)=>n*(o.scale?.[i]??1)),[rx,ry,rz]=(o.rotation||[0,0,0]).map(n=>n*RAD);
 let c=Math.cos(rx),s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(ry);s=Math.sin(ry);[x,z]=[x*c+z*s,-x*s+z*c];
 c=Math.cos(rz);s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c];return [x+(o.position?.[0]||0),y+(o.position?.[1]||0),z+(o.position?.[2]||0)];}
function triangulate(objects,mm){const result=[];let total=0;
 for(const o of objects){if(o.visible===false)continue;const g=o.type==='mesh'?o.geometry:primitive(o.type);if(!g||!Array.isArray(g.v)||!Array.isArray(g.f))continue;
 const vertices=g.v.map(v=>transformed(v,o).map(n=>n*mm));const faces=[];
 for(const face of g.f){for(let i=1;i+1<face.length;i++){faces.push([face[0],face[i],face[i+1]]);total++;}}
 if(total>24000)throw Error('Modelo grande demais para exportação Mobile (24 mil triângulos).');
 result.push({name:String(o.name||o.type),color:/^#[0-9a-f]{6}$/i.test(o.color||'')?o.color:'#64c9e5',vertices,faces});}
 if(!result.length)throw Error('Adicione pelo menos uma peça visível antes de exportar.');return result;}
function safeName(n){return String(n||'modelo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,58)||'modelo';}
function download(name,blob){const href=URL.createObjectURL(blob),link=document.createElement('a');link.href=href;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),30000);}
function exportOBJ(name,parts){let out='# HIDRA 3D Studio V20 | unidades: mm | grupos independentes\n',idx=0;
 for(const p of parts){out+='o '+safeName(p.name)+'\n';out+='# cor '+p.color+'\n';for(const v of p.vertices)out+='v '+v.map(fmt).join(' ')+'\n';
 for(const f of p.faces)out+='f '+f.map(i=>i+1+idx).join(' ')+'\n';idx+=p.vertices.length;}
 download(safeName(name)+'.obj',new Blob([out],{type:'text/plain'}));}
function exportSTL(name,parts){const triangles=[];
 for(const p of parts)for(const f of p.faces)triangles.push(f.map(i=>p.vertices[i]));
 const data=new ArrayBuffer(84+triangles.length*50),d=new DataView(data);new Uint8Array(data).set(enc.encode('HIDRA 3D STUDIO / sem cores').slice(0,80));d.setUint32(80,triangles.length,true);
 let off=84;for(const tri of triangles){const[a,b,c]=tri,u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(x=>x/l);
 for(const vertex of [n,...tri])for(const n of vertex){d.setFloat32(off,n,true);off+=4;}d.setUint16(off,0,true);off+=2;}
 download(safeName(name)+'.stl',new Blob([data],{type:'model/stl'}));}
function xmlEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function zipStore(files){const parts=[];let offset=0;const entries=[];
 for(const [name,contents] of files){const n=enc.encode(name),b=typeof contents==='string'?enc.encode(contents):contents;const crc=crc32(b),h=new Uint8Array(30+n.length),v=new DataView(h.buffer);
 v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(8,0,true);v.setUint32(14,crc,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);h.set(n,30);parts.push(h,b);entries.push({name:n,crc,length:b.length,offset});offset+=h.length+b.length;}
 let centralLen=0;for(const e of entries){const h=new Uint8Array(46+e.name.length),v=new DataView(h.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint32(16,e.crc,true);v.setUint32(20,e.length,true);v.setUint32(24,e.length,true);v.setUint16(28,e.name.length,true);v.setUint32(42,e.offset,true);h.set(e.name,46);parts.push(h);centralLen+=h.length;}
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,centralLen,true);v.setUint32(16,offset,true);parts.push(end);return new Blob(parts,{type:'model/3mf'});}
function export3MF(name,parts){const colors=[...new Set(parts.map(p=>p.color.toUpperCase()))],matId=1;
 let objects='';const build=[];for(let i=0;i<parts.length;i++){const p=parts[i],id=i+2;
 objects+=`<object id="${id}" type="model" name="${xmlEscape(p.name)}" pid="${matId}" pindex="${colors.indexOf(p.color.toUpperCase())}"><mesh><vertices>`;
 for(const v of p.vertices)objects+=`<vertex x="${fmt(v[0])}" y="${fmt(v[1])}" z="${fmt(v[2])}"/>`;
 objects+='</vertices><triangles>';for(const f of p.faces)objects+=`<triangle v1="${f[0]}" v2="${f[1]}" v3="${f[2]}"/>`;
 objects+='</triangles></mesh></object>';build.push(`<item objectid="${id}"/>`);}
 const xml=`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="pt-BR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><basematerials id="1">${colors.map((c,i)=>`<base name="Material ${i+1}" displaycolor="${c}FF"/>`).join('')}</basematerials>${objects}</resources><build>${build.join('')}</build></model>`;
 const types=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
 download(safeName(name)+'.3mf',zipStore([['[Content_Types].xml',types],['_rels/.rels',rels],['3D/3dmodel.model',xml]]));}
function exportModel(project,ext,mm){if(!Number.isFinite(mm)||mm<=0||mm>10000)throw Error('Escala de exportação inválida.');const parts=triangulate(project.objects,mm);
 if(ext==='obj')exportOBJ(project.name,parts);else if(ext==='stl')exportSTL(project.name,parts);else if(ext==='3mf')export3MF(project.name,parts);else throw Error('Formato não reconhecido.');return parts.length;}
function objectFromMesh(name,vertices,faces,color,mm=10){if(!faces.length||faces.length>1800)throw Error('Modelo acima do limite de 1.800 triângulos da edição Mobile.');if(vertices.length>5600)throw Error('Malha grande demais.');
 const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];for(const v of vertices){if(v.length!==3||v.some(n=>!Number.isFinite(n)||Math.abs(n)>1e8))throw Error('Coordenadas inválidas no modelo.');for(let i=0;i<3;i++){mins[i]=Math.min(mins[i],v[i]);maxs[i]=Math.max(maxs[i],v[i]);}}
 const center=mins.map((a,i)=>(a+maxs[i])/2);return{id:'import_'+Math.random().toString(36).slice(2),name:String(name||'Malha').slice(0,65),type:'mesh',color,position:center.map(v=>v/mm),rotation:[0,0,0],scale:[1,1,1],visible:true,geometry:{v:vertices.map(v=>v.map((n,i)=>(n-center[i])/mm)),f:faces}};}
function importOBJ(data,name,mm){const text=dec.decode(data),verts=[],groups=[];let group={name:'Malha OBJ',faces:[],color:'#65b9d5'};groups.push(group);let vertexCount=0;
 for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(line.startsWith('v ')){const xyz=line.split(/\s+/).slice(1,4).map(Number);if(xyz.length!==3||xyz.some(x=>!Number.isFinite(x)))throw Error('Vértice OBJ inválido.');verts.push(xyz);if(verts.length>6000)throw Error('OBJ muito grande.');}
 else if(/^(?:o|g)\s/.test(line)){if(group.faces.length){group={name:line.slice(2).trim().slice(0,65)||'Parte OBJ',faces:[],color:'#65b9d5'};groups.push(group);}else group.name=line.slice(2).trim().slice(0,65)||'Parte OBJ';}
 else if(line.startsWith('# cor '))group.color=/^#[a-f\d]{6}$/i.test(line.slice(6).trim())?line.slice(6).trim():group.color;
 else if(line.startsWith('f ')){const ids=line.split(/\s+/).slice(1).map(t=>{const n=parseInt(t.split('/')[0],10);return n<0?verts.length+n:n-1;});if(ids.length<3||ids.some(n=>!Number.isInteger(n)||n<0||n>=verts.length))throw Error('Face OBJ inválida.');for(let j=1;j<ids.length-1;j++)group.faces.push([ids[0],ids[j],ids[j+1]]);vertexCount+=ids.length-2;if(vertexCount>1800)throw Error('OBJ acima de 1.800 triângulos.');}}
 const objects=[];for(const g of groups){if(!g.faces.length)continue;const used=[...new Set(g.faces.flat())],map=new Map(used.map((v,i)=>[v,i]));objects.push(objectFromMesh(g.name,used.map(i=>verts[i]),g.faces.map(f=>f.map(i=>map.get(i))),g.color,mm));}
 if(!objects.length)throw Error('OBJ não contém faces.');if(objects.length>80)throw Error('Mais de 80 objetos no OBJ.');return {name:name.replace(/\.obj$/i,''),objects};}
function importSTL(data,name,mm){const dv=new DataView(data),binary=data.byteLength>=84&&84+dv.getUint32(80,true)*50===data.byteLength;const verts=[],faces=[];
 function add(a,b,c){const i=verts.length;verts.push(a,b,c);faces.push([i,i+1,i+2]);if(faces.length>1800)throw Error('STL acima de 1.800 triângulos.');}
 if(binary){for(let off=84;off<data.byteLength;off+=50){const p=[];for(let i=0;i<3;i++){const k=off+12+12*i;p.push([dv.getFloat32(k,true),dv.getFloat32(k+4,true),dv.getFloat32(k+8,true)]);}add(...p);}}
 else{let tri=[];for(const m of dec.decode(data).matchAll(/\bvertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gi)){tri.push([Number(m[1]),Number(m[2]),Number(m[3])]);if(tri.length===3){add(...tri);tri=[];}}}
 if(!faces.length)throw Error('STL sem faces.');return{name:name.replace(/\.stl$/i,''),objects:[objectFromMesh(name.replace(/\.stl$/i,''),verts,faces,'#6fc9e2',mm)]};}
async function unzip(bytes){const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(v.getUint32(i,true)===0x06054b50){end=i;break;}}if(end<0)throw Error('3MF não é um ZIP válido.');const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true);let pos=start;const files={};
 for(let i=0;i<count;i++){if(v.getUint32(pos,true)!==0x02014b50)throw Error('Índice 3MF inválido.');const method=v.getUint16(pos+10,true),len=v.getUint32(pos+20,true),nameLen=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),local=v.getUint32(pos+42,true),name=dec.decode(bytes.slice(pos+46,pos+46+nameLen));
 if(/^3D\/.*\.model$/i.test(name)){if(v.getUint32(local,true)!==0x04034b50)throw Error('Entrada 3MF inválida.');const size=v.getUint16(local+26,true),xlen=v.getUint16(local+28,true),from=local+30+size+xlen,raw=bytes.slice(from,from+len);
 if(method===0)files[name]=raw;else if(method===8&&typeof DecompressionStream!=='undefined'){try{const ds=new DecompressionStream('deflate-raw');files[name]=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());}catch(e){throw Error('3MF comprimido não pôde ser lido neste navegador.');}}else throw Error('Tipo de compressão 3MF não suportado no celular.');}
 pos+=46+nameLen+extra+comment;}
 const file=Object.keys(files).find(k=>/3dmodel\.model$/i.test(k))||Object.keys(files)[0];if(!file)throw Error('3MF sem modelo 3D.');return dec.decode(files[file]);}
function localNames(parent,name){return Array.from(parent.getElementsByTagName('*')).filter(x=>x.localName===name);}
async function import3MF(data,name,mm){const xml=await unzip(new Uint8Array(data)),doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('XML interno do 3MF inválido.');const model=doc.documentElement,unit=model.getAttribute('unit')||'millimeter',factor=({millimeter:1,centimeter:10,meter:1000,inch:25.4,foot:304.8,micron:.001})[unit]??1;
 const byId=new Map(),colors=new Map();for(const res of localNames(model,'basematerials')){const list=localNames(res,'base');colors.set(res.getAttribute('id'),list.map(x=>(x.getAttribute('displaycolor')||'#6fc9e2').slice(0,7)));}
 for(const o of localNames(model,'object')){const mesh=localNames(o,'mesh')[0];if(!mesh)continue;const vs=localNames(mesh,'vertex').map(x=>[+x.getAttribute('x'),+x.getAttribute('y'),+x.getAttribute('z')]);const fs=localNames(mesh,'triangle').map(x=>[+x.getAttribute('v1'),+x.getAttribute('v2'),+x.getAttribute('v3')]);if(!vs.length||!fs.length)continue;
 const palette=colors.get(o.getAttribute('pid'))||[];byId.set(o.getAttribute('id'),{name:o.getAttribute('name')||'Componente 3MF',v:vs,f:fs,color:palette[+(o.getAttribute('pindex')||0)]||'#68c6e3'});}
 const items=localNames(model,'build').flatMap(b=>localNames(b,'item'));let objects=[],total=0;
 for(const item of items){const o=byId.get(item.getAttribute('objectid'));if(!o)continue;total+=o.f.length;if(total>1800||objects.length>=80)throw Error('3MF grande demais (limite de 80 peças e 1.800 triângulos).');
 const trans=item.getAttribute('transform');let v=o.v.map(p=>p.map(n=>n*factor));if(trans){const t=trans.trim().split(/\s+/).map(Number);if(t.length===12&&t.every(Number.isFinite))v=v.map(p=>[t[0]*p[0]+t[3]*p[1]+t[6]*p[2]+t[9]*factor,t[1]*p[0]+t[4]*p[1]+t[7]*p[2]+t[10]*factor,t[2]*p[0]+t[5]*p[1]+t[8]*p[2]+t[11]*factor]);}
 objects.push(objectFromMesh(o.name,v,o.f,o.color,mm));}
 if(!objects.length)throw Error('3MF não possui peças simples compatíveis com este editor.');return{name:name.replace(/\.3mf$/i,''),objects};}
async function importModel(file,ext,mm){if(!file||file.size>3*1024*1024)throw Error('Arquivo acima de 3 MB. Use um modelo mais leve.');const data=await file.arrayBuffer(),name=file.name;
 if(ext==='obj')return importOBJ(new Uint8Array(data),name,mm);if(ext==='stl')return importSTL(data,name,mm);if(ext==='3mf')return import3MF(data,name,mm);throw Error('Formato de arquivo não reconhecido.');}
window.HIDRA3DIO={exportModel,importModel,version:'20.0'};
})();
