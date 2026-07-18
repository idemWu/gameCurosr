export function frameRect(asset, frame) {
  const column = frame % asset.columns;
  const row = Math.floor(frame / asset.columns);
  return {
    x: Math.floor(column * asset.width / asset.columns),
    y: Math.floor(row * asset.height / asset.rows),
    w: Math.ceil(asset.width / asset.columns),
    h: Math.ceil(asset.height / asset.rows),
  };
}

export function drawFrame(ctx, asset, frame, x, groundY, width, height, flip = false, alpha = 1) {
  const src = frameRect(asset, frame);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(Math.round(x), 0);
    ctx.scale(-1, 1);
    ctx.drawImage(asset.image, src.x, src.y, src.w, src.h, -width / 2, groundY - height, width, height);
  } else {
    ctx.drawImage(asset.image, src.x, src.y, src.w, src.h, x - width / 2, groundY - height, width, height);
  }
  ctx.restore();
}

export function playerFrame(player) {
  if (player.state === "dodge") return 10 + Math.floor(player.t / 7) % 2;
  if (player.state === "light") return 5 + Math.floor(player.t / 10) % 2;
  if (player.state === "heavy") return 7 + Math.floor(player.t / 13) % 2;
  if (player.state === "hurt") return 11;
  if (player.state === "run") return [2, 3, 4][Math.floor(player.t / 7) % 3];
  return Math.floor(player.t / 28) % 2;
}

export function enemyFrame(enemy, archetype) {
  const column = Math.max(0, Math.min(2, archetype));
  let row = 0;
  if (enemy.state === "attack") row = 1;
  if (enemy.state === "hurt") row = 2;
  return row * 3 + column;
}

export function bossFrame(boss) {
  if (boss.dead) return 7;
  const phaseTwo = boss.hp / boss.maxHp <= 0.5;
  if (boss.state === "stagger") return phaseTwo ? 6 : 3;
  if (boss.state === "attack") {
    if (boss.move && (boss.move.id === "stomp" || boss.move.id === "anchor")) return phaseTwo ? 6 : 2;
    return phaseTwo ? 5 : 1;
  }
  return phaseTwo ? 4 : 0;
}
