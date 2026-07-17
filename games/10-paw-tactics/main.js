
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('10-paw-tactics',2);
const T=48,OX=48,OY=30,W=6,H=4; let STAGES=[]; let units=[],sel=null,playerTurn=true;
const S={running:false,si:0,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({si:S.si,ended:S.ended})}
function setup(){const st=STAGES[S.si]; el('st').textContent=st.id;
  units=[
    {side:'p',x:0,y:1,hp:10,atk:3,moved:false,name:'喵刀'},{side:'p',x:0,y:2,hp:9,atk:2,moved:false,name:'汪盾'},{side:'p',x:1,y:1,hp:8,atk:4,moved:false,name:'狐弓'},
    {side:'e',x:5,y:1,hp:st.enemyHp,atk:st.enemyAtk,moved:false,name:'影'},{side:'e',x:5,y:2,hp:st.enemyHp-1,atk:st.enemyAtk,moved:false,name:'骨'},{side:'e',x:4,y:2,hp:st.enemyHp-2,atk:st.enemyAtk+1,moved:false,name:'鸦'}
  ]; sel=null; playerTurn=true; el('turn').textContent='我方'}
function at(x,y){return units.find(u=>u.hp>0&&u.x===x&&u.y===y)}
function enemyAI(){playerTurn=false; el('turn').textContent='敌方';
  for(const e of units.filter(u=>u.side==='e'&&u.hp>0)){const foes=units.filter(u=>u.side==='p'&&u.hp>0); if(!foes.length)break;
    foes.sort((a,b)=>(Math.abs(a.x-e.x)+Math.abs(a.y-e.y))-(Math.abs(b.x-e.x)+Math.abs(b.y-e.y))); const t=foes[0];
    if(Math.abs(t.x-e.x)+Math.abs(t.y-e.y)===1) t.hp-=e.atk; else {const nx=e.x+Math.sign(t.x-e.x), ny=e.y+(t.x!==e.x?0:Math.sign(t.y-e.y)); if(nx>=0&&ny>=0&&nx<W&&ny<H&&!at(nx,ny)){e.x=nx;e.y=ny}}}
  if(!units.some(u=>u.side==='p'&&u.hp>0)){persist();show('战败','读档再战。',!!save.load());return}
  units.filter(u=>u.side==='p').forEach(u=>u.moved=false); playerTurn=true; el('turn').textContent='我方'}
canvas.onclick=ev=>{if(!S.running||!playerTurn)return; const r=canvas.getBoundingClientRect(); const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/T); const y=Math.floor(((ev.clientY-r.top)*(canvas.height/r.height)-OY)/T);
  if(x<0||y<0||x>=W||y>=H)return; const u=at(x,y);
  if(sel&&sel.side==='p'&&!sel.moved){ if(u&&u.side==='e'&&Math.abs(u.x-sel.x)+Math.abs(u.y-sel.y)===1){u.hp-=sel.atk;sel.moved=true;sel=null; if(!units.some(z=>z.side==='e'&&z.hp>0)){ if(S.si>=19){S.ended=true;persist();show('爪爪传说','二十场战役全胜！',false)} else {S.si++;persist();setup()}} return}
    if(!u&&Math.abs(x-sel.x)+Math.abs(y-sel.y)===1){sel.x=x;sel.y=y;sel.moved=true;sel=null;return}}
  if(u&&u.side==='p'&&!u.moved){sel=u; el('info').textContent='选中 '+u.name}}
el('end').onclick=()=>{if(S.running&&playerTurn)enemyAI()};
el('btn-start').onclick=()=>{S.si=0;S.ended=false;setup();persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} S.si=d.si||0; setup();hide()};
function draw(){ctx.fillStyle='#111827';ctx.fillRect(0,0,480,270); for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.fillStyle=(x+y)%2?'#1f2937':'#374151';ctx.fillRect(OX+x*T,OY+y*T,T-2,T-2)}
  for(const u of units){if(u.hp<=0)continue; ctx.fillStyle=u.side==='p'?'#93c5fd':'#fca5a5';ctx.fillRect(OX+u.x*T+8,OY+u.y*T+8,T-18,T-18); ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.fillText(String(u.hp),OX+u.x*T+14,OY+u.y*T+28)}}
function loop(){draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'爪爪战棋',statusText:()=>`战役 ${S.si+1}/20`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/stages.json').then(r=>r.json()).then(d=>{STAGES=d.stages; const sv=save.load(); show('爪爪战棋','20关战棋战役，约30–50分钟。',!!(sv&&!sv.ended)); S.si=sv?sv.si:0; setup(); loop()});
