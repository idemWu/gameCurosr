/* 雾港行者 S0 — combat vertical slice
 * Player FSM: idle/run/dodge(iframes)/light/heavy/parry/hurt/dead
 * Souls-loop: bonfire save, death drops souls, pickup to recover
 */
const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
const save = LongplaySave.create("17-mist-walker", 1);

const K = new Set();
window.addEventListener("keydown", (e) => { K.add(e.key.toLowerCase()); if ([" ", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) e.preventDefault(); });
window.addEventListener("keyup", (e) => K.delete(e.key.toLowerCase()));

let CFG = null, ZONE = null, ENEMY_DEFS = null, BOSS_DEF = null;

const S = {
  running: false,
  cam: 0,
  frame: 0,
  player: null,
  enemies: [],
  boss: null,
  bossActive: false,
  droppedSouls: null, // {x, amount}
  bonfireRested: true,
  ended: false,
};

function newPlayer(spawnX) {
  return {
    x: spawnX, y: 230, vx: 0, face: 1,
    hp: CFG.difficulty.playerBaseHp, maxHp: CFG.difficulty.playerBaseHp,
    st: CFG.difficulty.playerBaseStamina, maxSt: CFG.difficulty.playerBaseStamina,
    stDelay: 0,
    souls: 0, estus: CFG.difficulty.estusStart,
    state: "idle", t: 0, // frames in state
    iframes: 0, parryOpen: 0, hitLanded: false,
  };
}

/* ---------- persistence ---------- */
function persist() {
  const p = S.player;
  save.save({
    souls: p.souls, estus: p.estus, maxHp: p.maxHp,
    bonfire: "z01-gate",
    dropped: S.droppedSouls,
    bossDead: !!(S.boss && S.boss.dead),
    ended: S.ended,
  });
}

/* ---------- enemies ---------- */
function spawnEnemies() {
  S.enemies = ZONE.enemies.map((e) => {
    const d = ENEMY_DEFS[e.type];
    return {
      ...e, def: d, hp: d.hp * (e.elite ? 1 : 1),
      x: e.x, y: 230, face: -1, state: "idle", t: 0, dead: false,
    };
  });
}

function spawnBoss() {
  S.boss = {
    def: BOSS_DEF, x: ZONE.boss.x, y: 230, face: -1,
    hp: BOSS_DEF.hp * CFG.difficulty.bossHpMul,
    maxHp: BOSS_DEF.hp * CFG.difficulty.bossHpMul,
    state: "idle", t: 0, move: null, hits: 0, dead: false,
  };
}

/* ---------- combat helpers ---------- */
function attackBox(entity, range) {
  const w = range, h = 40;
  return { x: entity.face > 0 ? entity.x + 10 : entity.x - 10 - w, y: entity.y - 34, w, h };
}
function bodyBox(e) { return { x: e.x - 9, y: e.y - 36, w: 18, h: 36 }; }
function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function damagePlayer(dmg, srcX) {
  const p = S.player;
  if (p.iframes > 0 || p.state === "dead") return;
  if (p.parryOpen > 0) { // successful parry: no damage, riposte window on nearest attacker
    p.parryOpen = 0;
    p.riposte = 30;
    return;
  }
  p.hp -= dmg * CFG.difficulty.enemyDamageMul / 1.6 * 1.6; // keep raw mul explicit
  p.state = "hurt"; p.t = 0; p.iframes = 20;
  p.x += (p.x < srcX ? -14 : 14);
  if (p.hp <= 0) die();
}

function die() {
  const p = S.player;
  p.state = "dead"; p.hp = 0;
  $("deathflash").classList.remove("hidden");
  // drop souls at death spot (second death loses previous drop)
  S.droppedSouls = p.souls > 0 ? { x: p.x, amount: p.souls } : S.droppedSouls;
  p.souls = 0;
  persist();
  setTimeout(() => {
    $("deathflash").classList.add("hidden");
    respawn();
  }, 1400);
}

function respawn() {
  const keepDrop = S.droppedSouls;
  const keep = { souls: 0, estus: CFG.difficulty.estusStart };
  const bx = ZONE.bonfires[0].x;
  const old = S.player;
  S.player = newPlayer(bx);
  S.player.souls = keep.souls;
  S.player.maxHp = old.maxHp;
  S.droppedSouls = keepDrop;
  spawnEnemies();
  if (S.boss && !S.boss.dead) { spawnBoss(); S.bossActive = false; $("bossbar").classList.add("hidden"); }
  persist();
}

/* ---------- player update ---------- */
function upPlayer() {
  const p = S.player, C = CFG.combat;
  p.t += 1;
  if (p.iframes > 0) p.iframes -= 1;
  if (p.parryOpen > 0) p.parryOpen -= 1;
  if (p.riposte > 0) p.riposte -= 1;
  if (p.stDelay > 0) p.stDelay -= 1; else p.st = Math.min(p.maxSt, p.st + C.staminaRegenPerFrame);

  const busy = ["dodge", "light", "heavy", "parry", "hurt", "dead"].includes(p.state);

  if (!busy) {
    let mv = 0;
    if (K.has("a")) { mv = -1; p.face = -1; }
    if (K.has("d")) { mv = 1; p.face = 1; }
    p.vx = mv * 2.0;
    p.state = mv ? "run" : "idle";

    if (K.has(" ") && p.st >= C.dodge.stamina) { p.state = "dodge"; p.t = 0; p.st -= C.dodge.stamina; p.stDelay = C.staminaRegenDelay; p.iframes = CFG.difficulty.dodgeIframes; }
    else if (K.has("j") && p.st >= C.lightAttack.stamina) { p.state = "light"; p.t = 0; p.st -= C.lightAttack.stamina; p.stDelay = C.staminaRegenDelay; p.hitLanded = false; }
    else if (K.has("k") && p.st >= C.heavyAttack.stamina) { p.state = "heavy"; p.t = 0; p.st -= C.heavyAttack.stamina; p.stDelay = C.staminaRegenDelay; p.hitLanded = false; }
    else if (K.has("l") && p.st >= C.parry.stamina) { p.state = "parry"; p.t = 0; p.st -= C.parry.stamina; p.stDelay = C.staminaRegenDelay; p.parryOpen = CFG.difficulty.parryWindowFrames; }
    else if (K.has("f") && p.estus > 0 && p.hp < p.maxHp) { p.estus -= 1; p.hp = Math.min(p.maxHp, p.hp + 55); K.delete("f"); }
    else if (K.has("e")) interact();
  }

  if (p.state === "dodge") {
    p.vx = p.face * C.dodge.speed;
    if (p.t >= C.dodge.duration) { p.state = "idle"; }
  }
  if (p.state === "light" || p.state === "heavy") {
    const atk = p.state === "light" ? C.lightAttack : C.heavyAttack;
    p.vx = 0;
    if (p.t >= atk.startup && p.t < atk.startup + atk.active && !p.hitLanded) {
      const box = attackBox(p, 34);
      for (const e of S.enemies) {
        if (!e.dead && hit(box, bodyBox(e))) { e.hp -= atk.damage; e.state = "hurt"; e.t = 0; p.hitLanded = true; if (e.hp <= 0) { e.dead = true; p.souls += e.def.souls; } }
      }
      if (S.boss && !S.boss.dead && S.bossActive && hit(box, bodyBox(S.boss))) {
        const mult = p.riposte > 0 ? 2.4 : 1;
        S.boss.hp -= atk.damage * mult; p.hitLanded = true;
        if (S.boss.hp <= 0) bossDown();
      }
    }
    if (p.t >= atk.startup + atk.active + atk.recovery) p.state = "idle";
  }
  if (p.state === "parry" && p.t >= C.parry.recovery) p.state = "idle";
  if (p.state === "hurt" && p.t >= 24) p.state = "idle";
  if (p.state !== "dead") {
    p.x = Math.max(10, Math.min(ZONE.width - 10, p.x + p.vx));
  }
  // boss gate trigger
  if (S.boss && !S.boss.dead && !S.bossActive && p.x > ZONE.boss.gate) {
    S.bossActive = true;
    $("bossbar").classList.remove("hidden");
    $("bossname").textContent = BOSS_DEF.name;
  }
}

function interact() {
  const p = S.player;
  K.delete("e");
  // bonfire
  const bf = ZONE.bonfires[0];
  if (Math.abs(p.x - bf.x) < 24) {
    p.hp = p.maxHp; p.estus = CFG.difficulty.estusStart;
    spawnEnemies();
    persist();
    flash("篝火休息 · 已存档 · 敌人重置");
    return;
  }
  // soul pickup
  if (S.droppedSouls && Math.abs(p.x - S.droppedSouls.x) < 26) {
    p.souls += S.droppedSouls.amount;
    flash(`拾回 ${S.droppedSouls.amount} 魂`);
    S.droppedSouls = null;
    persist();
    return;
  }
  // exit after boss
  if (S.boss && S.boss.dead && Math.abs(p.x - ZONE.exits[0].x) < 30) {
    S.ended = true; persist();
    showOverlay("切片完成", "码头巡守已倒下。S1 将开放沉船腹地与后续 11 区。", false);
  }
}

let flashMsg = null;
function flash(text) { flashMsg = { text, t: 90 }; }

/* ---------- enemy update ---------- */
function upEnemy(e) {
  if (e.dead) return;
  e.t += 1;
  const p = S.player;
  const d = Math.abs(p.x - e.x);
  const dir = p.x > e.x ? 1 : -1;
  if (e.state === "hurt") { if (e.t > 18) { e.state = "idle"; e.t = 0; } return; }
  if (e.state === "attack") {
    const def = e.def;
    if (e.t === def.attackStartup) {
      if (Math.abs(p.x - e.x) < def.attackRange + 8 && p.state !== "dead") damagePlayer(def.damage, e.x);
    }
    if (e.t >= def.attackStartup + def.attackRecovery) { e.state = "idle"; e.t = 0; }
    return;
  }
  if (d < e.def.attackRange) { e.state = "attack"; e.t = 0; e.face = dir; return; }
  if (d < e.def.aggroRange) { e.x += dir * e.def.speed; e.face = dir; }
}

/* ---------- boss update ---------- */
function bossDown() {
  S.boss.dead = true;
  S.player.souls += BOSS_DEF.souls;
  $("bossbar").classList.add("hidden");
  flash(`击破 ${BOSS_DEF.name}！获得 ${BOSS_DEF.souls} 魂。走到区域尽头按 E 离开`);
  persist();
}

function upBoss() {
  const b = S.boss;
  if (!b || b.dead || !S.bossActive) return;
  b.t += 1;
  const p = S.player;
  const phase = b.hp / b.maxHp > 0.5 ? BOSS_DEF.phases[0] : BOSS_DEF.phases[1];
  const spd = (phase.speedMul || 1) * 1.15;
  const d = Math.abs(p.x - b.x);
  const dir = p.x > b.x ? 1 : -1;

  if (b.state === "idle") {
    if (d > 55) { b.x += dir * spd; b.face = dir; }
    else {
      b.move = phase.moves[Math.floor(Math.random() * phase.moves.length)];
      b.state = "attack"; b.t = 0; b.hits = b.move.hits || 1; b.face = dir;
    }
  } else if (b.state === "attack") {
    const m = b.move;
    if (b.t === m.startup) {
      if (Math.abs(p.x - b.x) < m.range + 10 && p.state !== "dead") {
        if (p.parryOpen > 0 && m.parryable) { p.parryOpen = 0; p.riposte = 40; b.state = "stagger"; b.t = 0; flash("弹反成功！处决窗口"); }
        else damagePlayer(m.damage, b.x);
      }
    }
    if (b.t >= m.startup + m.active + (m.hits > 1 && b.hits > 1 ? 0 : m.recovery)) {
      if (m.hits > 1 && b.hits > 1) { b.hits -= 1; b.t = m.startup - 6; }
      else { b.state = "idle"; b.t = 0; }
    }
  } else if (b.state === "stagger") {
    if (b.t > 55) { b.state = "idle"; b.t = 0; }
  }
}

/* ---------- render ---------- */
function draw() {
  const p = S.player;
  S.cam = Math.max(0, Math.min(ZONE.width - 480, p.x - 220));
  // bg
  ctx.fillStyle = "#05070a"; ctx.fillRect(0, 0, 480, 270);
  ctx.fillStyle = "#0d141d";
  for (let i = 0; i < 8; i++) ctx.fillRect(((i * 260 - S.cam * 0.4) % 2000 + 2000) % 2000 - 200, 40 + (i % 3) * 30, 120, 160);
  // fog band
  ctx.fillStyle = "rgba(143,179,199,.06)"; ctx.fillRect(0, 100, 480, 80);
  // ground/platforms
  for (const pl of ZONE.platforms) {
    ctx.fillStyle = "#1c2836";
    ctx.fillRect(pl.x - S.cam, pl.y, pl.w, 270 - pl.y);
  }
  // bonfire
  const bf = ZONE.bonfires[0];
  ctx.fillStyle = "#f97316"; ctx.fillRect(bf.x - S.cam - 3, 214, 6, 12);
  ctx.fillStyle = "#fbbf24"; ctx.fillRect(bf.x - S.cam - 1, 208, 3, 7);
  // dropped souls
  if (S.droppedSouls) {
    ctx.fillStyle = "#a3e635";
    ctx.beginPath(); ctx.arc(S.droppedSouls.x - S.cam, 220, 6, 0, Math.PI * 2); ctx.fill();
  }
  // exit door
  if (S.boss && S.boss.dead) { ctx.fillStyle = "#eab308"; ctx.fillRect(ZONE.exits[0].x - S.cam - 6, 190, 12, 40); }
  // enemies
  for (const e of S.enemies) {
    if (e.dead) continue;
    ctx.fillStyle = e.state === "attack" && e.t >= e.def.attackStartup - 6 ? "#fecaca" : e.def.color;
    ctx.fillRect(e.x - S.cam - 9, e.y - 36, 18, 36);
  }
  // boss
  if (S.boss && !S.boss.dead) {
    const b = S.boss;
    ctx.fillStyle = b.state === "stagger" ? "#fde68a" : (b.state === "attack" && b.t >= (b.move ? b.move.startup - 8 : 99) ? "#f87171" : "#7f1d1d");
    ctx.fillRect(b.x - S.cam - 16, b.y - 56, 32, 56);
  }
  // player
  if (p.state !== "dead") {
    ctx.fillStyle = p.iframes > 0 ? "rgba(229,236,242,.5)" : (p.riposte > 0 ? "#fde68a" : "#e5ecf2");
    ctx.fillRect(p.x - S.cam - 9, p.y - 36, 18, 36);
    // weapon swing hint
    if (p.state === "light" || p.state === "heavy") {
      ctx.fillStyle = "#8fb3c7";
      const box = attackBox(p, 34);
      ctx.fillRect(box.x - S.cam, box.y, box.w, 4);
    }
  }
  // flash text
  if (flashMsg) {
    ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(40, 18, 400, 26);
    ctx.fillStyle = "#f8fafc"; ctx.font = "12px sans-serif";
    ctx.fillText(flashMsg.text, 52, 35);
    flashMsg.t -= 1; if (flashMsg.t <= 0) flashMsg = null;
  }
}

function hud() {
  const p = S.player;
  $("hpfill").style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
  $("stfill").style.width = `${Math.max(0, p.st / p.maxSt) * 100}%`;
  $("souls").textContent = String(p.souls);
  $("estus").textContent = String(p.estus);
  $("zone").textContent = ZONE.name;
  if (S.boss && S.bossActive && !S.boss.dead) $("bossfill").style.width = `${(S.boss.hp / S.boss.maxHp) * 100}%`;
}

/* ---------- overlay ---------- */
function showOverlay(title, msg, canContinue) {
  $("overlay-title").textContent = title;
  $("overlay-msg").textContent = msg;
  $("btn-continue").style.display = canContinue ? "block" : "none";
  $("overlay").classList.remove("hidden");
  S.running = false;
}
function hideOverlay() { $("overlay").classList.add("hidden"); S.running = true; }

/* ---------- boot ---------- */
function newGame() {
  S.player = newPlayer(ZONE.bonfires[0].x);
  S.droppedSouls = null;
  S.ended = false;
  spawnEnemies();
  spawnBoss();
  S.bossActive = false;
  persist();
  hideOverlay();
}
function continueGame() {
  const d = save.load();
  if (!d || d.ended) { $("overlay-msg").textContent = "没有可继续的存档。"; return; }
  S.player = newPlayer(ZONE.bonfires[0].x);
  S.player.souls = d.souls || 0;
  S.player.maxHp = d.maxHp || S.player.maxHp;
  S.droppedSouls = d.dropped || null;
  spawnEnemies();
  spawnBoss();
  if (d.bossDead) S.boss.dead = true;
  hideOverlay();
}

$("btn-start").addEventListener("click", newGame);
$("btn-continue").addEventListener("click", continueGame);

function loop() {
  if (S.running) {
    S.frame += 1;
    upPlayer();
    for (const e of S.enemies) upEnemy(e);
    upBoss();
    hud();
  }
  draw();
  requestAnimationFrame(loop);
}

Promise.all([
  fetch("./content/config.json").then((r) => r.json()),
  fetch("./content/zones/z01-mist-dock.json").then((r) => r.json()),
  fetch("./content/enemies.json").then((r) => r.json()),
  fetch("./content/bosses/b01_dock_warden.json").then((r) => r.json()),
]).then(([cfg, zone, enemies, boss]) => {
  CFG = cfg; ZONE = zone; ENEMY_DEFS = enemies; BOSS_DEF = boss;
  const d = save.load();
  S.player = newPlayer(zone.bonfires[0].x);
  spawnEnemies();
  spawnBoss();
  showOverlay(
    "雾港行者 · S0 战斗切片",
    "高难度魂类：体力管理、10帧无敌翻滚、8帧弹反。击败「码头巡守」。死亡掉魂，可原地拾回。",
    !!(d && !d.ended)
  );
  loop();
});
