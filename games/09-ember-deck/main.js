
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('09-ember-deck',2);
let CAM=null;
const S={running:false,ni:0,hp:30,gold:20,deck:['slash','slash','fire','guard','spark'],relics:[],energy:3,ehp:0,phase:'map',hand:[],ended:false,dmgBonus:0};
const el=id=>document.getElementById(id);
function card(id){return CAM.cards.find(c=>c.id===id)}
function node(){return CAM.nodes[S.ni]}
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'block':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({ni:S.ni,hp:S.hp,gold:S.gold,deck:S.deck,relics:S.relics,ended:S.ended,dmgBonus:S.dmgBonus})}
function hud(){
  const n=node(); el('node').textContent=String(S.ni+1); el('act').textContent=n?n.act:'-';
  el('hp').textContent=S.hp; el('energy').textContent=S.energy; el('gold').textContent=S.gold;
  el('ehp').textContent=S.ehp; el('ntype').textContent=n?`${n.type} ${n.name}`:'结束';
}
function deal(){S.energy=3; S.hand=[]; for(let i=0;i<5;i++) S.hand.push(S.deck[Math.floor(Math.random()*S.deck.length)]); renderHand()}
function renderHand(){
  el('hand').innerHTML='';
  S.hand.forEach((id,i)=>{const c=card(id); const b=document.createElement('button'); b.textContent=`${c.name}(${c.cost})`; b.onclick=()=>play(i); el('hand').appendChild(b)})
}
function hasRelic(id){return S.relics.includes(id)}
function play(i){
  if(S.phase!=='fight'||!S.running)return;
  const id=S.hand[i], c=card(id); if(S.energy<c.cost)return;
  S.energy-=c.cost; S.hand.splice(i,1); renderHand();
  let dmg=(c.dmg||0)+(hasRelic('sharp')?1:0)+S.dmgBonus; if(dmg) S.ehp-=dmg; if(c.heal) S.hp+=c.heal;
  hud();
  if(S.ehp<=0){ winFight(); return }
  // enemy turn after card if hand empty or energy 0 optional: always enemy after each card for pace
  enemyTurn();
}
function enemyTurn(){
  const n=node(); S.hp-=n.enemyDmg; hud();
  if(S.hp<=0){persist(); show('阵线溃散','可继续读档至当前节点前进度。',!!save.load()); return}
  if(!S.hand.length||S.energy<=0) deal();
}
function winFight(){
  S.gold+=10+(hasRelic('purse')?8:0); S.phase='reward'; el('pick').innerHTML='<div>选择一张加入牌组</div>';
  const opts=[...CAM.cards].sort(()=>Math.random()-0.5).slice(0,3);
  opts.forEach(o=>{const b=document.createElement('button'); b.textContent=o.name; b.onclick=()=>{S.deck.push(o.id); el('pick').innerHTML=''; nextNode()}; el('pick').appendChild(b)});
  hud(); persist();
}
function nextNode(){
  S.ni++;
  if(S.ni>=CAM.nodes.length){S.ended=true;persist();show('余烬长明','三章首领尽数倒下！',false);return}
  S.phase='map'; hud(); persist();
}
function enter(){
  if(!S.running)return; const n=node(); if(!n)return;
  if(n.type==='shop'){
    S.phase='shop'; el('pick').innerHTML='';
    const opts=[...CAM.cards].sort(()=>Math.random()-0.5).slice(0,3);
    opts.forEach(o=>{const b=document.createElement('button'); b.textContent=`买 ${o.name} (15金)`; b.onclick=()=>{if(S.gold>=15){S.gold-=15;S.deck.push(o.id);hud()}}; el('pick').appendChild(b)});
    if(S.relics.length<2){const r=CAM.relics[S.relics.length]; const b=document.createElement('button'); b.textContent=`遗物 ${r.name} (25金)`; b.onclick=()=>{if(S.gold>=25){S.gold-=25;S.relics.push(r.id); if(r.id==='sharp')S.dmgBonus=1; hud()}}; el('pick').appendChild(b)}
    const go=document.createElement('button'); go.textContent='离开商店'; go.onclick=()=>{el('pick').innerHTML=''; nextNode()}; el('pick').appendChild(go);
  } else if(n.type==='camp'){ S.hp+=12+(hasRelic('lantern')?5:0); nextNode(); }
  else { S.phase='fight'; S.ehp=n.enemyHp; if(hasRelic('ember_heart')) S.hp+=3; deal(); hud(); }
}
el('actbtn').onclick=enter;
el('btn-start').onclick=()=>{Object.assign(S,{ni:0,hp:30,gold:20,deck:['slash','slash','fire','guard','spark'],relics:[],energy:3,ehp:0,phase:'map',hand:[],ended:false,dmgBonus:0}); el('pick').innerHTML=''; persist();hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d); S.phase='map'; hud();hide()};
function draw(){
  ctx.fillStyle='#29160f';ctx.fillRect(0,0,480,270);
  for(let i=0;i<24;i++){ctx.fillStyle=i<S.ni?'#86efac':(i===S.ni?'#fbbf24':'#57534e');ctx.beginPath();ctx.arc(30+(i%8)*55, 60+Math.floor(i/8)*70, 12,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#ffe8dc';ctx.font='14px sans-serif';ctx.fillText(S.phase==='fight'?`战斗中 EHP ${S.ehp}`:'选择节点推进战役',20,250);
}
function loop(){draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'余烬牌阵',statusText:()=>`节点 ${S.ni+1}/24 HP ${S.hp}`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/campaign.json').then(r=>r.json()).then(c=>{CAM=c; const d=save.load(); show('余烬牌阵','24 个战役节点，三章首领。约35–55分钟。',!!(d&&!d.ended)); if(d) Object.assign(S,d); hud(); loop()});
