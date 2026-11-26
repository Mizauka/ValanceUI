import { ref, watch, onBeforeUnmount, type Ref } from 'vue'

export interface PushDrawerGestureOptions {
  isOpen: Ref<boolean>
  setOpen: (open: boolean) => void
  drawerWidth: Ref<number>
  enabled?: Ref<boolean>
  ignoreSelector?: string
  /** Left-edge activation zone in px when drawer is closed (default 32px to avoid fighting in-page widgets) */
  edgeZone?: number
  openVelocity?: number
  snapThreshold?: number
  animMs?: number
}

const FOCUSABLE_OR_INTERACTIVE_SELECTOR =
  'a[href], button, input, textarea, select, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"], [role="button"], [role="link"], [role="slider"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="tablist"], [role="menuitem"], [role="option"], [role="dialog"]'

const DEFAULT_IGNORE_SELECTOR =
  '[data-no-drawer-gesture], [data-chart-interactive], .vl-sash, .vl-sash-hit, .vl-split-sash, [role="separator"], .vl-scroll-thumb, .vl-scroll-track, .vl-dock-sheet, .dock-sheet, .vl-bottom-dock, .vl-nav-rail-capsule, .vl-nav-rail-bar, .vl-pull-refresh, .vl-clock-svg, .vl-calendar, .vl-chart-svg, .vl-table-wrap, .floating-tab-dock, .vl-seg-track, .vl-tabs-items, .vl-slider, .vl-switch-track, .vl-sheet, .vl-sheet-backdrop, .mobile-action-sheet, .mobile-sheet-backdrop, pre, code'

/** Analytic approximation of gentle deceleration cubic-bezier(0.2, 0.6, 0.3, 1) via 5 Newton iterations */
export function easeNonlinear(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  let u = x
  for (let i = 0; i < 5; i++) {
    const inv = 1 - u
    const bx = 3 * inv * inv * u * 0.2 + 3 * inv * u * u * 0.3 + u * u * u
    const dbx = 3 * inv * inv * 0.2 + 6 * inv * u * (0.3 - 0.2) + 3 * u * u * (1 - 0.3)
    if (Math.abs(dbx) < 1e-5) break
    u = Math.max(0, Math.min(1, u - (bx - x) / dbx))
  }
  const inv = 1 - u
  return 3 * inv * inv * u * 0.6 + 3 * inv * u * u * 1.0 + u * u * u
}

