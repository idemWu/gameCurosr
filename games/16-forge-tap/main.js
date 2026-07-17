
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('16-forge-tap',2);
let REC=[]; const S={running:false,metal:0,hammer:1,rec:0,ended:false,heat:0};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({metal:S.metal,hammer:S.hammer,rec:S.rec,ended:S.ended})}
function hud(){el('metal').textContent=Math.floor(S.metal); el('hammer').textContent=S.hammer; el('rec').textContent=S.rec; el('rname').textContent=REC[S.rec]?REC[S.rec].name:'全部完成';
  el('up').textContent=`升级锤子 (${20*S.hammer})`; el('craft').textContent=REC[S.rec]?`研究 ${REC[S.rec].name} (${REC[S.rec].cost})`:'完成'}
el('tap').onclick=()=>{if(!S.running)return; S.metal+=S.hammer; S.heat=10; hud(); persist()};
el('up').onclick=()=>{const c=20*S.hammer; if(S.metal>=c){S.metal-=c;S.hammer++; hud();persist()}};
el('craft').onclick=()=>{if(!S.running||!REC[S.rec])return; const c=REC[S.rec].cost; if(S.metal>=c){S.metal-=c; S.rec++; if(S.rec>=REC.length){S.ended=true;persist();show('锻火传世','八大配方皆成，铁匠铺名扬港湾。',false)} hud();persist()}};
function draw(){ctx.fillStyle='#21140e';ctx.fillRect(0,0,480,270); ctx.fillStyle='#57534e';ctx.fillRect(160,150,160,40); ctx.fillStyle=S.heat?'#fb923c':'#78350f';ctx.fillRect(200,90,80,70);
  ctx.fillStyle='#fff7ed';ctx.font='14px sans-serif'; for(let i=0;i<S.rec;i++) ctx.fillText(REC[i].name,40,50+i*22); if(S.heat>0)S.heat--}
function loop(){draw();requestAnimationFrame(loop)}
el('btn-start').onclick=()=>{Object.assign(S,{metal:0,hammer:1,rec:0,ended:false});persist();hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d);hud();hide()};
LongplayPause.mount({title:'铁匠一点通',statusText:()=>`配方 ${S.rec}/8`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/recipes.json').then(r=>r.json()).then(d=>{REC=d.recipes; const sv=save.load(); show('铁匠一点通','8配方章节，约30–45分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); hud(); loop()});
