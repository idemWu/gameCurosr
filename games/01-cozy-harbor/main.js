const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const A = GameArt;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("01-cozy-harbor");
sfx.mountMuteButton();

const el = (id) => document.getElementById(id);
const TILE = 16;
const PERIODS = ["清晨", "正午", "黄昏", "夜晚"];
const NPC_ART = {
  li: "li",
  zhen: "zhen",
  lu: "lu",
  bo: "bo",
  mei: "mei",
  yun: "yun",
  hai: "hai",
  qing: "qing",
};

const save = LongplaySave.create("01-cozy-harbor", 5);
const keys = new Set();

let WORLD = null;
let ART = null;
let last = performance.now();
let t = 0;

const state = {
  running: false,
  day: 1,
  period: 0,
  zoneIdx: 0,
  player: { x: 5, y: 9, fx: 5, fy: 9 },
  affinity: {},
  done: {},
  bubble: null,
  ended: false,
  moveCd: 0,
};

async function boot() {
  const [world, art] = await Promise.all([
    fetch("./content/world.json").then((r) => r.json()),
    A.loadAll({
      bgPier: "./art/painted/bg_pier_morning.png",
      bgSquare: "./art/painted/bg_square_day.png",
      bgHill: "./art/painted/bg_hill_dusk.png",
      player: "./art/painted/char_player.png",
      li: "./art/painted/char_li.png",
      zhen: "./art/painted/char_zhen.png",
      lu: "./art/painted/char_lu.png",
      bo: "./art/painted/char_bo.png",
      mei: "./art/painted/char_mei.png",
      yun: "./art/painted/char_yun.png",
      hai: "./art/painted/char_hai.png",
      qing: "./art/painted/char_qing.png",
    }),
  ]);
  WORLD = world;
  ART = art;
  WORLD.npcs.forEach((n) => {
    if (state.affinity[n.id] == null) state.affinity[n.id] = 0;
  });

  const data = save.load();
  const canContinue = data && !data.ended;
  showOverlay(
    "港湾日记",
    "商业手绘样板 · 七天三区域认识镇民。约 12–25 分钟迎来灯火庆典。",
    canContinue
  );
  if (data) applySave(data);
  hud();
  requestAnimationFrame(loop);
}

function dayQuests() {
  return WORLD.quests.filter((q) => q.day === state.day);
}
function totalAff() {
  return Object.values(state.affinity).reduce((a, b) => a + b, 0);
}
function persist() {
  save.save({
    day: state.day,
    period: state.period,
    zoneIdx: state.zoneIdx,
    player: { x: state.player.x, y: state.player.y },
    affinity: state.affinity,
    done: state.done,
    ended: state.ended,
  });
}
function applySave(data) {
  if (!data) return false;
  state.day = data.day || 1;
  state.period = data.period || 0;
  state.zoneIdx = data.zoneIdx || 0;
  const p = data.player || { x: 5, y: 9 };
  state.player.x = p.x;
  state.player.y = p.y;
  state.player.fx = p.x;
  state.player.fy = p.y;
  state.affinity = data.affinity || {};
  state.done = data.done || {};
  state.ended = !!data.ended;
  return true;
}

function showOverlay(title, msg, showContinue) {
  el("overlay-title").textContent = title;
  el("overlay-msg").textContent = msg;
  el("btn-continue").style.display = showContinue ? "block" : "none";
  el("overlay").classList.remove("hidden");
  state.running = false;
}
function hideOverlay() {
  el("overlay").classList.add("hidden");
  state.running = true;
}

function hud() {
  const qs = dayQuests();
  const finished = qs.filter((q) => state.done[q.id]).length;
  el("day").textContent = String(state.day);
  el("period").textContent = PERIODS[state.period];
  el("done").textContent = String(finished);
  el("need").textContent = String(qs.length);
  el("aff").textContent = String(totalAff());
  el("affbar").style.width = `${Math.min(100, (totalAff() / 28) * 100)}%`;
  el("zone").textContent = WORLD.zones[state.zoneIdx].name;
  el("quests").innerHTML = qs
    .map((q) => `<li class="${state.done[q.id] ? "ok" : ""}">${q.text}</li>`)
    .join("");
}

function npcsHere() {
  const z = WORLD.zones[state.zoneIdx].id;
  return WORLD.npcs.filter((n) => n.zone === z);
}

