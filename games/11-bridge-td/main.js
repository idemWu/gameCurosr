const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("11-bridge-td");
sfx.mountMuteButton();

const save = LongplaySave.create("11-bridge-td", 2);
const el = (id) => document.getElementById(id);

const path = [
  { x: 0, y: 140 },
  { x: 120, y: 140 },
  { x: 120, y: 60 },
  { x: 280, y: 60 },
  { x: 280, y: 200 },
  { x: 480, y: 200 },
];
const slots = [
  { x: 90, y: 100 },
  { x: 90, y: 170 },
  { x: 160, y: 90 },
  { x: 250, y: 100 },
  { x: 250, y: 160 },
  { x: 320, y: 160 },
  { x: 200, y: 140 },
  { x: 360, y: 180 },
];

const TOWER = {
  arrow: { cost: 15, range: 75, dmg: 3, cd: 22, color: "#fbbf24" },
  ice: { cost: 25, range: 75, dmg: 2, cd: 32, color: "#67e8f9", slow: 35 },
};

let STAGES = [];
let last = performance.now();
let bob = 0;
let hover = null;
let waveBanner = null;

const S = {
  running: false,
  si: 0,
  wave: 0,
  gold: 50,
  hp: 12,
  towers: [],
  enemies: [],
  sel: "arrow",
  spawn: 0,
  active: false,
  ended: false,
};

function show(t, m, c) {
  el("overlay-title").textContent = t;
  el("overlay-msg").textContent = m;
  el("btn-continue").style.display = c ? "block" : "none";
  el("overlay").classList.remove("hidden");
  S.running = false;
}

function hide() {
  el("overlay").classList.add("hidden");
  S.running = true;
}

function persist() {
  save.save({ si: S.si, ended: S.ended });
}

function hud() {
  const st = STAGES[S.si];
  el("st").textContent = st.id;
  el("wave").textContent = S.wave;
  el("waves").textContent = st.waves;
  el("gold").textContent = S.gold;
  el("hp").textContent = S.hp;
  el("t1").classList.toggle("sel", S.sel === "arrow");
  el("t2").classList.toggle("sel", S.sel === "ice");
  el("startwave").disabled = S.active || S.wave >= st.waves;
  const t = TOWER[S.sel];
  el("tower-hint").textContent = `${S.sel === "arrow" ? "箭塔" : "冰塔"} · 射程 ${t.range} · 花费 ${t.cost}`;
}

function pathPos(t) {
  let dist = t * 22;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (dist <= seg) {
      const k = dist / seg;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    dist -= seg;
  }
  return null;
}

function enemyMaxHp() {
  return 8 + S.si + S.wave;
}

function selectTower(type) {
  S.sel = type;
  sfx.ui();
  hud();
}

function showWaveBanner(text) {
  waveBanner = { text, t: 2.2 };
}

el("t1").addEventListener("click", () => selectTower("arrow"));
el("t2").addEventListener("click", () => selectTower("ice"));

canvas.addEventListener("mousemove", (ev) => {
  if (!S.running) return;
  const r = canvas.getBoundingClientRect();
  hover = {
    x: (ev.clientX - r.left) * (canvas.width / r.width),
    y: (ev.clientY - r.top) * (canvas.height / r.height),
  };
});

canvas.addEventListener("mouseleave", () => { hover = null; });

canvas.addEventListener("click", (ev) => {
  if (!S.running) return;
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (canvas.width / r.width);
  const y = (ev.clientY - r.top) * (canvas.height / r.height);
  const slot = slots.find((s) => Math.hypot(s.x - x, s.y - y) < 18);
  if (!slot || S.towers.some((t) => t.x === slot.x && t.y === slot.y)) {
    sfx.fail();
    return;
  }
  const spec = TOWER[S.sel];
  if (S.gold < spec.cost) {
    sfx.fail();
    return;
  }
  S.gold -= spec.cost;
  S.towers.push({ ...slot, type: S.sel, cd: 0 });
  juice.burst(slot.x, slot.y, spec.color, 8);
  sfx.pickup();
  hud();
});