export function usePushDrawerGesture(options: PushDrawerGestureOptions) {
  const isDragging = ref(false)
  const progress = ref(options.isOpen.value ? 1 : 0)
  const velocity = ref(0)

  const openVelocity = options.openVelocity ?? 0.32
  const snapThreshold = options.snapThreshold ?? 0.36
  const animMs = options.animMs ?? 340
  const ignoreSelector = options.ignoreSelector ?? DEFAULT_IGNORE_SELECTOR

  let gestureActive = false
  let gestureLocked: 'none' | 'horizontal' | 'vertical' = 'none'
  let gestureStartX = 0
  let gestureStartY = 0
  let gestureStartProgress = 0
  let gestureLastX = 0
  let gestureLastTime = 0
  let gestureVelocityX = 0
  let suppressNextClick = false
  let suppressClickTimer: number | null = null
  let tweenRafId: number | null = null

  function stopTween(): void {
    if (tweenRafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(tweenRafId)
      tweenRafId = null
    }
  }

  function animateTo(target: number): void {
    stopTween()
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      progress.value = target
      return
    }
    const from = progress.value
    const delta = target - from
    if (Math.abs(delta) < 0.002) {
      progress.value = target
      return
    }
    const duration = Math.max(
      140,
      Math.round(animMs * Math.min(1, Math.abs(delta) * 1.15 + 0.25)),
    )
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const p = Math.min(1, elapsed / duration)
      progress.value = from + delta * easeNonlinear(p)
      if (p < 1) {
        tweenRafId = window.requestAnimationFrame(step)
      } else {
        tweenRafId = null
        progress.value = target
      }
    }
    tweenRafId = window.requestAnimationFrame(step)
  }

  watch(
    () => options.isOpen.value,
    (open) => {
      if (isDragging.value) return
      animateTo(open ? 1 : 0)
    },
  )

  function blockHorizontalTouchScroll(e: TouchEvent): void {
    if (gestureLocked === 'horizontal' && e.cancelable) {
      e.preventDefault()
    }
  }

  function cleanupGesture(): void {
    gestureActive = false
    gestureLocked = 'none'
    if (typeof window === 'undefined') return
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    window.removeEventListener('touchmove', blockHorizontalTouchScroll)
  }

  function hasHorizontalScrollableAncestor(target: HTMLElement | null, host: HTMLElement | null): boolean {
    let cur = target
    while (cur && cur !== host && cur !== document.body) {
      if (cur.scrollWidth > cur.clientWidth + 2) {
        const style = window.getComputedStyle(cur)
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true
      }
      cur = cur.parentElement
    }
    return false
  }

  function onPointerDown(e: PointerEvent): void {
    if (typeof window === 'undefined') return
    if (options.enabled && !options.enabled.value) return
    if (e.button !== 0) return

    const host = e.currentTarget as HTMLElement | null
    const target = e.target as HTMLElement | null

    // Exclude nested VlPushDrawer shells: inner drawer owns gestures started inside it
    const nearestShell = target?.closest('.vl-push-shell')
    if (nearestShell && host && nearestShell !== host) {
      return
    }

    if (ignoreSelector && target?.closest(ignoreSelector)) {
      return
    }

    // When drawer is closed:
    // 1) Never fight focusable/interactive controls or horizontally scrollable containers.
    // 2) On desktop mouse, never hijack native left-to-right text selection on selectable elements
    //    (touch devices handle text selection via OS long-press so touch swipe stays free).
    if (!options.isOpen.value) {
      if (target?.closest(FOCUSABLE_OR_INTERACTIVE_SELECTOR)) return
      if (hasHorizontalScrollableAncestor(target, host)) return
      if (e.pointerType === 'mouse' && target && !target.closest('[data-drawer-drag-zone]')) {
        const userSelect = window.getComputedStyle(target).userSelect
        if (userSelect !== 'none') return
      }
      if (typeof options.edgeZone === 'number' && options.edgeZone > 0) {
        const hostLeft = host?.getBoundingClientRect().left ?? 0
        if (e.clientX - hostLeft > options.edgeZone) return
      }
    }

    gestureActive = true
    gestureLocked = 'none'
    gestureStartX = e.clientX
    gestureStartY = e.clientY
    gestureLastX = e.clientX
    gestureLastTime = performance.now()
    gestureVelocityX = 0
    velocity.value = 0
    gestureStartProgress = progress.value

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!gestureActive) return
    const dx = e.clientX - gestureStartX
    const dy = e.clientY - gestureStartY

    if (gestureLocked === 'none') {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return
      if (Math.abs(dx) > Math.abs(dy) * 1.35) {
        const canSlide = (!options.isOpen.value && dx > 0) || (options.isOpen.value && dx < 0)
        if (canSlide) {
          gestureLocked = 'horizontal'
          stopTween()
          gestureStartProgress = progress.value
          isDragging.value = true
          if (typeof window !== 'undefined') {
            window.addEventListener('touchmove', blockHorizontalTouchScroll, { passive: false })
            window.getSelection?.()?.removeAllRanges()
          }
        } else {
          cleanupGesture()
          return
        }
      } else {
        gestureLocked = 'vertical'
        cleanupGesture()
        return
      }
    }

    if (gestureLocked === 'horizontal') {
      if (e.cancelable) e.preventDefault()
      const now = performance.now()
      const dt = Math.max(1, now - gestureLastTime)
      gestureVelocityX = (e.clientX - gestureLastX) / dt
      velocity.value = gestureVelocityX
      gestureLastX = e.clientX
      gestureLastTime = now

      const width = Math.max(1, options.drawerWidth.value)
      const rawProgress = gestureStartProgress + dx / width
      progress.value = Math.max(0, Math.min(1, rawProgress))
    }
  }

  function onPointerUp(): void {
    if (!gestureActive) return
    const wasHorizontal = gestureLocked === 'horizontal'
    const currentProgress = progress.value
    const vx = gestureVelocityX

    cleanupGesture()
    isDragging.value = false

    if (!wasHorizontal) return

    suppressNextClick = true
    if (typeof window !== 'undefined') {
      if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer)
      suppressClickTimer = window.setTimeout(() => {
        suppressNextClick = false
        suppressClickTimer = null
      }, 240)
    }

    const shouldOpen =
      vx > openVelocity ? true : vx < -openVelocity ? false : currentProgress >= snapThreshold
    const target = shouldOpen ? 1 : 0
    if (options.isOpen.value !== shouldOpen) {
      options.setOpen(shouldOpen)
    } else {
      animateTo(target)
    }
  }

  function onClickCapture(e: MouseEvent): void {
    if (!suppressNextClick) return
    suppressNextClick = false
    if (suppressClickTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(suppressClickTimer)
      suppressClickTimer = null
    }
    e.preventDefault()
    e.stopPropagation()
  }

  onBeforeUnmount(() => {
    cleanupGesture()
    stopTween()
    if (suppressClickTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(suppressClickTimer)
      suppressClickTimer = null
    }
  })

  return {
    progress,
    isDragging,
    velocity,
    animateTo,
    onPointerDown,
    onClickCapture,
  }
}
