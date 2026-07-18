const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("15-shelf-sort");
sfx.mountMuteButton();

const save = LongplaySave.create("15-shelf-sort", 3);
const el = (id) => document.getElementById(id);

const BOOK_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#a855f7"];
const BOOK_LABELS = ["赤", "蓝", "金", "紫"];
const COLS = 4;
const H = 4;
const T = 40;
const GAP = 24;
const OX = 80;
const OY = 40;
const TOTAL_LEVELS = 40;

let last = performance.now();

const S = {
  running: false,
  li: 0,
  cols: [[], [], [], []],
  sel: null,
  moves: 0,
  ended: false,
  shakeCol: -1,
  shakeT: 0,
};

function show(title, msg, canContinue) {
  el("overlay-title").textContent = title;
  el("overlay-msg").textContent = msg;
  el("btn-continue").style.display = canContinue ? "" : "none";
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

/** Seeded RNG from level index — reproducible on continue */
function makeRng(seed) {
  let s = (seed + 1) * 2654435761 >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gen() {
  const rand = makeRng(S.li);
  const bags = [];
  for (let c = 0; c < COLS; c++) {
    for (let i = 0; i < H; i++) bags.push(c);
  }
  for (let i = bags.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bags[i], bags[j]] = [bags[j], bags[i]];
  }
  S.cols = [[], [], [], []];
  for (const b of bags) {
    let opts = S.cols
      .map((col, i) => (col.length < H ? i : null))
      .filter((v) => v !== null);
    if (opts.length > 1) opts = opts.filter((i) => i < 3 || rand() < 0.3);
    S.cols[opts[Math.floor(rand() * opts.length)]].push(b);
  }
  if (S.cols.every((c) => c.length === H)) S.cols[3].pop();
  S.sel = null;
  S.moves = 0;
  el("level").textContent = S.li + 1;
  el("moves").textContent = 0;
}

function solved() {
  return S.cols.every(
    (col) => !col.length || (col.length === H && col.every((v) => v === col[0]))
  );
}

function colX(c) {
  return OX + c * (T + GAP);
}

function drawBookSpine(x, y, colorIdx, wob) {
  const col = BOOK_COLORS[colorIdx];
  const w = T - 8;
  const h = T - 6;
  const wx = x + 4 + (wob || 0);
  D.fillRoundRect(ctx, wx, y, w, h, 3, col);
  D.fillRoundRect(ctx, wx + 2, y + 2, 4, h - 4, 2, "rgba(0,0,0,.2)");
  D.fillRoundRect(ctx, wx + w - 6, y + 4, 3, h - 8, 1, "rgba(255,255,255,.25)");
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = "bold 11px serif";
  ctx.textAlign = "center";
  ctx.fillText(BOOK_LABELS[colorIdx], wx + w / 2, y + h / 2 + 4);
  ctx.textAlign = "left";
}

el("reset").onclick = () => {
  if (S.running) {
    gen();
    sfx.ui();
  }
};

canvas.addEventListener("click", (ev) => {
  if (!S.running) return;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(
    ((ev.clientX - r.left) * (canvas.width / r.width) - OX) / (T + GAP)
  );
  if (x < 0 || x >= COLS) return;

  if (S.sel == null) {
    if (S.cols[x].length) {
      S.sel = x;
      sfx.ui();
    }
    return;
  }
  if (S.sel === x) {
    S.sel = null;
    return;
  }

  const from = S.sel;
  const to = x;
  const book = S.cols[from][S.cols[from].length - 1];
  const top = S.cols[to][S.cols[to].length - 1];

  if (S.cols[to].length >= H || (S.cols[to].length && top !== book)) {
    S.shakeCol = to;
    S.shakeT = 0.28;
    juice.shake(4);
    juice.float("不可放置", colX(to) + T / 2, OY + 20, "#fca5a5");
    sfx.fail();
    return;
  }

  S.cols[from].pop();
  S.cols[to].push(book);
  S.sel = null;
  S.moves++;
  el("moves").textContent = S.moves;
  sfx.pickup();

  if (solved()) {
    juice.flash("rgba(134,239,172,.18)");
    juice.float("整理完成!", 240, 50, "#86efac");
    sfx.levelup();
    if (S.li >= TOTAL_LEVELS - 1) {
      S.ended = true;
      persist();
      show("书架如诗", "四十关整理完成，图书馆重归秩序。", false);
    } else {
      S.li++;
      persist();
      setTimeout(() => gen(), 380);
    }
  }
});

function draw() {
  A.sky(ctx, 480, 270, "#14231a", "#14231a", "#0a1510");
  ctx.fillStyle = "#ecfdf5";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(`第 ${S.li + 1} 关 · 步数 ${S.moves}`, 12, 18);

  for (let c = 0; c < COLS; c++) {
    const x = colX(c);
    let shake = 0;
    if (S.shakeCol === c && S.shakeT > 0) {
      shake = Math.sin(S.shakeT * 40) * 6 * (S.shakeT / 0.28);
    }
    D.fillRoundRect(ctx, x + shake, OY, T, H * T + 8, 6, "#374151");
    D.fillRoundRect(ctx, x + 2 + shake, OY + 2, T - 4, H * T + 4, 4, "#1f2937");

    S.cols[c].forEach((b, i) => {
      const by = OY + H * T - (i + 1) * T + 4;
      drawBookSpine(x + shake, by, b, 0);
    });

    if (S.sel === c) {
      D.strokeRoundRect(
        ctx,
        x - 2 + shake,
        OY - 2,
        T + 4,
        H * T + 12,
        8,
        "#86efac",
        3
      );
    }
  }

  A.vignette(ctx, 480, 270, 0.28);
  A.filmGrain(ctx, 480, 270, performance.now()/1000, 0.025);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (S.shakeT > 0) S.shakeT -= dt;
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  draw();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

el("btn-start").onclick = () => {
  S.li = 0;
  S.ended = false;
  gen();
  persist();
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
  S.li = d.li || 0;
  gen();
  hide();
  sfx.ui();
};

LongplayPause.mount({
  title: "书架整理",
  statusText: () => `关卡 ${S.li + 1}/40`,
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

const sv = save.load();
show(
  "书架整理",
  "四十关收纳谜题，同色书籍归列。每关布局由关卡种子固定，读档可复现。约 30–50 分钟。",
  !!(sv && !sv.ended)
);
S.li = sv ? sv.li : 0;
gen();
if (!sv) S.running = false;
requestAnimationFrame(loop);
