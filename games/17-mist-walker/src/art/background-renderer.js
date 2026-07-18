function drawCover(ctx, image, x, y, width, height, offsetX = 0) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const maxSourceX = Math.max(0, image.width - sourceWidth);
  const sourceX = Math.max(0, Math.min(maxSourceX, offsetX * maxSourceX));
  const sourceY = Math.max(0, (image.height - sourceHeight) * 0.5);
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

export function drawHandPaintedDock(ctx, art, camera, worldWidth, time) {
  const background = art.assets.z01Background;
  const foreground = art.assets.z01Foreground;
  if (!background) return false;

  const progress = worldWidth > 480 ? camera / (worldWidth - 480) : 0;
  drawCover(ctx, background.image, 0, 0, 480, 270, progress * 0.75);

  // Atmospheric veil keeps actors readable against a detailed painting.
  const veil = ctx.createLinearGradient(0, 100, 0, 250);
  veil.addColorStop(0, "rgba(4,14,22,.12)");
  veil.addColorStop(0.65, "rgba(4,14,22,.38)");
  veil.addColorStop(1, "rgba(2,7,12,.62)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 90, 480, 180);

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#c9e4eb";
  const shift = (time * 0.006) % 220;
  for (let i = -1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(i * 180 + shift, 142 + (i % 2) * 24, 130, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  return {
    drawForeground() {
      if (!foreground) return;
      ctx.save();
      ctx.globalAlpha = 0.78;
      drawCover(ctx, foreground.image, 0, 0, 480, 270, progress);
      ctx.restore();
    },
  };
}
