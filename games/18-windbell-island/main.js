import { loadArt, frame } from "./src/art/assets.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
const save = LongplaySave.create("18-windbell-island", 1);
const keys = new Set();

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
  if ([" ", "arrowup", "arrowdown"].includes(event.key.toLowerCase())) event.preventDefault();
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

const ZONE_IDS = Array.from({ length: 8 }, (_, i) => `z${String(i + 1).padStart(2, "0")}`);
const GUARDIAN_IDS = [
  "g01_dandelion_lion", "g02_umbrella_frog", "g03_orange_bear", "g04_twin_kites",
  "g05_cloud_shepherd", "g06_tide_whale", "g07_pearl_crab", "g08_windmill_giant",
  "g09_nightingale", "g10_star_deer", "g11_old_courier", "g12_dawn_bird",
];

let CONFIG, CREATURES, ART;
const ZONES = {}, GUARDIANS = {};
let note = null;
let particles = [];
let challenge = null;

const state = {
  running: false,
  zoneId: "z01",
  camera: 0,
  player: null,
  creatures: [],
  guardians: [],
  projectiles: [],
  calmGuardians: {},
  deliveredLetters: {},
  stats: { heart: 0, breath: 0, chime: 0 },
  teaMax: 4,
  dropped: null,
  menu: null,
  menuIndex: 0,
  ending: null,
  challengeBest: 0,
};

const zone = () => ZONES[state.zoneId];
const num = (id) => Number((id.match(/\d+/) || ["1"])[0]);
const derived = () => ({
  maxHp: CONFIG.player.hp + state.stats.heart * 16,
  maxSt: CONFIG.player.stamina + state.stats.breath * 10,
  damage: state.stats.chime * 2,
});

function playerAt(x) {
  const d = derived();
  return {
    x, y: 230, vx: 0, face: 1,
    hp: d.maxHp, maxHp: d.maxHp,
    st: d.maxSt, maxSt: d.maxSt, stDelay: 0,
    fragments: 0, tea: state.teaMax,
    state: "idle", t: 0, iframes: 0, resonance: 0, bonus: 0, hit: false,
  };
}

function say(text, color = "#fff9d7") {
  note = { text, color, time: 130 };
}

function sparkle(x, y, color = "#fff3a6", count = 12) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x, y, color,
      vx: (Math.random() - 0.5) * 2.2,
      vy: -0.4 - Math.random() * 1.7,
      life: 30 + Math.random() * 35,
      size: 1 + Math.random() * 2,
    });
  }
}

function persist() {
  const p = state.player;
  save.save({
    zoneId: state.zoneId,
    fragments: p.fragments,
    calmGuardians: state.calmGuardians,
    deliveredLetters: state.deliveredLetters,
    stats: state.stats,
    teaMax: state.teaMax,
    dropped: state.dropped,
    ending: state.ending,
    challengeBest: state.challengeBest,
  });
}

function restore(data) {
  state.stats = data.stats || state.stats;
  state.teaMax = data.teaMax || 4;
  state.calmGuardians = data.calmGuardians || {};
  state.deliveredLetters = data.deliveredLetters || {};
  state.dropped = data.dropped || null;
  state.ending = data.ending || null;
  state.challengeBest = data.challengeBest || 0;
  enterZone(data.zoneId || "z01", null, data.fragments || 0);
}

function spawnCreatures() {
  const late = num(state.zoneId) > 4;
  state.creatures = zone().creatures.map((value) => ({
    ...value,
    def: CREATURES[value.type],
    hp: CREATURES[value.type].hp * (late ? 1.18 : 1),
    x: value.x, y: 230, face: -1, state: "idle", t: 0, calm: false,
  }));
}

function guardianInstance(slot) {
  const def = GUARDIANS[slot.id];
  return {
    slot, def, x: slot.x, y: 230,
    hp: def.hp, maxHp: def.hp, face: -1,
    state: "idle", t: 0, move: null, hits: 0,
    active: false, calm: !!state.calmGuardians[slot.id],
  };
}

function spawnGuardians() {
  state.guardians = [guardianInstance(zone().guardian)];
  if (zone().hiddenGuardian) state.guardians.push(guardianInstance(zone().hiddenGuardian));
}

