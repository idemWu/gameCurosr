const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("13-match-gems");
sfx.mountMuteButton();

const save = LongplaySave.create("13-match-gems", 3);
const el = (id) => document.getElementById(id);

const GEM_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7"];
const N = 7;
const T = 32;
const OX = 50;
const OY = 24;

let LEVELS = [];
let SPR = null;
let last = performance.now();

const S = {
  running: false,
  li: 0,
  grid: [],
  sel: null,
  moves: 0,
  cleared: 0,
  need: 0,
  stars: 0,
  unlockedWorld: 1,
  ended: false,
  maxCleared: 0,
  busy: false,
  clearing: null,
  fall: null,
  selPulse: 0,
};

function show(title, msg, canContinue) {
  el("overlay-title").textContent = title;
  el("overlay-msg").textContent = msg;
  el("btn-continue").style.display = canContinue ? "" : "none";
  el("worldbtns").innerHTML = "";
  el("overlay").classList.remove("hidden");
  S.running = false;
}

function hide() {
  el("overlay").classList.add("hidden");
  S.running = true;
}

function persist() {
  save.save({
    li: S.li,
    stars: S.stars,
    unlockedWorld: S.unlockedWorld,
    ended: S.ended,
    maxCleared: S.maxCleared,
  });
}

function hud() {
  const L = LEVELS[S.li];
  el("world").textContent = L.world;
  el("level").textContent = L.id;
  el("moves").textContent = S.moves;
  el("goal").textContent = S.cleared;
  el("need").textContent = S.need;
  el("stars").textContent = S.stars;
}

function rnd(n) {
  return Math.floor(Math.random() * n);
}

function cellPx(x, y) {
  return { cx: OX + x * T + T / 2, cy: OY + y * T + T / 2 };
}

function loadLevel(i) {
  S.li = i;
  const L = LEVELS[i];
  S.need = L.need;
  S.moves = L.moves;
  S.cleared = 0;
  S.sel = null;
  S.busy = false;
  S.clearing = null;
  S.fall = null;
  S.grid = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => rnd(L.colors))
  );
  hud();
}

function findMatches() {
  const m = new Set();
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N - 2; x++) {
      const v = S.grid[y][x];
      if (v < 0) continue;
      if (v === S.grid[y][x + 1] && v === S.grid[y][x + 2]) {
        m.add(`${x},${y}`);
        m.add(`${x + 1},${y}`);
        m.add(`${x + 2},${y}`);
      }
    }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N - 2; y++) {
      const v = S.grid[y][x];
      if (v < 0) continue;
      if (v === S.grid[y + 1][x] && v === S.grid[y + 2][x]) {
        m.add(`${x},${y}`);
        m.add(`${x},${y + 1}`);
        m.add(`${x},${y + 2}`);
      }
    }
  }
  return m;
}

function applyGravity() {
  const L = LEVELS[S.li];
  const spawned = [];
  for (let x = 0; x < N; x++) {
    let w = N - 1;
    for (let y = N - 1; y >= 0; y--) {
      if (S.grid[y][x] !== -1) {
        S.grid[w][x] = S.grid[y][x];
        w--;
      }
    }
    while (w >= 0) {
      const v = rnd(L.colors);
      S.grid[w][x] = v;
      spawned.push({ x, y: w, v });
      w--;
    }
  }
  return spawned;
}

function startClearChain(onDone) {
  const matches = findMatches();
  if (!matches.size) {
    onDone(0);
    return;
  }
  let total = 0;
  const step = () => {
    const m = findMatches();
    if (!m.size) {
      onDone(total);
      return;
    }
    total += m.size;
    S.clearing = { keys: [...m], t: 0.18 };
    for (const key of m) {
      const [x, y] = key.split(",").map(Number);
      const { cx, cy } = cellPx(x, y);
      const col = GEM_COLORS[S.grid[y][x]] || "#fff";
      juice.burst(cx, cy, col, 8);
      juice.float("+1", cx, cy - 8, col);
      S.grid[y][x] = -1;
    }
    juice.flash("rgba(232,121,249,.15)");
    sfx.hit();
    S.busy = true;
    setTimeout(() => {
      const spawned = applyGravity();
      S.fall = { spawned, t: 0.22, fromY: {} };
      spawned.forEach((s) => {
        S.fall.fromY[`${s.x},${s.y}`] = OY - T * (1 + rnd(3));
      });
      sfx.pickup();
      setTimeout(() => {
        S.fall = null;
        step();
      }, 240);
    }, 200);
  };
  step();
}

