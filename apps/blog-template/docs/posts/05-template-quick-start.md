---
title: 五分钟上手：用 Valance 博客模板发布你的第一篇文章
category: 模板说明
date: 2026-11-10
tags:
  - 快速开始
  - Markdown
  - Frontmatter
description: 了解文章 Frontmatter 字段规范、自定义提示块、代码块高亮以及生产构建命令。
---

只需在 `docs/posts/` 目录下新建一个 `.md` 文件，`posts.data.mts` 就会在开发与构建阶段自动完成索引、字数统计、阅读时长估算与全文检索准备。

## 推荐的 Frontmatter 格式

```yaml
---
title: 你的文章标题
category: 随笔分类
date: 2026-11-26
featured: true
tags:
  - 标签一
  - 标签二
description: 显示在首页文章卡片中的摘要描述。
---
```

## 内置 Markdown 容器展示

::: info 信息块
使用 `::: info` 渲染蓝色扁平左框提示容器。
:::

::: danger 注意事项
使用 `::: danger` 渲染警示内容，所有容器保持 0 阴影与 4px 左侧强调条。
:::

## 本地开发与构建命令

```bash
pnpm --filter @valance-ui/blog-template dev
pnpm --filter @valance-ui/blog-template build
```

## 快捷按键与内置能力

| 快捷键 / 手势 | 功能说明 |
| --- | --- |
| `Ctrl+K` / `Cmd+K` | 打开 `VlCommandPalette` 全局搜索与快捷指令（支持正文搜索与正则表达式） |
| `Ctrl+B` / `Ctrl+Shift+B` | 折叠或展开左侧目录 / 右侧大纲面板 |
| 移动端任意位置右滑 | 拉出 120Hz 原生挤压式侧边栏 |
| 移动端底部胶囊上拉 | 展开单 DOM Dock-to-Sheet，随时调节字号、行距、字体与 15 套调色板 |
