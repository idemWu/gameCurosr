const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
let PAINTED_BG = null; /* ART_V3_PAINTED_BG */
const juice = PolishJuice.create();
const sfx = PolishAudio.create("10-paw-tactics");
sfx.mountMuteButton();

const save = LongplaySave.create("10-paw-tactics", 2);
const el = (id) => document.getElementById(id);

const T = 48;
const OX = 48;
const OY = 30;
const W = 6;
const H = 4;

let STAGES = [];
let units = [];
let sel = null;
let playerTurn = true;
let last = performance.now();
let bob = 0;
let moveHighlights = [];

const S = { running: false, si: 0, ended: false };

const UNIT_COLORS = { 喵刀: "#38bdf8", 汪盾: "#60a5fa", 狐弓: "#a78bfa", 影: "#7f1d1d", 骨: "#991b1b", 鸦: "#450a0a" };

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

function setTurnUI(enemy) {
  const turnEl = el("turn");
  if (enemy) {
    turnEl.textContent = "敌方回合";
    turnEl.className = "turn-e";
  } else {
    turnEl.textContent = "我方回合";
    turnEl.className = "turn-p";
  }
}

function setup() {
  const st = STAGES[S.si];
  el("st").textContent = st.id;
  units = [
    { side: "p", x: 0, y: 1, hp: 10, maxHp: 10, atk: 3, moved: false, name: "喵刀" },
    { side: "p", x: 0, y: 2, hp: 9, maxHp: 9, atk: 2, moved: false, name: "汪盾" },
    { side: "p", x: 1, y: 1, hp: 8, maxHp: 8, atk: 4, moved: false, name: "狐弓" },
    { side: "e", x: 5, y: 1, hp: st.enemyHp, maxHp: st.enemyHp, atk: st.enemyAtk, moved: false, name: "影" },
    { side: "e", x: 5, y: 2, hp: st.enemyHp - 1, maxHp: st.enemyHp - 1, atk: st.enemyAtk, moved: false, name: "骨" },
    { side: "e", x: 4, y: 2, hp: st.enemyHp - 2, maxHp: st.enemyHp - 2, atk: st.enemyAtk + 1, moved: false, name: "鸦" },
  ];
  sel = null;
  playerTurn = true;
  moveHighlights = [];
  setTurnUI(false);
  el("info").textContent = "点选我方单位";
}

function at(x, y) {
  return units.find((u) => u.hp > 0 && u.x === x && u.y === y);
}

function unitPx(u) {
  return { x: OX + u.x * T + T / 2, y: OY + u.y * T + T / 2 };
}

function computeHighlights(u) {
  const cells = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dist = Math.abs(x - u.x) + Math.abs(y - u.y);
      if (dist !== 1) continue;
      const other = at(x, y);
      if (!other) cells.push({ x, y, type: "move" });
      else if (other.side === "e") cells.push({ x, y, type: "attack" });
    }
  }
  return cells;
}

function attack(attacker, target) {
  target.hp -= attacker.atk;
  const p = unitPx(target);
  juice.float(`-${attacker.atk}`, p.x, p.y - 10, "#fca5a5");
  juice.burst(p.x, p.y, "#ef4444", 6);
  juice.shake(4);
  sfx.hit();
  attacker.moved = true;
  sel = null;
  moveHighlights = [];

  if (!units.some((z) => z.side === "e" && z.hp > 0)) {
    juice.flash("rgba(56,189,248,.2)");
    sfx.levelup();
    if (S.si >= 19) {
      S.ended = true;
      persist();
      show("爪爪传说", "二十场战役全胜！", false);
    } else {
      S.si += 1;
      persist();
      setup();
    }
  }
}

function enemyAI() {
  playerTurn = false;
  setTurnUI(true);
  el("info").textContent = "敌方行动中…";

  for (const e of units.filter((u) => u.side === "e" && u.hp > 0)) {
    const foes = units.filter((u) => u.side === "p" && u.hp > 0);
    if (!foes.length) break;
    foes.sort((a, b) => (Math.abs(a.x - e.x) + Math.abs(a.y - e.y)) - (Math.abs(b.x - e.x) + Math.abs(b.y - e.y)));
    const t = foes[0];
    if (Math.abs(t.x - e.x) + Math.abs(t.y - e.y) === 1) {
      t.hp -= e.atk;
      const p = unitPx(t);
      juice.float(`-${e.atk}`, p.x, p.y - 10, "#f87171");
      juice.shake(3);
      sfx.hit();
    } else {
      const nx = e.x + Math.sign(t.x - e.x);
      const ny = e.y + (t.x !== e.x ? 0 : Math.sign(t.y - e.y));
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && !at(nx, ny)) {
        e.x = nx;
        e.y = ny;
      }
    }
  }

  if (!units.some((u) => u.side === "p" && u.hp > 0)) {
    persist();
    show("战败", "读档再战。", !!save.load());
    return;
  }

  units.filter((u) => u.side === "p").forEach((u) => { u.moved = false; });
  playerTurn = true;
  setTurnUI(false);
  el("info").textContent = "我方回合 · 点选单位";
  sfx.ui();
}

