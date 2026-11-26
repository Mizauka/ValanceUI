<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePushDrawerGesture } from '../../composables/usePushDrawerGesture'
import { useBackHandler } from '../../composables/useBackNavigation'

const props = withDefaults(
  defineProps<{
    open: boolean
    drawerWidth?: number
    contained?: boolean
    disabled?: boolean
    ignoreSelector?: string
    scrimOpacity?: number
    ariaLabel?: string
  }>(),
  {
    contained: false,
    disabled: false,
    scrimOpacity: 0.28,
    ariaLabel: '左侧推挤抽屉',
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'drag-state', state: { progress: number; isDragging: boolean; velocity: number }): void
}>()

const shellRef = ref<HTMLElement | null>(null)
const scrollerRef = ref<HTMLElement | null>(null)
const measuredHostWidth = ref(390)
const isNativeTouchScroll = ref(false)
const nativeProgress = ref(props.open ? 1 : 0)
const nativeScrolling = ref(false)

let resizeObserver: ResizeObserver | null = null
let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null
let programmaticScrollTarget: boolean | null = null
let coarseMql: MediaQueryList | null = null
let boundaryTouchStartX = 0
let boundaryTouchStartY = 0
let boundaryBlockOverscroll = false

function onNativeTouchStart(e: TouchEvent) {
  if (!isNativeTouchScroll.value || e.touches.length !== 1) return
  const t = e.touches[0]!
  boundaryTouchStartX = t.clientX
  boundaryTouchStartY = t.clientY
  boundaryBlockOverscroll = false
}

function onNativeTouchMove(e: TouchEvent) {
  const scroller = scrollerRef.value
  if (!isNativeTouchScroll.value || !scroller || e.touches.length !== 1) return
  const t = e.touches[0]!
  const dx = t.clientX - boundaryTouchStartX
  const dy = t.clientY - boundaryTouchStartY
  if (Math.abs(dx) <= Math.abs(dy)) return

  const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  const atClosedEdge = scroller.scrollLeft >= maxLeft - 1
  const atOpenEdge = scroller.scrollLeft <= 1

  // Block reverse-direction overscroll rubber-band at closed/open boundaries
  // while keeping valid open/close swipes 100% native 120Hz Safari scroll-snap!
  if ((atClosedEdge && dx < 0) || (atOpenEdge && dx > 0)) {
    boundaryBlockOverscroll = true
    if (e.cancelable) e.preventDefault()
  } else if (boundaryBlockOverscroll && e.cancelable) {
    e.preventDefault()
  }
}

function updatePointerMode() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isNativeTouchScroll.value = false
    return
  }
  // Use native compositor scroll-snap on coarse-pointer (touch/iOS ProMotion) devices for true 120Hz drag
  isNativeTouchScroll.value = window.matchMedia('(pointer: coarse)').matches
}

function measureWidth() {
  if (props.contained && shellRef.value && shellRef.value.clientWidth > 0) {
    measuredHostWidth.value = shellRef.value.clientWidth
  } else if (typeof window !== 'undefined') {
    measuredHostWidth.value = window.innerWidth
  }
}

const resolvedDrawerWidth = computed(() => {
  if (typeof props.drawerWidth === 'number' && props.drawerWidth > 0) {
    return props.drawerWidth
  }
  if (props.contained) {
    return Math.min(340, Math.max(248, Math.round(measuredHostWidth.value * 0.84)))
  }
  return Math.min(400, Math.max(276, Math.round(measuredHostWidth.value * 0.86)))
})

const isOpenRef = computed(() => props.open)
const enabledRef = computed(() => !props.disabled && !isNativeTouchScroll.value)

useBackHandler(
  computed(() => props.open && !props.contained && !props.disabled),
  () => {
    emit('update:open', false)
    return true
  },
  150,
)

const {
  progress: gestureProgress,
  isDragging: gestureDragging,
  velocity,
  onPointerDown,
  onClickCapture,
} = usePushDrawerGesture({
  isOpen: isOpenRef,
  setOpen: (val) => emit('update:open', val),
  drawerWidth: resolvedDrawerWidth,
  enabled: enabledRef,
  ignoreSelector: props.ignoreSelector,
})

