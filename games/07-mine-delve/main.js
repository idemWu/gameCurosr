const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const floorEl=document.getElementById("floor"),hpEl=document.getElementById("hp"),lampEl=document.getElementById("lamp"),oreEl=document.getElementById("ore"),upBtn=document.getElementById("up");
const T=24,W=18,H=10;
const state={running:false,floor:1,hp:5,lamp:100,ore:0,px:1,py:1,map:[],tick:0,stairs:null};

function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){floorEl.textContent=String(state.floor);hpEl.textContent=String(state.hp);lampEl.textContent=String(Math.max(0,Math.floor(state.lamp)));oreEl.textContent=String(state.ore);}
function gen(){
  const m=[];
  for(let y=0;y<H;y++){const row=[];for(let x=0;x<W;x++){
    if(x===0||y===0||x===W-1||y===H-1)row.push("#");
    else {
      const r=Math.random();
      if(r<0.08)row.push("O");
      else if(r<0.12)row.push("M");
      else row.push(".");
    }
  }m.push(row);}
  m[1][1]="."; state.px=1;state.py=1;
  if(state.floor<5){m[H-2][W-2]="D";state.stairs={x:W-2,y:H-2,type:"down"};}
  else {m[H-2][W-2]=".";state.stairs=null;}
  m[1][2]="U"; // always can go up near start conceptually - up is button
  state.map=m;
}
function reset(){state.floor=1;state.hp=5;state.lamp=100;state.ore=0;state.tick=0;gen();hud();}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
function move(dx,dy){
  if(!state.running)return;
  const nx=state.px+dx,ny=state.py+dy,c=state.map[ny][nx];
  if(c==="#")return;
  state.px=nx;state.py=ny;state.lamp-=1.2;
  if(c==="O"){state.map[ny][nx]=".";state.ore+=1+(state.floor>2?1:0);}
  if(c==="M"){state.map[ny][nx]=".";state.hp-=1;}
  if(c==="D"){state.floor+=1;gen();}
  if(state.lamp<=0){state.lamp=0;state.hp-=0.25;}
  if(state.hp<=0){show("灯灭人疲","矿石落在深处…","重下");return;}
  hud();
}
upBtn.addEventListener("click",()=>{
  if(!state.running)return;
  if(state.floor>1){state.floor-=1;gen();hud();return;}
  // surface
  if(state.ore>=12)show("升井胜利",`带回矿石 ${state.ore}，矿灯还亮着。`,"再下一趟");
  else show("物资不足",`只有 ${state.ore} 块矿石（需要 12）。可以继续下挖。`,"回到矿口");
});
function draw(){
  ctx.fillStyle="#0c0a09";ctx.fillRect(0,0,480,270);
  const dim=Math.max(0.25,state.lamp/100);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const c=state.map[y][x]; let col="#292524";
    if(c==="#")col="#57534e"; else if(c==="O")col="#38bdf8"; else if(c==="M")col="#ef4444"; else if(c==="D")col="#a3e635"; else if(c==="U")col="#fbbf24";
    ctx.globalAlpha=dim;ctx.fillStyle=col;ctx.fillRect(24+x*T,20+y*T,T-2,T-2);
  }
  ctx.globalAlpha=1;ctx.fillStyle="#fef3c7";ctx.fillRect(24+state.px*T+5,20+state.py*T+5,T-12,T-12);
  ctx.fillStyle="#fde68a";ctx.font="12px sans-serif";ctx.fillText(`B${state.floor}`,16,16);
}
function loop(){draw();requestAnimationFrame(loop);}
window.addEventListener("keydown",e=>{
  const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],A:[-1,0],D:[1,0],W:[0,-1],S:[0,1]};
  if(m[e.key]){move(...m[e.key]);e.preventDefault();}
});
btn.addEventListener("click",start);show("矿灯深途","下到更深的层挖蓝色矿石，避开红怪。带至少 12 矿石在第 1 层点升井。","下井");gen();hud();loop();
