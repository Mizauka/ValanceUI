<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, type CSSProperties } from 'vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import VlScrollArea from '../layout/VlScrollArea.vue'
import { useBackHandler } from '../../composables/useBackNavigation'

let sheetSeq = 0

const isClient = typeof window !== 'undefined'
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const isAppleWebKit =
  /Safari/i.test(ua) &&
  !/Chrome|Chromium|Edg|OPR|Firefox|Android|CriOS|FxiOS|EdgiOS/i.test(ua)
const hasCssScrollTimeline =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()') &&
  CSS.supports('timeline-scope: --vl-t')
const useSafariDriver = isAppleWebKit && hasCssScrollTimeline

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    placement?: 'bottom' | 'left' | 'right'
    maxHeight?: string
    maxWidth?: string
    width?: string
    expandable?: boolean
    detent?: 'half' | 'full'
    halfRatio?: number
    fullRatio?: number
    contained?: boolean
    closeOnBackdrop?: boolean
    accentTone?: 'primary' | 'secondary'
  }>(),
  {
    title: '',
    placement: 'bottom',
    maxHeight: '88dvh',
    maxWidth: '640px',
    width: '360px',
    expandable: false,
    detent: 'half',
    halfRatio: 0.56,
    fullRatio: 0.9,
    contained: false,
    closeOnBackdrop: true,
    accentTone: 'primary',
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'update:detent', detent: 'half' | 'full'): void
  (e: 'close'): void
  (e: 'closed'): void
}>()

const sheetId = ++sheetSeq
const timelineName = `--vl-sh-tl-${sheetId}`

const sheetRef = ref<HTMLElement | null>(null)
const safariDriverRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<InstanceType<typeof VlScrollArea> | null>(null)
const isDragging = ref(false)
const dismissing = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const internalDetent = ref<'half' | 'full'>(props.detent)
const dragY = ref<number | null>(null)
const settledHalfSpacer = ref(props.expandable && props.detent === 'half')
const hostViewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight || 800 : 800)

// Safari scroll-timeline compositor state
const safariAnimMode = ref<'a' | 'b' | null>(null)
const safariAnimVars = ref<Record<string, string>>({})

let dragStartX = 0
let dragStartY = 0
let dragLastX = 0
let dragLastY = 0
let dragLastTime = 0
let dragVelocityX = 0
let dragVelocityY = 0
let dragStartYOffset = 0
let dragStartDetent: 'half' | 'full' = 'half'
let bodyStartX = 0
let bodyStartY = 0
let bodyStartTime = 0
let bodyPullActive = false
let bodyLockedAsInnerScroll = false
let dismissFromOffset: { axis: 'X' | 'Y'; px: number } | null = null
let activeAnimCleanup: (() => void) | null = null
let settleRafId: number | null = null
let spacerTimer: number | null = null

let safariDriverParity: 'a' | 'b' = 'a'
let safariAnimToken = 0
let awaitingSafariEndToken = 0
let safariDriverRaf: number | null = null
let safariDriverTimer: number | null = null
let activeSafariOnFinish: (() => void) | null = null

const isExpandableBottom = computed(() => props.expandable && props.placement === 'bottom')
const halfPx = computed(() => Math.round(hostViewportHeight.value * props.halfRatio))
const fullPx = computed(() =>
  Math.max(halfPx.value + 80, Math.round(hostViewportHeight.value * props.fullRatio)),
)
const halfOffsetY = computed(() => Math.max(0, fullPx.value - halfPx.value))

function detentOffsetY(detent: 'half' | 'full'): number {
  return detent === 'full' ? 0 : halfOffsetY.value
}

function restingTransform(): string {
  if (isExpandableBottom.value) {
    return `translate3d(0, ${detentOffsetY(internalDetent.value)}px, 0)`
  }
  return 'translate3d(0, 0, 0)'
}

function offscreenTransform(): string {
  if (props.placement === 'left') return 'translate3d(-100%, 0, 0)'
  if (props.placement === 'right') return 'translate3d(100%, 0, 0)'
  if (isExpandableBottom.value) return `translate3d(0, ${fullPx.value}px, 0)`
  return 'translate3d(0, 100%, 0)'
}

function syncViewportHeight() {
  if (props.contained) {
    const hostEl = sheetRef.value?.parentElement?.parentElement ?? sheetRef.value?.parentElement
    if (hostEl && hostEl.clientHeight > 0) {
      hostViewportHeight.value = hostEl.clientHeight
      return
    }
  }
  if (typeof window !== 'undefined' && window.innerHeight > 0) {
    hostViewportHeight.value = window.innerHeight
  }
}

function cancelSpacerTimer() {
  if (spacerTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(spacerTimer)
    spacerTimer = null
  }
}

