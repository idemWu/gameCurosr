const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const D = PolishDraw;
const juice = PolishJuice.create();
const sfx = PolishAudio.create("03-cozy-cafe");
sfx.mountMuteButton();

const save = LongplaySave.create("03-cozy-cafe", 3);
const el = (id) => document.getElementById(id);

let DATA = null;
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
  steamT += 0.016;
  D.softBg(ctx, 480, 270, "#3b261f", "#1c100c");
  // wall decor by level
  D.fillRoundRect(ctx, 0, 170, 480, 100, 0, "#5b3a2e");
  D.fillRoundRect(ctx, 20, 70, 140, 90, 10, S.lv >= 2 ? "#7c2d12" : "#6b3e2e");
  D.fillRoundRect(ctx, 40, 90, 100, 50, 8, "#451a03");
  // steam
  for (let i = 0; i < 3; i++) {
    D.disk(
      ctx,
      70 + i * 18,
      80 - ((steamT * 20 + i * 10) % 30),
      4,
      "rgba(255,255,255,.15)"
    );
  }
  // counter
  D.fillRoundRect(ctx, 180, 160, 280, 40, 8, "#9a3412");
  D.fillRoundRect(ctx, 190, 140, 80, 24, 6, "#fbbf24");
  if (S.lv >= 3) {
    D.star(ctx, 420, 50, 8, "#fde68a");
    D.star(ctx, 440, 70, 5, "#fcd34d");
  }
  // hanging lights
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = "#78716c";
    ctx.beginPath();
    ctx.moveTo(220 + i * 70, 0);
    ctx.lineTo(220 + i * 70, 36);
    ctx.stroke();
    D.disk(ctx, 220 + i * 70, 40, 7, "#fde68a");
  }

  ctx.fillStyle = "#ffedd5";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`Day ${S.day} · 已服务 ${S.served}`, 16, 24);

  if (S.guest) {
    S.guest.x += (300 - S.guest.x) * 0.06;
    D.person(ctx, S.guest.x, 150, "#fda4af", "#fff7ed");
    D.bubble(ctx, S.guest.name, S.guest.x, 118, { bg: "rgba(69,26,3,.92)", fg: "#ffedd5" });
  }
  if (S.feedback) {
    ctx.fillStyle = "#86efac";
    ctx.font = "12px sans-serif";
    ctx.fillText(S.feedback.text, 300, 50);
  }
  D.vignette(ctx, 480, 270, 0.28);
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

fetch("./content/menu.json")
  .then((r) => r.json())
  .then((d) => {
    DATA = d;
    const sv = save.load();
    show("暖汤咖啡馆", "按订单上饮料，经营店铺升级。约 12–25 分钟。", !!(sv && !sv.ended));
    if (sv) Object.assign(S, sv);
    hud();
    requestAnimationFrame(loop);
  });
