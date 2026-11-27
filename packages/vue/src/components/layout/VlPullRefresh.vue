<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlShape from '../primitives/VlShape.vue'
import type { M3ShapeName } from '../../styles/m3Shapes'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const PULL_STAGE_SHAPES: M3ShapeName[] = ['circle', 'cookie-4', 'clover-4', 'sunny', 'flower']

const props = withDefaults(
  defineProps<{
    refreshing?: boolean
    threshold?: number
    maxPull?: number
    tone?: 'primary' | 'secondary'
    pullLabel?: string
    releaseLabel?: string
    refreshingLabel?: string
    disabled?: boolean
  }>(),
  {
    refreshing: false,
    threshold: 72,
    maxPull: 118,
    tone: 'primary',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const bodyRef = ref<HTMLElement | null>(null)
const pulling = ref(false)
const pullDistance = ref(0)

let startX = 0
let startY = 0
let activePointer = -1
let touchTracking = false
let touchLockedVertical = false

const pullProgress = computed(() => {
  if (props.refreshing) return 1
  return Math.max(0, Math.min(1, pullDistance.value / Math.max(1, props.threshold)))
})

const currentHeaderHeight = computed(() => {
  if (props.refreshing) return 54
  return Math.round(pullDistance.value)
})

const readyToRelease = computed(() => !props.refreshing && pullDistance.value >= props.threshold)

const statusText = computed(() => {
  if (props.refreshing) return props.refreshingLabel ?? messages.value.pullRefresh.refreshingLabel
  if (readyToRelease.value) return props.releaseLabel ?? messages.value.pullRefresh.releaseLabel
  return props.pullLabel ?? messages.value.pullRefresh.pullLabel
})

const pullMorphPair = computed<{ from: M3ShapeName; to: M3ShapeName; t: number }>(() => {
  const scaled = pullProgress.value * (PULL_STAGE_SHAPES.length - 1)
  const idx = Math.min(PULL_STAGE_SHAPES.length - 2, Math.floor(scaled))
  return {
    from: PULL_STAGE_SHAPES[idx] ?? 'circle',
    to: PULL_STAGE_SHAPES[idx + 1] ?? 'flower',
    t: Math.max(0, Math.min(1, scaled - idx)),
  }
})

function isAtTop(): boolean {
  const el = bodyRef.value
  if (!el) return true
  const scrollable = el.querySelector<HTMLElement>('.vl-scroll-viewport') ?? el
  return scrollable.scrollTop <= 1
}

function applyPullDelta(dy: number) {
  if (dy <= 0) {
    pullDistance.value = 0
    return
  }
  const damped = props.maxPull * (1 - Math.exp(-dy / (props.maxPull * 1.1)))
  pullDistance.value = Math.min(props.maxPull, damped)
}

function finishPull() {
  const shouldTrigger = pullDistance.value >= props.threshold
  pulling.value = false
  pullDistance.value = 0
  if (shouldTrigger) emit('refresh')
}

function cleanupWindowPull() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onWindowMove)
  window.removeEventListener('pointerup', onWindowUp)
  window.removeEventListener('pointercancel', onWindowUp)
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'touch') return
  if (props.disabled || props.refreshing || e.button !== 0 || !isAtTop()) return
  pulling.value = true
  activePointer = e.pointerId
  startX = e.clientX
  startY = e.clientY
  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onWindowMove, { passive: false })
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }
}

function onWindowMove(e: PointerEvent) {
  if (!pulling.value || e.pointerId !== activePointer) return
  const dy = e.clientY - startY
  if (dy <= 0) {
    pullDistance.value = 0
    return
  }
  if (e.cancelable && dy > 6) e.preventDefault()
  applyPullDelta(dy)
}

function onWindowUp(e: PointerEvent) {
  if (!pulling.value || e.pointerId !== activePointer) return
  cleanupWindowPull()
  activePointer = -1
  finishPull()
}

// Native touch handlers with non-passive touchmove preventDefault so mobile finger pull never fights page scroll
function onTouchStart(e: TouchEvent) {
  if (props.disabled || props.refreshing || e.touches.length !== 1 || !isAtTop()) return
  const t = e.touches[0]!
  touchTracking = true
  touchLockedVertical = false
  startX = t.clientX
  startY = t.clientY
}