function commitSpacerAfterSettle(next: 'half' | 'full') {
  cancelSpacerTimer()
  if (!isExpandableBottom.value) return
  if (typeof window !== 'undefined') {
    spacerTimer = window.setTimeout(() => {
      spacerTimer = null
      settledHalfSpacer.value = internalDetent.value === 'half'
    }, 390)
  } else {
    settledHalfSpacer.value = next === 'half'
  }
}

function setDetent(next: 'half' | 'full', animateSnap = false) {
  const prev = internalDetent.value
  const fromY = dragY.value !== null ? dragY.value : detentOffsetY(prev)
  if (prev !== next) {
    internalDetent.value = next
    emit('update:detent', next)
  }
  if (!isExpandableBottom.value) return

  const toY = detentOffsetY(next)
  if (useSafariDriver && props.open && (animateSnap || Math.abs(fromY - toY) > 1)) {
    cancelSettleRaf()
    dragY.value = null
    dragOffsetY.value = 0
    void runSafariTimelineAnim(
      `translate3d(0, ${Math.round(fromY)}px, 0)`,
      `translate3d(0, ${Math.round(toY)}px, 0)`,
      1,
      1,
      () => {
        settledHalfSpacer.value = internalDetent.value === 'half'
      },
    )
    return
  }

  commitSpacerAfterSettle(next)
}

function toggleDetent() {
  cancelSettleRaf()
  const next = internalDetent.value === 'full' ? 'half' : 'full'
  const fromY = dragY.value !== null ? dragY.value : detentOffsetY(internalDetent.value)
  dragY.value = null
  dragOffsetY.value = 0
  if (useSafariDriver && props.open) {
    internalDetent.value = next
    emit('update:detent', next)
    void runSafariTimelineAnim(
      `translate3d(0, ${Math.round(fromY)}px, 0)`,
      `translate3d(0, ${Math.round(detentOffsetY(next))}px, 0)`,
      1,
      1,
      () => {
        settledHalfSpacer.value = internalDetent.value === 'half'
      },
    )
    return
  }
  setDetent(next)
}

watch(
  () => props.detent,
  (next) => {
    const prev = internalDetent.value
    internalDetent.value = next
    if (prev !== next && props.open && isExpandableBottom.value) {
      commitSpacerAfterSettle(next)
    } else if (!props.open) {
      settledHalfSpacer.value = props.expandable && next === 'half'
    }
  },
)

function cancelSettleRaf() {
  if (settleRafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(settleRafId)
    settleRafId = null
  }
}

function clearActiveAnim() {
  activeAnimCleanup?.()
  activeAnimCleanup = null
}

function clearSafariDriverTimers() {
  if (safariDriverTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(safariDriverTimer)
    safariDriverTimer = null
  }
  if (safariDriverRaf !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(safariDriverRaf)
    safariDriverRaf = null
  }
}

function cancelSafariTimelineAnim() {
  safariAnimToken++
  clearSafariDriverTimers()
  awaitingSafariEndToken = 0
  safariAnimMode.value = null
  activeSafariOnFinish = null
  if (safariDriverRef.value) {
    safariDriverRef.value.scrollLeft = 0
  }
}

function finishSafariTimelineAnim(token: number) {
  if (token !== safariAnimToken) return
  clearSafariDriverTimers()
  awaitingSafariEndToken = 0
  safariAnimMode.value = null
  if (safariDriverRef.value) {
    safariDriverRef.value.scrollLeft = 0
  }
  const cb = activeSafariOnFinish
  activeSafariOnFinish = null
  cb?.()
}

function onSafariDriverScrollEnd() {
  const driver = safariDriverRef.value
  if (!driver || !safariAnimMode.value) return
  if (awaitingSafariEndToken !== safariAnimToken) return
  if (driver.scrollLeft <= 4) return
  finishSafariTimelineAnim(safariAnimToken)
}

async function runSafariTimelineAnim(
  fromTransform: string,
  toTransform: string,
  fromBackdropOpacity: number,
  toBackdropOpacity: number,
  onFinish: () => void,
) {
  const token = ++safariAnimToken
  clearSafariDriverTimers()
  awaitingSafariEndToken = 0
  activeSafariOnFinish = onFinish

  safariDriverParity = safariDriverParity === 'a' ? 'b' : 'a'
  const driver = safariDriverRef.value
  if (driver) driver.scrollLeft = 0

  safariAnimVars.value = {
    '--vl-sh-from': fromTransform,
    '--vl-sh-to': toTransform,
    '--vl-bd-from': String(fromBackdropOpacity),
    '--vl-bd-to': String(toBackdropOpacity),
  }
  safariAnimMode.value = safariDriverParity

  await nextTick()
  if (token !== safariAnimToken) return

  const activeDriver = safariDriverRef.value
  if (!activeDriver || typeof activeDriver.scrollTo !== 'function' || typeof requestAnimationFrame !== 'function') {
    finishSafariTimelineAnim(token)
    return
  }

  const travel = Math.max(activeDriver.scrollWidth - activeDriver.clientWidth, 1)
  safariDriverRaf = requestAnimationFrame(() => {
    safariDriverRaf = null
    if (token !== safariAnimToken || !safariDriverRef.value) return
    awaitingSafariEndToken = token
    safariDriverRef.value.scrollTo({ left: travel, behavior: 'smooth' })
  })
  safariDriverTimer = window.setTimeout(() => {
    finishSafariTimelineAnim(token)
  }, 660)
}