function enterZone(id, spawnX, fragments) {
  state.zoneId = id;
  ART.zone(id).catch(() => {});
  if (id === "z08") ART.zone("ending").catch(() => {});
  const keep = fragments == null && state.player ? state.player.fragments : (fragments || 0);
  state.player = playerAt(spawnX == null ? zone().camp.x : spawnX);
  state.player.fragments = keep;
  spawnCreatures();
  spawnGuardians();
  state.projectiles = [];
  $("guardianbar").classList.add("hidden");
  persist();
}

function attackBox(entity, range) {
  return {
    x: entity.face > 0 ? entity.x + 7 : entity.x - 7 - range,
    y: entity.y - 38, w: range, h: 42,
  };
}
const bodyBox = (entity, tall = false) => ({ x: entity.x - (tall ? 18 : 10), y: entity.y - (tall ? 68 : 38), w: tall ? 36 : 20, h: tall ? 68 : 38 });
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function hurtPlayer(damage, sourceX) {
  const p = state.player;
  if (p.iframes > 0 || p.state === "faint") return;
  if (p.resonance > 0) {
    p.resonance = 0;
    p.bonus = 48;
    say("共鸣成功 ♪ 下一击安抚力翻倍", "#fff4a8");
    sparkle(p.x, p.y - 20, "#fff2a0", 18);
    return;
  }
  p.hp -= damage;
  p.state = "hurt"; p.t = 0; p.iframes = 22;
  p.x += p.x < sourceX ? -12 : 12;
  sparkle(p.x, p.y - 18, "#f3a78f", 8);
  if (p.hp <= 0) faint();
}

function faint() {
  const p = state.player;
  p.state = "faint"; p.hp = 0;
  const previous = state.dropped && state.dropped.zone === state.zoneId ? Math.floor(state.dropped.amount * CONFIG.fragmentLoss) : 0;
  state.dropped = { zone: state.zoneId, x: p.x, amount: p.fragments + previous };
  p.fragments = 0;
  persist();
  $("faint").classList.remove("hidden");
  setTimeout(() => {
    $("faint").classList.add("hidden");
    const keepDrop = state.dropped;
    enterZone(state.zoneId, zone().camp.x, 0);
    state.dropped = keepDrop;
  }, 1200);
}

function calmCreature(creature) {
  creature.calm = true;
  const gain = creature.def.souls;
  state.player.fragments += gain;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
  sparkle(creature.x, creature.y - 20, "#d9f5b0", 14);
  say(`${creature.def.name}安静下来 · +${gain}碎片`);
}

function calmGuardian(guardian) {
  guardian.calm = true;
  state.calmGuardians[guardian.slot.id] = true;
  state.player.fragments += guardian.def.fragments;
  $("guardianbar").classList.add("hidden");
  sparkle(guardian.x, guardian.y - 35, "#fff0a8", 40);
  say(`${guardian.def.name}恢复平静 · +${guardian.def.fragments}碎片`, "#fff4a8");
  persist();
  if (guardian.slot.id === "g12_dawn_bird") {
    state.menu = "ending";
    state.menuIndex = 0;
  }
}

function playerHits(attack) {
  const p = state.player;
  const damage = (attack.damage + derived().damage) * (p.bonus > 0 ? 2 : 1);
  p.bonus = 0;
  const box = attackBox(p, attack === CONFIG.combat.heavy ? 45 : 34);
  for (const creature of state.creatures) {
    if (!creature.calm && overlap(box, bodyBox(creature))) {
      creature.hp -= damage;
      creature.state = "hurt"; creature.t = 0; p.hit = true;
      sparkle(creature.x, creature.y - 18, "#bfe7d1", 7);
      if (creature.hp <= 0) calmCreature(creature);
    }
  }
  for (const guardian of state.guardians) {
    if (!guardian.calm && guardian.active && overlap(box, bodyBox(guardian, true))) {
      guardian.hp -= damage;
      p.hit = true;
      sparkle(guardian.x, guardian.y - 36, "#d2eec4", 9);
      if (guardian.hp <= 0) calmGuardian(guardian);
    }
  }
}

