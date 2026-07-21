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

```bash
python3 scripts/fetch-4399-hot-100.py
```
