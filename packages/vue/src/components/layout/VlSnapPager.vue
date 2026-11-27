<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
  type CSSProperties,
} from 'vue'

type SlideDirection = 'next' | 'prev'
type AnimParity = 'a' | 'b'
type PagerTransition = 'slide' | 'fade'

const DRIVER_SLOTS = [0, 1, 2] as const
type DriverSlot = (typeof DRIVER_SLOTS)[number]

let pagerInstanceSeq = 0

/**
 * Safari 26+ native-compositor interruptible pager supporting horizontal slide
 * and subtle-scale crossfade transitions.
 *
 * - Keeps visited / declared pages persistently mounted inside `.is-parked` layers
 *   so tab switches never trigger Frame-0 subtree mounts or heavy repaints.
 * - Uses 3 round-robin hidden scrollers (`scroll-timeline-name` + `timeline-scope`)
 *   on Apple touch WebKit so rapid interruptions switch immediately to an idle
 *   scroller while preserving live mid-flight visual state.
 * - On Desktop & Android, alternates ping-pong GPU `@keyframes` synchronously
 *   with zero frame gap.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Ordered page IDs used both for direction inference and background pre-warming */
    pages?: string[]
    /** Optional explicit direction override ('next' | 'prev') */
    direction?: SlideDirection
    /** Transition style: horizontal slide ('slide') or subtle-scale crossfade ('fade') */
    transition?: PagerTransition
    /** Pre-mount declared pages quietly after initial mount to avoid Frame-0 hitching */
    preload?: boolean
    ariaLabel?: string
  }>(),
  {
    pages: () => [],
    transition: 'slide',
    preload: true,
    ariaLabel: '分页视图',
  },
)

const instanceSeq = ++pagerInstanceSeq
const driverTimelines = DRIVER_SLOTS.map((slot) => `--vl-pager-tl-${instanceSeq}-s${slot}`)

const isAppleTouchWebKit =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

const hasCssScrollTimeline =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()') &&
  CSS.supports('timeline-scope: --vl-t')

const supportsScrollDriver = isAppleTouchWebKit && hasCssScrollTimeline

const trackRef = ref<HTMLElement | null>(null)
const driverEls: (HTMLElement | null)[] = [null, null, null]

const mountedIds = ref<string[]>(props.modelValue ? [props.modelValue] : [])
const pageSlots = ref<Record<string, number>>(props.modelValue ? { [props.modelValue]: 0 } : {})
const fadeLeavingId = ref<string | null>(null)
const isTransitioning = ref(false)
const animParity = ref<AnimParity>('a')
const activeDriverSlot = ref<DriverSlot>(0)
const fromPercent = ref(0)
const toPercent = ref(0)
const kfDurationMs = ref(420)

let transitionToken = 0
let awaitingScrollEndToken = 0
let targetTravel = 0
let settleTimer: ReturnType<typeof setTimeout> | null = null
let preloadTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null

function setDriverRef(slot: DriverSlot, el: Element | ComponentPublicInstance | null) {
  driverEls[slot] = el instanceof HTMLElement ? el : null
}

function ensureMounted(id: string | undefined) {
  if (!id || mountedIds.value.includes(id)) return
  mountedIds.value = [...mountedIds.value, id]
}

function prewarmDeclaredPages() {
  if (!props.preload || props.pages.length === 0) return
  for (const id of props.pages) {
    ensureMounted(id)
  }
}

