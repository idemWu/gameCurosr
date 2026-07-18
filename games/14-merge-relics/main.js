const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("14-merge-relics");
sfx.mountMuteButton();

const save = LongplaySave.create("14-merge-relics", 3);
const el = (id) => document.getElementById(id);

const COLS = 6;
const ROWS = 5;
const T = 50;
const OX = 40;
const OY = 24;
const RELIC_COLORS = [
  "#a8a29e", "#86efac", "#67e8f9", "#c084fc",
  "#fbbf24", "#fb7185", "#38bdf8", "#f472b6",
];
const RELIC_NAMES = [
  "碎屑", "铜片", "翠玉", "紫晶", "赤焰", "霜银", "星辉", "神话",
];

let ORD = null;
let last = performance.now();

const S = {
  running: false,
  cells: Array(30).fill(0),
  sel: null,
  max: 1,
  oi: 0,
  odone: 0,
  ended: false,
  mergeFlash: 0,
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

function order() {
  return ORD.orders[S.oi];
}

function persist() {
  save.save({
    cells: S.cells,
    max: S.max,
    oi: S.oi,
    odone: S.odone,
    ended: S.ended,
  });
}

function hud() {
  const o = order();
  el("max").textContent = S.max;
  if (o) {
    el("oname").textContent = o.name || `L${o.lv} 遗物`;
    el("odesc").textContent = o.desc || "合成指定等级遗物";
    el("olv").textContent = o.lv;
    el("oneed").textContent = o.count;
    el("oneed2").textContent = o.count;
    el("odone").textContent = S.odone;
    el("obar").style.width = `${Math.min(100, (S.odone / o.count) * 100)}%`;
  } else {
    el("oname").textContent = "全部完成";
    el("odesc").textContent = "馆藏订单已圆满";
    el("olv").textContent = "—";
    el("oneed").textContent = "0";
    el("oneed2").textContent = "0";
    el("odone").textContent = "0";
    el("obar").style.width = "100%";
  }
  el("oi").textContent = Math.min(ORD.orders.length, S.oi + 1);
  el("ototal").textContent = ORD.orders.length;
}

function empties() {
  return S.cells.map((v, i) => (v ? null : i)).filter((v) => v !== null);
}

function cellPx(i) {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  return { cx: OX + x * T + T / 2 - 3, cy: OY + y * T + T / 2 - 3 };
}

function spawn() {
  const e = empties();
  if (!e.length) {
    sfx.fail();
    juice.shake(2);
    return;
  }
  const idx = e[Math.floor(Math.random() * e.length)];
  S.cells[idx] = 1;
  const { cx, cy } = cellPx(idx);
  juice.burst(cx, cy, RELIC_COLORS[0], 6);
  sfx.pickup();
  persist();
}

function drawRelic(cx, cy, lv, scale) {
  const col = RELIC_COLORS[lv - 1] || "#fff";
  const s = scale || 1;
  const r = 14 * s;
  D.disk(ctx, cx, cy, r, col);
  D.disk(ctx, cx - 4, cy - 4, r * 0.35, "rgba(255,255,255,.35)");
  if (lv >= 4) D.star(ctx, cx, cy - r - 4, 4 + lv * 0.3, "#fde68a");
  ctx.fillStyle = "#1c1917";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`L${lv}`, cx, cy + 4);
  ctx.textAlign = "left";
}

function checkOrder(lv, cellIdx) {
  const o = order();
  if (!o || lv !== o.lv) return;
  S.odone++;
  const { cx, cy } = cellPx(cellIdx);
  juice.float("订单+1", 240, 40, "#fde68a");
  sfx.ok();
  if (S.odone >= o.count) {
    S.oi++;
    S.odone = 0;
    juice.flash("rgba(251,191,36,.2)");
    juice.float("订单完成!", 240, 70, "#86efac");
    sfx.levelup();
    if (S.oi >= ORD.orders.length && S.max >= ORD.maxLv) {
      S.ended = true;
      persist();
      show("馆藏神话", "十八项订单与八级遗物皆成，港湾博物馆名扬四方。", false);
    }
  }
  hud();
}