const progress = computed(() => (isNativeTouchScroll.value ? nativeProgress.value : gestureProgress.value))
const isDragging = computed(() => (isNativeTouchScroll.value ? nativeScrolling.value : gestureDragging.value))

watch(
  [progress, isDragging, velocity],
  ([p, d, v]) => {
    emit('drag-state', { progress: p, isDragging: d, velocity: v })
  },
  { immediate: true },
)

function syncNativeScrollPosition(instant: boolean) {
  const scroller = scrollerRef.value
  if (!scroller || !isNativeTouchScroll.value) return
  const targetLeft = props.open ? 0 : resolvedDrawerWidth.value
  nativeProgress.value = props.open ? 1 : 0
  if (instant) {
    programmaticScrollTarget = null
    scroller.scrollLeft = targetLeft
    return
  }
  if (Math.abs(scroller.scrollLeft - targetLeft) < 1) return
  programmaticScrollTarget = props.open
  if (typeof scroller.scrollTo === 'function') {
    scroller.scrollTo({ left: targetLeft, behavior: 'smooth' })
  } else {
    scroller.scrollLeft = targetLeft
  }
}

function finalizeNativeScroll() {
  if (scrollSettleTimer !== null) {
    clearTimeout(scrollSettleTimer)
    scrollSettleTimer = null
  }
  nativeScrolling.value = false
  const scroller = scrollerRef.value
  if (!scroller || !isNativeTouchScroll.value) return
  const w = Math.max(1, resolvedDrawerWidth.value)
  const p = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / w))
  nativeProgress.value = p
  const settledOpen = p >= 0.5
  if (programmaticScrollTarget !== null) {
    programmaticScrollTarget = null
    return
  }
  if (settledOpen !== props.open) {
    emit('update:open', settledOpen)
  }
}

function onNativeScroll() {
  const scroller = scrollerRef.value
  if (!scroller || !isNativeTouchScroll.value) return
  const w = Math.max(1, resolvedDrawerWidth.value)
  nativeProgress.value = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / w))
  nativeScrolling.value = true
  if (scrollSettleTimer !== null) clearTimeout(scrollSettleTimer)
  scrollSettleTimer = setTimeout(finalizeNativeScroll, 140)
}

watch(
  () => props.open,
  () => {
    if (isNativeTouchScroll.value) {
      syncNativeScrollPosition(false)
    }
  },
)

watch([resolvedDrawerWidth, isNativeTouchScroll], () => {
  if (isNativeTouchScroll.value) {
    syncNativeScrollPosition(true)
  }
})

