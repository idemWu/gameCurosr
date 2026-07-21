const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
let PAINTED_BG = null; /* ART_V3_PAINTED_BG */
const juice = PolishJuice.create();
const sfx = PolishAudio.create("02-cozy-fishing");
sfx.mountMuteButton();

const save = LongplaySave.create("02-cozy-fishing", 3);
const el = (id) => document.getElementById(id);

let DATA = null;
let SPR = null;
let last = performance.now();
let waveT = 0;

const S = {
  running: false,
  caught: {},
  rare: 0,
  qi: 0,
  phase: "idle",
  bar: 0,
  dir: 1,
  zone: [0.42, 0.62],
  ended: false,
  lastFish: null,
  perfect: false,
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
function dex() {
  return Object.keys(S.caught).length;
}
function persist() {
  save.save({ caught: S.caught, rare: S.rare, qi: S.qi, ended: S.ended });
}

function questOk(q) {
  if (!q) return false;
  if (q.type === "dex") return dex() >= q.need;
  if (q.type === "rare") return S.rare >= q.need;
  // fallback for old text-based quests
  if (q.need === 8 && dex() >= 8) return true;
  if (q.text && q.text.includes("稀有") && S.rare >= 3) return true;
  if (q.need && dex() >= q.need) return true;
  if (q.text && q.text.includes("礁石") && dex() >= 5) return true;
  if (q.text && q.text.includes("沉船") && dex() >= 20) return true;
  if (q.text && q.text.includes("星落") && dex() >= 30) return true;
  return false;
}

function checkQuests() {
  while (S.qi < DATA.quests.length) {
    const q = DATA.quests[S.qi];
    if (questOk(q)) {
      S.qi += 1;
      juice.float("任务完成!", 240, 60, "#5eead4");
      sfx.levelup();
    } else break;
  }
  if (dex() >= 40 && S.qi >= DATA.quests.length) {
    S.ended = true;
    persist();
    show("晚潮入册", "四十尾海灵皆入图鉴，晚潮为你鼓掌。", false);
    sfx.levelup();
  }
}

function refreshSpots() {
  const n = dex();
  el("spot").innerHTML = DATA.spots
    .map(
      (s) =>
        `<option value="${s.id}" ${n < s.need ? "disabled" : ""}>${s.name}${
          n < s.need ? ` (需${s.need})` : ""
        }</option>`
    )
    .join("");
}

function hud() {
  el("dex").textContent = dex();
  el("rare").textContent = S.rare;
  el("qi").textContent = Math.min(DATA.quests.length, S.qi + 1);
  const q = DATA.quests[S.qi];
  el("qtext").textContent = q ? q.text : "全部任务完成";
  el("last").textContent = S.lastFish
    ? `上次：${S.lastFish}${S.perfect ? " · 完美!" : ""}`
    : "尚未上钩";
  refreshSpots();
  el("cast").textContent = S.phase === "cast" ? "收杆！" : "抛竿";
}

function cast() {
  if (!S.running) return;
  if (S.phase === "idle") {
    S.phase = "cast";
    S.bar = 0;
    S.dir = 1;
    // shrink zone slightly as dex grows for feel
    const tight = Math.min(0.08, dex() * 0.0015);
    S.zone = [0.42 + tight, 0.62 - tight];
    sfx.ui();
    hud();
    return;
  }
  const [a, b] = S.zone;
  const mid = (a + b) / 2;
  const ok = S.bar >= a && S.bar <= b;
  const perfect = Math.abs(S.bar - mid) < 0.035;
  S.phase = "idle";
  S.perfect = perfect;
  if (!ok) {
    juice.float("跑了…", 240, 150, "#fca5a5");
    juice.shake(3);
    sfx.fail();
    hud();
    return;
  }
  const spot = +el("spot").value;
  const pool = DATA.fish.filter((f) => f.spot === spot);
  let f = pool[Math.floor(Math.random() * pool.length)] || DATA.fish[0];
  if (perfect && Math.random() < 0.45) {
    const rares = pool.filter((x) => x.rare);
    if (rares.length) f = rares[Math.floor(Math.random() * rares.length)];
  }
  const isNew = !S.caught[f.id];
  if (isNew) {
    S.caught[f.id] = true;
    if (f.rare) S.rare += 1;
  } else if (f.rare && Math.random() < 0.25) {
    S.rare += 1;
  }
  S.lastFish = f.name + (f.rare ? "✦" : "");
  juice.float((isNew ? "新图鉴 · " : "") + f.name, 240, 140, f.rare ? "#fde68a" : "#67e8f9");
  juice.burst(240, 160, f.rare ? "#fbbf24" : "#5eead4", perfect ? 16 : 10);
  if (perfect) juice.flash("rgba(94,234,212,.2)");
  sfx.pickup();
  if (isNew) sfx.ok();
  checkQuests();
  hud();
  persist();
}

function update(dt) {
  waveT += dt;
  if (!S.running || S.phase !== "cast") return;
  S.bar += 0.9 * S.dir * dt;
  if (S.bar > 1 || S.bar < 0) {
    S.dir *= -1;
    S.bar = Math.max(0, Math.min(1, S.bar));
  }
}

function drawFishIcon(x, y, i, caught, rare) {
  if (!caught) {
    A.panel(ctx, x, y, 18, 14, { bg: "rgba(15,23,42,.75)", border: "rgba(255,255,255,.08)", r: 4, bw: 1 });
    return;
  }
  if (SPR?.fish) {
    const fi = i % 5;
    A.drawSprite(ctx, SPR.fish, fi * 64, 0, 64, 40, x - 2, y - 2, 22, 14);
  } else {
    D.fillRoundRect(ctx, x, y, 16, 12, 6, rare ? "#fbbf24" : "#67e8f9");
  }
  if (rare) {
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + 14, y - 1, 2, 2);
  }
}

