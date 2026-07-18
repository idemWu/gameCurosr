const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
let PAINTED_BG = null; /* ART_V3_PAINTED_BG */
let SPR = null;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("05-grove-raid");
sfx.mountMuteButton();

const save = LongplaySave.create("05-grove-raid", 2);
const keys = new Set();
const el = (id) => document.getElementById(id);

let DATA = null;
let last = performance.now();
let bob = 0;

const S = {
  running: false,
  zi: 0,
  qi: 0,
  hp: 8,
  maxHp: 8,
  loot: 0,
  player: { x: 40, y: 200 },
  enemies: [],
  chests: [],
  ended: false,
  atkCd: 0,
  atkMax: 18,
  hurtT: 0,
  bubble: null,
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
  save.save({ zi: S.zi, qi: S.qi, hp: S.hp, ended: S.ended });
}

function quest() {
  return DATA.quests[S.qi];
}

function zone() {
  return DATA.zones[S.zi];
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function spawn() {
  const z = zone();
  S.loot = 0;
  S.player = { x: 40, y: 200 };
  S.enemies = Array.from({ length: z.enemies }, () => ({
    x: 100 + Math.random() * 340,
    y: 40 + Math.random() * 200,
    hp: 2 + S.zi,
    maxHp: 2 + S.zi,
    wobble: Math.random() * Math.PI * 2,
  }));
  S.chests = Array.from({ length: z.chests }, () => ({
    x: 80 + Math.random() * 360,
    y: 40 + Math.random() * 180,
    got: false,
  }));
  hud();
}

function hud() {
  const q = quest();
  el("zone").textContent = String(S.zi + 1);
  el("qi").textContent = String(Math.min(15, S.qi + 1));
  el("hp").textContent = String(S.hp);
  el("loot").textContent = String(S.loot);
  el("need").textContent = String(q ? q.chests : 0);
  el("qtext").textContent = q ? q.text : "全部林务完成";
  el("hpbar").style.width = `${Math.max(0, (S.hp / S.maxHp) * 100)}%`;
}

function completeQuest() {
  const q = quest();
  if (!q) return;
  juice.burst(S.player.x, S.player.y, "#fbbf24", 16);
  juice.float("任务完成", S.player.x, S.player.y - 20, "#fde68a");
  sfx.levelup();
  S.bubble = { text: `完成：${q.text}`, t: 2.4 };
  S.qi += 1;
  S.loot = 0;
  if (S.qi >= 15) {
    S.ended = true;
    persist();
    show("林间凯旋", "十五件林务完成，星落营地为你点起篝火。", false);
    return;
  }
  persist();
  hud();
}

function openChest(c) {
  c.got = true;
  S.loot += 1;
  juice.burst(c.x, c.y, "#f59e0b", 10);
  juice.float("+1", c.x, c.y - 12, "#fde68a");
  sfx.pickup();
  const q = quest();
  if (q && S.loot >= q.chests) completeQuest();
  else hud();
  persist();
}

function hurt() {
  S.hp -= 1;
  S.hurtT = 0.35;
  juice.shake(5);
  juice.flash("rgba(248,113,113,.35)");
  sfx.hit();
  if (S.hp <= 0) {
    persist();
    show("倒下了", "读档再探林间。", !!save.load());
  } else {
    hud();
  }
}

function update(dt) {
  if (!S.running || !DATA) return;
  bob += dt;
  if (S.hurtT > 0) S.hurtT -= dt;
  if (S.atkCd > 0) S.atkCd -= dt;

  const p = S.player;
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;

  if (dx || dy) {
    const l = Math.hypot(dx, dy);
    const spd = 110 * dt;
    const nx = Math.max(10, Math.min(470, p.x + (dx / l) * spd));
    const ny = Math.max(10, Math.min(260, p.y + (dy / l) * spd));
    if (nx !== p.x || ny !== p.y) sfx.tap();
    p.x = nx;
    p.y = ny;
  }

  for (const e of S.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(p, e);
    if (d < 90 && d > 0) {
      const pull = 42 * dt;
      e.x += ((p.x - e.x) / d) * pull;
      e.y += ((p.y - e.y) / d) * pull;
    }
    if (d < 16) {
      hurt();
      const push = 18;
      if (d > 0) {
        e.x += ((e.x - p.x) / d) * push;
        e.y += ((e.y - p.y) / d) * push;
      }
    }
    if (d < 28 && S.atkCd <= 0) {
      e.hp -= 1;
      S.atkCd = S.atkMax;
      juice.burst(e.x, e.y, "#ef4444", 6);
      sfx.hit();
      if (e.hp <= 0) {
        juice.float("击败", e.x, e.y - 10, "#fca5a5");
        juice.burst(e.x, e.y, "#7f1d1d", 8);
      }
    }
  }

  for (const c of S.chests) {
    if (!c.got && dist(p, c) < 18) openChest(c);
  }

  if (S.bubble) {
    S.bubble.t -= dt;
    if (S.bubble.t <= 0) S.bubble = null;
  }
}

function drawTree(x, y, s) {
  D.fillRoundRect(ctx, x - 3 * s, y, 6 * s, 14 * s, 2, "#5c3d1e");
  D.disk(ctx, x, y - 4 * s, 10 * s, "#166534");
  D.disk(ctx, x - 5 * s, y - 2 * s, 7 * s, "#15803d");
  D.disk(ctx, x + 5 * s, y - 1 * s, 6 * s, "#22c55e");
}

function drawEnemy(e) {
  const wob = Math.sin(bob * 4 + e.wobble) * 2;
  const x = e.x;
  const y = e.y + wob;
  const r = 9;
  D.disk(ctx, x, y, r, "#991b1b");
  D.disk(ctx, x - 3, y - 2, 2.5, "#fef2f2");
  D.disk(ctx, x + 3, y - 2, 2.5, "#fef2f2");
  ctx.fillStyle = "#450a0a";
  ctx.fillRect(x - 2, y + 1, 4, 2);
  if (e.maxHp > 1) {
    D.bar(ctx, x - 10, y - 18, 20, 4, e.hp / e.maxHp, "#1f2937", "#f87171");
  }
}

function draw() {
  if (PAINTED_BG) { ctx.drawImage(PAINTED_BG, 0, 0, 480, 270); }
  if (!DATA) return;
  const z = zone();
  A.sky(ctx, 480, 270, "#1a3d2a", "#1a3d2a", "#0f2418");
  ctx.fillStyle = "#14532d";
  ctx.fillRect(0, 200, 480, 70);
  for (let i = 0; i < 8; i++) drawTree(30 + i * 58, 175 + (i % 2) * 8, 0.9 + (i % 3) * 0.15);
  for (let i = 0; i < 5; i++) drawTree(50 + i * 95, 120 + (i % 2) * 10, 0.7);

  ctx.fillStyle = "rgba(74,222,128,.08)";
  D.fillRoundRect(ctx, 8, 8, 200, 22, 6, "rgba(15,23,42,.55)");
  ctx.fillStyle = "#ecfdf5";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText(z.name, 16, 23);

  if (SPR?.tree) {
    A.drawImage(ctx, SPR.tree, 30, 70, 48, 64);
    A.drawImage(ctx, SPR.tree, 390, 90, 42, 56);
    A.drawImage(ctx, SPR.tree, 220, 40, 36, 48);
  }
  for (const c of S.chests) {
    if (!c.got) {
      if (SPR?.chest) A.drawImage(ctx, SPR.chest, c.x - 14, c.y - 12, 28, 24);
      else D.chest(ctx, c.x, c.y, false);
    }
  }
  for (const e of S.enemies) {
    if (e.hp > 0) drawEnemy(e);
  }

  const p = S.player;
  if (SPR?.chars) {
    A.shadowEllipse(ctx, p.x, p.y + 12, 9, 3);
    A.drawSprite(ctx, SPR.chars, 0, 0, 64, 96, p.x - 12, p.y - 18, 24, 36);
  } else {
    D.person(ctx, p.x, p.y, "#fef3c7", "#4ade80");
  }

  if (S.atkCd > 0) {
    const ratio = 1 - S.atkCd / S.atkMax;
    ctx.strokeStyle = "rgba(74,222,128,.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
    ctx.stroke();
  }

  if (S.hurtT > 0) {
    ctx.fillStyle = `rgba(248,113,113,${0.25 * (S.hurtT / 0.35)})`;
    ctx.fillRect(0, 0, 480, 270);
  }

  D.bar(ctx, 12, 252, 100, 8, S.hp / S.maxHp, "#0f172a", "#4ade80", "#166534");

  if (S.bubble) {
    D.bubble(ctx, S.bubble.text, 240, 250, { bg: "rgba(15,23,42,.92)", fg: "#fde68a" });
  }

  A.vignette(ctx, 480, 270, 0.28);
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

el("nextzone").onclick = () => {
  if (!S.running) return;
  const need = (S.zi + 1) * 3;
  if (S.qi < need) {
    S.bubble = { text: `需完成 ${need} 件任务才能进入下一区域`, t: 2 };
    sfx.fail();
    juice.shake(3);
    return;
  }
  if (S.zi < 4) {
    S.zi += 1;
    spawn();
    juice.flash("rgba(74,222,128,.2)");
    juice.float(zone().name, 240, 40, "#86efac");
    sfx.ui();
    persist();
  }
};

el("btn-start").onclick = () => {
  Object.assign(S, {
    zi: 0,
    qi: 0,
    hp: 8,
    ended: false,
    bubble: null,
    atkCd: 0,
    hurtT: 0,
  });
  spawn();
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
  Object.assign(S, d, { bubble: null, atkCd: 0, hurtT: 0 });
  spawn();
  hide();
  sfx.ui();
};

window.addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key));

LongplayPause.mount({
  title: "林间轻旅",
  statusText: () => `任务 ${S.qi}/15 · ${zone() ? zone().name : ""}`,
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

Promise.all([
  fetch("./content/zones.json").then((r) => r.json()),
  A.loadAll({ tree: "./art/sprites/tree.png", chest: "./art/sprites/chest.png", chars: "./art/sprites/harbor_chars.png" }),
]).then(([d, sprites]) => {
  SPR = sprites;
    DATA = d;
    const sv = save.load();
    show(
      "林间轻旅",
      "五区域森林探索，打怪开宝箱完成十五件林务。约 15–25 分钟。",
      !!(sv && !sv.ended)
    );
    if (sv) Object.assign(S, sv, { bubble: null, atkCd: 0, hurtT: 0 });
    spawn();
    requestAnimationFrame(loop);
  });


/* ART_V3_PAINTED_BG_LOAD */
if (typeof A !== 'undefined' && A.loadImage) {
  A.loadImage('./art/painted/bg_main.png').then((img) => { PAINTED_BG = img; }).catch(() => {});
}
