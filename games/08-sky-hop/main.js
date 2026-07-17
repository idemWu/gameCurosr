const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const levelEl=document.getElementById("level"),feEl=document.getElementById("feathers"),needEl=document.getElementById("need");
const keys=new Set();
const LEVELS=[
  {need:2, plats:[{x:0,y:240,w:120},{x:160,y:210,w:80},{x:280,y:180,w:80},{x:400,y:150,w:80}], feathers:[{x:190,y:180},{x:310,y:150}], flag:{x:430,y:120}},
  {need:2, plats:[{x:0,y:240,w:80},{x:120,y:200,w:70},{x:230,y:160,w:70},{x:340,y:200,w:70},{x:420,y:140,w:60}], feathers:[{x:250,y:130},{x:360,y:170}], flag:{x:440,y:110}},
  {need:3, plats:[{x:20,y:240,w:60},{x:120,y:210,w:50},{x:200,y:170,w:50},{x:280,y:130,w:50},{x:360,y:170,w:50},{x:420,y:110,w:50}], feathers:[{x:140,y:180},{x:220,y:140},{x:380,y:140}], flag:{x:440,y:80}},
  {need:3, plats:[{x:0,y:250,w:70},{x:100,y:210,w:40},{x:180,y:180,w:40},{x:260,y:220,w:40},{x:340,y:160,w:50},{x:420,y:120,w:50}], feathers:[{x:190,y:150},{x:270,y:190},{x:360,y:130}], flag:{x:440,y:90}},
  {need:3, plats:[{x:0,y:240,w:50},{x:90,y:200,w:40},{x:160,y:160,w:40},{x:230,y:120,w:40},{x:300,y:160,w:40},{x:370,y:120,w:40},{x:430,y:80,w:50}], feathers:[{x:170,y:130},{x:240,y:90},{x:380,y:90}], flag:{x:450,y:50}},
];
const state={running:false,li:0,got:0,p:{x:20,y:200,vx:0,vy:0,on:false},feathers:[],won:false};

function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){levelEl.textContent=String(state.li+1);feEl.textContent=String(state.got);needEl.textContent=String(LEVELS[state.li].need);}
function load(i){
  state.li=i;const L=LEVELS[i];
  state.got=0;state.p={x:20,y:200,vx:0,vy:0,on:false};
  state.feathers=L.feathers.map(f=>({...f,got:false}));
  hud();
}
function start(){load(0);overlay.classList.add("hidden");state.running=true;}
function update(){
  if(!state.running)return;
  const p=state.p,L=LEVELS[state.li];
  if(keys.has("ArrowLeft")||keys.has("a")||keys.has("A"))p.vx=-2.4;
  else if(keys.has("ArrowRight")||keys.has("d")||keys.has("D"))p.vx=2.4;
  else p.vx*=0.7;
  if((keys.has("ArrowUp")||keys.has("w")||keys.has("W")||keys.has(" "))&&p.on){p.vy=-5.6;p.on=false;}
  p.vy+=0.28;p.x+=p.vx;p.y+=p.vy;p.on=false;
  if(p.x<0)p.x=0;if(p.x>468)p.x=468;
  for(const pl of L.plats){
    if(p.x+12>pl.x&&p.x<pl.x+pl.w&&p.y+14>pl.y&&p.y+14<pl.y+16&&p.vy>=0){p.y=pl.y-14;p.vy=0;p.on=true;}
  }
  for(const f of state.feathers){if(!f.got&&Math.hypot(p.x+6-f.x,p.y+6-f.y)<14){f.got=true;state.got+=1;hud();}}
  const fl=L.flag;
  if(state.got>=L.need&&Math.hypot(p.x-fl.x,p.y-fl.y)<20){
    if(state.li>=LEVELS.length-1)show("云端通关","羽毛编成翅膀，天空为你让路。","再飞一次");
    else load(state.li+1);
  }
  if(p.y>280)load(state.li);
}
function draw(){
  const g=ctx.createLinearGradient(0,0,0,270);g.addColorStop(0,"#38bdf8");g.addColorStop(1,"#0ea5e9");
  ctx.fillStyle=g;ctx.fillRect(0,0,480,270);
  ctx.fillStyle="#f8fafc";
  for(let i=0;i<6;i++)ctx.fillRect(30+i*80,40+(i%2)*20,50,12);
  const L=LEVELS[state.li];
  ctx.fillStyle="#78716c";
  for(const pl of L.plats)ctx.fillRect(pl.x,pl.y,pl.w,12);
  for(const f of state.feathers){if(f.got)continue;ctx.fillStyle="#fef08a";ctx.beginPath();ctx.ellipse(f.x,f.y,6,10,0.2,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#22c55e";ctx.fillRect(L.flag.x,L.flag.y-20,4,28);ctx.fillStyle="#ef4444";ctx.fillRect(L.flag.x+4,L.flag.y-20,16,10);
  ctx.fillStyle="#fff7ed";ctx.fillRect(state.p.x,state.p.y,12,14);
}
function loop(){update();draw();requestAnimationFrame(loop);}
window.addEventListener("keydown",e=>{keys.add(e.key);if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();});
window.addEventListener("keyup",e=>keys.delete(e.key));
btn.addEventListener("click",start);show("云上跳岛","5 关跳跃，收集羽毛碰旗过关。掉落重来。","起飞");load(0);loop();