function updatePlayer() {
  const p = state.player, C = CONFIG.combat;
  p.t += 1;
  if (p.iframes > 0) p.iframes -= 1;
  if (p.resonance > 0) p.resonance -= 1;
  if (p.bonus > 0) p.bonus -= 1;
  if (p.stDelay > 0) p.stDelay -= 1; else p.st = Math.min(p.maxSt, p.st + C.regen);
  const busy = ["roll", "light", "heavy", "resonate", "hurt", "faint"].includes(p.state);
  if (!busy) {
    let move = 0;
    if (keys.has("a")) { move = -1; p.face = -1; }
    if (keys.has("d")) { move = 1; p.face = 1; }
    p.vx = move * 2.15;
    p.state = move ? "run" : "idle";
    if (keys.has(" ") && p.st >= C.roll.cost) {
      p.state = "roll"; p.t = 0; p.st -= C.roll.cost; p.stDelay = 15; p.iframes = C.roll.iframes;
    } else if (keys.has("j") && p.st >= C.light.cost) {
      p.state = "light"; p.t = 0; p.st -= C.light.cost; p.stDelay = 14; p.hit = false;
    } else if (keys.has("k") && p.st >= C.heavy.cost) {
      p.state = "heavy"; p.t = 0; p.st -= C.heavy.cost; p.stDelay = 18; p.hit = false;
    } else if (keys.has("l") && p.st >= C.resonance.cost) {
      p.state = "resonate"; p.t = 0; p.st -= C.resonance.cost; p.resonance = C.resonance.window;
    } else if (keys.has("f") && p.tea > 0 && p.hp < p.maxHp) {
      keys.delete("f"); p.tea -= 1; p.hp = Math.min(p.maxHp, p.hp + CONFIG.campHeal);
      sparkle(p.x, p.y - 20, "#f4cf80", 12);
    } else if (keys.has("e")) interact();
  }
  if (p.state === "roll") {
    p.vx = p.face * 4.1;
    if (p.t >= C.roll.frames) p.state = "idle";
  }
  if (p.state === "light" || p.state === "heavy") {
    const attack = p.state === "light" ? C.light : C.heavy;
    p.vx = 0;
    if (p.t >= 7 && p.t <= 13 && !p.hit) playerHits(attack);
    if (p.t >= attack.total) p.state = "idle";
  }
  if (p.state === "resonate" && p.t >= C.resonance.total) p.state = "idle";
  if (p.state === "hurt" && p.t >= 20) p.state = "idle";
  if (p.state !== "faint") p.x = Math.max(10, Math.min(zone().width - 10, p.x + p.vx));

  for (const guardian of state.guardians) {
    if (!guardian.calm && !guardian.active && Math.abs(p.x - guardian.x) < 250) {
      guardian.active = true;
      $("guardianbar").classList.remove("hidden");
      $("guardianname").textContent = guardian.def.name;
    }
  }
}

function updateCreature(creature) {
  if (creature.calm) return;
  creature.t += 1;
  const p = state.player;
  const distance = Math.abs(p.x - creature.x);
  const direction = p.x > creature.x ? 1 : -1;
  if (creature.state === "hurt") {
    if (creature.t > 15) { creature.state = "idle"; creature.t = 0; }
    return;
  }
  if (creature.state === "attack") {
    if (creature.t === 16 && distance < creature.def.range + 12) hurtPlayer(creature.def.damage, creature.x);
    if (creature.t > 42) { creature.state = "idle"; creature.t = 0; }
    return;
  }
  if (distance < creature.def.range) { creature.state = "attack"; creature.t = 0; creature.face = direction; }
  else if (distance < 180) { creature.x += direction * creature.def.speed; creature.face = direction; }
}

