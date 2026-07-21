# shared/art — Art V2

高品质视觉工具包（对标独立精品气质，原创像素精灵 + Canvas 光影）。

| 路径 | 用途 |
|------|------|
| `art.js` | `GameArt`：天空/水面/山丘/光晕/面板/精灵绘制 |
| `ui.css` | 高级 UI 壳（标题、HUD、按钮、遮罩） |
| `sprites/*.png` | 程序生成像素精灵（`scripts/art/gen_sprites.py`） |

## 复制到游戏

```bash
node scripts/sync-art.mjs
```

各游戏目录得到：`lib/art.js`、`art/sprites/*`、`art.css`（或链到 theme）。