function finishMove(cleared) {
  S.cleared += cleared;
  hud();
  if (S.cleared >= S.need) {
    const star = S.moves >= 8 ? 3 : S.moves >= 3 ? 2 : 1;
    S.stars += star;
    S.maxCleared = Math.max(S.maxCleared, S.li + 1);
    if ((S.li + 1) % 15 === 0) {
      S.unlockedWorld = Math.max(S.unlockedWorld, Math.floor(S.li / 15) + 2);
    }
    persist();
    juice.flash("rgba(251,191,36,.22)");
    juice.float(`${star} 星!`, 240, 60, "#fde68a");
    sfx.levelup();
    if (S.li >= LEVELS.length - 1) {
      S.ended = true;
      persist();
      show("晶石闪耀", "60 关全部通关！四世界的晶石图鉴尽数点亮。", false);
    } else {
      setTimeout(() => loadLevel(S.li + 1), 420);
    }
  } else if (S.moves <= 0) {
    show("步数用尽", "本关步数已用完，可重置本关或读档继续。", true);
    sfx.fail();
  }
  S.busy = false;
}

function swap(a, b) {
  const t = S.grid[a.y][a.x];
  S.grid[a.y][a.x] = S.grid[b.y][b.x];
  S.grid[b.y][b.x] = t;
}

canvas.addEventListener("click", (ev) => {
  if (!S.running || S.busy) return;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(
    ((ev.clientX - r.left) * (canvas.width / r.width) - OX) / T
  );
  const y = Math.floor(
    ((ev.clientY - r.top) * (canvas.height / r.height) - OY) / T
  );
  if (x < 0 || y < 0 || x >= N || y >= N) return;

  if (!S.sel) {
    S.sel = { x, y };
    sfx.ui();
    return;
  }
  const s = S.sel;
  S.sel = null;
  if (Math.abs(s.x - x) + Math.abs(s.y - y) !== 1) {
    S.sel = { x, y };
    sfx.ui();
    return;
  }
  swap(s, { x, y });
  const preview = findMatches();
  if (!preview.size) {
    swap(s, { x, y });
    juice.shake(3);
    sfx.fail();
    S.sel = { x, y };
    return;
  }
  S.moves--;
  sfx.pickup();
  S.busy = true;
  startClearChain((got) => finishMove(got));
});

el("reset").onclick = () => {
  if (S.running && !S.busy) {
    loadLevel(S.li);
    sfx.ui();
  }
};

el("worldsel").onclick = () => {
  show("世界选择", `已解锁世界 1–${Math.min(4, S.unlockedWorld)}`, true);
  const box = el("worldbtns");
  box.innerHTML = "";
  for (let w = 1; w <= 4; w++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `世界 ${w}`;
    b.disabled = w > S.unlockedWorld;
    b.onclick = () => {
      loadLevel((w - 1) * 15);
      hide();
      sfx.ui();
    };
    box.appendChild(b);
  }
};

el("btn-start").onclick = () => {
  Object.assign(S, {
    li: 0,
    stars: 0,
    unlockedWorld: 1,
    ended: false,
    maxCleared: 0,
  });
  loadLevel(0);
  persist();
  hide();
  sfx.ui();
};

el("btn-continue").onclick = () => {
  const d = save.load();
  if (!d) {
    el("overlay-msg").textContent = "无存档";
    sfx.fail();
    return;
  }
  Object.assign(S, d);
  loadLevel(Math.min(S.li, 59));
  hide();
  sfx.ui();
};

