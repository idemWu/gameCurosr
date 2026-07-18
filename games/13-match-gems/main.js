const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
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

function drawBoard() {
  D.softBg(ctx, 480, 270, "#2e1065", "#1e1030");
  D.fillRoundRect(ctx, OX - 8, OY - 8, N * T + 4, N * T + 4, 10, "rgba(0,0,0,.35)");
  ctx.strokeStyle = "rgba(232,121,249,.35)";
  ctx.lineWidth = 2;
  D.strokeRoundRect(ctx, OX - 8, OY - 8, N * T + 4, N * T + 4, 10, "rgba(232,121,249,.35)", 2);

  const clearing = S.clearing ? new Set(S.clearing.keys) : null;

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = S.grid[y] ? S.grid[y][x] : 0;
      if (v < 0) continue;
      let py = OY + y * T + T / 2;
      const key = `${x},${y}`;
      if (S.fall && S.fall.fromY[key] != null) {
        const t = 1 - S.fall.t / 0.22;
        py = S.fall.fromY[key] + (py - S.fall.fromY[key]) * Math.min(1, t);
      }
      const px = OX + x * T + T / 2;
      D.fillRoundRect(ctx, OX + x * T + 1, OY + y * T + 1, T - 2, T - 2, 6, "rgba(0,0,0,.25)");
      if (clearing && clearing.has(key)) {
        const pulse = 1 + Math.sin(S.selPulse * 12) * 0.15;
        ctx.globalAlpha = 0.5 + Math.sin(S.selPulse * 18) * 0.3;
        D.gem(ctx, px, py, (T / 2 - 4) * pulse, GEM_COLORS[v] || "#fff");
        ctx.globalAlpha = 1;
      } else {
        D.gem(ctx, px, py, T / 2 - 4, GEM_COLORS[v] || "#fff");
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

  ctx.fillStyle = "#f5e9ff";
  ctx.font = "bold 12px sans-serif";
  const L = LEVELS[S.li];
  ctx.fillText(L.title || `世界${L.world} · 第${L.id}关`, 12, 16);
  D.vignette(ctx, 480, 270, 0.3);
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

fetch("./content/levels.json")
  .then((r) => r.json())
  .then((data) => {
    LEVELS = data.levels;
    const d = save.load();
    show(
      "晶石三消",
      "60 关分四世界，交换相邻宝石消除目标。约 35–55 分钟通关。",
      !!(d && !d.ended)
    );
    if (d) Object.assign(S, d);
    loadLevel(Math.min(S.li || 0, 59));
    if (!d) S.running = false;
    requestAnimationFrame(loop);
  });
