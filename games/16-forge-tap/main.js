const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const metalEl=document.getElementById("metal"),hammerEl=document.getElementById("hammer"),recipesEl=document.getElementById("recipes");
const NAMES=["铜钉","银饰","星钢刃"];
const state={running:false,metal:0,hammer:1,recipes:0,heat:0};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){metalEl.textContent=String(Math.floor(state.metal));hammerEl.textContent=String(state.hammer);recipesEl.textContent=String(state.recipes);
  document.getElementById("up").textContent=`升级锤子 (${20*state.hammer})`;
  document.getElementById("rec").textContent=state.recipes>=3?"配方已满":`研究配方 (${40+state.recipes*30})`;}
function reset(){Object.assign(state,{metal:0,hammer:1,recipes:0,heat:0});hud();}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
document.getElementById("tap").onclick=()=>{if(!state.running)return;state.metal+=state.hammer;state.heat=12;hud();};
document.getElementById("up").onclick=()=>{const c=20*state.hammer; if(state.metal>=c){state.metal-=c;state.hammer++;hud();}};
document.getElementById("rec").onclick=()=>{if(state.recipes>=3)return; const c=40+state.recipes*30; if(state.metal>=c){state.metal-=c;state.recipes++;hud(); if(state.recipes>=3)show("锻火不息",`解锁：${NAMES.join("、")}`,"再开炉");}};
function draw(){
  ctx.fillStyle="#21140e";ctx.fillRect(0,0,480,270);
  ctx.fillStyle="#57534e";ctx.fillRect(160,150,160,40);
  ctx.fillStyle=state.heat?"#fb923c":"#78350f";ctx.fillRect(200,90,80,70);
  ctx.fillStyle="#a8a29e";ctx.fillRect(230,50,20,50);
  ctx.fillStyle="#fff7ed";ctx.font="14px sans-serif";ctx.fillText("铁砧就绪",200,220);
  for(let i=0;i<state.recipes;i++){ctx.fillStyle="#fde68a";ctx.fillText(NAMES[i],40,60+i*24);}
  if(state.heat>0)state.heat--;
}
function loop(){draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="点击捶打获金属，升级锤子并研究 3 个配方。";show("铁匠一点通",msg.textContent,"开炉");reset();loop();
