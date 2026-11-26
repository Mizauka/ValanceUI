import { onBeforeUnmount, ref } from 'vue'

export interface NavScrubItemMetric {
  index: number
  start: number
  size: number
  center: number
  disabled: boolean
}

export interface NavContainerFollowConfig {
  /** Maximum container shift along primary drag axis in px (default 6) */
  maxPrimary?: number
  /** Maximum container shift along perpendicular axis in px (default 3) */
  maxCross?: number
}

export interface NavScrubGestureOptions {
  axis: 'x' | 'y'
  getContainer: () => HTMLElement | null
  getItems: () => (HTMLElement | null)[]
  isDisabled?: (index: number) => boolean
  getActiveIndex?: () => number
  /** Optional group-scoping predicate: return allowed item indices for the group containing startIndex */
  getGroupIndices?: (startIndex: number) => number[] | null
  /** Require touch hold or active-item grab inside vertically scrollable lists */
  scrollSafeTouch?: boolean
  /** Optional Liquid-Glass-style subtle container positional follow (floating bars only) */
  containerFollow?: NavContainerFollowConfig | false
  /** Optional bounded rubber-band overshoot in px past the first/last item (never infinite, default 0) */
  maxOvershoot?: number
  onHoverChange?: (index: number | null) => void
  onCommit: (index: number, event: PointerEvent) => void
}

/**
 * Unified pointer scrub/drag gesture composable for horizontal & vertical nav bars.
 * - Strict hard-clamped bounds within the active group (zero out-of-bounds overflow).
 * - Geometric overlap detection (>= 45% coverage) so inverted text ink never lingers after the indicator moves away.
 * - Optional strictly capped Liquid-Glass-style container micro-displacement (pure position, zero scale/glass).
 */