function updateGuardian(guardian) {
  if (guardian.calm || !guardian.active) return;
  guardian.t += 1;
  const p = state.player;
  const distance = Math.abs(p.x - guardian.x);
  const direction = p.x > guardian.x ? 1 : -1;
  if (guardian.state === "attack") {
    const move = guardian.move;
    if (move.projectile && guardian.t === move.startup) {
      state.projectiles.push({ x: guardian.x, y: guardian.y - 35, vx: direction * 3.2, damage: move.damage });
    } else if (guardian.t === move.startup && distance < move.range) {
      if (p.resonance > 0 && move.parry) {
        p.resonance = 0; p.bonus = 55; guardian.state = "rest"; guardian.t = 0;
        say("守护灵与你产生了共鸣 ♪");
      } else hurtPlayer(move.damage, guardian.x);
    }
    if (guardian.t > move.startup + 32) { guardian.state = "idle"; guardian.t = 0; }
    return;
  }
  if (guardian.state === "rest") {
    if (guardian.t > 46) { guardian.state = "idle"; guardian.t = 0; }
    return;
  }
  if (distance > 65) guardian.x += direction * (1 + num(guardian.slot.id) * 0.025);
  else {
    guardian.move = guardian.def.moves[Math.floor(Math.random() * guardian.def.moves.length)];
    guardian.state = "attack"; guardian.t = 0; guardian.face = direction;
  }
}

function updateProjectiles() {
  for (const value of state.projectiles) {
    value.x += value.vx;
    if (overlap({ x: value.x - 4, y: value.y - 3, w: 8, h: 6 }, bodyBox(state.player))) {
      hurtPlayer(value.damage, value.x); value.dead = true;
    }
  }
  state.projectiles = state.projectiles.filter((value) => !value.dead && value.x > 0 && value.x < zone().width);
}

function interact() {
  keys.delete("e");
  const p = state.player;
  if (Math.abs(p.x - zone().camp.x) < 28) {
    state.menu = "camp"; state.menuIndex = 0; return;
  }
  if (state.dropped && state.dropped.zone === state.zoneId && Math.abs(p.x - state.dropped.x) < 30) {
    p.fragments += state.dropped.amount;
    say(`拾回 ${state.dropped.amount} 枚风铃碎片`);
    sparkle(state.dropped.x, 215, "#fff1a0", 20);
    state.dropped = null; persist(); return;
  }
  for (const exit of zone().exits) {
    if (Math.abs(p.x - exit.x) >= 32) continue;
    if (exit.requires && !state.calmGuardians[exit.requires]) { say("守护灵仍在呼唤你"); return; }
    if (!exit.to) { if (state.calmGuardians.g12_dawn_bird) state.menu = "ending"; return; }
    const target = ZONES[exit.to];
    enterZone(exit.to, exit.x < 100 ? target.width - 80 : 80);
    say(`抵达 ${target.name}`);
    return;
  }
}

function upgradeCost() {
  return Math.floor(100 * Math.pow(1.2, state.stats.heart + state.stats.breath + state.stats.chime));
}

function campOptions() {
  const options = [
    { id: "rest", label: "泡茶休息（恢复/存档/生物重置）" },
    { id: "upgrade", label: `编织风铃（${upgradeCost()} 碎片）` },
  ];
  const letter = zone().letter;
  const mainCalm = state.calmGuardians[zone().guardian.id];
  if (mainCalm && !state.deliveredLetters[letter]) {
    options.push({ id: "letter", label: `投递：${CONFIG.letters[letter]}` });
  }
  if (state.ending && state.zoneId === "z01") options.push({ id: "challenge", label: `守护灵回忆（最佳 ${state.challengeBest} 波）` });
  options.push({ id: "close", label: "收起茶具" });
  return options;
}

function campAction(id) {
  const p = state.player;
  if (id === "rest") {
    const d = derived();
    p.maxHp = d.maxHp; p.maxSt = d.maxSt; p.hp = d.maxHp; p.st = d.maxSt; p.tea = state.teaMax;
    spawnCreatures(); persist(); state.menu = null; say("热茶让风重新流动");
  } else if (id === "upgrade") {
    const cost = upgradeCost();
    if (p.fragments < cost) { say("碎片还不够"); return; }
    p.fragments -= cost;
    const order = ["heart", "breath", "chime"];
    const selected = order[(state.stats.heart + state.stats.breath + state.stats.chime) % 3];
    state.stats[selected] += 1;
    const d = derived(); p.maxHp = d.maxHp; p.maxSt = d.maxSt;
    say(`${CONFIG.upgrades.find((x) => x.id === selected).name} +1`); persist();
  } else if (id === "letter") {
    state.deliveredLetters[zone().letter] = true;
    say(`信件送达：${CONFIG.letters[zone().letter]}`);
    sparkle(zone().camp.x, 205, "#f1b978", 24); persist();
  } else if (id === "challenge") {
    state.menu = null; challenge = { wave: 0 }; nextChallenge();
  } else if (id === "close") state.menu = null;
}

