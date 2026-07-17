const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const scoreEl = document.getElementById("score");
const goalEl = document.getElementById("goal");
const paletteEl = document.getElementById("palette");
const clearBtn = document.getElementById("clear");

const TILE = 30;
const OX = 60; const OY = 40;
const COLS = 12; const ROWS = 7;
const GOAL = 40;
const ITEMS = [
  { id: "bed", name: "小床", w: 2, h: 2, score: 8, color: "#93c5fd" },
  { id: "desk", name: "书桌", w: 2, h: 1, score: 5, color: "#d6b28c" },
  { id: "plant", name: "绿植", w: 1, h: 1, score: 3, color: "#86efac" },
  { id: "lamp", name: "落地灯", w: 1, h: 2, score: 4, color: "#fde68a" },
  { id: "rug", name: "地毯", w: 3, h: 2, score: 6, color: "#f9a8d4" },
  { id: "shelf", name: "书架", w: 2, h: 1, score: 5, color: "#c4b5fd" },
  { id: "chair", name: "靠窗椅", w: 1, h: 1, score: 3, color: "#fdba74" },
  { id: "cat", name: "猫窝", w: 1, h: 1, score: 4, color: "#fca5a5" },
];

const state = {
  running: false,
  selected: ITEMS[0].id,
  placed: [],
  won: false,
};

function showOverlay(t, m, l) {
  overlayTitle.textContent = t;
  overlayMsg.textContent = m;
  btnStart.textContent = l;
  overlay.classList.remove("hidden");
  state.running = false;
}

function score() {
  return state.placed.reduce((s, p) => s + p.score, 0);
}

function hud() {
  scoreEl.textContent = String(score());
  goalEl.textContent = String(GOAL);
  [...paletteEl.querySelectorAll("button")].forEach((b) => {
    b.classList.toggle("active", b.dataset.id === state.selected);
  });
}

function renderPalette() {
  paletteEl.innerHTML = ITEMS.map((it) => `<button type="button" data-id="${it.id}">${it.name} (+${it.score})</button>`).join("");
  [...paletteEl.querySelectorAll("button")].forEach((b) => {
    b.addEventListener("click", () => { state.selected = b.dataset.id; hud(); });
  });
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function cellFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const x = (e.clientX - r.left) * sx;
  const y = (e.clientY - r.top) * sy;
  const c = Math.floor((x - OX) / TILE);
  const row = Math.floor((y - OY) / TILE);
  return { c, row };
}

function reset() {
  state.placed = [];
  state.won = false;
  state.selected = ITEMS[0].id;
  hud();
}

function start() {
  reset();
  overlay.classList.add("hidden");
  state.running = true;
}

function tryWin() {
  if (!state.won && score() >= GOAL) {
    state.won = true;
    showOverlay("好温馨！", `布置分 ${score()}，小屋准备好迎客了。`, "再布置一次");
  }
}

canvas.addEventListener("click", (e) => {
  if (!state.running) return;
  const { c, row } = cellFromEvent(e);
  if (c < 0 || row < 0 || c >= COLS || row >= ROWS) return;
  const hit = state.placed.find((p) => c >= p.x && c < p.x + p.w && row >= p.y && row < p.y + p.h);
  if (hit) {
    state.placed = state.placed.filter((p) => p !== hit);
    hud();
    return;
  }
  const def = ITEMS.find((i) => i.id === state.selected);
  if (!def) return;
  if (c + def.w > COLS || row + def.h > ROWS) return;
  const next = { ...def, x: c, y: row };
  if (state.placed.some((p) => overlaps(next, p))) return;
  state.placed.push(next);
  hud();
  tryWin();
});

clearBtn.addEventListener("click", () => {
  if (!state.running) return;
  state.placed = [];
  hud();
});

function draw() {
  ctx.fillStyle = "#8fb8d8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // room floor
  ctx.fillStyle = "#e7d3b0";
  ctx.fillRect(OX, OY, COLS * TILE, ROWS * TILE);
  // window
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(OX + 3 * TILE, OY - 24, 4 * TILE, 20);
  ctx.strokeStyle = "#334155";
  ctx.strokeRect(OX + 3 * TILE, OY - 24, 4 * TILE, 20);
  // grid
  ctx.strokeStyle = "rgba(60,80,60,.25)";
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(OX + x * TILE, OY);
    ctx.lineTo(OX + x * TILE, OY + ROWS * TILE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(OX, OY + y * TILE);
    ctx.lineTo(OX + COLS * TILE, OY + y * TILE);
    ctx.stroke();
  }
  for (const p of state.placed) {
    ctx.fillStyle = p.color;
    ctx.fillRect(OX + p.x * TILE + 2, OY + p.y * TILE + 2, p.w * TILE - 4, p.h * TILE - 4);
    ctx.fillStyle = "#1f2937";
    ctx.font = "10px sans-serif";
    ctx.fillText(p.name, OX + p.x * TILE + 4, OY + p.y * TILE + 14);
  }
  ctx.fillStyle = "#14532d";
  ctx.font = "12px sans-serif";
  ctx.fillText(`目标 ${GOAL} 分`, 16, 20);
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

btnStart.addEventListener("click", start);
renderPalette();
hud();
showOverlay("窗边小屋", "选择家具点击网格放置，达到 40 分胜利。再点已放家具可移除。", "开始布置");
loop();
