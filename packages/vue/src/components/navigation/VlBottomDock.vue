<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useNavScrubGesture } from '../../composables/useNavScrubGesture'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

export interface BottomDockItem {
  id: string
  label: string
  icon: IconName
  badge?: string | number
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    items: BottomDockItem[]
    variant?: 'capsule' | 'bar'
    contained?: boolean
    embedded?: boolean
    width?: string
    ariaLabel?: string
  }>(),
  {
    variant: 'capsule',
    contained: false,
    embedded: false,
    width: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
  (e: 'press-change', pressed: boolean): void
  (e: 'drag-follow', offset: { x: number; y: number; dragging: boolean }): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLButtonElement | null)[]>([])
const barItemRefs = ref<(HTMLButtonElement | null)[]>([])
const indX = ref(0)
const indW = ref(0)
const ready = ref(false)
const animated = ref(false)

let resizeObserver: ResizeObserver | null = null

const {
  pressed: scrubPressed,
  dragging: scrubDragging,
  coveredIndex: scrubCoveredIdx,
  dragStartPos,
  dragSize,
  pressTargetPos,
  pressTargetSize,
  followX,
  followY,
  onPointerDown: rawPointerDown,
  consumeSuppressedClick,
} = useNavScrubGesture({
  axis: 'x',
  getContainer: () => (props.variant === 'capsule' ? trackRef.value : barRef.value),
  getItems: () => (props.variant === 'capsule' ? itemRefs.value : barItemRefs.value),
  getActiveIndex: () => props.items.findIndex((i) => i.id === props.modelValue),
  maxOvershoot: 12,
  containerFollow: props.variant === 'capsule' ? { maxPrimary: 10, maxCross: 5 } : false,
  onCommit: (idx) => {
    const item = props.items[idx]
    if (!item || item.id === props.modelValue) return
    const list = props.variant === 'capsule' ? itemRefs.value : barItemRefs.value
    const btn = list[idx] ?? null
    if (btn) {
      indX.value = btn.offsetLeft
      indW.value = btn.offsetWidth
    }
    animated.value = true
    emit('update:modelValue', item.id)
  },
})

watch(
  scrubPressed,
  (val) => {
    emit('press-change', val)
  },
  { flush: 'sync' },
)

watch(
  [followX, followY, scrubDragging],
  ([x, y, dragging]) => {
    emit('drag-follow', { x, y, dragging })
  },
  { flush: 'sync' },
)

// Only invert text/icon to white when the solid indicator actually covers >= 45% of that item!
const displayActiveId = computed<string | null>(() => {
  if (scrubDragging.value || (scrubPressed.value && pressTargetPos.value !== null)) {
    return scrubCoveredIdx.value !== null ? (props.items[scrubCoveredIdx.value]?.id ?? null) : null
  }
  return props.modelValue
})