function close() {
  emit('update:open', false)
  emit('close')
}

useBackHandler(
  computed(() => props.open && !props.contained),
  () => {
    close()
    return true
  },
  250,
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      syncViewportHeight()
      cancelSettleRaf()
      cancelSpacerTimer()
      internalDetent.value = props.detent
      settledHalfSpacer.value = props.expandable && props.detent === 'half'
      dragY.value = null
      dismissing.value = false
      dismissFromOffset = null
      isDragging.value = false
      dragOffsetX.value = 0
      dragOffsetY.value = 0
    }
  },
)

const hostScopeStyle = computed<CSSProperties>(() =>
  useSafariDriver
    ? ({
        'timeline-scope': timelineName,
        '--vl-sheet-tl': timelineName,
      } as unknown as CSSProperties)
    : {},
)

const safariDriverStyle = computed<CSSProperties>(() =>
  useSafariDriver
    ? ({
        'scroll-timeline-name': timelineName,
      } as unknown as CSSProperties)
    : {},
)

const currentExpandableY = computed(() => {
  if (!isExpandableBottom.value) return 0
  if (dragY.value !== null && (isDragging.value || dismissing.value || settleRafId !== null)) {
    return dragY.value
  }
  return detentOffsetY(internalDetent.value)
})

const sheetDynamicStyle = computed(() => {
  const base: Record<string, string> = {
    ...(useSafariDriver && safariAnimMode.value ? safariAnimVars.value : {}),
  }
  if (props.placement === 'bottom') {
    if (props.expandable) {
      base.height = `${fullPx.value}px`
      base.maxHeight = `${fullPx.value}px`
      if (!safariAnimMode.value) {
        base.transform = `translate3d(0, ${Math.round(currentExpandableY.value)}px, 0)`
      }
      if (isDragging.value) base.transition = 'none'
    } else {
      base.maxHeight = props.maxHeight
      if (dragOffsetY.value > 0 && (isDragging.value || dismissing.value || settleRafId !== null)) {
        base.transform = `translate3d(0, ${dragOffsetY.value}px, 0)`
        if (isDragging.value) base.transition = 'none'
      }
    }
    base['--vl-sheet-max-w'] = props.maxWidth
  } else {
    base.width = props.width
    if (dragOffsetX.value !== 0 && (isDragging.value || dismissing.value || settleRafId !== null)) {
      base.transform = `translate3d(${dragOffsetX.value}px, 0, 0)`
      if (isDragging.value) base.transition = 'none'
    }
  }
  return base
})

const sheetBodyStyle = computed(() => {
  if (isExpandableBottom.value && settledHalfSpacer.value) {
    return {
      paddingBottom: `${24 + halfOffsetY.value}px`,
    }
  }
  return undefined
})

const footerDynamicStyle = computed(() => {
  if (!isExpandableBottom.value || safariAnimMode.value) return undefined
  return {
    transform: `translate3d(0, ${Math.round(-currentExpandableY.value)}px, 0)`,
    ...(isDragging.value ? { transition: 'none' } : {}),
  }
})

function computeDragBackdropRatio(): number {
  if (isExpandableBottom.value) {
    const downPastHalf = Math.max(0, currentExpandableY.value - halfOffsetY.value)
    return downPastHalf <= 0 ? 1 : Math.max(0.05, 1 - downPastHalf / Math.max(1, halfPx.value))
  }
  const dim =
    props.placement === 'bottom'
      ? sheetRef.value?.offsetHeight || 420
      : sheetRef.value?.offsetWidth || 360
  const offset = props.placement === 'bottom' ? dragOffsetY.value : Math.abs(dragOffsetX.value)
  if (offset <= 0) return 1
  return Math.max(0.05, 1 - offset / Math.max(1, dim))
}

const backdropDynamicStyle = computed(() => {
  const vars = useSafariDriver && safariAnimMode.value ? safariAnimVars.value : {}
  if (isDragging.value) {
    const ratio = computeDragBackdropRatio()
    if (ratio < 1) {
      return {
        ...vars,
        opacity: ratio,
        transition: 'none',
      }
    }
  }
  return Object.keys(vars).length ? vars : undefined
})

function onBeforeEnter(el: Element) {
  clearActiveAnim()
  cancelSafariTimelineAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'none'
  htmlEl.style.transform = offscreenTransform()
}

