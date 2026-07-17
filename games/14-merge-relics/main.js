const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const maxEl=document.getElementById("max"),orderEl=document.getElementById("order"),needEl=document.getElementById("need"),doneEl=document.getElementById("done");
const COLS=6,ROWS=4,T=56,OX=40,OY=30;
const COLORS=["#a8a29e","#86efac","#67e8f9","#c084fc","#fbbf24"];
const state={running:false,cells:[],sel:null,max:1,orderLv:3,need:2,done:0};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){maxEl.textContent=String(state.max);orderEl.textContent=String(state.orderLv);needEl.textContent=String(state.need);doneEl.textContent=String(state.done);}
function reset(){state.cells=Array(COLS*ROWS).fill(0);state.sel=null;state.max=1;state.orderLv=3;state.need=2;state.done=0;for(let i=0;i<4;i++)spawn();hud();}
function empties(){return state.cells.map((v,i)=>v?null:i).filter(v=>v!==null);}
function spawn(){const e=empties(); if(!e.length)return; state.cells[e[Math.floor(Math.random()*e.length)]]=1;}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
document.getElementById("spawn").onclick=()=>{if(state.running)spawn();};
canvas.onclick=(ev)=>{
  if(!state.running)return;
  const r=canvas.getBoundingClientRect();const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/T);const y=Math.floor(((ev.clientY-r.top)*(canvas.height/r.height)-OY)/T);
  if(x<0||y<0||x>=COLS||y>=ROWS)return; const i=y*COLS+x; const v=state.cells[i];
  if(!state.sel&&v){state.sel=i;return;}
  if(state.sel===i){state.sel=null;return;}
  if(state.sel!=null){
    const a=state.sel, av=state.cells[a];
    if(v===av&&v>0&&v<5){
      state.cells[a]=0; state.cells[i]=v+1; state.max=Math.max(state.max,v+1); state.sel=null;
      if(v+1===state.orderLv){
        state.done++;
        if(state.done>=state.need){state.orderLv=Math.min(5,state.orderLv+1);state.need=2;state.done=0;}
      }
      hud();
      if(state.max>=5){show("馆藏完成","5 级遗物炼成！（宝石/文物合成，非种菜）","再合成");}
    } else if(!v){state.cells[i]=av;state.cells[a]=0;state.sel=null;}
    else state.sel=i;
  }
};
function draw(){
  ctx.fillStyle="#0c0a09";ctx.fillRect(0,0,480,270);
  ctx.fillStyle="#fafaf9";ctx.font="12px sans-serif";ctx.fillText("遗物柜（非种田）",16,18);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const i=y*COLS+x,v=state.cells[i];
    ctx.fillStyle="#292524";ctx.fillRect(OX+x*T,OY+y*T,T-6,T-6);
    if(v){ctx.fillStyle=COLORS[v-1];ctx.beginPath();ctx.arc(OX+x*T+T/2-3,OY+y*T+T/2-3,16,0,Math.PI*2);ctx.fill();ctx.fillStyle="#111";ctx.fillText("L"+v,OX+x*T+18,OY+y*T+32);}
    if(state.sel===i){ctx.strokeStyle="#fbbf24";ctx.strokeRect(OX+x*T,OY+y*T,T-6,T-6);}
  }
}
function loop(){draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="合成相同遗物升级。做出 5 级并完成订单（非种菜）。";show("遗物合成",msg.textContent,"开始");reset();loop();