function onTouchMove(e: TouchEvent) {
  if (!touchTracking || e.touches.length !== 1) return
  const t = e.touches[0]!
  const dx = t.clientX - startX
  const dy = t.clientY - startY

  if (!touchLockedVertical) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    if (dy > 0 && Math.abs(dy) >= Math.abs(dx) && isAtTop()) {
      touchLockedVertical = true
      pulling.value = true
    } else {
      touchTracking = false
      return
    }
  }

  if (touchLockedVertical) {
    if (dy <= 0) {
      pullDistance.value = 0
      return
    }
    if (e.cancelable) e.preventDefault()
    e.stopPropagation()
    applyPullDelta(dy)
  }
}

function onTouchEnd() {
  if (!touchTracking) return
  touchTracking = false
  const wasLocked = touchLockedVertical
  touchLockedVertical = false
  if (wasLocked) finishPull()
}

function triggerRefresh() {
  if (props.disabled || props.refreshing) return
  emit('refresh')
}

onBeforeUnmount(() => {
  cleanupWindowPull()
})

defineExpose({ triggerRefresh })
</script>

<template>
  <div
    class="vl-pull-refresh shape-rect"
    :class="[`t-${tone}`, { pulling, refreshing }]"
    @pointerdown="onPointerDown"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div
      class="vl-pull-indicator-zone"
      :class="{ visible: currentHeaderHeight > 4 || refreshing, dragging: pulling }"
      :style="{ height: `${currentHeaderHeight}px` }"
    >
      <div class="vl-pull-pill shape-pill" :class="{ ready: readyToRelease || refreshing }">
        <VlShape
          v-if="refreshing"
          :auto-morph="['clover-4', 'sunny', 'cookie-7', 'flower', 'soft-burst']"
          :cycle-interval="680"
          :morph-duration="480"
          :tone="tone"
          variant="solid"
          :size="28"
          class="vl-pull-spin"
        >
          <VlIcon name="refresh" :size="13" />
        </VlShape>

        <VlShape
          v-else
          :shape="pullMorphPair.from"
          :morph-to="pullMorphPair.to"
          :morph-progress="pullMorphPair.t"
          :spin-deg="Math.round(pullProgress * 180)"
          :tone="tone"
          :variant="readyToRelease ? 'solid' : 'soft'"
          :size="28"
        >
          <VlIcon name="arrow-down" :size="12" />
        </VlShape>

        <span class="vl-pull-text">{{ statusText }}</span>
      </div>
    </div>

    <div ref="bodyRef" class="vl-pull-body">
      <slot :pulling="pulling" :progress="pullProgress" :trigger-refresh="triggerRefresh" />
    </div>
  </div>
</template>

<style scoped>
.vl-pull-refresh {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  user-select: none;
  overscroll-behavior-y: contain;
}

.vl-pull-indicator-zone {
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  border-bottom: 0 solid var(--divider-hairline);
  transition: height 0.38s var(--ease-m3-spatial), opacity 0.2s var(--ease-m3-effects-fast);
  opacity: 0;
  touch-action: pan-y;
}

.vl-pull-indicator-zone.visible {
  opacity: 1;
  border-bottom-width: 1px;
}

.vl-pull-indicator-zone.dragging {
  transition: none;
}

.vl-pull-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 5px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  transition:
    background-color 0.2s var(--ease-nonlinear),
    border-color 0.2s var(--ease-nonlinear);
}

.vl-pull-pill.ready {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
}

.vl-pull-refresh.t-secondary .vl-pull-pill.ready {
  background-color: var(--accent-secondary-soft);
  border-color: var(--accent-secondary);
}

.vl-pull-text {
  font-size: var(--ui-font-xs);
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
}

.vl-pull-spin {
  animation: vl-m3-slow-spin 3.2s linear infinite;
}

@keyframes vl-m3-slow-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.vl-pull-body {
  flex: 1;
  min-height: 0;
  touch-action: pan-x;
  overscroll-behavior-y: contain;
}
</style>