// Grid layout on capsule; container vector follow lives on .vl-dock-capsule-host so container scale animates independently!
const capsuleContainerStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(1, props.items.length)}, 1fr)`,
}))

const resolvedX = computed(() => {
  if (scrubDragging.value && dragStartPos.value !== null) return dragStartPos.value
  if (scrubPressed.value && pressTargetPos.value !== null) return pressTargetPos.value
  return indX.value
})

const resolvedW = computed(() => {
  if (scrubDragging.value && dragSize.value !== null) return dragSize.value
  if (scrubPressed.value && pressTargetSize.value !== null) return pressTargetSize.value
  return indW.value
})

const capsuleIndicatorStyle = computed(() => ({
  width: `${resolvedW.value}px`,
  transform: `translate3d(${resolvedX.value}px, 0, 0)`,
}))

const barGlideStyle = computed(() => ({
  width: `${resolvedW.value}px`,
  transform: `translate3d(${resolvedX.value}px, 0, 0)`,
}))

const barLineStyle = computed(() => ({
  width: `${resolvedW.value}px`,
  transform: `translate3d(${resolvedX.value}px, 0, 0)`,
}))

const hostStyle = computed(() => {
  const base: Record<string, string> = {}
  if (props.embedded) {
    base.width = '100%'
    return base
  }
  if (props.width) base.width = props.width
  if (followX.value !== 0 || followY.value !== 0) {
    base.transform = `translate3d(calc(-50% + ${followX.value}px), ${followY.value}px, 0)`
  }
  return Object.keys(base).length ? base : undefined
})

function measure(enableAnim: boolean) {
  const idx = props.items.findIndex((item) => item.id === props.modelValue)
  const list = props.variant === 'capsule' ? itemRefs.value : barItemRefs.value
  const btn = list[idx] ?? null
  if (!btn) return
  if (enableAnim && ready.value) animated.value = true
  indX.value = btn.offsetLeft
  indW.value = btn.offsetWidth
  if (!ready.value) ready.value = true
}

function setItemRef(el: unknown, idx: number) {
  itemRefs.value[idx] = el as HTMLButtonElement | null
}

function setBarItemRef(el: unknown, idx: number) {
  barItemRefs.value[idx] = el as HTMLButtonElement | null
}

function selectTab(id: string) {
  if (consumeSuppressedClick()) return
  if (id === props.modelValue) return
  animated.value = true
  emit('update:modelValue', id)
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    measure(true)
  },
)

watch(
  () => [props.items, props.variant, props.embedded, props.width] as const,
  async () => {
    ready.value = false
    await nextTick()
    measure(false)
    observeContainer()
  },
)

function observeContainer() {
  resizeObserver?.disconnect()
  const el = props.variant === 'capsule' ? trackRef.value : barRef.value
  if (typeof ResizeObserver !== 'undefined' && el) {
    resizeObserver = new ResizeObserver(() => measure(false))
    resizeObserver.observe(el)
  }
}

onMounted(() => {
  nextTick(() => {
    measure(false)
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        measure(false)
        if (ready.value) animated.value = true
      })
    } else if (ready.value) {
      animated.value = true
    }
  })
  observeContainer()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <!-- Variant 1: Floating Centered Capsule Dock (Standalone or Embedded inside VlDockSheet) -->
  <nav
    v-if="variant === 'capsule'"
    class="vl-bottom-dock vl-dock-capsule-host"
    :class="{ contained, embedded, pressed: scrubPressed, dragging: scrubDragging }"
    :style="hostStyle"
    :aria-label="ariaLabel ?? messages.nav.bottomDockAria"
  >
    <div
      ref="trackRef"
      class="vl-dock-capsule"
      :class="{ pressed: scrubPressed, dragging: scrubDragging }"
      :style="capsuleContainerStyle"
    >
      <span
        v-show="ready && indW > 0"
        class="vl-dock-indicator"
        :class="{
          animated: (animated || (scrubPressed && pressTargetPos !== null)) && !scrubDragging,
          pressed: scrubPressed,
          dragging: scrubDragging,
        }"
        :style="capsuleIndicatorStyle"
        aria-hidden="true"
      />

      <button
        v-for="(item, idx) in items"
        :key="item.id"
        :ref="(el) => setItemRef(el, idx)"
        type="button"
        class="vl-dock-tab"
        :class="{ active: displayActiveId === item.id }"
        :aria-current="modelValue === item.id ? 'page' : undefined"
        @pointerdown="rawPointerDown($event, idx)"
        @click="selectTab(item.id)"
      >
        <span class="vl-dock-icon-wrap">
          <VlIcon :name="item.icon" :size="18" />
          <span v-if="item.badge !== undefined" class="vl-dock-badge">{{ item.badge }}</span>
        </span>
        <span class="vl-dock-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>

  <!-- Variant 2: Flush Full-Width Bottom Bar (Glide Color Block + Top Color Bar Follow Finger) -->
  <nav
    v-else
    ref="barRef"
    class="vl-bottom-dock vl-dock-bar shape-rect"
    :class="{ contained, embedded, pressed: scrubPressed, dragging: scrubDragging }"
    :style="{ gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)` }"
    :aria-label="ariaLabel ?? messages.nav.bottomDockAria"
  >
    <span
      v-show="ready && indW > 0"
      class="vl-bar-glide-block shape-rect"
      :class="{ animated: animated && !scrubDragging, pressed: scrubPressed, dragging: scrubDragging }"
      :style="barGlideStyle"
      aria-hidden="true"
    />
    <span
      v-show="ready && indW > 0"
      class="vl-bar-glide-line shape-rect"
      :class="{ animated: animated && !scrubDragging, pressed: scrubPressed, dragging: scrubDragging }"
      :style="barLineStyle"
      aria-hidden="true"
    />

    <button
      v-for="(item, idx) in items"
      :key="item.id"
      :ref="(el) => setBarItemRef(el, idx)"
      type="button"
      class="vl-bar-item shape-rect"
      :class="{
        active: displayActiveId === item.id,
        'no-glide-fallback': !ready || indW <= 0,
      }"
      :aria-current="modelValue === item.id ? 'page' : undefined"
      @pointerdown="rawPointerDown($event, idx)"
      @click="selectTab(item.id)"
    >
      <span class="vl-bar-icon">
        <VlIcon :name="item.icon" :size="18" />
        <span v-if="item.badge !== undefined" class="vl-dock-badge">{{ item.badge }}</span>
      </span>
      <span class="vl-bar-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
