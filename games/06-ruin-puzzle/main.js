const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const levelEl=document.getElementById("level"),resetBtn=document.getElementById("reset");
const T=30,OX=30,OY=30;
// #:wall .:floor S:start E:exit P:gate(closed by default) K:switch
const LEVELS=[
  ["##########","#S..P...E#","#...K....#","##########"],
  ["##########","#S.#..#E.#","#..P..#..#","#..K.....#","##########"],
  ["###########","#S....#..E#","###P###..#","#...K.....#","###########"],
  ["##########","#S.K.P..E#","#.####...#","#........#","##########"],
  ["###########","#S#....#E.#","#.#.P#.#.#","#.K...P..#","###########"],
  ["############","#S..##..P.E#","#.#.K#..#..#","#....P.....#","############"],
  ["###########","#S.P.K.P.E#","#.#.#.#.#.#","#.........#","###########"],
  ["############","#S#..P..#E.#","#K#.P..P..#","#....K....#","############"],
];
const state={running:false,li:0,grid:[],px:0,py:0,gatesOpen:false};

function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function load(i){
  state.li=i;state.gatesOpen=false;
  state.grid=LEVELS[i].map(r=>r.split(""));
  for(let y=0;y<state.grid.length;y++)for(let x=0;x<state.grid[y].length;x++){
    if(state.grid[y][x]==="S"){state.px=x;state.py=y;state.grid[y][x]=".";}
  }
  levelEl.textContent=String(i+1);
}
function reset(){if(state.running)load(state.li);}
function start(){load(0);overlay.classList.add("hidden");state.running=true;}
function cell(x,y){return state.grid[y]&&state.grid[y][x];}
function blocked(x,y){
  const c=cell(x,y); if(!c||c==="#")return true;
  if(c==="P"&&!state.gatesOpen)return true;
  return false;
}
function tryMove(dx,dy){
  if(!state.running)return;
  const nx=state.px+dx,ny=state.py+dy;
  if(blocked(nx,ny))return;
  state.px=nx;state.py=ny;
  if(cell(nx,ny)==="K")state.gatesOpen=!state.gatesOpen;
  if(cell(nx,ny)==="E"){
    if(state.li>=LEVELS.length-1)show("遗迹通关","八扇石门都为你让路。","再探一次");
    else load(state.li+1);
  }
}
function draw(){
  ctx.fillStyle="#111827";ctx.fillRect(0,0,480,270);
  const g=state.grid;
  for(let y=0;y<g.length;y++)for(let x=0;x<g[y].length;x++){
    const c=g[y][x]; let col="#374151";
    if(c==="#")col="#4b5563"; else if(c==="E")col="#fbbf24"; else if(c==="K")col="#60a5fa";
    else if(c==="P")col=state.gatesOpen?"#334155":"#22d3ee";
    else col="#1f2937";
    ctx.fillStyle=col;ctx.fillRect(OX+x*T,OY+y*T,T-2,T-2);
  }
  ctx.fillStyle="#f8fafc";ctx.fillRect(OX+state.px*T+6,OY+state.py*T+6,T-14,T-14);
}
function loop(){draw();requestAnimationFrame(loop);}
window.addEventListener("keydown",e=>{
  const map={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],A:[-1,0],D:[1,0],W:[0,-1],S:[0,1]};
  if(map[e.key]){tryMove(...map[e.key]);e.preventDefault();}
});
btn.addEventListener("click",start);resetBtn.addEventListener("click",reset);
show("石纹遗迹","用蓝色开关控制青色石门，走到金色出口。共 8 关。","进入遗迹");
load(0);loop();
