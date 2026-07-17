const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
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
const zoneEl = document.getElementById("zone");
const questsEl = document.getElementById("quests");
const endDayBtn = document.getElementById("endday");
const travelBtn = document.getElementById("travel");

const TILE = 16;
const PERIODS = ["清晨", "正午", "黄昏", "夜晚"];
const save = LongplaySave.create("01-cozy-harbor", 2);
const keys = new Set();

let WORLD = null;
const state = {
  running: false,
  day: 1,
  period: 0,
  zoneIdx: 0,
  player: { x: 5, y: 9 },
  affinity: {},
  done: {},
  bubble: null,
  ended: false,
};

async function loadWorld() {
  const res = await fetch("./content/world.json");
  WORLD = await res.json();
  WORLD.npcs.forEach((n) => { if (state.affinity[n.id] == null) state.affinity[n.id] = 0; });
}

function dayQuests() {
  return WORLD.quests.filter((q) => q.day === state.day);
}

function persist() {
  save.save({
    day: state.day,
    period: state.period,
    zoneIdx: state.zoneIdx,
    player: state.player,
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
  state.player = data.player || { x: 5, y: 9 };
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
  affEl.textContent = String(Object.values(state.affinity).reduce((a, b) => a + b, 0));
  zoneEl.textContent = WORLD.zones[state.zoneIdx].name;
  questsEl.innerHTML = qs.map((q) => `<li class="${state.done[q.id] ? "ok" : ""}">${q.text}</li>`).join("");
}

function npcsHere() {
  const z = WORLD.zones[state.zoneIdx].id;
  return WORLD.npcs.filter((n) => n.zone === z);
}

function tryTalk() {
  const p = state.player;
  for (const n of npcsHere()) {
    if (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) <= 1) {
      const qs = dayQuests().filter((q) => q.npc === n.id && !state.done[q.id]);
      if (qs.length) {
        const q = qs[0];
        state.done[q.id] = true;
        state.affinity[n.id] = (state.affinity[n.id] || 0) + (q.affinity || 1);
        state.bubble = { text: `${n.name}：谢谢你，港湾因你更热闹。`, t: 140 };
      } else {
        const lines = [
          `${n.name}：今天风很温柔。`,
          `${n.name}：记得去看看别的区域。`,
          `${n.name}：庆典一天天近了呢。`,
          `${n.name}：好感 ${state.affinity[n.id] || 0}`,
        ];
        state.bubble = { text: lines[(state.day + state.period) % lines.length], t: 120 };
      }
      state.period = Math.min(3, state.period + (qs.length ? 1 : 0));
      hud();
      persist();
      return;
    }
  }
  state.bubble = { text: "附近没有可以交谈的人", t: 60 };
}

function endDay() {
  const qs = dayQuests();
  if (qs.some((q) => !state.done[q.id])) {
    state.bubble = { text: "还有待办没完成，不能结束今天", t: 100 };
    return;
  }
  if (state.day >= 7) {
    state.ended = true;
    persist();
    showOverlay("灯火庆典", "七天待办完成，港湾灯塔点亮。你已成为这里的朋友。", false);
    return;
  }
  state.day += 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9 };
  hud();
  persist();
  state.bubble = { text: `新的一天：第 ${state.day} 天`, t: 100 };
}

function travel() {
  state.zoneIdx = (state.zoneIdx + 1) % WORLD.zones.length;
  const z = WORLD.zones[state.zoneIdx];
  state.player = { x: z.x + 2, y: z.y + 2 };
  hud();
  persist();
}

function update() {
  if (!state.running || !WORLD) return;
  const p = state.player;
  let dx = 0; let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
  if (dx || dy) {
    const z = WORLD.zones[state.zoneIdx];
    p.x = Math.max(z.x, Math.min(z.x + z.w - 1, p.x + dx));
    p.y = Math.max(z.y, Math.min(z.y + z.h - 1, p.y + dy));
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S"].forEach((k) => keys.delete(k));
  }
  if (state.bubble) {
    state.bubble.t -= 1;
    if (state.bubble.t <= 0) state.bubble = null;
  }
}

function draw() {
  if (!WORLD) return;
  const sky = ["#7ec8e3", "#5aa4d6", "#f0a36b", "#1e293b"][state.period];
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f6f4e";
  ctx.fillRect(0, 48, canvas.width, canvas.height);
  const z = WORLD.zones[state.zoneIdx];
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
  if (z.id === "pier") {
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(2 * TILE, 10 * TILE, 10 * TILE, TILE);
  }
  if (z.id === "square") {
    ctx.fillStyle = "#c9846a";
    ctx.fillRect(15 * TILE, 8 * TILE, 5 * TILE, 4 * TILE);
  }
  if (z.id === "hill") {
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(26 * TILE, 2 * TILE, 2 * TILE, 5 * TILE);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(26.3 * TILE, 1.3 * TILE, 1.4 * TILE, 1.4 * TILE);
  }
  for (const n of npcsHere()) {
    ctx.fillStyle = n.color;
    ctx.fillRect(n.x * TILE, n.y * TILE, TILE, TILE);
  }
  ctx.fillStyle = "#fff7ed";
  ctx.fillRect(state.player.x * TILE, state.player.y * TILE, TILE, TILE);
  ctx.fillStyle = "#0f172a";
  ctx.font = "12px sans-serif";
  ctx.fillText(`${z.name} · ${PERIODS[state.period]}`, 8, 16);
  if (state.bubble) {
    ctx.fillStyle = "rgba(15,23,42,.88)";
    ctx.fillRect(12, canvas.height - 40, canvas.width - 24, 32);
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(state.bubble.text, 20, canvas.height - 18);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function newGame() {
  state.day = 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9 };
  state.affinity = {};
  WORLD.npcs.forEach((n) => { state.affinity[n.id] = 0; });
  state.done = {};
  state.ended = false;
  persist();
  hud();
  hideOverlay();
}

function continueGame() {
  const data = save.load();
  if (!data || data.ended) {
    overlayMsg.textContent = "没有可继续的存档，请开始新的一周。";
    return;
  }
  applySave(data);
  hud();
  hideOverlay();
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
  statusText: () => `第 ${state.day}/7 天 · 好感 ${Object.values(state.affinity).reduce((a, b) => a + b, 0)}`,
  onContinue: () => {},
  onNewGame: () => { save.reset(); newGame(); },
  onClearSave: () => save.reset(),
});

loadWorld().then(() => {
  const data = save.load();
  const canContinue = data && !data.ended;
  showOverlay(
    "港湾日记",
    "七天、三区域、八位镇民。完成每日待办推进故事，约 30–45 分钟迎来庆典。",
    canContinue
  );
  if (data) applySave(data);
  hud();
  loop();
});