/* Capsule Variant (centered unified floating width matching collapsed VlDockSheet) */
.vl-dock-capsule-host {
  position: absolute;
  left: 50%;
  bottom: calc(12px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)));
  transform: translate3d(-50%, 0, 0);
  z-index: 30;
  width: var(--dock-capsule-width, min(380px, calc(100% - 24px)));
  max-width: calc(100% - 24px);
  user-select: none;
  pointer-events: auto;
  transition: transform 0.34s var(--ease-emphasized-decel);
}

.vl-dock-capsule-host.dragging {
  transition: none;
}

.vl-dock-capsule-host.contained {
  bottom: 12px;
}

.vl-dock-capsule-host.embedded {
  position: relative;
  left: auto;
  bottom: auto;
  transform: none;
  z-index: auto;
  width: 100%;
  max-width: 100%;
  transition: none;
}

.vl-dock-capsule {
  --dock-h: var(--dock-capsule-height, 56px);
  position: relative;
  width: 100%;
  height: var(--dock-h);
  padding: 5px;
  border-radius: calc(var(--dock-h) / 2);
  display: grid;
  align-items: stretch;
  background-color: var(--bg-activity);
  border: 1px solid var(--divider-strong);
  overflow: visible;
  touch-action: none;
  cursor: grab;
  transform-origin: center;
  transform: scale(1);
  transition:
    transform 0.28s var(--ease-standard),
    background-color 0.2s var(--ease-standard),
    border-color 0.2s var(--ease-standard);
}

.vl-dock-capsule-host:not(.embedded) .vl-dock-capsule.pressed,
.vl-dock-capsule-host:not(.embedded) .vl-dock-capsule.dragging {
  transform: scale(1.045);
}

.vl-dock-capsule.dragging {
  cursor: grabbing;
}

.vl-dock-capsule-host.embedded .vl-dock-capsule {
  background-color: var(--bg-chip);
  border-color: var(--divider-hairline);
}

.vl-dock-indicator {
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: 0;
  border-radius: calc((var(--dock-h) - 10px) / 2);
  background-color: transparent;
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

.vl-dock-indicator::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: var(--accent-primary);
  transform-origin: center;
  transform: scale(1, 1);
  will-change: transform;
  transition:
    transform 0.28s var(--ease-standard),
    background-color 0.2s var(--ease-standard);
}

.vl-dock-indicator.pressed::before,
.vl-dock-indicator.dragging::before {
  background-color: var(--accent-primary-hover);
  transform: scale(1.16, 1.32);
}

