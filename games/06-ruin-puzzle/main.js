
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('06-ruin-puzzle',2);
const T=28,OX=20,OY=20; let LEVELS=[]; 
const S={running:false,li:0,grid:[],px:0,py:0,open:false,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({li:S.li,ended:S.ended})}
function load(i){S.li=i;S.open=false;S.grid=LEVELS[i].map(r=>r.split('')); for(let y=0;y<S.grid.length;y++)for(let x=0;x<S.grid[y].length;x++) if(S.grid[y][x]==='S'){S.px=x;S.py=y;S.grid[y][x]='.'} el('level').textContent=i+1}
function blocked(x,y){const c=S.grid[y]&&S.grid[y][x]; if(!c||c==='#')return true; if(c==='P'&&!S.open)return true; return false}
function move(dx,dy){if(!S.running)return; const nx=S.px+dx,ny=S.py+dy; if(blocked(nx,ny))return; S.px=nx;S.py=ny; if(S.grid[ny][nx]==='K')S.open=!S.open; if(S.grid[ny][nx]==='E'){ if(S.li>=LEVELS.length-1){S.ended=true;persist();show('石门尽开','四十重遗迹机关皆解。',false)} else {load(S.li+1);persist()}}}
el('reset').onclick=()=>load(S.li);
el('btn-start').onclick=()=>{S.ended=false;load(0);persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} S.li=d.li||0; load(S.li);hide()};
window.onkeydown=e=>{const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]}; if(m[e.key]){move(...m[e.key]);e.preventDefault()}};
function draw(){ctx.fillStyle='#111827';ctx.fillRect(0,0,480,270); for(let y=0;y<S.grid.length;y++)for(let x=0;x<S.grid[y].length;x++){const c=S.grid[y][x]; let col='#1f2937'; if(c==='#')col='#4b5563'; else if(c==='E')col='#fbbf24'; else if(c==='K')col='#60a5fa'; else if(c==='P')col=S.open?'#334155':'#22d3ee'; ctx.fillStyle=col; ctx.fillRect(OX+x*T,OY+y*T,T-2,T-2)} ctx.fillStyle='#fff';ctx.fillRect(OX+S.px*T+6,OY+S.py*T+6,T-12,T-12)}
function loop(){draw();requestAnimationFrame(loop)}
LongplayPause.mount({title:'石纹遗迹',statusText:()=>`关卡 ${S.li+1}/40`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/levels.json').then(r=>r.json()).then(d=>{LEVELS=d.levels; const sv=save.load(); show('石纹遗迹','40关解谜，约30–50分钟。',!!(sv&&!sv.ended)); load(sv?sv.li:0); loop()});
