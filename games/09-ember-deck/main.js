const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
let PAINTED_BG = null; /* ART_V3_PAINTED_BG */
const juice = PolishJuice.create();
const sfx = PolishAudio.create("09-ember-deck");
sfx.mountMuteButton();

const save = LongplaySave.create("09-ember-deck", 2);
const el = (id) => document.getElementById(id);

let CAM = null;
let last = performance.now();
let bob = 0;

const S = {
  running: false,
  ni: 0,
  hp: 30,
  maxHp: 30,
  gold: 20,
  deck: ["slash", "slash", "fire", "guard", "spark"],
  relics: [],
  energy: 3,
  maxEnergy: 3,
  ehp: 0,
  maxEhp: 0,
  phase: "map",
  hand: [],
  ended: false,
  dmgBonus: 0,
  turnBusy: false,
};

function card(id) {
  return CAM.cards.find((c) => c.id === id);
}

function node() {
  return CAM.nodes[S.ni];
}

function hasRelic(id) {
  return S.relics.includes(id);
}

function show(title, msg, canContinue) {
  el("overlay-title").textContent = title;
  el("overlay-msg").textContent = msg;
  el("btn-continue").style.display = canContinue ? "block" : "none";
  el("overlay").classList.remove("hidden");
  S.running = false;
}

function hide() {
  el("overlay").classList.add("hidden");
  S.running = true;
}

function persist() {
  save.save({
    ni: S.ni,
    hp: S.hp,
    gold: S.gold,
    deck: S.deck,
    relics: S.relics,
    ended: S.ended,
    dmgBonus: S.dmgBonus,
  });
}

function setBar(id, ratio) {
  el(id).style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}

function hud() {
  const n = node();
  el("node").textContent = String(S.ni + 1);
  el("act").textContent = n ? n.act : "-";
  el("hp").textContent = S.hp;
  el("maxhp").textContent = S.maxHp;
  el("energy").textContent = S.energy;
  el("maxenergy").textContent = S.maxEnergy;
  el("gold").textContent = S.gold;
  el("ehp").textContent = S.ehp;
  el("ntype").textContent = n ? n.name : "结束";
  setBar("hpbar", S.hp / S.maxHp);
  setBar("energybar", S.energy / S.maxEnergy);
  setBar("ehpbar", S.maxEhp ? S.ehp / S.maxEhp : 0);

  document.body.classList.toggle("in-fight", S.phase === "fight");
  el("actbtn").style.display = S.phase === "map" ? "block" : "none";
  el("endturn").disabled = S.phase !== "fight" || !S.running || S.turnBusy;

  const playable = S.hand.some((id) => card(id).cost <= S.energy);
  el("endturn").classList.toggle("danger", S.phase === "fight" && S.energy > 0 && !playable);
}

function deal() {
  S.energy = S.maxEnergy;
  S.hand = [];
  for (let i = 0; i < 5; i++) {
    S.hand.push(S.deck[Math.floor(Math.random() * S.deck.length)]);
  }
  renderHand();
  hud();
}

function renderHand() {
  const handEl = el("hand");
  handEl.innerHTML = "";
  S.hand.forEach((id, i) => {
    const c = card(id);
    const b = document.createElement("button");
    const parts = [c.name, `(${c.cost})`];
    if (c.dmg) parts.push(`-${c.dmg}`);
    if (c.heal) parts.push(`+${c.heal}`);
    b.textContent = parts.join(" ");
    if (c.heal && !c.dmg) b.classList.add("heal-card");
    b.disabled = S.phase !== "fight" || S.energy < c.cost || S.turnBusy || !S.running;
    b.onclick = () => play(i);
    handEl.appendChild(b);
  });
}

function play(i) {
  if (S.phase !== "fight" || !S.running || S.turnBusy) return;
  const id = S.hand[i];
  const c = card(id);
  if (S.energy < c.cost) {
    sfx.fail();
    return;
  }

  S.energy -= c.cost;
  S.hand.splice(i, 1);

  let dmg = (c.dmg || 0) + (hasRelic("sharp") ? 1 : 0) + S.dmgBonus;
  if (dmg) {
    S.ehp -= dmg;
    juice.float(`-${dmg}`, 340, 95, "#fca5a5");
    juice.burst(340, 95, "#fb923c", 8);
    juice.shake(3);
    sfx.hit();
  }
  if (c.heal) {
    S.hp = Math.min(S.maxHp, S.hp + c.heal);
    juice.float(`+${c.heal}`, 140, 95, "#86efac");
    sfx.pickup();
  }

  renderHand();
  hud();

  if (S.ehp <= 0) {
    winFight();
    return;
  }

  sfx.tap();
}

