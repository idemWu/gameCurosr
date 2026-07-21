const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
let PAINTED_BG = null; /* ART_V3_PAINTED_BG */
const juice = PolishJuice.create();
const sfx = PolishAudio.create("16-forge-tap");
sfx.mountMuteButton();

const save = LongplaySave.create("16-forge-tap", 3);
const el = (id) => document.getElementById(id);

let REC = [];
let last = performance.now();
let emberT = 0;

const S = {
  running: false,
  hammer: 1,
  rec: 0,
  ended: false,
  heat: 0,
  glow: 0,
  successFlash: 0,
  sparks: [],
};

function show(title, msg, canContinue) {
  el("overlay-title").textContent = title;
  el("overlay-msg").textContent = msg;
  el("btn-continue").style.display = canContinue ? "" : "none";
  el("overlay").classList.remove("hidden");
  S.running = false;
}

function hide() {
  el("overlay").classList.add("hidden");
  S.running = true;
}

function persist() {
  save.save({ hammer: S.hammer, rec: S.rec, ended: S.ended });
}

function currentRecipe() {
  return REC[S.rec];
}

function zoneBonus() {
  return (S.hammer - 1) * 0.015;
}

function decayRate() {
  return Math.max(0.08, 0.18 - (S.hammer - 1) * 0.012);
}

function inZone() {
  const r = currentRecipe();
  if (!r) return false;
  const pad = zoneBonus();
  return S.heat >= r.zoneMin - pad && S.heat <= r.zoneMax + pad;
}

function hud() {
  const r = currentRecipe();
  el("rec").textContent = S.rec;
  el("rtotal").textContent = REC.length;
  el("hammer").textContent = S.hammer;
  el("heatpct").textContent = `${Math.round(S.heat * 100)}%`;
  el("rname").textContent = r ? r.name : "全部完成";
  el("up").textContent = `升级锤艺 (${15 + S.hammer * 10} 次成功)`;
  el("up").disabled = S.rec < S.hammer * 2;
  el("forge").textContent = r ? `锻造 ${r.name}` : "完成";
  el("forge").disabled = !r;
}

el("heat").onclick = () => {
  if (!S.running) return;
  S.heat = Math.min(1, S.heat + 0.12 + S.hammer * 0.01);
  S.glow = 0.35;
  emberT += 1;
  for (let i = 0; i < 4; i++) {
    S.sparks.push({
      x: 240 + (Math.random() - 0.5) * 40,
      y: 130 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 60,
      vy: -40 - Math.random() * 50,
      t: 0,
      life: 0.4 + Math.random() * 0.3,
    });
  }
  sfx.tap();
};

el("forge").onclick = () => {
  if (!S.running || !currentRecipe()) return;
  const r = currentRecipe();
  if (inZone()) {
    S.rec++;
    S.heat = Math.max(0, S.heat - 0.25);
    S.successFlash = 0.4;
    juice.burst(240, 120, "#fbbf24", 18);
    juice.flash("rgba(251,146,60,.28)");
    juice.float(`${r.name} 完成!`, 240, 60, "#fde68a");
    sfx.levelup();
    if (S.rec >= REC.length) {
      S.ended = true;
      persist();
      show("锻火传世", "十四道配方皆成，铁匠铺名扬港湾。", false);
    }
    persist();
    hud();
  } else {
    juice.shake(5);
    juice.float("温度不对!", 240, 80, "#fca5a5");
    S.heat = Math.max(0, S.heat - 0.08);
    sfx.fail();
    hud();
  }
};

el("up").onclick = () => {
  if (!S.running) return;
  const need = S.hammer * 2;
  if (S.rec >= need) {
    S.hammer++;
    juice.float(`锤艺 Lv${S.hammer}`, 240, 50, "#fb923c");
    juice.burst(240, 100, "#f97316", 12);
    sfx.levelup();
    persist();
    hud();
  } else {
    sfx.fail();
  }
};

