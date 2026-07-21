/**
 * Hub shared template — replace with real game logic.
 * Palette demo: forest night
 */
const PALETTE = {
  bg: "#14201c",
  ground: "#2f5d46",
  player: "#f0c987",
  star: "#7bc6a4",
  text: "#f4efe6",
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

const keys = new Set();
const state = {
  running: false,
  score: 0,
  player: { x: 40, y: 120, w: 14, h: 14, speed: 2.2 },
  stars: [],
  winAt: 5,
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function spawnStar() {
  state.stars.push({
    x: rand(20, canvas.width - 20),
    y: rand(20, canvas.height - 20),
    r: 5,
  });
}

function resetGame() {
  state.score = 0;
  state.player.x = 40;
  state.player.y = 120;
  state.stars = [];
  for (let i = 0; i < 3; i += 1) spawnStar();
  scoreEl.textContent = "0";
  statusEl.textContent = "进行中";
}

function showOverlay(title, msg, buttonLabel) {
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
  btnStart.textContent = buttonLabel;
  overlay.classList.remove("hidden");
  state.running = false;
  statusEl.textContent = "暂停";
}

function startGame() {
  resetGame();
  overlay.classList.add("hidden");
  state.running = true;
  statusEl.textContent = "进行中";
}

function update() {
  if (!state.running) return;
  const p = state.player;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) p.x -= p.speed;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) p.x += p.speed;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) p.y -= p.speed;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) p.y += p.speed;
  p.x = Math.max(0, Math.min(canvas.width - p.w, p.x));
  p.y = Math.max(0, Math.min(canvas.height - p.h, p.y));

  for (let i = state.stars.length - 1; i >= 0; i -= 1) {
    const s = state.stars[i];
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const dx = cx - s.x;
    const dy = cy - s.y;
    if (dx * dx + dy * dy < (s.r + 8) * (s.r + 8)) {
      state.stars.splice(i, 1);
      state.score += 1;
      scoreEl.textContent = String(state.score);
      spawnStar();
      if (state.score >= state.winAt) {
        showOverlay("胜利！", `收集到 ${state.winAt} 颗星。可把此模板改成真实游戏循环。`, "再来一局");
      }
    }
  }
}

function draw() {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);

  for (const s of state.stars) {
    ctx.fillStyle = PALETTE.star;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = PALETTE.player;
  ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);

  ctx.fillStyle = PALETTE.text;
  ctx.font = "12px monospace";
  ctx.fillText("TEMPLATE DEMO", 8, 16);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key));
btnStart.addEventListener("click", startGame);

showOverlay("浏览器小游戏模板", "WASD / 方向键移动，收集 5 颗星获胜。Game Agent：复制本目录后替换玩法。", "开始");
loop();