function enemyTurn() {
  if (S.phase !== "fight" || S.ehp <= 0) return;
  S.turnBusy = true;
  hud();
  renderHand();

  const n = node();
  const dmg = n.enemyDmg;
  S.hp -= dmg;
  juice.float(`-${dmg}`, 140, 120, "#f87171");
  juice.shake(5);
  juice.flash("rgba(239,68,68,.18)");
  sfx.hit();
  hud();

  if (S.hp <= 0) {
    S.turnBusy = false;
    persist();
    show("阵线溃散", "可继续读档至当前节点前进度。", !!save.load());
    return;
  }

  S.turnBusy = false;
  deal();
  sfx.ui();
}

function endPlayerTurn() {
  if (S.phase !== "fight" || !S.running || S.turnBusy) return;
  sfx.ui();
  enemyTurn();
}

function winFight() {
  S.gold += 10 + (hasRelic("purse") ? 8 : 0);
  S.phase = "reward";
  juice.burst(240, 130, "#fbbf24", 16);
  juice.flash("rgba(251,191,36,.2)");
  sfx.levelup();

  const pick = el("pick");
  pick.innerHTML = "<p class=\"hint\">选择一张加入牌组</p>";
  const opts = [...CAM.cards].sort(() => Math.random() - 0.5).slice(0, 3);
  opts.forEach((o) => {
    const b = document.createElement("button");
    b.textContent = o.name;
    b.onclick = () => {
      S.deck.push(o.id);
      pick.innerHTML = "";
      sfx.pickup();
      nextNode();
    };
    pick.appendChild(b);
  });
  hud();
  persist();
}

function nextNode() {
  S.ni += 1;
  if (S.ni >= CAM.nodes.length) {
    S.ended = true;
    persist();
    show("余烬长明", "三章首领尽数倒下！", false);
    return;
  }
  S.phase = "map";
  el("pick").innerHTML = "";
  hud();
  persist();
}

function enter() {
  if (!S.running) return;
  const n = node();
  if (!n) return;

  if (n.type === "shop") {
    S.phase = "shop";
    const pick = el("pick");
    pick.innerHTML = "<p class=\"hint\">暗巷商店</p>";
    const opts = [...CAM.cards].sort(() => Math.random() - 0.5).slice(0, 3);
    opts.forEach((o) => {
      const b = document.createElement("button");
      b.textContent = `买 ${o.name} (15金)`;
      b.onclick = () => {
        if (S.gold >= 15) {
          S.gold -= 15;
          S.deck.push(o.id);
          juice.float(o.name, 240, 80, "#fbbf24");
          sfx.pickup();
          hud();
          persist();
        } else sfx.fail();
      };
      pick.appendChild(b);
    });
    if (S.relics.length < CAM.relics.length) {
      const r = CAM.relics.find((x) => !S.relics.includes(x.id));
      if (r) {
        const b = document.createElement("button");
        b.textContent = `遗物 ${r.name} (25金)`;
        b.className = "secondary";
        b.onclick = () => {
          if (S.gold >= 25) {
            S.gold -= 25;
            S.relics.push(r.id);
            if (r.id === "sharp") S.dmgBonus = 1;
            juice.float(r.name, 240, 100, "#fde68a");
            sfx.levelup();
            hud();
            persist();
          } else sfx.fail();
        };
        pick.appendChild(b);
      }
    }
    const go = document.createElement("button");
    go.textContent = "离开商店";
    go.className = "secondary";
    go.onclick = () => {
      pick.innerHTML = "";
      nextNode();
    };
    pick.appendChild(go);
    sfx.ui();
  } else if (n.type === "camp") {
    const heal = 12 + (hasRelic("lantern") ? 5 : 0);
    S.hp = Math.min(S.maxHp, S.hp + heal);
    juice.float(`+${heal}`, 240, 120, "#86efac");
    juice.burst(240, 120, "#fbbf24", 10);
    sfx.pickup();
    nextNode();
  } else {
    S.phase = "fight";
    S.ehp = n.enemyHp;
    S.maxEhp = n.enemyHp;
    if (hasRelic("ember_heart")) S.hp = Math.min(S.maxHp, S.hp + 3);
    S.turnBusy = false;
    deal();
    juice.flash("rgba(251,146,60,.15)");
    sfx.ui();
  }
  hud();
}

function nodePos(i) {
  const col = i % 8;
  const row = Math.floor(i / 8);
  return { x: 34 + col * 55, y: 52 + row * 68 };
}

