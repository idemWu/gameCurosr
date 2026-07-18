/**
 * Tiny WebAudio SFX bus with mute toggle (localStorage).
 * global: PolishAudio
 *
 * Usage:
 *   const sfx = PolishAudio.create("01-cozy-harbor");
 *   sfx.ui(); sfx.ok(); sfx.fail(); sfx.hit(); sfx.pickup(); sfx.levelup();
 *   sfx.mountMuteButton(); // optional floating mute btn
 */
(function (global) {
  function create(gameId) {
    const key = `gameCurosr:mute:${gameId || "default"}`;
    let muted = false;
    try { muted = localStorage.getItem(key) === "1"; } catch (e) { /* ignore */ }
    let ctx = null;

    function ensure() {
      if (!ctx) {
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }

    function beep(freq, dur, type, gain) {
      if (muted) return;
      const ac = ensure();
      if (!ac) return;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || "square";
      o.frequency.value = freq;
      g.gain.value = gain == null ? 0.045 : gain;
      o.connect(g);
      g.connect(ac.destination);
      const t0 = ac.currentTime;
      g.gain.setValueAtTime(g.gain.value, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    }

    function chord(freqs, dur) {
      freqs.forEach((f, i) => setTimeout(() => beep(f, dur, "triangle", 0.035), i * 40));
    }

    const api = {
      get muted() { return muted; },
      setMuted(v) {
        muted = !!v;
        try { localStorage.setItem(key, muted ? "1" : "0"); } catch (e) { /* ignore */ }
        api._syncBtn && api._syncBtn();
      },
      toggleMute() { api.setMuted(!muted); return muted; },
      ui() { beep(520, 0.05, "sine", 0.03); },
      ok() { chord([523, 659, 784], 0.08); },
      fail() { beep(160, 0.16, "sawtooth", 0.04); },
      hit() { beep(220, 0.07, "square", 0.05); },
      pickup() { beep(880, 0.06, "triangle", 0.04); beep(1175, 0.08, "triangle", 0.03); },
      levelup() { chord([392, 523, 659, 784], 0.1); },
      tap() { beep(640, 0.04, "square", 0.028); },
      mountMuteButton() {
        let btn = document.querySelector(".lp-mute-btn");
        if (!btn) {
          btn = document.createElement("button");
          btn.type = "button";
          btn.className = "lp-mute-btn";
          document.body.appendChild(btn);
        }
        function sync() { btn.textContent = muted ? "🔇" : "🔊"; btn.title = muted ? "取消静音" : "静音"; }
        api._syncBtn = sync;
        sync();
        btn.onclick = () => { api.toggleMute(); api.ui(); };
        return btn;
      },
    };
    return api;
  }

  global.PolishAudio = { create };
})(typeof window !== "undefined" ? window : globalThis);
