const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const hpEl=document.getElementById("hp"),lootEl=document.getElementById("loot");
const keys=new Set();
const camp={x:40,y:200}, state={running:false,hp:5,loot:0,player:{x:40,y:200,r:8,cd:0},enemies:[],chests:[],atkFlash:0};

function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){hpEl.textContent=String(state.hp);lootEl.textContent=String(state.loot);}
function reset(){
  state.hp=5;state.loot=0;state.player={x:40,y:200,r:8,cd:0};state.atkFlash=0;
  state.enemies=[{x:200,y:80,hp:2},{x:320,y:160,hp:2},{x:260,y:220,hp:3},{x:400,y:60,hp:2}];
  state.chests=[{x:180,y:50,got:false},{x:420,y:200,got:false},{x:300,y:40,got:false}];
  hud();
}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.hypot(dx,dy);}
function update(){
  if(!state.running)return;
  const p=state.player; let dx=0,dy=0;
  if(keys.has("ArrowLeft")||keys.has("a")||keys.has("A"))dx-=1;
  if(keys.has("ArrowRight")||keys.has("d")||keys.has("D"))dx+=1;
  if(keys.has("ArrowUp")||keys.has("w")||keys.has("W"))dy-=1;
  if(keys.has("ArrowDown")||keys.has("s")||keys.has("S"))dy+=1;
  if(dx||dy){const l=Math.hypot(dx,dy);p.x=Math.max(10,Math.min(470,p.x+dx/l*2.2));p.y=Math.max(10,Math.min(260,p.y+dy/l*2.2));}
  if(p.cd>0)p.cd-=1; if(state.atkFlash>0)state.atkFlash-=1;
  for(const e of state.enemies){
    if(e.hp<=0)continue;
    const d=dist(p,e);
    if(d<80){e.x+=(p.x-e.x)/d*0.6;e.y+=(p.y-e.y)/d*0.6;}
    if(d<16){state.hp-=1;e.x+= (e.x-p.x);e.y+=(e.y-p.y);hud(); if(state.hp<=0){show("倒下了","下次带更多绷带吧。","再试一次");return;}}
    if(d<28&&p.cd===0){e.hp-=1;p.cd=18;state.atkFlash=8;}
  }
  for(const c of state.chests){if(!c.got&&dist(p,c)<16){c.got=true;state.loot+=1;hud();}}
  if(state.loot>=3&&dist(p,camp)<22)show("平安归来",`带回 ${state.loot} 个宝箱，篝火正旺。`,"再次出发");
}
function draw(){
  ctx.fillStyle="#1d3b28";ctx.fillRect(0,0,480,270);
  for(let i=0;i<30;i++){ctx.fillStyle="#14532d";ctx.beginPath();ctx.moveTo((i*53)%480,((i*97)%240)+20);ctx.lineTo((i*53)%480+10,((i*97)%240)+40);ctx.lineTo((i*53)%480-10,((i*97)%240)+40);ctx.fill();}
  ctx.fillStyle="#22c55e";ctx.fillRect(camp.x-8,camp.y-18,16,26);ctx.fillStyle="#166534";ctx.fillRect(camp.x-2,camp.y-4,4,20);
  for(const c of state.chests){if(c.got)continue;ctx.fillStyle="#f59e0b";ctx.fillRect(c.x-7,c.y-6,14,12);}
  for(const e of state.enemies){if(e.hp<=0)continue;ctx.fillStyle="#ef4444";ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle=state.atkFlash?"#fef08a":"#f8fafc";ctx.beginPath();ctx.arc(state.player.x,state.player.y,8,0,Math.PI*2);ctx.fill();
}
function loop(){update();draw();requestAnimationFrame(loop);}
window.addEventListener("keydown",e=>{keys.add(e.key);if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();});
window.addEventListener("keyup",e=>keys.delete(e.key));
btn.addEventListener("click",start);show("林间轻旅","收集 3 个宝箱并返回绿旗营地。靠近敌人自动攻击。","启程");loop();
