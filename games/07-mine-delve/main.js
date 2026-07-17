
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('07-mine-delve',2);
const T=22,W=18,H=10;
let CAM=null;
const S={running:false,floor:1,hp:8,oil:100,pick:1,copper:0,mythril:0,gold:0,px:1,py:1,map:[],qi:0,qprog:0,qdone:0,maxDepth:1,oilBuys:0,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'block':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function quest(){return CAM.quests[S.qi]||null}
function hud(){
  el('floor').textContent=S.floor;el('pick').textContent=S.pick;el('hp').textContent=Math.ceil(S.hp);
  el('oil').textContent=Math.floor(S.oil);el('copper').textContent=S.copper;el('mythril').textContent=S.mythril;el('gold').textContent=S.gold;
  const q=quest(); el('quest').textContent=q?q.text:'全部完成'; el('qprog').textContent=S.qprog; el('qneed').textContent=q?q.amount:0; el('qdone').textContent=S.qdone;
}
function persist(){save.save({...S,map:null});}
function gen(){
  const m=[]; for(let y=0;y<H;y++){const row=[];for(let x=0;x<W;x++){
    if(!x||!y||x===W-1||y===H-1) row.push('#');
    else{const r=Math.random(); const deep=S.floor/25;
      if(r<0.07) row.push('C'); else if(r<0.1+deep*0.05) row.push('M'); else if(r<0.12+deep*0.03) row.push('G');
      else if(r<0.16+deep*0.06) row.push('E'); else row.push('.');
    }
  }m.push(row)}
  m[1][1]='.'; S.px=1;S.py=1;
  if(S.floor<25) m[H-2][W-2]='D'; else m[H-2][W-2]='B';
  if(S.floor%5===0) m[2][2]='S';
  S.map=m;
}
function advanceQuest(type,n=1){
  const q=quest(); if(!q) return;
  if(q.type!==type) return;
  S.qprog+=n;
  if(S.qprog>=q.amount){
    S.qdone++; S.oil+=q.rewardOil; S.pick+=q.rewardPick; S.qi++; S.qprog=0;
    if(S.qdone>=15 && S.maxDepth>=25){S.ended=true; persist(); show('矿灯长明','任务线完成，你征服了第25层。','');}
  }
}
function move(dx,dy){
  if(!S.running)return;
  const nx=S.px+dx,ny=S.py+dy,c=S.map[ny][nx];
  if(c==='#')return;
  S.px=nx;S.py=ny; S.oil-=Math.max(0.6,1.2-S.pick*0.1);
  if(c==='C'){S.map[ny][nx]='.';S.copper+=S.pick;advanceQuest('copper',S.pick)}
  if(c==='M'){S.map[ny][nx]='.';S.mythril+=1;advanceQuest('mythril',1)}
  if(c==='G'){S.map[ny][nx]='.';S.gold+=2}
  if(c==='E'){S.map[ny][nx]='.';S.hp-=1}
  if(c==='D'){S.floor++;S.maxDepth=Math.max(S.maxDepth,S.floor);advanceQuest('depth',0); if(quest()&&quest().type==='depth'&&S.floor>=quest().amount){S.qprog=quest().amount;advanceQuest('depth',0)} if(quest()&&quest().type==='bossdepth'&&S.floor>=quest().amount){S.qprog=quest().amount;advanceQuest('bossdepth',0)} gen()}
  if(c==='B'){S.maxDepth=25; if(S.qdone>=15){S.ended=true;persist();show('矿灯长明','底层回响平息，你带着星辉矿石升井。',false);} else {S.bubble='还需完成更多地表任务';}}
  if(S.oil<=0){S.oil=0;S.hp-=0.2}
  if(S.hp<=0){persist();show('灯灭了','读档或新开一趟矿灯。',!!save.load());return}
  hud();persist();
}
el('up').onclick=()=>{if(!S.running)return; if(S.floor>1){S.floor--;gen();hud();persist();} else {show('矿口营地',`铜${S.copper} 秘银${S.mythril} 金${S.gold}。点继续返回B1。`,true);}};
el('shop').onclick=()=>{if(!S.running)return; if(S.floor%5!==0&&S.floor!==1){return} if(S.gold<5)return; S.gold-=5;S.oil+=40;S.oilBuys++; advanceQuest('oil',1);hud();persist();};
el('btn-start').onclick=()=>{Object.assign(S,{floor:1,hp:8,oil:100,pick:1,copper:0,mythril:0,gold:0,qi:0,qprog:0,qdone:0,maxDepth:1,oilBuys:0,ended:false});gen();hud();persist();hide();};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return;} Object.assign(S,d); gen();hud();hide();};
window.addEventListener('keydown',e=>{const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],A:[-1,0],D:[1,0],W:[0,-1],S:[0,1]}; if(m[e.key]){move(...m[e.key]);e.preventDefault()}});
function draw(){
  ctx.fillStyle='#0c0a09';ctx.fillRect(0,0,480,270);
  const dim=Math.max(0.3,Math.min(1,S.oil/100));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const c=S.map[y][x]; let col='#292524';
    if(c==='#')col='#57534e'; else if(c==='C')col='#38bdf8'; else if(c==='M')col='#22d3ee'; else if(c==='G')col='#facc15';
    else if(c==='E')col='#ef4444'; else if(c==='D'||c==='B')col='#a3e635'; else if(c==='S')col='#f97316';
    ctx.globalAlpha=dim; ctx.fillStyle=col; ctx.fillRect(24+x*T,20+y*T,T-2,T-2);
  }
  ctx.globalAlpha=1; ctx.fillStyle='#fef3c7'; ctx.fillRect(24+S.px*T+5,20+S.py*T+5,T-12,T-12);
}
function loop(){draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'矿灯深途',statusText:()=>`B${S.floor} 任务${S.qdone}/15`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/campaign.json').then(r=>r.json()).then(c=>{CAM=c; const d=save.load(); show('矿灯深途','25层矿井与15条任务。管理灯油与生命，约35–55分钟。', !!(d&&!d.ended)); if(d) Object.assign(S,d); gen(); hud(); loop();});