.vl-dock-capsule-host.embedded .vl-dock-indicator.pressed::before,
.vl-dock-capsule-host.embedded .vl-dock-indicator.dragging::before {
  transform: scale(1.1, 1.22);
}

.vl-dock-indicator.animated {
  transition:
    transform 0.34s var(--ease-standard),
    width 0.3s var(--ease-standard);
}

.vl-dock-indicator.dragging {
  transition: none;
}

.vl-dock-tab {
  position: relative;
  z-index: 2;
  transform: translate3d(0, 0, 0);
  border-radius: calc((var(--dock-h) - 10px) / 2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-secondary);
  transition: color 0.14s var(--ease-standard) 0.04s;
}

.vl-dock-tab:focus-visible {
  outline: none;
}

.vl-dock-tab.active {
  color: var(--accent-primary-ink);
  transition: color 0.14s var(--ease-standard) 0.13s;
}

.vl-dock-capsule.dragging .vl-dock-tab,
.vl-dock-capsule.dragging .vl-dock-tab.active {
  transition: color 0.06s linear 0s;
}

.vl-dock-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.vl-dock-icon-wrap :deep(.vl-icon) {
  width: var(--dock-icon-size, 18px);
  height: var(--dock-icon-size, 18px);
}

.vl-dock-badge {
  position: absolute;
  top: -5px;
  right: -10px;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-dock-label {
  font-size: var(--dock-label-size, 11.5px);
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

/* Flush Bottom Bar Variant */
.vl-dock-bar {
  position: relative;
  width: 100%;
  min-height: 58px;
  display: grid;
  align-items: stretch;
  background-color: var(--bg-surface);
  border-top: 1px solid var(--divider-hairline);
  padding-bottom: var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px));
  user-select: none;
  touch-action: none;
  cursor: grab;
  overflow: visible;
  z-index: 30;
}

.vl-dock-bar.dragging {
  cursor: grabbing;
}

.vl-dock-bar.contained,
.vl-dock-bar.embedded {
  padding-bottom: 0;
}

.vl-bar-glide-block {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: transparent;
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

.vl-bar-glide-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--bg-base);
  transform-origin: center;
  transform: scale(1, 1);
  will-change: transform;
  transition:
    transform 0.28s var(--ease-standard),
    background-color 0.2s var(--ease-standard);
}

.vl-bar-glide-block.pressed::before,
.vl-bar-glide-block.dragging::before {
  background-color: var(--accent-primary-soft);
  transform: scale(1.12, 1.18);
}

.vl-bar-glide-block.animated {
  transition:
    transform 0.34s var(--ease-standard),
    width 0.3s var(--ease-standard);
}

.vl-bar-glide-block.dragging {
  transition: none;
}

.vl-bar-glide-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background-color: transparent;
  pointer-events: none;
  z-index: 3;
  will-change: transform;
}

.vl-bar-glide-line::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--accent-primary);
  transform-origin: center top;
  transform: scale(1, 1);
  will-change: transform;
  transition: transform 0.26s var(--ease-standard);
}

.vl-bar-glide-line.pressed::before,
.vl-bar-glide-line.dragging::before {
  transform: scale(1.12, 1.45);
}

.vl-bar-glide-line.animated {
  transition:
    transform 0.34s var(--ease-standard),
    width 0.3s var(--ease-standard);
}

.vl-bar-glide-line.dragging {
  transition: none;
}

.vl-bar-item {
  position: relative;
  z-index: 2;
  transform: translate3d(0, 0, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  color: var(--text-muted);
  transition:
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-bar-item:hover {
  color: var(--text-primary);
}

.vl-bar-item.active {
  color: var(--text-primary);
}

.vl-bar-item.active.no-glide-fallback {
  background-color: var(--bg-base);
}

.vl-bar-icon {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-bar-item.active .vl-bar-icon {
  border-radius: 15px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-bar-label {
  font-size: var(--dock-label-size, 11.5px);
  font-weight: 700;
  line-height: 1;
}
</style>
