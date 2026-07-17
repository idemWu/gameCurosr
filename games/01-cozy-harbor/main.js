const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const doneEl = document.getElementById("done");
const talksEl = document.getElementById("talks");
const questsEl = document.getElementById("quests");

const keys = new Set();
const TILE = 16;
const quests = [
  { id: "lighthouse", text: "问候灯塔看守", done: false },
  { id: "fish", text: "帮渔铺送货", done: false },
  { id: "cafe", text: "去咖啡馆坐坐", done: false },
];

const npcs = [
  { id: "lighthouse", name: "看守阿黎", x: 28, y: 4, color: "#e8b86d", line: "灯火稳当，今日海风温柔。" },
  { id: "fish", name: "渔铺阿珍", x: 8, y: 10, color: "#7eb6ff", line: "谢谢你把箱子送到码头边！" },
  { id: "cafe", name: "店员小鹿", x: 20, y: 13, color: "#f3a6c8", line: "热汤好了，坐一会儿再走吧。" },
];

const state = {
  running: false,
  player: { x: 5, y: 8 },
  talks: 0,
  bubble: null,
};

function renderQuests() {
  questsEl.innerHTML = quests.map((q) => `<li class="${q.done ? "ok" : ""}">${q.text}</li>`).join("");
  doneEl.textContent = String(quests.filter((q) => q.done).length);
  talksEl.textContent = String(state.talks);
}

function showOverlay(title, msg, label) {
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
  btnStart.textContent = label;
  overlay.classList.remove("hidden");
  state.running = false;
}

function reset() {
  quests.forEach((q) => { q.done = false; });
  state.player = { x: 5, y: 8 };
  state.talks = 0;
  state.bubble = null;
  renderQuests();
}

function start() {
  reset();
  overlay.classList.add("hidden");
  state.running = true;
}

function tryTalk() {
  const p = state.player;
  for (const n of npcs) {
    if (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) <= 1) {
      state.talks += 1;
      state.bubble = { text: `${n.name}：${n.line}`, t: 120 };
      const q = quests.find((x) => x.id === n.id);
      if (q && !q.done) {
        q.done = true;
        renderQuests();
        if (quests.every((x) => x.done)) {
          showOverlay("日落了", "三件待办都完成啦。港湾又度过平静的一天。", "再过一天");
        }
      } else renderQuests();
      return;
    }
  }
  state.bubble = { text: "附近没有人可以交谈", t: 60 };
}

function update() {
  if (!state.running) return;
  const p = state.player;
  let dx = 0; let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
  if (dx || dy) {
    const nx = Math.max(1, Math.min(28, p.x + dx));
    const ny = Math.max(2, Math.min(14, p.y + dy));
    p.x = nx; p.y = ny;
    keys.delete("ArrowLeft"); keys.delete("ArrowRight");
    keys.delete("ArrowUp"); keys.delete("ArrowDown");
    keys.delete("a"); keys.delete("A"); keys.delete("d"); keys.delete("D");
    keys.delete("w"); keys.delete("W"); keys.delete("s"); keys.delete("S");
  }
  if (state.bubble) {
    state.bubble.t -= 1;
    if (state.bubble.t <= 0) state.bubble = null;
  }
}

function draw() {
  // sky / sea / town
  ctx.fillStyle = "#7ec8e3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#3a7ca5";
  ctx.fillRect(0, 0, canvas.width, 48);
  ctx.fillStyle = "#2f6f4e";
  ctx.fillRect(0, 48, canvas.width, canvas.height);
  ctx.fillStyle = "#d9c29a";
  for (let x = 0; x < 30; x += 1) ctx.fillRect(x * TILE, 8 * TILE, TILE, TILE);
  // pier
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(0, 9 * TILE, 10 * TILE, TILE);
  // buildings
  ctx.fillStyle = "#c9846a";
  ctx.fillRect(18 * TILE, 11 * TILE, 5 * TILE, 4 * TILE);
  ctx.fillStyle = "#f0e6d8";
  ctx.fillRect(19 * TILE, 12 * TILE, 3 * TILE, 2 * TILE);
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(27 * TILE, 2 * TILE, 2 * TILE, 5 * TILE);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(27.4 * TILE, 1.4 * TILE, 1.2 * TILE, 1.2 * TILE);

  for (const n of npcs) {
    ctx.fillStyle = n.color;
    ctx.fillRect(n.x * TILE, n.y * TILE, TILE, TILE);
  }
  ctx.fillStyle = "#fff7ed";
  ctx.fillRect(state.player.x * TILE, state.player.y * TILE, TILE, TILE);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(state.player.x * TILE + 4, state.player.y * TILE + 3, 3, 3);
  ctx.fillRect(state.player.x * TILE + 9, state.player.y * TILE + 3, 3, 3);

  if (state.bubble) {
    ctx.fillStyle = "rgba(15,23,42,.85)";
    ctx.fillRect(16, canvas.height - 36, canvas.width - 32, 28);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "12px sans-serif";
    ctx.fillText(state.bubble.text, 24, canvas.height - 16);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "e" || e.key === "E") tryTalk();
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key));
btnStart.addEventListener("click", start);
renderQuests();
showOverlay("港湾日记", "今天要在小镇办三件事：问候灯塔看守、帮渔铺送货、去咖啡馆坐坐。WASD 移动，E 交谈。", "开始今天");
loop();
