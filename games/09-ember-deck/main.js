const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),title=document.getElementById("overlay-title"),msg=document.getElementById("overlay-msg"),btn=document.getElementById("btn-start");
const waveEl=document.getElementById("wave"),hpEl=document.getElementById("hp"),ehpEl=document.getElementById("ehp"),handEl=document.getElementById("hand"),pickEl=document.getElementById("pick");
const CARDS=[{id:"slash",name:"斩击",dmg:5},{id:"fire",name:"余烬",dmg:7},{id:"guard",name:"守势",dmg:0,heal:4},{id:"pierce",name:"穿心",dmg:9}];
const state={running:false,wave:1,hp:20,ehp:12,deck:["slash","slash","fire","guard"],hand:[],picking:false};
function show(t,m,l){title.textContent=t;msg.textContent=m;btn.textContent=l;overlay.classList.remove("hidden");state.running=false;}
function hud(){waveEl.textContent=String(state.wave);hpEl.textContent=String(state.hp);ehpEl.textContent=String(state.ehp);}
function drawHand(){
  handEl.innerHTML="";
  state.hand.forEach((id,i)=>{
    const c=CARDS.find(x=>x.id===id);
    const b=document.createElement("button");b.textContent=`${c.name}`;b.onclick=()=>play(i);handEl.appendChild(b);
  });
}
function deal(){state.hand=[];for(let i=0;i<3;i++)state.hand.push(state.deck[Math.floor(Math.random()*state.deck.length)]);drawHand();hud();}
function enemyTurn(){const d=2+state.wave;state.hp-=d;hud();if(state.hp<=0)show("阵线溃散","余烬熄灭了。","再来");else deal();}
function play(i){
  if(!state.running||state.picking)return;
  const id=state.hand.splice(i,1)[0];const c=CARDS.find(x=>x.id===id);
  if(c.heal)state.hp+=c.heal; if(c.dmg)state.ehp-=c.dmg; drawHand();hud();
  if(state.ehp<=0){
    if(state.wave>=6){show("余烬长明","六场连战全胜！","再战");return;}
    state.picking=true;pickEl.innerHTML="<div>选择一张加入牌组：</div>";
    const opts=[...CARDS].sort(()=>Math.random()-0.5).slice(0,3);
    opts.forEach(o=>{const b=document.createElement("button");b.textContent=o.name;b.onclick=()=>{state.deck.push(o.id);state.picking=false;pickEl.innerHTML="";state.wave+=1;state.ehp=10+state.wave*3;deal();};pickEl.appendChild(b);});
  } else enemyTurn();
}
function reset(){state.wave=1;state.hp=20;state.ehp=12;state.deck=["slash","slash","fire","guard"];state.picking=false;pickEl.innerHTML="";deal();}
function start(){reset();overlay.classList.add("hidden");state.running=true;}
function draw(){ctx.fillStyle="#29160f";ctx.fillRect(0,0,480,270);ctx.fillStyle="#fb923c";ctx.fillRect(80,80,60,80);ctx.fillStyle="#ef4444";ctx.fillRect(320,70,70,90);ctx.fillStyle="#ffe8dc";ctx.font="14px sans-serif";ctx.fillText("你",95,175);ctx.fillText("敌",340,175);ctx.fillText(`HP ${state.hp}`,80,60);ctx.fillText(`EHP ${state.ehp}`,320,60);}
function loop(){draw();requestAnimationFrame(loop);}
btn.onclick=start;msg.textContent="用牌削减敌人生命，战后选牌强化，通关 6 场。";show("余烬牌阵",msg.textContent,"开战");deal();loop();
