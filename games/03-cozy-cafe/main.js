const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const btnStart = document.getElementById("btn-start");
const goldEl = document.getElementById("gold");
const levelEl = document.getElementById("level");
const servedEl = document.getElementById("served");
const orderEl = document.getElementById("order");
const drinksEl = document.getElementById("drinks");
const upgradeBtn = document.getElementById("upgrade");

const BASE = [
  { id: "cocoa", name: "热可可", color: "#8b5a2b" },
  { id: "tea", name: "桂花茶", color: "#d9f99d" },
  { id: "soup", name: "番茄暖汤", color: "#fb7185" },
  { id: "latte", name: "燕麦拿铁", color: "#f5d0a9" },
  { id: "berry", name: "莓果气泡", color: "#e879f9" },
];
const EXTRA = { id: "honey", name: "蜂蜜奶芙", color: "#fde68a" };

const state = {
  running: false,
  gold: 0,
  level: 1,
  served: 0,
  guest: null,
  timer: 0,
  mood: 0,
};

function menu() {
  return state.level >= 2 ? BASE.concat(EXTRA) : BASE.slice();
}

function renderDrinks() {
  drinksEl.innerHTML = menu().map((d) => `<button type="button" data-id="${d.id}">${d.name}</button>`).join("");
  [...drinksEl.querySelectorAll("button")].forEach((b) => b.addEventListener("click", () => serve(b.dataset.id)));
}

function hud() {
  goldEl.textContent = String(state.gold);
  levelEl.textContent = String(state.level);
  servedEl.textContent = String(state.served);
  upgradeBtn.disabled = state.level >= 2 || state.gold < 25;
  if (state.guest) orderEl.textContent = `客人想要：${state.guest.want.name}`;
  else orderEl.textContent = "等待客人…";
}

function spawn() {
  const m = menu();
  const want = m[Math.floor(Math.random() * m.length)];
  state.guest = {
    want,
    x: 480,
    color: ["#fda4af", "#93c5fd", "#fcd34d", "#c4b5fd"][Math.floor(Math.random() * 4)],
  };
  state.timer = 0;
  hud();
}

function showOverlay(t, m, l) {
  overlayTitle.textContent = t;
  overlayMsg.textContent = m;
  btnStart.textContent = l;
  overlay.classList.remove("hidden");
  state.running = false;
}

function reset() {
  state.gold = 0;
  state.level = 1;
  state.served = 0;
  state.guest = null;
  state.mood = 0;
  renderDrinks();
  hud();
}

function start() {
  reset();
  overlay.classList.add("hidden");
  state.running = true;
  spawn();
}

function serve(id) {
  if (!state.running || !state.guest) return;
  if (id === state.guest.want.id) {
    state.gold += 5 + state.level;
    state.served += 1;
    state.mood = 30;
    state.guest = null;
    hud();
    if (state.served >= 8 && state.level >= 2) {
      showOverlay("打烊胜利", "生意兴隆！暖汤咖啡馆升级完成。", "重新开业");
      return;
    }
    setTimeout(() => { if (state.running) spawn(); }, 450);
  } else {
    state.mood = -20;
    orderEl.textContent = "不是这个啦…再看看订单";
  }
}

upgradeBtn.addEventListener("click", () => {
  if (state.level >= 2 || state.gold < 25) return;
  state.gold -= 25;
  state.level = 2;
  renderDrinks();
  hud();
});

function update() {
  if (!state.running || !state.guest) return;
  state.guest.x = Math.max(300, state.guest.x - 1.6);
  state.timer += 1;
  if (state.timer > 600) {
    state.guest = null;
    orderEl.textContent = "客人离开了…";
    setTimeout(() => { if (state.running) spawn(); }, 500);
  }
  if (state.mood !== 0) state.mood += state.mood > 0 ? -1 : 1;
}

function draw() {
  ctx.fillStyle = "#3b261f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#6b3e2e";
  ctx.fillRect(0, 180, canvas.width, 90);
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(40, 150, 200, 40);
  ctx.fillStyle = "#f5e6d3";
  ctx.fillRect(60, 120, 40, 30);
  ctx.fillRect(120, 120, 40, 30);
  // menu board
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(300, 30, 150, 100);
  ctx.fillStyle = "#fde68a";
  ctx.font = "12px sans-serif";
  ctx.fillText("今日菜单", 340, 50);
  menu().forEach((d, i) => {
    ctx.fillStyle = d.color;
    ctx.fillRect(315, 60 + i * 12, 10, 8);
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(d.name, 330, 68 + i * 12);
  });

  if (state.guest) {
    ctx.fillStyle = state.guest.color;
    ctx.fillRect(state.guest.x, 140, 28, 36);
    ctx.fillStyle = "#111827";
    ctx.fillRect(state.guest.x + 6, 148, 4, 4);
    ctx.fillRect(state.guest.x + 16, 148, 4, 4);
    ctx.fillStyle = "#fff";
    ctx.fillRect(state.guest.x - 10, 110, 90, 24);
    ctx.fillStyle = "#111";
    ctx.fillText(state.guest.want.name, state.guest.x - 4, 126);
  }
  if (state.mood > 0) {
    ctx.fillStyle = "#bbf7d0";
    ctx.font = "16px sans-serif";
    ctx.fillText("完美！", 200, 80);
  } else if (state.mood < 0) {
    ctx.fillStyle = "#fecaca";
    ctx.fillText("嗯…？", 200, 80);
  }
  ctx.fillStyle = "#fde68a";
  ctx.font = "12px sans-serif";
  ctx.fillText(`Lv.${state.level}  金币 ${state.gold}`, 16, 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

btnStart.addEventListener("click", start);
renderDrinks();
hud();
showOverlay("暖汤咖啡馆", "按订单点饮品。攒 25 金升级店铺，服务 8 人且升到 2 级即胜利。", "开门营业");
loop();
