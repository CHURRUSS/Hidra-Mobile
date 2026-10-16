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