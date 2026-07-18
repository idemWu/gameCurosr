const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("12-idle-stars");
sfx.mountMuteButton();

const save = LongplaySave.create("12-idle-stars", 2);
const el = (id) => document.getElementById(id);

let MILES = [];
let last = performance.now();
let acc = 0;
let bob = 0;
let frameDt = 0.016;
const ripples = [];

const S = {
  running: false,
  dust: 0,
  click: 1,
  auto: 0,
  dex: 0,
  mi: 0,
  ended: false,
  pulse: 0,
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
  save.save({
    dust: S.dust,
    click: S.click,
    auto: S.auto,
    dex: S.dex,
    mi: S.mi,
    ended: S.ended,
  });
}

function clickCost() {
  return 10 + S.click * 8;
}

function autoCost() {
  return 25 + S.auto * 15;
}

function dexCost() {
  return 50 + S.dex * 40;
}

function milestoneOk(m) {
  if (!m) return false;
  if (m.text.includes("星尘达到")) return S.dust >= m.need;
  if (m.text.includes("点击升级")) return S.click >= m.need;
  if (m.text.includes("自动产出")) return S.auto >= m.need;
  if (m.text.includes("外观")) return S.dex >= m.need;
  return false;
}

function check() {
  const m = MILES[S.mi];
  if (!m || !milestoneOk(m)) return;
  S.mi += 1;
  juice.burst(240, 135, "#fde68a", 18);
  juice.float("里程碑!", 240, 80, "#c084fc");
  juice.flash("rgba(192,132,252,.2)");
  sfx.levelup();
  if (S.mi >= MILES.length) {
    S.ended = true;
    persist();
    show("星图全亮", "十二里程碑点亮夜空。", false);
  }
  persist();
}

function refreshUpgrades() {
  const c1 = clickCost();
  const c2 = autoCost();
  const c3 = dexCost();
  el("u1").textContent = `升级点击 (${c1})`;
  el("u2").textContent = `自动星尘 (${c2})`;
  el("u3").textContent = S.dex >= 3 ? "外观已满" : `解锁外观 (${c3})`;
  el("u1").disabled = S.dust < c1;
  el("u2").disabled = S.dust < c2;
  el("u3").disabled = S.dex >= 3 || S.dust < c3;
}

function hud() {
  el("dust").textContent = Math.floor(S.dust);
  el("rate").textContent = S.auto;
  el("click").textContent = S.click;
  el("dex").textContent = S.dex;
  el("mi").textContent = Math.min(12, S.mi + 1);
  el("mt").textContent = MILES[S.mi] ? MILES[S.mi].text : "完成";
  refreshUpgrades();
}

function addRipple(x, y) {
  ripples.push({ x, y, r: 8, life: 0.6 });
}

function tapAt(x, y) {
  if (!S.running) return;
  const gain = S.click;
  S.dust += gain;
  S.pulse = 10;
  addRipple(x, y);
  juice.float(`+${gain}`, x, y - 20, "#fde68a");
  juice.burst(x, y, "#c084fc", 6);
  sfx.tap();
  check();
  hud();
  persist();
}

el("tap").addEventListener("click", () => tapAt(240, 135));

canvas.addEventListener("click", (ev) => {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (canvas.width / r.width);
  const y = (ev.clientY - r.top) * (canvas.height / r.height);
  if (Math.hypot(x - 240, y - 135) < 55) tapAt(x, y);
});

el("u1").addEventListener("click", () => {
  const c = clickCost();
  if (S.dust >= c) {
    S.dust -= c;
    S.click += 1;
    juice.float("点击+1", 240, 100, "#67e8f9");
    sfx.pickup();
    check();
    hud();
    persist();
  } else sfx.fail();
});

el("u2").addEventListener("click", () => {
  const c = autoCost();
  if (S.dust >= c) {
    S.dust -= c;
    S.auto += 1;
    juice.float("自动+1", 240, 100, "#a78bfa");
    sfx.pickup();
    check();
    hud();
    persist();
  } else sfx.fail();
});

el("u3").addEventListener("click", () => {
  if (S.dex >= 3) return;
  const c = dexCost();
  if (S.dust >= c) {
    S.dust -= c;
    S.dex += 1;
    juice.burst(240, 220, ["#fde68a", "#67e8f9", "#f9a8d4"][S.dex - 1], 12);
    sfx.levelup();
    check();
    hud();
    persist();
  } else sfx.fail();
});

function update(dt) {
  if (!S.running) return;
  acc += dt;
  if (acc >= 0.25) {
    if (S.auto > 0) {
      const gain = S.auto * acc;
      S.dust += gain;
      if (gain >= 1) juice.float(`+${Math.floor(gain)}`, 280, 150, "rgba(196,181,253,.9)");
    }
    acc = 0;
    check();
    hud();
  }
  if (S.pulse > 0) S.pulse -= dt * 12;

  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.life -= dt;
    rp.r += dt * 90;
    if (rp.life <= 0) ripples.splice(i, 1);
  }
}

function draw() {
  D.softBg(ctx, canvas.width, canvas.height, "#020617", "#1a1030");
  bob += frameDt;

  for (let i = 0; i < 40; i++) {
    const sx = (i * 97) % 480;
    const sy = (i * 53 + bob * 20) % 270;
    D.star(ctx, sx, sy, 1 + (i % 3), `rgba(255,255,255,${0.15 + (i % 5) * 0.06})`);
  }

  const coreR = 40 + S.pulse + Math.sin(bob * 2) * 3;
  const grad = ctx.createRadialGradient(240, 135, 4, 240, 135, coreR + 20);
  grad.addColorStop(0, "#f5d0fe");
  grad.addColorStop(0.5, "#c084fc");
  grad.addColorStop(1, "rgba(192,132,252,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(240, 135, coreR + 20, 0, Math.PI * 2);
  ctx.fill();

  D.disk(ctx, 240, 135, coreR, S.pulse > 0 ? "#f5d0fe" : "#c084fc");
  D.disk(ctx, 240, 135, coreR * 0.55, "rgba(255,255,255,.35)");

  for (const rp of ripples) {
    ctx.strokeStyle = `rgba(245,208,254,${rp.life * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const orbitColors = ["#fde68a", "#67e8f9", "#f9a8d4"];
  for (let i = 0; i < S.dex; i++) {
    const ang = bob * 1.2 + (i * Math.PI * 2) / 3;
    const ox = 240 + Math.cos(ang) * 72;
    const oy = 135 + Math.sin(ang) * 40;
    D.gem(ctx, ox, oy, 12, orbitColors[i]);
  }

  if (S.auto > 0) {
    ctx.fillStyle = "rgba(196,181,253,.7)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`自动 +${S.auto}/秒`, 240, 248);
  }

  D.vignette(ctx, canvas.width, canvas.height, 0.4);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frameDt = dt;
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
  Object.assign(S, { dust: 0, click: 1, auto: 0, dex: 0, mi: 0, ended: false, pulse: 0 });
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
  Object.assign(S, d);
  hud();
  hide();
  sfx.ui();
});

LongplayPause.mount({
  title: "星尘挂机",
  statusText: () => `里程碑 ${S.mi}/12 · 星尘 ${Math.floor(S.dust)}`,
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

fetch("./content/milestones.json")
  .then((r) => r.json())
  .then((d) => {
    MILES = d.milestones;
    const sv = save.load();
    show(
      "星尘挂机",
      "12 个里程碑需点击与升级推进，轻量挂机辅助。约 15–25 分钟。",
      !!(sv && !sv.ended)
    );
    if (sv) Object.assign(S, sv);
    hud();
    requestAnimationFrame(loop);
  });
