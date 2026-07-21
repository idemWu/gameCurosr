#!/usr/bin/env node
/**
 * Smoke: static polish asset check + optional browser load/start for 16 games.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "games/_registry.json"), "utf8"));

function staticCheck() {
  let bad = 0;
  for (const g of registry.games) {
    const dir = path.join(root, g.path);
    for (const f of [
      "index.html", "main.js", "styles.css", "theme.css",
      "lib/draw.js", "lib/juice.js", "lib/audio.js", "lib/save.js", "lib/pause.js",
    ]) {
      if (!fs.existsSync(path.join(dir, f))) {
        console.error("missing", g.path, f);
        bad += 1;
      }
    }
    const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
    for (const need of ["lib/draw.js", "lib/juice.js", "lib/audio.js", "main.js"]) {
      if (!html.includes(need)) {
        console.error("index missing script", g.path, need);
        bad += 1;
      }
    }
  }
  if (bad) {
    console.error(`STATIC FAIL (${bad})`);
    process.exit(1);
  }
  console.log("STATIC OK: 16 games have polish assets + scripts linked");
}

async function puppeteerSmoke() {
  let puppeteer;
  try {
    puppeteer = (await import("puppeteer-core")).default;
  } catch {
    console.log("puppeteer-core not available — skip browser smoke");
    return;
  }
  const chrome =
    process.env.CHROME_PATH ||
    ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find((p) =>
      fs.existsSync(p)
    );
  if (!chrome) {
    console.log("no chrome binary — skip browser smoke");
    return;
  }

  const server = spawn("python3", ["-m", "http.server", "8765"], { cwd: root, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 700));
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: chrome,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  let fail = 0;
  for (const g of registry.games) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message || e)));
    const url = `http://127.0.0.1:8765/${g.path}/`;
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
      await page.waitForSelector("#btn-start", { timeout: 8000 });
      await page.click("#btn-start");
      await new Promise((r) => setTimeout(r, 500));
      const canvas = await page.$("#game");
      if (!canvas) throw new Error("no canvas");
      if (errors.length) throw new Error(errors.join(" | "));
      console.log("OK", g.id, g.name);
    } catch (e) {
      console.error("FAIL", g.id, g.name, e.message);
      fail += 1;
    }
    await page.close();
  }
  await browser.close();
  server.kill("SIGTERM");
  if (fail) {
    console.error(`BROWSER SMOKE FAIL ${fail}/16`);
    process.exit(1);
  }
  console.log("BROWSER SMOKE OK 16/16");
}

staticCheck();
await puppeteerSmoke();
