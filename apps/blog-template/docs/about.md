---
title: 关于 Valance Blog 模板
category: 模板说明
date: 2026-11-26
tags:
  - VitePress
  - ValanceUI
  - 文档
---

本博客模板由 `@valance-ui/vitepress-theme` 与 `@valance-ui/vue` 强力驱动，延续 **CatsOnPlains** 与 **The Valence Project** 的扁平几何工作台美学。

## 核心特性概览

| 维度 | 桌面端 (> 1080px) | 平板端 (769–1080px) | 移动端 (≤ 768px) |
| --- | --- | --- | --- |
| 空间结构 | 活动栏 + 左侧目录 + 中央多标签 + 右侧大纲 | 互斥双栏 `[1\|2] ↔ [2\|3]` 镜像比例 | 1:1 全屏拖拽挤压侧边栏 |
| 底部交互 | 26px IDE 实时状态栏 | 26px IDE 实时状态栏 | 首页悬浮胶囊 Dock / 文章页 Dock-to-Sheet |
| 外观切换 | 点击原点圆形波纹扩散（ViewTransition） | 点击原点圆形波纹扩散 | 点击原点圆形波纹扩散 |

## 快速自定义指南

在 `docs/.vitepress/config.mts` 中通过 `defineValanceConfig` 即可配置品牌、作者信息、默认主题色以及底部状态栏注记：

```ts
import { defineValanceConfig } from '@valance-ui/vitepress-theme/config'

export default defineValanceConfig({
  title: 'My Valance Blog',
  themeConfig: {
    brandTitle: 'My Blog',
    brandTag: 'DIGITAL GARDEN',
    accentDefault: 'default', // 或 'swapped' 切换为主青辅橘
  },
})
```

::: tip 提示
尝试点击右上角按钮切换 **亮色米白 (#FDFCF9)** 与 **暗色炭岩 (#273033)**，或对调主橘与辅青强调色！
:::
