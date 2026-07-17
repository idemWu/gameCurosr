
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('13-match-gems',2);
const COLORS=['#ef4444','#22c55e','#3b82f6','#eab308','#a855f7'];
const N=7,T=32,OX=50,OY=24;
let LEVELS=[];
const S={running:false,li:0,grid:[],sel:null,moves:0,cleared:0,need:0,stars:0,unlockedWorld:1,ended:false,maxCleared:0};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('worldbtns').innerHTML='';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({li:S.li,stars:S.stars,unlockedWorld:S.unlockedWorld,ended:S.ended,maxCleared:S.maxCleared})}
function hud(){const L=LEVELS[S.li]; el('world').textContent=L.world; el('level').textContent=L.id; el('moves').textContent=S.moves; el('goal').textContent=S.cleared; el('need').textContent=S.need; el('stars').textContent=S.stars}
function rnd(n){return Math.floor(Math.random()*n)}
function load(i){
  S.li=i; const L=LEVELS[i]; S.need=L.need; S.moves=L.moves; S.cleared=0; S.sel=null;
  S.grid=Array.from({length:N},()=>Array.from({length:N},()=>rnd(L.colors)));
  // sprinkle rocks as -1 blocked? use color 0 ice marker in meta - simplify: just play
  hud();
}
function findMatches(){
  const m=new Set();
  for(let y=0;y<N;y++)for(let x=0;x<N-2;x++){const v=S.grid[y][x]; if(v<0)continue; if(v===S.grid[y][x+1]&&v===S.grid[y][x+2]){m.add(x+','+y);m.add((x+1)+','+y);m.add((x+2)+','+y)}}
  for(let x=0;x<N;x++)for(let y=0;y<N-2;y++){const v=S.grid[y][x]; if(v<0)continue; if(v===S.grid[y+1][x]&&v===S.grid[y+2][x]){m.add(x+','+y);m.add(x+','+(y+1));m.add(x+','+(y+2))}}
  return m;
}
function collapse(){
  let total=0,guard=0; const L=LEVELS[S.li];
  while(guard++<25){const m=findMatches(); if(!m.size)break; total+=m.size;
    for(const key of m){const [x,y]=key.split(',').map(Number); S.grid[y][x]=-1}
    for(let x=0;x<N;x++){let w=N-1; for(let y=N-1;y>=0;y--){if(S.grid[y][x]!==-1){S.grid[w][x]=S.grid[y][x];w--}} while(w>=0){S.grid[w][x]=rnd(L.colors);w--}}
  } return total;
}
function swap(a,b){const t=S.grid[a.y][a.x]; S.grid[a.y][a.x]=S.grid[b.y][b.x]; S.grid[b.y][b.x]=t}
canvas.onclick=(ev)=>{
  if(!S.running)return;
  const r=canvas.getBoundingClientRect(); const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/T); const y=Math.floor(((ev.clientY-r.top)*(canvas.height/r.height)-OY)/T);
  if(x<0||y<0||x>=N||y>=N)return;
  if(!S.sel){S.sel={x,y};return}
  const s=S.sel; S.sel=null; if(Math.abs(s.x-x)+Math.abs(s.y-y)!==1){S.sel={x,y};return}
  swap(s,{x,y}); const got=collapse(); if(!got){swap(s,{x,y});return}
  S.moves--; S.cleared+=got; hud();
  if(S.cleared>=S.need){
    const star = S.moves>=8?3:S.moves>=3?2:1; S.stars+=star; S.maxCleared=Math.max(S.maxCleared,S.li+1);
    if((S.li+1)%15===0) S.unlockedWorld=Math.max(S.unlockedWorld, Math.floor(S.li/15)+2);
    persist();
    if(S.li>=LEVELS.length-1){S.ended=true;persist();show('晶石闪耀','60 关全部通关！',false)}
    else load(S.li+1);
  } else if(S.moves<=0){ show('步数用尽','可重置本关或读档。',true); }
};
el('reset').onclick=()=>{if(S.running) load(S.li)};
el('worldsel').onclick=()=>{
  show('世界选择',`已解锁世界 1–${Math.min(4,S.unlockedWorld)}`,true);
  el('worldbtns').innerHTML='';
  for(let w=1;w<=4;w++){const b=document.createElement('button'); b.textContent='世界'+w; b.disabled=w>S.unlockedWorld; b.onclick=()=>{load((w-1)*15); hide()}; el('worldbtns').appendChild(b)}
};
el('btn-start').onclick=()=>{Object.assign(S,{li:0,stars:0,unlockedWorld:1,ended:false,maxCleared:0}); load(0);persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d){el('overlay-msg').textContent='无存档';return} Object.assign(S,d); load(Math.min(S.li,59)); hide()};
function draw(){
  ctx.fillStyle='#2e1065';ctx.fillRect(0,0,480,270);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=S.grid[y]?S.grid[y][x]:0; ctx.fillStyle=COLORS[Math.max(0,v)]||'#333'; ctx.fillRect(OX+x*T+2,OY+y*T+2,T-6,T-6); if(S.sel&&S.sel.x===x&&S.sel.y===y){ctx.strokeStyle='#fff';ctx.strokeRect(OX+x*T,OY+y*T,T-2,T-2)}}
}
function loop(){draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'晶石三消',statusText:()=>`关卡 ${S.li+1}/60 星 ${S.stars}`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/levels.json').then(r=>r.json()).then(data=>{LEVELS=data.levels; const d=save.load(); show('晶石三消','60关分四世界，约35–55分钟通关。',!!(d&&!d.ended)); if(d) Object.assign(S,d); load(Math.min(S.li||0,59)); if(!d) S.running=false; loop()});
