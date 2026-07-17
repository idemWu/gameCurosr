const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const spotSel = document.getElementById("spot");
const dexEl = document.getElementById("dex");
const catchEl = document.getElementById("catch");
const logEl = document.getElementById("log");

const FISH = [
  { name: "银闪鱼", spot: 0, color: "#dbeafe" },
  { name: "黄昏鳊", spot: 0, color: "#fdba74" },
  { name: "墨点鲶", spot: 0, color: "#64748b" },
  { name: "潮声鲈", spot: 1, color: "#86efac" },
  { name: "雾礁鳗", spot: 1, color: "#a5b4fc" },
  { name: "珊瑚雀", spot: 1, color: "#f9a8d4" },
  { name: "深湾皇", spot: 2, color: "#fde047" },
  { name: "夜光鱿", spot: 2, color: "#67e8f9" },
];
const SPOTS = [
  { name: "旧码头", need: 0 },
  { name: "礁石湾", need: 3 },
  { name: "灯塔外海", need: 6 },
];

const state = {
  running: false,
  caught: new Set(),
  session: 0,
  phase: "idle", // idle | cast | bite
  bar: 0,
  dir: 1,
  zone: [0.45, 0.62],
  actionBtn: null,
};

function showOverlay(t, m, l) {
  overlayTitle.textContent = t;
  overlayMsg.textContent = m;
  btnStart.textContent = l;
  overlay.classList.remove("hidden");
  state.running = false;
}

function refreshSpots() {
  const n = state.caught.size;
  spotSel.innerHTML = SPOTS.map((s, i) => {
    const locked = n < s.need;
    return `<option value="${i}" ${locked ? "disabled" : ""}>${s.name}${locked ? `（需图鉴${s.need}）` : ""}</option>`;
  }).join("");
  dexEl.textContent = String(n);
  catchEl.textContent = String(state.session);
}

function log(msg) {
  const li = document.createElement("li");
  li.textContent = msg;
  logEl.prepend(li);
}

function ensureBtn() {
  if (state.actionBtn) return state.actionBtn;
  const b = document.createElement("button");
  b.type = "button";
  b.id = "cast";
  b.textContent = "抛竿";
  document.querySelector(".hud").insertBefore(b, document.querySelector(".hint"));
  b.addEventListener("click", onAction);
  state.actionBtn = b;
  return b;
}

function onAction() {
  if (!state.running) return;
  if (state.phase === "idle") {
    state.phase = "cast";
    state.bar = 0;
    state.dir = 1;
    ensureBtn().textContent = "收杆！";
    log("抛竿入水…等待手感");
  } else if (state.phase === "cast") {
    const [a, b] = state.zone;
    if (state.bar >= a && state.bar <= b) {
      const spot = Number(spotSel.value);
      const pool = FISH.filter((f) => f.spot === spot);
      const fish = pool[Math.floor(Math.random() * pool.length)];
      const first = !state.caught.has(fish.name);
      state.caught.add(fish.name);
      state.session += 1;
      log(`${first ? "新图鉴！ " : ""}钓到 ${fish.name}`);
      refreshSpots();
      if (state.caught.size >= 8) {
        showOverlay("图鉴完成", "八种鱼都入册了，晚潮也温柔起来。", "再钓一轮");
      }
    } else {
      log("跑了…绿区再收杆");
    }
    state.phase = "idle";
    ensureBtn().textContent = "抛竿";
  }
}

function reset() {
  state.caught = new Set();
  state.session = 0;
  state.phase = "idle";
  logEl.innerHTML = "";
  refreshSpots();
  ensureBtn().textContent = "抛竿";
}

function start() {
  reset();
  overlay.classList.add("hidden");
  state.running = true;
}

function update() {
  if (!state.running || state.phase !== "cast") return;
  state.bar += 0.012 * state.dir;
  if (state.bar > 1 || state.bar < 0) {
    state.dir *= -1;
    state.bar = Math.max(0, Math.min(1, state.bar));
  }
}

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#1b3b5a");
  g.addColorStop(1, "#0b1c2c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#245a3b";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(40, 150, 120, 16);
  // water shimmer
  ctx.fillStyle = "rgba(94,196,255,.25)";
  for (let i = 0; i < 8; i += 1) ctx.fillRect(180 + i * 28, 120 + (i % 3) * 10, 18, 4);

  // timing bar
  const x = 60; const y = 220; const w = 360; const h = 18;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x, y, w, h);
  const [a, b] = state.zone;
  ctx.fillStyle = "#7ddea8";
  ctx.fillRect(x + a * w, y, (b - a) * w, h);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x + state.bar * w - 2, y - 3, 4, h + 6);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "12px sans-serif";
  ctx.fillText(state.phase === "cast" ? "绿区收杆！" : "准备抛竿", x, y - 8);

  // dex dots
  FISH.forEach((f, i) => {
    ctx.fillStyle = state.caught.has(f.name) ? f.color : "#334155";
    ctx.beginPath();
    ctx.arc(24 + i * 28, 24, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

btnStart.addEventListener("click", start);
ensureBtn();
refreshSpots();
showOverlay("晚潮钓手", "收集 8 种鱼。抛竿后在绿区收杆。解锁礁石湾与灯塔外海。", "出发");
loop();