function drawForge() {
  if (PAINTED_BG) { ctx.drawImage(PAINTED_BG, 0, 0, 480, 270); }
  else A.sky(ctx, 480, 270, "#21140e", "#21140e", "#0f0a06");

  // anvil
  D.fillRoundRect(ctx, 160, 168, 160, 36, 6, "#57534e");
  D.fillRoundRect(ctx, 175, 158, 130, 14, 4, "#78716c");

  // furnace body
  const heatCol = S.heat > 0.5 ? "#ef4444" : S.heat > 0.25 ? "#fb923c" : "#78350f";
  const glow = 1 + S.glow * 0.3 + Math.sin(emberT * 0.1) * 0.05;
  D.fillRoundRect(ctx, 195, 88, 90, 78, 8, heatCol);
  ctx.fillStyle = `rgba(251,146,60,${0.15 + S.heat * 0.35 + S.glow})`;
  ctx.beginPath();
  ctx.ellipse(240, 127, 50 * glow, 40 * glow, 0, 0, Math.PI * 2);
  ctx.fill();

  // heat bar on canvas
  const bx = 120;
  const by = 28;
  const bw = 240;
  const bh = 14;
  D.bar(ctx, bx, by, bw, bh, S.heat, "#1c1917", heatCol, "#57534e");
  const r = currentRecipe();
  if (r) {
    const pad = zoneBonus();
    const zMin = (r.zoneMin - pad) * bw;
    const zW = (r.zoneMax + pad - (r.zoneMin - pad)) * bw;
    ctx.fillStyle = "rgba(134,239,172,.35)";
    ctx.fillRect(bx + zMin, by, zW, bh);
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + zMin, by, zW, bh);
  }

  // sparks
  for (const sp of S.sparks) {
    const a = 1 - sp.t / sp.life;
    D.disk(ctx, sp.x, sp.y, 2 * a, `rgba(251,191,36,${a})`);
  }

  // completed recipes shelf
  ctx.fillStyle = "#fff7ed";
  ctx.font = "11px sans-serif";
  for (let i = 0; i < Math.min(S.rec, 8); i++) {
    ctx.fillText(`✓ ${REC[i].name}`, 24, 50 + i * 16);
  }
  if (S.rec > 8) {
    ctx.fillText(`…另有 ${S.rec - 8} 件`, 24, 50 + 8 * 16);
  }

  if (r) {
    ctx.fillStyle = inZone() ? "#86efac" : "#e7c6a8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`${r.name} · ${r.desc}`, 120, 58);
  }

  if (S.successFlash > 0) {
    ctx.fillStyle = `rgba(251,191,36,${S.successFlash * 0.35})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  A.vignette(ctx, 480, 270, 0.35);
  A.filmGrain(ctx, 480, 270, performance.now()/1000, 0.025);
}

function update(dt) {
  if (!S.running) return;
  S.heat = Math.max(0, S.heat - decayRate() * dt);
  if (S.glow > 0) S.glow -= dt;
  if (S.successFlash > 0) S.successFlash -= dt;
  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const sp = S.sparks[i];
    sp.t += dt;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.vy += 80 * dt;
    if (sp.t >= sp.life) S.sparks.splice(i, 1);
  }
  emberT += dt;
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  drawForge();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

el("btn-start").onclick = () => {
  Object.assign(S, {
    hammer: 1,
    rec: 0,
    ended: false,
    heat: 0,
    glow: 0,
    successFlash: 0,
    sparks: [],
  });
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
  S.heat = 0;
  S.glow = 0;
  S.sparks = [];
  hud();
  hide();
  sfx.ui();
};

LongplayPause.mount({
  title: "铁匠锻炉",
  statusText: () => `配方 ${S.rec}/${REC.length || 14}`,
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

fetch("./content/recipes.json")
  .then((r) => r.json())
  .then((d) => {
    REC = d.recipes;
    const sv = save.load();
    show(
      "铁匠锻炉",
      "十四道配方锻打。鼓风升温，炉温落入甜区时淬火锻造。约 35–50 分钟。",
      !!(sv && !sv.ended)
    );
    if (sv) Object.assign(S, sv);
    hud();
    requestAnimationFrame(loop);
  });


/* ART_V3_PAINTED_BG_LOAD */
if (typeof A !== 'undefined' && A.loadImage) {
  A.loadImage('./art/painted/bg_main.png').then((img) => { PAINTED_BG = img; }).catch(() => {});
}
