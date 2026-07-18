/**
 * Art V2 — high-quality canvas helpers (sprites, lighting, sky, UI frames).
 * global: GameArt
 */
(function (global) {
  const cache = new Map();

  function loadImage(src) {
    if (cache.has(src)) return cache.get(src);
    const img = new Image();
    img.src = src;
    const p = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
    p.img = img;
    cache.set(src, p);
    return p;
  }

  async function loadAll(map) {
    const out = {};
    await Promise.all(
      Object.entries(map).map(async ([k, src]) => {
        out[k] = await loadImage(src);
      })
    );
    return out;
  }

  function drawImage(ctx, img, x, y, w, h) {
    if (!img) return;
    if (w == null) ctx.drawImage(img, x, y);
    else ctx.drawImage(img, x, y, w, h);
  }

  function drawSprite(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!img) return;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw || sw, dh || sh);
  }

  /** Soft painted sky */
  function sky(ctx, w, h, top, mid, bot) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid || top);
    g.addColorStop(1, bot || mid || top);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function sun(ctx, x, y, r, color, glow) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    g.addColorStop(0, glow || "rgba(255,245,180,.55)");
    g.addColorStop(1, "rgba(255,245,180,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color || "#ffe8a3";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function moon(ctx, x, y, r) {
    ctx.fillStyle = "#e8eef8";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(15,23,42,.55)";
    ctx.beginPath();
    ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  function hills(ctx, y, amp, color, phase, w) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, hSafe(ctx) );
    ctx.lineTo(0, y);
    for (let x = 0; x <= w; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + phase) * amp);
    }
    ctx.lineTo(w, hSafe(ctx));
    ctx.closePath();
    ctx.fill();
  }

  function hSafe(ctx) {
    return ctx.canvas ? ctx.canvas.height : 270;
  }

  function water(ctx, y, w, h, t, c1, c2) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, c1 || "#3aa0c8");
    g.addColorStop(1, c2 || "#1a5f86");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const yy = y + 10 + i * 12;
      for (let x = 0; x <= w; x += 6) {
        const wave = Math.sin(t * 1.6 + x * 0.05 + i) * 2.2;
        if (x === 0) ctx.moveTo(x, yy + wave);
        else ctx.lineTo(x, yy + wave);
      }
      ctx.stroke();
    }
  }

  function vignette(ctx, w, h, a) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(8,12,20,${a == null ? 0.4 : a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function filmGrain(ctx, w, h, t, alpha) {
    // cheap deterministic speckles
    ctx.fillStyle = `rgba(255,255,255,${alpha == null ? 0.03 : alpha})`;
    const n = 40;
    for (let i = 0; i < n; i++) {
      const x = ((i * 97 + Math.floor(t * 30) * 13) % w);
      const y = ((i * 57 + Math.floor(t * 17) * 29) % h);
      ctx.fillRect(x, y, 1, 1);
    }
  }

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

  function panel(ctx, x, y, w, h, opts) {
    const o = opts || {};
    ctx.save();
    roundRect(ctx, x, y, w, h, o.r || 12);
    ctx.fillStyle = o.bg || "rgba(18, 26, 40, 0.82)";
    ctx.fill();
    if (o.border !== false) {
      ctx.strokeStyle = o.border || "rgba(250, 210, 120, 0.65)";
      ctx.lineWidth = o.bw || 2;
      ctx.stroke();
    }
    // top shine
    roundRect(ctx, x + 2, y + 2, w - 4, Math.max(8, h * 0.18), 8);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.restore();
  }

  function bar(ctx, x, y, w, h, ratio, fg, bg) {
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = bg || "rgba(0,0,0,.35)";
    ctx.fill();
    const rw = Math.max(0, Math.min(1, ratio)) * w;
    if (rw > 1) {
      roundRect(ctx, x, y, rw, h, h / 2);
      ctx.fillStyle = fg || "#6ee7b7";
      ctx.fill();
    }
  }

  function text(ctx, str, x, y, opts) {
    const o = opts || {};
    ctx.font = o.font || "bold 13px 'Segoe UI', 'PingFang SC', sans-serif";
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.base || "alphabetic";
    if (o.shadow !== false) {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillText(str, x + 1, y + 1);
    }
    ctx.fillStyle = o.color || "#f8fafc";
    ctx.fillText(str, x, y);
  }

  function shadowEllipse(ctx, x, y, rx, ry) {
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  global.GameArt = {
    loadImage,
    loadAll,
    drawImage,
    drawSprite,
    sky,
    sun,
    moon,
    hills,
    water,
    vignette,
    filmGrain,
    roundRect,
    panel,
    bar,
    text,
    shadowEllipse,
  };
})(typeof window !== "undefined" ? window : globalThis);
