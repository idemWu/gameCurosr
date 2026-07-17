
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('12-idle-stars',2);
let MILES=[]; const S={running:false,dust:0,click:1,auto:0,dex:0,mi:0,ended:false,pulse:0};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({dust:S.dust,click:S.click,auto:S.auto,dex:S.dex,mi:S.mi,ended:S.ended})}
function hud(){el('dust').textContent=Math.floor(S.dust); el('rate').textContent=S.auto; el('click').textContent=S.click; el('dex').textContent=S.dex; el('mi').textContent=Math.min(12,S.mi+1); el('mt').textContent=MILES[S.mi]?MILES[S.mi].text:'完成';
  el('u1').textContent=`升级点击 (${10+S.click*8})`; el('u2').textContent=`自动 (${25+S.auto*15})`; el('u3').textContent=S.dex>=3?'外观满':`外观 (${50+S.dex*40})`}
function check(){const m=MILES[S.mi]; if(!m)return; let ok=false;
  if(m.text.includes('星尘达到')&&S.dust>=m.need)ok=true;
  if(m.text.includes('点击升级')&&S.click>=m.need)ok=true;
  if(m.text.includes('自动产出')&&S.auto>=m.need)ok=true;
  if(m.text.includes('外观')&&S.dex>=m.need)ok=true;
  if(ok){S.mi++; if(S.mi>=MILES.length){S.ended=true;persist();show('星图全亮','十二里程碑点亮夜空。',false)} persist(); hud()}}
el('tap').onclick=()=>{if(!S.running)return; S.dust+=S.click; S.pulse=8; check(); hud(); persist()};
el('u1').onclick=()=>{const c=10+S.click*8; if(S.dust>=c){S.dust-=c;S.click++; check();hud();persist()}};
el('u2').onclick=()=>{const c=25+S.auto*15; if(S.dust>=c){S.dust-=c;S.auto++; check();hud();persist()}};
el('u3').onclick=()=>{if(S.dex>=3)return; const c=50+S.dex*40; if(S.dust>=c){S.dust-=c;S.dex++; check();hud();persist()}};
let last=performance.now(),acc=0;
function update(dt){if(!S.running)return; acc+=dt; if(acc>0.25){S.dust+=S.auto*acc; acc=0; check(); hud()} if(S.pulse>0)S.pulse--}
function draw(){ctx.fillStyle='#020617';ctx.fillRect(0,0,480,270); ctx.fillStyle=S.pulse?'#f5d0fe':'#c084fc'; ctx.beginPath();ctx.arc(240,135,40+S.pulse,0,Math.PI*2);ctx.fill();
  for(let i=0;i<S.dex;i++){ctx.fillStyle=['#fde68a','#67e8f9','#f9a8d4'][i];ctx.beginPath();ctx.arc(160+i*80,220,16,0,Math.PI*2);ctx.fill()}}
function loop(now){update((now-last)/1000); last=now; draw(); requestAnimationFrame(loop)}
el('btn-start').onclick=()=>{Object.assign(S,{dust:0,click:1,auto:0,dex:0,mi:0,ended:false});persist();hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d);hud();hide()};
LongplayPause.mount({title:'星尘挂机',statusText:()=>`里程碑 ${S.mi}/12`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/milestones.json').then(r=>r.json()).then(d=>{MILES=d.milestones; const sv=save.load(); show('星尘挂机','12里程碑活跃目标，约30–45分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); hud(); requestAnimationFrame(loop)});
