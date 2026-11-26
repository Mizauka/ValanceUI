<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

/**
 * 2-Slot Native 120Hz Scroll-Transition Pager (for iOS Safari ProMotion) + GPU @keyframes on Desktop.
 *
 * - At rest: renders ONLY the single active page with `overflow: hidden` — NEVER intercepts horizontal
 *   swipes, so parent `VlPushDrawer` 120Hz swipe works from anywhere on the screen.
 * - During a page switch on coarse-pointer touch devices (iOS Safari): temporarily mounts ONLY the
 *   2 adjacent pages `[leaving, entering]` (or `[entering, leaving]`) inside an `overflow-x: auto`
 *   container and calls `scrollTo({ behavior: 'smooth' })` — running directly on iOS Safari's 120Hz
 *   native UIScrollView compositor with ZERO middle-page flash!
 * - Reuses the exact same `:key="pageId"` when shrinking back to 1 slot on `scrollend`, so the
 *   entering page never unmounts or flickers.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Ordered page IDs used to compute forward ('next') vs backward ('prev') direction */
    pages?: string[]
    /** Optional explicit direction override ('next' | 'prev') */
    direction?: 'next' | 'prev'
    ariaLabel?: string
  }>(),
  {
    pages: () => [],
    ariaLabel: '分页视图',
  },
)

const scrollerRef = ref<HTMLElement | null>(null)
const isNativeTouchScroll = ref(false)
const leavingId = ref<string | null>(null)
const activeDirection = ref<'next' | 'prev'>('next')

let settleTimer: ReturnType<typeof setTimeout> | null = null
let coarseMql: MediaQueryList | null = null
let transitionToken = 0

function updatePointerMode() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isNativeTouchScroll.value = false
    return
  }
  isNativeTouchScroll.value = window.matchMedia('(pointer: coarse)').matches
}

function resolveDirection(prev: string, next: string): 'next' | 'prev' {
  if (props.direction) return props.direction
  if (props.pages.length > 0) {
    const fromIdx = props.pages.indexOf(prev)
    const toIdx = props.pages.indexOf(next)
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      return toIdx > fromIdx ? 'next' : 'prev'
    }
  }
  return 'next'
}

const isTransitioning = computed(() => isNativeTouchScroll.value && leavingId.value !== null)

const renderedIds = computed<string[]>(() => {
  if (!isTransitioning.value || !leavingId.value) {
    return [props.modelValue]
  }
  return activeDirection.value === 'next'
    ? [leavingId.value, props.modelValue]
    : [props.modelValue, leavingId.value]
})

const desktopTransitionName = computed(() =>
  activeDirection.value === 'next' ? 'vl-slide-h-next' : 'vl-slide-h-prev',
)

function finishNativeTransition() {
  if (settleTimer !== null) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
  if (leavingId.value === null) return
  leavingId.value = null
  nextTick(() => {
    if (scrollerRef.value) scrollerRef.value.scrollLeft = 0
  })
}

watch(
  () => props.modelValue,
  async (next, prev) => {
    if (!prev || prev === next) return
    const dir = resolveDirection(prev, next)
    activeDirection.value = dir

    if (!isNativeTouchScroll.value) return

    if (settleTimer !== null) {
      clearTimeout(settleTimer)
      settleTimer = null
    }
    const token = ++transitionToken
    leavingId.value = prev
    await nextTick()

    const el = scrollerRef.value
    if (!el || token !== transitionToken) return
    const w = el.clientWidth
    if (w <= 0) {
      finishNativeTransition()
      return
    }

    const startLeft = dir === 'next' ? 0 : w
    const targetLeft = dir === 'next' ? w : 0
    el.scrollLeft = startLeft

    const launch = () => {
      if (token !== transitionToken || !scrollerRef.value) return
      if (typeof scrollerRef.value.scrollTo === 'function') {
        // Runs on iOS Safari's true 120Hz native scroll compositor!
        scrollerRef.value.scrollTo({ left: targetLeft, behavior: 'smooth' })
      } else {
        scrollerRef.value.scrollLeft = targetLeft
      }
      settleTimer = setTimeout(() => {
        if (token === transitionToken) finishNativeTransition()
      }, 480)
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(launch)
    } else {
      launch()
    }
  },
)

onMounted(() => {
  updatePointerMode()
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    coarseMql = window.matchMedia('(pointer: coarse)')
    coarseMql.addEventListener?.('change', updatePointerMode)
  }
})

onBeforeUnmount(() => {
  if (settleTimer !== null) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
  coarseMql?.removeEventListener?.('change', updatePointerMode)
})
</script>

<template>
  <!-- Touch / iOS Safari ProMotion: 2-Slot Temporary Native 120Hz Scroll Transition -->
  <div
    v-if="isNativeTouchScroll"
    ref="scrollerRef"
    class="vl-snap-pager"
    :class="{ 'is-scrolling': isTransitioning }"
    role="region"
    :aria-label="ariaLabel"
    @scrollend="finishNativeTransition"
  >
    <div
      v-for="pageId in renderedIds"
      :key="pageId"
      class="vl-snap-page"
      :aria-hidden="pageId !== modelValue"
    >
      <slot :page-id="pageId" :active="pageId === modelValue" />
    </div>
  </div>

  <!-- Desktop / Fine Pointer: GPU @keyframes Seamless Horizontal Slide -->
  <div v-else class="vl-snap-pager desktop-stage" role="region" :aria-label="ariaLabel">
    <Transition :name="desktopTransitionName">
      <div :key="modelValue" class="vl-snap-page">
        <slot :page-id="modelValue" :active="true" />
      </div>
    </Transition>
  </div>
</template>

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

.vl-snap-pager.is-scrolling {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: none;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  pointer-events: none;
}

.vl-snap-pager.is-scrolling::-webkit-scrollbar {
  display: none;
}

.vl-snap-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
