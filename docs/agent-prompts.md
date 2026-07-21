# 16 个 Game Agent 提示词（复制即用）

> 仓库：`idemWu/gameCurosr`  
> 请先确认 Hub 分支已包含 `shared/template/` 与本文件。  
> 每个 Agent **只做一款**，新建对应分支，完成后开 Draft PR。

---

## [01] 港湾日记

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/01-cozy-harbor
只实现这一款浏览器小游戏 MVP，目录：games/01-cozy-harbor/（自包含 index.html、styles.css、main.js、README.md）
游戏名：港湾日记
类型：治愈休闲
核心循环：在海边小镇走动、和 NPC 聊天、完成当日小待办（无农田）
建议操作：WASD/方向键移动，靠近 NPC 按 E 对话；完成 3 个待办即胜利。
最低内容：独立色板偏海蓝与暖木色；小镇 1 张地图、≥3 NPC、待办列表 UI。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/01-cozy-harbor.md
- 完成后 commit、push，并开 Draft PR（标题：[01] 港湾日记）
```

## [02] 晚潮钓手

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/02-cozy-fishing
只实现这一款浏览器小游戏 MVP，目录：games/02-cozy-fishing/（自包含 index.html、styles.css、main.js、README.md）
游戏名：晚潮钓手
类型：治愈休闲
核心循环：选地点/时段钓鱼、收进图鉴、解锁新钓点
建议操作：点击抛竿/收杆小游戏；收集不同鱼解锁新地点。
最低内容：≥8 种鱼图鉴、≥2 钓点、时间或天气影响上钩。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/02-cozy-fishing.md
- 完成后 commit、push，并开 Draft PR（标题：[02] 晚潮钓手）
```

## [03] 暖汤咖啡馆

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/03-cozy-cafe
只实现这一款浏览器小游戏 MVP，目录：games/03-cozy-cafe/（自包含 index.html、styles.css、main.js、README.md）
游戏名：暖汤咖啡馆
类型：治愈休闲
核心循环：接待客人、按喜好上饮料、用收入升级店铺
建议操作：按客人订单点选饮品；赚钱升级柜台/菜单。
最低内容：≥5 种饮品、客人气泡订单、至少 2 级店铺升级。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/03-cozy-cafe.md
- 完成后 commit、push，并开 Draft PR（标题：[03] 暖汤咖啡馆）
```

## [04] 窗边小屋

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/04-cozy-home
只实现这一款浏览器小游戏 MVP，目录：games/04-cozy-home/（自包含 index.html、styles.css、main.js、README.md）
游戏名：窗边小屋
类型：治愈休闲
核心循环：拖拽家具布置房间、达成布置评分目标
建议操作：拖拽放置家具，达到目标分通关。
最低内容：≥8 件家具、网格吸附、实时评分与目标分。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/04-cozy-home.md
- 完成后 commit、push，并开 Draft PR（标题：[04] 窗边小屋）
```

## [05] 林间轻旅

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/05-grove-raid
只实现这一款浏览器小游戏 MVP，目录：games/05-grove-raid/（自包含 index.html、styles.css、main.js、README.md）
游戏名：林间轻旅
类型：轻冒险
核心循环：俯视小地图探索、轻度碰触战斗、开宝箱回营地
建议操作：移动探索，接触敌人自动/点按攻击，收集宝箱后回营胜利。
最低内容：1 张森林地图、敌人、宝箱、营地返回条件。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/05-grove-raid.md
- 完成后 commit、push，并开 Draft PR（标题：[05] 林间轻旅）
```

## [06] 石纹遗迹

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/06-ruin-puzzle
只实现这一款浏览器小游戏 MVP，目录：games/06-ruin-puzzle/（自包含 index.html、styles.css、main.js、README.md）
游戏名：石纹遗迹
类型：轻冒险
核心循环：开关/石板/路线解谜，通关 6–8 关
建议操作：点击开关/推拉或走格子解开机关到出口。
最低内容：6–8 关递进难度，有关卡选择与重置。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/06-ruin-puzzle.md
- 完成后 commit、push，并开 Draft PR（标题：[06] 石纹遗迹）
```

## [07] 矿灯深途

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/07-mine-delve
只实现这一款浏览器小游戏 MVP，目录：games/07-mine-delve/（自包含 index.html、styles.css、main.js、README.md）
游戏名：矿灯深途
类型：轻冒险
核心循环：一层层下矿、挖矿石、规避或击退小怪、带着物资返回
建议操作：下潜多层挖矿，管理生命/灯火，返回上层结算。
最低内容：≥5 层或等价深度、矿石种类、危险与返回结算。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/07-mine-delve.md
- 完成后 commit、push，并开 Draft PR（标题：[07] 矿灯深途）
```

## [08] 云上跳岛

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/08-sky-hop
只实现这一款浏览器小游戏 MVP，目录：games/08-sky-hop/（自包含 index.html、styles.css、main.js、README.md）
游戏名：云上跳岛
类型：轻冒险
核心循环：短关卡平台跳跃、收集羽毛过关
建议操作：左右移动+跳跃，收集羽毛到终点。
最低内容：≥5 关，羽毛收集与掉落重开。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/08-sky-hop.md
- 完成后 commit、push，并开 Draft PR（标题：[08] 云上跳岛）
```

