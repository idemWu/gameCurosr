# [08] 云上跳岛

| 字段 | 值 |
|------|----|
| 分支 | `game/08-sky-hop` |
| 目录 | `games/08-sky-hop/` |
| 类型 | 轻冒险 |
| 状态目标 | `playable`（写入 registry 由 Hub 收束） |

## 核心循环

短关卡平台跳跃、收集羽毛过关

## 玩法与操作（建议）

左右移动+跳跃，收集羽毛到终点。

## 最低内容

≥5 关，羽毛收集与掉落重开。

## 硬性要求

- Vanilla HTML/CSS/JS，目录自包含：`index.html`、`styles.css`、`main.js`、`README.md`
- 开始界面 + 胜利/结束 + 再来一局
- 中文 UI 与 README
- **禁止种田/作物生长**；禁止抄袭商业游戏素材与商标
- **只修改** `games/08-sky-hop/`，不要改其他 `games/*`，不要改根 README / registry（Hub 负责）
- 可从 `shared/template/` 复制后改造

## 验收清单

- [ ] 静态服务器打开可玩，控制台无报错
- [ ] 主路径 2–5 分钟能完成一局
- [ ] README 含操作说明与启动方式
- [ ] 独立色板/标题，视觉可区分
- [ ] Draft PR 标题建议：`[08] 云上跳岛`

## 启动

```bash
python3 -m http.server 8080
# http://localhost:8080/games/08-sky-hop/
```
