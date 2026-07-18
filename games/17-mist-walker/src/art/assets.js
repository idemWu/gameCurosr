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
    const entries = await Promise.all(
      Object.entries(manifest.assets).map(async ([id, meta]) => {
        const image = await loadImage(meta.path);
        return [id, { ...meta, image }];
      })
    );
    return {
      ready: true,
      style: manifest.style,
      assets: Object.fromEntries(entries),
    };
  } catch (error) {
    console.warn("Hand-painted art unavailable; procedural fallback enabled.", error);
    return { ready: false, assets: {}, error };
  }
}
