<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSplitResize } from '../../composables/useSplitResize'

const props = withDefaults(
  defineProps<{
    leftVisible?: boolean
    rightVisible?: boolean
    leftWidth?: number
    rightWidth?: number
    minLeftWidth?: number
    minRightWidth?: number
    maxLeftWidth?: number
    maxRightWidth?: number
    defaultLeftWidth?: number
    defaultRightWidth?: number
    minCenterWidth?: number
    activityBarWidth?: number
    dualMode?: boolean
    dualSideRatio?: number
    minDualSidePx?: number
    maxDualSideRatio?: number
    defaultDualSideRatio?: number
    hasLeft?: boolean
    hasRight?: boolean
    leftSashTitle?: string
    rightSashTitle?: string
  }>(),
  {
    leftVisible: true,
    rightVisible: false,
    leftWidth: 288,
    rightWidth: 288,
    minLeftWidth: 236,
    minRightWidth: 224,
    maxLeftWidth: 520,
    maxRightWidth: 520,
    defaultLeftWidth: 288,
    defaultRightWidth: 288,
    minCenterWidth: 280,
    activityBarWidth: 50,
    dualMode: false,
    dualSideRatio: 0.4,
    minDualSidePx: 210,
    maxDualSideRatio: 0.65,
    defaultDualSideRatio: 0.4,
    hasLeft: true,
    hasRight: true,
    leftSashTitle: '拖动调整左侧面板宽度 · 双击重置',
    rightSashTitle: '拖动调整右侧面板宽度 · 双击重置',
  },
)

const emit = defineEmits<{
  (e: 'update:leftWidth', width: number): void
  (e: 'update:rightWidth', width: number): void
  (e: 'update:dualSideRatio', ratio: number): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const SASH_WIDTH = 10
let resizeObserver: ResizeObserver | null = null

function measureContainer(): void {
  if (containerRef.value?.clientWidth) {
    containerWidth.value = containerRef.value.clientWidth
  } else if (typeof window !== 'undefined') {
    containerWidth.value = window.innerWidth
  }
}

onMounted(() => {
  measureContainer()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', measureContainer, { passive: true })
  }
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver(measureContainer)
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', measureContainer)
  }
})

function getContainerWidth(): number {
  return containerRef.value?.clientWidth || containerWidth.value
}

function getDualAvailableWidth(): number {
  void containerWidth.value
  return Math.max(460, getContainerWidth() - props.activityBarWidth - SASH_WIDTH)
}

const dualSidePx = computed(() => {
  void containerWidth.value
  const avail = getDualAvailableWidth()
  const raw = Math.round(avail * props.dualSideRatio)
  const maxPx = Math.max(props.minDualSidePx, avail - props.minCenterWidth)
  return Math.max(props.minDualSidePx, Math.min(maxPx, raw))
})

const effectiveLeftWidth = computed(() => (props.dualMode ? dualSidePx.value : props.leftWidth))
const effectiveRightWidth = computed(() => (props.dualMode ? dualSidePx.value : props.rightWidth))
const effectiveMinLeft = computed(() => (props.dualMode ? props.minDualSidePx : props.minLeftWidth))
const effectiveMinRight = computed(() => (props.dualMode ? props.minDualSidePx : props.minRightWidth))

const leftSash = useSplitResize({
  side: 'left',
  getWidth: () => effectiveLeftWidth.value,
  setWidth: (nextPx) => {
    const activeMin = props.dualMode ? props.minDualSidePx : props.minLeftWidth
    const clampedPx = Math.max(activeMin, nextPx)
    if (props.dualMode) {
      const ratio = Math.max(
        0.2,
        Math.min(props.maxDualSideRatio, clampedPx / getDualAvailableWidth()),
      )
      emit('update:dualSideRatio', Math.round(ratio * 1000) / 1000)
    } else {
      emit('update:leftWidth', clampedPx)
    }
  },
  minWidth: Math.min(props.minLeftWidth, props.minDualSidePx),
  maxWidth: Math.max(props.maxLeftWidth, 680),
  defaultWidth: props.defaultLeftWidth,
  getMaxAllowed: () => {
    if (props.dualMode) {
      return Math.max(props.minDualSidePx, getDualAvailableWidth() - props.minCenterWidth)
    }
    const total = getContainerWidth()
    const occupiedRight = props.hasRight && props.rightVisible ? props.rightWidth + SASH_WIDTH : 0
    return Math.min(
      props.maxLeftWidth,
      total - props.activityBarWidth - SASH_WIDTH - occupiedRight - props.minCenterWidth,
    )
  },
})

const rightSash = useSplitResize({
  side: 'right',
  getWidth: () => effectiveRightWidth.value,
  setWidth: (nextPx) => {
    const activeMin = props.dualMode ? props.minDualSidePx : props.minRightWidth
    const clampedPx = Math.max(activeMin, nextPx)
    if (props.dualMode) {
      const ratio = Math.max(
        0.2,
        Math.min(props.maxDualSideRatio, clampedPx / getDualAvailableWidth()),
      )
      emit('update:dualSideRatio', Math.round(ratio * 1000) / 1000)
    } else {
      emit('update:rightWidth', clampedPx)
    }
  },
  minWidth: Math.min(props.minRightWidth, props.minDualSidePx),
  maxWidth: Math.max(props.maxRightWidth, 680),
  defaultWidth: props.defaultRightWidth,
  getMaxAllowed: () => {
    if (props.dualMode) {
      return Math.max(props.minDualSidePx, getDualAvailableWidth() - props.minCenterWidth)
    }
    const total = getContainerWidth()
    const occupiedLeft = props.hasLeft && props.leftVisible ? props.leftWidth + SASH_WIDTH : 0
    return Math.min(
      props.maxRightWidth,
      total - props.activityBarWidth - SASH_WIDTH - occupiedLeft - props.minCenterWidth,
    )
  },
})

