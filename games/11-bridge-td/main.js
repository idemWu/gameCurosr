const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const waveEl=document.getElementById("wave"),goldEl=document.getElementById("gold"),hpEl=document.getElementById("hp"),selEl=document.getElementById("sel");
const path=[{x:0,y:140},{x:120,y:140},{x:120,y:60},{x:280,y:60},{x:280,y:200},{x:480,y:200}];
const slots=[{x:90,y:100},{x:90,y:170},{x:160,y:90},{x:250,y:100},{x:250,y:160},{x:320,y:160}];
const state={running:false,wave:0,gold:40,hp:10,towers:[],enemies:[],sel:"arrow",spawn:0,between:0,active:false};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){waveEl.textContent=String(state.wave);goldEl.textContent=String(state.gold);hpEl.textContent=String(state.hp);selEl.textContent="选择："+(state.sel==="arrow"?"箭塔":"冰塔");}
function reset(){Object.assign(state,{wave:0,gold:40,hp:10,towers:[],enemies:[],sel:"arrow",spawn:0,between:90,active:false});hud();}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
document.getElementById("t1").onclick=()=>{state.sel="arrow";hud();};
document.getElementById("t2").onclick=()=>{state.sel="ice";hud();};
canvas.onclick=(ev)=>{
  if(!state.running)return;
  const r=canvas.getBoundingClientRect();const x=(ev.clientX-r.left)*(canvas.width/r.width),y=(ev.clientY-r.top)*(canvas.height/r.height);
  const slot=slots.find(s=>Math.hypot(s.x-x,s.y-y)<18); if(!slot)return;
  if(state.towers.some(t=>t.x===slot.x&&t.y===slot.y))return;
  const cost=state.sel==="arrow"?15:25; if(state.gold<cost)return;
  state.gold-=cost; state.towers.push({...slot,type:state.sel,cd:0}); hud();
};
function pathPos(t){
  let dist=t*20; for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];const seg=Math.hypot(b.x-a.x,b.y-a.y); if(dist<=seg){const k=dist/seg;return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k};} dist-=seg;}
  return null;
}
function update(){
  if(!state.running)return;
  if(!state.active){state.between--; if(state.between<=0){state.wave++;state.active=true;state.spawn=6+state.wave*2;hud(); if(state.wave>5){show("大桥无恙","五波攻势尽数挡下！","再守一次");return;}}}
  if(state.active&&state.spawn>0&&Math.random()<0.03){state.enemies.push({t:0,hp:6+state.wave*2,slow:0});state.spawn--;}
  if(state.active&&state.spawn<=0&&state.enemies.length===0){state.active=false;state.between=100;state.gold+=10;hud();}
  for(const e of state.enemies){const spd=e.slow>0?0.3:0.7; if(e.slow>0)e.slow--; e.t+=spd; const p=pathPos(e.t); if(!p){e.hp=0;state.hp-=1;hud(); if(state.hp<=0)show("桥破了","下次多建几座塔。","重守");}}
  state.enemies=state.enemies.filter(e=>e.hp>0);
  for(const t of state.towers){t.cd--; if(t.cd>0)continue; let best=null,bd=1e9; for(const e of state.enemies){const p=pathPos(e.t); if(!p)continue; const d=Math.hypot(p.x-t.x,p.y-t.y); if(d<70&&d<bd){bd=d;best=e;}} if(best){best.hp-=t.type==="arrow"?3:2; if(t.type==="ice")best.slow=40; t.cd=t.type==="arrow"?25:35; if(best.hp<=0)state.gold+=3;}}
  hud();
}
function draw(){
  ctx.fillStyle="#0f172a";ctx.fillRect(0,0,480,270);
  ctx.strokeStyle="#64748b";ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);ctx.stroke();
  for(const s of slots){ctx.fillStyle="#334155";ctx.beginPath();ctx.arc(s.x,s.y,10,0,Math.PI*2);ctx.fill();}
  for(const t of state.towers){ctx.fillStyle=t.type==="arrow"?"#fbbf24":"#67e8f9";ctx.fillRect(t.x-8,t.y-8,16,16);}
  for(const e of state.enemies){const p=pathPos(e.t); if(!p)continue; ctx.fillStyle="#ef4444";ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();}
}
function loop(){update();draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="在灰点建塔，挡住 5 波沿路敌人。";show("桥上防线",msg.textContent,"布防");reset();loop();
