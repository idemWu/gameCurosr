/* 雾港行者 S1 — multi-zone souls engine
 * Zones z01-z03, bosses b01-b04 (incl. optional mid-boss), vendor + level-up at bonfire.
 */
import { loadHandPaintedArt } from "./src/art/assets.js";
import { drawFrame, playerFrame, enemyFrame, bossFrame } from "./src/art/sprite-renderer.js";
import { drawHandPaintedScene } from "./src/art/background-renderer.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
const save = LongplaySave.create("17-mist-walker", 2);

const ZONE_FILES = {
  z01: "./content/zones/z01-mist-dock.json",
  z02: "./content/zones/z02-wreck.json",
  z03: "./content/zones/z03-lighthouse.json",
  z04: "./content/zones/z04.json",
  z05: "./content/zones/z05.json",
  z06: "./content/zones/z06.json",
  z07: "./content/zones/z07.json",
  z08: "./content/zones/z08.json",
  z09: "./content/zones/z09.json",
  z10: "./content/zones/z10.json",
  z11: "./content/zones/z11.json",
  z12: "./content/zones/z12.json",
};
const BOSS_FILES = {
  b01_dock_warden: "./content/bosses/b01_dock_warden.json",
  b02_wreck_maw: "./content/bosses/b02_wreck_maw.json",
  b03_shade_walker: "./content/bosses/b03_shade_walker.json",
  b04_twin_lampkeepers: "./content/bosses/b04_twin_lampkeepers.json",
  b05_cellar_keeper: "./content/bosses/b05_cellar_keeper.json",
  b06_salt_matriarch: "./content/bosses/b06_salt_matriarch.json",
  b07_nameless_knight: "./content/bosses/b07_nameless_knight.json",
  b08_bell_bishop: "./content/bosses/b08_bell_bishop.json",
  b09_drowned_choir: "./content/bosses/b09_drowned_choir.json",
  b10_penitent_giant: "./content/bosses/b10_penitent_giant.json",
  b11_mist_hag: "./content/bosses/b11_mist_hag.json",
  b12_tide_general: "./content/bosses/b12_tide_general.json",
  b13_black_banner: "./content/bosses/b13_black_banner.json",
  b14_star_carrion: "./content/bosses/b14_star_carrion.json",
  b15_abyss_priest: "./content/bosses/b15_abyss_priest.json",
  b16_forgotten_walker: "./content/bosses/b16_forgotten_walker.json",
  b17_throne_herald: "./content/bosses/b17_throne_herald.json",
  b18_drowned_god: "./content/bosses/b18_drowned_god.json",
};
const FINAL_BOSS = "b18_drowned_god";

