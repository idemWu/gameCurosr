const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const levelEl=document.getElementById("level"),movesEl=document.getElementById("moves");
const COLORS=["#ef4444","#3b82f6","#eab308","#a855f7"];
const COLS=4,H=4,T=40,OX=80,OY=40;
const state={running:false,level:0,cols:[],sel:null,moves:0};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){levelEl.textContent=String(state.level+1);movesEl.textContent=String(state.moves);}
function gen(lv){
  const bags=[]; for(let c=0;c<COLORS.length;c++) for(let i=0;i<H;i++) bags.push(c);
  // shuffle
  for(let i=bags.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bags[i],bags[j]]=[bags[j],bags[i]];}
  state.cols=Array.from({length:COLS},()=>[]);
  let k=0; for(let c=0;c<COLS;c++){const n=H-(c===COLS-1?H:0); /* fill all but leave one empty column sometimes */ }
  // simpler: fill first 3 columns randomly full, last empty-ish
  state.cols=[[],[],[],[]];
  for(const b of bags){
    // put into random non-full col among first 3 mostly
    let opts=state.cols.map((col,i)=>col.length<H?i:null).filter(v=>v!==null);
    if(lv<2) opts=opts.filter(i=>i<3); if(!opts.length)opts=[0,1,2,3].filter(i=>state.cols[i].length<H);
    state.cols[opts[Math.floor(Math.random()*opts.length)]].push(b);
  }
  // ensure at least one empty slot overall
  if(state.cols.every(c=>c.length===H)) state.cols[3].pop();
  state.sel=null;state.moves=0;hud();
}
function solved(){return state.cols.every(col=>col.length===0||(col.length===H&&col.every(v=>v===col[0])));}
function load(i){state.level=i;gen(i);}
function start(){load(0);overlay.classList.add("hidden");state.running=true;}
document.getElementById("reset").onclick=()=>{if(state.running)gen(state.level);};
canvas.onclick=(ev)=>{
  if(!state.running)return;
  const r=canvas.getBoundingClientRect();const x=Math.floor(((ev.clientX-r.left)*(canvas.width/r.width)-OX)/(T+24));
  if(x<0||x>=COLS)return;
  if(state.sel==null){if(state.cols[x].length)state.sel=x;return;}
  if(state.sel===x){state.sel=null;return;}
  const from=state.sel, to=x; const book=state.cols[from][state.cols[from].length-1];
  const top=state.cols[to][state.cols[to].length-1];
  if(state.cols[to].length>=H)return;
  if(state.cols[to].length&&top!==book)return;
  state.cols[from].pop(); state.cols[to].push(book); state.sel=null; state.moves++; hud();
  if(solved()){if(state.level>=7)show("书架整齐","八关整理完成，心情也整齐了。","再整理");else load(state.level+1);}
};
function draw(){
  ctx.fillStyle="#111827";ctx.fillRect(0,0,480,270);
  for(let c=0;c<COLS;c++){
    const x=OX+c*(T+24);
    ctx.fillStyle="#374151";ctx.fillRect(x,OY,T,H*T+8);
    state.cols[c].forEach((b,i)=>{ctx.fillStyle=COLORS[b];ctx.fillRect(x+4,OY+H*T- (i+1)*T +4,T-8,T-6);});
    if(state.sel===c){ctx.strokeStyle="#34d399";ctx.strokeRect(x-2,OY-2,T+4,H*T+12);}
  }
}
function loop(){draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="把同色书归到同一列，共 8 关。";show("书架整理",msg.textContent,"开始");load(0);loop();
