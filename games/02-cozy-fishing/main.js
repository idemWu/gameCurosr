
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('02-cozy-fishing',2);
let DATA=null;
const S={running:false,caught:{},rare:0,qi:0,phase:'idle',bar:0,dir:1,zone:[0.42,0.62],ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function dex(){return Object.keys(S.caught).length}
function persist(){save.save({caught:S.caught,rare:S.rare,qi:S.qi,ended:S.ended})}
function refreshSpots(){
  const n=dex(); el('spot').innerHTML=DATA.spots.map(s=>`<option value="${s.id}" ${n<s.need?'disabled':''}>${s.name}${n<s.need?`(${s.need})`:''}</option>`).join('');
}
function hud(){
  el('dex').textContent=dex(); el('rare').textContent=S.rare; el('qi').textContent=Math.min(8,S.qi+1);
  const q=DATA.quests[S.qi]; el('qtext').textContent=q?q.text:'任务完成'; refreshSpots();
}
function checkQuests(){
  while(S.qi<DATA.quests.length){
    const q=DATA.quests[S.qi]; let ok=false;
    if(q.need===8&&dex()>=8)ok=true;
    else if(q.text.includes('稀有')&&S.rare>=3)ok=true;
    else if(q.need===20&&dex()>=20)ok=true;
    else if(q.need===30&&dex()>=30)ok=true;
    else if(q.need===40&&dex()>=40)ok=true;
    else if(q.text.includes('礁石')&&dex()>=5)ok=true;
    else if(q.text.includes('沉船')&&dex()>=20)ok=true;
    else if(q.text.includes('星落')&&dex()>=30)ok=true;
    if(ok)S.qi++; else break;
  }
  if(dex()>=40&&S.qi>=DATA.quests.length){S.ended=true;persist();show('晚潮入册','四十尾海灵皆入图鉴。',false)}
}
el('cast').onclick=()=>{
  if(!S.running)return;
  if(S.phase==='idle'){S.phase='cast';S.bar=0;S.dir=1;el('cast').textContent='收杆！';return}
  const [a,b]=S.zone; const ok=S.bar>=a&&S.bar<=b; S.phase='idle'; el('cast').textContent='抛竿 / 收杆';
  if(!ok)return;
  const spot=+el('spot').value; const pool=DATA.fish.filter(f=>f.spot===spot);
  const f=pool[Math.floor(Math.random()*pool.length)]||DATA.fish[0];
  if(!S.caught[f.id]){S.caught[f.id]=true; if(f.rare)S.rare++}
  else if(f.rare&&Math.random()<0.3)S.rare++;
  checkQuests(); hud(); persist();
};
function update(){if(!S.running||S.phase!=='cast')return; S.bar+=0.014*S.dir; if(S.bar>1||S.bar<0){S.dir*=-1;S.bar=Math.max(0,Math.min(1,S.bar))}}
function draw(){
  ctx.fillStyle='#0b1c2c';ctx.fillRect(0,0,480,270);
  ctx.fillStyle='#245a3b';ctx.fillRect(0,230,480,40);
  const x=50,y=200,w=380,h=16; ctx.fillStyle='#111';ctx.fillRect(x,y,w,h); ctx.fillStyle='#7ddea8';ctx.fillRect(x+S.zone[0]*w,y,(S.zone[1]-S.zone[0])*w,h);
  ctx.fillStyle='#fff';ctx.fillRect(x+S.bar*w-2,y-3,4,h+6);
  for(let i=0;i<40;i++){ctx.fillStyle=S.caught[DATA.fish[i].id]? '#67e8f9':'#334155';ctx.fillRect(12+(i%20)*23,12+Math.floor(i/20)*18,16,12)}
}
function loop(){update();draw();requestAnimationFrame(loop)}
el('btn-start').onclick=()=>{S.caught={};S.rare=0;S.qi=0;S.ended=false;persist();hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d);hud();hide()};
LongplayPause.mount({title:'晚潮钓手',statusText:()=>`图鉴 ${dex()}/40`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/fish.json').then(r=>r.json()).then(d=>{DATA=d; const sv=save.load(); show('晚潮钓手','40图鉴与任务线，约30–50分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); hud(); loop()});
