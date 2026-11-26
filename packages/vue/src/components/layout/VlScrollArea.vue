<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    orientation?: 'vertical' | 'horizontal'
    wheelHorizontal?: boolean
  }>(),
  {
    orientation: 'vertical',
    wheelHorizontal: false,
  },
)

const emit = defineEmits<{
  (e: 'scroll', el: HTMLElement): void
  (e: 'metrics-change', el: HTMLElement): void
}>()

const viewportRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
const thumbSize = ref(0)
const thumbOffset = ref(0)
const isHoverTrack = ref(false)
const isDragging = ref(false)

let dragStartCoord = 0
let dragStartScroll = 0
let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null
let observedChild: Element | null = null

const MIN_THUMB = 36

function observeFirstChild() {
  const el = viewportRef.value
  if (!el || !resizeObserver) return
  const nextChild = el.firstElementChild
  if (nextChild === observedChild) return
  if (observedChild) {
    resizeObserver.unobserve(observedChild)
  }
  observedChild = nextChild
  if (observedChild) {
    resizeObserver.observe(observedChild)
  }
}

function syncMetrics() {
  const el = viewportRef.value
  if (!el) return

  if (props.orientation === 'vertical') {
    const client = el.clientHeight
    const scroll = el.scrollHeight
    if (scroll <= client + 1) {
      hasOverflow.value = false
      thumbSize.value = 0
      thumbOffset.value = 0
      emit('metrics-change', el)
      return
    }
    hasOverflow.value = true
    const ratio = client / scroll
    const size = Math.min(client, Math.max(MIN_THUMB, Math.round(client * ratio)))
    const maxScroll = scroll - client
    const maxOffset = Math.max(0, client - size)
    thumbSize.value = size
    thumbOffset.value = maxScroll > 0 ? Math.round((el.scrollTop / maxScroll) * maxOffset) : 0
  } else {
    const client = el.clientWidth
    const scroll = el.scrollWidth
    if (scroll <= client + 1) {
      hasOverflow.value = false
      thumbSize.value = 0
      thumbOffset.value = 0
      emit('metrics-change', el)
      return
    }
    hasOverflow.value = true
    const ratio = client / scroll
    const size = Math.min(client, Math.max(MIN_THUMB, Math.round(client * ratio)))
    const maxScroll = scroll - client
    const maxOffset = Math.max(0, client - size)
    thumbSize.value = size
    thumbOffset.value = maxScroll > 0 ? Math.round((el.scrollLeft / maxScroll) * maxOffset) : 0
  }

  emit('metrics-change', el)
}

function handleScroll() {
  syncMetrics()
  if (viewportRef.value) {
    emit('scroll', viewportRef.value)
  }
}

function handleWheel(e: WheelEvent) {
  if (props.orientation === 'horizontal' && props.wheelHorizontal && viewportRef.value) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      viewportRef.value.scrollLeft += e.deltaY
      syncMetrics()
    }
  }
}

function onTrackPointerEnter(e: PointerEvent) {
  if (e.pointerType === 'touch') return
  isHoverTrack.value = true
}

function onTrackPointerLeave() {
  isHoverTrack.value = false
}

function onThumbPointerDown(e: PointerEvent) {
  if (e.button !== 0 || !viewportRef.value || typeof window === 'undefined') return
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  dragStartCoord = props.orientation === 'vertical' ? e.clientY : e.clientX
  dragStartScroll =
    props.orientation === 'vertical'
      ? viewportRef.value.scrollTop
      : viewportRef.value.scrollLeft
  if (typeof document !== 'undefined') {
    document.body.style.userSelect = 'none'
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !viewportRef.value) return
  const el = viewportRef.value
  const delta = (props.orientation === 'vertical' ? e.clientY : e.clientX) - dragStartCoord
  if (props.orientation === 'vertical') {
    const maxScroll = el.scrollHeight - el.clientHeight
    const maxOffset = el.clientHeight - thumbSize.value
    if (maxOffset > 0) {
      el.scrollTop = dragStartScroll + (delta / maxOffset) * maxScroll
    }
  } else {
    const maxScroll = el.scrollWidth - el.clientWidth
    const maxOffset = el.clientWidth - thumbSize.value
    if (maxOffset > 0) {
      el.scrollLeft = dragStartScroll + (delta / maxOffset) * maxScroll
    }
  }
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  if (typeof document !== 'undefined') {
    document.body.style.userSelect = ''
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }
}