const ENDINGS = [
  { id: "stay", name: "留在岛上", desc: "把远方变成新的家。" },
  { id: "sail", name: "继续远航", desc: "带着回信驶向下一阵风。" },
];

function menuUpdate() {
  const options = state.menu === "ending" ? ENDINGS : campOptions();
  if (keys.has("w") || keys.has("arrowup")) {
    keys.delete("w"); keys.delete("arrowup");
    state.menuIndex = (state.menuIndex + options.length - 1) % options.length;
  }
  if (keys.has("s") || keys.has("arrowdown")) {
    keys.delete("s"); keys.delete("arrowdown");
    state.menuIndex = (state.menuIndex + 1) % options.length;
  }
  if (keys.has("e") || keys.has("enter")) {
    keys.delete("e"); keys.delete("enter");
    if (state.menu === "ending") chooseEnding(state.menuIndex);
    else campAction(options[Math.min(state.menuIndex, options.length - 1)].id);
  }
  if (keys.has("escape") && state.menu !== "ending") { keys.delete("escape"); state.menu = null; }
}

function chooseEnding(index) {
  state.ending = ENDINGS[index].id;
  state.menu = null;
  persist();
  showOverlay(`结局：${ENDINGS[index].name}`, `${ENDINGS[index].desc} 守护灵回忆模式已在蒲公英港解锁。`, true);
}

function nextChallenge() {
  challenge.wave += 1;
  const ids = Object.keys(CREATURES);
  state.creatures = Array.from({ length: Math.min(7, 2 + challenge.wave) }, (_, i) => {
    const type = ids[(i + challenge.wave) % ids.length], def = CREATURES[type];
    return { type, def, hp: def.hp * (1 + challenge.wave * 0.14), x: 340 + i * 150, y: 230, face: -1, state: "idle", t: 0, calm: false };
  });
}

function challengeUpdate() {
  if (!challenge) return;
  if (state.creatures.every((value) => value.calm)) {
    state.challengeBest = Math.max(state.challengeBest, challenge.wave);
    state.player.fragments += challenge.wave * 80;
    persist(); say(`回忆第 ${challenge.wave} 波完成`); nextChallenge();
  }
  if (state.player.state === "faint") challenge = null;
}

function drawCover(image, offset = 0) {
  const scale = Math.max(480 / image.width, 270 / image.height);
  const sw = 480 / scale, sh = 270 / scale;
  const sx = Math.max(0, Math.min(image.width - sw, offset * (image.width - sw)));
  const sy = (image.height - sh) * 0.5;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, 480, 270);
}

function playerFrame() {
  const p = state.player;
  if (p.state === "roll") return 10 + Math.floor(p.t / 7) % 2;
  if (p.state === "light") return 5 + Math.floor(p.t / 8) % 2;
  if (p.state === "heavy") return 7 + Math.floor(p.t / 10) % 2;
  if (p.state === "hurt") return 11;
  if (p.state === "run") return [2, 3, 4][Math.floor(p.t / 7) % 3];
  return Math.floor(p.t / 28) % 2;
}

