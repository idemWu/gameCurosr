
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('15-shelf-sort',2);
const COLORS=['#ef4444','#3b82f6','#eab308','#a855f7']; const COLS=4,H=4,T=40,OX=80,OY=40;
const S={running:false,li:0,cols:[[],[],[],[]],sel:null,moves:0,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function persist(){save.save({li:S.li,ended:S.ended})}
function gen(){const bags=[]; for(let c=0;c<4;c++) for(let i=0;i<H;i++) bags.push(c);
  for(let i=bags.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [bags[i],bags[j]]=[bags[j],bags[i]]}
  S.cols=[[],[],[],[]]; for(const b of bags){let opts=S.cols.map((col,i)=>col.length<H?i:null).filter(v=>v!==null); if(opts.length>1) opts=opts.filter(i=>i<3||Math.random()<0.3); S.cols[opts[Math.floor(Math.random()*opts.length)]].push(b)}
  if(S.cols.every(c=>c.length===H)) S.cols[3].pop(); S.sel=null; S.moves=0; el('level').textContent=S.li+1; el('moves').textContent=0}
function solved(){return S.cols.every(col=>!col.length||(col.length===H&&col.every(v=>v===col[0])))}
el('reset').onclick=()=>gen();
canvas.onclick=ev=>{if(!S.running)return; const r=canvas.getBoundingClientRect(); const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/(T+24));
  if(x<0||x>=COLS)return; if(S.sel==null){if(S.cols[x].length)S.sel=x;return} if(S.sel===x){S.sel=null;return}
  const from=S.sel,to=x; const book=S.cols[from][S.cols[from].length-1]; const top=S.cols[to][S.cols[to].length-1];
  if(S.cols[to].length>=H)return; if(S.cols[to].length&&top!==book)return;
  S.cols[from].pop(); S.cols[to].push(book); S.sel=null; S.moves++; el('moves').textContent=S.moves;
  if(solved()){ if(S.li>=39){S.ended=true;persist();show('书架如诗','四十关整理完成。',false)} else {S.li++; persist(); gen()}}}
function draw(){ctx.fillStyle='#111827';ctx.fillRect(0,0,480,270); for(let c=0;c<COLS;c++){const x=OX+c*(T+24); ctx.fillStyle='#374151';ctx.fillRect(x,OY,T,H*T+8);
  S.cols[c].forEach((b,i)=>{ctx.fillStyle=COLORS[b];ctx.fillRect(x+4,OY+H*T-(i+1)*T+4,T-8,T-6)}); if(S.sel===c){ctx.strokeStyle='#34d399';ctx.strokeRect(x-2,OY-2,T+4,H*T+12)}}}
function loop(){draw();requestAnimationFrame(loop)}
el('btn-start').onclick=()=>{S.li=0;S.ended=false;gen();persist();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} S.li=d.li||0; gen();hide()};
LongplayPause.mount({title:'书架整理',statusText:()=>`关卡 ${S.li+1}/40`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
const sv=save.load(); show('书架整理','40关收纳，约30–50分钟。',!!(sv&&!sv.ended)); S.li=sv?sv.li:0; gen(); loop();