const drawerTransformStyle = computed(() => {
  if (isNativeTouchScroll.value) {
    return {
      width: `${resolvedDrawerWidth.value}px`,
    }
  }
  const offset = ((progress.value - 1) * resolvedDrawerWidth.value).toFixed(2)
  return {
    width: `${resolvedDrawerWidth.value}px`,
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

const pushedMainTransformStyle = computed(() => {
  if (isNativeTouchScroll.value) {
    return undefined
  }
  const offset = (progress.value * resolvedDrawerWidth.value).toFixed(2)
  return {
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open && !props.disabled) {
    emit('update:open', false)
  }
}

onMounted(() => {
  updatePointerMode()
  measureWidth()
  if (isNativeTouchScroll.value) {
    nextTick(() => syncNativeScrollPosition(true))
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', measureWidth, { passive: true })
    window.addEventListener('keydown', onKeydown)
    if (typeof window.matchMedia === 'function') {
      coarseMql = window.matchMedia('(pointer: coarse)')
      coarseMql.addEventListener?.('change', updatePointerMode)
    }
  }
  if (typeof ResizeObserver !== 'undefined' && shellRef.value) {
    resizeObserver = new ResizeObserver(measureWidth)
    resizeObserver.observe(shellRef.value)
  }
})

onBeforeUnmount(() => {
  if (scrollSettleTimer !== null) {
    clearTimeout(scrollSettleTimer)
    scrollSettleTimer = null
  }
  resizeObserver?.disconnect()
  coarseMql?.removeEventListener?.('change', updatePointerMode)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', measureWidth)
    window.removeEventListener('keydown', onKeydown)
  }
})

defineExpose({
  progress,
  isDragging,
  drawerWidth: resolvedDrawerWidth,
})
</script>

<template>
  <div
    ref="shellRef"
    class="vl-push-shell shape-rect"
    :class="{ contained, 'native-scroll': isNativeTouchScroll }"
    @pointerdown="!isNativeTouchScroll && onPointerDown($event)"
    @click.capture="!isNativeTouchScroll && onClickCapture($event)"
  >
    <div
      ref="scrollerRef"
      class="vl-push-scroller"
      :class="{ 'native-scroll': isNativeTouchScroll, 'is-disabled': disabled }"
      @touchstart.passive="onNativeTouchStart"
      @touchmove="onNativeTouchMove"
      @scroll.passive="onNativeScroll"
      @scrollend="finalizeNativeScroll"
    >
      <aside
        class="vl-push-drawer shape-rect"
        :class="{ dragging: isDragging, contained, 'native-scroll': isNativeTouchScroll }"
        :style="drawerTransformStyle"
        :aria-hidden="!open && !isDragging"
        :aria-label="ariaLabel"
      >
        <slot name="drawer" />
      </aside>

      <div
        class="vl-push-stage shape-rect"
        :class="{ dragging: isDragging, 'native-scroll': isNativeTouchScroll }"
        :style="pushedMainTransformStyle"
      >
        <slot />

        <div
          class="vl-drawer-scrim"
          :class="{ active: progress > 0.02, dragging: isDragging }"
          :style="{ opacity: progress * scrimOpacity }"
          @click="emit('update:open', false)"
        />
      </div>
    </div>

    <slot name="overlay" />
  </div>
</template>

<style scoped>
.vl-push-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--bg-base);
  touch-action: pan-y;
}

.vl-push-shell.contained {
  width: 100%;
  height: 100%;
  --vl-safe-top: 0px;
  --vl-safe-bottom: 0px;
  --vl-safe-left: 0px;
  --vl-safe-right: 0px;
}

.vl-push-shell.native-scroll {
  touch-action: pan-x pan-y;
}

.vl-push-scroller {
  position: relative;
  width: 100%;
  height: 100%;
}

.vl-push-scroller.native-scroll {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: none;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.vl-push-scroller.native-scroll::-webkit-scrollbar {
  display: none;
}

.vl-push-scroller.native-scroll.is-disabled {
  overflow-x: hidden;
}

.vl-push-drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  background-color: var(--bg-surface);
  border-right: 1px solid var(--divider-hairline);
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transition: transform 0.36s var(--ease-standard);
}

.vl-push-drawer.native-scroll {
  position: relative;
  top: auto;
  left: auto;
  bottom: auto;
  height: 100%;
  flex: 0 0 auto;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  will-change: auto;
  transition: none;
}

.vl-push-drawer.dragging {
  transition: none;
}

.vl-push-drawer:not(.contained) > :not(.vl-activity-bar) {
  padding-top: var(--vl-safe-top, env(safe-area-inset-top, 0px));
}

.vl-push-stage {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  overflow: hidden;
  transition: transform 0.36s var(--ease-standard);
}

.vl-push-stage.native-scroll {
  flex: 0 0 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  will-change: auto;
  transition: none;
}

.vl-push-stage.dragging {
  transition: none;
}

.vl-drawer-scrim {
  position: absolute;
  inset: 0;
  background-color: #000000;
  opacity: 0;
  pointer-events: none;
  z-index: 50;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transition: opacity 0.32s var(--ease-standard);
}

.vl-drawer-scrim.dragging {
  transition: none;
}

.vl-drawer-scrim.active {
  pointer-events: auto;
}
</style>