function draw() {
  if (PAINTED_BG) { ctx.drawImage(PAINTED_BG, 0, 0, 480, 270); }
  else A.sky(ctx, 480, 270, "#071929", "#0b2a44", "#123a3a");
  A.moon(ctx, 400, 46, 14);
  A.hills(ctx, 150, 7, "#1a3d36", 0.4, 480);
  A.water(ctx, 168, 480, 70, waveT, "#2a8fb5", "#124e6b");
  if (SPR?.pier) A.drawImage(ctx, SPR.pier, 16, 188, 200, 56);
  if (SPR?.chars) {
    A.shadowEllipse(ctx, 56, 178, 10, 3);
    A.drawSprite(ctx, SPR.chars, 0, 0, 64, 96, 44, 145, 24, 36);
  }
  A.panel(ctx, 8, 8, 464, 52, { bg: "rgba(8,20,32,.72)", border: "rgba(94,234,212,.28)", r: 10, bw: 1 });
  for (let i = 0; i < 40; i++) {
    const f = DATA.fish[i];
    drawFishIcon(16 + (i % 20) * 22, 14 + Math.floor(i / 20) * 20, i, !!S.caught[f.id], f.rare);
  }
  const x = 50;
  const y = 208;
  const w = 380;
  const h = 16;
  A.panel(ctx, x - 4, y - 6, w + 8, h + 12, { bg: "rgba(0,0,0,.45)", border: "rgba(255,255,255,.1)", r: 10, bw: 1 });
  A.bar(ctx, x + S.zone[0] * w, y, (S.zone[1] - S.zone[0]) * w, h, 1, "rgba(94,234,212,.9)", "rgba(94,234,212,.9)");
  const cx = x + S.bar * w;
  D.fillRoundRect(ctx, cx - 3, y - 4, 6, h + 8, 3, "#fff");
  if (S.phase === "cast") A.text(ctx, "甜蜜区收杆！", x, y - 12, { color: "#ecfeff", font: "bold 12px sans-serif" });
  A.vignette(ctx, 480, 270, 0.35);
  A.filmGrain(ctx, 480, 270, waveT, 0.03);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  if (DATA) draw();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

el("cast").onclick = cast;
el("btn-start").onclick = () => {
  Object.assign(S, { caught: {}, rare: 0, qi: 0, ended: false, lastFish: null, phase: "idle" });
  persist();
  hud();
  hide();
  sfx.ui();
};
el("btn-continue").onclick = () => {
  const d = save.load();
  if (!d || d.ended) {
    el("overlay-msg").textContent = "无存档";
    sfx.fail();
    return;
  }
  Object.assign(S, d);
  S.phase = "idle";
  hud();
  hide();
  sfx.ui();
};

LongplayPause.mount({
  title: "晚潮钓手",
  statusText: () => `图鉴 ${dex()}/40`,
  onPause: () => { S.running = false; },
  onResume: () => {
    if (el("overlay").classList.contains("hidden")) S.running = true;
  },
  onContinue: () => {
    if (el("overlay").classList.contains("hidden")) S.running = true;
  },
  onNewGame: () => {
    save.reset();
    el("btn-start").click();
  },
  onClearSave: () => save.reset(),
});

Promise.all([
  fetch("./content/fish.json").then((r) => r.json()),
  A.loadAll({
    fish: "./art/sprites/fish.png",
    pier: "./art/sprites/pier.png",
    chars: "./art/sprites/harbor_chars.png",
  }),
]).then(([d, sprites]) => {
  DATA = d;
  SPR = sprites;
  const sv = save.load();
  show("晚潮钓手", "在甜蜜区收杆收集图鉴，完成任务线。约 15–30 分钟。", !!(sv && !sv.ended));
  if (sv) Object.assign(S, sv);
  hud();
  requestAnimationFrame(loop);
});


/* ART_V3_PAINTED_BG_LOAD */
if (typeof A !== 'undefined' && A.loadImage) {
  A.loadImage('./art/painted/bg_main.png').then((img) => { PAINTED_BG = img; }).catch(() => {});
}
