const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const A = GameArt;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("01-cozy-harbor");
sfx.mountMuteButton();

const el = (id) => document.getElementById(id);
const TILE = 16;
const PERIODS = ["清晨", "正午", "黄昏", "夜晚"];
const CHAR_IDX = { player: 0, li: 1, zhen: 2, lu: 3, bo: 4, mei: 5, yun: 6, hai: 7, qing: 8 };
const CHAR_W = 64;
const CHAR_H = 96;
const DRAW_W = 22;
const DRAW_H = 33;

const save = LongplaySave.create("01-cozy-harbor", 4);
const keys = new Set();

let WORLD = null;
let SPR = null;
let last = performance.now();
let t = 0;

const state = {
  running: false,
  day: 1,
  period: 0,
  zoneIdx: 0,
  player: { x: 5, y: 9, fx: 5, fy: 9 },
  affinity: {},
  done: {},
  bubble: null,
  ended: false,
  moveCd: 0,
};

async function boot() {
  const [world, sprites] = await Promise.all([
    fetch("./content/world.json").then((r) => r.json()),
    A.loadAll({
      chars: "./art/sprites/harbor_chars.png",
      tree: "./art/sprites/tree.png",
      house: "./art/sprites/house.png",
      light: "./art/sprites/lighthouse.png",
      pier: "./art/sprites/pier.png",
    }),
  ]);
  WORLD = world;
  SPR = sprites;
  WORLD.npcs.forEach((n) => {
    if (state.affinity[n.id] == null) state.affinity[n.id] = 0;
  });

  const data = save.load();
  const canContinue = data && !data.ended;
  showOverlay(
    "港湾日记",
    "七天、三区域、八位镇民。完成每日待办，约 12–25 分钟迎来灯火庆典。",
    canContinue
  );
  if (data) applySave(data);
  hud();
  requestAnimationFrame(loop);
}

function dayQuests() {
  return WORLD.quests.filter((q) => q.day === state.day);
}
function totalAff() {
  return Object.values(state.affinity).reduce((a, b) => a + b, 0);
}
function persist() {
  save.save({
    day: state.day,
    period: state.period,
    zoneIdx: state.zoneIdx,
    player: { x: state.player.x, y: state.player.y },
    affinity: state.affinity,
    done: state.done,
    ended: state.ended,
  });
}
function applySave(data) {
  if (!data) return false;
  state.day = data.day || 1;
  state.period = data.period || 0;
  state.zoneIdx = data.zoneIdx || 0;
  const p = data.player || { x: 5, y: 9 };
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.fx = p.x;
  state.player.fy = p.y;
  state.affinity = data.affinity || {};
  state.done = data.done || {};
  state.ended = !!data.ended;
  return true;
}

function showOverlay(title, msg, showContinue) {
  el("overlay-title").textContent = title;
  el("overlay-msg").textContent = msg;
  el("btn-continue").style.display = showContinue ? "block" : "none";
  el("overlay").classList.remove("hidden");
  state.running = false;
}
function hideOverlay() {
  el("overlay").classList.add("hidden");
  state.running = true;
}

function hud() {
  const qs = dayQuests();
  const finished = qs.filter((q) => state.done[q.id]).length;
  el("day").textContent = String(state.day);
  el("period").textContent = PERIODS[state.period];
  el("done").textContent = String(finished);
  el("need").textContent = String(qs.length);
  el("aff").textContent = String(totalAff());
  el("affbar").style.width = `${Math.min(100, (totalAff() / 28) * 100)}%`;
  el("zone").textContent = WORLD.zones[state.zoneIdx].name;
  el("quests").innerHTML = qs
    .map((q) => `<li class="${state.done[q.id] ? "ok" : ""}">${q.text}</li>`)
    .join("");
}

function npcsHere() {
  const z = WORLD.zones[state.zoneIdx].id;
  return WORLD.npcs.filter((n) => n.zone === z);
}

function tryTalk() {
  if (!state.running) return;
  const p = state.player;
  for (const n of npcsHere()) {
    if (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) <= 1) {
      const qs = dayQuests().filter((q) => q.npc === n.id && !state.done[q.id]);
      const px = n.x * TILE + TILE / 2;
      const py = n.y * TILE;
      if (qs.length) {
        const q = qs[0];
        state.done[q.id] = true;
        state.affinity[n.id] = (state.affinity[n.id] || 0) + (q.affinity || 1);
        state.bubble = { text: `${n.name}：谢谢你，港湾更热闹了。`, t: 2.2 };
        state.period = Math.min(3, state.period + 1);
        juice.float(`好感+${q.affinity || 1}`, px, py, "#fde68a");
        juice.burst(px, py + 8, n.color || "#7dd3fc", 10);
        sfx.ok();
      } else {
        const lines = [
          `${n.name}：今天风很温柔。`,
          `${n.name}：记得去看看别的区域。`,
          `${n.name}：庆典一天天近了呢。`,
          `${n.name}：好感 ${state.affinity[n.id] || 0}`,
        ];
        state.bubble = { text: lines[(state.day + state.period) % lines.length], t: 1.8 };
        sfx.ui();
      }
      hud();
      persist();
      return;
    }
  }
  state.bubble = { text: "附近没有可以交谈的人", t: 1.2 };
  sfx.fail();
}

