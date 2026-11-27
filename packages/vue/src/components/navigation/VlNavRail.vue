<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useNavScrubGesture } from '../../composables/useNavScrubGesture'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

export interface NavRailItem {
  id: string
  label: string
  icon: IconName
  badge?: string | number
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    items: NavRailItem[]
    /** 'capsule' = vertical floating pill rail; 'bar' = flush edge-docked side navigation bar */
    variant?: 'capsule' | 'bar'
    side?: 'left' | 'right'
    contained?: boolean
    ariaLabel?: string
  }>(),
  {
    variant: 'capsule',
    side: 'left',
    contained: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
  (e: 'press-change', pressed: boolean): void
  (e: 'drag-follow', offset: { x: number; y: number; dragging: boolean }): void
}>()

const capsuleRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)
const capsuleItemRefs = ref<(HTMLButtonElement | null)[]>([])
const barItemRefs = ref<(HTMLButtonElement | null)[]>([])

const indY = ref(0)
const indH = ref(0)
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
  axis: 'y',
  getContainer: () => (props.variant === 'capsule' ? capsuleRef.value : barRef.value),
  getItems: () => (props.variant === 'capsule' ? capsuleItemRefs.value : barItemRefs.value),
  getActiveIndex: () => props.items.findIndex((i) => i.id === props.modelValue),
  maxOvershoot: 12,
  containerFollow: props.variant === 'capsule' ? { maxPrimary: 10, maxCross: 5 } : false,
  onCommit: (idx) => {
    const item = props.items[idx]
    if (!item || item.id === props.modelValue) return
    const list = props.variant === 'capsule' ? capsuleItemRefs.value : barItemRefs.value
    const btn = list[idx] ?? null
    if (btn) {
      indY.value = btn.offsetTop
      indH.value = btn.offsetHeight
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

// Only invert text/icon ink when the sliding block covers >= 45% of that item
const displayActiveId = computed<string | null>(() => {
  if (scrubDragging.value || (scrubPressed.value && pressTargetPos.value !== null)) {
    return scrubCoveredIdx.value !== null ? (props.items[scrubCoveredIdx.value]?.id ?? null) : null
  }
  return props.modelValue
})

const hostFollowStyle = computed(() => {
  if (followX.value !== 0 || followY.value !== 0) {
    return { transform: `translate3d(${followX.value}px, ${followY.value}px, 0)` }
  }
  return undefined
})

const capsuleContainerStyle = computed(() => ({
  gridTemplateRows: `repeat(${Math.max(1, props.items.length)}, 1fr)`,
}))

const resolvedY = computed(() => {
  if (scrubDragging.value && dragStartPos.value !== null) return dragStartPos.value
  if (scrubPressed.value && pressTargetPos.value !== null) return pressTargetPos.value
  return indY.value
})

const resolvedH = computed(() => {
  if (scrubDragging.value && dragSize.value !== null) return dragSize.value
  if (scrubPressed.value && pressTargetSize.value !== null) return pressTargetSize.value
  return indH.value
})

const capsuleIndicatorStyle = computed(() => ({
  height: `${resolvedH.value}px`,
  transform: `translate3d(0, ${resolvedY.value}px, 0)`,
}))

const barGlideStyle = computed(() => ({
  height: `${resolvedH.value}px`,
  transform: `translate3d(0, ${resolvedY.value}px, 0)`,
}))

const barLineStyle = computed(() => ({
  height: `${resolvedH.value}px`,
  transform: `translate3d(0, ${resolvedY.value}px, 0)`,
}))

function measure(enableAnim: boolean) {
  const idx = props.items.findIndex((item) => item.id === props.modelValue)
  const list = props.variant === 'capsule' ? capsuleItemRefs.value : barItemRefs.value
  const btn = list[idx] ?? null
  if (!btn) return
  if (enableAnim && ready.value) animated.value = true
  indY.value = btn.offsetTop
  indH.value = btn.offsetHeight
  if (!ready.value) ready.value = true
}

function setCapsuleItemRef(el: unknown, idx: number) {
  capsuleItemRefs.value[idx] = el as HTMLButtonElement | null
}

function setBarItemRef(el: unknown, idx: number) {
  barItemRefs.value[idx] = el as HTMLButtonElement | null
}

function select(id: string) {
  if (consumeSuppressedClick()) return
  if (id === props.modelValue) return
  animated.value = true
  emit('update:modelValue', id)
}

watch(
  () => [props.modelValue, props.variant, props.items] as const,
  async () => {
    await nextTick()
    measure(true)
  },
  { deep: true },
)

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
  const host = capsuleRef.value ?? barRef.value
  if (typeof ResizeObserver !== 'undefined' && host) {
    resizeObserver = new ResizeObserver(() => measure(false))
    resizeObserver.observe(host)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <!-- Variant 1: Vertical Floating Pure Capsule Rail -->
  <div
    v-if="variant === 'capsule'"
    class="vl-nav-rail-host"
    :class="[`side-${side}`, { contained, dragging: scrubDragging }]"
    :style="hostFollowStyle"
  >
    <nav
      ref="capsuleRef"
      class="vl-nav-rail-capsule"
      :class="{ pressed: scrubPressed, dragging: scrubDragging }"
      :style="capsuleContainerStyle"
      :aria-label="ariaLabel ?? messages.nav.navRailAria"
      @pointerdown="rawPointerDown($event)"
    >
      <span
        v-show="ready"
        class="vl-rail-indicator"
        :class="{
          animated: animated && !scrubDragging,
          pressed: scrubPressed,
          dragging: scrubDragging,
        }"
        :style="capsuleIndicatorStyle"
        aria-hidden="true"
      />
      <button
        v-for="(item, idx) in items"
        :key="item.id"
        :ref="(el) => setCapsuleItemRef(el, idx)"
        type="button"
        class="vl-rail-tab"
        :class="{ active: displayActiveId === item.id }"
        :aria-current="modelValue === item.id ? 'page' : undefined"
        @pointerdown.stop="rawPointerDown($event, idx)"
        @click="select(item.id)"
      >
        <span class="vl-rail-icon-wrap">
          <VlIcon :name="item.icon" :size="18" />
          <span v-if="item.badge !== undefined" class="vl-rail-badge">{{ item.badge }}</span>
        </span>
        <span class="vl-rail-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>

  <!-- Variant 2: Vertical Flush Edge-Docked Navigation Bar -->
  <nav
    v-else
    ref="barRef"
    class="vl-nav-rail-bar shape-rect"
    :class="[`side-${side}`, { contained, pressed: scrubPressed, dragging: scrubDragging }]"
    :style="{ gridTemplateRows: `repeat(${Math.max(1, items.length)}, 1fr)` }"
    :aria-label="ariaLabel ?? messages.nav.navRailAria"
    @pointerdown="rawPointerDown($event)"
  >
    <span
      v-show="ready"
      class="vl-rail-bar-block shape-rect"
      :class="{
        animated: animated && !scrubDragging,
        pressed: scrubPressed,
        dragging: scrubDragging,
      }"
      :style="barGlideStyle"
      aria-hidden="true"
    />
    <span
      v-show="ready"
      class="vl-rail-bar-line shape-rect"
      :class="[
        `side-${side}`,
        {
          animated: animated && !scrubDragging,
          pressed: scrubPressed,
          dragging: scrubDragging,
        },
      ]"
      :style="barLineStyle"
      aria-hidden="true"
    />
    <button
      v-for="(item, idx) in items"
      :key="item.id"
      :ref="(el) => setBarItemRef(el, idx)"
      type="button"
      class="vl-rail-bar-item shape-rect"
      :class="{ active: displayActiveId === item.id, 'no-glide-fallback': !ready }"
      :aria-current="modelValue === item.id ? 'page' : undefined"
      @pointerdown.stop="rawPointerDown($event, idx)"
      @click="select(item.id)"
    >
      <span class="vl-rail-bar-icon">
        <VlIcon :name="item.icon" :size="18" />
        <span v-if="item.badge !== undefined" class="vl-rail-badge">{{ item.badge }}</span>
      </span>
      <span class="vl-rail-bar-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
