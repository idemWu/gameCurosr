const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("07-mine-delve");
sfx.mountMuteButton();

const save = LongplaySave.create("07-mine-delve", 2);
const T = 22;
const OX = 24;
const OY = 20;
const W = 18;
const H = 10;
const el = (id) => document.getElementById(id);

let CAM = null;
let last = performance.now();
let bob = 0;

const S = {
  running: false,
  floor: 1,
  hp: 8,
  maxHp: 8,
  oil: 100,
  maxOil: 100,
  pick: 1,
  copper: 0,
  mythril: 0,
  gold: 0,
  px: 1,
  py: 1,
  map: [],
  qi: 0,
  qprog: 0,
  qdone: 0,
  maxDepth: 1,
  oilBuys: 0,
  ended: false,
  bubble: null,
  hurtT: 0,
};

function show(t, m, c) {
  el("overlay-title").textContent = t;
  el("overlay-msg").textContent = m;
  el("btn-continue").style.display = c ? "" : "none";
  el("overlay").classList.remove("hidden");
  S.running = false;
}

function hide() {
  el("overlay").classList.add("hidden");
  S.running = true;
}

function quest() {
  return CAM.quests[S.qi] || null;
}

function hud() {
  el("floor").textContent = String(S.floor);
  el("pick").textContent = String(S.pick);
  el("hp").textContent = String(Math.ceil(S.hp));
  el("oil").textContent = String(Math.floor(S.oil));
  el("copper").textContent = String(S.copper);
  el("mythril").textContent = String(S.mythril);
  el("gold").textContent = String(S.gold);
  const q = quest();
  el("quest").textContent = q ? q.text : "全部完成";
  el("qprog").textContent = String(S.qprog);
  el("qneed").textContent = String(q ? q.amount : 0);
  el("qdone").textContent = String(S.qdone);
}

function persist() {
  save.save({ ...S, map: null });
}

function gen() {
  const m = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      if (!x || !y || x === W - 1 || y === H - 1) row.push("#");
      else {
        const r = Math.random();
        const deep = S.floor / 25;
        if (r < 0.07) row.push("C");
        else if (r < 0.1 + deep * 0.05) row.push("M");
        else if (r < 0.12 + deep * 0.03) row.push("G");
        else if (r < 0.16 + deep * 0.06) row.push("E");
        else row.push(".");
      }
    }
    m.push(row);
  }
  m[1][1] = ".";
  S.px = 1;
  S.py = 1;
  if (S.floor < 25) m[H - 2][W - 2] = "D";
  else m[H - 2][W - 2] = "B";
  if (S.floor % 5 === 0) m[2][2] = "S";
  S.map = m;
}

function tileCenter(x, y) {
  return { x: OX + x * T + T / 2, y: OY + y * T + T / 2 };
}

function completeQuest() {
  const q = quest();
  if (!q) return;
  S.qdone += 1;
  S.oil = Math.min(S.maxOil, S.oil + q.rewardOil);
  S.pick += q.rewardPick;
  S.qi += 1;
  S.qprog = 0;
  juice.burst(240, 40, "#eab308", 14);
  juice.float("任务完成", 240, 28, "#fde68a");
  sfx.levelup();
  S.bubble = { text: `完成：${q.text}`, t: 2.5 };
  if (S.qdone >= 15 && S.maxDepth >= 25) {
    S.ended = true;
    persist();
    show("矿灯长明", "任务线完成，你征服了第 25 层。", false);
  }
  hud();
}

function advanceQuest(type, n = 1) {
  const q = quest();
  if (!q || q.type !== type) return;
  S.qprog += n;
  if (S.qprog >= q.amount) completeQuest();
}

function checkDepthQuests() {
  const q = quest();
  if (!q) return;
  if (q.type === "depth" && S.floor >= q.amount) {
    S.qprog = q.amount;
    completeQuest();
  }
  if (q.type === "bossdepth" && S.floor >= q.amount) {
    S.qprog = q.amount;
    completeQuest();
  }
}

function digEffect(x, y, color, label) {
  const c = tileCenter(x, y);
  juice.burst(c.x, c.y, color, 8);
  if (label) juice.float(label, c.x, c.y - 8, color);
}

function hurt(amount) {
  S.hp -= amount;
  S.hurtT = 0.3;
  juice.shake(4);
  juice.flash("rgba(239,68,68,.3)");
  sfx.hit();
  if (S.hp <= 0) {
    persist();
    show("灯灭了", "读档或新开一趟矿灯。", !!save.load());
  }
}

