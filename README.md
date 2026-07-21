
# gameCurosr · 16 款精致浏览器小品

四大类共 **16 款** Vanilla HTML/CSS/JS 小游戏。本轮重点优化 **美术、音效与游戏体验**（粒子/浮动字/独立色板/WebAudio），带本地存档。**不做种菜/种田。**

> 时长按实际体量诚实标注（多为约 10–30 分钟小品），不再虚标 30–60 分钟。

## 快速试玩

```bash
python3 -m http.server 8080
# 总览：http://localhost:8080/preview/
```

## 游戏清单

| # | 游戏 | 目录 | 说明 |
|---|------|------|------|
| 01 | 港湾日记 | `games/01-cozy-harbor/` | 7 天日程 |
| 02 | 晚潮钓手 | `games/02-cozy-fishing/` | 40 图鉴 |
| 03 | 暖汤咖啡馆 | `games/03-cozy-cafe/` | 14 天经营 |
| 04 | 窗边小屋 | `games/04-cozy-home/` | 12 委托 |
| 05 | 林间轻旅 | `games/05-grove-raid/` | 15 任务 / 5 区 |
| 06 | 石纹遗迹 | `games/06-ruin-puzzle/` | 40 关 |
| 07 | 矿灯深途 | `games/07-mine-delve/` | 25 层 + 任务 |
| 08 | 云上跳岛 | `games/08-sky-hop/` | 40 关 |
| 09 | 余烬牌阵 | `games/09-ember-deck/` | 24 节点战役 |
| 10 | 爪爪战棋 | `games/10-paw-tactics/` | 20 战役 |
| 11 | 桥上防线 | `games/11-bridge-td/` | 15 地图 |
| 12 | 星尘挂机 | `games/12-idle-stars/` | 12 里程碑 |
| 13 | 晶石三消 | `games/13-match-gems/` | 60 关 |
| 14 | 遗物合成 | `games/14-merge-relics/` | 8 级订单链 |
| 15 | 书架整理 | `games/15-shelf-sort/` | 40 关 |
| 16 | 铁匠一点通 | `games/16-forge-tap/` | 8 配方章 |
| **17** | **雾港行者（旗舰）** | [`games/17-mist-walker/`](./games/17-mist-walker/) | **2D 魂类 · 12 区 18 Boss · 主线≈30h** |
| **18** | **风铃岛纪行（旗舰）** | [`games/18-windbell-island/`](./games/18-windbell-island/) | **治愈动作冒险 · 8 区 12 守护灵 · 主线≈12–18h** |

时长预估：`docs/playtime/`  
共用存档菜单：`shared/longplay/`
| 05 | 林间轻旅 | `games/05-grove-raid/` | 探索战斗 |
| 06 | 石纹遗迹 | `games/06-ruin-puzzle/` | 机关解谜 |
| 07 | 矿灯深途 | `games/07-mine-delve/` | 下矿冒险 |
| 08 | 云上跳岛 | `games/08-sky-hop/` | 平台跳跃 |
| 09 | 余烬牌阵 | `games/09-ember-deck/` | 卡牌战役 |
| 10 | 爪爪战棋 | `games/10-paw-tactics/` | 回合战棋 |
| 11 | 桥上防线 | `games/11-bridge-td/` | 路径塔防 |
| 12 | 星尘挂机 | `games/12-idle-stars/` | 点击成长 |
| 13 | 晶石三消 | `games/13-match-gems/` | 三消闯关 |
| 14 | 遗物合成 | `games/14-merge-relics/` | 合成订单 |
| 15 | 书架整理 | `games/15-shelf-sort/` | 收纳关卡 |
| 16 | 铁匠一点通 | `games/16-forge-tap/` | 锻造小游戏 |

共用工具：`shared/longplay/`（存档/暂停）、`shared/polish/`（绘制/Juice/音效）

## 验收口径

- 打开即玩，中文 UI
- 美术反馈 + 可静音音效
- `localStorage` 存档 / 清档
- 无种田
=
# gameCurosr

浏览器小游戏相关仓库。

## 4399 热门 100

已将 [4399 小游戏](https://www.4399.com/) 当前热门 Top 100 写入仓库：

| 文件 | 说明 |
| --- | --- |
| [`data/4399-hot-100.json`](./data/4399-hot-100.json) | 机器可读列表（排名、名称、分类、链接、封面） |
| [`docs/4399-hot-100.md`](./docs/4399-hot-100.md) | 人类可读排行表 |

数据来源：首页「热游总榜」+ [分类排行榜月榜](https://www.4399.com/top/)，去重保序。

刷新：


python3 scripts/fetch-4399-hot-100.py