/* Variant 1: Vertical Floating Pure Capsule */
.vl-nav-rail-host {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  user-select: none;
  flex-shrink: 0;
  transition: transform 0.34s var(--ease-emphasized-decel);
}

.vl-nav-rail-host.dragging {
  transition: none;
}

.vl-nav-rail-capsule {
  --rail-w: var(--nav-rail-capsule-width, 64px);
  position: relative;
  width: var(--rail-w);
  padding: 5px;
  border-radius: calc(var(--rail-w) / 2);
  display: grid;
  align-items: stretch;
  gap: 2px;
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

.vl-nav-rail-capsule.pressed,
.vl-nav-rail-capsule.dragging {
  transform: scale(1.045);
}

.vl-nav-rail-capsule.dragging {
  cursor: grabbing;
}

.vl-rail-indicator {
  position: absolute;
  left: 5px;
  right: 5px;
  top: 0;
  border-radius: calc((var(--rail-w) - 10px) / 2);
  background-color: transparent;
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

.vl-rail-indicator::before {
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

.vl-rail-indicator.pressed::before,
.vl-rail-indicator.dragging::before {
  background-color: var(--accent-primary-hover);
  transform: scale(1.32, 1.16);
}

.vl-rail-indicator.animated {
  transition:
    transform 0.34s var(--ease-standard),
    height 0.3s var(--ease-standard);
}

.vl-rail-indicator.dragging {
  transition: none;
}

.vl-rail-tab {
  position: relative;
  z-index: 2;
  transform: translate3d(0, 0, 0);
  min-height: 58px;
  padding: 8px 4px;
  border-radius: calc((var(--rail-w) - 10px) / 2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-secondary);
  transition: color 0.14s var(--ease-standard) 0.04s;
}

.vl-rail-tab:focus-visible {
  outline: none;
}

.vl-rail-tab.active {
  color: var(--accent-primary-ink);
  transition: color 0.14s var(--ease-standard) 0.13s;
}

.vl-nav-rail-capsule.dragging .vl-rail-tab,
.vl-nav-rail-capsule.dragging .vl-rail-tab.active {
  transition: color 0.06s linear 0s;
}

.vl-rail-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.vl-rail-badge {
  position: absolute;
  top: -6px;
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

.vl-rail-label {
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

/* Variant 2: Vertical Flush Edge-Docked Side Bar */
.vl-nav-rail-bar {
  position: relative;
  width: 68px;
  min-width: 68px;
  height: 100%;
  display: grid;
  align-items: stretch;
  background-color: var(--bg-surface);
  user-select: none;
  touch-action: pan-x;
  cursor: grab;
  overflow: visible;
  flex-shrink: 0;
  z-index: 20;
}

.vl-nav-rail-bar.side-left {
  border-right: 1px solid var(--divider-hairline);
}

.vl-nav-rail-bar.side-right {
  border-left: 1px solid var(--divider-hairline);
}

.vl-nav-rail-bar.dragging {
  cursor: grabbing;
}

.vl-rail-bar-block {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background-color: transparent;
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

.vl-rail-bar-block::before {
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

.vl-rail-bar-block.pressed::before,
.vl-rail-bar-block.dragging::before {
  background-color: var(--accent-primary-soft);
  transform: scale(1.18, 1.12);
}

.vl-rail-bar-block.animated {
  transition:
    transform 0.34s var(--ease-standard),
    height 0.3s var(--ease-standard);
}

.vl-rail-bar-block.dragging {
  transition: none;
}

.vl-rail-bar-line {
  position: absolute;
  top: 0;
  width: 3px;
  background-color: transparent;
  pointer-events: none;
  z-index: 3;
  will-change: transform;
}

.vl-rail-bar-line::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--accent-primary);
  transform-origin: left center;
  transform: scale(1, 1);
  will-change: transform;
  transition: transform 0.26s var(--ease-standard);
}

.vl-rail-bar-line.side-left {
  left: 0;
}

.vl-rail-bar-line.side-right {
  right: 0;
}

.vl-rail-bar-line.side-right::before {
  transform-origin: right center;
}

.vl-rail-bar-line.pressed::before,
.vl-rail-bar-line.dragging::before {
  transform: scale(1.45, 1.12);
}

.vl-rail-bar-line.animated {
  transition:
    transform 0.34s var(--ease-standard),
    height 0.3s var(--ease-standard);
}

.vl-rail-bar-line.dragging {
  transition: none;
}

.vl-rail-bar-item {
  position: relative;
  z-index: 2;
  transform: translate3d(0, 0, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  color: var(--text-muted);
  transition:
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-rail-bar-item:hover {
  color: var(--text-primary);
}

.vl-rail-bar-item.active {
  color: var(--text-primary);
}

.vl-rail-bar-item.active.no-glide-fallback {
  background-color: var(--bg-base);
}

.vl-rail-bar-icon {
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

.vl-rail-bar-item.active .vl-rail-bar-icon {
  border-radius: 15px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-rail-bar-label {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
</style>