function resetLeft() {
  if (props.dualMode) emit('update:dualSideRatio', props.defaultDualSideRatio)
  else leftSash.resetWidth()
}

function resetRight() {
  if (props.dualMode) emit('update:dualSideRatio', props.defaultDualSideRatio)
  else rightSash.resetWidth()
}

defineExpose({
  containerRef,
})
</script>

<template>
  <div ref="containerRef" class="vl-split-main shape-rect">
    <slot name="activity" />

    <!-- Left Pane -->
    <template v-if="hasLeft">
      <div
        class="vl-split-pane vl-left-pane shape-rect"
        :class="{
          collapsed: !leftVisible,
          'no-transition': leftSash.isDragging.value,
        }"
        :style="
          leftVisible
            ? { width: `${effectiveLeftWidth}px`, minWidth: `${effectiveMinLeft}px` }
            : {}
        "
        :aria-hidden="!leftVisible"
      >
        <div
          class="vl-pane-inner vl-left-inner"
          :style="{ width: `${effectiveLeftWidth}px`, minWidth: `${effectiveMinLeft}px` }"
        >
          <slot name="left" />
        </div>
      </div>

      <div
        class="vl-split-sash shape-rect"
        :class="{
          collapsed: !leftVisible,
          dragging: leftSash.isDragging.value,
        }"
        data-no-drawer-gesture
        role="separator"
        aria-orientation="vertical"
        :aria-label="leftSashTitle"
        :title="leftSashTitle"
        @pointerdown.stop="leftSash.startDrag"
        @dblclick="resetLeft"
      >
        <span class="vl-sash-handle" />
      </div>
    </template>

    <!-- Center Stage -->
    <div class="vl-split-center shape-rect">
      <slot name="center">
        <slot />
      </slot>
    </div>

    <!-- Right Pane -->
    <template v-if="hasRight">
      <div
        class="vl-split-sash shape-rect"
        :class="{
          collapsed: !rightVisible,
          dragging: rightSash.isDragging.value,
        }"
        data-no-drawer-gesture
        role="separator"
        aria-orientation="vertical"
        :aria-label="rightSashTitle"
        :title="rightSashTitle"
        @pointerdown.stop="rightSash.startDrag"
        @dblclick="resetRight"
      >
        <span class="vl-sash-handle" />
      </div>

      <div
        class="vl-split-pane vl-right-pane shape-rect"
        :class="{
          collapsed: !rightVisible,
          'no-transition': rightSash.isDragging.value,
        }"
        :style="
          rightVisible
            ? { width: `${effectiveRightWidth}px`, minWidth: `${effectiveMinRight}px` }
            : {}
        "
        :aria-hidden="!rightVisible"
      >
        <div
          class="vl-pane-inner vl-right-inner"
          :style="{ width: `${effectiveRightWidth}px`, minWidth: `${effectiveMinRight}px` }"
        >
          <slot name="right" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vl-split-main {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.vl-split-center {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-base);
}

.vl-split-pane {
  height: 100%;
  flex: 0 0 auto;
  overflow: hidden;
  opacity: 1;
  transition:
    width 0.36s var(--ease-nonlinear),
    min-width 0.36s var(--ease-nonlinear),
    opacity 0.28s var(--ease-nonlinear);
}

.vl-split-pane.no-transition,
.vl-split-pane.no-transition .vl-pane-inner {
  transition: none !important;
}

.vl-split-pane.collapsed {
  width: 0 !important;
  min-width: 0 !important;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
}

.vl-pane-inner {
  height: 100%;
  max-width: 100%;
  transform: translateX(0);
  transition: transform 0.36s var(--ease-nonlinear);
}

.vl-left-pane.collapsed .vl-left-inner {
  max-width: none;
  transform: translateX(-28px);
}

.vl-right-pane.collapsed .vl-right-inner {
  max-width: none;
  transform: translateX(28px);
}

.vl-split-sash {
  position: relative;
  width: 10px;
  min-width: 10px;
  height: 100%;
  cursor: col-resize;
  background-color: var(--bg-activity);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 10;
  touch-action: none;
  overflow: hidden;
  opacity: 1;
  transition:
    width 0.36s var(--ease-nonlinear),
    min-width 0.36s var(--ease-nonlinear),
    opacity 0.24s var(--ease-nonlinear),
    background-color 0.2s var(--ease-nonlinear);
}

.vl-split-sash.collapsed {
  width: 0;
  min-width: 0;
  opacity: 0;
  pointer-events: none;
}

.vl-sash-handle {
  width: 4px;
  height: 52px;
  border-radius: 2px;
  background-color: var(--sash-handle);
  transition:
    width 0.26s var(--ease-nonlinear),
    height 0.28s var(--ease-nonlinear),
    border-radius 0.26s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear);
}

.vl-split-sash:hover,
.vl-split-sash.dragging {
  background-color: var(--accent-primary-soft);
}

.vl-split-sash:hover .vl-sash-handle,
.vl-split-sash.dragging .vl-sash-handle {
  width: 10px;
  height: 92px;
  border-radius: 0px;
  background-color: var(--accent-primary);
}
</style>
