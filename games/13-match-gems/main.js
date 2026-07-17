const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const levelEl=document.getElementById("level"),movesEl=document.getElementById("moves"),goalEl=document.getElementById("goal"),needEl=document.getElementById("need");
const COLORS=["#ef4444","#22c55e","#3b82f6","#eab308","#a855f7"];
const N=6,T=36,OX=60,OY=30;
const state={running:false,level:0,grid:[],sel:null,moves:0,cleared:0,need:10};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){levelEl.textContent=String(state.level+1);movesEl.textContent=String(state.moves);goalEl.textContent=String(state.cleared);needEl.textContent=String(state.need);}
function rnd(){return Math.floor(Math.random()*COLORS.length);}
function load(i){
  state.level=i;state.need=10+i*2;state.moves=14-Math.min(6,i);state.cleared=0;state.sel=null;
  state.grid=Array.from({length:N},()=>Array.from({length:N},rnd));hud();
}
function start(){load(0);overlay.classList.add("hidden");state.running=true;}
function swap(a,b){const t=state.grid[a.y][a.x];state.grid[a.y][a.x]=state.grid[b.y][b.x];state.grid[b.y][b.x]=t;}
function findMatches(){
  const m=new Set();
  for(let y=0;y<N;y++)for(let x=0;x<N-2;x++){const v=state.grid[y][x];if(v===state.grid[y][x+1]&&v===state.grid[y][x+2]){m.add(x+","+y);m.add((x+1)+","+y);m.add((x+2)+","+y);}}
  for(let x=0;x<N;x++)for(let y=0;y<N-2;y++){const v=state.grid[y][x];if(v===state.grid[y+1][x]&&v===state.grid[y+2][x]){m.add(x+","+y);m.add(x+","+(y+1));m.add(x+","+(y+2));}}
  return m;
}
function collapse(){
  let total=0; let guard=0;
  while(guard++<20){
    const m=findMatches(); if(!m.size)break; total+=m.size;
    for(const key of m){const [x,y]=key.split(",").map(Number);state.grid[y][x]=-1;}
    for(let x=0;x<N;x++){let w=N-1;for(let y=N-1;y>=0;y--){if(state.grid[y][x]!==-1){state.grid[w][x]=state.grid[y][x];w--;}} while(w>=0){state.grid[w][x]=rnd();w--;}}
  }
  return total;
}
canvas.onclick=(ev)=>{
  if(!state.running)return;
  const r=canvas.getBoundingClientRect();const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/T);const y=Math.floor(((ev.clientY-r.top)*(canvas.height/r.height)-OY)/T);
  if(x<0||y<0||x>=N||y>=N)return;
  if(!state.sel){state.sel={x,y};return;}
  const s=state.sel;state.sel=null;
  if(Math.abs(s.x-x)+Math.abs(s.y-y)!==1){state.sel={x,y};return;}
  swap(s,{x,y}); const got=collapse();
  if(!got){swap(s,{x,y});return;}
  state.moves--; state.cleared+=got;hud();
  if(state.cleared>=state.need){if(state.level>=7)show("晶石闪耀","八关尽数通关！","再玩");else load(state.level+1);}
  else if(state.moves<=0)show("步数用尽","再试一关排列。","重来");
};
document.getElementById("reset").onclick=()=>{if(state.running)load(state.level);};
function draw(){
  ctx.fillStyle="#2e1065";ctx.fillRect(0,0,480,270);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){ctx.fillStyle=COLORS[state.grid[y][x]];ctx.beginPath();ctx.roundRect?ctx.roundRect(OX+x*T+2,OY+y*T+2,T-6,T-6,6):ctx.rect(OX+x*T+2,OY+y*T+2,T-6,T-6);ctx.fill(); if(state.sel&&state.sel.x===x&&state.sel.y===y){ctx.strokeStyle="#fff";ctx.strokeRect(OX+x*T,OY+y*T,T-2,T-2);} }
}
function loop(){draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="交换相邻宝石，完成收集目标。共 8 关。";show("晶石三消",msg.textContent,"开始");load(0);loop();
