<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue'

type SlideDirection = 'next' | 'prev'
type DrivingMode = 'scroll-next' | 'scroll-prev' | 'kf-next' | 'kf-prev' | null

let pagerInstanceSeq = 0

/**
 * Safari 26+ native-compositor horizontal pager.
 *
 * - Keeps visited / declared pages persistently mounted inside `.is-parked` layers
 *   so tab switches never trigger Frame-0 subtree mounts or heavy repaints.
 * - On touch devices supporting CSS Scroll-Driven Animations (`scroll-timeline-name`
 *   + `timeline-scope`), drives `.vl-pager-track` from an invisible native scroller
 *   (`UIScrollView` -> 120Hz ProMotion CoreAnimation thread) with `pointer-events: none`
 *   so parent `VlPushDrawer` horizontal swipe works everywhere.
 * - Falls back cleanly to pure GPU `@keyframes` (`0.42s cubic-bezier(0.32, 0.72, 0, 1)`)
 *   on desktop pointers and engines without CSS `scroll-timeline` support.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Ordered page IDs used both for direction inference and background pre-warming */
    pages?: string[]
    /** Optional explicit direction override ('next' | 'prev') */
    direction?: SlideDirection
    /** Pre-mount declared pages quietly after initial mount to avoid Frame-0 hitching */
    preload?: boolean
    ariaLabel?: string
  }>(),
  {
    pages: () => [],
    preload: true,
    ariaLabel: '分页视图',
  },
)

const timelineName = `--vl-pager-tl-${++pagerInstanceSeq}`

const isCoarsePointer =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches

const hasCssScrollTimeline =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()') &&
  CSS.supports('timeline-scope: --vl-t')

const supportsScrollDriver = isCoarsePointer && hasCssScrollTimeline

const driverRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const mountedIds = ref<string[]>(props.modelValue ? [props.modelValue] : [])
const leavingId = ref<string | null>(null)
const activeDirection = ref<SlideDirection>('next')
const drivingMode = ref<DrivingMode>(null)

let transitionToken = 0
let awaitingScrollEndToken = 0
let targetTravel = 0
let settleTimer: ReturnType<typeof setTimeout> | null = null
let preloadTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null

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

function finishTransition(token: number) {
  if (token !== transitionToken) return
  clearTransitionTimers()
  awaitingScrollEndToken = 0
  targetTravel = 0
  drivingMode.value = null
  leavingId.value = null
  if (driverRef.value) {
    driverRef.value.scrollLeft = 0
  }
}

function onDriverScrollEnd() {
  const driver = driverRef.value
  if (!driver) return
  if (drivingMode.value !== 'scroll-next' && drivingMode.value !== 'scroll-prev') return
  if (awaitingScrollEndToken !== transitionToken) return
  if (driver.scrollLeft <= 4) return
  finishTransition(transitionToken)
}

function onTrackAnimationEnd(event: AnimationEvent) {
  if (event.target !== trackRef.value) return
  if (drivingMode.value !== 'kf-next' && drivingMode.value !== 'kf-prev') return
  finishTransition(transitionToken)
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
      drivingMode.value = null
      leavingId.value = null
      if (driverRef.value) driverRef.value.scrollLeft = 0
      return
    }

    const dir = resolveDirection(next, prev)
    const wasDriving = drivingMode.value !== null
    activeDirection.value = dir
    leavingId.value = prev

    if (supportsScrollDriver && driverRef.value) {
      const driver = driverRef.value
      const nextMode: DrivingMode = dir === 'prev' ? 'scroll-prev' : 'scroll-next'

      if (wasDriving) {
        drivingMode.value = null
      }
      driver.scrollLeft = 0

      if (wasDriving) {
        await nextTick()
        if (token !== transitionToken) return
        void trackRef.value?.offsetWidth
      }

      drivingMode.value = nextMode
      await nextTick()
      if (token !== transitionToken) return

      const currentDriver = driverRef.value
      if (!currentDriver) {
        finishTransition(token)
        return
      }

      targetTravel = Math.max(currentDriver.scrollWidth - currentDriver.clientWidth, 1)

      if (typeof currentDriver.scrollTo === 'function' && typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(() => {
          rafId = null
          if (token !== transitionToken || !driverRef.value) return
          awaitingScrollEndToken = token
          driverRef.value.scrollTo({
            left: targetTravel,
            behavior: 'smooth',
          })
        })
        settleTimer = setTimeout(() => {
          finishTransition(token)
        }, 580)
      } else {
        finishTransition(token)
      }
      return
    }

    const kfMode: DrivingMode = dir === 'prev' ? 'kf-prev' : 'kf-next'
    if (wasDriving) {
      drivingMode.value = null
      await nextTick()
      if (token !== transitionToken) return
      void trackRef.value?.offsetWidth
    }

    drivingMode.value = kfMode
    settleTimer = setTimeout(() => {
      finishTransition(token)
    }, 480)
  },
)

