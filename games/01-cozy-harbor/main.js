const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("01-cozy-harbor");
sfx.mountMuteButton();

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const btnContinue = document.getElementById("btn-continue");
const dayEl = document.getElementById("day");
const periodEl = document.getElementById("period");
const doneEl = document.getElementById("done");
const needEl = document.getElementById("need");
const affEl = document.getElementById("aff");
const affBar = document.getElementById("affbar");
const zoneEl = document.getElementById("zone");
const questsEl = document.getElementById("quests");
const endDayBtn = document.getElementById("endday");
const travelBtn = document.getElementById("travel");

const TILE = 16;
const PERIODS = ["清晨", "正午", "黄昏", "夜晚"];
const SKY = [
  ["#9ad7f5", "#d7effc"],
  ["#5eb0e0", "#9fd4f2"],
  ["#f0a36b", "#f7d3a1"],
  ["#0f172a", "#1e293b"],
];
const save = LongplaySave.create("01-cozy-harbor", 3);
const keys = new Set();

let WORLD = null;
let last = performance.now();
let bob = 0;

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

async function loadWorld() {
  const res = await fetch("./content/world.json");
  WORLD = await res.json();
  WORLD.npcs.forEach((n) => {
    if (state.affinity[n.id] == null) state.affinity[n.id] = 0;
  });
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
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
  btnContinue.style.display = showContinue ? "block" : "none";
  overlay.classList.remove("hidden");
  state.running = false;
}

function hideOverlay() {
  overlay.classList.add("hidden");
  state.running = true;
}

function hud() {
  const qs = dayQuests();
  const finished = qs.filter((q) => state.done[q.id]).length;
  dayEl.textContent = String(state.day);
  periodEl.textContent = PERIODS[state.period];
  doneEl.textContent = String(finished);
  needEl.textContent = String(qs.length);
  affEl.textContent = String(totalAff());
  affBar.style.width = `${Math.min(100, (totalAff() / 28) * 100)}%`;
  zoneEl.textContent = WORLD.zones[state.zoneIdx].name;
  questsEl.innerHTML = qs
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
        juice.burst(px, py + 8, n.color, 8);
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
    juice.burst(240, 120, "#fbbf24", 24);
    sfx.levelup();
    showOverlay("灯火庆典", "七天待办完成，港湾灯塔点亮。你已成为这里的朋友。", false);
    return;
  }
  state.day += 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9, fx: 5, fy: 9 };
  juice.flash("rgba(125,211,252,.25)");
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
  bob += dt;
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

function drawDecor(z) {
  const t = bob;
  if (z.id === "pier") {
    D.fillRoundRect(ctx, 28, 168, 170, 18, 4, "#8b5a2b");
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "#6d4420";
      ctx.fillRect(40 + i * 28, 186, 6, 22 + Math.sin(t * 2 + i) * 2);
    }
    D.disk(ctx, 70 + Math.sin(t) * 6, 200, 4, "rgba(125,211,252,.55)");
    D.disk(ctx, 120 + Math.cos(t * 1.3) * 8, 210, 3, "rgba(125,211,252,.4)");
  }
  if (z.id === "square") {
    D.fillRoundRect(ctx, 230, 120, 90, 70, 8, "#c9846a");
    D.fillRoundRect(ctx, 248, 110, 54, 18, 6, "#a86b55");
    ctx.fillStyle = "#86efac";
    for (let i = 0; i < 5; i++) D.disk(ctx, 220 + i * 18, 200, 4, "#4ade80");
  }
  if (z.id === "hill") {
    D.fillRoundRect(ctx, 400, 40, 22, 70, 4, "#64748b");
    D.disk(ctx, 411, 34 + Math.sin(t * 3) * 1.5, 10, "#fbbf24");
    ctx.fillStyle = "rgba(251,191,36,.25)";
    ctx.beginPath();
    ctx.arc(411, 34, 22 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  if (!WORLD) return;
  const [c1, c2] = SKY[state.period];
  D.softBg(ctx, canvas.width, canvas.height, c1, c2);
  // sea / ground
  ctx.fillStyle = state.period === 3 ? "#14532d" : "#2f6f4e";
  ctx.fillRect(0, 150, canvas.width, canvas.height);
  ctx.fillStyle = state.period === 3 ? "#0c4a6e" : "#0ea5e9";
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 210, canvas.width, 60);
  ctx.globalAlpha = 1;

  const z = WORLD.zones[state.zoneIdx];
  ctx.fillStyle = "rgba(255,255,255,.08)";
  D.fillRoundRect(ctx, z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE, 6, "rgba(255,255,255,.1)");
  drawDecor(z);

  for (const n of npcsHere()) {
    const nx = n.x * TILE + TILE / 2;
    const ny = n.y * TILE + TILE / 2 + Math.sin(bob * 3 + n.x) * 1.2;
    D.person(ctx, nx, ny, n.color, "#fff7ed");
    const needs = dayQuests().some((q) => q.npc === n.id && !state.done[q.id]);
    if (needs) {
      D.disk(ctx, nx, ny - 20, 3, "#fbbf24");
      ctx.fillStyle = "#fbbf24";
      ctx.font = "10px sans-serif";
      ctx.fillText("!", nx - 2, ny - 26);
    }
  }

  const px = state.player.fx * TILE + TILE / 2;
  const py = state.player.fy * TILE + TILE / 2;
  D.person(ctx, px, py, "#fff7ed", "#38bdf8");
  D.strokeRoundRect(ctx, px - 8, py - 18, 16, 26, 6, "rgba(125,211,252,.5)", 1);

  ctx.fillStyle = state.period === 3 ? "#e2e8f0" : "#0f172a";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(`${z.name} · ${PERIODS[state.period]}`, 10, 18);

  if (state.bubble) {
    D.bubble(ctx, state.bubble.text, canvas.width / 2, canvas.height - 8, {
      bg: "rgba(15,23,42,.9)",
      fg: "#f8fafc",
    });
  }

  D.vignette(ctx, canvas.width, canvas.height, state.period === 3 ? 0.45 : 0.22);
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
    overlayMsg.textContent = "没有可继续的存档，请开始新的一周。";
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
endDayBtn.addEventListener("click", endDay);
travelBtn.addEventListener("click", travel);
btnStart.addEventListener("click", newGame);
btnContinue.addEventListener("click", continueGame);

LongplayPause.mount({
  title: "港湾日记",
  statusText: () => `第 ${state.day}/7 天 · 好感 ${totalAff()}`,
  onPause: () => { state.running = false; },
  onResume: () => {
    if (overlay.classList.contains("hidden")) state.running = true;
  },
  onContinue: () => {
    if (overlay.classList.contains("hidden")) state.running = true;
  },
  onNewGame: () => { save.reset(); newGame(); },
  onClearSave: () => save.reset(),
});

loadWorld().then(() => {
  const data = save.load();
  const canContinue = data && !data.ended;
  showOverlay(
    "港湾日记",
    "七天、三区域、八位镇民。完成每日待办推进故事，约 12–25 分钟迎来庆典。",
    canContinue
  );
  if (data) applySave(data);
  hud();
  requestAnimationFrame(loop);
});
