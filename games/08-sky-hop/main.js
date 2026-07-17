
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('08-sky-hop',2);
let LEVELS=[]; const keys=new Set();
const S={running:false,li:0,got:0,p:{x:20,y:200,vx:0,vy:0,on:false},feathers:[],ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({li:S.li,ended:S.ended})}
function load(i){S.li=i; const L=LEVELS[i]; S.got=0; S.p={x:20,y:200,vx:0,vy:0,on:false}; S.feathers=L.feathers.map(f=>({...f,got:false})); el('level').textContent=i+1; el('need').textContent=L.need; el('fe').textContent=0}
function update(){if(!S.running)return; const p=S.p,L=LEVELS[S.li];
  if(keys.has('ArrowLeft')||keys.has('a'))p.vx=-2.4; else if(keys.has('ArrowRight')||keys.has('d'))p.vx=2.4; else p.vx*=0.7;
  if((keys.has('ArrowUp')||keys.has('w')||keys.has(' '))&&p.on){p.vy=-5.6;p.on=false}
  p.vy+=0.28;p.x+=p.vx;p.y+=p.vy;p.on=false; if(p.x<0)p.x=0; if(p.x>468)p.x=468;
  for(const pl of L.plats){if(p.x+12>pl.x&&p.x<pl.x+pl.w&&p.y+14>pl.y&&p.y+14<pl.y+16&&p.vy>=0){p.y=pl.y-14;p.vy=0;p.on=true}}
  for(const f of S.feathers){if(!f.got&&Math.hypot(p.x+6-f.x,p.y+6-f.y)<14){f.got=true;S.got++;el('fe').textContent=S.got}}
  const fl=L.flag; if(S.got>=L.need&&Math.hypot(p.x-fl.x,p.y-fl.y)<20){if(S.li>=LEVELS.length-1){S.ended=true;persist();show('云上尽头','四十座岛都踩在脚底。',false)} else {load(S.li+1);persist()}}
  if(p.y>300)load(S.li)}
function draw(){const g=ctx.createLinearGradient(0,0,0,270);g.addColorStop(0,'#38bdf8');g.addColorStop(1,'#0ea5e9');ctx.fillStyle=g;ctx.fillRect(0,0,480,270);
  const L=LEVELS[S.li]; ctx.fillStyle='#78716c'; for(const pl of L.plats)ctx.fillRect(pl.x,pl.y,pl.w,12);
  for(const f of S.feathers){if(f.got)continue;ctx.fillStyle='#fef08a';ctx.beginPath();ctx.arc(f.x,f.y,6,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#22c55e';ctx.fillRect(L.flag.x,L.flag.y-20,4,28);ctx.fillStyle='#fff7ed';ctx.fillRect(S.p.x,S.p.y,12,14)}
function loop(){update();if(LEVELS.length)draw();requestAnimationFrame(loop)}
window.addEventListener('keydown',e=>{keys.add(e.key); if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()});
window.addEventListener('keyup',e=>keys.delete(e.key));
el('btn-start').onclick=()=>{S.ended=false;load(0);persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} load(d.li||0);hide()};
LongplayPause.mount({title:'云上跳岛',statusText:()=>`关卡 ${S.li+1}/40`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/levels.json').then(r=>r.json()).then(d=>{LEVELS=d.levels; const sv=save.load(); show('云上跳岛','40关跳跃，约30–50分钟。',!!(sv&&!sv.ended)); load(sv?sv.li:0); loop()});