function move(dx, dy) {
  if (!S.running) return;
  const nx = S.px + dx;
  const ny = S.py + dy;
  const c = S.map[ny][nx];
  if (c === "#") {
    sfx.fail();
    return;
  }

  S.px = nx;
  S.py = ny;
  S.oil -= Math.max(0.6, 1.2 - S.pick * 0.1);
  sfx.tap();

  if (c === "C") {
    S.map[ny][nx] = ".";
    S.copper += S.pick;
    digEffect(nx, ny, "#38bdf8", `+${S.pick}铜`);
    sfx.pickup();
    advanceQuest("copper", S.pick);
  }
  if (c === "M") {
    S.map[ny][nx] = ".";
    S.mythril += 1;
    digEffect(nx, ny, "#22d3ee", "+秘银");
    sfx.pickup();
    advanceQuest("mythril", 1);
  }
  if (c === "G") {
    S.map[ny][nx] = ".";
    S.gold += 2;
    digEffect(nx, ny, "#facc15", "+金");
    sfx.pickup();
  }
  if (c === "E") {
    S.map[ny][nx] = ".";
    hurt(1);
  }
  if (c === "D") {
    S.floor += 1;
    S.maxDepth = Math.max(S.maxDepth, S.floor);
    juice.flash("rgba(234,179,8,.15)");
    sfx.ui();
    checkDepthQuests();
    gen();
  }
  if (c === "B") {
    S.maxDepth = 25;
    if (S.qdone >= 15) {
      S.ended = true;
      persist();
      show("矿灯长明", "底层回响平息，你带着星辉矿石升井。", false);
    } else {
      S.bubble = { text: "还需完成更多地表任务", t: 2 };
      sfx.fail();
    }
  }

  if (S.oil <= 0) {
    S.oil = 0;
    hurt(0.2);
  }

  hud();
  persist();
}

el("up").onclick = () => {
  if (!S.running) return;
  if (S.floor > 1) {
    S.floor -= 1;
    gen();
    sfx.ui();
    hud();
    persist();
  } else {
    show(
      "矿口营地",
      `铜 ${S.copper} · 秘银 ${S.mythril} · 金 ${S.gold}。点继续返回 B1。`,
      true
    );
  }
};

el("shop").onclick = () => {
  if (!S.running) return;
  if (S.floor % 5 !== 0 && S.floor !== 1) {
    S.bubble = { text: "休息站只在第 1、5、10… 层", t: 1.8 };
    sfx.fail();
    return;
  }
  if (S.gold < 5) {
    S.bubble = { text: "金币不足（需 5）", t: 1.5 };
    sfx.fail();
    return;
  }
  S.gold -= 5;
  S.oil = Math.min(S.maxOil, S.oil + 40);
  S.oilBuys += 1;
  juice.float("油+40", 240, 60, "#fde68a");
  sfx.ok();
  advanceQuest("oil", 1);
  hud();
  persist();
};

el("btn-start").onclick = () => {
  Object.assign(S, {
    floor: 1,
    hp: 8,
    oil: 100,
    pick: 1,
    copper: 0,
    mythril: 0,
    gold: 0,
    qi: 0,
    qprog: 0,
    qdone: 0,
    maxDepth: 1,
    oilBuys: 0,
    ended: false,
    bubble: null,
    hurtT: 0,
  });
  gen();
  hud();
  persist();
  hide();
  sfx.ui();
};

el("btn-continue").onclick = () => {
  const d = save.load();
  if (!d || d.ended) {
    el("overlay-msg").textContent = "没有可继续的存档。";
    sfx.fail();
    return;
  }
  Object.assign(S, d, { bubble: null, hurtT: 0 });
  gen();
  hud();
  hide();
  sfx.ui();
};

window.addEventListener("keydown", (e) => {
  const m = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    a: [-1, 0],
    d: [1, 0],
    w: [0, -1],
    s: [0, 1],
    A: [-1, 0],
    D: [1, 0],
    W: [0, -1],
    S: [0, 1],
  };
  if (m[e.key]) {
    move(...m[e.key]);
    e.preventDefault();
  }
});

function update(dt) {
  bob += dt;
  if (S.hurtT > 0) S.hurtT -= dt;
  if (S.bubble) {
    S.bubble.t -= dt;
    if (S.bubble.t <= 0) S.bubble = null;
  }
}

function drawOre(x, y, color) {
  const cx = OX + x * T + T / 2;
  const cy = OY + y * T + T / 2;
  D.gem(ctx, cx, cy, 6, color);
}

