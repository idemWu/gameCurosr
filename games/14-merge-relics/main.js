
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const save=LongplaySave.create('14-merge-relics',2);
const COLS=6,ROWS=5,T=50,OX=40,OY=24; const COLORS=['#a8a29e','#86efac','#67e8f9','#c084fc','#fbbf24','#fb7185','#38bdf8','#f472b6'];
let ORD=null; const S={running:false,cells:Array(30).fill(0),sel:null,max:1,oi:0,odone:0,ended:false};
const el=id=>document.getElementById(id);
function show(t,m,c){el('overlay-title').textContent=t;el('overlay-msg').textContent=m;el('btn-continue').style.display=c?'':'none';el('overlay').classList.remove('hidden');S.running=false}
function hide(){el('overlay').classList.add('hidden');S.running=true}
function order(){return ORD.orders[S.oi]}
function persist(){save.save({cells:S.cells,max:S.max,oi:S.oi,odone:S.odone,ended:S.ended})}
function hud(){const o=order(); el('max').textContent=S.max; el('olv').textContent=o?o.lv:'-'; el('oneed').textContent=o?o.count:0; el('odone').textContent=S.odone; el('oi').textContent=Math.min(ORD.orders.length,S.oi+1)}
function empties(){return S.cells.map((v,i)=>v?null:i).filter(v=>v!==null)}
function spawn(){const e=empties(); if(!e.length)return; S.cells[e[Math.floor(Math.random()*e.length)]]=1; persist()}
el('spawn').onclick=()=>{if(S.running)spawn(); hud()};
canvas.onclick=ev=>{if(!S.running)return; const r=canvas.getBoundingClientRect(); const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/T); const y=Math.floor(((ev.clientY-r.top)*(canvas.height/r.height)-OY)/T);
  if(x<0||y<0||x>=COLS||y>=ROWS)return; const i=y*COLS+x; const v=S.cells[i];
  if(S.sel==null&&v){S.sel=i;return} if(S.sel===i){S.sel=null;return}
  if(S.sel!=null){const a=S.sel,av=S.cells[a]; if(v===av&&v>0&&v<8){S.cells[a]=0; S.cells[i]=v+1; S.max=Math.max(S.max,v+1); S.sel=null;
      const o=order(); if(o&&v+1===o.lv){S.odone++; if(S.odone>=o.count){S.oi++; S.odone=0; if(S.oi>=ORD.orders.length&&S.max>=8){S.ended=true;persist();show('馆藏神话','八级遗物与订单链完成（非种菜）。',false)}}}
      persist(); hud()} else if(!v){S.cells[i]=av;S.cells[a]=0;S.sel=null;persist()} else S.sel=i}};
function draw(){ctx.fillStyle='#0c0a09';ctx.fillRect(0,0,480,270); ctx.fillStyle='#fafaf9';ctx.font='12px sans-serif';ctx.fillText('遗物柜（非种田）',16,16);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=y*COLS+x,v=S.cells[i]; ctx.fillStyle='#292524';ctx.fillRect(OX+x*T,OY+y*T,T-6,T-6);
    if(v){ctx.fillStyle=COLORS[v-1];ctx.beginPath();ctx.arc(OX+x*T+T/2-3,OY+y*T+T/2-3,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.fillText('L'+v,OX+x*T+16,OY+y*T+30)}
    if(S.sel===i){ctx.strokeStyle='#fbbf24';ctx.strokeRect(OX+x*T,OY+y*T,T-6,T-6)}}}
function loop(){draw();requestAnimationFrame(loop)}
el('btn-start').onclick=()=>{S.cells=Array(30).fill(0);S.max=1;S.oi=0;S.odone=0;S.ended=false; for(let i=0;i<5;i++)spawn(); hud();hide()};
el('btn-continue').onclick=()=>{const d=save.load(); if(!d||d.ended){el('overlay-msg').textContent='无存档';return} Object.assign(S,d); hud();hide()};
LongplayPause.mount({title:'遗物合成',statusText:()=>`订单 ${S.oi}/7 L${S.max}`,onNewGame:()=>{save.reset();el('btn-start').click()},onClearSave:()=>save.reset(),onContinue:()=>{}});
fetch('./content/orders.json').then(r=>r.json()).then(d=>{ORD=d; const sv=save.load(); show('遗物合成','长线订单与8级合成，约30–50分钟。',!!(sv&&!sv.ended)); if(sv)Object.assign(S,sv); else {S.cells=Array(30).fill(0); for(let i=0;i<5;i++)spawn()} hud(); loop()});
