/**
 * Tiny pause menu: Continue / New Game / Clear Save
 * LongplayPause.mount({ onContinue, onNewGame, onClearSave, onPause, onResume, title, statusText })
 */
(function (global) {
  function mount(opts) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lp-pause-btn";
    btn.textContent = "菜单";
    const overlay = document.createElement("div");
    overlay.className = "lp-pause";
    overlay.innerHTML = `
      <div class="panel">
        <h2>${opts.title || "游戏菜单"}</h2>
        <p id="lp-pause-msg" style="opacity:.85;font-size:.9rem"></p>
        <button type="button" data-act="continue">继续</button>
        <button type="button" data-act="new">重新开始</button>
        <button type="button" data-act="clear" class="danger">清除存档</button>
      </div>`;
    document.body.appendChild(btn);
    document.body.appendChild(overlay);
    const msg = overlay.querySelector("#lp-pause-msg");
    let openState = false;
    function open(text) {
      if (text) msg.textContent = text;
      overlay.classList.add("open");
      if (!openState) {
        openState = true;
        opts.onPause && opts.onPause();
      }
    }
    function close() {
      overlay.classList.remove("open");
      if (openState) {
        openState = false;
        opts.onResume && opts.onResume();
      }
    }
    btn.addEventListener("click", () => open(opts.statusText ? opts.statusText() : ""));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        close();
        opts.onContinue && opts.onContinue();
        return;
      }
      const act = e.target && e.target.getAttribute && e.target.getAttribute("data-act");
      if (!act) return;
      if (act === "continue") { close(); opts.onContinue && opts.onContinue(); }
      if (act === "new") { close(); opts.onNewGame && opts.onNewGame(); }
      if (act === "clear") { opts.onClearSave && opts.onClearSave(); msg.textContent = "存档已清除"; }
    });
    return { open, close, isOpen: () => openState };
  }
  global.LongplayPause = { mount };
})(typeof window !== "undefined" ? window : globalThis);