function endDay() {
  if (!state.running) return;
  const qs = dayQuests();
  if (qs.some((q) => !state.done[q.id])) {
    state.bubble = { text: "还有待办没完成，不能结束今天", t: 1.6 };
    sfx.fail();
    juice.shake(3);
    return;
  }
  if (state.day >= 7) {
    state.ended = true;
    persist();
    juice.burst(240, 120, "#fbbf24", 28);
    sfx.levelup();
    showOverlay("灯火庆典", "七天待办完成，港湾灯塔点亮。你已成为这里的朋友。", false);
    return;
  }
  state.day += 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9, fx: 5, fy: 9 };
  juice.flash("rgba(125,211,252,.22)");
  sfx.pickup();
  hud();
  persist();
  state.bubble = { text: `新的一天：第 ${state.day} 天`, t: 1.8 };
}

function travel() {
  if (!state.running) return;
  state.zoneIdx = (state.zoneIdx + 1) % WORLD.zones.length;
  const z = WORLD.zones[state.zoneIdx];
  state.player.x = z.x + 2;
  state.player.y = z.y + 2;
  state.player.fx = state.player.x;
  state.player.fy = state.player.y;
  sfx.ui();
  juice.float(z.name, 240, 40, "#7dd3fc");
  hud();
  persist();
}

function update(dt) {
  if (!state.running || !WORLD) return;
  if (state.moveCd > 0) state.moveCd -= dt;
  const p = state.player;
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
  if ((dx || dy) && state.moveCd <= 0) {
    const z = WORLD.zones[state.zoneIdx];
    const nx = Math.max(z.x, Math.min(z.x + z.w - 1, p.x + dx));
    const ny = Math.max(z.y, Math.min(z.y + z.h - 1, p.y + dy));
    if (nx !== p.x || ny !== p.y) {
      p.x = nx;
      p.y = ny;
      state.moveCd = 0.11;
      sfx.tap();
    }
  }
  p.fx += (p.x - p.fx) * Math.min(1, dt * 14);
  p.fy += (p.y - p.fy) * Math.min(1, dt * 14);
  if (state.bubble) {
    state.bubble.t -= dt;
    if (state.bubble.t <= 0) state.bubble = null;
  }
}

function drawChar(idx, x, y, bob) {
  if (!SPR?.chars) return;
  A.shadowEllipse(ctx, x, y + DRAW_H * 0.42, 8, 3);
  A.drawSprite(
    ctx,
    SPR.chars,
    idx * CHAR_W,
    0,
    CHAR_W,
    CHAR_H,
    x - DRAW_W / 2,
    y - DRAW_H / 2 + bob,
    DRAW_W,
    DRAW_H
  );
}

