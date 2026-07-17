
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('03-cozy-cafe',2);
let DATA=null;
const S={running:false,day:1,gold:0,served:0,today:0,unlocked:5,lv:1,guest:null,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function menu(){return DATA.drinks.slice(0,S.unlocked)}
function persist(){save.save({day:S.day,gold:S.gold,served:S.served,today:S.today,unlocked:S.unlocked,lv:S.lv,ended:S.ended})}
function hud(){el('day').textContent=S.day;el('gold').textContent=S.gold;el('today').textContent=S.today;el('served').textContent=S.served;el('rec').textContent=S.unlocked;el('lv').textContent=S.lv;
  el('drinks').innerHTML=menu().map(d=>`<button data-id="${d.id}">${d.name}</button>`).join('');
  [...el('drinks').querySelectorAll('button')].forEach(b=>b.onclick=()=>serve(b.dataset.id));
  el('order').textContent=S.guest?`客人：${S.guest.name}`:'等待客人…'}
function spawn(){const m=menu(); S.guest={name:m[Math.floor(Math.random()*m.length)].name, id:m[Math.floor(Math.random()*m.length)].id, x:480}; hud()}
function serve(id){if(!S.running||!S.guest)return; if(id!==S.guest.id){return} S.gold+=4+S.lv; S.served++; S.today++; S.guest=null; if(S.served%12===0&&S.unlocked<DATA.drinks.length)S.unlocked++; hud();persist(); if(S.today<8) setTimeout(()=>{if(S.running)spawn()},300); checkEnd()}
function checkEnd(){if(S.day>=14&&S.served>=80&&S.unlocked>=10){S.ended=true;persist();show('暖汤飘香','十四天的炉火与笑声，咖啡馆成为港湾心灵灯塔。',false)}}
el('endday').onclick=()=>{if(!S.running)return; if(S.today<8){el('order').textContent='今天还没服务满 8 人';return} if(S.day>=14){checkEnd();return} S.day++; S.today=0; spawn(); persist(); hud()};
el('upgrade').onclick=()=>{if(S.gold>=40&&S.lv<3){S.gold-=40;S.lv++;hud();persist()}};
el('btn-start').onclick=()=>{Object.assign(S,{day:1,gold:0,served:0,today:0,unlocked:5,lv:1,ended:false});spawn();persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d);spawn();hide()};
function draw(){ctx.fillStyle='#3b261f';ctx.fillRect(0,0,480,270);ctx.fillStyle='#6b3e2e';ctx.fillRect(0,180,480,90);ctx.fillStyle='#fde68a';ctx.font='14px sans-serif';ctx.fillText(`Day ${S.day} 服务${S.served}`,16,24); if(S.guest){ctx.fillStyle='#fda4af';ctx.fillRect(Math.max(280,S.guest.x-=1.2),140,28,36);ctx.fillStyle='#fff';ctx.fillRect(S.guest.x-10,110,90,24);ctx.fillStyle='#111';ctx.fillText(S.guest.name,S.guest.x-4,126)}}
function loop(){draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'暖汤咖啡馆',statusText:()=>`第${S.day}天 服务${S.served}`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/menu.json').then(r=>r.json()).then(d=>{DATA=d; const sv=save.load(); show('暖汤咖啡馆','14天经营长线，约30–50分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); hud(); loop()});