el("spawn").onclick = () => {
  if (S.running) {
    spawn();
    hud();
  }
};

canvas.addEventListener("click", (ev) => {
  if (!S.running) return;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(
    ((ev.clientX - r.left) * (canvas.width / r.width) - OX) / T
  );
  const y = Math.floor(
    ((ev.clientY - r.top) * (canvas.height / r.height) - OY) / T
  );
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  const i = y * COLS + x;
  const v = S.cells[i];

  if (S.sel == null && v) {
    S.sel = i;
    sfx.ui();
    return;
  }
  if (S.sel === i) {
    S.sel = null;
    return;
  }
  if (S.sel != null) {
    const a = S.sel;
    const av = S.cells[a];
    if (v === av && v > 0 && v < ORD.maxLv) {
      S.cells[a] = 0;
      S.cells[i] = v + 1;
      S.max = Math.max(S.max, v + 1);
      S.sel = null;
      const { cx, cy } = cellPx(i);
      juice.burst(cx, cy, RELIC_COLORS[v] || "#fff", 14);
      juice.flash("rgba(192,132,252,.22)");
      S.mergeFlash = 0.25;
      sfx.levelup();
      checkOrder(v + 1, i);
      persist();
      hud();
    } else if (!v) {
      S.cells[i] = av;
      S.cells[a] = 0;
      S.sel = null;
      sfx.pickup();
      persist();
    } else {
      S.sel = i;
      sfx.ui();
    }
  }
});

function draw() {
  D.softBg(ctx, 480, 270, "#1a1410", "#0c0a09");
  D.fillRoundRect(ctx, 12, 8, 200, 36, 8, "rgba(0,0,0,.35)");
  ctx.fillStyle = "#fff7ed";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("遗物陈列柜", 22, 30);

  const o = order();
  if (o) {
    ctx.fillStyle = "#d6c4a8";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${o.name} · L${o.lv}`, 240, 18);
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      const v = S.cells[i];
      const px = OX + x * T;
      const py = OY + y * T;
      D.fillRoundRect(ctx, px, py, T - 6, T - 6, 8, "#292524");
      if (v) {
        const scale = S.mergeFlash > 0 && S.sel === i ? 1.15 : 1;
        drawRelic(px + T / 2 - 3, py + T / 2 - 3, v, scale);
      }
      if (S.sel === i) {
        D.strokeRoundRect(ctx, px, py, T - 6, T - 6, 8, "#fbbf24", 3);
      }
    }
  }

  if (S.mergeFlash > 0) {
    ctx.fillStyle = `rgba(251,191,36,${S.mergeFlash * 0.3})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  D.vignette(ctx, 480, 270, 0.32);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (S.mergeFlash > 0) S.mergeFlash -= dt;
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
  S.cells = Array(30).fill(0);
  S.max = 1;
  S.oi = 0;
  S.odone = 0;
  S.ended = false;
  S.sel = null;
  for (let i = 0; i < 5; i++) spawn();
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
  hud();
  hide();
  sfx.ui();
};

LongplayPause.mount({
  title: "遗物合成",
  statusText: () => `订单 ${S.oi}/${ORD ? ORD.orders.length : 18} · L${S.max}`,
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

fetch("./content/orders.json")
  .then((r) => r.json())
  .then((d) => {
    ORD = d;
    const sv = save.load();
    show(
      "遗物合成",
      "十八项馆藏订单与八级合成链，约 35–55 分钟。非种菜，专注合成策略。",
      !!(sv && !sv.ended)
    );
    if (sv) Object.assign(S, sv);
    else {
      S.cells = Array(30).fill(0);
      for (let i = 0; i < 5; i++) spawn();
    }
    hud();
    requestAnimationFrame(loop);
  });
