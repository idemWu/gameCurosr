# GitHub Pages 自动部署说明

本文档说明 [`gh-pages.yml`](./gh-pages.yml) 中各项配置的作用。

## 工作流用途

当代码推送到 `main` 分支时，该工作流会把仓库中的原生 HTML、CSS、JavaScript 和图片等静态文件上传并部署到 GitHub Pages。也可以在 GitHub 仓库的 **Actions** 页面手动运行。

当前项目不需要生成 `package.json`，因为它没有使用 npm、Vite、Webpack 等需要安装依赖或执行构建命令的工具。

## 配置注释

```yaml
# 工作流在 GitHub Actions 页面显示的名称
name: Deploy to GitHub Pages

# 工作流的触发条件
on:
  # main 分支收到新提交时自动运行
  push:
    branches:
      - main
  # 允许从 GitHub Actions 页面手动运行
  workflow_dispatch:

# 工作流使用的最小权限
permissions:
  contents: read   # 读取仓库文件
  pages: write     # 发布到 GitHub Pages
  id-token: write  # 为 Pages 部署签发身份令牌

# 控制并发部署
concurrency:
  group: pages
  # 新部署开始时不强制取消正在执行的部署
  cancel-in-progress: false

jobs:
  deploy:
    # 使用 GitHub 提供的 Ubuntu 执行环境
    runs-on: ubuntu-latest

    # 将本次部署记录到 github-pages 环境
    environment:
      name: github-pages
      # 部署完成后显示实际的 Pages 地址
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      # 将仓库代码检出到执行环境
      - name: Checkout
        uses: actions/checkout@v6

      # 初始化 GitHub Pages 所需配置
      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      # 将整个仓库中的静态站点文件打包为 Pages artifact
      # 上传工具会排除 .git 和 .github 目录
      - name: Upload static site
        uses: actions/upload-pages-artifact@v4
        with:
          path: .

      # 把上一步上传的 artifact 正式部署到 GitHub Pages
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 发布前设置

1. 打开 GitHub 仓库的 **Settings → Pages**。
2. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
3. 提交并推送 `.github/workflows/gh-pages.yml`。
4. 在 **Actions** 页面查看部署结果。

部署完成后，访问 GitHub Pages 根地址会通过仓库根目录的 `index.html` 自动进入 `preview/` 游戏总览页。
