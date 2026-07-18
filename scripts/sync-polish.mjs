#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "shared/polish");
const files = ["draw.js", "juice.js", "audio.js"];
const pauseSrc = path.join(root, "shared/longplay/pause.js");
const saveSrc = path.join(root, "shared/longplay/save.js");
const pauseCss = path.join(root, "shared/longplay/pause.css");

const games = fs.readdirSync(path.join(root, "games"))
  .filter((n) => /^\d{2}-/.test(n) && !n.startsWith("17"))
  .map((n) => path.join(root, "games", n));

for (const dir of games) {
  const lib = path.join(dir, "lib");
  fs.mkdirSync(lib, { recursive: true });
  for (const f of files) {
    fs.copyFileSync(path.join(src, f), path.join(lib, f));
  }
  fs.copyFileSync(path.join(src, "theme.css"), path.join(dir, "theme.css"));
  fs.copyFileSync(pauseSrc, path.join(lib, "pause.js"));
  fs.copyFileSync(saveSrc, path.join(lib, "save.js"));
  fs.copyFileSync(pauseCss, path.join(lib, "pause.css"));
  console.log("synced", path.basename(dir));
}
console.log("done", games.length);
