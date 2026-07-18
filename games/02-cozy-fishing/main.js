const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("02-cozy-fishing");
sfx.mountMuteButton();

const save = LongplaySave.create("02-cozy-fishing", 3);
const el = (id) => document.getElementById(id);

let DATA = null;
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

function drawFishIcon(x, y, caught, rare) {
  if (!caught) {
    D.fillRoundRect(ctx, x, y, 16, 12, 4, "#1e293b");
    return;
  }
  D.fillRoundRect(ctx, x, y, 16, 12, 6, rare ? "#fbbf24" : "#67e8f9");
  ctx.fillStyle = rare ? "#78350f" : "#0f766e";
  ctx.fillRect(x + 12, y + 3, 5, 6);
}

function draw() {
  D.softBg(ctx, 480, 270, "#082f49", "#020617");
  // moon
  D.disk(ctx, 400, 48, 18, "#e2e8f0");
  D.disk(ctx, 408, 44, 18, "#082f49");
  // waves
  for (let i = 0; i < 5; i++) {
    const y = 170 + i * 16;
    ctx.strokeStyle = `rgba(94,234,212,${0.15 + i * 0.05})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= 480; x += 8) {
      const yy = y + Math.sin(waveT * 2 + x * 0.04 + i) * 3;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  D.fillRoundRect(ctx, 0, 230, 480, 40, 0, "#134e4a");

  // dex grid
  for (let i = 0; i < 40; i++) {
    const f = DATA.fish[i];
    drawFishIcon(12 + (i % 20) * 23, 12 + Math.floor(i / 20) * 18, !!S.caught[f.id], f.rare);
  }

  // tension bar
  const x = 50;
  const y = 200;
  const w = 380;
  const h = 18;
  D.fillRoundRect(ctx, x, y, w, h, 9, "#0b1220");
  D.fillRoundRect(
    ctx,
    x + S.zone[0] * w,
    y,
    (S.zone[1] - S.zone[0]) * w,
    h,
    9,
    "rgba(94,234,212,.75)"
  );
  const cx = x + S.bar * w;
  D.fillRoundRect(ctx, cx - 3, y - 4, 6, h + 8, 3, "#fff");
  if (S.phase === "cast") {
    ctx.fillStyle = "#ecfeff";
    ctx.font = "12px sans-serif";
    ctx.fillText("甜蜜区收杆！", x, y - 10);
  }

  // pier silhouette
  D.fillRoundRect(ctx, 20, 150, 80, 10, 3, "#5b4636");
  D.person(ctx, 50, 145, "#fde68a", "#0ea5e9");
  D.vignette(ctx, 480, 270, 0.3);
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

fetch("./content/fish.json")
  .then((r) => r.json())
  .then((d) => {
    DATA = d;
    const sv = save.load();
    show("晚潮钓手", "在甜蜜区收杆收集图鉴，完成任务线。约 15–30 分钟。", !!(sv && !sv.ended));
    if (sv) Object.assign(S, sv);
    hud();
    requestAnimationFrame(loop);
  });
