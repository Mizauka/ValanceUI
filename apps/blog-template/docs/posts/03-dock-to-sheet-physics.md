---
title: Dock-to-Sheet 连续变形动力学：从悬浮胶囊到贴边全宽面板
category: 交互设计
date: 2026-11-18
tags:
  - Dock to Sheet
  - 移动端 UX
  - 物理手势
description: 解析 VlDockSheet 如何将 14px 边距的底部悬浮胶囊在拉起前 35% 行程内丝滑变形为 0px 边距全宽直角 Sheet。
---

在手机端浏览长文章时，读者希望底部控制栏平时轻量、不遮挡正文，拉起后又能变成空间充裕的目录、大纲或评论工作区。

## 一、形态变形插值系数 `morphFactor`

`VlDockSheet` 定义了两个连续映射的指标：

- `expandRatio`：当前高度在 `dockHeight (56px)` 到 `fullSheetHeight (88%)` 之间的归一化进度 `[0, 1]`；
- `morphFactor = clamp(expandRatio / 0.35, 0, 1)`：在前 `35%` 拉起距离内完成全部几何形态转换！

随着 `morphFactor` 从 `0 → 1`：
1. 容器四周边距 `inset` 从 `14px → 0px`；
2. 容器圆角 `borderRadius` 从精确半高胶囊 `28px → 0px`（纯直角贴边 Sheet）；
3. 内容区透明度同步淡入，背景遮罩平稳渐深。

::: tip 试一试！
如果你正在手机窄屏（或将浏览器宽度缩窄到 `≤ 768px`）阅读本文，可以直接拉起底部悬浮的「大纲与快捷调节」胶囊体验真实效果。
:::
