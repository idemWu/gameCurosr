/**
 * Minimal localStorage save helper for longplay games.
 * Usage: const save = LongplaySave.create('game-01-cozy-harbor', 1);
 */
(function (global) {
  function create(key, version) {
    const storageKey = `gameCurosr:${key}:v${version || 1}`;
    return {
      key: storageKey,
      load() {
        try {
          const raw = localStorage.getItem(storageKey);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      },
      save(data) {
        const payload = Object.assign({ savedAt: Date.now(), version: version || 1 }, data);
        localStorage.setItem(storageKey, JSON.stringify(payload));
        return payload;
      },
      reset() {
        localStorage.removeItem(storageKey);
      },
    };
  }
  global.LongplaySave = { create };
})(typeof window !== "undefined" ? window : globalThis);