function onEnter(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  syncViewportHeight()
  const targetTf = restingTransform()

  if (useSafariDriver) {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearActiveAnim()
      done()
    }
    activeAnimCleanup = () => {
      cancelSafariTimelineAnim()
    }
    htmlEl.style.transition = ''
    htmlEl.style.transform = targetTf
    void runSafariTimelineAnim(offscreenTransform(), targetTf, 0, 1, finish)
    return
  }

  const totalDim =
    props.placement === 'bottom'
      ? isExpandableBottom.value
        ? fullPx.value - detentOffsetY(internalDetent.value)
        : htmlEl.offsetHeight || 420
      : htmlEl.offsetWidth || 360
  const durMs = Math.round(Math.min(460, Math.max(360, 310 + totalDim * 0.16)))
  void htmlEl.offsetHeight

  let settled = false
  let enterRaf: number | null = null
  const finish = () => {
    if (settled) return
    settled = true
    clearActiveAnim()
    done()
  }
  const onEnd = (e: TransitionEvent) => {
    if (e.target === htmlEl && e.propertyName === 'transform') finish()
  }
  const timer = window.setTimeout(finish, durMs + 100)
  htmlEl.addEventListener('transitionend', onEnd)
  activeAnimCleanup = () => {
    if (enterRaf !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(enterRaf)
      enterRaf = null
    }
    window.clearTimeout(timer)
    htmlEl.removeEventListener('transitionend', onEnd)
  }

  const startTransition = () => {
    enterRaf = null
    if (settled) return
    htmlEl.style.transition = `transform ${durMs}ms cubic-bezier(0.26, 0.68, 0.28, 1)`
    htmlEl.style.transform = targetTf
  }

  // Defer one animation frame so heavy sheet children never coalesce away the initial offscreen paint
  if (typeof requestAnimationFrame === 'function') {
    enterRaf = requestAnimationFrame(() => {
      void htmlEl.offsetHeight
      startTransition()
    })
  } else {
    startTransition()
  }
}

function onAfterEnter(el: Element) {
  clearActiveAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = ''
  htmlEl.style.transform = isExpandableBottom.value ? restingTransform() : ''
}

function onBeforeLeave(el: Element) {
  clearActiveAnim()
  cancelSafariTimelineAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'none'
  if (dismissFromOffset) {
    htmlEl.style.transform =
      dismissFromOffset.axis === 'Y'
        ? `translate3d(0, ${dismissFromOffset.px}px, 0)`
        : `translate3d(${dismissFromOffset.px}px, 0, 0)`
  } else {
    htmlEl.style.transform = restingTransform()
  }
}

function onLeave(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement

  if (useSafariDriver) {
    const startTf = dismissFromOffset
      ? dismissFromOffset.axis === 'Y'
        ? `translate3d(0, ${Math.round(dismissFromOffset.px)}px, 0)`
        : `translate3d(${Math.round(dismissFromOffset.px)}px, 0, 0)`
      : restingTransform()
    const startBackdrop =
      dismissFromOffset && isExpandableBottom.value
        ? Math.max(0.05, 1 - Math.max(0, dismissFromOffset.px - halfOffsetY.value) / Math.max(1, halfPx.value))
        : 1
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearActiveAnim()
      done()
    }
    activeAnimCleanup = () => {
      cancelSafariTimelineAnim()
    }
    htmlEl.style.transition = ''
    htmlEl.style.transform = offscreenTransform()
    void runSafariTimelineAnim(startTf, offscreenTransform(), startBackdrop, 0, finish)
    return
  }

  const totalDim =
    props.placement === 'bottom'
      ? htmlEl.offsetHeight || 420
      : htmlEl.offsetWidth || 360
  const traveled = dismissFromOffset
    ? Math.abs(dismissFromOffset.px)
    : isExpandableBottom.value
      ? detentOffsetY(internalDetent.value)
      : 0
  const remainRatio = Math.max(0.25, Math.min(1, 1 - traveled / Math.max(1, totalDim)))
  const durMs = Math.round(Math.max(260, (310 + totalDim * 0.15) * remainRatio))

  void htmlEl.offsetHeight
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    clearActiveAnim()
    done()
  }
  const onEnd = (e: TransitionEvent) => {
    if (e.target === htmlEl && e.propertyName === 'transform') finish()
  }
  const timer = window.setTimeout(finish, durMs + 80)
  htmlEl.addEventListener('transitionend', onEnd)
  activeAnimCleanup = () => {
    window.clearTimeout(timer)
    htmlEl.removeEventListener('transitionend', onEnd)
  }
  htmlEl.style.transition = `transform ${durMs}ms cubic-bezier(0.32, 0.08, 0.24, 1)`
  htmlEl.style.transform = offscreenTransform()
}

function onAfterLeave() {
  clearActiveAnim()
  cancelSafariTimelineAnim()
  cancelSettleRaf()
  cancelSpacerTimer()
  dismissing.value = false
  dismissFromOffset = null
  dragOffsetX.value = 0
  dragOffsetY.value = 0
  dragY.value = null
  emit('closed')
}

function onAnimCancel() {
  clearActiveAnim()
  cancelSafariTimelineAnim()
}

