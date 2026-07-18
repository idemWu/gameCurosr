/* 雾港行者 S1 — multi-zone souls engine
 * Zones z01-z03, bosses b01-b04 (incl. optional mid-boss), vendor + level-up at bonfire.
 */
const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
const save = LongplaySave.create("17-mist-walker", 2);

const ZONE_FILES = {
  z01: "./content/zones/z01-mist-dock.json",
  z02: "./content/zones/z02-wreck.json",
  z03: "./content/zones/z03-lighthouse.json",
};
const BOSS_FILES = {
  b01_dock_warden: "./content/bosses/b01_dock_warden.json",
  b02_wreck_maw: "./content/bosses/b02_wreck_maw.json",
  b03_shade_walker: "./content/bosses/b03_shade_walker.json",
  b04_twin_lampkeepers: "./content/bosses/b04_twin_lampkeepers.json",
};
const S1_FINAL_BOSS = "b04_twin_lampkeepers";

const K = new Set();
window.addEventListener("keydown", (e) => {
  K.add(e.key.toLowerCase());
  if ([" ", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener("keyup", (e) => K.delete(e.key.toLowerCase()));

let CFG = null, ENEMY_DEFS = null;
const ZONES = {}, BOSSES = {};

const S = {
  running: false,
  cam: 0,
  zoneId: "z01",
  player: null,
  enemies: [],
  projectiles: [],
  bosses: [], // active boss instances in zone
  droppedSouls: null, // {zone,x,amount}
  bossesDead: {},
  stats: { vigor: 0, endurance: 0, strength: 0 },
  charms: [],
  estusMax: 3,
  knives: 0,
  menu: null, // 'bonfire' | null
  menuIdx: 0,
  ended: false,
};

const zone = () => ZONES[S.zoneId];

function derived() {
  return {
    maxHp: CFG.difficulty.playerBaseHp + S.stats.vigor * CFG.leveling.stats.vigor.hpPer,
    maxSt: CFG.difficulty.playerBaseStamina + S.stats.endurance * CFG.leveling.stats.endurance.stPer,
    dmgBonus: S.stats.strength * CFG.leveling.stats.strength.dmgPer,
    defMul: S.charms.includes("charm_iron") ? 0.9 : 1,
  };
}

function newPlayer(spawnX) {
  const d = derived();
  return {
    x: spawnX, y: 230, vx: 0, face: 1,
    hp: d.maxHp, maxHp: d.maxHp, st: d.maxSt, maxSt: d.maxSt, stDelay: 0,
    souls: 0, estus: S.estusMax,
    state: "idle", t: 0, iframes: 0, parryOpen: 0, riposte: 0, hitLanded: false,
  };
}

function levelCost() {
  const lv = S.stats.vigor + S.stats.endurance + S.stats.strength;
  return Math.floor(CFG.leveling.baseCost * Math.pow(CFG.leveling.costGrowth, lv));
}

/* ---------- persistence ---------- */
function persist() {
  const p = S.player;
  save.save({
    zoneId: S.zoneId, souls: p.souls, stats: S.stats, charms: S.charms,
    estusMax: S.estusMax, knives: S.knives,
    dropped: S.droppedSouls, bossesDead: S.bossesDead, ended: S.ended,
  });
}
function restore(d) {
  S.zoneId = d.zoneId || "z01";
  S.stats = d.stats || S.stats;
  S.charms = d.charms || [];
  S.estusMax = d.estusMax || 3;
  S.knives = d.knives || 0;
  S.droppedSouls = d.dropped || null;
  S.bossesDead = d.bossesDead || {};
  S.ended = !!d.ended;
  enterZone(S.zoneId, null, d.souls || 0);
}

/* ---------- zone lifecycle ---------- */
function spawnEnemies() {
  S.enemies = zone().enemies.map((e) => ({
    ...e, def: ENEMY_DEFS[e.type], hp: ENEMY_DEFS[e.type].hp,
    x: e.x, y: 230, face: -1, state: "idle", t: 0, dead: false, shotCd: 0,
  }));
  S.projectiles = [];
}
function spawnBosses() {
  S.bosses = [];
  const defs = [];
  if (zone().boss) defs.push(zone().boss);
  if (zone().midBoss) defs.push(zone().midBoss);
  for (const slot of defs) {
    if (S.bossesDead[slot.id]) continue;
    const def = BOSSES[slot.id];
    S.bosses.push({
      slot, def, x: slot.x, y: 230, face: -1,
      hp: def.hp * CFG.difficulty.bossHpMul, maxHp: def.hp * CFG.difficulty.bossHpMul,
      state: "idle", t: 0, move: null, hits: 0, active: false, dead: false,
    });
  }
}
function enterZone(zoneId, spawnX, souls) {
  S.zoneId = zoneId;
  const bf = zone().bonfires[0];
  const keepSouls = souls != null ? souls : (S.player ? S.player.souls : 0);
  S.player = newPlayer(spawnX != null ? spawnX : bf.x);
  S.player.souls = keepSouls;
  spawnEnemies();
  spawnBosses();
  $("bossbar").classList.add("hidden");
  persist();
}

/* ---------- combat ---------- */
function attackBox(entity, range) {
  const w = range;
  return { x: entity.face > 0 ? entity.x + 10 : entity.x - 10 - w, y: entity.y - 34, w, h: 40 };
}
function bodyBox(e, tall) { const h = tall ? 56 : 36; return { x: e.x - 9, y: e.y - h, w: 18, h }; }
function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function damagePlayer(dmg, srcX) {
  const p = S.player;
  if (p.iframes > 0 || p.state === "dead") return;
  if (p.parryOpen > 0) { p.parryOpen = 0; p.riposte = 40; flash("弹反成功！"); return; }
  p.hp -= dmg * derived().defMul;
  p.state = "hurt"; p.t = 0; p.iframes = 20;
  p.x += (p.x < srcX ? -14 : 14);
  if (p.hp <= 0) die();
}

function die() {
  const p = S.player;
  p.state = "dead"; p.hp = 0;
  $("deathflash").classList.remove("hidden");
  if (p.souls > 0) S.droppedSouls = { zone: S.zoneId, x: p.x, amount: p.souls };
  p.souls = 0;
  persist();
  setTimeout(() => { $("deathflash").classList.add("hidden"); respawn(); }, 1400);
}
function respawn() {
  const bf = zone().bonfires[0];
  const souls = 0;
  S.player = newPlayer(bf.x);
  S.player.souls = souls;
  spawnEnemies();
  spawnBosses();
  persist();
}

/* ---------- player ---------- */
function playerAttackHits(atk) {
  const p = S.player;
  const dmg = atk.damage + derived().dmgBonus;
  const box = attackBox(p, 34);
  for (const e of S.enemies) {
    if (!e.dead && hit(box, bodyBox(e))) {
      e.hp -= dmg; e.state = "hurt"; e.t = 0; p.hitLanded = true;
      if (e.hp <= 0) { e.dead = true; p.souls += e.def.souls; }
    }
  }
  for (const b of S.bosses) {
    if (!b.dead && b.active && hit(box, bodyBox(b, true))) {
      const mult = p.riposte > 0 ? 2.4 : 1;
      b.hp -= dmg * mult; p.hitLanded = true;
      if (b.hp <= 0) bossDown(b);
    }
  }
}

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
    else if (K.has("q") && S.knives > 0) { K.delete("q"); S.knives -= 1; S.projectiles.push({ x: p.x, y: p.y - 26, vx: p.face * 5, from: "player", dmg: 26 }); }
    else if (K.has("e")) interact();
  }

  if (p.state === "dodge") { p.vx = p.face * C.dodge.speed; if (p.t >= C.dodge.duration) p.state = "idle"; }
  if (p.state === "light" || p.state === "heavy") {
    const atk = p.state === "light" ? C.lightAttack : C.heavyAttack;
    p.vx = 0;
    if (p.t >= atk.startup && p.t < atk.startup + atk.active && !p.hitLanded) playerAttackHits(atk);
    if (p.t >= atk.startup + atk.active + atk.recovery) p.state = "idle";
  }
  if (p.state === "parry" && p.t >= C.parry.recovery) p.state = "idle";
  if (p.state === "hurt" && p.t >= 24) p.state = "idle";
  if (p.state !== "dead") p.x = Math.max(10, Math.min(zone().width - 10, p.x + p.vx));

  // boss gates
  for (const b of S.bosses) {
    if (!b.dead && !b.active && p.x > b.slot.gate && (!b.slot.optional || Math.abs(p.x - b.x) < 260)) {
      b.active = true;
      $("bossbar").classList.remove("hidden");
      $("bossname").textContent = b.def.name;
    }
  }
}

/* ---------- interactions ---------- */
let flashMsg = null;
function flash(text) { flashMsg = { text, t: 100 }; }

function interact() {
  K.delete("e");
  const p = S.player;
  const bf = zone().bonfires[0];
  if (Math.abs(p.x - bf.x) < 24) { openBonfire(); return; }
  if (S.droppedSouls && S.droppedSouls.zone === S.zoneId && Math.abs(p.x - S.droppedSouls.x) < 26) {
    p.souls += S.droppedSouls.amount;
    flash(`拾回 ${S.droppedSouls.amount} 魂`);
    S.droppedSouls = null;
    persist();
    return;
  }
  for (const ex of zone().exits) {
    if (Math.abs(p.x - ex.x) < 30) {
      if (ex.requiresBoss && !S.bossesDead[ex.requiresBoss]) { flash("浓雾封路——先击败本区首领"); return; }
      if (!ex.to || !ZONES[ex.to]) {
        if (S.bossesDead[S1_FINAL_BOSS]) { S.ended = true; persist(); showOverlay("S1 完成", "灯塔崖之后的旧城地窖将在 S2 开放。", false); }
        return;
      }
      const target = ZONES[ex.to];
      const spawnX = ex.x < 100 ? target.width - 80 : 80;
      enterZone(ex.to, spawnX);
      flash(`进入 ${target.name}`);
      return;
    }
  }
}

/* ---------- bonfire menu ---------- */
function bonfireOptions() {
  const opts = [
    { id: "rest", label: `休息（回满 · 存档 · 敌人重置）` },
    { id: "level", label: `升级（当前消耗 ${levelCost()} 魂）` },
  ];
  if (CFG.vendor.zone === S.zoneId) {
    for (const it of CFG.vendor.items) {
      const owned = it.id === "estus_up" ? S.estusMax - 3 : (it.id === "charm_iron" ? (S.charms.includes("charm_iron") ? 1 : 0) : 0);
      if (it.max && owned >= it.max) continue;
      opts.push({ id: `buy:${it.id}`, label: `购买 ${it.name}（${it.cost} 魂）` });
    }
  }
  opts.push({ id: "close", label: "离开" });
  return opts;
}
function openBonfire() { S.menu = "bonfire"; S.menuIdx = 0; }
function bonfireAct(optId) {
  const p = S.player;
  if (optId === "rest") {
    const d = derived();
    p.maxHp = d.maxHp; p.maxSt = d.maxSt;
    p.hp = p.maxHp; p.st = p.maxSt; p.estus = S.estusMax;
    spawnEnemies();
    persist();
    flash("篝火休息 · 已存档");
    S.menu = null;
  } else if (optId === "level") {
    if (p.souls >= levelCost()) {
      p.souls -= levelCost();
      // cycle stat by menu shift: simple: prompt-like rotation vigor->endurance->strength
      const order = ["vigor", "endurance", "strength"];
      const pick = order[(S.stats.vigor + S.stats.endurance + S.stats.strength) % 3];
      S.stats[pick] += 1;
      const d = derived();
      p.maxHp = d.maxHp; p.maxSt = d.maxSt;
      flash(`${CFG.leveling.stats[pick].name} +1`);
      persist();
    } else flash("魂不足");
  } else if (optId.startsWith("buy:")) {
    const it = CFG.vendor.items.find((x) => `buy:${x.id}` === optId);
    if (p.souls >= it.cost) {
      p.souls -= it.cost;
      if (it.id === "estus_up") { S.estusMax += 1; p.estus = S.estusMax; }
      if (it.id === "throwing_knife") S.knives += 5;
      if (it.id === "charm_iron") S.charms.push("charm_iron");
      flash(`获得 ${it.name}`);
      persist();
    } else flash("魂不足");
  } else if (optId === "close") S.menu = null;
}
function upMenu() {
  const opts = bonfireOptions();
  if (K.has("w") || K.has("arrowup")) { K.delete("w"); K.delete("arrowup"); S.menuIdx = (S.menuIdx + opts.length - 1) % opts.length; }
  if (K.has("s") || K.has("arrowdown")) { K.delete("s"); K.delete("arrowdown"); S.menuIdx = (S.menuIdx + 1) % opts.length; }
  if (K.has("e") || K.has("enter")) { K.delete("e"); K.delete("enter"); bonfireAct(opts[Math.min(S.menuIdx, opts.length - 1)].id); }
  if (K.has("escape")) { K.delete("escape"); S.menu = null; }
}

/* ---------- enemies ---------- */
function upEnemy(e) {
  if (e.dead) return;
  e.t += 1;
  const p = S.player;
  const d = Math.abs(p.x - e.x);
  const dir = p.x > e.x ? 1 : -1;
  if (e.state === "hurt") { if (e.t > 18) { e.state = "idle"; e.t = 0; } return; }
  if (e.def.ranged) {
    if (d < e.def.aggroRange && d > 60) {
      e.face = dir;
      if (e.shotCd <= 0) { S.projectiles.push({ x: e.x, y: e.y - 26, vx: dir * 3.2, from: "enemy", dmg: e.def.damage }); e.shotCd = 90; }
    }
    if (e.shotCd > 0) e.shotCd -= 1;
    return;
  }
  if (e.state === "attack") {
    if (e.t === e.def.attackStartup && Math.abs(p.x - e.x) < e.def.attackRange + 8 && p.state !== "dead") damagePlayer(e.def.damage, e.x);
    if (e.t >= e.def.attackStartup + e.def.attackRecovery) { e.state = "idle"; e.t = 0; }
    return;
  }
  if (d < e.def.attackRange) { e.state = "attack"; e.t = 0; e.face = dir; return; }
  if (d < e.def.aggroRange) { e.x += dir * e.def.speed; e.face = dir; }
}

function upProjectiles() {
  const p = S.player;
  for (const pr of S.projectiles) {
    pr.x += pr.vx;
    if (pr.from === "enemy" && hit({ x: pr.x - 4, y: pr.y - 3, w: 8, h: 6 }, bodyBox(p))) { damagePlayer(pr.dmg, pr.x - pr.vx * 10); pr.dead = true; }
    if (pr.from === "player") {
      for (const e of S.enemies) if (!e.dead && hit({ x: pr.x - 4, y: pr.y - 3, w: 8, h: 6 }, bodyBox(e))) { e.hp -= pr.dmg; pr.dead = true; if (e.hp <= 0) { e.dead = true; p.souls += e.def.souls; } }
      for (const b of S.bosses) if (!b.dead && b.active && hit({ x: pr.x - 4, y: pr.y - 3, w: 8, h: 6 }, bodyBox(b, true))) { b.hp -= pr.dmg; pr.dead = true; if (b.hp <= 0) bossDown(b); }
    }
  }
  S.projectiles = S.projectiles.filter((pr) => !pr.dead && pr.x > -20 && pr.x < zone().width + 20);
}

/* ---------- bosses ---------- */
function bossDown(b) {
  b.dead = true;
  S.bossesDead[b.slot.id] = true;
  S.player.souls += b.def.souls;
  if (!S.bosses.some((x) => x.active && !x.dead)) $("bossbar").classList.add("hidden");
  flash(`击破 ${b.def.name}！+${b.def.souls} 魂`);
  persist();
}
function upBoss(b) {
  if (b.dead || !b.active) return;
  b.t += 1;
  const p = S.player;
  const ratio = b.hp / b.maxHp;
  const phase = b.def.phases.find((ph) => ratio > ph.hpAbove) || b.def.phases[b.def.phases.length - 1];
  const spd = (phase.speedMul || 1) * 1.15;
  const d = Math.abs(p.x - b.x);
  const dir = p.x > b.x ? 1 : -1;

  if (b.state === "idle") {
    if (d > 55) { b.x += dir * spd; b.face = dir; }
    else { b.move = phase.moves[Math.floor(Math.random() * phase.moves.length)]; b.state = "attack"; b.t = 0; b.hits = b.move.hits || 1; b.face = dir; }
  } else if (b.state === "attack") {
    const m = b.move;
    if (m.teleport && b.t === m.startup) {
      b.x = p.x + (Math.random() < 0.5 ? -70 : 70);
      b.x = Math.max(30, Math.min(zone().width - 30, b.x));
    } else if (b.t === m.startup) {
      if (Math.abs(p.x - b.x) < m.range + 10 && p.state !== "dead") {
        if (p.parryOpen > 0 && m.parryable) { p.parryOpen = 0; p.riposte = 40; b.state = "stagger"; b.t = 0; flash("弹反成功！处决窗口"); }
        else damagePlayer(m.damage, b.x);
      }
    }
    if (b.t >= m.startup + m.active + ((m.hits || 1) > 1 && b.hits > 1 ? 0 : m.recovery)) {
      if ((m.hits || 1) > 1 && b.hits > 1) { b.hits -= 1; b.t = m.startup - 6; }
      else { b.state = "idle"; b.t = 0; }
    }
  } else if (b.state === "stagger") {
    if (b.t > 55) { b.state = "idle"; b.t = 0; }
  }
}

/* ---------- render ---------- */
function draw() {
  const p = S.player;
  const Z = zone();
  S.cam = Math.max(0, Math.min(Z.width - 480, p.x - 220));
  ctx.fillStyle = "#05070a"; ctx.fillRect(0, 0, 480, 270);
  ctx.fillStyle = "#0d141d";
  for (let i = 0; i < 8; i++) ctx.fillRect(((i * 260 - S.cam * 0.4) % 2400 + 2400) % 2400 - 200, 40 + (i % 3) * 30, 120, 160);
  ctx.fillStyle = "rgba(143,179,199,.06)"; ctx.fillRect(0, 100, 480, 80);
  for (const pl of Z.platforms) { ctx.fillStyle = "#1c2836"; ctx.fillRect(pl.x - S.cam, pl.y, pl.w, 270 - pl.y); }

  const bf = Z.bonfires[0];
  ctx.fillStyle = "#f97316"; ctx.fillRect(bf.x - S.cam - 3, 214, 6, 12);
  ctx.fillStyle = "#fbbf24"; ctx.fillRect(bf.x - S.cam - 1, 208, 3, 7);

  for (const ex of Z.exits) {
    const locked = ex.requiresBoss && !S.bossesDead[ex.requiresBoss];
    ctx.fillStyle = locked ? "#475569" : "#eab308";
    ctx.fillRect(ex.x - S.cam - 6, 190, 12, 40);
  }

  if (S.droppedSouls && S.droppedSouls.zone === S.zoneId) {
    ctx.fillStyle = "#a3e635";
    ctx.beginPath(); ctx.arc(S.droppedSouls.x - S.cam, 220, 6, 0, Math.PI * 2); ctx.fill();
  }

  for (const e of S.enemies) {
    if (e.dead) continue;
    ctx.fillStyle = e.state === "attack" && e.t >= e.def.attackStartup - 6 ? "#fecaca" : e.def.color;
    ctx.fillRect(e.x - S.cam - 9, e.y - 36, 18, 36);
  }
  for (const pr of S.projectiles) { ctx.fillStyle = pr.from === "enemy" ? "#f87171" : "#93c5fd"; ctx.fillRect(pr.x - S.cam - 4, pr.y - 3, 8, 6); }
  for (const b of S.bosses) {
    if (b.dead) continue;
    ctx.fillStyle = b.state === "stagger" ? "#fde68a" : (b.state === "attack" && b.move && b.t >= b.move.startup - 8 ? "#f87171" : "#7f1d1d");
    ctx.fillRect(b.x - S.cam - 16, b.y - 56, 32, 56);
  }
  if (p.state !== "dead") {
    ctx.fillStyle = p.iframes > 0 ? "rgba(229,236,242,.5)" : (p.riposte > 0 ? "#fde68a" : "#e5ecf2");
    ctx.fillRect(p.x - S.cam - 9, p.y - 36, 18, 36);
    if (p.state === "light" || p.state === "heavy") {
      ctx.fillStyle = "#8fb3c7";
      const box = attackBox(p, 34);
      ctx.fillRect(box.x - S.cam, box.y, box.w, 4);
    }
  }
  if (flashMsg) {
    ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(30, 18, 420, 26);
    ctx.fillStyle = "#f8fafc"; ctx.font = "12px sans-serif";
    ctx.fillText(flashMsg.text, 42, 35);
    flashMsg.t -= 1; if (flashMsg.t <= 0) flashMsg = null;
  }
  if (S.menu === "bonfire") {
    const opts = bonfireOptions();
    ctx.fillStyle = "rgba(3,7,12,.88)"; ctx.fillRect(90, 50, 300, 40 + opts.length * 22);
    ctx.fillStyle = "#fbbf24"; ctx.font = "13px sans-serif";
    ctx.fillText(`篝火 · 魂 ${p.souls} · V${S.stats.vigor}/E${S.stats.endurance}/S${S.stats.strength}`, 104, 72);
    opts.forEach((o, i) => {
      ctx.fillStyle = i === S.menuIdx ? "#f8fafc" : "#7c8ea0";
      ctx.fillText(`${i === S.menuIdx ? "▶ " : "   "}${o.label}`, 104, 94 + i * 22);
    });
  }
}

function hud() {
  const p = S.player;
  $("hpfill").style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
  $("stfill").style.width = `${Math.max(0, p.st / p.maxSt) * 100}%`;
  $("souls").textContent = String(p.souls);
  $("estus").textContent = `${p.estus}/${S.estusMax}${S.knives ? " · 刀" + S.knives : ""}`;
  $("zone").textContent = zone().name;
  const ab = S.bosses.find((b) => b.active && !b.dead);
  if (ab) $("bossfill").style.width = `${(ab.hp / ab.maxHp) * 100}%`;
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

function newGame() {
  save.reset();
  S.stats = { vigor: 0, endurance: 0, strength: 0 };
  S.charms = []; S.estusMax = 3; S.knives = 0;
  S.bossesDead = {}; S.droppedSouls = null; S.ended = false;
  enterZone("z01", null, 0);
  hideOverlay();
}
function continueGame() {
  const d = save.load();
  if (!d || d.ended) { $("overlay-msg").textContent = "没有可继续的存档。"; return; }
  restore(d);
  hideOverlay();
}
$("btn-start").addEventListener("click", newGame);
$("btn-continue").addEventListener("click", continueGame);

function loop() {
  if (S.running) {
    if (S.menu) upMenu();
    else {
      upPlayer();
      for (const e of S.enemies) upEnemy(e);
      for (const b of S.bosses) upBoss(b);
      upProjectiles();
    }
    hud();
  }
  draw();
  requestAnimationFrame(loop);
}

/* ---------- boot ---------- */
async function boot() {
  const [cfg, enemies] = await Promise.all([
    fetch("./content/config.json").then((r) => r.json()),
    fetch("./content/enemies.json").then((r) => r.json()),
  ]);
  CFG = cfg; ENEMY_DEFS = enemies;
  await Promise.all(Object.entries(ZONE_FILES).map(async ([id, f]) => { ZONES[id] = await fetch(f).then((r) => r.json()); }));
  await Promise.all(Object.entries(BOSS_FILES).map(async ([id, f]) => { BOSSES[id] = await fetch(f).then((r) => r.json()); }));
  const d = save.load();
  S.player = newPlayer(ZONES.z01.bonfires[0].x);
  S.zoneId = "z01";
  spawnEnemies();
  spawnBosses();
  showOverlay(
    "雾港行者 · S1",
    "三区互联：雾码头→沉船腹地→灯塔崖。篝火可升级与购物（E 打开菜单，W/S 选择）。隐藏中Boss「影子行者」。",
    !!(d && !d.ended)
  );
  loop();
}
boot();