function drawGemSprite(v, px, py, scale) {
  const s = scale == null ? 1 : scale;
  if (SPR?.gems) {
    const gi = Math.max(0, Math.min(4, v | 0));
    const size = (T - 6) * s;
    A.drawSprite(ctx, SPR.gems, gi * 48, 0, 48, 48, px - size / 2, py - size / 2, size, size);
  } else {
    D.gem(ctx, px, py, (T / 2 - 4) * s, GEM_COLORS[v] || "#fff");
  }
}

function drawBoard() {
  A.sky(ctx, 480, 270, "#1e1048", "#2e1065", "#12081f");
  // decorative orbs
  for (let i = 0; i < 8; i++) {
    const ox = 40 + i * 55;
    const oy = 20 + (i % 3) * 12;
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 18);
    g.addColorStop(0, "rgba(232,121,249,.18)");
    g.addColorStop(1, "rgba(232,121,249,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ox, oy, 18, 0, Math.PI * 2);
    ctx.fill();
  }
  A.panel(ctx, OX - 12, OY - 12, N * T + 12, N * T + 12, {
    bg: "rgba(12,8,28,.72)",
    border: "rgba(232,121,249,.45)",
    r: 14,
  });

  const clearing = S.clearing ? new Set(S.clearing.keys) : null;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = S.grid[y] ? S.grid[y][x] : 0;
      if (v < 0) continue;
      let py = OY + y * T + T / 2;
      const key = `${x},${y}`;
      if (S.fall && S.fall.fromY[key] != null) {
        const tt = 1 - S.fall.t / 0.22;
        py = S.fall.fromY[key] + (py - S.fall.fromY[key]) * Math.min(1, tt);
      }
      const px = OX + x * T + T / 2;
      D.fillRoundRect(ctx, OX + x * T + 1, OY + y * T + 1, T - 2, T - 2, 6, "rgba(0,0,0,.28)");
      if (clearing && clearing.has(key)) {
        const pulse = 1 + Math.sin(S.selPulse * 12) * 0.15;
        ctx.globalAlpha = 0.55 + Math.sin(S.selPulse * 18) * 0.3;
        drawGemSprite(v, px, py, pulse);
        ctx.globalAlpha = 1;
      } else {
        drawGemSprite(v, px, py, 1);
      }
      if (S.sel && S.sel.x === x && S.sel.y === y) {
        const wob = Math.sin(S.selPulse * 6) * 2;
        D.strokeRoundRect(
          ctx,
          OX + x * T + wob,
          OY + y * T + wob,
          T - 2 - wob * 2,
          T - 2 - wob * 2,
          8,
          "#fde68a",
          3
        );
      }
    }
  }

  const L = LEVELS[S.li];
  A.panel(ctx, 8, 6, 220, 26, { bg: "rgba(20,10,40,.75)", border: "rgba(232,121,249,.35)", r: 10, bw: 1 });
  A.text(ctx, L.title || `世界${L.world} · 第${L.id}关`, 18, 24, { color: "#f5e9ff", font: "bold 12px sans-serif" });
  A.vignette(ctx, 480, 270, 0.34);
  A.filmGrain(ctx, 480, 270, S.selPulse, 0.025);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  S.selPulse += dt;
  if (S.clearing) {
    S.clearing.t -= dt;
    if (S.clearing.t <= 0) S.clearing = null;
  }
  if (S.fall) {
    S.fall.t -= dt;
    if (S.fall.t <= 0) S.fall = null;
  }
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  drawBoard();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

LongplayPause.mount({
  title: "晶石三消",
  statusText: () => `关卡 ${S.li + 1}/60 · 星 ${S.stars}`,
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

Promise.all([
  fetch("./content/levels.json").then((r) => r.json()),
  A.loadAll({ gems: "./art/sprites/gems.png" }),
]).then(([data, sprites]) => {
  LEVELS = data.levels;
  SPR = sprites;
  const d = save.load();
  show(
    "晶石三消",
    "60 关分四世界，交换相邻宝石消除目标。约 15–30 分钟通关。",
    !!(d && !d.ended)
  );
  if (d) Object.assign(S, d);
  loadLevel(Math.min(S.li || 0, 59));
  if (!d) S.running = false;
  requestAnimationFrame(loop);
});