function applyExpandableVerticalDrag(dy: number) {
  const rawY = dragStartYOffset + dy
  if (rawY < 0) {
    dragY.value = Math.round(Math.max(-24, rawY * 0.15))
  } else {
    dragY.value = Math.round(rawY)
  }
  dragOffsetY.value = 0
}

function releaseWithSmoothTransition() {
  isDragging.value = false
  cancelSettleRaf()
  if (typeof requestAnimationFrame === 'function') {
    settleRafId = requestAnimationFrame(() => {
      settleRafId = null
      dragY.value = null
      dragOffsetX.value = 0
      dragOffsetY.value = 0
    })
  } else {
    dragY.value = null
    dragOffsetX.value = 0
    dragOffsetY.value = 0
  }
}

function settleExpandableVerticalDrag() {
  const halfOff = halfOffsetY.value
  const halfH = halfPx.value
  const curY = dragY.value ?? dragStartYOffset
  const downPastHalf = Math.max(0, curY - halfOff)

  if (downPastHalf > 0 && (dragVelocityY > 0.42 || downPastHalf > Math.min(140, halfH * 0.24))) {
    dismissFromOffset = { axis: 'Y', px: curY }
    dismissing.value = true
    isDragging.value = false
    dragY.value = null
    close()
    return
  }

  let nextDetent: 'half' | 'full'
  if (dragStartDetent === 'full' && downPastHalf === 0 && dragVelocityY > 0.7 && curY > halfOff - 40) {
    nextDetent = 'half'
  } else if (dragVelocityY < -0.35) {
    nextDetent = 'full'
  } else if (dragVelocityY > 0.35) {
    nextDetent = 'half'
  } else if (dragStartDetent === 'half' && halfOff - curY > Math.min(72, halfOff * 0.28) && dragVelocityY <= 0.1) {
    nextDetent = 'full'
  } else {
    nextDetent = curY <= halfOff / 2 ? 'full' : 'half'
  }

  if (useSafariDriver) {
    const prev = internalDetent.value
    if (prev !== nextDetent) {
      internalDetent.value = nextDetent
      emit('update:detent', nextDetent)
    }
    const targetY = detentOffsetY(nextDetent)
    isDragging.value = false
    dragY.value = null
    dragOffsetY.value = 0
    void runSafariTimelineAnim(
      `translate3d(0, ${Math.round(curY)}px, 0)`,
      `translate3d(0, ${Math.round(targetY)}px, 0)`,
      downPastHalf > 0 ? Math.max(0.05, 1 - downPastHalf / Math.max(1, halfH)) : 1,
      1,
      () => {
        settledHalfSpacer.value = internalDetent.value === 'half'
      },
    )
    return
  }

  setDetent(nextDetent)
  // Keep current dragY offset for 1 animation frame after removing .dragging so CSS transform transition catches it cleanly
  releaseWithSmoothTransition()
}

function onHandlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || typeof window === 'undefined') return
  cancelSafariTimelineAnim()
  cancelSettleRaf()
  cancelSpacerTimer()
  syncViewportHeight()
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragLastX = e.clientX
  dragLastY = e.clientY
  dragLastTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  dragVelocityX = 0
  dragVelocityY = 0
  dragOffsetX.value = 0
  dragOffsetY.value = 0
  dragStartDetent = internalDetent.value
  dragStartYOffset = detentOffsetY(dragStartDetent)
  if (isExpandableBottom.value) {
    dragY.value = dragStartYOffset
  }

  window.addEventListener('pointermove', onHandlePointerMove, { passive: false })
  window.addEventListener('pointerup', onHandlePointerUp)
  window.addEventListener('pointercancel', onHandlePointerUp)
}

function onHandlePointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  if (e.cancelable) e.preventDefault()
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dt = Math.max(1, now - dragLastTime)
  if (props.placement === 'bottom') {
    const rawDy = e.clientY - dragStartY
    dragVelocityY = (e.clientY - dragLastY) / dt
    if (isExpandableBottom.value) {
      applyExpandableVerticalDrag(rawDy)
    } else {
      dragOffsetY.value = Math.max(0, rawDy)
    }
  } else if (props.placement === 'left') {
    const dx = Math.min(0, e.clientX - dragStartX)
    dragVelocityX = (e.clientX - dragLastX) / dt
    dragOffsetX.value = dx
  } else {
    const dx = Math.max(0, e.clientX - dragStartX)
    dragVelocityX = (e.clientX - dragLastX) / dt
    dragOffsetX.value = dx
  }
  dragLastX = e.clientX
  dragLastY = e.clientY
  dragLastTime = now
}

function cleanupDrag() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onHandlePointerMove)
  window.removeEventListener('pointerup', onHandlePointerUp)
  window.removeEventListener('pointercancel', onHandlePointerUp)
}

