---
title: 1:1 拖拽挤压式侧边栏与 iOS Safari 零闪烁补间算法
category: 前端工程
date: 2026-11-22
tags:
  - 手势交互
  - Vue 3
  - 动画物理
description: 剖析 VlPushDrawer 如何避开系统边缘返回冲突，并使用牛顿迭代三次贝塞尔 rAF 补间彻底消除 Safari 图层闪烁。
---

移动端抽屉最常见的问题有两个：**系统边缘手势冲突** 与 **松手瞬间从 `transition: none` 切回 CSS transition 时的 1 帧闪烁**。

## 一、全屏方向锁手势识别

`usePushDrawerGesture` 允许用户在屏幕**任意位置**横向滑出抽屉（同时自动避开 `input`、`select`、横向图表和底部 Dock 区域）：

- 前 `12px` 死区判定滑动方向：仅当 $|\Delta x| > |\Delta y| \times 1.35$ 且方向与当前开关状态匹配时锁定为水平手势；
- 纵向阅读滚动与横向抽屉滑动互不干扰；
- 释放指针后在 `240ms` 窗口内抑制浏览器合成的误触 `click` 事件。

## 二、连续 rAF 牛顿迭代三次贝塞尔补间

在 iOS Safari WebKit 中，拖拽时关闭 CSS `transition` 并在 `pointerup` 时重新加上 `transition: transform`，容易触发 CoreAnimation 合成层闪烁一帧。

```ts
export function easeNonlinear(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  let u = x
  for (let i = 0; i < 4; i++) {
    const inv = 1 - u
    const bx = 3 * inv * inv * u * 0.22 + 3 * inv * u * u * 0.36 + u * u * u
    const dbx = 3 * inv * inv * 0.22 + 6 * inv * u * (0.36 - 0.22) + 3 * u * u * (1 - 0.36)
    if (Math.abs(dbx) < 1e-5) break
    u = Math.max(0, Math.min(1, u - (bx - x) / dbx))
  }
  const inv = 1 - u
  return 3 * inv * inv * u + 3 * inv * u * u + u * u * u
}
```

通过统一的 `translate3d(${offset}px, 0, 0)` 与 `requestAnimationFrame` 驱动，抽屉和主画布始终在同一条时间轴上无缝衔接。