export function useNavScrubGesture(options: NavScrubGestureOptions) {
  const pressed = ref(false)
  const dragging = ref(false)
  const hoverIndex = ref<number | null>(null)
  const coveredIndex = ref<number | null>(null)
  const dragStartPos = ref<number | null>(null)
  const dragSize = ref<number | null>(null)
  const pressTargetPos = ref<number | null>(null)
  const pressTargetSize = ref<number | null>(null)
  const followX = ref(0)
  const followY = ref(0)

  let activePointerId: number | null = null
  let pointerType = 'mouse'
  let startClientX = 0
  let startClientY = 0
  let grabOffsetInItem = 0
  let metricsCache: NavScrubItemMetric[] = []
  let allowedGroupSet: Set<number> | null = null
  let containerStartClient = 0
  let suppressClickFlag = false
  let suppressTimer: ReturnType<typeof setTimeout> | null = null
  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let touchScrubUnlocked = true
  let movedPrimary = false

  function measureMetrics(): NavScrubItemMetric[] {
    const container = options.getContainer()
    const els = options.getItems()
    if (!container || !els.length) return []
    const cRect = container.getBoundingClientRect()
    const borderStart = options.axis === 'x' ? container.clientLeft : container.clientTop
    containerStartClient = (options.axis === 'x' ? cRect.left : cRect.top) + borderStart

    const list: NavScrubItemMetric[] = []
    els.forEach((el, idx) => {
      if (!el) return
      const disabled = Boolean(options.isDisabled?.(idx))
      const rect = el.getBoundingClientRect()
      const useOffset = el.offsetParent === container
      const start = useOffset
        ? options.axis === 'x'
          ? el.offsetLeft
          : el.offsetTop
        : options.axis === 'x'
          ? rect.left - containerStartClient
          : rect.top - containerStartClient
      const size =
        options.axis === 'x'
          ? rect.width > 0
            ? rect.width
            : el.offsetWidth
          : rect.height > 0
            ? rect.height
            : el.offsetHeight
      if (size <= 0) return
      list.push({
        index: idx,
        start,
        size,
        center: start + size / 2,
        disabled,
      })
    })
    return list
  }

  function getActivePool(): NavScrubItemMetric[] {
    return metricsCache
      .filter((m) => !m.disabled && (!allowedGroupSet || allowedGroupSet.has(m.index)))
      .sort((a, b) => a.start - b.start)
  }

  function findNearest(posCenter: number, pool: NavScrubItemMetric[]): NavScrubItemMetric | null {
    let best: NavScrubItemMetric | null = null
    let bestDist = Infinity
    for (const item of pool) {
      const d = Math.abs(item.center - posCenter)
      if (d < bestDist) {
        bestDist = d
        best = item
      }
    }
    return best
  }

  function findCovered(indStart: number, indSize: number, pool: NavScrubItemMetric[]): number | null {
    const indEnd = indStart + indSize
    let bestIdx: number | null = null
    let bestRatio = 0
    for (const item of pool) {
      const itemEnd = item.start + item.size
      const overlap = Math.max(0, Math.min(indEnd, itemEnd) - Math.max(indStart, item.start))
      const ratio = overlap / Math.max(1, item.size)
      if (ratio >= 0.45 && ratio > bestRatio) {
        bestRatio = ratio
        bestIdx = item.index
      }
    }
    return bestIdx
  }

  function interpolateSize(center: number, pool: NavScrubItemMetric[]): number {
    if (!pool.length) return 40
    if (center <= pool[0]!.center) return pool[0]!.size
    if (center >= pool[pool.length - 1]!.center) return pool[pool.length - 1]!.size
    for (let i = 0; i < pool.length - 1; i++) {
      const a = pool[i]!
      const b = pool[i + 1]!
      if (center >= a.center && center <= b.center) {
        const span = Math.max(1, b.center - a.center)
        const t = (center - a.center) / span
        return a.size + (b.size - a.size) * t
      }
    }
    return pool[0]!.size
  }

  function applyPointerPosition(clientX: number, clientY: number) {
    const pool = getActivePool()
    if (!pool.length) return

    const first = pool[0]!
    const last = pool[pool.length - 1]!
    const ptrRel = (options.axis === 'x' ? clientX : clientY) - containerStartClient
    const approxSize = interpolateSize(ptrRel, pool)
    const rawStart = ptrRel - grabOffsetInItem
    const minStart = first.start
    const maxStart = Math.max(minStart, last.start + last.size - approxSize)
    const maxOver = Math.max(0, options.maxOvershoot ?? 0)

    const clampWithOvershoot = (val: number, minVal: number, maxVal: number): number => {
      if (val < minVal) {
        if (maxOver <= 0) return minVal
        return minVal - maxOver * Math.tanh((minVal - val) / (maxOver * 3.5))
      }
      if (val > maxVal) {
        if (maxOver <= 0) return maxVal
        return maxVal + maxOver * Math.tanh((val - maxVal) / (maxOver * 3.5))
      }
      return val
    }

    const clampedCore = Math.max(minStart, Math.min(maxStart, rawStart))
    const center = clampedCore + approxSize / 2
    const nextSize = interpolateSize(center, pool)
    const finalMax = Math.max(minStart, last.start + last.size - nextSize)
    const finalStart = Math.round(clampWithOvershoot(rawStart, minStart, finalMax) * 100) / 100

    dragStartPos.value = finalStart
    dragSize.value = nextSize

    // Smooth 2D vector asymptotic follow from press origin -> current pointer (never hard-clamped)
    if (options.containerFollow) {
      const maxP = options.containerFollow.maxPrimary ?? 9
      const maxC = options.containerFollow.maxCross ?? 5
      const dx = clientX - startClientX
      const dy = clientY - startClientY
      const primaryDelta = options.axis === 'x' ? dx : dy
      const crossDelta = options.axis === 'x' ? dy : dx
      const uP = primaryDelta / Math.max(1, maxP)
      const uC = crossDelta / Math.max(1, maxC)
      const radial = Math.hypot(uP, uC)
      let primaryShift = 0
      let crossShift = 0
      if (radial > 0.0001) {
        // Smooth C-infinity asymptotic curve: approaches ellipse (maxP, maxC) as ||v|| -> infinity
        const sat = Math.tanh(radial / 14)
        primaryShift = maxP * sat * (uP / radial)
        crossShift = maxC * sat * (uC / radial)
      }

      if (options.axis === 'x') {
        followX.value = Math.round(primaryShift * 100) / 100
        followY.value = Math.round(crossShift * 100) / 100
      } else {
        followX.value = Math.round(crossShift * 100) / 100
        followY.value = Math.round(primaryShift * 100) / 100
      }
    }

    const nearest = findNearest(finalStart + nextSize / 2, pool)
    const nextIdx = nearest ? nearest.index : null
    if (hoverIndex.value !== nextIdx) {
      hoverIndex.value = nextIdx
      options.onHoverChange?.(nextIdx)
    }
    coveredIndex.value = findCovered(finalStart, nextSize, pool)
  }

  function clearHoldTimer() {
    if (holdTimer !== null) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
  }

  function removeWindowListeners() {
    if (typeof window === 'undefined') return
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowCancel)
  }

  function resetState() {
    clearHoldTimer()
    removeWindowListeners()
    activePointerId = null
    allowedGroupSet = null
    pressed.value = false
    dragging.value = false
    movedPrimary = false
    hoverIndex.value = null
    coveredIndex.value = null
    dragStartPos.value = null
    dragSize.value = null
    pressTargetPos.value = null
    pressTargetSize.value = null
    followX.value = 0
    followY.value = 0
    options.onHoverChange?.(null)
  }

  function onPointerDown(e: PointerEvent, itemIndex?: number) {
    if (typeof window === 'undefined') return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-no-scrub]')) return

    metricsCache = measureMetrics()
    if (!metricsCache.length) return

    activePointerId = e.pointerId
    pointerType = e.pointerType || 'mouse'
    startClientX = e.clientX
    startClientY = e.clientY
    movedPrimary = false
    pressed.value = true
    dragging.value = false
    followX.value = 0
    followY.value = 0

    const ptrRel = (options.axis === 'x' ? e.clientX : e.clientY) - containerStartClient
    const allEnabled = metricsCache.filter((m) => !m.disabled)
    const touchedMetric =
      typeof itemIndex === 'number'
        ? metricsCache.find((m) => m.index === itemIndex)
        : findNearest(ptrRel, allEnabled)

    if (!touchedMetric || touchedMetric.disabled) {
      resetState()
      return
    }

    if (options.getGroupIndices) {
      const groupIndices = options.getGroupIndices(touchedMetric.index)
      allowedGroupSet = groupIndices && groupIndices.length ? new Set(groupIndices) : null
    } else {
      allowedGroupSet = null
    }

    const activeIdx = options.getActiveIndex?.()
    const activeMetric =
      typeof activeIdx === 'number' ? metricsCache.find((m) => m.index === activeIdx) : undefined
    const activeInSameGroup = Boolean(
      activeMetric && (!allowedGroupSet || allowedGroupSet.has(activeMetric.index)),
    )

    if (activeInSameGroup && activeMetric && activeMetric.index === touchedMetric.index) {
      grabOffsetInItem = Math.max(4, Math.min(activeMetric.size - 4, ptrRel - activeMetric.start))
      pressTargetPos.value = null
      pressTargetSize.value = null
      coveredIndex.value = activeMetric.index
    } else {
      grabOffsetInItem = touchedMetric.size / 2
      // Immediately glide the indicator to the pressed non-active item on pointerdown (zero deadzone delay!)
      pressTargetPos.value = touchedMetric.start
      pressTargetSize.value = touchedMetric.size
      coveredIndex.value = touchedMetric.index
    }

    hoverIndex.value = touchedMetric.index
    options.onHoverChange?.(touchedMetric.index)

    // Scroll-safe touch guard for scrollable vertical lists
    touchScrubUnlocked = true
    if (options.scrollSafeTouch && pointerType === 'touch') {
      const container = options.getContainer()
      const scrollParent = container?.closest('.vl-scroll-viewport') as HTMLElement | null
      const canScroll = scrollParent ? scrollParent.scrollHeight > scrollParent.clientHeight + 4 : false
      const grabbedActive = Boolean(
        activeMetric && activeMetric.index === touchedMetric.index,
      )
      if (canScroll && !grabbedActive) {
        touchScrubUnlocked = false
        clearHoldTimer()
        holdTimer = setTimeout(() => {
          touchScrubUnlocked = true
          if (pressed.value && !dragging.value) {
            dragging.value = true
            applyPointerPosition(startClientX, startClientY)
          }
        }, 150)
      }
    }

    window.addEventListener('pointermove', onWindowMove, { passive: false })
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowCancel)
  }

  function onWindowMove(e: PointerEvent) {
    if (activePointerId === null || e.pointerId !== activePointerId) return
    const dx = e.clientX - startClientX
    const dy = e.clientY - startClientY
    const primary = options.axis === 'x' ? dx : dy
    const cross = options.axis === 'x' ? dy : dx

    if (!dragging.value) {
      if (!touchScrubUnlocked) {
        if (Math.hypot(dx, dy) > 8) {
          resetState()
        }
        return
      }
      if (Math.abs(cross) > Math.abs(primary) * 1.4 && Math.abs(cross) > 9) {
        resetState()
        return
      }
      if (Math.abs(primary) < 6) return
      clearHoldTimer()
      dragging.value = true
      movedPrimary = true
      window.getSelection?.()?.removeAllRanges()
    }

    if (e.cancelable) e.preventDefault()
    applyPointerPosition(e.clientX, e.clientY)
  }

  function onWindowUp(e: PointerEvent) {
    if (activePointerId === null || e.pointerId !== activePointerId) return
    const wasDragging = dragging.value && movedPrimary
    const finalIdx = hoverIndex.value
    resetState()

    if (wasDragging) {
      suppressClickFlag = true
      if (suppressTimer !== null) clearTimeout(suppressTimer)
      suppressTimer = setTimeout(() => {
        suppressClickFlag = false
        suppressTimer = null
      }, 0)

      if (finalIdx !== null) {
        options.onCommit(finalIdx, e)
      }
    }
  }

  function onWindowCancel(e: PointerEvent) {
    if (activePointerId === null || e.pointerId !== activePointerId) return
    resetState()
  }

  function consumeSuppressedClick(): boolean {
    if (!suppressClickFlag) return false
    suppressClickFlag = false
    if (suppressTimer !== null) {
      clearTimeout(suppressTimer)
      suppressTimer = null
    }
    return true
  }

  onBeforeUnmount(() => {
    resetState()
    if (suppressTimer !== null) clearTimeout(suppressTimer)
  })

  return {
    pressed,
    dragging,
    hoverIndex,
    coveredIndex,
    dragStartPos,
    dragSize,
    pressTargetPos,
    pressTargetSize,
    followX,
    followY,
    onPointerDown,
    consumeSuppressedClick,
  }
}