function finalizeNonExpandableDrag() {
  const sheetHeight = sheetRef.value?.offsetHeight || 420
  const sheetWidth = sheetRef.value?.offsetWidth || 360
  let shouldDismiss = false
  if (props.placement === 'bottom') {
    shouldDismiss = dragVelocityY > 0.42 || dragOffsetY.value > Math.min(160, sheetHeight * 0.26)
  } else if (props.placement === 'left') {
    shouldDismiss = dragVelocityX < -0.42 || Math.abs(dragOffsetX.value) > Math.min(160, sheetWidth * 0.3)
  } else {
    shouldDismiss = dragVelocityX > 0.42 || dragOffsetX.value > Math.min(160, sheetWidth * 0.3)
  }
  if (shouldDismiss) {
    dismissFromOffset =
      props.placement === 'bottom'
        ? { axis: 'Y', px: dragOffsetY.value }
        : { axis: 'X', px: dragOffsetX.value }
    dismissing.value = true
    isDragging.value = false
    close()
    return
  }

  if (useSafariDriver) {
    const startTf =
      props.placement === 'bottom'
        ? `translate3d(0, ${Math.round(dragOffsetY.value)}px, 0)`
        : `translate3d(${Math.round(dragOffsetX.value)}px, 0, 0)`
    const startBd = computeDragBackdropRatio()
    isDragging.value = false
    dragOffsetX.value = 0
    dragOffsetY.value = 0
    void runSafariTimelineAnim(startTf, 'translate3d(0, 0, 0)', startBd, 1, () => {})
    return
  }

  releaseWithSmoothTransition()
}

function onHandlePointerUp() {
  if (!isDragging.value) return
  cleanupDrag()
  if (isExpandableBottom.value) {
    settleExpandableVerticalDrag()
    return
  }
  finalizeNonExpandableDrag()
}

function onBodyTouchStart(e: TouchEvent) {
  if (props.placement !== 'bottom' || e.touches.length !== 1) return
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [data-no-sheet-drag], .vl-slider, .vl-clock-svg, .vl-calendar')) {
    bodyLockedAsInnerScroll = true
    return
  }
  const t = e.touches[0]!
  bodyStartX = t.clientX
  bodyStartY = t.clientY
  bodyStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  bodyPullActive = false
  bodyLockedAsInnerScroll = false
}

function onBodyTouchMove(e: TouchEvent) {
  if (props.placement !== 'bottom' || e.touches.length !== 1 || bodyLockedAsInnerScroll) return
  const t = e.touches[0]!
  const dx = t.clientX - bodyStartX
  const dy = t.clientY - bodyStartY

  if (!bodyPullActive) {
    if (Math.hypot(dx, dy) < 8) return
    if (Math.abs(dx) > Math.abs(dy)) {
      bodyLockedAsInnerScroll = true
      return
    }
    const vp = scrollAreaRef.value?.getViewport()
    const target = e.target as HTMLElement | null
    const innerVp = target?.closest('.csa-viewport') as HTMLElement | null
    const canScrollInnerUp =
      !!innerVp &&
      innerVp !== vp &&
      innerVp.scrollHeight > innerVp.clientHeight + 2 &&
      innerVp.scrollTop > 1
    const canScrollInnerDown =
      !!innerVp &&
      innerVp !== vp &&
      innerVp.scrollHeight > innerVp.clientHeight + 2 &&
      innerVp.scrollTop + innerVp.clientHeight < innerVp.scrollHeight - 2
    const atTop = (!vp || vp.scrollTop <= 1) && !canScrollInnerUp
    const atBottom =
      (!vp || vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2) && !canScrollInnerDown

    const canPullDown = dy > 0 && atTop
    const canPullUp = dy < 0 && atBottom && props.expandable && internalDetent.value === 'half'

    if (canPullDown || canPullUp) {
      cancelSafariTimelineAnim()
      cancelSettleRaf()
      cancelSpacerTimer()
      syncViewportHeight()
      bodyPullActive = true
      isDragging.value = true
      dragStartY = bodyStartY + Math.sign(dy) * Math.min(8, Math.abs(dy))
      dragLastY = t.clientY
      dragLastTime = bodyStartTime
      dragVelocityY = 0
      dragOffsetY.value = 0
      dragStartDetent = internalDetent.value
      dragStartYOffset = detentOffsetY(dragStartDetent)
      if (isExpandableBottom.value) {
        dragY.value = dragStartYOffset
      }
    } else {
      bodyLockedAsInnerScroll = true
      return
    }
  }

  if (e.cancelable) e.preventDefault()
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dt = Math.max(1, now - dragLastTime)
  dragVelocityY = (t.clientY - dragLastY) / dt
  dragLastY = t.clientY
  dragLastTime = now
  const rawDy = t.clientY - dragStartY
  if (isExpandableBottom.value) {
    applyExpandableVerticalDrag(rawDy)
  } else {
    dragOffsetY.value = Math.max(0, rawDy)
  }
}