## [09] 余烬牌阵

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/09-ember-deck
只实现这一款浏览器小游戏 MVP，目录：games/09-ember-deck/（自包含 index.html、styles.css、main.js、README.md）
游戏名：余烬牌阵
类型：卡牌/放置/策略
核心循环：短 rogue-lite 卡牌：每战选牌、打 5–8 场敌人
建议操作：回合出牌打敌人；战后三选一加成。
最低内容：基础牌组、敌人 5–8 场、选牌成长、胜负结算。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/09-ember-deck.md
- 完成后 commit、push，并开 Draft PR（标题：[09] 余烬牌阵）
```

## [10] 爪爪战棋

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/10-paw-tactics
只实现这一款浏览器小游戏 MVP，目录：games/10-paw-tactics/（自包含 index.html、styles.css、main.js、README.md）
游戏名：爪爪战棋
类型：卡牌/放置/策略
核心循环：3v3 小格子回合制，技能站位取胜
建议操作：棋盘上移动/攻击，消灭对方。
最低内容：3v3、小网格、至少 2 种技能或兵种差异。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/10-paw-tactics.md
- 完成后 commit、push，并开 Draft PR（标题：[10] 爪爪战棋）
```

## [11] 桥上防线

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/11-bridge-td
只实现这一款浏览器小游戏 MVP，目录：games/11-bridge-td/（自包含 index.html、styles.css、main.js、README.md）
游戏名：桥上防线
类型：卡牌/放置/策略
核心循环：路径塔防，波次升级塔与陷阱
建议操作：在路径旁建塔挡住敌人波次。
最低内容：固定路径、≥2 种塔、多波次与升级。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/11-bridge-td.md
- 完成后 commit、push，并开 Draft PR（标题：[11] 桥上防线）
```

## [12] 星尘挂机

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/12-idle-stars
只实现这一款浏览器小游戏 MVP，目录：games/12-idle-stars/（自包含 index.html、styles.css、main.js、README.md）
游戏名：星尘挂机
类型：卡牌/放置/策略
核心循环：点击/自动产出、升级树、解锁图鉴皮肤
建议操作：点击产星尘，买升级，挂机自动产出。
最低内容：点击+自动产出、升级树、至少 3 个解锁外观/图鉴。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/12-idle-stars.md
- 完成后 commit、push，并开 Draft PR（标题：[12] 星尘挂机）
```

## [13] 晶石三消

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/13-match-gems
只实现这一款浏览器小游戏 MVP，目录：games/13-match-gems/（自包含 index.html、styles.css、main.js、README.md）
游戏名：晶石三消
类型：益智/超休闲
核心循环：限定步数三消，完成收集目标
建议操作：交换相邻宝石消除，步数内完成目标。
最低内容：≥8 关或关卡目标列表，步数与目标 UI。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/13-match-gems.md
- 完成后 commit、push，并开 Draft PR（标题：[13] 晶石三消）
```

## [14] 遗物合成

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/14-merge-relics
只实现这一款浏览器小游戏 MVP，目录：games/14-merge-relics/（自包含 index.html、styles.css、main.js、README.md）
游戏名：遗物合成
类型：益智/超休闲
核心循环：合并同级遗物升级（宝石/文物，非种菜）
建议操作：拖拽两个相同遗物合成更高级。
最低内容：合成链≥5 级、订单或目标分、明确非种田。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/14-merge-relics.md
- 完成后 commit、push，并开 Draft PR（标题：[14] 遗物合成）
```

## [15] 书架整理

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/15-shelf-sort
只实现这一款浏览器小游戏 MVP，目录：games/15-shelf-sort/（自包含 index.html、styles.css、main.js、README.md）
游戏名：书架整理
类型：益智/超休闲
核心循环：颜色/品类排序收纳解谜
建议操作：把书按颜色/类别归位，尽量少步。
最低内容：≥8 关，打乱生成与完成判定。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/15-shelf-sort.md
- 完成后 commit、push，并开 Draft PR（标题：[15] 书架整理）
```

## [16] 铁匠一点通

```text
仓库：idemWu/gameCurosr
请新建并使用分支：game/16-forge-tap
只实现这一款浏览器小游戏 MVP，目录：games/16-forge-tap/（自包含 index.html、styles.css、main.js、README.md）
游戏名：铁匠一点通
类型：益智/超休闲
核心循环：点击锻造、升级锤子与配方的超休闲
建议操作：点击锻造进度，升级锤子解锁配方。
最低内容：点击产出、至少 3 级锤子/配方、可重开或重置。
硬性要求：
- Vanilla HTML/CSS/JS，打开即玩，中文 UI/说明
- 有开始界面与胜利/再来一局；主路径 2–5 分钟可完成
- 不做种菜/种田；不抄袭商业游戏素材与商标
- 独立色板；勿修改其他 games/* 目录；勿改根 README 与 games/_registry.json
- 可复制 shared/template/ 后改造；详细任务书见 docs/briefs/16-forge-tap.md
- 完成后 commit、push，并开 Draft PR（标题：[16] 铁匠一点通）
```