function drawScene() {
  const z = WORLD.zones[state.zoneIdx];
  const skies = [
    ["#9ad8ff", "#d9f0ff", "#b7e3c0"],
    ["#4aa3e0", "#87c8f2", "#6fbf8a"],
    ["#f0a05a", "#f7c98a", "#6a8f5a"],
    ["#0b1830", "#1a2744", "#163528"],
  ];
  const [top, mid, bot] = skies[state.period];
  A.sky(ctx, 480, 270, top, mid, bot);

  if (state.period < 3) {
    A.sun(ctx, state.period === 2 ? 400 : 70, state.period === 2 ? 70 : 48, state.period === 2 ? 16 : 14);
  } else {
    A.moon(ctx, 400, 46, 14);
    // stars
    ctx.fillStyle = "rgba(255,255,255,.75)";
    for (let i = 0; i < 18; i++) {
      const sx = (i * 53) % 470;
      const sy = 12 + (i * 29) % 90;
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }
  }

  // far hills
  A.hills(ctx, 130, 8, state.period === 3 ? "#1a3a2a" : "#3f8f5d", 0.2, 480);
  A.hills(ctx, 145, 6, state.period === 3 ? "#145032" : "#2f6f4e", 1.1, 480);

  // water
  A.water(
    ctx,
    188,
    480,
    82,
    t,
    state.period === 3 ? "#164e6b" : "#3aa0c8",
    state.period === 3 ? "#0b2f45" : "#1a5f86"
  );

  // sand strip
  const sand = ctx.createLinearGradient(0, 168, 0, 198);
  sand.addColorStop(0, state.period === 3 ? "#5c4a32" : "#e6d3a1");
  sand.addColorStop(1, state.period === 3 ? "#3b2f20" : "#cbb27a");
  ctx.fillStyle = sand;
  ctx.fillRect(0, 168, 480, 28);

  // zone ground plate
  A.panel(ctx, z.x * TILE - 4, z.y * TILE - 4, z.w * TILE + 8, z.h * TILE + 8, {
    bg: "rgba(255,255,255,.06)",
    border: "rgba(255,255,255,.12)",
    r: 10,
    bw: 1,
  });

  // props by zone
  if (z.id === "pier" && SPR.pier) {
    A.drawImage(ctx, SPR.pier, 24, 186, 180, 48);
    if (SPR.tree) A.drawImage(ctx, SPR.tree, 200, 120, 48, 64);
  }
  if (z.id === "square") {
    if (SPR.house) A.drawImage(ctx, SPR.house, 230, 95, 96, 84);
    if (SPR.tree) {
      A.drawImage(ctx, SPR.tree, 180, 118, 44, 60);
      A.drawImage(ctx, SPR.tree, 340, 125, 40, 56);
    }
  }
  if (z.id === "hill" && SPR.light) {
    A.drawImage(ctx, SPR.light, 390, 48, 50, 100);
    if (state.period >= 2) {
      const g = ctx.createRadialGradient(415, 58, 0, 415, 58, 70);
      g.addColorStop(0, "rgba(255,220,120,.45)");
      g.addColorStop(1, "rgba(255,220,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(415, 58, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // NPCs
  for (const n of npcsHere()) {
    const nx = n.x * TILE + TILE / 2;
    const ny = n.y * TILE + 4;
    const bob = Math.sin(t * 3 + n.x) * 1.4;
    const idx = CHAR_IDX[n.id] ?? 1;
    drawChar(idx, nx, ny, bob);
    const needs = dayQuests().some((q) => q.npc === n.id && !state.done[q.id]);
    if (needs) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(nx, ny - 22 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
      A.text(ctx, "!", nx, ny - 28 + bob, { align: "center", color: "#1a1205", font: "bold 12px sans-serif", shadow: false });
    }
  }

  // player
  const px = state.player.fx * TILE + TILE / 2;
  const py = state.player.fy * TILE + 4;
  drawChar(0, px, py, Math.sin(t * 4) * 0.8);

  // title plate
  A.panel(ctx, 8, 8, 200, 28, { bg: "rgba(10,20,32,.72)", border: "rgba(125,211,252,.35)", r: 10, bw: 1 });
  A.text(ctx, `${z.name} · ${PERIODS[state.period]}`, 18, 27, { color: "#e8f6ff", font: "bold 13px sans-serif" });

  if (state.bubble) {
    A.panel(ctx, 16, 220, 448, 40, { bg: "rgba(10,18,30,.88)", border: "rgba(246,196,83,.5)", r: 12 });
    A.text(ctx, state.bubble.text, 240, 245, { align: "center", color: "#fff8e7", font: "13px sans-serif" });
  }

  A.vignette(ctx, 480, 270, state.period === 3 ? 0.5 : 0.28);
  A.filmGrain(ctx, 480, 270, t, 0.035);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  update(dt);
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  if (WORLD && SPR) drawScene();
  else {
    A.sky(ctx, 480, 270, "#0b1830", "#1a2744", "#163528");
    A.text(ctx, "加载港湾美术资源…", 240, 135, { align: "center" });
  }
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

function newGame() {
  state.day = 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9, fx: 5, fy: 9 };
  state.affinity = {};
  WORLD.npcs.forEach((n) => { state.affinity[n.id] = 0; });
  state.done = {};
  state.ended = false;
  persist();
  hud();
  hideOverlay();
  sfx.ui();
}

function continueGame() {
  const data = save.load();
  if (!data || data.ended) {
    el("overlay-msg").textContent = "没有可继续的存档，请开始新的一周。";
    sfx.fail();
    return;
  }
  applySave(data);
  hud();
  hideOverlay();
  sfx.ui();
}

window.addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "e" || e.key === "E") tryTalk();
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key));
el("endday").addEventListener("click", endDay);
el("travel").addEventListener("click", travel);
el("btn-start").addEventListener("click", newGame);
el("btn-continue").addEventListener("click", continueGame);

LongplayPause.mount({
  title: "港湾日记",
  statusText: () => `第 ${state.day}/7 天 · 好感 ${totalAff()}`,
  onPause: () => { state.running = false; },
  onResume: () => {
    if (el("overlay").classList.contains("hidden")) state.running = true;
  },
  onContinue: () => {
    if (el("overlay").classList.contains("hidden")) state.running = true;
  },
  onNewGame: () => { save.reset(); newGame(); },
  onClearSave: () => save.reset(),
});

boot().catch((err) => {
  console.error(err);
  showOverlay("加载失败", String(err.message || err), false);
});