function tryTalk() {
  if (!state.running) return;
  const p = state.player;
  for (const n of npcsHere()) {
    if (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) <= 1) {
      const qs = dayQuests().filter((q) => q.npc === n.id && !state.done[q.id]);
      const px = n.x * TILE + TILE / 2;
      const py = n.y * TILE;
      if (qs.length) {
        const q = qs[0];
        state.done[q.id] = true;
        state.affinity[n.id] = (state.affinity[n.id] || 0) + (q.affinity || 1);
        state.bubble = { text: `${n.name}：谢谢你，港湾更热闹了。`, t: 2.2 };
        state.period = Math.min(3, state.period + 1);
        juice.float(`好感+${q.affinity || 1}`, px, py, "#fde68a");
        juice.burst(px, py + 8, "#f6c453", 10);
        sfx.ok();
      } else {
        const lines = [
          `${n.name}：今天风很温柔。`,
          `${n.name}：记得去看看别的区域。`,
          `${n.name}：庆典一天天近了呢。`,
          `${n.name}：好感 ${state.affinity[n.id] || 0}`,
        ];
        state.bubble = { text: lines[(state.day + state.period) % lines.length], t: 1.8 };
        sfx.ui();
      }
      hud();
      persist();
      return;
    }
  }
  state.bubble = { text: "附近没有可以交谈的人", t: 1.2 };
  sfx.fail();
}

function endDay() {
  if (!state.running) return;
  const qs = dayQuests();
  if (qs.some((q) => !state.done[q.id])) {
    state.bubble = { text: "还有待办没完成，不能结束今天", t: 1.6 };
    sfx.fail();
    juice.shake(3);
    return;
  }
  if (state.day >= 7) {
    state.ended = true;
    persist();
    juice.burst(240, 120, "#fbbf24", 28);
    sfx.levelup();
    showOverlay("灯火庆典", "七天待办完成，港湾灯塔点亮。你已成为这里的朋友。", false);
    return;
  }
  state.day += 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9, fx: 5, fy: 9 };
  juice.flash("rgba(125,211,252,.22)");
  sfx.pickup();
  hud();
  persist();
  state.bubble = { text: `新的一天：第 ${state.day} 天`, t: 1.8 };
}

function travel() {
  if (!state.running) return;
  state.zoneIdx = (state.zoneIdx + 1) % WORLD.zones.length;
  const z = WORLD.zones[state.zoneIdx];
  state.player.x = z.x + 2;
  state.player.y = z.y + 2;
  state.player.fx = state.player.x;
  state.player.fy = state.player.y;
  sfx.ui();
  juice.float(z.name, 240, 40, "#7dd3fc");
  hud();
  persist();
}

function update(dt) {
  if (!state.running || !WORLD) return;
  if (state.moveCd > 0) state.moveCd -= dt;
  const p = state.player;
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
  if ((dx || dy) && state.moveCd <= 0) {
    const z = WORLD.zones[state.zoneIdx];
    const nx = Math.max(z.x, Math.min(z.x + z.w - 1, p.x + dx));
    const ny = Math.max(z.y, Math.min(z.y + z.h - 1, p.y + dy));
    if (nx !== p.x || ny !== p.y) {
      p.x = nx;
      p.y = ny;
      state.moveCd = 0.12;
      sfx.tap();
    }
  }
  p.fx += (p.x - p.fx) * Math.min(1, dt * 12);
  p.fy += (p.y - p.fy) * Math.min(1, dt * 12);
  if (state.bubble) {
    state.bubble.t -= dt;
    if (state.bubble.t <= 0) state.bubble = null;
  }
}

function bgForZone(z) {
  if (z.id === "square") return ART.bgSquare;
  if (z.id === "hill") return ART.bgHill;
  return ART.bgPier;
}

function periodWash() {
  // soft color grade by time of day over painted BG
  const washes = [
    "rgba(255,240,200,.08)",
    "rgba(255,255,255,.04)",
    "rgba(255,140,60,.16)",
    "rgba(20,30,70,.38)",
  ];
  ctx.fillStyle = washes[state.period];
  ctx.fillRect(0, 0, 480, 270);
}

function drawActor(img, x, y, bob, w, h) {
  if (!img) return;
  A.shadowEllipse(ctx, x, y + h * 0.42, w * 0.35, 4);
  ctx.drawImage(img, x - w / 2, y - h / 2 + bob, w, h);
}