function onBodyTouchEnd() {
  if (!bodyPullActive) {
    bodyLockedAsInnerScroll = false
    return
  }
  bodyPullActive = false
  bodyLockedAsInnerScroll = false
  if (isExpandableBottom.value) {
    settleExpandableVerticalDrag()
  } else {
    finalizeNonExpandableDrag()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close()
  }
}

onMounted(() => {
  syncViewportHeight()
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', syncViewportHeight, { passive: true })
  }
})

onBeforeUnmount(() => {
  clearActiveAnim()
  cancelSafariTimelineAnim()
  cancelSettleRaf()
  cancelSpacerTimer()
  cleanupDrag()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', syncViewportHeight)
  }
})
</script>

<template>
  <Teleport to="body" :disabled="contained || !isClient">
    <div
      class="vl-sheet-host shape-rect"
      :class="{ contained, active: open || safariAnimMode !== null }"
      :style="hostScopeStyle"
    >
      <div
        v-if="useSafariDriver"
        ref="safariDriverRef"
        class="vl-sheet-driver"
        aria-hidden="true"
        :style="safariDriverStyle"
        @scrollend="onSafariDriverScrollEnd"
      >
        <div class="vl-sheet-driver-spacer" />
      </div>

      <Transition :name="useSafariDriver ? '' : 'sheet-backdrop'">
        <div
          v-if="open"
          class="vl-sheet-backdrop shape-rect"
          :class="[
            { contained },
            safariAnimMode ? `is-bd-${safariAnimMode}` : '',
          ]"
          :style="backdropDynamicStyle"
          @click="closeOnBackdrop && close()"
        />
      </Transition>

      <Transition
        :css="false"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @after-enter="onAfterEnter"
        @enter-cancelled="onAnimCancel"
        @before-leave="onBeforeLeave"
        @leave="onLeave"
        @after-leave="onAfterLeave"
        @leave-cancelled="onAnimCancel"
      >
        <section
          v-if="open"
          ref="sheetRef"
          class="vl-sheet shape-rect"
          :class="[
            `place-${placement}`,
            `t-${accentTone}`,
            { contained, expandable, dragging: isDragging },
            safariAnimMode ? `is-sh-${safariAnimMode}` : '',
          ]"
          :style="sheetDynamicStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <div
            class="vl-sheet-head shape-rect"
            @pointerdown="onHandlePointerDown"
          >
            <div v-if="placement === 'bottom'" class="vl-sheet-handle-row">
              <span class="vl-sheet-handle shape-pill" :class="{ active: isDragging }" />
            </div>

            <div class="vl-sheet-title-row">
              <div class="vl-sheet-title-left">
                <span class="vl-sheet-accent shape-rect" />
                <h2 class="vl-sheet-title">{{ title }}</h2>
              </div>

              <div class="vl-sheet-title-right">
                <slot name="header-extra" />
                <button
                  v-if="expandable && placement === 'bottom'"
                  type="button"
                  class="vl-sheet-detent-btn shape-pill"
                  :class="{ active: internalDetent === 'full' }"
                  :aria-label="internalDetent === 'full' ? '切换半屏' : '切换全高'"
                  @pointerdown.stop
                  @click="toggleDetent"
                >
                  {{ internalDetent === 'full' ? '半屏' : '全高' }}
                </button>
                <VlIconButton
                  icon="close"
                  size="sm"
                  morph-on-hover
                  title="关闭"
                  aria-label="关闭"
                  class="vl-sheet-close-btn"
                  @pointerdown.stop
                  @click="close"
                />
              </div>
            </div>
          </div>

          <div
            class="vl-sheet-scroll-wrap"
            @touchstart.passive="onBodyTouchStart"
            @touchmove="onBodyTouchMove"
            @touchend="onBodyTouchEnd"
            @touchcancel="onBodyTouchEnd"
          >
            <VlScrollArea ref="scrollAreaRef" class="vl-sheet-scroll">
              <div class="vl-sheet-body" :style="sheetBodyStyle">
                <slot />
              </div>
            </VlScrollArea>
          </div>

          <footer v-if="$slots.footer" class="vl-sheet-footer shape-rect" :style="footerDynamicStyle">
            <slot name="footer" />
          </footer>
        </section>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.vl-sheet-host {
  position: fixed;
  inset: 0;
  z-index: 235;
  pointer-events: none;
}

.vl-sheet-host.contained {
  position: absolute;
  z-index: 60;
}

.vl-sheet-driver {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  overflow-x: scroll;
  overflow-y: hidden;
  opacity: 0.001;
  pointer-events: none;
  scrollbar-width: none;
  scroll-timeline-axis: x;
}

.vl-sheet-driver::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.vl-sheet-driver-spacer {
  width: calc(100% + 260px);
  height: 1px;
}

.vl-sheet-backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
  background-color: rgba(24, 21, 18, 0.36);
}

