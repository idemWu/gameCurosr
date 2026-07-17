#!/usr/bin/env node
/**
 * Hub structure checker.
 * - Always validates registry + template + briefs
 * - If a game directory exists, validates MVP file set
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "games/_registry.json");
const requiredHub = [
  "README.md",
  "docs/portfolio.md",
  "docs/agent-prompts.md",
  "shared/template/index.html",
  "shared/template/styles.css",
  "shared/template/main.js",
  "shared/template/README.md",
  "games/_registry.json",
];
const requiredGameFiles = ["index.html", "styles.css", "main.js", "README.md"];

let failed = false;
function ok(msg) {
  console.log(`✓ ${msg}`);
}
function bad(msg) {
  failed = true;
  console.error(`✗ ${msg}`);
}

for (const rel of requiredHub) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) ok(`hub: ${rel}`);
  else bad(`missing hub file: ${rel}`);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
if (!Array.isArray(registry.games) || registry.games.length !== 16) {
  bad(`registry.games must have 16 entries, got ${registry.games?.length}`);
} else {
  ok("registry has 16 games");
}

for (const g of registry.games) {
  const brief = path.join(root, "docs/briefs", `${g.id}-${g.slug}.md`);
  if (fs.existsSync(brief)) ok(`brief: ${g.id}-${g.slug}.md`);
  else bad(`missing brief: docs/briefs/${g.id}-${g.slug}.md`);

  const dir = path.join(root, g.path);
  if (!fs.existsSync(dir)) {
    console.log(`· pending game dir (ok on hub): ${g.path}`);
    continue;
  }
  for (const f of requiredGameFiles) {
    const fp = path.join(dir, f);
    if (fs.existsSync(fp)) ok(`${g.path}/${f}`);
    else bad(`missing ${g.path}/${f}`);
  }
}

if (failed) {
  console.error("\nStructure check FAILED");
  process.exit(1);
}
console.log("\nStructure check PASSED");