canvas.addEventListener("click", (ev) => {
  if (!S.running || !playerTurn) return;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(((ev.clientX - r.left) * (canvas.width / r.width) - OX) / T);
  const y = Math.floor(((ev.clientY - r.top) * (canvas.height / r.height) - OY) / T);
  if (x < 0 || y < 0 || x >= W || y >= H) return;

  const u = at(x, y);
  if (sel && sel.side === "p" && !sel.moved) {
    const hl = moveHighlights.find((c) => c.x === x && c.y === y);
    if (hl && hl.type === "attack" && u && u.side === "e") {
      attack(sel, u);
      return;
    }
    if (hl && hl.type === "move" && !u) {
      sel.x = x;
      sel.y = y;
      sel.moved = true;
      sel = null;
      moveHighlights = [];
      sfx.tap();
      el("info").textContent = "单位已行动";
      return;
    }
  }

  if (u && u.side === "p" && !u.moved) {
    sel = u;
    moveHighlights = computeHighlights(u);
    el("info").textContent = `选中 ${u.name} · HP ${u.hp}`;
    sfx.ui();
  }
});

el("end").addEventListener("click", () => {
  if (S.running && playerTurn) {
    sel = null;
    moveHighlights = [];
    enemyAI();
  }
});

function draw() {
  if (PAINTED_BG) { ctx.drawImage(PAINTED_BG, 0, 0, 480, 270); }
  else D.softBg(ctx, canvas.width, canvas.height, "#0f172a", "#111827");
  bob += 0.02;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const base = (x + y) % 2 ? "#1f2937" : "#374151";
      ctx.fillStyle = base;
      ctx.fillRect(OX + x * T, OY + y * T, T - 2, T - 2);
    }
  }

  for (const c of moveHighlights) {
    const hx = OX + c.x * T;
    const hy = OY + c.y * T;
    ctx.fillStyle = c.type === "attack" ? "rgba(239,68,68,.35)" : "rgba(56,189,248,.28)";
    ctx.fillRect(hx + 2, hy + 2, T - 6, T - 6);
  }

  if (sel) {
    const sx = OX + sel.x * T;
    const sy = OY + sel.y * T;
    D.strokeRoundRect(ctx, sx + 1, sy + 1, T - 4, T - 4, 6, "#fbbf24", 3);
  }

  for (const u of units) {
    if (u.hp <= 0) continue;
    const px = OX + u.x * T + T / 2;
    const py = OY + u.y * T + T / 2 + Math.sin(bob * 3 + u.x) * 1.2;
    const col = UNIT_COLORS[u.name] || (u.side === "p" ? "#93c5fd" : "#fca5a5");
    D.person(ctx, px, py, col, u.side === "p" ? "#e0f2fe" : "#450a0a");
    D.bar(ctx, px - 16, py - 26, 32, 5, u.hp / u.maxHp, "#1f2937", u.side === "p" ? "#38bdf8" : "#ef4444");
    ctx.fillStyle = "#f8fafc";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(u.name.slice(0, 2), px, py + 18);
  }

  const banner = playerTurn ? "我方回合" : "敌方回合";
  ctx.fillStyle = playerTurn ? "#38bdf8" : "#fca5a5";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(banner, 10, 20);

  D.vignette(ctx, canvas.width, canvas.height, 0.3);
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

el("btn-start").addEventListener("click", () => {
  S.si = 0;
  S.ended = false;
  setup();
  persist();
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
  setup();
  hide();
  sfx.ui();
});

LongplayPause.mount({
  title: "爪爪战棋",
  statusText: () => `战役 ${S.si + 1}/20`,
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
    show("爪爪战棋", "20 关战棋战役，邻格移动与攻击。约 18–28 分钟。", !!(sv && !sv.ended));
    if (sv) S.si = sv.si || 0;
    setup();
    requestAnimationFrame(loop);
  });


/* ART_V3_PAINTED_BG_LOAD */
if (typeof A !== 'undefined' && A.loadImage) {
  A.loadImage('./art/painted/bg_main.png').then((img) => { PAINTED_BG = img; }).catch(() => {});
}
