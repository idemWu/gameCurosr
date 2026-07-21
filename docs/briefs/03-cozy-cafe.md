# [03] 暖汤咖啡馆

| 字段 | 值 |
|------|----|
| 分支 | `game/03-cozy-cafe` |
| 目录 | `games/03-cozy-cafe/` |
| 类型 | 治愈休闲 |
| 状态目标 | `playable`（写入 registry 由 Hub 收束） |

## 核心循环

接待客人、按喜好上饮料、用收入升级店铺

## 玩法与操作（建议）

按客人订单点选饮品；赚钱升级柜台/菜单。

## 最低内容

≥5 种饮品、客人气泡订单、至少 2 级店铺升级。

## 硬性要求

- Vanilla HTML/CSS/JS，目录自包含：`index.html`、`styles.css`、`main.js`、`README.md`
- 开始界面 + 胜利/结束 + 再来一局
- 中文 UI 与 README
- **禁止种田/作物生长**；禁止抄袭商业游戏素材与商标
- **只修改** `games/03-cozy-cafe/`，不要改其他 `games/*`，不要改根 README / registry（Hub 负责）
- 可从 `shared/template/` 复制后改造

## 验收清单

- [ ] 静态服务器打开可玩，控制台无报错
- [ ] 主路径 2–5 分钟能完成一局
- [ ] README 含操作说明与启动方式
- [ ] 独立色板/标题，视觉可区分
- [ ] Draft PR 标题建议：`[03] 暖汤咖啡馆`

## 启动

```bash
python3 -m http.server 8080
# http://localhost:8080/games/03-cozy-cafe/
```
