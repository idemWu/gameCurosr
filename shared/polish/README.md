# shared/polish

美术 / 音效 / 手感共用工具。各游戏应**复制**到 `games/<id>/lib/`（与 `longplay` 相同，自包含）。

| 文件 | 全局对象 | 用途 |
|------|----------|------|
| `draw.js` | `PolishDraw` | 圆角、血条、人物/宝箱/宝石简绘、渐变背景 |
| `juice.js` | `PolishJuice` | 浮动字、粒子、震屏、闪白 |
| `audio.js` | `PolishAudio` | WebAudio 短音效 + 静音按钮 |
| `theme.css` | — | HUD / overlay / 按钮主题（用 CSS 变量换色） |

## 复制

```bash
for d in games/0{1..9}-* games/1{0..6}-*; do
  cp shared/polish/draw.js shared/polish/juice.js shared/polish/audio.js "$d/lib/"
  cp shared/polish/theme.css "$d/" 2>/dev/null || true
done
```

在 `index.html` 中：

```html
<link rel="stylesheet" href="./theme.css" />
<!-- 或把 theme 变量合进 styles.css -->
<script src="./lib/draw.js"></script>
<script src="./lib/juice.js"></script>
<script src="./lib/audio.js"></script>
```

## 最小用法

```js
const sfx = PolishAudio.create("01-cozy-harbor");
sfx.mountMuteButton();
const juice = PolishJuice.create();
const D = PolishDraw;

// loop:
juice.update(dt);
ctx.save();
juice.applyShake(ctx);
D.softBg(ctx, 480, 270, "#0ea5e9", "#082f49");
// ... game draw ...
juice.draw(ctx);
juice.drawFlash(ctx, 480, 270);
ctx.restore();
```
