# [07] 矿灯深途

| 字段 | 值 |
|------|----|
| 分支 | `game/07-mine-delve` |
| 目录 | `games/07-mine-delve/` |
| 类型 | 轻冒险 |
| 状态目标 | `playable`（写入 registry 由 Hub 收束） |

## 核心循环

一层层下矿、挖矿石、规避或击退小怪、带着物资返回

## 玩法与操作（建议）

下潜多层挖矿，管理生命/灯火，返回上层结算。

## 最低内容

≥5 层或等价深度、矿石种类、危险与返回结算。

## 硬性要求

- Vanilla HTML/CSS/JS，目录自包含：`index.html`、`styles.css`、`main.js`、`README.md`
- 开始界面 + 胜利/结束 + 再来一局
- 中文 UI 与 README
- **禁止种田/作物生长**；禁止抄袭商业游戏素材与商标
- **只修改** `games/07-mine-delve/`，不要改其他 `games/*`，不要改根 README / registry（Hub 负责）
- 可从 `shared/template/` 复制后改造

## 验收清单

- [ ] 静态服务器打开可玩，控制台无报错
- [ ] 主路径 2–5 分钟能完成一局
- [ ] README 含操作说明与启动方式
- [ ] 独立色板/标题，视觉可区分
- [ ] Draft PR 标题建议：`[07] 矿灯深途`

## 启动

```bash
python3 -m http.server 8080
# http://localhost:8080/games/07-mine-delve/
```