const K = new Set();
window.addEventListener("keydown", (e) => {
  K.add(e.key.toLowerCase());
  if ([" ", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener("keyup", (e) => K.delete(e.key.toLowerCase()));

let CFG = null, ENEMY_DEFS = null;
let HAND_ART = { ready: false, assets: {} };
const ZONES = {}, BOSSES = {};

const S = {
  running: false,
  cam: 0,
  particles: [],
  zoneId: "z01",
  player: null,
  enemies: [],
  projectiles: [],
  bosses: [], // active boss instances in zone
  droppedSouls: null, // {zone,x,amount}
  bossesDead: {},
  stats: { vigor: 0, endurance: 0, strength: 0 },
  charms: [],
  skills: [],
  estusMax: 3,
  knives: 0,
  menu: null, // 'bonfire' | null
  menuIdx: 0,
  ngPlus: 0,
  ending: null,
  towerBest: 0,
  ended: false,
};

const zone = () => ZONES[S.zoneId];

function hasSkill(id) { return S.skills.includes(id); }
function derived() {
  return {
    maxHp: CFG.difficulty.playerBaseHp + S.stats.vigor * CFG.leveling.stats.vigor.hpPer,
    maxSt: CFG.difficulty.playerBaseStamina + S.stats.endurance * CFG.leveling.stats.endurance.stPer,
    dmgBonus: S.stats.strength * CFG.leveling.stats.strength.dmgPer,
    defMul: S.charms.includes("charm_iron") ? 0.9 : 1,
    moveMul: S.charms.includes("charm_swift") ? 1.15 : 1,
    parryWindow: CFG.difficulty.parryWindowFrames + (hasSkill("sk_parry_window") ? 3 : 0),
    estusHeal: 55 + (hasSkill("sk_estus_potency") ? 25 : 0),
    dodgeMul: hasSkill("sk_dodge_dist") ? 1.2 : 1,
    stRegenMul: hasSkill("sk_stamina_surge") ? 1.3 : 1,
    soulMul: hasSkill("sk_soul_greed") ? 1.15 : 1,
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
    zoneId: S.zoneId, souls: p.souls, stats: S.stats, charms: S.charms, skills: S.skills,
    estusMax: S.estusMax, knives: S.knives,
    dropped: S.droppedSouls, bossesDead: S.bossesDead, ended: S.ended,
    ngPlus: S.ngPlus, ending: S.ending, towerBest: S.towerBest,
  });
}
function restore(d) {
  S.zoneId = d.zoneId || "z01";
  S.stats = d.stats || S.stats;
  S.charms = d.charms || [];
  S.skills = d.skills || [];
  S.estusMax = d.estusMax || 3;
  S.knives = d.knives || 0;
  S.droppedSouls = d.dropped || null;
  S.bossesDead = d.bossesDead || {};
  S.ended = !!d.ended;
  S.ngPlus = d.ngPlus || 0;
  S.ending = d.ending || null;
  S.towerBest = d.towerBest || 0;
  enterZone(S.zoneId, null, d.souls || 0);
}

/* ---------- zone lifecycle ---------- */
function ngMul() { return 1 + S.ngPlus * 0.35; }
function spawnEnemies() {
  S.enemies = zone().enemies.map((e) => ({
    ...e, def: ENEMY_DEFS[e.type], hp: ENEMY_DEFS[e.type].hp * ngMul(),
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
      hp: def.hp * CFG.difficulty.bossHpMul * ngMul(), maxHp: def.hp * CFG.difficulty.bossHpMul * ngMul(),
      state: "idle", t: 0, move: null, hits: 0, active: false, dead: false,
    });
  }
}
function enterZone(zoneId, spawnX, souls) {
  S.zoneId = zoneId;
  if (HAND_ART.ready && HAND_ART.ensure) {
    const lazyAssets = [`${zoneId}Background`];
    if (zoneId === "z12") lazyAssets.push("endingTriptych");
    HAND_ART.ensure(lazyAssets).catch((error) => {
      console.warn(`Unable to lazy-load hand-painted art for ${zoneId}`, error);
    });
  }
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
  p.hp -= dmg * derived().defMul * (1 + S.ngPlus * 0.2);
  burst(p.x, p.y - 22, "#b91c1c", 10, 2.2);
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
      burst(e.x, e.y - 22, "#991b1b", 7, 1.8);
      if (e.hp <= 0) { e.dead = true; p.souls += Math.floor(e.def.souls * derived().soulMul); if (S.charms.includes("charm_leech")) p.hp = Math.min(p.maxHp, p.hp + 4); }
    }
  }
  for (const b of S.bosses) {
    if (!b.dead && b.active && hit(box, bodyBox(b, true))) {
      const mult = p.riposte > 0 ? 2.4 : 1;
      b.hp -= dmg * mult; p.hitLanded = true;
      burst(b.x, b.y - 32, p.riposte > 0 ? "#fde68a" : "#7f1d1d", p.riposte > 0 ? 18 : 9, 2.4);
      if (atk === CFG.combat.heavyAttack && hasSkill("sk_heavy_stagger") && Math.random() < 0.25 && b.state !== "stagger") { b.state = "stagger"; b.t = 30; }
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
  if (p.stDelay > 0) p.stDelay -= 1; else p.st = Math.min(p.maxSt, p.st + C.staminaRegenPerFrame * derived().stRegenMul);

  const busy = ["dodge", "light", "heavy", "parry", "hurt", "dead"].includes(p.state);
  if (!busy) {
    let mv = 0;
    if (K.has("a")) { mv = -1; p.face = -1; }
    if (K.has("d")) { mv = 1; p.face = 1; }
    p.vx = mv * 2.0 * derived().moveMul;
    p.state = mv ? "run" : "idle";
    if (K.has(" ") && p.st >= C.dodge.stamina) { p.state = "dodge"; p.t = 0; p.st -= C.dodge.stamina; p.stDelay = C.staminaRegenDelay; p.iframes = CFG.difficulty.dodgeIframes; }
    else if (K.has("j") && p.st >= C.lightAttack.stamina) { p.state = "light"; p.t = 0; p.st -= C.lightAttack.stamina; p.stDelay = C.staminaRegenDelay; p.hitLanded = false; }
    else if (K.has("k") && p.st >= C.heavyAttack.stamina) { p.state = "heavy"; p.t = 0; p.st -= C.heavyAttack.stamina; p.stDelay = C.staminaRegenDelay; p.hitLanded = false; }
    else if (K.has("l") && p.st >= C.parry.stamina) { p.state = "parry"; p.t = 0; p.st -= C.parry.stamina; p.stDelay = C.staminaRegenDelay; p.parryOpen = derived().parryWindow; }
    else if (K.has("f") && p.estus > 0 && p.hp < p.maxHp) { p.estus -= 1; p.hp = Math.min(p.maxHp, p.hp + derived().estusHeal); K.delete("f"); }
    else if (K.has("q") && S.knives > 0) { K.delete("q"); S.knives -= 1; S.projectiles.push({ x: p.x, y: p.y - 26, vx: p.face * 5, from: "player", dmg: 26 }); }
    else if (K.has("e")) interact();
  }

  if (p.state === "dodge") { p.vx = p.face * C.dodge.speed * derived().dodgeMul; if (p.t >= C.dodge.duration) p.state = "idle"; }
  if (p.state === "light" || p.state === "heavy") {
    const atk = p.state === "light" ? C.lightAttack : C.heavyAttack;
    p.vx = 0;
    if (p.t >= atk.startup && p.t < atk.startup + atk.active && !p.hitLanded) playerAttackHits(atk);
    if (p.t >= atk.startup + atk.active + atk.recovery) p.state = "idle";
  }
  if (p.state === "parry" && p.t >= C.parry.recovery) p.state = "idle";
  if (p.state === "hurt" && p.t >= 24) p.state = "idle";
  if (p.state !== "dead") p.x = Math.max(10, Math.min(zone().width - 10, p.x + p.vx));
  if (zone().poisonPools && p.state !== "dead") {
    for (const pool of zone().poisonPools) {
      if (p.x > pool.x && p.x < pool.x + pool.w) { p.hp -= 0.35; if (p.hp <= 0) { die(); break; } }
    }
  }

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

function burst(x, y, color, count = 8, speed = 1.8) {
  for (let i = 0; i < count; i += 1) {
    S.particles.push({
      x, y, color,
      vx: (Math.random() - 0.5) * speed * 2,
      vy: -Math.random() * speed - 0.25,
      life: 25 + Math.random() * 25,
      size: 1 + Math.floor(Math.random() * 2),
    });
  }
}

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
      if (!ex.to || !ZONES[ex.to]) { flash("王座之后再无道路——结局已在Boss房揭晓"); return; }
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
  if ((CFG.vendor.zones || [CFG.vendor.zone]).includes(S.zoneId)) {
    for (const it of CFG.vendor.items) {
      const owned = it.id === "estus_up" ? S.estusMax - 3 : (it.id.startsWith("charm_") ? (S.charms.includes(it.id) ? 1 : 0) : 0);
      if (it.max && owned >= it.max) continue;
      opts.push({ id: `buy:${it.id}`, label: `购买 ${it.name}（${it.cost} 魂）` });
    }
  }
  if (S.ending && S.zoneId === "z01") {
    opts.push({ id: "tower", label: `挑战塔（当前最佳 ${S.towerBest} 层）` });
  }
  for (const sk of CFG.skills || []) {
    if (S.skills.includes(sk.id)) continue;
    opts.push({ id: `skill:${sk.id}`, label: `技能 ${sk.name}·${sk.desc}（${sk.cost} 魂）` });
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
      if (it.id.startsWith("charm_")) S.charms.push(it.id);
      flash(`获得 ${it.name}`);
      persist();
    } else flash("魂不足");
  } else if (optId.startsWith("skill:")) {
    const sk = CFG.skills.find((x) => `skill:${x.id}` === optId);
    if (p.souls >= sk.cost) { p.souls -= sk.cost; S.skills.push(sk.id); flash(`习得 ${sk.name}`); persist(); }
    else flash("魂不足");
  } else if (optId === "tower") {
    S.menu = null;
    startTower();
  } else if (optId === "close") S.menu = null;
}
function upMenu() {
  if (S.menu === "ending") {
    if (K.has("w") || K.has("arrowup")) { K.delete("w"); K.delete("arrowup"); S.menuIdx = (S.menuIdx + ENDINGS.length - 1) % ENDINGS.length; }
    if (K.has("s") || K.has("arrowdown")) { K.delete("s"); K.delete("arrowdown"); S.menuIdx = (S.menuIdx + 1) % ENDINGS.length; }
    if (K.has("e") || K.has("enter")) { K.delete("e"); K.delete("enter"); endingAct(S.menuIdx); }
    return;
  }
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
    if (e.t === e.def.attackStartup && Math.abs(p.x - e.x) < e.def.attackRange + 8 && p.state !== "dead") damagePlayer(e.def.damage * (e.towerMul || 1), e.x);
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
  S.player.souls += Math.floor(b.def.souls * derived().soulMul);
  if (!S.bosses.some((x) => x.active && !x.dead)) $("bossbar").classList.add("hidden");
  flash(`击破 ${b.def.name}！+${b.def.souls} 魂`);
  burst(b.x, b.y - 30, "#fbbf24", 42, 3.2);
  persist();
  if (b.slot.id === FINAL_BOSS) endingChoice();
}
function endingChoice() {
  S.menu = "ending";
  S.menuIdx = 0;
}
const ENDINGS = [
  { id: "light", name: "点燃灯塔", desc: "雾散，港湾迎来晨光。" },
  { id: "dark", name: "熄灭灯火", desc: "你把港湾交还给雾与海。" },
  { id: "leave", name: "扬帆离港", desc: "行者不属于任何港口。" },
];
function endingAct(idx) {
  const e = ENDINGS[idx];
  S.ending = e.id;
  S.ngPlus += 1;
  S.bossesDead = {};
  S.droppedSouls = null;
  S.menu = null;
  enterZone("z01", null, S.player.souls);
  showOverlay(`结局：${e.name}`, `${e.desc} 已解锁 NG+${S.ngPlus}（敌人强化35%/周目）。继续将从雾码头再次出发。`, true);
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
    } else if (m.summon && b.t === m.startup) {
      const def = ENEMY_DEFS[m.summon];
      if (def && S.enemies.filter((e) => !e.dead && e.summoned).length < 2) {
        S.enemies.push({ type: m.summon, def, hp: def.hp, x: b.x + (b.face * -60), y: 230, face: b.face, state: "idle", t: 0, dead: false, shotCd: 0, summoned: true });
      }
    } else if (m.projectile && b.t === m.startup) {
      const dir = p.x > b.x ? 1 : -1;
      S.projectiles.push({ x: b.x, y: b.y - 30, vx: dir * 3.6, from: "enemy", dmg: m.damage });
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

/* ---------- challenge tower ---------- */
let tower = null;
function startTower() {
  tower = { floor: 0, alive: 0 };
  nextTowerFloor();
  flash("挑战塔开始！每层敌人更强");
}
function nextTowerFloor() {
  tower.floor += 1;
  const pool = Object.keys(ENEMY_DEFS);
  const count = Math.min(6, 2 + Math.floor(tower.floor / 2));
  S.enemies = [];
  for (let i = 0; i < count; i++) {
    const type = pool[Math.floor(Math.random() * pool.length)];
    const def = ENEMY_DEFS[type];
    S.enemies.push({ type, def, hp: def.hp * (1 + tower.floor * 0.18), x: 300 + i * 120, y: 230, face: -1, state: "idle", t: 0, dead: false, shotCd: 0, towerMul: 1 + tower.floor * 0.12 });
  }
  tower.alive = count;
}
function upTower() {
  if (!tower) return;
  if (S.enemies.every((e) => e.dead)) {
    S.player.souls += tower.floor * 120;
    if (tower.floor > S.towerBest) { S.towerBest = tower.floor; persist(); }
    flash(`第 ${tower.floor} 层清除！+${tower.floor * 120} 魂`);
    nextTowerFloor();
  }
  if (S.player.state === "dead") {
    flash(`挑战塔结束 · 最佳 ${S.towerBest} 层`);
    tower = null;
  }
}

/* ---------- render ---------- */
const ZONE_ART = {
  z01: { sky: "#091421", haze: "#27465c", far: "#112b3b", near: "#162b37", ground: "#172532", accent: "#e07a32", moon: "#b9d6df", kind: "dock" },
  z02: { sky: "#07181a", haze: "#1d4c46", far: "#0f302f", near: "#153a34", ground: "#1a302c", accent: "#52b7a6", moon: "#b5e8dd", kind: "wreck" },
  z03: { sky: "#111425", haze: "#55566f", far: "#22243b", near: "#2e3045", ground: "#242638", accent: "#f0b948", moon: "#f1e3b4", kind: "tower" },
  z04: { sky: "#10170d", haze: "#3d552a", far: "#1d2b17", near: "#26351d", ground: "#20291d", accent: "#93b83f", moon: "#bfd292", kind: "cellar" },
  z05: { sky: "#12171d", haze: "#5a6972", far: "#28343c", near: "#35434a", ground: "#303a3f", accent: "#d2dde0", moon: "#d8e4e6", kind: "mine" },
  z06: { sky: "#16100c", haze: "#69472d", far: "#332318", near: "#46301f", ground: "#37291e", accent: "#d7a33e", moon: "#f0d28a", kind: "bell" },
  z07: { sky: "#071721", haze: "#23556b", far: "#0e3344", near: "#15485a", ground: "#173847", accent: "#68c9e8", moon: "#b7eaff", kind: "church" },
  z08: { sky: "#171922", haze: "#555866", far: "#292c37", near: "#343743", ground: "#2c2f39", accent: "#cad0db", moon: "#d9dce2", kind: "waste" },
  z09: { sky: "#090e16", haze: "#29374a", far: "#111d2b", near: "#19283a", ground: "#182433", accent: "#4b78a5", moon: "#9bbbd6", kind: "fort" },
  z10: { sky: "#100c20", haze: "#533d72", far: "#241b3b", near: "#342653", ground: "#2a2142", accent: "#c4a2ee", moon: "#e6d7ff", kind: "stars" },
  z11: { sky: "#080512", haze: "#432d65", far: "#1c1030", near: "#291643", ground: "#24133a", accent: "#9d65dd", moon: "#d6bbff", kind: "abyss" },
  z12: { sky: "#030a12", haze: "#17456a", far: "#071e31", near: "#0d304b", ground: "#10283a", accent: "#26a7df", moon: "#90dcff", kind: "throne" },
};

function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawBackdrop(A, Z) {
  const grad = ctx.createLinearGradient(0, 0, 0, 230);
  grad.addColorStop(0, A.sky);
  grad.addColorStop(0.65, A.haze);
  grad.addColorStop(1, A.near);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 270);

  const moonX = 390 - S.cam * 0.015;
  ctx.fillStyle = A.moon;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(moonX, 44, A.kind === "stars" ? 17 : 12, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Very distant skyline: cliffs, masts, towers and fortress teeth.
  ctx.fillStyle = A.far;
  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 97 - S.cam * 0.12) % 1050 + 1050) % 1050 - 100;
    const h = 35 + ((i * 31 + S.zoneId.charCodeAt(2)) % 70);
    ctx.fillRect(x, 154 - h, 48 + (i % 3) * 20, h + 80);
    if (A.kind === "dock" || A.kind === "wreck") {
      ctx.fillRect(x + 8, 70 - h * 0.25, 3, 75);
      ctx.beginPath(); ctx.moveTo(x + 11, 75); ctx.lineTo(x + 44, 104); ctx.lineTo(x + 11, 104); ctx.fill();
    }
    if (["tower", "bell", "church", "fort", "throne"].includes(A.kind)) {
      ctx.fillRect(x + 17, 78 - h, 10, h + 15);
      ctx.beginPath(); ctx.moveTo(x + 12, 80 - h); ctx.lineTo(x + 22, 65 - h); ctx.lineTo(x + 32, 80 - h); ctx.fill();
    }
  }

  // Near parallax architecture and chains.
  ctx.fillStyle = A.near;
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 225 - S.cam * 0.34) % 1800 + 1800) % 1800 - 180;
    const h = 55 + (i % 3) * 28;
    ctx.fillRect(x, 210 - h, 110 + (i % 2) * 50, h + 40);
    ctx.fillStyle = A.accent;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(x + 12, 170 - h * 0.45, 4, 4);
    ctx.fillRect(x + 34, 180 - h * 0.45, 4, 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = A.near;
  }

  // Ground silhouette + pixel texture.
  for (const pl of Z.platforms) {
    px(pl.x - S.cam, pl.y, pl.w, 270 - pl.y, A.ground);
    px(pl.x - S.cam, pl.y, pl.w, 3, A.accent);
    ctx.globalAlpha = 0.28;
    for (let x = Math.max(0, pl.x - S.cam); x < Math.min(480, pl.x - S.cam + pl.w); x += 19) {
      px(x, pl.y + 8 + ((x + S.cam) % 3) * 5, 5, 2, A.haze);
    }
    ctx.globalAlpha = 1;
  }

  // Moving fog bands.
  const fogShift = (performance.now() * 0.008) % 240;
  ctx.fillStyle = A.moon;
  ctx.globalAlpha = 0.055;
  for (let i = -1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(i * 180 + fogShift, 128 + (i % 2) * 34, 130, 17, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBonfire(x, A) {
  const t = performance.now() * 0.012;
  px(x - 7, 220, 14, 4, "#31251f");
  px(x - 5, 216, 10, 4, "#6b3c22");
  px(x - 3, 207 + Math.sin(t) * 2, 6, 11, "#f97316");
  px(x - 1, 201 + Math.cos(t * 1.3) * 2, 3, 12, "#fde047");
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = A.accent;
  ctx.beginPath(); ctx.arc(x, 211, 22 + Math.sin(t) * 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlayerSprite(p) {
  const x = p.x - S.cam;
  const bob = p.state === "run" ? Math.floor(Math.sin(p.t * 0.55) * 2) : 0;
  const roll = p.state === "dodge";
  const alpha = p.iframes > 0 && Math.floor(p.t / 2) % 2 ? 0.45 : 1;
  ctx.globalAlpha = alpha;
  if (roll) {
    px(x - 10, 216, 20, 10, "#182b36");
    px(x - 5, 211, 11, 9, "#b7cad2");
    px(x + p.face * 7 - 3, 214, 9, 3, "#7fb3c8");
  } else {
    // cloak, hood and face mask
    px(x - 7, 197 + bob, 14, 25, "#152936");
    px(x - 9, 210 + bob, 18, 15, "#1c3745");
    px(x - 6, 190 + bob, 12, 10, "#9eb5bd");
    px(x - 8, 192 + bob, 16, 7, "#233e4a");
    px(x + p.face * 3 - 1, 194 + bob, 3, 2, "#d7eef5");
    px(x - 7, 224, 5, 5, "#0b151c");
    px(x + 2, 224, 5, 5, "#0b151c");
    // arm and weapon
    const attack = p.state === "light" || p.state === "heavy";
    const swing = attack ? Math.min(1, p.t / 12) : 0;
    const wx = x + p.face * (8 + swing * 11);
    const wy = 205 - swing * 8 + bob;
    px(x + p.face * 5 - 2, 204 + bob, 7, 4, "#738b94");
    px(wx, wy, p.face * 24, 3, p.riposte > 0 ? "#fde68a" : "#92bfd0");
    px(wx + p.face * 18, wy - 1, p.face * 6, 5, "#d8edf3");
  }
  ctx.globalAlpha = 1;
}

function enemyStyle(type) {
  if (type.includes("knight") || type.includes("guard") || type.includes("elite")) return "knight";
  if (type.includes("acolyte") || type.includes("monk") || type.includes("choir") || type.includes("zealot")) return "caster";
  if (type.includes("rat") || type.includes("spawn") || type.includes("ghoul")) return "beast";
  if (type.includes("archer")) return "archer";
  return "soldier";
}

function drawEnemySprite(e) {
  const x = e.x - S.cam;
  const y = e.y;
  const style = enemyStyle(e.type || "");
  const telegraph = e.state === "attack" && e.t >= e.def.attackStartup - 6;
  const base = telegraph ? "#fda4af" : e.def.color;
  if (style === "beast") {
    px(x - 11, y - 21, 22, 14, base);
    px(x + e.face * 10 - 5, y - 26, 10, 11, "#6b7280");
    px(x + e.face * 13 - 1, y - 23, 2, 2, "#f87171");
    px(x - 9, y - 7, 4, 7, "#111827"); px(x + 5, y - 7, 4, 7, "#111827");
  } else {
    const wide = style === "knight";
    px(x - (wide ? 10 : 8), y - 28, wide ? 20 : 16, 26, base);
    px(x - 7, y - 38, 14, 12, style === "caster" ? "#23213c" : "#374151");
    px(x + e.face * 4 - 1, y - 34, 3, 2, "#fbbf24");
    if (style === "knight") { px(x - 12, y - 24, 5, 18, "#64748b"); px(x + e.face * 10, y - 31, 4, 33, "#cbd5e1"); }
    if (style === "caster") { px(x + e.face * 9, y - 38, 3, 38, "#a78bfa"); px(x + e.face * 7, y - 42, 8, 5, "#e9d5ff"); }
    if (style === "archer") { px(x + e.face * 8, y - 27, 2, 23, "#c4a26e"); px(x + e.face * 11, y - 28, 2, 25, "#f9a8d4"); }
    if (style === "soldier") { px(x + e.face * 8, y - 25, e.face * 16, 3, "#94a3b8"); }
  }
  if (e.elite) {
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x - 13), Math.round(y - 43), 26, 43);
  }
}

function drawBossSprite(b) {
  const x = b.x - S.cam, y = b.y;
  const id = b.slot.id;
  const final = id === FINAL_BOSS;
  const stagger = b.state === "stagger";
  const telegraph = b.state === "attack" && b.move && b.t >= b.move.startup - 8;
  const body = stagger ? "#fde68a" : telegraph ? "#e05252" : (final ? "#174a69" : "#652c3d");
  const scale = final ? 1.25 : 1;
  px(x - 15 * scale, y - 51 * scale, 30 * scale, 48 * scale, body);
  px(x - 12 * scale, y - 65 * scale, 24 * scale, 17 * scale, "#1b2533");
  // horns/crown are keyed by boss identity for recognizable silhouettes.
  const variant = Number((id.match(/\d+/) || ["1"])[0]) % 4;
  if (variant === 0 || final) {
    px(x - 15, y - 72 * scale, 4, 12, "#8fb3c7"); px(x + 11, y - 72 * scale, 4, 12, "#8fb3c7");
    px(x - 11, y - 76 * scale, 4, 8, "#8fb3c7"); px(x + 7, y - 76 * scale, 4, 8, "#8fb3c7");
  } else if (variant === 1) {
    px(x - 17, y - 66, 34, 4, "#94a3b8"); px(x - 2, y - 77, 4, 13, "#94a3b8");
  } else if (variant === 2) {
    px(x - 16, y - 70, 7, 13, "#d6b95f"); px(x + 9, y - 70, 7, 13, "#d6b95f");
  } else {
    px(x - 8, y - 78, 4, 15, "#a78bfa"); px(x + 4, y - 78, 4, 15, "#a78bfa");
  }
  px(x - 7, y - 59 * scale, 4, 3, final ? "#38bdf8" : "#f87171");
  px(x + 3, y - 59 * scale, 4, 3, final ? "#38bdf8" : "#f87171");
  // cape and oversized weapon
  px(x - b.face * 13, y - 45, b.face * -12, 40, final ? "#0c2c43" : "#3b1726");
  const wx = x + b.face * 17;
  px(wx, y - 43, b.face * 34, 5, final ? "#53c8ef" : "#b8a6a9");
  px(wx + b.face * 28, y - 48, b.face * 8, 14, final ? "#9ae6ff" : "#d6c7ca");
}

function handEnemyArchetype(enemy) {
  const style = enemyStyle(enemy.type || "");
  if (style === "knight") return 1;
  if (style === "caster") return 2;
  if (style === "beast") return 3;
  if (style === "archer") return 4;
  return 0;
}

function drawHandPaintedActors() {
  if (!HAND_ART.ready) return false;
  const p = S.player;
  const playerAsset = HAND_ART.assets.player;
  const zoneNumber = Number(S.zoneId.slice(1));
  const specializedDock = S.zoneId === "z01";
  const enemyAsset = specializedDock
    ? HAND_ART.assets.z01Enemies
    : HAND_ART.assets[zoneNumber <= 6 ? "enemyRosterA" : "enemyRosterB"];

  for (const enemy of S.enemies) {
    if (enemy.dead) continue;
    const archetype = handEnemyArchetype(enemy);
    let frame;
    if (specializedDock) {
      frame = enemyFrame(enemy, Math.min(2, archetype));
    } else {
      const regionalRow = zoneNumber <= 3 || (zoneNumber >= 7 && zoneNumber <= 9) ? 0 : 1;
      frame = regionalRow * 5 + archetype;
    }
    drawFrame(
      ctx,
      enemyAsset,
      frame,
      enemy.x - S.cam,
      enemy.y + 2,
      enemy.elite ? 106 : 88,
      enemy.elite ? 102 : 86,
      enemy.face > 0,
      enemy.state === "hurt" ? 0.72 : 1
    );
  }

  for (const boss of S.bosses) {
    if (boss.dead) continue;
    const bossNumber = Number((boss.slot.id.match(/\d+/) || ["1"])[0]);
    let bossAsset;
    let frame;
    if (bossNumber === 1 && HAND_ART.assets.b01) {
      bossAsset = HAND_ART.assets.b01;
      frame = bossFrame(boss);
    } else if (bossNumber <= 6) {
      bossAsset = HAND_ART.assets.bossRoster01;
      frame = bossNumber - 1;
    } else if (bossNumber <= 12) {
      bossAsset = HAND_ART.assets.bossRoster07;
      frame = bossNumber - 7;
    } else {
      bossAsset = HAND_ART.assets.bossRoster13;
      frame = bossNumber - 13;
    }
    drawFrame(
      ctx,
      bossAsset,
      frame,
      boss.x - S.cam,
      boss.y + 4,
      bossNumber === 18 ? 172 : 142,
      bossNumber === 18 ? 184 : 164,
      boss.face > 0,
      boss.state === "stagger" ? 0.82 : 1
    );
  }

  if (p.state !== "dead") {
    drawFrame(
      ctx,
      playerAsset,
      playerFrame(p),
      p.x - S.cam,
      p.y + 3,
      p.state === "dodge" ? 112 : 94,
      p.state === "dodge" ? 82 : 104,
      p.face < 0,
      p.iframes > 0 && Math.floor(p.t / 2) % 2 ? 0.48 : 1
    );
  }
  return true;
}

function updateAndDrawParticles() {
  for (const p of S.particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 1;
    ctx.globalAlpha = Math.max(0, p.life / 45);
    px(p.x - S.cam, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  S.particles = S.particles.filter((p) => p.life > 0);
}

function draw() {
  const p = S.player;
  const Z = zone();
  const A = ZONE_ART[S.zoneId] || ZONE_ART.z01;
  S.cam = Math.max(0, Math.min(Z.width - 480, p.x - 220));
  const paintedScene = HAND_ART.ready
    ? drawHandPaintedScene(ctx, HAND_ART, S.zoneId, S.cam, Z.width, performance.now())
    : null;
  if (!paintedScene) {
    drawBackdrop(A, Z);
  } else {
    // Preserve collision readability over the painted dock floor.
    ctx.save();
    ctx.globalAlpha = 0.34;
    for (const pl of Z.platforms) {
      px(pl.x - S.cam, pl.y, pl.w, 2, "#9fc9d4");
      if (pl.y < 220) px(pl.x - S.cam, pl.y + 2, pl.w, 270 - pl.y, "#08141c");
    }
    ctx.restore();
  }

  if (Z.poisonPools) {
    for (const pool of Z.poisonPools) {
      const ripple = Math.sin(performance.now() * 0.008 + pool.x) * 2;
      px(pool.x - S.cam, 222 + ripple, pool.w, 8, "#5f7d22");
      ctx.globalAlpha = 0.6;
      for (let x = pool.x; x < pool.x + pool.w; x += 18) px(x - S.cam, 219 + Math.sin(x + performance.now() * 0.01) * 2, 5, 3, "#a3c94b");
      ctx.globalAlpha = 1;
    }
  }
  const bf = Z.bonfires[0];
  drawBonfire(bf.x - S.cam, A);

  for (const ex of Z.exits) {
    const locked = ex.requiresBoss && !S.bossesDead[ex.requiresBoss];
    const x = ex.x - S.cam;
    px(x - 10, 190, 20, 40, locked ? "#263849" : A.accent);
    px(x - 6, 194, 12, 36, "#07101a");
    px(x - 2, 207, 4, 4, locked ? "#64748b" : "#fde68a");
  }

  if (S.droppedSouls && S.droppedSouls.zone === S.zoneId) {
    const sx = S.droppedSouls.x - S.cam;
    const pulse = 5 + Math.sin(performance.now() * 0.01) * 2;
    ctx.globalAlpha = 0.22; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(sx, 216, pulse * 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = "#d9f99d"; ctx.beginPath(); ctx.arc(sx, 216, pulse, 0, Math.PI * 2); ctx.fill();
  }

  const handActors = drawHandPaintedActors();
  if (!handActors) {
    for (const e of S.enemies) if (!e.dead) drawEnemySprite(e);
  }
  for (const pr of S.projectiles) {
    const x = pr.x - S.cam, c = pr.from === "enemy" ? "#fb7185" : "#93c5fd";
    ctx.globalAlpha = 0.25; px(x - 9, pr.y - 5, 18, 10, c); ctx.globalAlpha = 1;
    px(x - 4, pr.y - 2, 8, 4, c);
  }
  if (!handActors) {
    for (const b of S.bosses) if (!b.dead) drawBossSprite(b);
    if (p.state !== "dead") drawPlayerSprite(p);
  }
  updateAndDrawParticles();
  if (flashMsg) {
    ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(30, 18, 420, 26);
    ctx.fillStyle = "#f8fafc"; ctx.font = "12px sans-serif";
    ctx.fillText(flashMsg.text, 42, 35);
    flashMsg.t -= 1; if (flashMsg.t <= 0) flashMsg = null;
  }
  if (S.menu === "ending") {
    const endingArt = HAND_ART.assets.endingTriptych;
    if (endingArt) {
      const sw = endingArt.width / 3;
      const sx = Math.max(0, Math.min(2, S.menuIdx)) * sw;
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.drawImage(endingArt.image, sx, 0, sw, endingArt.height, 0, 0, 480, 270);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(3,7,12,.82)"; ctx.fillRect(62, 38, 356, 134);
    ctx.fillStyle = "#fbbf24"; ctx.font = "14px sans-serif";
    ctx.fillText("溺神已灭 —— 选择港湾的命运", 90, 66);
    ENDINGS.forEach((o, i) => {
      ctx.fillStyle = i === S.menuIdx ? "#f8fafc" : "#7c8ea0";
      ctx.fillText(`${i === S.menuIdx ? "▶ " : "   "}${o.name} — ${o.desc}`, 90, 94 + i * 24);
    });
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
  if (!d) { $("overlay-msg").textContent = "没有可继续的存档。"; return; }
  restore(d);
  if (S.ending && S.bossesDead[FINAL_BOSS]) { S.bossesDead = {}; }
  if (d.ended) { S.ended = false; enterZone("z01", null, d.souls || 0); }
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
      upTower();
    }
    hud();
  }
  draw();
  requestAnimationFrame(loop);
}

/* ---------- boot ---------- */
async function boot() {
  const [cfg, enemies, art] = await Promise.all([
    fetch("./content/config.json").then((r) => r.json()),
    fetch("./content/enemies.json").then((r) => r.json()),
    loadHandPaintedArt(),
  ]);
  CFG = cfg; ENEMY_DEFS = enemies; HAND_ART = art;
  await Promise.all(Object.entries(ZONE_FILES).map(async ([id, f]) => { ZONES[id] = await fetch(f).then((r) => r.json()); }));
  await Promise.all(Object.entries(BOSS_FILES).map(async ([id, f]) => { BOSSES[id] = await fetch(f).then((r) => r.json()); }));
  const d = save.load();
  S.player = newPlayer(ZONES.z01.bonfires[0].x);
  S.zoneId = "z01";
  spawnEnemies();
  spawnBosses();
  showOverlay(
    "雾港行者",
    "12 区互联 · 18 Boss · 3 结局 · NG+ · 挑战塔。高难度：管理体力，善用弹反。",
    !!(d && !d.ended)
  );
  loop();
}
boot();
