
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('11-bridge-td',2);
const path=[{x:0,y:140},{x:120,y:140},{x:120,y:60},{x:280,y:60},{x:280,y:200},{x:480,y:200}];
const slots=[{x:90,y:100},{x:90,y:170},{x:160,y:90},{x:250,y:100},{x:250,y:160},{x:320,y:160},{x:200,y:140},{x:360,y:180}];
let STAGES=[]; 
const S={running:false,si:0,wave:0,gold:50,hp:12,towers:[],enemies:[],sel:'arrow',spawn:0,active:false,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({si:S.si,ended:S.ended})}
function hud(){const st=STAGES[S.si]; el('st').textContent=st.id; el('wave').textContent=S.wave; el('waves').textContent=st.waves; el('gold').textContent=S.gold; el('hp').textContent=S.hp}
function pathPos(t){let dist=t*22; for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1]; const seg=Math.hypot(b.x-a.x,b.y-a.y); if(dist<=seg){const k=dist/seg; return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}} dist-=seg} return null}
el('t1').onclick=()=>S.sel='arrow'; el('t2').onclick=()=>S.sel='ice';
canvas.onclick=ev=>{if(!S.running)return; const r=canvas.getBoundingClientRect(); const x=(ev.clientX-r.left)*(canvas.width/r.width), y=(ev.clientY-r.top)*(canvas.height/r.height);
  const slot=slots.find(s=>Math.hypot(s.x-x,s.y-y)<18); if(!slot||S.towers.some(t=>t.x===slot.x&&t.y===slot.y))return;
  const cost=S.sel==='arrow'?15:25; if(S.gold<cost)return; S.gold-=cost; S.towers.push({...slot,type:S.sel,cd:0}); hud()};
el('startwave').onclick=()=>{if(!S.running||S.active)return; const st=STAGES[S.si]; if(S.wave>=st.waves)return; S.wave++; S.active=true; S.spawn=6+S.wave+S.si; hud()};
function update(){if(!S.running)return;
  if(S.active&&S.spawn>0&&Math.random()<0.04){S.enemies.push({t:0,hp:8+S.si+S.wave,slow:0}); S.spawn--}
  if(S.active&&S.spawn<=0&&!S.enemies.length){S.active=false; S.gold+=12; const st=STAGES[S.si]; if(S.wave>=st.waves){ if(S.si>=14){S.ended=true;persist();show('桥永固','十五道防线全部守住！',false)} else {S.si++; S.wave=0; S.towers=[]; S.gold=50+S.si*3; S.hp=12; persist(); hud()} } hud()}
  for(const e of S.enemies){e.t+=(e.slow>0?0.35:0.75); if(e.slow>0)e.slow--; const p=pathPos(e.t); if(!p){e.hp=0;S.hp--; if(S.hp<=0){persist();show('桥破','读档再守。',!!save.load())}}}
  S.enemies=S.enemies.filter(e=>e.hp>0);
  for(const t of S.towers){t.cd--; if(t.cd>0)continue; let best=null,bd=1e9; for(const e of S.enemies){const p=pathPos(e.t); if(!p)continue; const d=Math.hypot(p.x-t.x,p.y-t.y); if(d<75&&d<bd){bd=d;best=e}} if(best){best.hp-=t.type==='arrow'?3:2; if(t.type==='ice')best.slow=35; t.cd=t.type==='arrow'?22:32; if(best.hp<=0)S.gold+=2}}
}
function draw(){ctx.fillStyle='#0f172a';ctx.fillRect(0,0,480,270); ctx.strokeStyle='#64748b';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(path[0].x,path[0].y); for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);ctx.stroke();
  for(const s of slots){ctx.fillStyle='#334155';ctx.beginPath();ctx.arc(s.x,s.y,9,0,Math.PI*2);ctx.fill()}
  for(const t of S.towers){ctx.fillStyle=t.type==='arrow'?'#fbbf24':'#67e8f9';ctx.fillRect(t.x-7,t.y-7,14,14)}
  for(const e of S.enemies){const p=pathPos(e.t); if(!p)continue; ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill()}}
function loop(){update();draw();requestAnimationFrame(loop)}
el('btn-start').onclick=()=>{Object.assign(S,{si:0,wave:0,gold:50,hp:12,towers:[],enemies:[],active:false,ended:false});persist();hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} S.si=d.si||0; S.wave=0;S.towers=[];S.enemies=[];S.gold=50+S.si*3;S.hp=12;hud();hide()};
LongplayPause.mount({title:'桥上防线',statusText:()=>`地图 ${S.si+1}/15`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/stages.json').then(r=>r.json()).then(d=>{STAGES=d.stages; const sv=save.load(); show('桥上防线','15地图塔防战役，约30–50分钟。',!!(sv&&!sv.ended)); if(sv)S.si=sv.si||0; hud(); loop()});