function drawTile(c, x, y, dim) {
  const px = OX + x * T;
  const py = OY + y * T;
  ctx.globalAlpha = dim;
  if (c === "#") {
    D.fillRoundRect(ctx, px + 1, py + 1, T - 2, T - 2, 3, "#57534e");
  } else {
    D.fillRoundRect(ctx, px + 1, py + 1, T - 2, T - 2, 2, "#292524");
    if (c === "C") drawOre(x, y, "#38bdf8");
    else if (c === "M") drawOre(x, y, "#22d3ee");
    else if (c === "G") drawOre(x, y, "#facc15");
    else if (c === "E") {
      D.disk(ctx, px + T / 2, py + T / 2, 5, "#ef4444");
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(px + T / 2 - 2, py + T / 2 - 1, 4, 2);
    } else if (c === "D" || c === "B") {
      D.fillRoundRect(ctx, px + 3, py + 3, T - 6, T - 6, 3, c === "B" ? "#a855f7" : "#a3e635");
      ctx.fillStyle = "#166534";
      ctx.fillRect(px + T / 2 - 1, py + 5, 2, T - 10);
    } else if (c === "S") {
      D.fillRoundRect(ctx, px + 3, py + 3, T - 6, T - 6, 3, "#f97316");
      ctx.fillStyle = "#fff";
      ctx.font = "9px sans-serif";
      ctx.fillText("商", px + 6, py + 14);
    }
  }
  ctx.globalAlpha = 1;
}

function drawLamp() {
  const dim = Math.max(0.25, Math.min(1, S.oil / S.maxOil));
  const px = OX + S.px * T + T / 2;
  const py = OY + S.py * T + T / 2;
  const grad = ctx.createRadialGradient(px, py, 4, px, py, 70 * dim + 20);
  grad.addColorStop(0, `rgba(253,224,71,${0.35 * dim})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 270);
}

function draw() {
  D.softBg(ctx, 480, 270, "#1a1510", "#0c0a09");
  const dim = Math.max(0.3, Math.min(1, S.oil / S.maxOil));

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dist = Math.hypot(x - S.px, y - S.py);
      const tileDim = dist < 4 ? dim : Math.max(0.15, dim * 0.4);
      drawTile(S.map[y][x], x, y, tileDim);
    }
  }

  drawLamp();

  const px = OX + S.px * T + T / 2;
  const py = OY + S.py * T + T / 2 + Math.sin(bob * 3) * 0.5;
  D.person(ctx, px, py, "#fef3c7", "#eab308");
  D.disk(ctx, px + 8, py - 12, 3, `rgba(253,224,71,${dim})`);

  D.bar(ctx, 12, 8, 80, 8, S.hp / S.maxHp, "#1c1917", "#ef4444", "#44403c");
  D.bar(ctx, 100, 8, 80, 8, S.oil / S.maxOil, "#1c1917", "#eab308", "#44403c");
  ctx.fillStyle = "#f6efe4";
  ctx.font = "9px sans-serif";
  ctx.fillText("HP", 14, 6);
  ctx.fillText("油", 102, 6);
  ctx.fillText(`B${S.floor}`, 190, 14);

  if (S.hurtT > 0) {
    ctx.fillStyle = `rgba(239,68,68,${0.2 * (S.hurtT / 0.3)})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  if (S.bubble) {
    D.bubble(ctx, S.bubble.text, 240, 258, { bg: "rgba(28,25,23,.92)", fg: "#fde68a" });
  }

  D.vignette(ctx, 480, 270, 0.45);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  draw();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

LongplayPause.mount({
  title: "矿灯深途",
  statusText: () => `B${S.floor} · 任务 ${S.qdone}/15`,
  onPause: () => { S.running = false; },
  onResume: () => {
    if (el("overlay").classList.contains("hidden")) S.running = true;
  },
  onContinue: () => {
    if (el("overlay").classList.contains("hidden")) S.running = true;
  },
  onNewGame: () => { save.reset(); el("btn-start").click(); },
  onClearSave: () => save.reset(),
});

fetch("./content/campaign.json")
  .then((r) => r.json())
  .then((c) => {
    CAM = c;
    const d = save.load();
    show(
      "矿灯深途",
      "二十五层矿井与十五项任务，管理灯油与生命。约 18–28 分钟。",
      !!(d && !d.ended)
    );
    if (d) Object.assign(S, d, { bubble: null, hurtT: 0 });
    gen();
    hud();
    requestAnimationFrame(loop);
  });