function draw() {
  if (PAINTED_BG) { ctx.drawImage(PAINTED_BG, 0, 0, 480, 270); }
  if (!CAM) return;
  D.softBg(ctx, canvas.width, canvas.height, "#29160f", "#1c0f0a");
  bob += 0.016;

  for (let i = 0; i < CAM.nodes.length; i++) {
    const p = nodePos(i);
    const n = CAM.nodes[i];
    const done = i < S.ni;
    const cur = i === S.ni;
    const isBoss = n.type === "boss";

    if (i > 0 && i % 8 !== 0) {
      const prev = nodePos(i - 1);
      ctx.strokeStyle = done ? "rgba(134,239,172,.35)" : "rgba(87,83,78,.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    const r = isBoss ? 14 : 11;
    const fill = done ? "#86efac" : cur ? "#fbbf24" : "#57534e";
    D.disk(ctx, p.x, p.y, r + (cur ? Math.sin(bob * 3) * 1.5 : 0), fill);
    if (cur) {
      D.strokeRoundRect(ctx, p.x - r - 3, p.y - r - 3, (r + 3) * 2, (r + 3) * 2, r + 3, "rgba(251,191,36,.6)", 2);
    }

    const icons = { fight: "⚔", shop: "店", camp: "火", boss: "首" };
    ctx.fillStyle = done || cur ? "#1c1008" : "#d6d3d1";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icons[n.type] || "?", p.x, p.y + 1);
  }

  if (S.phase === "fight") {
    D.fillRoundRect(ctx, 300, 28, 150, 130, 10, "rgba(60,20,10,.55)");
    D.strokeRoundRect(ctx, 300, 28, 150, 130, 10, "rgba(251,146,60,.4)", 1);
    D.disk(ctx, 375, 72, 22 + Math.sin(bob * 2) * 2, "#7f1d1d");
    D.disk(ctx, 375, 72, 14, "#ef4444");
    ctx.fillStyle = "#ffe8dc";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node().name.slice(-4), 375, 110);
    D.bar(ctx, 318, 118, 114, 10, S.maxEhp ? S.ehp / S.maxEhp : 0, "#3f1010", "#ef4444", "#7f1d1d");

    D.person(ctx, 130, 200, "#ffe8dc", "#fb923c");
    D.bar(ctx, 88, 168, 84, 10, S.hp / S.maxHp, "#3f1010", "#86efac", "#14532d");
    D.bar(ctx, 88, 182, 84, 8, S.energy / S.maxEnergy, "#3f1010", "#fbbf24", "#92400e");
  }

  const n = node();
  const phaseLabel = {
    map: "地图：选择节点推进",
    fight: "战斗中 · 出牌后点结束回合",
    shop: "商店",
    reward: "战利品",
  };
  ctx.fillStyle = "#ffe8dc";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(phaseLabel[S.phase] || "", 12, 252);
  if (n && S.phase === "map") {
    ctx.fillStyle = "#d4a574";
    ctx.fillText(`${n.type === "boss" ? "首领" : n.type} · ${n.name}`, 12, 266);
  }

  D.vignette(ctx, canvas.width, canvas.height, 0.28);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  draw();
  juice.draw(ctx);
  juice.drawFlash(ctx, canvas.width, canvas.height);
  ctx.restore();
  requestAnimationFrame(loop);
}

function newGame() {
  Object.assign(S, {
    ni: 0,
    hp: 30,
    maxHp: 30,
    gold: 20,
    deck: ["slash", "slash", "fire", "guard", "spark"],
    relics: [],
    energy: 3,
    maxEnergy: 3,
    ehp: 0,
    maxEhp: 0,
    phase: "map",
    hand: [],
    ended: false,
    dmgBonus: 0,
    turnBusy: false,
  });
  el("pick").innerHTML = "";
  persist();
  hud();
  hide();
  sfx.ui();
}

function continueGame() {
  const d = save.load();
  if (!d || d.ended) {
    el("overlay-msg").textContent = "无存档可继续";
    sfx.fail();
    return;
  }
  Object.assign(S, d, { phase: "map", hand: [], energy: 3, ehp: 0, maxEhp: 0, turnBusy: false });
  S.maxHp = 30;
  S.maxEnergy = 3;
  el("pick").innerHTML = "";
  hud();
  hide();
  sfx.ui();
}

el("actbtn").addEventListener("click", enter);
el("endturn").addEventListener("click", endPlayerTurn);
el("btn-start").addEventListener("click", newGame);
el("btn-continue").addEventListener("click", continueGame);

LongplayPause.mount({
  title: "余烬牌阵",
  statusText: () => `节点 ${S.ni + 1}/24 · 生命 ${S.hp}`,
  onPause: () => { S.running = false; },
  onResume: () => {
    if (el("overlay").classList.contains("hidden")) S.running = true;
  },
  onContinue: () => {
    if (el("overlay").classList.contains("hidden")) S.running = true;
  },
  onNewGame: () => { save.reset(); newGame(); },
  onClearSave: () => save.reset(),
});

fetch("./content/campaign.json")
  .then((r) => r.json())
  .then((c) => {
    CAM = c;
    const d = save.load();
    show(
      "余烬牌阵",
      "24 个战役节点，三章首领。每回合可出多张牌，结束回合后敌方反击并补牌。约 15–25 分钟。",
      !!(d && !d.ended)
    );
    if (d) Object.assign(S, d, { maxHp: 30, maxEnergy: 3, turnBusy: false });
    hud();
    requestAnimationFrame(loop);
  });


/* ART_V3_PAINTED_BG_LOAD */
if (typeof A !== 'undefined' && A.loadImage) {
  A.loadImage('./art/painted/bg_main.png').then((img) => { PAINTED_BG = img; }).catch(() => {});
}
