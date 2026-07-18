const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("06-ruin-puzzle");
sfx.mountMuteButton();

const save = LongplaySave.create("06-ruin-puzzle", 2);
const T = 28;
const OX = 20;
const OY = 20;
const el = (id) => document.getElementById(id);

let LEVELS = [];
let last = performance.now();
let doorAnim = 0;

const S = {
  running: false,
  li: 0,
  grid: [],
  px: 0,
  py: 0,
  open: false,
  ended: false,
  flashT: 0,
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

function tileAt(x, y) {
  return S.grid[y] && S.grid[y][x];
}

function blocked(x, y) {
  const c = tileAt(x, y);
  if (!c || c === "#") return true;
  if (c === "P" && !S.open) return true;
  return false;
}

function doorHud() {
  const doorEl = el("door");
  doorEl.textContent = S.open ? "开启" : "关闭";
  doorEl.className = S.open ? "door-open" : "door-closed";
}

function load(i) {
  S.li = i;
  S.open = false;
  doorAnim = 0;
  S.grid = LEVELS[i].map((row) => row.split(""));
  for (let y = 0; y < S.grid.length; y++) {
    for (let x = 0; x < S.grid[y].length; x++) {
      if (S.grid[y][x] === "S") {
        S.px = x;
        S.py = y;
        S.grid[y][x] = ".";
      }
    }
  }
  el("level").textContent = String(i + 1);
  doorHud();
}

function reachExit() {
  juice.burst(OX + S.px * T + T / 2, OY + S.py * T + T / 2, "#fbbf24", 14);
  sfx.levelup();
  if (S.li >= LEVELS.length - 1) {
    S.ended = true;
    persist();
    show("石门尽开", "四十重遗迹机关皆解。", false);
  } else {
    juice.float(`第 ${S.li + 2} 关`, 240, 36, "#c4b5fd");
    load(S.li + 1);
    persist();
  }
}

function toggleDoor(x, y) {
  S.open = !S.open;
  doorAnim = 0.35;
  S.flashT = 0.2;
  const cx = OX + x * T + T / 2;
  const cy = OY + y * T + T / 2;
  juice.burst(cx, cy, S.open ? "#34d399" : "#22d3ee", 10);
  juice.float(S.open ? "石门开启" : "石门关闭", cx, cy - 8, S.open ? "#86efac" : "#67e8f9");
  sfx.ui();
  doorHud();
}

function move(dx, dy) {
  if (!S.running) return;
  const nx = S.px + dx;
  const ny = S.py + dy;
  if (blocked(nx, ny)) {
    sfx.fail();
    juice.shake(2);
    return;
  }
  S.px = nx;
  S.py = ny;
  sfx.tap();

  const cell = tileAt(nx, ny);
  if (cell === "K") toggleDoor(nx, ny);
  if (cell === "E") reachExit();
}

el("reset").onclick = () => {
  if (!S.running) return;
  load(S.li);
  sfx.ui();
};

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
  S.li = d.li || 0;
  load(S.li);
  hide();
  sfx.ui();
};

window.addEventListener("keydown", (e) => {
  const m = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    a: [-1, 0],
    d: [1, 0],
    w: [0, -1],
    s: [0, 1],
    A: [-1, 0],
    D: [1, 0],
    W: [0, -1],
    S: [0, 1],
  };
  if (m[e.key]) {
    move(...m[e.key]);
    e.preventDefault();
  }
});

function update(dt) {
  if (doorAnim > 0) doorAnim -= dt;
  if (S.flashT > 0) S.flashT -= dt;
}

function drawWall(x, y) {
  const px = OX + x * T;
  const py = OY + y * T;
  D.fillRoundRect(ctx, px + 1, py + 1, T - 2, T - 2, 4, "#374151");
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fillRect(px + 4, py + 4, T - 10, 3);
  ctx.fillRect(px + 4, py + 12, T - 10, 3);
}

function drawFloor(x, y) {
  const px = OX + x * T;
  const py = OY + y * T;
  const shade = (x + y) % 2 === 0 ? "#1f2937" : "#1a2332";
  D.fillRoundRect(ctx, px + 1, py + 1, T - 2, T - 2, 3, shade);
}

function drawKey(x, y) {
  const cx = OX + x * T + T / 2;
  const cy = OY + y * T + T / 2;
  D.disk(ctx, cx, cy, 8, "#1e3a5f");
  D.disk(ctx, cx, cy, 5, S.open ? "#34d399" : "#60a5fa");
  if (doorAnim > 0) {
    ctx.strokeStyle = `rgba(96,165,250,${doorAnim / 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + (1 - doorAnim / 0.35) * 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawDoor(x, y) {
  const px = OX + x * T + 2;
  const py = OY + y * T + 2;
  if (S.open) {
    D.fillRoundRect(ctx, px, py, T - 4, T - 4, 3, "#334155");
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, T - 12, T - 12);
  } else {
    D.fillRoundRect(ctx, px, py, T - 4, T - 4, 3, "#0e7490");
    ctx.fillStyle = "#22d3ee";
    for (let i = 0; i < 3; i++) ctx.fillRect(px + 6, py + 6 + i * 6, T - 14, 3);
  }
}

function drawExit(x, y) {
  const cx = OX + x * T + T / 2;
  const cy = OY + y * T + T / 2;
  D.star(ctx, cx, cy, 9, "#fbbf24");
  ctx.fillStyle = "rgba(251,191,36,.2)";
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawTile(c, x, y) {
  if (c === "#") drawWall(x, y);
  else {
    drawFloor(x, y);
    if (c === "K") drawKey(x, y);
    if (c === "P") drawDoor(x, y);
    if (c === "E") drawExit(x, y);
  }
}

function draw() {
  if (!S.grid.length) return;
  A.sky(ctx, 480, 270, "#1c1a24", "#1c1a24", "#0f0d14");
  const rows = S.grid.length;
  const cols = S.grid[0].length;
  const gw = cols * T;
  const gh = rows * T;
  D.fillRoundRect(ctx, OX - 6, OY - 6, gw + 12, gh + 12, 8, "rgba(15,23,42,.6)");
  D.strokeRoundRect(ctx, OX - 6, OY - 6, gw + 12, gh + 12, 8, "#4b5563", 2);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) drawTile(S.grid[y][x], x, y);
  }

  const px = OX + S.px * T + T / 2;
  const py = OY + S.py * T + T / 2 + 2;
  D.person(ctx, px, py, "#e2e8f0", "#c4b5fd");

  if (S.flashT > 0) {
    const a = 0.15 * (S.flashT / 0.2);
    ctx.fillStyle = S.open ? `rgba(52,211,153,${a})` : `rgba(34,211,238,${a})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  A.vignette(ctx, 480, 270, 0.32);
  A.filmGrain(ctx, 480, 270, performance.now()/1000, 0.025);
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

LongplayPause.mount({
  title: "石纹遗迹",
  statusText: () => `关卡 ${S.li + 1}/40 · 门${S.open ? "开" : "关"}`,
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
      "石纹遗迹",
      "四十关踩开关解谜，蓝键切换石门，抵达金色出口。约 12–22 分钟。",
      !!(sv && !sv.ended)
    );
    load(sv ? sv.li : 0);
    requestAnimationFrame(loop);
  });
