# gameCurosr · 16 款休闲小游戏

浏览器小游戏作品集。覆盖四大类共 **16 款可玩 MVP**，**不做种菜/种田**。

## 快速试玩

```bash
python3 -m http.server 8080
# 总览卡片墙：
# http://localhost:8080/preview/
# 单款示例：
# http://localhost:8080/games/01-cozy-harbor/
```

```bash
node scripts/check-structure.mjs
```

## 四大类

1. **治愈休闲** — 01–04  
2. **轻冒险** — 05–08  
3. **卡牌 / 放置 / 轻度策略** — 09–12  
4. **益智 / 超休闲** — 13–16  

## 游戏清单

| # | 游戏 | 类型 | 目录 | 状态 |
|---|------|------|------|------|
| 01 | 港湾日记 | 治愈休闲 | [`games/01-cozy-harbor/`](./games/01-cozy-harbor/) | playable |
| 02 | 晚潮钓手 | 治愈休闲 | [`games/02-cozy-fishing/`](./games/02-cozy-fishing/) | playable |
| 03 | 暖汤咖啡馆 | 治愈休闲 | [`games/03-cozy-cafe/`](./games/03-cozy-cafe/) | playable |
| 04 | 窗边小屋 | 治愈休闲 | [`games/04-cozy-home/`](./games/04-cozy-home/) | playable |
| 05 | 林间轻旅 | 轻冒险 | [`games/05-grove-raid/`](./games/05-grove-raid/) | playable |
| 06 | 石纹遗迹 | 轻冒险 | [`games/06-ruin-puzzle/`](./games/06-ruin-puzzle/) | playable |
| 07 | 矿灯深途 | 轻冒险 | [`games/07-mine-delve/`](./games/07-mine-delve/) | playable |
| 08 | 云上跳岛 | 轻冒险 | [`games/08-sky-hop/`](./games/08-sky-hop/) | playable |
| 09 | 余烬牌阵 | 策略 | [`games/09-ember-deck/`](./games/09-ember-deck/) | playable |
| 10 | 爪爪战棋 | 策略 | [`games/10-paw-tactics/`](./games/10-paw-tactics/) | playable |
| 11 | 桥上防线 | 策略 | [`games/11-bridge-td/`](./games/11-bridge-td/) | playable |
| 12 | 星尘挂机 | 策略 | [`games/12-idle-stars/`](./games/12-idle-stars/) | playable |
| 13 | 晶石三消 | 益智 | [`games/13-match-gems/`](./games/13-match-gems/) | playable |
| 14 | 遗物合成 | 益智 | [`games/14-merge-relics/`](./games/14-merge-relics/) | playable |
| 15 | 书架整理 | 益智 | [`games/15-shelf-sort/`](./games/15-shelf-sort/) | playable |
| 16 | 铁匠一点通 | 益智 | [`games/16-forge-tap/`](./games/16-forge-tap/) | playable |

登记表：[`games/_registry.json`](./games/_registry.json)

## 文档

- 组合说明：[`docs/portfolio.md`](./docs/portfolio.md)
- 单款任务书：[`docs/briefs/`](./docs/briefs/)
- 并行 Agent 提示词（可选）：[`docs/agent-prompts.md`](./docs/agent-prompts.md)
- 共用模板：[`shared/template/`](./shared/template/)

## 技术约定

- Vanilla HTML / CSS / JS，打开即玩  
- 中文 UI  
- 原创内容；禁止种田玩法与商业素材搬运  

## 分支说明

本分支 `cursor/game-art-7c49` 已包含 Hub + 全部 16 款游戏目录（因 Cloud Agent 默认仅能推送当前 feature 分支，游戏未拆到 `game/NN-*` 远端分支）。