function clearTransitionTimers() {
  if (settleTimer) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
  if (rafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function resolveDirection(next: string, prev: string): SlideDirection {
  if (props.direction) return props.direction
  const nextIndex = props.pages.indexOf(next)
  const prevIndex = props.pages.indexOf(prev)
  if (nextIndex !== -1 && prevIndex !== -1 && nextIndex !== prevIndex) {
    return nextIndex < prevIndex ? 'prev' : 'next'
  }
  return 'next'
}

function getCurrentTrackPercent(): number {
  const track = trackRef.value
  if (!track || typeof getComputedStyle !== 'function') return 0
  const width = track.clientWidth
  if (width <= 0) return 0
  const transform = getComputedStyle(track).transform
  if (!transform || transform === 'none') return 0
  if (typeof DOMMatrixReadOnly === 'function') {
    const tx = new DOMMatrixReadOnly(transform).m41
    return Number.isFinite(tx) ? (tx / width) * 100 : 0
  }
  const match = transform.match(/^matrix\(([^)]+)\)$/)
  if (match && match[1]) {
    const parts = match[1].split(',')
    const tx = Number.parseFloat(parts[4] ?? '0')
    return Number.isFinite(tx) ? (tx / width) * 100 : 0
  }
  return 0
}

function resetIdleDrivers(keepSlot?: DriverSlot) {
  for (const slot of DRIVER_SLOTS) {
    if (slot === keepSlot) continue
    const el = driverEls[slot]
    if (el && el.scrollLeft !== 0) {
      el.scrollLeft = 0
    }
  }
}

function finishTransition(token: number) {
  if (token !== transitionToken) return
  clearTransitionTimers()
  awaitingScrollEndToken = 0
  targetTravel = 0
  isTransitioning.value = false
  fadeLeavingId.value = null
  fromPercent.value = 0
  toPercent.value = 0
  pageSlots.value = props.modelValue ? { [props.modelValue]: 0 } : {}
  resetIdleDrivers()
}

function onDriverScrollEnd(slot: DriverSlot) {
  if (slot !== activeDriverSlot.value) return
  if (!isTransitioning.value || !supportsScrollDriver) return
  if (awaitingScrollEndToken !== transitionToken) return
  const driver = driverEls[slot]
  if (!driver || driver.scrollLeft <= 4) return
  finishTransition(transitionToken)
}

function onTrackAnimationEnd(event: AnimationEvent) {
  if (!isTransitioning.value || supportsScrollDriver) return
  if (props.transition === 'fade') {
    if (event.animationName.includes(`fade-in-${animParity.value}`)) {
      finishTransition(transitionToken)
    }
    return
  }
  if (event.target !== trackRef.value) return
  if (!event.animationName.includes(`kf-${animParity.value}`) && !event.animationName.includes(`track-${animParity.value}`)) {
    return
  }
  finishTransition(transitionToken)
}

async function launchScrollDriver(token: number, settleMs: number) {
  const nextSlot = ((activeDriverSlot.value + 1) % DRIVER_SLOTS.length) as DriverSlot
  activeDriverSlot.value = nextSlot
  resetIdleDrivers(nextSlot)

  const chosenDriver = driverEls[nextSlot]
  if (!chosenDriver) {
    finishTransition(token)
    return
  }
  if (chosenDriver.scrollLeft !== 0) {
    chosenDriver.scrollLeft = 0
  }

  await nextTick()
  if (token !== transitionToken) return

  const activeDriver = driverEls[nextSlot]
  if (!activeDriver) {
    finishTransition(token)
    return
  }

  targetTravel = Math.max(activeDriver.scrollWidth - activeDriver.clientWidth, 1)

  if (typeof activeDriver.scrollTo === 'function' && typeof requestAnimationFrame === 'function') {
    rafId = requestAnimationFrame(() => {
      rafId = null
      const driverNow = driverEls[nextSlot]
      if (token !== transitionToken || !driverNow) return
      awaitingScrollEndToken = token
      driverNow.scrollTo({
        left: targetTravel,
        behavior: 'smooth',
      })
    })
    settleTimer = setTimeout(() => {
      finishTransition(token)
    }, settleMs)
  } else {
    finishTransition(token)
  }
}

watch(
  () => props.pages,
  () => {
    if (!props.preload) return
    prewarmDeclaredPages()
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  async (next, prev) => {
    ensureMounted(next)
    if (!prev || next === prev) return
    ensureMounted(prev)

    const token = ++transitionToken
    clearTransitionTimers()
    awaitingScrollEndToken = 0

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      finishTransition(token)
      return
    }

    if (props.transition === 'fade') {
      fadeLeavingId.value = prev
      pageSlots.value = { [prev]: 0, [next]: 0 }
      animParity.value = animParity.value === 'a' ? 'b' : 'a'
      isTransitioning.value = true

      if (supportsScrollDriver) {
        await launchScrollDriver(token, 540)
        return
      }

      settleTimer = setTimeout(() => {
        finishTransition(token)
      }, 380)
      return
    }

    fadeLeavingId.value = null
    const dir = resolveDirection(next, prev)
    const curPct = isTransitioning.value ? getCurrentTrackPercent() : 0

    // Keep only pages still visually intersecting the viewport [0%, 100%]
    const nextSlots: Record<string, number> = {}
    if (isTransitioning.value) {
      for (const [id, slot] of Object.entries(pageSlots.value)) {
        const leftEdge = curPct + slot * 100
        const rightEdge = leftEdge + 100
        if (rightEdge > 0.5 && leftEdge < 99.5) {
          nextSlots[id] = slot
        }
      }
    }

    if (Object.keys(nextSlots).length === 0) {
      nextSlots[prev] = 0
    }

    let targetSlot = nextSlots[next]
    if (targetSlot === undefined) {
      const existingValues = Object.values(nextSlots)
      if (dir === 'next') {
        targetSlot = Math.max(...existingValues) + 1
      } else {
        targetSlot = Math.min(...existingValues) - 1
      }
      nextSlots[next] = targetSlot
    }

    const nextToPct = -targetSlot * 100
    pageSlots.value = nextSlots

    if (Math.abs(nextToPct - curPct) < 0.05) {
      finishTransition(token)
      return
    }

    fromPercent.value = curPct
    toPercent.value = nextToPct
    animParity.value = animParity.value === 'a' ? 'b' : 'a'
    isTransitioning.value = true

    if (supportsScrollDriver) {
      await launchScrollDriver(token, 580)
      return
    }

    const travelScreens = Math.abs(nextToPct - curPct) / 100
    const duration = Math.round(Math.min(500, Math.max(240, 420 * Math.pow(travelScreens, 0.45))))
    kfDurationMs.value = duration
    settleTimer = setTimeout(() => {
      finishTransition(token)
    }, duration + 80)
  },
)

function getPageClass(id: string) {
  if (props.transition === 'fade') {
    if (!isTransitioning.value) {
      return id === props.modelValue ? 'is-slot-anchor' : 'is-parked'
    }
    const modePrefix = supportsScrollDriver ? 'is-fade-scroll' : 'is-fade-kf'
    if (id === props.modelValue) {
      return `is-slot-anchor ${modePrefix}-enter-${animParity.value}`
    }
    if (id === fadeLeavingId.value) {
      return `is-slot-overlay is-leaving ${modePrefix}-leave-${animParity.value}`
    }
    return 'is-parked'
  }

  const slot = pageSlots.value[id]
  if (slot === undefined) return 'is-parked'
  if (id === props.modelValue) return 'is-slot-anchor'
  return 'is-slot-overlay is-leaving'
}

function getPageStyle(id: string): CSSProperties | undefined {
  if (props.transition === 'fade') {
    if (!isTransitioning.value || !supportsScrollDriver) return undefined
    if (id !== props.modelValue && id !== fadeLeavingId.value) return undefined
    return {
      animationTimeline: driverTimelines[activeDriverSlot.value]!,
    } as unknown as CSSProperties
  }

  const slot = pageSlots.value[id]
  if (slot === undefined || slot === 0) return undefined
  return {
    transform: `translate3d(${slot * 100}%, 0, 0)`,
  }
}

function isPageHidden(id: string) {
  if (id === props.modelValue) return false
  if (props.transition === 'fade') {
    return !(isTransitioning.value && id === fadeLeavingId.value)
  }
  return pageSlots.value[id] === undefined
}

const rootStyle = computed<CSSProperties>(() =>
  supportsScrollDriver
    ? ({ timelineScope: driverTimelines.join(', ') } as unknown as CSSProperties)
    : {},
)

const trackStyle = computed<CSSProperties>(() => {
  if (!isTransitioning.value || props.transition === 'fade') return {}
  const base: Record<string, string> = {
    '--vl-pager-from': `${fromPercent.value.toFixed(3)}%`,
    '--vl-pager-to': `${toPercent.value.toFixed(3)}%`,
  }
  if (supportsScrollDriver) {
    base.animationTimeline = driverTimelines[activeDriverSlot.value]!
  } else {
    base['--vl-pager-kf-ms'] = `${kfDurationMs.value}ms`
  }
  return base as unknown as CSSProperties
})

const trackClass = computed(() => {
  if (!isTransitioning.value || props.transition === 'fade') return undefined
  return supportsScrollDriver
    ? `is-driving-scroll-${animParity.value}`
    : `is-driving-kf-${animParity.value}`
})

onMounted(() => {
  ensureMounted(props.modelValue)
  if (!pageSlots.value[props.modelValue]) {
    pageSlots.value = { [props.modelValue]: 0 }
  }
  if (props.preload && props.pages.length > 0) {
    preloadTimer = setTimeout(() => {
      preloadTimer = null
      prewarmDeclaredPages()
    }, 150)
  }
})

onBeforeUnmount(() => {
  transitionToken++
  clearTransitionTimers()
  if (preloadTimer) {
    clearTimeout(preloadTimer)
    preloadTimer = null
  }
})
</script>

<template>
  <div class="vl-snap-pager" role="region" :aria-label="ariaLabel" :style="rootStyle">
    <template v-if="supportsScrollDriver">
      <div
        v-for="slot in DRIVER_SLOTS"
        :key="slot"
        :ref="(el) => setDriverRef(slot, el)"
        class="vl-pager-driver"
        aria-hidden="true"
        :style="{ scrollTimelineName: driverTimelines[slot] } as CSSProperties"
        @scrollend="onDriverScrollEnd(slot)"
      >
        <div class="vl-pager-driver-spacer" />
      </div>
    </template>

    <div
      ref="trackRef"
      class="vl-pager-track"
      :class="trackClass"
      :style="trackStyle"
      @animationend="onTrackAnimationEnd"
    >
      <div
        v-for="id in mountedIds"
        :key="id"
        class="vl-snap-page"
        :class="getPageClass(id)"
        :style="getPageStyle(id)"
        :aria-hidden="isPageHidden(id) ? 'true' : undefined"
      >
        <slot :page-id="id" :active="id === modelValue" />
      </div>
    </div>
  </div>
</template>

<style>
@property --vl-pager-from {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

@property --vl-pager-to {
  syntax: '<percentage>';
  inherits: false;
  initial-value: -100%;
}
</style>

<style scoped>
.vl-snap-pager {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.vl-pager-driver {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  overflow-x: auto;
  overflow-y: hidden;
  pointer-events: none;
  opacity: 0.001;
  scrollbar-width: none;
  scroll-timeline-axis: x;
}

.vl-pager-driver::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.vl-pager-driver-spacer {
  width: calc(100% + 220px);
  height: 1px;
}

.vl-pager-track {
  position: relative;
  display: flex;
  flex: 1 1 100%;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.vl-pager-track.is-driving-scroll-a {
  will-change: transform;
  animation-name: vl-pager-track-a;
  animation-duration: 1s;
  animation-fill-mode: both;
  /* Compensates WebKit smooth-scroll ease-in-out envelope to closely track cubic-bezier(0.32, 0.72, 0, 1) */
  animation-timing-function: cubic-bezier(0.12, 0.88, 0.34, 1);
}

.vl-pager-track.is-driving-scroll-b {
  will-change: transform;
  animation-name: vl-pager-track-b;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.12, 0.88, 0.34, 1);
}

.vl-pager-track.is-driving-kf-a {
  will-change: transform;
  animation: vl-pager-track-a var(--vl-pager-kf-ms, 420ms) cubic-bezier(0.32, 0.72, 0, 1) both;
}

.vl-pager-track.is-driving-kf-b {
  will-change: transform;
  animation: vl-pager-track-b var(--vl-pager-kf-ms, 420ms) cubic-bezier(0.32, 0.72, 0, 1) both;
}

.vl-snap-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.vl-snap-page.is-slot-anchor {
  position: relative;
  flex: 0 0 100%;
  z-index: 2;
}

.vl-snap-page.is-slot-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.vl-snap-page.is-leaving {
  pointer-events: none;
}

.vl-snap-page.is-parked {
  position: absolute;
  inset: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 0;
}

.vl-snap-page.is-fade-scroll-enter-a {
  will-change: opacity, transform;
  animation-name: vl-pager-fade-in-a;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
}

.vl-snap-page.is-fade-scroll-enter-b {
  will-change: opacity, transform;
  animation-name: vl-pager-fade-in-b;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
}

.vl-snap-page.is-fade-scroll-leave-a {
  will-change: opacity, transform;
  animation-name: vl-pager-fade-out-a;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
}

.vl-snap-page.is-fade-scroll-leave-b {
  will-change: opacity, transform;
  animation-name: vl-pager-fade-out-b;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
}

.vl-snap-page.is-fade-kf-enter-a {
  will-change: opacity, transform;
  animation: vl-pager-fade-in-a 0.32s linear both;
}

.vl-snap-page.is-fade-kf-enter-b {
  will-change: opacity, transform;
  animation: vl-pager-fade-in-b 0.32s linear both;
}

.vl-snap-page.is-fade-kf-leave-a {
  will-change: opacity, transform;
  animation: vl-pager-fade-out-a 0.32s linear both;
}

.vl-snap-page.is-fade-kf-leave-b {
  will-change: opacity, transform;
  animation: vl-pager-fade-out-b 0.32s linear both;
}

@keyframes vl-pager-track-a {
  from {
    transform: translate3d(var(--vl-pager-from, 0%), 0, 0);
  }
  to {
    transform: translate3d(var(--vl-pager-to, -100%), 0, 0);
  }
}

@keyframes vl-pager-track-b {
  from {
    transform: translate3d(var(--vl-pager-from, 0%), 0, 0);
  }
  to {
    transform: translate3d(var(--vl-pager-to, -100%), 0, 0);
  }
}

@keyframes vl-pager-fade-in-a {
  0%,
  28% {
    opacity: 0;
    transform: scale3d(0.985, 0.985, 1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

@keyframes vl-pager-fade-in-b {
  0%,
  28% {
    opacity: 0;
    transform: scale3d(0.985, 0.985, 1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

@keyframes vl-pager-fade-out-a {
  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  40%,
  100% {
    opacity: 0;
    transform: scale3d(0.992, 0.992, 1);
  }
}

@keyframes vl-pager-fade-out-b {
  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  40%,
  100% {
    opacity: 0;
    transform: scale3d(0.992, 0.992, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vl-pager-track.is-driving-kf-a,
  .vl-pager-track.is-driving-kf-b,
  .vl-snap-page.is-fade-kf-enter-a,
  .vl-snap-page.is-fade-kf-enter-b,
  .vl-snap-page.is-fade-kf-leave-a,
  .vl-snap-page.is-fade-kf-leave-b {
    animation-duration: 0.01ms !important;
  }
}
</style>
