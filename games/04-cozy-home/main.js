const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("04-cozy-home");
sfx.mountMuteButton();

const save = LongplaySave.create("04-cozy-home", 3);
const TILE = 30;
const OX = 60;
const OY = 40;
const el = (id) => document.getElementById(id);

let DATA = null;
let last = performance.now();
let hover = null;

const S = {
  running: false,
  ci: 0,
  placed: [],
  selected: null,
  ended: false,
  roomsUnlocked: 1,
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
function comm() {
  return DATA.commissions[S.ci];
}
function score() {
  return S.placed.reduce((a, p) => a + p.score, 0);
}
function persist() {
  save.save({ ci: S.ci, ended: S.ended, roomsUnlocked: S.roomsUnlocked, placed: S.placed });
}

function hud() {
  const c = comm();
  el("ci").textContent = c.id;
  el("ctitle").textContent = c.title;
  el("score").textContent = score();
  el("goal").textContent = c.goal;
  el("room").textContent = ["卧室", "客厅", "阁楼"][c.room] || c.room;
  el("palette").innerHTML = DATA.items
    .map(
      (it) =>
        `<button data-id="${it.id}" class="${S.selected === it.id ? "" : "secondary"}">${it.name}</button>`
    )
    .join("");
  [...el("palette").querySelectorAll("button")].forEach((b) => {
    b.onclick = () => {
      S.selected = b.dataset.id;
      sfx.ui();
      hud();
    };
  });
  el("submit").disabled = score() < c.goal;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function cellFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) * (canvas.width / r.width) - OX) / TILE);
  const y = Math.floor(((e.clientY - r.top) * (canvas.height / r.height) - OY) / TILE);
  return { x, y };
}

canvas.onmousemove = (e) => {
  hover = cellFromEvent(e);
};
canvas.onmouseleave = () => {
  hover = null;
};

canvas.onclick = (e) => {
  if (!S.running) return;
  const { x, y } = cellFromEvent(e);
  if (x < 0 || y < 0 || x >= DATA.cols || y >= DATA.rows) return;
  const hit = S.placed.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  if (hit) {
    S.placed = S.placed.filter((p) => p !== hit);
    juice.float("移除", OX + hit.x * TILE + 20, OY + hit.y * TILE, "#fda4af");
    sfx.ui();
    hud();
    persist();
    return;
  }
  const def = DATA.items.find((i) => i.id === S.selected);
  if (!def) {
    sfx.fail();
    return;
  }
  if (x + def.w > DATA.cols || y + def.h > DATA.rows) {
    juice.shake(2);
    sfx.fail();
    return;
  }
  const next = { ...def, x, y };
  if (S.placed.some((p) => overlaps(next, p))) {
    juice.float("重叠", OX + x * TILE, OY + y * TILE, "#fca5a5");
    sfx.fail();
    return;
  }
  S.placed.push(next);
  juice.float(`+${def.score}`, OX + x * TILE + 16, OY + y * TILE, "#86efac");
  juice.burst(OX + x * TILE + 16, OY + y * TILE + 16, def.color, 8);
  sfx.ok();
  hud();
  persist();
};

el("clear").onclick = () => {
  if (!S.running) return;
  S.placed = [];
  sfx.ui();
  hud();
  persist();
};

el("submit").onclick = () => {
  if (!S.running) return;
  if (score() < comm().goal) {
    sfx.fail();
    juice.shake(3);
    juice.float("分数不够", 240, 40, "#fca5a5");
    return;
  }
  juice.burst(240, 120, "#f9a8d4", 18);
  sfx.levelup();
  S.ci += 1;
  S.placed = [];
  if (S.ci >= DATA.commissions.length) {
    S.ended = true;
    persist();
    show("窗边花开", "十二间布置委托完成，小屋成为展览明星。", false);
    return;
  }
  persist();
  hud();
  juice.float(comm().title, 240, 36, "#93c5fd");
};

