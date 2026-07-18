#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const games = fs
  .readdirSync(path.join(root, "games"))
  .filter((n) => /^\d{2}-/.test(n) && !n.startsWith("17"));

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

for (const g of games) {
  const dir = path.join(root, "games", g);
  const lib = path.join(dir, "lib");
  fs.mkdirSync(lib, { recursive: true });
  fs.copyFileSync(path.join(root, "shared/art/art.js"), path.join(lib, "art.js"));
  fs.copyFileSync(path.join(root, "shared/art/ui.css"), path.join(dir, "art.css"));
  copyDir(path.join(root, "shared/art/sprites"), path.join(dir, "art", "sprites"));
  console.log("synced art →", g);
}
console.log("done", games.length);
