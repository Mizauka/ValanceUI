---
title: 破解 Safari ProMotion 120Hz 分页限制：scroll-timeline 与三驱动轮转打断架构
category: 前端工程
date: 2026-11-27
featured: true
tags:
  - 120Hz ProMotion
  - scroll-timeline
  - Safari WebKit
  - ValanceUI
description: 深度复盘为什么纯 CSS @keyframes 在 iOS Safari 上长期受限于 60fps，以及 VlSnapPager 如何通过三槽位轮转 scroll-timeline 实现满帧无缝打断。
---

在搭载 120Hz ProMotion 屏幕的 iPhone / iPad 上，即便手动关闭 Safari 实验特性中的 `Prefer Page Rendering Updates near 60fps`，单独的 CSS `@keyframes` 与 Vue `<Transition>` 在切换页面时仍经常掉回 60Hz 调度，且伴随第 0 帧子树挂载卡顿。

## 一、为什么只有“像侧边栏一样的滚动”能跑满 120Hz？

在 iOS WebKit 中，独立的时间轴动画容易走保守帧率节流策略，而挂载在真实 `UIScrollView` 上的滚动合成则会强制激活高刷新率 **CoreAnimation ProMotion** 管线。

因此 [`VlSnapPager`](https://github.com/Mizauka/ValanceUI) 采用了一套对上层完全透明的双路分页引擎：

1. **苹果触控 WebKit（Safari 26+）**：通过三个隐藏 `1px` 轮转滚动器声明独立 `scroll-timeline-name` 并由根容器 `timeline-scope` 提升作用域，将页面容器 `.vl-pager-track` 绑定到当前空闲滚动器的原生 `smooth` 滚动时间轴上；驱动器设置 `pointer-events: none`，从不抢占 `VlPushDrawer` 全屏侧滑手势。
2. **桌面端与 Android**：统一走硬件加速 `@keyframes`（`0.42s cubic-bezier(0.32, 0.72, 0, 1)`），无需滚动代理也能直接跑满原生高刷。

## 二、三槽位轮转与零闪烁途中打断

快速连续点击多个底部导航栏 Tab 时，如果复用同一个正在异步滑动中的 `UIScrollView` 执行 `scrollLeft = 0` 重置再重新 `scrollTo`，WebKit 异步滚动树往往会吞掉后续动画。

`VlSnapPager` 通过 **三套改进策略** 解决连续连点打断问题：

```ts
// 1. 读取当前 GPU 合成层的实时平移像素，换算为精确百分比起点
const curPct = isTransitioning.value ? getCurrentTrackPercent() : 0

// 2. 轮转切换至绝对静止的空闲原生滚动器 (0 -> 1 -> 2 -> 0)
const nextSlot = ((activeDriverSlot.value + 1) % 3) as DriverSlot

// 3. 通过 @property 类型化变量 + Ping-Pong Keyframes 同步无缝接力
fromPercent.value = curPct
toPercent.value = -targetSlot * 100
animParity.value = animParity.value === 'a' ? 'b' : 'a'
```

- 无论连点向后推进（`首页 → 归档 → 关于`）还是中途突然折返，当前仍在视口内的页面都会从此刻像素坐标流畅接力；
- 配合 `pages` 后台 `150ms` 静默预挂载（`.is-parked { visibility: hidden }`），第 0 帧零子树创建开销，同时维持 Flex 纵向高度约束以保证每页 `<VlScrollArea>` 独立流畅滚动。
