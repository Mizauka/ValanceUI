---
title: 1:1 原生手势侧边栏：WebKit scroll-snap 与双向驱动引擎
category: 前端工程
date: 2026-11-22
tags:
  - 手势交互
  - Vue 3
  - 120Hz ProMotion
description: 剖析 VlPushDrawer 如何在移动端以原生 UIScrollView scroll-snap 跑满 120Hz ProMotion，并在桌面端保留牛顿迭代三次贝塞尔 rAF 补间。
---

移动端侧边抽屉在 Web 上长期面临三大难题：**iOS Safari 边缘返回冲突**、**JS 拖拽无法触发 120Hz ProMotion 合成帧率**，以及 **松手补间交接时的图层闪烁**。

## 一、双模统一驱动：`scroll-snap` 与 rAF 牛顿迭代

`VlPushDrawer` 会根据指针类型（`(pointer: coarse)`）自动选择最优物理管线：

- **移动端触控设备**：直接构建原生横向 `scroll-snap-type: x mandatory` 容器，将抽屉与主画布纳入同一 `UIScrollView` 合成层。指尖滑动与松手惯性收尾 100% 由 CoreAnimation 合成线程以 **120Hz 满帧** 接管。
- **桌面精细指针设备**：采用 `requestAnimationFrame` + 牛顿迭代四阶求解三次贝塞尔 `cubic-bezier(0.22, 1, 0.36, 1)` 连续补间，保证鼠标拖动同样丝滑顺畅。

## 二、边界反向橡皮筋锁定

在原生 `scroll-snap` 模式下，如果在侧边栏已经关闭时继续向左划（或已完全打开时继续向右拉），Safari 默认的横向橡皮筋回弹容易产生“像在拉一条滚动条”的错觉。

`VlPushDrawer` 在 `touchstart` / `touchmove` 阶段即时检测 `scrollLeft` 边界与横向手势符号：

```ts
const atClosedEdge = scroller.scrollLeft >= maxLeft - 1
const atOpenEdge = scroller.scrollLeft <= 1

if ((atClosedEdge && dx < 0) || (atOpenEdge && dx > 0)) {
  if (e.cancelable) e.preventDefault()
}
```

既彻底消除边界误触露底，又完全保留有效开合滑动的 120Hz 原生合成管线。
