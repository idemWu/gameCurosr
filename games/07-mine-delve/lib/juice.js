/**
 * Lightweight juice: float text, particles, shake, flash.
 * global: PolishJuice
 *
 * Usage:
 *   const juice = PolishJuice.create();
 *   juice.float("+10", x, y, "#fff");
 *   juice.burst(x, y, "#fbbf24");
 *   juice.shake(4);
 *   juice.flash("rgba(255,255,255,.25)");
 *   // in loop:
 *   juice.update(dt);
 *   ctx.save(); juice.applyShake(ctx); ...draw...; juice.draw(ctx); ctx.restore();
 *   juice.drawFlash(ctx, canvas.width, canvas.height);
 */
(function (global) {
  function create() {
    const floats = [];
    const particles = [];
    let shakeT = 0;
    let shakeMag = 0;
    let flash = null;

    return {
      float(text, x, y, color) {
        floats.push({ text, x, y, color: color || "#f8fafc", t: 0, life: 0.9 });
      },
      burst(x, y, color, n) {
        const count = n || 10;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 40 + Math.random() * 80;
          particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            color: color || "#fde68a",
            t: 0,
            life: 0.45 + Math.random() * 0.35,
            r: 1.5 + Math.random() * 2.5,
          });
        }
      },
      shake(mag, dur) {
        shakeMag = mag || 4;
        shakeT = dur || 0.22;
      },
      flash(color, dur) {
        flash = { color: color || "rgba(255,255,255,.28)", t: 0, life: dur || 0.12 };
      },
      update(dt) {
        const d = Math.min(0.05, dt || 0.016);
        for (let i = floats.length - 1; i >= 0; i--) {
          const f = floats[i];
          f.t += d;
          f.y -= 28 * d;
          if (f.t >= f.life) floats.splice(i, 1);
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.t += d;
          p.x += p.vx * d;
          p.y += p.vy * d;
          p.vy += 120 * d;
          if (p.t >= p.life) particles.splice(i, 1);
        }
        if (shakeT > 0) shakeT = Math.max(0, shakeT - d);
        if (flash) {
          flash.t += d;
          if (flash.t >= flash.life) flash = null;
        }
      },
      applyShake(ctx) {
        if (shakeT <= 0) return;
        const k = shakeT / 0.22;
        const m = shakeMag * k;
        ctx.translate((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m);
      },
      draw(ctx) {
        for (const p of particles) {
          const a = 1 - p.t / p.life;
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const f of floats) {
          const a = 1 - f.t / f.life;
          ctx.globalAlpha = a;
          ctx.fillStyle = f.color;
          ctx.fillText(f.text, f.x, f.y);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = "start";
      },
      drawFlash(ctx, w, h) {
        if (!flash) return;
        const a = 1 - flash.t / flash.life;
        ctx.globalAlpha = a;
        ctx.fillStyle = flash.color;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      },
    };
  }

  global.PolishJuice = { create };
})(typeof window !== "undefined" ? window : globalThis);
