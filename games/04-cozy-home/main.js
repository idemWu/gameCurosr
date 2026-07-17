
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('04-cozy-home',2);
const TILE=30,OX=60,OY=40; let DATA=null;
const S={running:false,ci:0,placed:[],selected:null,ended:false,roomsUnlocked:1};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function comm(){return DATA.commissions[S.ci]}
function score(){return S.placed.reduce((a,p)=>a+p.score,0)}
function persist(){save.save({ci:S.ci,ended:S.ended,roomsUnlocked:S.roomsUnlocked})}
function hud(){const c=comm(); el('ci').textContent=c.id; el('ctitle').textContent=c.title; el('score').textContent=score(); el('goal').textContent=c.goal; el('room').textContent=c.room;
  el('palette').innerHTML=DATA.items.map(it=>`<button data-id="${it.id}">${it.name}</button>`).join('');
  [...el('palette').querySelectorAll('button')].forEach(b=>b.onclick=()=>S.selected=b.dataset.id)}
function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
canvas.onclick=e=>{if(!S.running)return; const r=canvas.getBoundingClientRect(); const x=Math.floor(((e.clientX-r.left)*(canvas.width/r.width)-OX)/TILE); const y=Math.floor(((e.clientY-r.top)*(canvas.height/r.height)-OY)/TILE);
  if(x<0||y<0||x>=DATA.cols||y>=DATA.rows)return;
  const hit=S.placed.find(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h); if(hit){S.placed=S.placed.filter(p=>p!==hit);hud();return}
  const def=DATA.items.find(i=>i.id===S.selected); if(!def)return; if(x+def.w>DATA.cols||y+def.h>DATA.rows)return;
  const next={...def,x,y}; if(S.placed.some(p=>overlaps(next,p)))return; S.placed.push(next); hud()};
el('clear').onclick=()=>{S.placed=[];hud()};
el('submit').onclick=()=>{if(!S.running)return; if(score()<comm().goal){return} S.ci++; S.placed=[]; if(S.ci>=DATA.commissions.length){S.ended=true;persist();show('窗边花开','十二间布置委托完成，小屋成为展览明星。',false);return} persist();hud()};
el('btn-start').onclick=()=>{S.ci=0;S.placed=[];S.ended=false;S.selected=DATA.items[0].id;persist();hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d);S.placed=[];hud();hide()};
function draw(){ctx.fillStyle='#8fb8d8';ctx.fillRect(0,0,480,270);ctx.fillStyle='#e7d3b0';ctx.fillRect(OX,OY,DATA.cols*TILE,DATA.rows*TILE);
  ctx.strokeStyle='rgba(0,0,0,.15)'; for(let x=0;x<=DATA.cols;x++){ctx.beginPath();ctx.moveTo(OX+x*TILE,OY);ctx.lineTo(OX+x*TILE,OY+DATA.rows*TILE);ctx.stroke()}
  for(const p of S.placed){ctx.fillStyle=p.color;ctx.fillRect(OX+p.x*TILE+2,OY+p.y*TILE+2,p.w*TILE-4,p.h*TILE-4)}}
function loop(){if(DATA)draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'窗边小屋',statusText:()=>`委托 ${S.ci+1}/12`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/decor.json').then(r=>r.json()).then(d=>{DATA=d;S.selected=d.items[0].id; const sv=save.load(); show('窗边小屋','12委托长线布置，约30–45分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); hud(); loop()});
