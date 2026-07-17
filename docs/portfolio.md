# 游戏组合说明（Hub）

本仓库目标：交付 **16 个浏览器小游戏 MVP**，覆盖四大类，**不做种菜/种田**。

## 体量定义（MVP）

每款游戏必须：

1. 打开 `index.html` 即可玩（无需构建、无强依赖外网 CDN）
2. 有开始界面，以及胜利 / 结束 / 再来一局
3. 至少一个可重复的完整循环（分数、图鉴、关卡、波次、评分等）
4. 中文操作说明与 UI
5. 独立色板与标题，能和其他游戏区分
6. 目录自包含在 `games/<id>-<slug>/`

## 非目标

- Steam 级完整商业游戏
- 联机、云存档、SDK
- 种田 / 作物生长玩法
- 抄袭商业游戏素材与商标

## 四大类与最低内容量

| 类型 | 最低内容 |
|------|----------|
| 治愈休闲 | ≥1 可互动场景 + ≥1 进度系统（好感/图鉴/金钱/评分） |
| 轻冒险 | ≥1 可探索关或 ≥5 小关；有胜负 |
| 卡牌/放置/策略 | ≥1 完整对局规则；可重复开局 |
| 益智/超休闲 | ≥8 关或无限模式 + 分数；可重开 |

## 技术栈

- Vanilla HTML + CSS + JavaScript
- Canvas 2D 或纯 DOM 均可
- 推荐画布逻辑分辨率 480×270，再 CSS 整数放大
- 像素风使用 `image-rendering: pixelated`

## 分支与 Agent 协作

- **Hub 分支**（本 PR）：总览、模板、registry、任务书；**不实现 16 款游戏本体**
- **Game 分支** `game/01-...` … `game/16-...`：每分支只做一个游戏目录
- 根 `README.md` 与 `games/_registry.json` 的汇总更新由 Hub 负责，避免并行冲突

## 本地试玩

Hub 合并或 checkout 某游戏分支后：

```bash
# 在仓库根目录
python3 -m http.server 8080
# 浏览器打开对应游戏，例如：
# http://localhost:8080/games/01-cozy-harbor/
# 模板预览：
# http://localhost:8080/shared/template/
```

## 相关文档

- 总目录：[`README.md`](../README.md)
- 复制即用的 16 条 Agent 提示词：[`docs/agent-prompts.md`](./agent-prompts.md)
- 单款任务书：[`docs/briefs/`](./briefs/)
- 结构检查：`node scripts/check-structure.mjs`