function drawItem(p, ghost) {
  const x = OX + p.x * TILE + 2;
  const y = OY + p.y * TILE + 2;
  const w = p.w * TILE - 4;
  const h = p.h * TILE - 4;
  ctx.globalAlpha = ghost ? 0.45 : 1;
  D.fillRoundRect(ctx, x, y, w, h, 6, p.color);
  // simple icon accents
  if (p.id === "plant") D.disk(ctx, x + w / 2, y + h / 2, 6, "#166534");
  if (p.id === "lamp") D.disk(ctx, x + w / 2, y + 8, 5, "#fffbeb");
  if (p.id === "cat") D.disk(ctx, x + w / 2, y + h / 2, 5, "#fff");
  if (p.id === "bed") D.fillRoundRect(ctx, x + 4, y + 4, w - 8, h / 2, 4, "#dbeafe");
  if (p.id === "art") D.star(ctx, x + w / 2, y + h / 2, 5, "#fff");
  ctx.globalAlpha = 1;
  if (!ghost) {
    ctx.fillStyle = "rgba(15,23,42,.75)";
    ctx.font = "10px sans-serif";
    ctx.fillText(p.name, x + 3, y + 12);
  }
}

function draw() {
  const room = (comm() && comm().room) || 0;
  const skies = [
    ["#7dd3fc", "#dbeafe"],
    ["#f9a8d4", "#fce7f3"],
    ["#c4b5fd", "#1e1b4b"],
  ];
  D.softBg(ctx, 480, 270, skies[room][0], skies[room][1]);
  // window
  D.fillRoundRect(ctx, 18, 30, 28, 50, 4, "rgba(255,255,255,.35)");
  D.fillRoundRect(ctx, OX - 8, OY - 8, DATA.cols * TILE + 16, DATA.rows * TILE + 16, 10, "#b08968");
  D.fillRoundRect(ctx, OX, OY, DATA.cols * TILE, DATA.rows * TILE, 6, "#f5e6c8");

  ctx.strokeStyle = "rgba(0,0,0,.12)";
  for (let x = 0; x <= DATA.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(OX + x * TILE, OY);
    ctx.lineTo(OX + x * TILE, OY + DATA.rows * TILE);
    ctx.stroke();
  }
  for (let y = 0; y <= DATA.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(OX, OY + y * TILE);
    ctx.lineTo(OX + DATA.cols * TILE, OY + y * TILE);
    ctx.stroke();
  }

  for (const p of S.placed) drawItem(p, false);

  if (S.running && hover && S.selected) {
    const def = DATA.items.find((i) => i.id === S.selected);
    if (def) {
      const ghost = { ...def, x: hover.x, y: hover.y };
      const valid =
        ghost.x >= 0 &&
        ghost.y >= 0 &&
        ghost.x + ghost.w <= DATA.cols &&
        ghost.y + ghost.h <= DATA.rows &&
        !S.placed.some((p) => overlaps(ghost, p));
      drawItem(ghost, true);
      D.strokeRoundRect(
        ctx,
        OX + ghost.x * TILE,
        OY + ghost.y * TILE,
        ghost.w * TILE,
        ghost.h * TILE,
        6,
        valid ? "#34d399" : "#f87171",
        2
      );
    }
  }

  // score chip
  D.fillRoundRect(ctx, 16, 230, 140, 28, 8, "rgba(15,23,42,.7)");
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.fillText(`评分 ${score()} / ${comm().goal}`, 28, 248);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  if (DATA) draw();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

el("btn-start").onclick = () => {
  S.ci = 0;
  S.placed = [];
  S.ended = false;
  S.selected = DATA.items[0].id;
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
  if (!S.placed) S.placed = [];
  hud();
  hide();
  sfx.ui();
};

LongplayPause.mount({
  title: "窗边小屋",
  statusText: () => `委托 ${S.ci + 1}/12`,
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

fetch("./content/decor.json")
  .then((r) => r.json())
  .then((d) => {
    DATA = d;
    S.selected = d.items[0].id;
    const sv = save.load();
    show("窗边小屋", "完成 12 个布置委托，达成评分目标。约 10–20 分钟。", !!(sv && !sv.ended));
    if (sv) Object.assign(S, sv);
    if (!S.placed) S.placed = [];
    hud();
    requestAnimationFrame(loop);
  });
