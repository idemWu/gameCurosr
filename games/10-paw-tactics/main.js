const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const turnEl=document.getElementById("turn"),info=document.getElementById("info"),endBtn=document.getElementById("end");
const T=48,OX=48,OY=30,W=6,H=4;
let units,sel,running=false,playerTurn=true;
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");running=false;}
function reset(){
  units=[
    {id:1,side:"p",x:0,y:1,hp:8,atk:3,moved:false,name:"喵刀"},
    {id:2,side:"p",x:0,y:2,hp:7,atk:2,moved:false,name:"汪盾"},
    {id:3,side:"p",x:1,y:1,hp:6,atk:4,moved:false,name:"狐弓"},
    {id:4,side:"e",x:5,y:1,hp:8,atk:3,moved:false,name:"影喵"},
    {id:5,side:"e",x:5,y:2,hp:7,atk:2,moved:false,name:"骨汪"},
    {id:6,side:"e",x:4,y:2,hp:6,atk:4,moved:false,name:"鸦狐"},
  ];sel=null;playerTurn=true;turnEl.textContent="我方";info.textContent="点选爪爪";
}
function at(x,y){return units.find(u=>u.hp>0&&u.x===x&&u.y===y);}
function start(){reset();overlay.classList.add("hidden");running=true;}
function enemyAI(){
  playerTurn=false;turnEl.textContent="敌方";
  for(const e of units.filter(u=>u.side==="e"&&u.hp>0)){
    const foes=units.filter(u=>u.side==="p"&&u.hp>0);
    if(!foes.length)break;
    foes.sort((a,b)=>Math.abs(a.x-e.x)+Math.abs(a.y-e.y)-(Math.abs(b.x-e.x)+Math.abs(b.y-e.y)));
    const t=foes[0]; const dx=Math.sign(t.x-e.x),dy=Math.sign(t.y-e.y);
    if(Math.abs(t.x-e.x)+Math.abs(t.y-e.y)===1)t.hp-=e.atk;
    else {const nx=e.x+dx,ny=e.y+(dx?0:dy); if(nx>=0&&ny>=0&&nx<W&&ny<H&&!at(nx,ny)){e.x=nx;e.y=ny;}}
  }
  if(!units.some(u=>u.side==="p"&&u.hp>0)){show("战败","爪爪们需要修整。","再战");return;}
  units.filter(u=>u.side==="p").forEach(u=>u.moved=false);playerTurn=true;turnEl.textContent="我方";
}
canvas.onclick=(ev)=>{
  if(!running||!playerTurn)return;
  const r=canvas.getBoundingClientRect();const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/T);const y=Math.floor(((ev.clientY-r.top)*(canvas.height/r.height)-OY)/T);
  if(x<0||y<0||x>=W||y>=H)return;
  const u=at(x,y);
  if(sel&&sel.side==="p"&&!sel.moved){
    if(u&&u.side==="e"&&Math.abs(u.x-sel.x)+Math.abs(u.y-sel.y)===1){u.hp-=sel.atk;sel.moved=true;sel=null;info.textContent="攻击！";if(!units.some(z=>z.side==="e"&&z.hp>0))show("胜利","爪爪大获全胜！","再来一局");return;}
    if(!u&&Math.abs(x-sel.x)+Math.abs(y-sel.y)===1){sel.x=x;sel.y=y;sel.moved=true;sel=null;info.textContent="已移动";return;}
  }
  if(u&&u.side==="p"&&!u.moved){sel=u;info.textContent=`选中 ${u.name}`;}
};
endBtn.onclick=()=>{if(running&&playerTurn)enemyAI();};
function draw(){
  ctx.fillStyle="#111827";ctx.fillRect(0,0,480,270);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.fillStyle=(x+y)%2?"#1f2937":"#374151";ctx.fillRect(OX+x*T,OY+y*T,T-2,T-2);}
  for(const u of units){if(u.hp<=0)continue;ctx.fillStyle=u.side==="p"?"#93c5fd":"#fca5a5";ctx.fillRect(OX+u.x*T+8,OY+u.y*T+8,T-18,T-18);ctx.fillStyle="#fff";ctx.font="10px sans-serif";ctx.fillText(String(u.hp),OX+u.x*T+14,OY+u.y*T+28);if(sel===u){ctx.strokeStyle="#fde68a";ctx.strokeRect(OX+u.x*T+4,OY+u.y*T+4,T-10,T-10);}}
}
function loop(){draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="3v3 战棋：邻格移动/攻击，点结束回合。";show("爪爪战棋",msg.textContent,"开战");reset();loop();
