function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load art asset: ${path}`));
    image.src = path;
  });
}

export async function loadHandPaintedArt() {
  try {
    const response = await fetch("./assets/handpainted/manifest.json");
    if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
    const manifest = await response.json();
    const loaded = {};
    const ensure = async (ids) => {
      await Promise.all(ids.map(async (id) => {
        if (loaded[id] || !manifest.assets[id]) return;
        const meta = manifest.assets[id];
        const image = await loadImage(meta.path);
        loaded[id] = { ...meta, image };
      }));
      return loaded;
    };
    const core = [
      "player", "z01Enemies", "b01", "z01Background",
      "enemyRosterA", "enemyRosterB",
      "bossRoster01", "bossRoster07", "bossRoster13",
      "ui",
    ];
    await ensure(core);
    return {
      ready: true,
      style: manifest.style,
      assets: loaded,
      ensure,
    };
  } catch (error) {
    console.warn("Hand-painted art unavailable; procedural fallback enabled.", error);
    return { ready: false, assets: {}, error };
  }
}
