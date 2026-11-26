---
title: 关于 Valance Blog 模板
category: 模板说明
date: 2026-11-27
tags:
  - VitePress
  - ValanceUI
  - 文档
---

本博客模板由 `@valance-ui/vitepress-theme` 与 `@valance-ui/vue` 强力驱动，延续 **CatsOnPlains** 与 **The Valence Project** 的扁平几何工作台美学，并针对 Safari ProMotion 120Hz 刷新率完成了全链路交互重构。

## 核心特性概览

| 维度 | 桌面端 (> 1080px) | 平板端 (769–1080px) | 移动端 (≤ 768px) |
| --- | --- | --- | --- |
| 空间结构 | 活动栏 + 左侧目录 + 中央多标签 + 右侧大纲 | 互斥双栏 `[1\|2] ↔ [2\|3]` 镜像比例 | 120Hz 原生 `scroll-snap` 挤压式侧边栏 |
| 分页切换 | 多标签页即时切换 + 滚轮定位记忆 | 多标签页即时切换 | 120Hz `scroll-timeline` + 3 槽位无缝打断分页 |
| 底部与浮层 | 26px IDE 实时状态栏 + 回到顶部按钮 | 26px IDE 实时状态栏 | 一体化悬浮胶囊 Dock + 单 DOM Dock-to-Sheet |
| 外观与检索 | 圆形波纹主题切换 + Monet 15 套调色板 + `Ctrl+K` 指令面板 | 圆形波纹切换 + `Ctrl+K` 检索 | 顶部快捷搜索 / 亮暗切换 + 底部面板字体字号调节 |

## 快速自定义指南

在 `docs/.vitepress/config.mts` 中通过 `defineValanceConfig` 即可一键启用防闪烁首屏脚本（同步恢复主题明暗、主辅对调与 Monet 调色板）并自定义站点元信息：

```ts
import { defineValanceConfig } from '@valance-ui/vitepress-theme/config'

export default defineValanceConfig({
  title: 'My Valance Blog',
  themeConfig: {
    brandTitle: 'My Blog',
    brandTag: 'DIGITAL GARDEN',
    accentDefault: 'default', // 或 'swapped' 切换为主青辅橘
    paletteDefault: 'valance', // 支持 'valance' / 15 组内置协调配色
    mobileBottomMode: 'unified', // 一体化 Dock-to-Sheet（默认）或 'nav-dock'
  },
})
```

::: tip 快捷键与手势提示
- **桌面端**：按 `Ctrl+K`（或 `Cmd+K`）打开 `VlCommandPalette` 全局搜索文章（支持正则过滤）；`Ctrl+B` / `Ctrl+Shift+B` 快速折叠左右面板。
- **移动端**：从屏幕任意位置向右滑拉出 `120Hz` 原生 `VlPushDrawer` 侧边栏，或拉起底部 `VlDockSheet` 实时调节字号、行距、字体与配色！
:::
