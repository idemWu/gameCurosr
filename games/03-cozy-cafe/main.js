const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const D = PolishDraw;
const A = GameArt;
let PAINTED_BG = null; /* ART_V3_PAINTED_BG */
const juice = PolishJuice.create();
const sfx = PolishAudio.create("03-cozy-cafe");
sfx.mountMuteButton();

const save = LongplaySave.create("03-cozy-cafe", 3);
const el = (id) => document.getElementById(id);

let DATA = null;
let SPR = null;
let last = performance.now();
let steamT = 0;

const S = {
  running: false,
  day: 1,
  gold: 0,
  served: 0,
  today: 0,
  unlocked: 5,
  lv: 1,
  guest: null,
  ended: false,
  feedback: null,
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
function menu() {
  return DATA.drinks.slice(0, S.unlocked);
}
function persist() {
  save.save({
    day: S.day,
    gold: S.gold,
    served: S.served,
    today: S.today,
    unlocked: S.unlocked,
    lv: S.lv,
    ended: S.ended,
  });
}

function hud() {
  el("day").textContent = S.day;
  el("gold").textContent = S.gold;
  el("today").textContent = S.today;
  el("served").textContent = S.served;
  el("rec").textContent = S.unlocked;
  el("lv").textContent = S.lv;
  el("drinks").innerHTML = menu()
    .map((d) => `<button data-id="${d.id}">${d.name}</button>`)
    .join("");
  [...el("drinks").querySelectorAll("button")].forEach((b) => {
    b.onclick = () => serve(b.dataset.id);
  });
  el("order").textContent = S.guest ? `客人要点：${S.guest.name}` : "等待客人…";
  el("upgrade").textContent = S.lv >= 3 ? "店铺已满级" : `升级店铺 (40金) · 当前 Lv${S.lv}`;
  el("upgrade").disabled = S.lv >= 3;
}

function spawn() {
  const m = menu();
  const drink = m[Math.floor(Math.random() * m.length)];
  // FIX: name/id from the same drink object
  S.guest = { id: drink.id, name: drink.name, x: 500, patience: 1 };
  hud();
  sfx.ui();
}

function serve(id) {
  if (!S.running || !S.guest) return;
  if (id !== S.guest.id) {
    juice.float("不是这个…", S.guest.x, 120, "#fca5a5");
    juice.shake(3);
    sfx.fail();
    S.feedback = { text: "客人摇了摇头", t: 1 };
    return;
  }
  const tip = 4 + S.lv + (Math.random() < 0.2 ? 2 : 0);
  S.gold += tip;
  S.served += 1;
  S.today += 1;
  juice.float(`+${tip}金`, S.guest.x, 110, "#fde68a");
  juice.burst(S.guest.x, 140, "#fda4af", 10);
  sfx.ok();
  S.guest = null;
  S.feedback = { text: "完美上菜!", t: 1 };
  if (S.served % 12 === 0 && S.unlocked < DATA.drinks.length) {
    S.unlocked += 1;
    juice.float("新配方!", 240, 40, "#86efac");
    sfx.levelup();
  }
  hud();
  persist();
  checkEnd();
  if (S.today < 8 && !S.ended) {
    setTimeout(() => {
      if (S.running && !S.guest) spawn();
    }, 380);
  }
}

function checkEnd() {
  if (S.day >= 14 && S.served >= (DATA.goalServed || 80) && S.unlocked >= (DATA.goalRecipes || 10)) {
    S.ended = true;
    persist();
    show("暖汤飘香", "十四天的炉火与笑声，咖啡馆成为港湾心灵灯塔。", false);
    sfx.levelup();
  }
}

function endDay() {
  if (!S.running) return;
  if (S.today < 8) {
    el("order").textContent = "今天还没服务满 8 人";
    sfx.fail();
    juice.shake(2);
    return;
  }
  if (S.day >= 14) {
    checkEnd();
    if (!S.ended) {
      el("order").textContent = `还差：服务≥${DATA.goalServed} 且配方≥${DATA.goalRecipes}`;
      sfx.fail();
    }
    return;
  }
  S.day += 1;
  S.today = 0;
  S.guest = null;
  juice.flash("rgba(251,191,36,.18)");
  sfx.pickup();
  spawn();
  persist();
  hud();
}

function upgrade() {
  if (!S.running) return;
  if (S.gold >= 40 && S.lv < 3) {
    S.gold -= 40;
    S.lv += 1;
    juice.float(`店铺 Lv${S.lv}`, 240, 50, "#fbbf24");
    juice.burst(240, 80, "#f59e0b", 14);
    sfx.levelup();
    hud();
    persist();
  } else sfx.fail();
}

function draw() {
  if (PAINTED_BG) { ctx.drawImage(PAINTED_BG, 0, 0, 480, 270); }
  steamT += 0.016;
  A.sky(ctx, 480, 270, "#4a2a1f", "#2a1610", "#1a0e0a");
  // wallpaper stripes
  for (let x = 0; x < 480; x += 28) {
    ctx.fillStyle = x % 56 === 0 ? "rgba(255,200,140,.04)" : "rgba(0,0,0,.04)";
    ctx.fillRect(x, 0, 14, 170);
  }
  // window night/day
  A.panel(ctx, 340, 36, 110, 70, { bg: "rgba(120,180,220,.25)", border: "rgba(255,220,160,.35)", r: 8, bw: 2 });
  // stove
  A.panel(ctx, 20, 70, 150, 100, { bg: S.lv >= 2 ? "#7c2d12" : "#5c2a18", border: "#fbbf24", r: 12 });
  A.panel(ctx, 40, 95, 110, 50, { bg: "#2a1208", border: "rgba(0,0,0,.3)", r: 8, bw: 1 });
  for (let i = 0; i < 3; i++) {
    D.disk(ctx, 70 + i * 20, 88 - ((steamT * 22 + i * 12) % 28), 5, "rgba(255,255,255,.18)");
  }
  if (SPR?.cup) A.drawImage(ctx, SPR.cup, 55, 108, 28, 32);
  // floor + counter
  ctx.fillStyle = "#4a2f24";
  ctx.fillRect(0, 170, 480, 100);
  A.panel(ctx, 170, 155, 290, 48, { bg: "#9a3412", border: "#fbbf24", r: 10 });
  A.panel(ctx, 190, 132, 90, 28, { bg: "#fbbf24", border: "#78350f", r: 8, bw: 1 });
  A.text(ctx, "MENU", 210, 151, { color: "#3b1805", font: "bold 12px sans-serif", shadow: false });
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = "#a8a29e";
    ctx.beginPath();
    ctx.moveTo(220 + i * 70, 0);
    ctx.lineTo(220 + i * 70, 36);
    ctx.stroke();
    const g = ctx.createRadialGradient(220 + i * 70, 42, 0, 220 + i * 70, 42, 18);
    g.addColorStop(0, "rgba(253,230,138,.55)");
    g.addColorStop(1, "rgba(253,230,138,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(220 + i * 70, 42, 18, 0, Math.PI * 2);
    ctx.fill();
    D.disk(ctx, 220 + i * 70, 40, 6, "#fde68a");
  }
  if (S.lv >= 3) {
    D.star(ctx, 420, 50, 8, "#fde68a");
    D.star(ctx, 440, 70, 5, "#fcd34d");
  }
  A.panel(ctx, 10, 8, 200, 28, { bg: "rgba(20,10,6,.75)", border: "rgba(251,191,36,.4)", r: 10, bw: 1 });
  A.text(ctx, `Day ${S.day} · 已服务 ${S.served}`, 20, 27, { color: "#ffedd5", font: "bold 13px sans-serif" });
  if (S.guest) {
    S.guest.x += (300 - S.guest.x) * 0.06;
    if (SPR?.chars) {
      A.shadowEllipse(ctx, S.guest.x, 168, 10, 3);
      A.drawSprite(ctx, SPR.chars, 3 * 64, 0, 64, 96, S.guest.x - 12, 132, 24, 36);
    } else D.person(ctx, S.guest.x, 150, "#fda4af", "#fff7ed");
    A.panel(ctx, S.guest.x - 48, 108, 96, 24, { bg: "rgba(69,26,3,.92)", border: "#fbbf24", r: 8, bw: 1 });
    A.text(ctx, S.guest.name, S.guest.x, 124, { align: "center", color: "#ffedd5", font: "12px sans-serif", shadow: false });
  }
  if (S.feedback) A.text(ctx, S.feedback.text, 300, 50, { color: "#86efac", font: "bold 12px sans-serif" });
  A.vignette(ctx, 480, 270, 0.32);
  A.filmGrain(ctx, 480, 270, steamT, 0.025);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (S.feedback) {
    S.feedback.t -= dt;
    if (S.feedback.t <= 0) S.feedback = null;
  }
  juice.update(dt);
  ctx.save();
  juice.applyShake(ctx);
  draw();
  juice.draw(ctx);
  juice.drawFlash(ctx, 480, 270);
  ctx.restore();
  requestAnimationFrame(loop);
}

el("endday").onclick = endDay;
el("upgrade").onclick = upgrade;
el("btn-start").onclick = () => {
  Object.assign(S, {
    day: 1, gold: 0, served: 0, today: 0, unlocked: 5, lv: 1, ended: false, guest: null,
  });
  spawn();
  persist();
  hide();
};
el("btn-continue").onclick = () => {
  const d = save.load();
  if (!d || d.ended) {
    el("overlay-msg").textContent = "无存档";
    sfx.fail();
    return;
  }
  Object.assign(S, d);
  S.guest = null;
  spawn();
  hide();
};

LongplayPause.mount({
  title: "暖汤咖啡馆",
  statusText: () => `第${S.day}天 服务${S.served}`,
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
  fetch("./content/menu.json").then((r) => r.json()),
  A.loadAll({
    cup: "./art/sprites/cup.png",
    chars: "./art/sprites/harbor_chars.png",
  }),
]).then(([d, sprites]) => {
  DATA = d;
  SPR = sprites;
  const sv = save.load();
  show("暖汤咖啡馆", "按订单上饮料，经营店铺升级。约 12–25 分钟。", !!(sv && !sv.ended));
  if (sv) Object.assign(S, sv);
  hud();
  requestAnimationFrame(loop);
});


/* ART_V3_PAINTED_BG_LOAD */
if (typeof A !== 'undefined' && A.loadImage) {
  A.loadImage('./art/painted/bg_main.png').then((img) => { PAINTED_BG = img; }).catch(() => {});
}