el("startwave").addEventListener("click", () => {
  if (!S.running || S.active) return;
  const st = STAGES[S.si];
  if (S.wave >= st.waves) return;
  S.wave += 1;
  S.active = true;
  S.spawn = 6 + S.wave + S.si;
  showWaveBanner(`第 ${S.wave} 波`);
  juice.flash("rgba(56,189,248,.12)");
  sfx.levelup();
  hud();
});

function update(dt) {
  if (!S.running) return;
  if (waveBanner) {
    waveBanner.t -= dt;
    if (waveBanner.t <= 0) waveBanner = null;
  }

  if (S.active && S.spawn > 0 && Math.random() < 0.04) {
    const maxHp = enemyMaxHp();
    S.enemies.push({ t: 0, hp: maxHp, maxHp, slow: 0 });
    S.spawn -= 1;
  }

  if (S.active && S.spawn <= 0 && !S.enemies.length) {
    S.active = false;
    S.gold += 12;
    juice.float("+12 金", 240, 40, "#fbbf24");
    const st = STAGES[S.si];
    if (S.wave >= st.waves) {
      if (S.si >= 14) {
        S.ended = true;
        persist();
        show("桥永固", "十五道防线全部守住！", false);
      } else {
        S.si += 1;
        S.wave = 0;
        S.towers = [];
        S.gold = 50 + S.si * 3;
        S.hp = 12;
        persist();
        showWaveBanner(`地图 ${S.si + 1}`);
        sfx.levelup();
      }
    }
    hud();
  }

  for (const e of S.enemies) {
    e.t += e.slow > 0 ? 0.35 : 0.75;
    if (e.slow > 0) e.slow -= 1;
    const p = pathPos(e.t);
    if (!p) {
      e.hp = 0;
      S.hp -= 1;
      juice.shake(5);
      juice.flash("rgba(239,68,68,.2)");
      sfx.hit();
      if (S.hp <= 0) {
        persist();
        show("桥破", "读档再守。", !!save.load());
      }
    }
  }
  S.enemies = S.enemies.filter((e) => e.hp > 0);

  for (const t of S.towers) {
    t.cd -= 1;
    if (t.cd > 0) continue;
    const spec = TOWER[t.type];
    let best = null;
    let bd = 1e9;
    for (const e of S.enemies) {
      const p = pathPos(e.t);
      if (!p) continue;
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      if (d < spec.range && d < bd) {
        bd = d;
        best = e;
      }
    }
    if (best) {
      best.hp -= spec.dmg;
      if (spec.slow) best.slow = spec.slow;
      t.cd = spec.cd;
      const p = pathPos(best.t);
      if (p) {
        juice.burst(p.x, p.y, spec.color, 4);
        if (best.hp <= 0) {
          S.gold += 2;
          juice.float("+2", p.x, p.y - 8, "#fde68a");
        }
      }
      sfx.tap();
    }
  }
}

function drawPath() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(30,41,59,.9)";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(148,163,184,.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  D.disk(ctx, path[0].x, path[0].y, 8, "#22c55e");
  D.disk(ctx, path[path.length - 1].x, path[path.length - 1].y, 8, "#ef4444");
  ctx.fillStyle = "#86efac";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("入口", path[0].x, path[0].y - 14);
  ctx.fillStyle = "#fca5a5";
  ctx.fillText("桥头", path[path.length - 1].x, path[path.length - 1].y + 22);
}

