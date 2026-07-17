# gameCurosr · 16 款休闲小游戏组合（Hub）

浏览器小游戏作品集枢纽仓库。覆盖四大类共 **16 款 MVP**，**不做种菜/种田**。

> **当前分支职责（模式 A）**：只提供总览、模板、任务书与 Agent 提示词。  
> 16 款游戏本体由 **16 个独立 Agent / 分支** 实现。

## 四大类

1. **治愈休闲** — 01–04  
2. **轻冒险** — 05–08  
3. **卡牌 / 放置 / 轻度策略** — 09–12  
4. **益智 / 超休闲** — 13–16  

## 游戏清单与分支

| # | 游戏 | 类型 | 分支 | 目录 | 状态 |
|---|------|------|------|------|------|
| 01 | 港湾日记 | 治愈休闲 | `game/01-cozy-harbor` | `games/01-cozy-harbor/` | pending |
| 02 | 晚潮钓手 | 治愈休闲 | `game/02-cozy-fishing` | `games/02-cozy-fishing/` | pending |
| 03 | 暖汤咖啡馆 | 治愈休闲 | `game/03-cozy-cafe` | `games/03-cozy-cafe/` | pending |
| 04 | 窗边小屋 | 治愈休闲 | `game/04-cozy-home` | `games/04-cozy-home/` | pending |
| 05 | 林间轻旅 | 轻冒险 | `game/05-grove-raid` | `games/05-grove-raid/` | pending |
| 06 | 石纹遗迹 | 轻冒险 | `game/06-ruin-puzzle` | `games/06-ruin-puzzle/` | pending |
| 07 | 矿灯深途 | 轻冒险 | `game/07-mine-delve` | `games/07-mine-delve/` | pending |
| 08 | 云上跳岛 | 轻冒险 | `game/08-sky-hop` | `games/08-sky-hop/` | pending |
| 09 | 余烬牌阵 | 策略 | `game/09-ember-deck` | `games/09-ember-deck/` | pending |
| 10 | 爪爪战棋 | 策略 | `game/10-paw-tactics` | `games/10-paw-tactics/` | pending |
| 11 | 桥上防线 | 策略 | `game/11-bridge-td` | `games/11-bridge-td/` | pending |
| 12 | 星尘挂机 | 策略 | `game/12-idle-stars` | `games/12-idle-stars/` | pending |
| 13 | 晶石三消 | 益智 | `game/13-match-gems` | `games/13-match-gems/` | pending |
| 14 | 遗物合成 | 益智 | `game/14-merge-relics` | `games/14-merge-relics/` | pending |
| 15 | 书架整理 | 益智 | `game/15-shelf-sort` | `games/15-shelf-sort/` | pending |
| 16 | 铁匠一点通 | 益智 | `game/16-forge-tap` | `games/16-forge-tap/` | pending |

机器可读清单：[`games/_registry.json`](./games/_registry.json)

## 如何开 16 个 Game Agent

1. 确认本 Hub 已推送到远程（含 `shared/template/`）。  
2. 打开 [`docs/agent-prompts.md`](./docs/agent-prompts.md)。  
3. 对每一款复制对应提示词，在 Cursor 对 **同一仓库** 新建一个 Cloud Agent。  
4. 每个 Agent 使用独立分支 `game/NN-slug`，**只改自己的游戏目录**。  
5. 全部完成后，再开一个 Hub 收束任务：更新本 README 状态与 registry。

单款详细任务书：[`docs/briefs/`](./docs/briefs/)  
组合与验收标准：[`docs/portfolio.md`](./docs/portfolio.md)

## 模板预览

```bash
python3 -m http.server 8080
# http://localhost:8080/shared/template/
```

```bash
node scripts/check-structure.mjs
```

## 冲突避免（重要）

- Game Agent **不要**修改根 `README.md`、`games/_registry.json`、其他 `games/*`
- 只允许修改：`games/<自己的 id-slug>/**`
- 可用：`shared/template/`（复制，勿在模板里堆业务）

## 技术约定

- Vanilla HTML / CSS / JS  
- 中文 UI  
- 打开即玩，无构建步骤  
- 原创内容，禁止种田玩法与商业素材搬运  
