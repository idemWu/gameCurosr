/**
 * Canvas drawing helpers for gameCurosr polish pass.
 * global: PolishDraw
 */
(function (global) {
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, w, h, r, color) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  }

  function strokeRoundRect(ctx, x, y, w, h, r, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
  }

  function disk(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function capsule(ctx, x, y, w, h, color) {
    fillRoundRect(ctx, x, y, w, h, h / 2, color);
  }

  function bar(ctx, x, y, w, h, ratio, bg, fg, border) {
    fillRoundRect(ctx, x, y, w, h, h / 2, bg || "#1f2937");
    const rw = Math.max(0, Math.min(1, ratio)) * (w - 2);
    if (rw > 0) fillRoundRect(ctx, x + 1, y + 1, rw, h - 2, (h - 2) / 2, fg || "#34d399");
    if (border) strokeRoundRect(ctx, x, y, w, h, h / 2, border, 1);
  }

  function bubble(ctx, text, x, y, opts) {
    const o = opts || {};
    ctx.font = o.font || "12px sans-serif";
    const pad = o.pad || 8;
    const tw = ctx.measureText(text).width;
    const bw = tw + pad * 2;
    const bh = 22;
    const bx = x - bw / 2;
    const by = y - bh - 6;
    fillRoundRect(ctx, bx, by, bw, bh, 8, o.bg || "rgba(15,23,42,.88)");
    ctx.fillStyle = o.fg || "#f8fafc";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + pad, by + bh / 2 + 1);
  }

  /** Simple person: head + body + optional accent */
  function person(ctx, x, y, color, accent) {
    disk(ctx, x, y - 10, 5, color || "#f8fafc");
    fillRoundRect(ctx, x - 5, y - 4, 10, 12, 3, color || "#f8fafc");
    if (accent) fillRoundRect(ctx, x - 5, y + 2, 10, 4, 2, accent);
  }

  function chest(ctx, x, y, open) {
    fillRoundRect(ctx, x - 8, y - 5, 16, 12, 2, open ? "#92400e" : "#f59e0b");
    fillRoundRect(ctx, x - 8, y - 9, 16, 5, 2, "#b45309");
    disk(ctx, x, y + 1, 2, "#fde68a");
  }

  function star(ctx, x, y, r, color) {
    ctx.fillStyle = color || "#fef08a";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const ax = x + Math.cos(a) * r;
      const ay = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(ax, ay);
      else ctx.lineTo(ax, ay);
      const b = a + Math.PI / 5;
      ctx.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45);
    }
    ctx.closePath();
    ctx.fill();
  }

  function gem(ctx, x, y, size, color) {
    const s = size || 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.85, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.85, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y - s * 0.4);
    ctx.lineTo(x + s * 0.15, y - s * 0.55);
    ctx.lineTo(x + s * 0.05, y - s * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  function softBg(ctx, w, h, c1, c2, vertical) {
    const g = vertical === false
      ? ctx.createLinearGradient(0, 0, w, 0)
      : ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function vignette(ctx, w, h, alpha) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${alpha == null ? 0.35 : alpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  global.PolishDraw = {
    roundRect,
    fillRoundRect,
    strokeRoundRect,
    disk,
    capsule,
    bar,
    bubble,
    person,
    chest,
    star,
    gem,
    softBg,
    vignette,
  };
})(typeof window !== "undefined" ? window : globalThis);
