# Shared Game Template（Hub）

可运行的浏览器小游戏壳，供 16 个 Game Agent 复制后改造。

## 使用方式

```bash
# 在仓库根目录
cp -R shared/template games/01-cozy-harbor
# 然后改 games/01-cozy-harbor 内的标题、色板与玩法
```

## 本地预览

```bash
python3 -m http.server 8080
# http://localhost:8080/shared/template/
```

## 请替换

- `index.html` 标题与文案
- `styles.css` / `main.js` 中的 `PALETTE`
- `main.js` 核心循环（当前仅为收集星星的演示）

## 交付要求

见 `docs/portfolio.md` 与对应 `docs/briefs/NN-*.md`。