.vl-sheet {
  position: absolute;
  z-index: 2;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  overflow: hidden;
  contain: layout style;
  will-change: transform;
  transition: transform 0.36s cubic-bezier(0.26, 0.68, 0.28, 1);
}

.vl-sheet.expandable.place-bottom {
  overflow: visible;
}

.vl-sheet.expandable.place-bottom::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 44px;
  background-color: var(--bg-base);
  pointer-events: none;
}

.vl-sheet.dragging {
  transition: none;
}

/* Safari 120Hz Compositor Scroll-Timeline Animations (linear because scrollTo(smooth) provides easing) */
.vl-sheet.is-sh-a {
  transition: none !important;
  animation-name: vl-sh-drive-a;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
  animation-timeline: var(--vl-sheet-tl);
}

.vl-sheet.is-sh-b {
  transition: none !important;
  animation-name: vl-sh-drive-b;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
  animation-timeline: var(--vl-sheet-tl);
}

.vl-sheet-backdrop.is-bd-a {
  transition: none !important;
  animation-name: vl-bd-drive-a;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
  animation-timeline: var(--vl-sheet-tl);
}

.vl-sheet-backdrop.is-bd-b {
  transition: none !important;
  animation-name: vl-bd-drive-b;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
  animation-timeline: var(--vl-sheet-tl);
}

@keyframes vl-sh-drive-a {
  from { transform: var(--vl-sh-from, translate3d(0, 100%, 0)); }
  to { transform: var(--vl-sh-to, translate3d(0, 0, 0)); }
}

@keyframes vl-sh-drive-b {
  from { transform: var(--vl-sh-from, translate3d(0, 100%, 0)); }
  to { transform: var(--vl-sh-to, translate3d(0, 0, 0)); }
}

@keyframes vl-bd-drive-a {
  from { opacity: var(--vl-bd-from, 0); }
  to { opacity: var(--vl-bd-to, 1); }
}

@keyframes vl-bd-drive-b {
  from { opacity: var(--vl-bd-from, 0); }
  to { opacity: var(--vl-bd-to, 1); }
}

.vl-sheet.place-bottom {
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-top: 2px solid var(--accent-primary);
}

@media (min-width: 641px) {
  .vl-sheet.place-bottom:not(.contained) {
    width: min(var(--vl-sheet-max-w, 640px), calc(100% - 48px));
    margin-inline: auto;
    border-left: 1px solid var(--divider-strong);
    border-right: 1px solid var(--divider-strong);
  }
}

.vl-sheet.place-bottom.t-secondary {
  border-top-color: var(--accent-secondary);
}

.vl-sheet.place-left {
  top: 0;
  bottom: 0;
  left: 0;
  max-width: 92%;
  border-right: 2px solid var(--accent-primary);
}

.vl-sheet.place-right {
  top: 0;
  bottom: 0;
  right: 0;
  max-width: 92%;
  border-left: 2px solid var(--accent-primary);
}

.vl-sheet.contained.place-bottom {
  padding-bottom: 0;
}

.vl-sheet-head {
  flex-shrink: 0;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
  padding: 8px 14px 10px 14px;
  user-select: none;
  touch-action: none;
  cursor: grab;
}

.vl-sheet.dragging .vl-sheet-head {
  cursor: grabbing;
}

.vl-sheet-handle-row {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.vl-sheet-handle {
  width: 44px;
  height: 4px;
  background-color: var(--sash-handle);
  transition:
    width 0.2s var(--ease-decel),
    background-color 0.16s var(--ease-decel);
}

.vl-sheet-handle.active {
  width: 72px;
  background-color: var(--accent-primary);
}

.vl-sheet-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.vl-sheet-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.vl-sheet-title-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.vl-sheet-accent {
  width: 5px;
  height: 16px;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-sheet.t-secondary .vl-sheet-accent {
  background-color: var(--accent-secondary);
}

.vl-sheet-title {
  margin: 0;
  font-size: var(--ui-font-lg);
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-sheet-detent-btn {
  height: 26px;
  padding: 0 11px;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.16s var(--ease-decel),
    color 0.16s var(--ease-decel);
}

.vl-sheet-detent-btn.active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-sheet-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

@media (hover: hover) and (pointer: fine) {
  .vl-sheet-close-btn:hover {
    border-radius: 15px;
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.vl-sheet-close-btn:active {
  border-radius: 15px;
  background-color: var(--accent-primary-hover);
  color: var(--accent-primary-ink);
}

.vl-sheet-scroll-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  contain: layout style;
}

.vl-sheet-scroll {
  flex: 1;
  min-height: 0;
}

.vl-sheet-scroll :deep(.csa-viewport) {
  overscroll-behavior-y: none;
}

.vl-sheet-body {
  padding: 14px 14px 24px 14px;
}

.vl-sheet-footer {
  flex-shrink: 0;
  padding: 10px 14px;
  border-top: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  will-change: transform;
  transition: transform 0.36s cubic-bezier(0.26, 0.68, 0.28, 1);
}
</style>
