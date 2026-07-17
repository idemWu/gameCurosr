const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const dustEl=document.getElementById("dust"),rateEl=document.getElementById("rate"),dexEl=document.getElementById("dex");
const state={running:false,dust:0,click:1,auto:0,dex:0,skins:[],pulse:0};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){dustEl.textContent=String(Math.floor(state.dust));rateEl.textContent=String(state.auto);dexEl.textContent=String(state.dex);
  document.getElementById("u1").textContent=`升级点击 (${10+state.click*8})`;
  document.getElementById("u2").textContent=`自动星尘 (${25+state.auto*15})`;
  document.getElementById("u3").textContent=state.dex>=3?"图鉴已满":`解锁外观 (${50+state.dex*40})`;}
function reset(){Object.assign(state,{dust:0,click:1,auto:0,dex:0,skins:[],pulse:0});hud();}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
document.getElementById("click").onclick=()=>{if(!state.running)return;state.dust+=state.click;state.pulse=10;hud();};
document.getElementById("u1").onclick=()=>{const c=10+state.click*8;if(state.dust>=c){state.dust-=c;state.click+=1;hud();}};
document.getElementById("u2").onclick=()=>{const c=25+state.auto*15;if(state.dust>=c){state.dust-=c;state.auto+=1;hud();}};
document.getElementById("u3").onclick=()=>{if(state.dex>=3)return;const c=50+state.dex*40;if(state.dust>=c){state.dust-=c;state.dex+=1;state.skins.push(["#fde68a","#67e8f9","#f9a8d4"][state.dex-1]);hud();if(state.dex>=3)show("星图点亮","三枚星尘徽章已解锁。","再挂一会");}};
let acc=0;
function update(dt){if(!state.running)return;acc+=dt;if(acc>0.25){state.dust+=state.auto*acc;acc=0;hud();} if(state.pulse>0)state.pulse--;}
let last=performance.now();
function draw(){
  ctx.fillStyle="#020617";ctx.fillRect(0,0,480,270);
  for(let i=0;i<40;i++){ctx.fillStyle="#475569";ctx.fillRect((i*97)%480,(i*53)%270,2,2);}
  ctx.fillStyle=state.pulse?"#f5d0fe":"#c084fc";ctx.beginPath();ctx.arc(240,135,40+state.pulse,0,Math.PI*2);ctx.fill();
  state.skins.forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(160+i*80,220,16,0,Math.PI*2);ctx.fill();});
}
function loop(now){update((now-last)/1000);last=now;draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="点击与自动产星尘，解锁 3 个外观图鉴。";show("星尘挂机",msg.textContent,"开始");reset();requestAnimationFrame(loop);