function drawScene() {
  const z = WORLD.zones[state.zoneIdx];
  const bg = bgForZone(z);
  // painted background covers full canvas
  ctx.drawImage(bg, 0, 0, 480, 270);
  periodWash();

  // subtle walkable zone hint
  A.panel(ctx, z.x * TILE - 2, z.y * TILE - 2, z.w * TILE + 4, z.h * TILE + 4, {
    bg: "rgba(255,255,255,.04)",
    border: "rgba(255,255,255,.14)",
    r: 12,
    bw: 1,
  });

  // NPCs
  for (const n of npcsHere()) {
    const nx = n.x * TILE + TILE / 2;
    const ny = n.y * TILE + 2;
    const bob = Math.sin(t * 2.8 + n.x) * 1.5;
    const key = NPC_ART[n.id];
    const img = key ? ART[key] : null;
    drawActor(img, nx, ny, bob, 36, 48);
    const needs = dayQuests().some((q) => q.npc === n.id && !state.done[q.id]);
    if (needs) {
      const gy = ny - 30 + bob;
      ctx.fillStyle = "#f6c453";
      ctx.beginPath();
      ctx.arc(nx, gy, 5, 0, Math.PI * 2);
      ctx.fill();
      A.text(ctx, "!", nx, gy + 4, {
        align: "center",
        color: "#3b2a05",
        font: "bold 12px sans-serif",
        shadow: false,
      });
    }
  }

  // player
  const px = state.player.fx * TILE + TILE / 2;
  const py = state.player.fy * TILE + 2;
  drawActor(ART.player, px, py, Math.sin(t * 3.5) * 1.2, 40, 52);

  // Stardew-like wood/parchment caption
  A.panel(ctx, 10, 10, 196, 30, {
    bg: "#f5e6c8",
    border: "#3d2214",
    r: 6,
    bw: 3,
  });
  A.text(ctx, `${z.name} · ${PERIODS[state.period]}`, 22, 30, {
    color: "#3a2718",
    font: "bold 12px 'PingFang SC', sans-serif",
    shadow: false,
  });

  if (state.bubble) {
    // Stardew-like dialogue: wood outer + parchment inner
    A.panel(ctx, 14, 212, 452, 52, {
      bg: "#7a4a22",
      border: "#3d2214",
      r: 6,
      bw: 3,
    });
    A.panel(ctx, 20, 218, 440, 40, {
      bg: "#f8e7c3",
      border: "#2b180c",
      r: 4,
      bw: 2,
    });
    A.text(ctx, state.bubble.text, 240, 243, {
      align: "center",
      color: "#3a2718",
      font: "bold 13px 'PingFang SC', sans-serif",
      shadow: false,
    });
  }

  A.vignette(ctx, 480, 270, state.period === 3 ? 0.35 : 0.14);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  update(dt);
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  if (WORLD && ART) drawScene();
  else {
    A.sky(ctx, 480, 270, "#0b1830", "#1a2744", "#163528");
    A.text(ctx, "加载手绘资源…", 240, 135, { align: "center" });
  }
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

function newGame() {
  state.day = 1;
  state.period = 0;
  state.zoneIdx = 0;
  state.player = { x: 5, y: 9, fx: 5, fy: 9 };
  state.affinity = {};
  WORLD.npcs.forEach((n) => { state.affinity[n.id] = 0; });
  state.done = {};
  state.ended = false;
  persist();
  hud();
  hideOverlay();
  sfx.ui();
}

function continueGame() {
  const data = save.load();
  if (!data || data.ended) {
    el("overlay-msg").textContent = "没有可继续的存档，请开始新的一周。";
    sfx.fail();
    return;
  }
  applySave(data);
  hud();
  hideOverlay();
  sfx.ui();
}

window.addEventListener("keydown", (e) => {
  keys.add(e.key);
  if (e.key === "e" || e.key === "E") tryTalk();
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key));
el("endday").addEventListener("click", endDay);
el("travel").addEventListener("click", travel);
el("btn-start").addEventListener("click", newGame);
el("btn-continue").addEventListener("click", continueGame);

LongplayPause.mount({
  title: "港湾日记",
  statusText: () => `第 ${state.day}/7 天 · 好感 ${totalAff()}`,
  onPause: () => { state.running = false; },
  onResume: () => {
    if (el("overlay").classList.contains("hidden")) state.running = true;
  },
  onContinue: () => {
    if (el("overlay").classList.contains("hidden")) state.running = true;
  },
  onNewGame: () => { save.reset(); newGame(); },
  onClearSave: () => save.reset(),
});

boot().catch((err) => {
  console.error(err);
  showOverlay("加载失败", String(err.message || err), false);
});
