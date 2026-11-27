<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

type SlideDirection = 'next' | 'prev'
type AnimParity = 'a' | 'b'
type PagerTransition = 'slide' | 'fade'

/**
 * Interruptible GPU pager supporting horizontal slide and subtle-scale crossfade transitions.
 *
 * - Keeps visited / declared pages persistently mounted inside `.is-parked` layers
 *   so tab switches never trigger Frame-0 subtree mounts or heavy repaints.
 * - Alternates ping-pong GPU `@keyframes` synchronously and reads live transform
 *   position on interruption with zero frame gap.
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
  },
)

const trackRef = ref<HTMLElement | null>(null)

const mountedIds = ref<string[]>(props.modelValue ? [props.modelValue] : [])
const pageSlots = ref<Record<string, number>>(props.modelValue ? { [props.modelValue]: 0 } : {})
const fadeLeavingId = ref<string | null>(null)
const isTransitioning = ref(false)
const animParity = ref<AnimParity>('a')
const fromPercent = ref(0)
const toPercent = ref(0)
const kfDurationMs = ref(420)

let transitionToken = 0
let settleTimer: ReturnType<typeof setTimeout> | null = null
let preloadTimer: ReturnType<typeof setTimeout> | null = null

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

function finishTransition(token: number) {
  if (token !== transitionToken) return
  clearTransitionTimers()
  isTransitioning.value = false
  fadeLeavingId.value = null
  fromPercent.value = 0
  toPercent.value = 0
  pageSlots.value = props.modelValue ? { [props.modelValue]: 0 } : {}
}

function onTrackAnimationEnd(event: AnimationEvent) {
  if (!isTransitioning.value) return
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
  (next, prev) => {
    ensureMounted(next)
    if (!prev || next === prev) return
    ensureMounted(prev)

    const token = ++transitionToken
    clearTransitionTimers()

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

      settleTimer = setTimeout(() => {
        finishTransition(token)
      }, 440)
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
    if (id === props.modelValue) {
      return `is-slot-anchor is-fade-kf-enter-${animParity.value}`
    }
    if (id === fadeLeavingId.value) {
      return `is-slot-overlay is-leaving is-fade-kf-leave-${animParity.value}`
    }
    return 'is-parked'
  }

  const slot = pageSlots.value[id]
  if (slot === undefined) return 'is-parked'
  if (id === props.modelValue) return 'is-slot-anchor'
  return 'is-slot-overlay is-leaving'
}

function getPageStyle(id: string): CSSProperties | undefined {
  if (props.transition === 'fade') return undefined
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

const trackStyle = computed<CSSProperties>(() => {
  if (!isTransitioning.value || props.transition === 'fade') return {}
  return {
    '--vl-pager-from': `${fromPercent.value.toFixed(3)}%`,
    '--vl-pager-to': `${toPercent.value.toFixed(3)}%`,
    '--vl-pager-kf-ms': `${kfDurationMs.value}ms`,
  } as unknown as CSSProperties
})

const trackClass = computed(() => {
  if (!isTransitioning.value || props.transition === 'fade') return undefined
  return `is-driving-kf-${animParity.value}`
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
  <div class="vl-snap-pager" role="region" :aria-label="ariaLabel ?? messages.snapPager.ariaLabel">
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

.vl-pager-track {
  position: relative;
  display: flex;
  flex: 1 1 100%;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
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

.vl-snap-page.is-fade-kf-enter-a {
  will-change: opacity, transform;
  animation: vl-pager-fade-in-a 0.38s linear both;
}

.vl-snap-page.is-fade-kf-enter-b {
  will-change: opacity, transform;
  animation: vl-pager-fade-in-b 0.38s linear both;
}

.vl-snap-page.is-fade-kf-leave-a {
  will-change: opacity, transform;
  animation: vl-pager-fade-out-a 0.38s linear both;
}

.vl-snap-page.is-fade-kf-leave-b {
  will-change: opacity, transform;
  animation: vl-pager-fade-out-b 0.38s linear both;
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
  30% {
    opacity: 0;
    transform: scale3d(0.994, 0.994, 1);
    animation-timing-function: cubic-bezier(0.28, 0.12, 0.22, 1);
  }
  100% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

@keyframes vl-pager-fade-in-b {
  0%,
  30% {
    opacity: 0;
    transform: scale3d(0.994, 0.994, 1);
    animation-timing-function: cubic-bezier(0.28, 0.12, 0.22, 1);
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
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  42%,
  100% {
    opacity: 0;
    transform: scale3d(0.997, 0.997, 1);
  }
}

@keyframes vl-pager-fade-out-b {
  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  42%,
  100% {
    opacity: 0;
    transform: scale3d(0.997, 0.997, 1);
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