function onTrackClick(e: MouseEvent) {
  const el = viewportRef.value
  if (!el || !hasOverflow.value) return
  const track = e.currentTarget as HTMLElement
  const rect = track.getBoundingClientRect()
  if (props.orientation === 'vertical') {
    const clickY = e.clientY - rect.top
    const ratio = Math.max(
      0,
      Math.min(1, (clickY - thumbSize.value / 2) / Math.max(1, rect.height - thumbSize.value)),
    )
    el.scrollTo({ top: ratio * (el.scrollHeight - el.clientHeight), behavior: 'smooth' })
  } else {
    const clickX = e.clientX - rect.left
    const ratio = Math.max(
      0,
      Math.min(1, (clickX - thumbSize.value / 2) / Math.max(1, rect.width - thumbSize.value)),
    )
    el.scrollTo({ left: ratio * (el.scrollWidth - el.clientWidth), behavior: 'smooth' })
  }
}

onMounted(() => {
  const el = viewportRef.value
  if (!el) return
  syncMetrics()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      syncMetrics()
    })
    resizeObserver.observe(el)
    observeFirstChild()
  }

  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      observeFirstChild()
      nextTick(syncMetrics)
    })
    mutationObserver.observe(el, { childList: true, subtree: true })
  }
})

onBeforeUnmount(() => {
  onPointerUp()
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})

defineExpose({
  getViewport: () => viewportRef.value,
  syncMetrics,
})
</script>

<template>
  <div class="vl-csa-root" :class="`csa-${orientation}`">
    <div
      ref="viewportRef"
      class="vl-csa-viewport"
      :class="`csa-vp-${orientation}`"
      @scroll="handleScroll"
      @wheel="handleWheel"
    >
      <slot />
    </div>

    <div
      v-if="hasOverflow"
      class="vl-csa-track"
      :class="[`csa-track-${orientation}`, { active: isHoverTrack || isDragging }]"
      @pointerenter="onTrackPointerEnter"
      @pointerleave="onTrackPointerLeave"
      @click.self="onTrackClick"
    >
      <div
        class="vl-csa-thumb"
        :class="`csa-thumb-${orientation}`"
        :style="
          orientation === 'vertical'
            ? { height: `${thumbSize}px`, transform: `translateY(${thumbOffset}px)` }
            : { width: `${thumbSize}px`, transform: `translateX(${thumbOffset}px)` }
        "
        @pointerdown="onThumbPointerDown"
      >
        <span
          class="vl-csa-thumb-bar"
          :class="[`csa-bar-${orientation}`, { active: isHoverTrack || isDragging }]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vl-csa-root {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.vl-csa-root.csa-horizontal {
  flex-direction: row;
  height: 100%;
}

.vl-csa-viewport {
  flex: 1;
  min-height: 0;
  min-width: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.vl-csa-viewport::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.csa-vp-vertical {
  overflow-y: auto;
  overflow-x: hidden;
}

.csa-vp-horizontal {
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  align-items: stretch;
}

.vl-csa-track {
  position: absolute;
  z-index: 20;
  background-color: transparent;
}

.csa-track-vertical {
  top: 0;
  right: 0;
  bottom: 0;
  width: 12px;
}

.csa-track-horizontal {
  left: 0;
  right: 0;
  bottom: 0;
  height: 10px;
}

.vl-csa-thumb {
  position: absolute;
  cursor: pointer;
  touch-action: none;
}

.csa-thumb-vertical {
  top: 0;
  right: 0;
  width: 12px;
}

.csa-thumb-horizontal {
  left: 0;
  bottom: 0;
  height: 10px;
}

.vl-csa-thumb-bar {
  position: absolute;
  display: block;
  background-color: var(--scrollbar-thumb);
  pointer-events: none;
  transition:
    top 0.24s var(--ease-nonlinear),
    bottom 0.24s var(--ease-nonlinear),
    left 0.24s var(--ease-nonlinear),
    right 0.24s var(--ease-nonlinear),
    width 0.24s var(--ease-nonlinear),
    height 0.24s var(--ease-nonlinear),
    border-radius 0.24s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear);
}

.csa-bar-vertical {
  top: 4px;
  bottom: 4px;
  right: 3px;
  width: 4px;
  border-radius: 2px;
}

.csa-bar-vertical.active {
  top: 0px;
  bottom: 0px;
  right: 0px;
  width: 10px;
  border-radius: 0px;
  background-color: var(--accent-primary);
}

.csa-bar-horizontal {
  left: 4px;
  right: 4px;
  bottom: 2px;
  height: 3px;
  border-radius: 1.5px;
}

.csa-bar-horizontal.active {
  left: 0px;
  right: 0px;
  bottom: 0px;
  height: 7px;
  border-radius: 0px;
  background-color: var(--accent-primary);
}
</style>
