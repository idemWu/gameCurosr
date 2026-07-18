const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("08-sky-hop");
sfx.mountMuteButton();

const save = LongplaySave.create("08-sky-hop", 2);
const keys = new Set();
const el = (id) => document.getElementById(id);

let LEVELS = [];
let last = performance.now();
let bob = 0;

const clouds = [
  { x: 40, y: 50, s: 1, sp: 8 },
  { x: 180, y: 30, s: 0.8, sp: 12 },
  { x: 320, y: 65, s: 1.1, sp: 6 },
  { x: 420, y: 40, s: 0.7, sp: 10 },
];

const S = {
  running: false,
  li: 0,
  got: 0,
  p: { x: 20, y: 200, vx: 0, vy: 0, on: false },
  feathers: [],
  ended: false,
  deathT: 0,
  deathPending: false,
  wasOn: false,
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

function persist() {
  save.save({ li: S.li, ended: S.ended });
}

function load(i) {
  S.li = i;
  const L = LEVELS[i];
  S.got = 0;
  S.deathT = 0;
  S.deathPending = false;
  S.p = { x: 20, y: 200, vx: 0, vy: 0, on: false };
  S.wasOn = false;
  S.feathers = L.feathers.map((f) => ({ ...f, got: false }));
  el("level").textContent = String(i + 1);
  el("need").textContent = String(L.need);
  el("fe").textContent = "0";
}

function resetLevel() {
  juice.flash("rgba(125,211,252,.2)");
  load(S.li);
  sfx.fail();
}

function reachFlag() {
  juice.burst(S.p.x + 6, S.p.y, "#22c55e", 14);
  sfx.levelup();
  if (S.li >= LEVELS.length - 1) {
    S.ended = true;
    persist();
    show("云上尽头", "四十座岛都踩在脚底。", false);
  } else {
    juice.float(`第 ${S.li + 2} 关`, 240, 36, "#7dd3fc");
    load(S.li + 1);
    persist();
  }
}

function drawCloud(x, y, s) {
  D.disk(ctx, x, y, 14 * s, "rgba(255,255,255,.55)");
  D.disk(ctx, x - 12 * s, y + 4 * s, 10 * s, "rgba(255,255,255,.45)");
  D.disk(ctx, x + 12 * s, y + 3 * s, 11 * s, "rgba(255,255,255,.5)");
}

function drawFeather(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(bob * 4 + x) * 0.2);
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(6, 0, 0, 10);
  ctx.quadraticCurveTo(-6, 0, 0, -8);
  ctx.fill();
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.restore();
}

function drawFlag(x, y) {
  D.fillRoundRect(ctx, x, y - 22, 3, 26, 1, "#78716c");
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 20);
  ctx.lineTo(x + 18, y - 14);
  ctx.lineTo(x + 3, y - 8);
  ctx.closePath();
  ctx.fill();
  D.star(ctx, x + 10, y - 14, 3, "#fef08a");
}

function update(dt) {
  if (!S.running || !LEVELS.length) return;
  bob += dt;
  if (S.deathT > 0) {
    S.deathT -= dt;
    if (S.deathT <= 0 && S.deathPending) {
      S.deathPending = false;
      resetLevel();
    }
    return;
  }

  const p = S.p;
  const L = LEVELS[S.li];
  const wasOn = p.on;

  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) p.vx = -140;
  else if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) p.vx = 140;
  else p.vx *= Math.pow(0.2, dt);

  if ((keys.has("ArrowUp") || keys.has("w") || keys.has("W") || keys.has(" ")) && p.on) {
    p.vy = -200;
    p.on = false;
    sfx.ui();
  }

  p.vy += 420 * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.on = false;

  if (p.x < 0) p.x = 0;
  if (p.x > 468) p.x = 468;

  for (const pl of L.plats) {
    if (
      p.x + 12 > pl.x &&
      p.x < pl.x + pl.w &&
      p.y + 14 > pl.y &&
      p.y + 14 < pl.y + 16 &&
      p.vy >= 0
    ) {
      p.y = pl.y - 14;
      p.vy = 0;
      p.on = true;
      if (!wasOn) {
        juice.burst(p.x + 6, p.y + 14, "#d6d3d1", 6);
        sfx.tap();
      }
    }
  }
  S.wasOn = p.on;

  for (const f of S.feathers) {
    if (!f.got && Math.hypot(p.x + 6 - f.x, p.y + 6 - f.y) < 14) {
      f.got = true;
      S.got += 1;
      el("fe").textContent = String(S.got);
      juice.burst(f.x, f.y, "#fef08a", 8);
      juice.float("+1", f.x, f.y - 8, "#fde68a");
      sfx.pickup();
    }
  }

  const fl = L.flag;
  if (S.got >= L.need && Math.hypot(p.x + 6 - fl.x, p.y + 6 - (fl.y - 10)) < 22) {
    reachFlag();
    return;
  }

  if (p.y > 300) {
    S.deathT = 0.5;
    S.deathPending = true;
    juice.flash("rgba(15,23,42,.5)");
  }

  for (const c of clouds) {
    c.x += c.sp * dt;
    if (c.x > 520) c.x = -60;
  }
}

function drawPlat(pl) {
  D.fillRoundRect(ctx, pl.x, pl.y, pl.w, 12, 4, "#78716c");
  D.fillRoundRect(ctx, pl.x + 2, pl.y + 2, pl.w - 4, 4, 2, "#a8a29e");
  ctx.fillStyle = "#4ade80";
  for (let i = pl.x + 8; i < pl.x + pl.w - 4; i += 14) {
    D.disk(ctx, i, pl.y - 2, 3, "#22c55e");
  }
}

function draw() {
  if (!LEVELS.length) return;
  const L = LEVELS[S.li];
  D.softBg(ctx, 480, 270, "#7dd3fc", "#0ea5e9");

  for (const c of clouds) drawCloud(c.x, c.y, c.s);

  for (const pl of L.plats) drawPlat(pl);

  for (const f of S.feathers) {
    if (!f.got) drawFeather(f.x, f.y);
  }

  drawFlag(L.flag.x, L.flag.y);

  const p = S.p;
  ctx.globalAlpha = S.deathT > 0 ? Math.max(0, S.deathT / 0.5) : 1;
  D.person(ctx, p.x + 6, p.y + 10, "#fff7ed", "#7dd3fc");
  ctx.globalAlpha = 1;

  if (S.deathT > 0) {
    ctx.fillStyle = `rgba(15,23,42,${0.6 * (1 - S.deathT / 0.5)})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  D.vignette(ctx, 480, 270, 0.18);
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

el("btn-start").onclick = () => {
  S.ended = false;
  load(0);
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
  load(d.li || 0);
  hide();
  sfx.ui();
};

window.addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key));

LongplayPause.mount({
  title: "云上跳岛",
  statusText: () => `关卡 ${S.li + 1}/40 · 羽 ${S.got}`,
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

fetch("./content/levels.json")
  .then((r) => r.json())
  .then((d) => {
    LEVELS = d.levels;
    const sv = save.load();
    show(
      "云上跳岛",
      "四十关平台跳跃，收集羽毛抵达旗帜。约 14–24 分钟。",
      !!(sv && !sv.ended)
    );
    load(sv ? sv.li : 0);
    requestAnimationFrame(loop);
  });
