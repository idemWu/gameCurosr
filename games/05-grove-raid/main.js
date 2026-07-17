
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('05-grove-raid',2); const keys=new Set();
let DATA=null;
const S={running:false,zi:0,qi:0,hp:8,loot:0,player:{x:40,y:200},enemies:[],chests:[],ended:false,atk:0};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({zi:S.zi,qi:S.qi,hp:S.hp,ended:S.ended})}
function quest(){return DATA.quests[S.qi]}
function spawn(){
  const z=DATA.zones[S.zi]; S.loot=0; S.player={x:40,y:200};
  S.enemies=Array.from({length:z.enemies},()=>({x:100+Math.random()*340,y:40+Math.random()*200,hp:2+S.zi}));
  S.chests=Array.from({length:z.chests},()=>({x:80+Math.random()*360,y:40+Math.random()*180,got:false}));
  hud();
}
function hud(){el('zone').textContent=S.zi+1; el('qi').textContent=Math.min(15,S.qi+1); el('hp').textContent=S.hp; el('loot').textContent=S.loot; el('need').textContent=quest()?quest().chests:0; el('qtext').textContent=quest()?quest().text:'完成'}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function update(){if(!S.running)return; const p=S.player; let dx=0,dy=0;
  if(keys.has('ArrowLeft')||keys.has('a'))dx-=1; if(keys.has('ArrowRight')||keys.has('d'))dx+=1; if(keys.has('ArrowUp')||keys.has('w'))dy-=1; if(keys.has('ArrowDown')||keys.has('s'))dy+=1;
  if(dx||dy){const l=Math.hypot(dx,dy);p.x=Math.max(10,Math.min(470,p.x+dx/l*2.3));p.y=Math.max(10,Math.min(260,p.y+dy/l*2.3))}
  if(S.atk>0)S.atk--;
  for(const e of S.enemies){if(e.hp<=0)continue; const d=dist(p,e); if(d<90){e.x+=(p.x-e.x)/d*0.55;e.y+=(p.y-e.y)/d*0.55} if(d<16){S.hp-=1;e.x+=e.x-p.x; if(S.hp<=0){persist();show('倒下了','读档再探。',!!save.load());return}} if(d<28&&S.atk===0){e.hp-=1;S.atk=16}}
  for(const c of S.chests){if(!c.got&&dist(p,c)<16){c.got=true;S.loot++; if(quest()&&S.loot>=quest().chests){S.qi++; if(S.qi>=15){S.ended=true;persist();show('林间凯旋','十五件林务完成，星落营地为你点起篝火。',false)} persist()} hud()}}
}
el('nextzone').onclick=()=>{if(!S.running)return; if(S.qi< (S.zi+1)*3){el('qtext').textContent='先做完本区任务段';return} if(S.zi<4){S.zi++; spawn(); persist()}};
el('btn-start').onclick=()=>{Object.assign(S,{zi:0,qi:0,hp:8,ended:false});spawn();persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d);spawn();hide()};
function draw(){ctx.fillStyle='#1d3b28';ctx.fillRect(0,0,480,270); for(const c of S.chests){if(c.got)continue;ctx.fillStyle='#f59e0b';ctx.fillRect(c.x-7,c.y-6,14,12)}
  for(const e of S.enemies){if(e.hp<=0)continue;ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#f8fafc';ctx.beginPath();ctx.arc(S.player.x,S.player.y,8,0,Math.PI*2);ctx.fill()}
function loop(){update();draw();requestAnimationFrame(loop)}
window.addEventListener('keydown',e=>{keys.add(e.key)}); window.addEventListener('keyup',e=>keys.delete(e.key));
LongplayPause.mount({title:'林间轻旅',statusText:()=>`任务 ${S.qi}/15`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/zones.json').then(r=>r.json()).then(d=>{DATA=d; const sv=save.load(); show('林间轻旅','五区域任务板，约30–50分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); spawn(); loop()});