function getPageClass(id: string) {
  const isActive = id === props.modelValue
  const isLeaving = id === leavingId.value

  if (!drivingMode.value || !leavingId.value) {
    return isActive ? 'is-slot-0' : 'is-parked'
  }

  if (activeDirection.value === 'next') {
    if (isLeaving) return 'is-slot-0 is-leaving'
    if (isActive) return 'is-slot-1'
    return 'is-parked'
  }

  // activeDirection === 'prev'
  if (isActive) return 'is-slot-0'
  if (isLeaving) return 'is-slot-1 is-leaving'
  return 'is-parked'
}

function isPageHidden(id: string) {
  if (id === props.modelValue) return false
  if (drivingMode.value && id === leavingId.value) return false
  return true
}

const rootStyle = computed<CSSProperties>(() =>
  supportsScrollDriver
    ? ({ timelineScope: timelineName } as unknown as CSSProperties)
    : {},
)

const driverStyle = computed<CSSProperties>(() =>
  supportsScrollDriver
    ? ({ scrollTimelineName: timelineName } as unknown as CSSProperties)
    : {},
)

const trackStyle = computed<CSSProperties>(() =>
  drivingMode.value === 'scroll-next' || drivingMode.value === 'scroll-prev'
    ? ({ animationTimeline: timelineName } as unknown as CSSProperties)
    : {},
)

const trackClass = computed(() =>
  drivingMode.value ? `is-driving-${drivingMode.value}` : undefined,
)

onMounted(() => {
  ensureMounted(props.modelValue)
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
    <div
      v-if="supportsScrollDriver"
      ref="driverRef"
      class="vl-pager-driver"
      aria-hidden="true"
      :style="driverStyle"
      @scrollend="onDriverScrollEnd"
    >
      <div class="vl-pager-driver-spacer" />
    </div>

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
        :aria-hidden="isPageHidden(id) ? 'true' : undefined"
      >
        <slot :page-id="id" :active="id === modelValue" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vl-snap-pager {
  position: relative;
  width: 100%;
  height: 100%;
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
  width: calc(100% + 360px);
  height: 1px;
}

.vl-pager-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.vl-pager-track.is-driving-scroll-next {
  will-change: transform;
  animation-name: vl-pager-track-next;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
}

.vl-pager-track.is-driving-scroll-prev {
  will-change: transform;
  animation-name: vl-pager-track-prev;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-timing-function: linear;
}

.vl-pager-track.is-driving-kf-next {
  will-change: transform;
  animation: vl-pager-track-next-ease 0.42s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.vl-pager-track.is-driving-kf-prev {
  will-change: transform;
  animation: vl-pager-track-prev-ease 0.42s cubic-bezier(0.32, 0.72, 0, 1) both;
}

.vl-snap-page {
  width: 100%;
  height: 100%;
}

.vl-snap-page.is-slot-0 {
  position: relative;
  z-index: 2;
}

.vl-snap-page.is-slot-1 {
  position: absolute;
  inset: 0;
  transform: translate3d(100%, 0, 0);
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

@keyframes vl-pager-track-next {
  0% {
    transform: translate3d(0, 0, 0);
    animation-timing-function: cubic-bezier(0.22, 0.85, 0.2, 1);
  }
  100% {
    transform: translate3d(-100%, 0, 0);
  }
}

@keyframes vl-pager-track-prev {
  0% {
    transform: translate3d(-100%, 0, 0);
    animation-timing-function: cubic-bezier(0.22, 0.85, 0.2, 1);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes vl-pager-track-next-ease {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-100%, 0, 0);
  }
}

@keyframes vl-pager-track-prev-ease {
  from {
    transform: translate3d(-100%, 0, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vl-pager-track.is-driving-kf-next,
  .vl-pager-track.is-driving-kf-prev {
    animation-duration: 0.01ms !important;
  }
}
</style>