function drawRangePreview(x, y, range, color) {
  ctx.strokeStyle = color || "rgba(56,189,248,.35)";
  ctx.fillStyle = color ? color.replace("stroke", "fill") : "rgba(56,189,248,.08)";
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function draw() {
  D.softBg(ctx, canvas.width, canvas.height, "#0f172a", "#0c1220");
  bob += 0.015;
  drawPath();

  if (hover) {
    const slot = slots.find((s) => Math.hypot(s.x - hover.x, s.y - hover.y) < 22);
    const spec = TOWER[S.sel];
    const rx = slot ? slot.x : hover.x;
    const ry = slot ? slot.y : hover.y;
    const occupied = slot && S.towers.some((t) => t.x === slot.x && t.y === slot.y);
    const canPlace = slot && !occupied && S.gold >= spec.cost;
    drawRangePreview(rx, ry, spec.range, canPlace ? "rgba(56,189,248,.12)" : "rgba(239,68,68,.1)");
    ctx.strokeStyle = canPlace ? "rgba(56,189,248,.45)" : "rgba(148,163,184,.25)";
    ctx.lineWidth = canPlace ? 2 : 1;
    ctx.beginPath();
    ctx.arc(rx, ry, spec.range, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const s of slots) {
    const occupied = S.towers.some((t) => t.x === s.x && t.y === s.y);
    D.disk(ctx, s.x, s.y, occupied ? 5 : 9, occupied ? "#1e293b" : "#475569");
    if (!occupied) {
      ctx.strokeStyle = "rgba(148,163,184,.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (const t of S.towers) {
    const spec = TOWER[t.type];
    D.fillRoundRect(ctx, t.x - 8, t.y - 8, 16, 16, 4, spec.color);
    ctx.strokeStyle = S.sel === t.type ? "#fff" : "rgba(0,0,0,.3)";
    ctx.lineWidth = S.sel === t.type ? 2 : 1;
    ctx.strokeRect(t.x - 8, t.y - 8, 16, 16);
  }

  for (const e of S.enemies) {
    const p = pathPos(e.t);
    if (!p) continue;
    const r = 7 + Math.sin(bob * 4 + e.t) * 0.5;
    D.disk(ctx, p.x, p.y, r, e.slow > 0 ? "#93c5fd" : "#ef4444");
    const pips = Math.ceil((e.hp / e.maxHp) * 4);
    for (let i = 0; i < 4; i++) {
      D.disk(ctx, p.x - 10 + i * 7, p.y - 14, 2.5, i < pips ? "#fca5a5" : "#334155");
    }
  }

  if (waveBanner) {
    ctx.fillStyle = "rgba(15,23,42,.75)";
    D.fillRoundRect(ctx, 140, 18, 200, 36, 10, "rgba(15,23,42,.8)");
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    D.strokeRoundRect(ctx, 140, 18, 200, 36, 10, "#38bdf8", 2);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(waveBanner.text, 240, 41);
  }

  D.vignette(ctx, canvas.width, canvas.height, 0.32);
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
  juice.drawFlash(ctx, canvas.width, canvas.height);
  ctx.restore();
  requestAnimationFrame(loop);
}

el("btn-start").addEventListener("click", () => {
  Object.assign(S, {
    si: 0, wave: 0, gold: 50, hp: 12, towers: [], enemies: [], active: false, ended: false,
  });
  persist();
  hud();
  hide();
  sfx.ui();
});

el("btn-continue").addEventListener("click", () => {
  const d = save.load();
  if (!d || d.ended) {
    el("overlay-msg").textContent = "无存档";
    sfx.fail();
    return;
  }
  S.si = d.si || 0;
  S.wave = 0;
  S.towers = [];
  S.enemies = [];
  S.gold = 50 + S.si * 3;
  S.hp = 12;
  hud();
  hide();
  sfx.ui();
});

LongplayPause.mount({
  title: "桥上防线",
  statusText: () => `地图 ${S.si + 1}/15 · 波 ${S.wave}`,
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

fetch("./content/stages.json")
  .then((r) => r.json())
  .then((d) => {
    STAGES = d.stages;
    const sv = save.load();
    show("桥上防线", "15 地图塔防战役，悬停预览射程。约 20–30 分钟。", !!(sv && !sv.ended));
    if (sv) S.si = sv.si || 0;
    hud();
    requestAnimationFrame(loop);
  });
