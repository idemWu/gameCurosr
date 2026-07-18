function image(path) {
  return new Promise((resolve, reject) => {
    const value = new Image();
    value.decoding = "async";
    value.onload = () => resolve(value);
    value.onerror = () => reject(new Error(`Unable to load ${path}`));
    value.src = path;
  });
}

export async function loadArt() {
  const response = await fetch("./assets/handpainted/manifest.json");
  const manifest = await response.json();
  const assets = {};
  const loadEntries = async (entries) => {
    await Promise.all(Object.entries(entries).map(async ([id, meta]) => {
      if (assets[id]) return;
      assets[id] = { ...meta, image: await image(meta.path) };
    }));
  };
  await loadEntries(manifest.core);
  return {
    ready: true,
    assets,
    async zone(id) {
      if (!assets[id] && manifest.lazy[id]) await loadEntries({ [id]: manifest.lazy[id] });
      return assets[id];
    },
  };
}

export function frame(ctx, asset, index, x, ground, width, height, flip = false, alpha = 1) {
  const sw = asset.width / asset.columns;
  const sh = asset.height / asset.rows;
  const sx = (index % asset.columns) * sw;
  const sy = Math.floor(index / asset.columns) * sh;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(asset.image, sx, sy, sw, sh, -width / 2, ground - height, width, height);
  } else {
    ctx.drawImage(asset.image, sx, sy, sw, sh, x - width / 2, ground - height, width, height);
  }
  ctx.restore();
}