function drawWorld() {
  const p = state.player, Z = zone();
  state.camera = Math.max(0, Math.min(Z.width - 480, p.x - 220));
  const background = ART.assets[state.zoneId];
  if (background) drawCover(background.image, state.camera / Math.max(1, Z.width - 480));
  else { ctx.fillStyle = "#bde8ea"; ctx.fillRect(0, 0, 480, 270); }

  const veil = ctx.createLinearGradient(0, 120, 0, 270);
  veil.addColorStop(0, "rgba(255,255,245,.02)"); veil.addColorStop(1, "rgba(44,77,75,.2)");
  ctx.fillStyle = veil; ctx.fillRect(0, 100, 480, 170);

  for (const platform of Z.platforms) {
    ctx.fillStyle = "rgba(66,104,88,.35)";
    ctx.fillRect(platform.x - state.camera, platform.y, platform.w, 270 - platform.y);
    ctx.fillStyle = "#e9e7b9"; ctx.fillRect(platform.x - state.camera, platform.y, platform.w, 2);
  }

  // Tea camp
  const campX = Z.camp.x - state.camera;
  ctx.fillStyle = "#bb8154"; ctx.fillRect(campX - 12, 218, 24, 8);
  ctx.fillStyle = "#fff2cd"; ctx.beginPath(); ctx.arc(campX, 214, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#6a938d"; ctx.beginPath(); ctx.arc(campX + 5, 214, 3, -1.2, 1.2); ctx.stroke();

  for (const exit of Z.exits) {
    const open = !exit.requires || state.calmGuardians[exit.requires];
    ctx.fillStyle = open ? "#f0b66b" : "#9ab9aa";
    ctx.fillRect(exit.x - state.camera - 5, 192, 10, 38);
    ctx.beginPath(); ctx.arc(exit.x - state.camera, 191, 9, Math.PI, 0); ctx.fill();
  }

  if (state.dropped && state.dropped.zone === state.zoneId) {
    const x = state.dropped.x - state.camera, pulse = 5 + Math.sin(performance.now() * .01) * 2;
    ctx.globalAlpha = .25; ctx.fillStyle = "#fff0a3"; ctx.beginPath(); ctx.arc(x, 215, pulse * 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = "#ffd772"; ctx.beginPath(); ctx.arc(x, 215, pulse, 0, Math.PI * 2); ctx.fill();
  }

  const creatureAsset = ART.assets.creatures;
  const lateRow = num(state.zoneId) > 4 ? 1 : 0;
  for (const creature of state.creatures) {
    if (creature.calm) continue;
    frame(ctx, creatureAsset, lateRow * 5 + creature.def.archetype, creature.x - state.camera, 232, 86, 78, creature.face > 0, creature.state === "hurt" ? .62 : 1);
  }

  for (const projectile of state.projectiles) {
    ctx.fillStyle = "#8bcbd0"; ctx.beginPath(); ctx.arc(projectile.x - state.camera, projectile.y, 5, 0, Math.PI * 2); ctx.fill();
  }

  for (const guardian of state.guardians) {
    if (guardian.calm) continue;
    const id = num(guardian.slot.id);
    const asset = ART.assets[id <= 6 ? "guardians01" : "guardians07"];
    const index = id <= 6 ? id - 1 : id - 7;
    const alpha = guardian.state === "rest" ? .68 : 1;
    frame(ctx, asset, index, guardian.x - state.camera, 234, id === 12 ? 170 : 142, id === 12 ? 170 : 145, guardian.face > 0, alpha);
  }

  frame(ctx, ART.assets.player, playerFrame(), p.x - state.camera, 233, p.state === "roll" ? 112 : 90, p.state === "roll" ? 76 : 98, p.face < 0, p.iframes > 0 && Math.floor(p.t / 2) % 2 ? .5 : 1);

  for (const value of particles) {
    value.x += value.vx; value.y += value.vy; value.vy += .04; value.life -= 1;
    ctx.globalAlpha = Math.max(0, value.life / 60); ctx.fillStyle = value.color;
    ctx.beginPath(); ctx.arc(value.x - state.camera, value.y, value.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  particles = particles.filter((value) => value.life > 0);

  if (note) {
    ctx.fillStyle = "rgba(52,85,82,.74)"; ctx.fillRect(45, 18, 390, 27);
    ctx.fillStyle = note.color; ctx.font = "12px sans-serif"; ctx.fillText(note.text, 58, 36);
    note.time -= 1; if (note.time <= 0) note = null;
  }

  if (state.menu === "camp") drawCamp();
  if (state.menu === "ending") drawEnding();
}

function drawCamp() {
  const options = campOptions();
  ctx.fillStyle = "rgba(255,251,226,.92)";
  ctx.fillRect(75, 45, 330, 55 + options.length * 23);
  ctx.strokeStyle = "#77a69e"; ctx.strokeRect(75, 45, 330, 55 + options.length * 23);
  ctx.fillStyle = "#4a7374"; ctx.font = "13px sans-serif";
  ctx.fillText(`露营茶桌 · 碎片 ${state.player.fragments}`, 94, 68);
  options.forEach((option, i) => {
    ctx.fillStyle = i === state.menuIndex ? "#d67859" : "#55797a";
    ctx.fillText(`${i === state.menuIndex ? "▶ " : "   "}${option.label}`, 94, 94 + i * 23);
  });
}

function drawEnding() {
  const asset = ART.assets.ending;
  if (asset) {
    const sw = asset.width / 2, sx = state.menuIndex * sw;
    ctx.globalAlpha = .88; ctx.drawImage(asset.image, sx, 0, sw, asset.height, 0, 0, 480, 270); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(255,251,226,.86)"; ctx.fillRect(75, 60, 330, 115);
  ctx.strokeStyle = "#7ba8a0"; ctx.strokeRect(75, 60, 330, 115);
  ctx.fillStyle = "#4a7374"; ctx.font = "14px sans-serif"; ctx.fillText("最后一封信已经送达", 100, 87);
  ENDINGS.forEach((ending, i) => {
    ctx.fillStyle = i === state.menuIndex ? "#d67859" : "#55797a";
    ctx.fillText(`${i === state.menuIndex ? "▶ " : "   "}${ending.name} — ${ending.desc}`, 100, 118 + i * 28);
  });
}

function hud() {
  const p = state.player;
  $("hpfill").style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
  $("stfill").style.width = `${Math.max(0, p.st / p.maxSt) * 100}%`;
  $("fragments").textContent = p.fragments;
  $("tea").textContent = `${p.tea}/${state.teaMax}`;
  $("zone").textContent = zone().name;
  $("letters").textContent = `${Object.keys(state.deliveredLetters).length}/8`;
  $("guardians").textContent = `${Object.keys(state.calmGuardians).length}/12`;
  const active = state.guardians.find((value) => value.active && !value.calm);
  if (active) $("guardianfill").style.width = `${Math.max(0, active.hp / active.maxHp) * 100}%`;
}

function showOverlay(title, message, canContinue) {
  $("overlay-title").textContent = title; $("overlay-msg").textContent = message;
  $("btn-continue").style.display = canContinue ? "block" : "none";
  $("overlay").classList.remove("hidden"); state.running = false;
}
function hideOverlay() { $("overlay").classList.add("hidden"); state.running = true; }

function newGame() {
  save.reset();
  state.calmGuardians = {}; state.deliveredLetters = {};
  state.stats = { heart: 0, breath: 0, chime: 0 };
  state.teaMax = 4; state.dropped = null; state.ending = null; state.challengeBest = 0;
  enterZone("z01", null, 0); hideOverlay();
}
function continueGame() {
  const data = save.load();
  if (!data) { $("overlay-msg").textContent = "还没有可以继续的旅程。"; return; }
  restore(data); hideOverlay();
}

$("btn-start").addEventListener("click", newGame);
$("btn-continue").addEventListener("click", continueGame);

function loop() {
  if (state.running) {
    if (state.menu) menuUpdate();
    else {
      updatePlayer();
      state.creatures.forEach(updateCreature);
      state.guardians.forEach(updateGuardian);
      updateProjectiles();
      challengeUpdate();
    }
    hud();
  }
  drawWorld();
  requestAnimationFrame(loop);
}

async function boot() {
  [CONFIG, CREATURES, ART] = await Promise.all([
    fetch("./content/config.json").then((r) => r.json()),
    fetch("./content/creatures.json").then((r) => r.json()),
    loadArt(),
  ]);
  await Promise.all(ZONE_IDS.map(async (id) => { ZONES[id] = await fetch(`./content/zones/${id}.json`).then((r) => r.json()); }));
  await Promise.all(GUARDIAN_IDS.map(async (id) => { GUARDIANS[id] = await fetch(`./content/guardians/${id}.json`).then((r) => r.json()); }));
  await ART.zone("z01");
  const data = save.load();
  state.player = playerAt(ZONES.z01.camp.x);
  spawnCreatures(); spawnGuardians();
  showOverlay(
    "风铃岛纪行",
    "成为风语邮差，穿过八座岛区，把迟到的信交给居民，并用共鸣安抚十二位守护灵。",
    !!data
  );
  loop();
}

boot();
