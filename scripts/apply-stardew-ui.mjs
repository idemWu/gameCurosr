#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "shared/art/ui-stardew.css"), "utf8");
const wood = path.join(root, "shared/art/ui/ui_wood_panel.png");
const btn = path.join(root, "shared/art/ui/ui_green_btn.png");

const META = {
  "01-cozy-harbor": ["港湾日记", "七天海边日常"],
  "02-cozy-fishing": ["晚潮钓手", "图鉴钓鱼"],
  "03-cozy-cafe": ["暖汤咖啡馆", "经营上菜"],
  "04-cozy-home": ["窗边小屋", "布置委托"],
  "05-grove-raid": ["林间轻旅", "探索战斗"],
  "06-ruin-puzzle": ["石纹遗迹", "机关解谜"],
  "07-mine-delve": ["矿灯深途", "下矿冒险"],
  "08-sky-hop": ["云上跳岛", "平台跳跃"],
  "09-ember-deck": ["余烬牌阵", "卡牌战役"],
  "10-paw-tactics": ["爪爪战棋", "回合战棋"],
  "11-bridge-td": ["桥上防线", "路径塔防"],
  "12-idle-stars": ["星尘挂机", "点击成长"],
  "13-match-gems": ["晶石三消", "三消闯关"],
  "14-merge-relics": ["遗物合成", "合成订单"],
  "15-shelf-sort": ["书架整理", "收纳关卡"],
  "16-forge-tap": ["铁匠锻炉", "锻造配方"],
};

function extractAside(html) {
  const m = html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
  if (!m) return "";
  return m[1]
    .replace(/<\/?div class="hud-inner">/g, "")
    .replace(/\s+class="primary"/g, "")
    .replace(/\s+class="secondary"/g, "")
    .replace(/id="(endday|cast|submit|actbtn|startwave|tap|craft|spawn|reset)"/g, 'id="$1" class="primary"')
    .replace(/id="(travel|clear|upgrade|endturn|worldsel|up)"/g, 'id="$1" class="secondary"')
    .trim();
}

function textById(html, id, fallback) {
  const re = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)<\\/`);
  const m = html.match(re);
  return m ? m[1].trim() : fallback;
}

const gamesDir = path.join(root, "games");
const games = fs.readdirSync(gamesDir).filter((n) => /^\d{2}-/.test(n) && !n.startsWith("17"));

for (const name of games) {
  const dir = path.join(gamesDir, name);
  const htmlPath = path.join(dir, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const [title, sub] = META[name] || [name, ""];
  const aside = extractAside(html);
  const overlayTitle = textById(html, "overlay-title", title);
  const overlayMsg = textById(html, "overlay-msg", sub);
  const hasContinue = html.includes("btn-continue");

  const scripts = [];
  for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    scripts.push(m[1]);
  }
  if (!scripts.includes("./lib/art.js")) {
    const i = scripts.findIndex((s) => s.includes("main.js"));
    if (i >= 0) scripts.splice(i, 0, "./lib/art.js");
    else scripts.push("./lib/art.js");
  }
  const scriptTags = scripts.map((s) => `<script src="${s}"></script>`).join("\n  ");

  const continueBtn = hasContinue
    ? '<button id="btn-continue" type="button" class="warm">继续游戏</button>'
    : "";

  const next = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="./ui-stardew.css" />
  <link rel="stylesheet" href="./lib/pause.css" />
</head>
<body>
  <div id="app">
    <header class="top">
      <div class="brand">
        <div class="eyebrow">gameCurosr</div>
        <h1>${title}</h1>
        <p class="subtitle">${sub} · 星露谷风 UI · 可存档</p>
      </div>
      <div class="chip">手绘风格 · 无种田</div>
    </header>
    <main class="stage">
      <section class="stage-frame" aria-label="游戏画面">
        <canvas id="game" width="480" height="270"></canvas>
      </section>
      <aside class="hud">
        <div class="hud-inner">
${aside}
        </div>
      </aside>
    </main>
    <div id="overlay" class="overlay">
      <div class="panel">
        <div class="panel-inner">
          <div class="seal">玩</div>
          <h2 id="overlay-title">${overlayTitle}</h2>
          <p id="overlay-msg">${overlayMsg}</p>
          ${continueBtn}
          <button id="btn-start" type="button" class="primary">新游戏</button>
        </div>
      </div>
    </div>
  </div>
  ${scriptTags}
</body>
</html>
`;

  fs.writeFileSync(htmlPath, next);
  fs.writeFileSync(path.join(dir, "ui-stardew.css"), css);
  fs.writeFileSync(path.join(dir, "styles.css"), '@import url("./ui-stardew.css");\n');
  const uiDir = path.join(dir, "art", "ui");
  fs.mkdirSync(uiDir, { recursive: true });
  fs.copyFileSync(wood, path.join(uiDir, "ui_wood_panel.png"));
  fs.copyFileSync(btn, path.join(uiDir, "ui_green_btn.png"));
  console.log("applied", name);
}

console.log("done", games.length);
