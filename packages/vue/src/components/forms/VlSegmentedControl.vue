<script setup lang="ts" generic="T extends string = string">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useNavScrubGesture } from '../../composables/useNavScrubGesture'

export interface SegmentOption<V extends string = string> {
  value: V
  label: string
  icon?: IconName
  title?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: SegmentOption<T>[]
    size?: 'sm' | 'md'
    surface?: 'activity' | 'surface' | 'base'
    fullWidth?: boolean
    variant?: 'sliding' | 'morph-grid'
    columns?: number
    ariaLabel?: string
  }>(),
  {
    size: 'md',
    surface: 'activity',
    fullWidth: false,
    variant: 'sliding',
    ariaLabel: '分段选择',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'select', value: T, event: MouseEvent): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const btnRefs = ref<(HTMLButtonElement | null)[]>([])

const indicatorX = ref(0)
const indicatorW = ref(0)
const ready = ref(false)
const animate = ref(false)

let resizeObserver: ResizeObserver | null = null

const {
  pressed: scrubPressed,
  dragging: scrubDragging,
  coveredIndex: scrubCoveredIdx,
  dragStartPos,
  dragSize,
  pressTargetPos,
  pressTargetSize,
  onPointerDown,
  consumeSuppressedClick,
} = useNavScrubGesture({
  axis: 'x',
  getContainer: () => trackRef.value,
  getItems: () => btnRefs.value,
  getActiveIndex: () => props.options.findIndex((o) => o.value === props.modelValue),
  maxOvershoot: 6,
  onCommit: (idx, ev) => {
    const opt = props.options[idx]
    if (!opt) return
    const btn = btnRefs.value[idx] ?? null
    if (btn) {
      indicatorX.value = btn.offsetLeft
      indicatorW.value = btn.offsetWidth
    }
    animate.value = true
    emit('select', opt.value, ev as unknown as MouseEvent)
    if (opt.value !== props.modelValue) {
      emit('update:modelValue', opt.value)
    }
  },
})

const displayValue = computed(() => {
  if (scrubDragging.value || (scrubPressed.value && pressTargetPos.value !== null)) {
    return scrubCoveredIdx.value !== null ? (props.options[scrubCoveredIdx.value]?.value ?? null) : null
  }
  return props.modelValue
})

const indicatorStyle = computed(() => {
  const x =
    scrubDragging.value && dragStartPos.value !== null
      ? dragStartPos.value
      : scrubPressed.value && pressTargetPos.value !== null
        ? pressTargetPos.value
        : indicatorX.value
  const w =
    scrubDragging.value && dragSize.value !== null
      ? dragSize.value
      : scrubPressed.value && pressTargetSize.value !== null
        ? pressTargetSize.value
        : indicatorW.value
  return {
    width: `${w}px`,
    transform: `translate3d(${x}px, 0, 0)`,
  }
})

function measureIndicator(enableAnim: boolean) {
  if (props.variant !== 'sliding') return
  const idx = props.options.findIndex((o) => o.value === props.modelValue)
  const btn = btnRefs.value[idx] ?? null
  if (!btn) return
  if (enableAnim && ready.value) {
    animate.value = true
  }
  indicatorX.value = btn.offsetLeft
  indicatorW.value = btn.offsetWidth
  if (!ready.value) ready.value = true
}

function setBtnRef(el: unknown, index: number) {
  btnRefs.value[index] = el as HTMLButtonElement | null
}

function select(value: T, event: MouseEvent) {
  if (consumeSuppressedClick()) return
  emit('select', value, event)
  if (value === props.modelValue) return
  animate.value = true
  emit('update:modelValue', value)
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    measureIndicator(true)
  },
)

watch(
  () => [props.options, props.fullWidth, props.variant] as const,
  async () => {
    await nextTick()
    measureIndicator(false)
  },
)

onMounted(() => {
  nextTick(() => {
    measureIndicator(false)
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        measureIndicator(false)
        if (ready.value) animate.value = true
      })
    } else if (ready.value) {
      animate.value = true
    }
  })
  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    resizeObserver = new ResizeObserver(() => measureIndicator(false))
    resizeObserver.observe(trackRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <!-- Variant 1: Sliding & Width-Morphing Indicator Pill -->
  <div
    v-if="variant === 'sliding'"
    ref="trackRef"
    class="vl-seg-track"
    :class="[`size-${size}`, `surf-${surface}`, { 'full-width': fullWidth, pressed: scrubPressed, dragging: scrubDragging }]"
    role="group"
    :aria-label="ariaLabel"
  >
    <span
      v-show="ready && indicatorW > 0"
      class="vl-seg-indicator"
      :class="{
        animated: (animate || (scrubPressed && pressTargetPos !== null)) && !scrubDragging,
        pressed: scrubPressed,
        dragging: scrubDragging,
      }"
      :style="indicatorStyle"
      aria-hidden="true"
    />

    <button
      v-for="(opt, idx) in options"
      :key="opt.value"
      :ref="(el) => setBtnRef(el, idx)"
      type="button"
      class="vl-seg-item"
      :class="{ active: opt.value === displayValue }"
      :title="opt.title ?? opt.label"
      @pointerdown="onPointerDown($event, idx)"
      @click="select(opt.value, $event)"
    >
      <VlIcon v-if="opt.icon" :name="opt.icon" :size="size === 'sm' ? 11 : 12" />
      <span>{{ opt.label }}</span>
    </button>
  </div>

  <!-- Variant 2: Expressive Square <-> Pill Morph Grid -->
  <div
    v-else
    class="vl-morph-grid"
    :style="{ gridTemplateColumns: `repeat(${columns ?? Math.max(1, options.length)}, 1fr)` }"
    role="group"
    :aria-label="ariaLabel"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="vl-morph-option"
      :class="[`size-${size}`, { active: opt.value === modelValue }]"
      :title="opt.title ?? opt.label"
      @click="select(opt.value, $event)"
    >
      <VlIcon v-if="opt.icon" :name="opt.icon" :size="size === 'sm' ? 12 : 13" />
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.vl-seg-track {
  --seg-h: var(--ui-row-height);
  position: relative;
  height: var(--seg-h);
  display: inline-flex;
  align-items: stretch;
  align-self: flex-start;
  padding: 2px;
  gap: 2px;
  border-radius: calc(var(--seg-h) / 2);
  flex-shrink: 0;
  user-select: none;
  touch-action: pan-y;
}

.vl-seg-track.size-sm {
  --seg-h: 26px;
}

.vl-seg-track.full-width {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  width: 100%;
  align-self: stretch;
}

.vl-seg-track.surf-activity {
  background-color: var(--bg-activity);
}

.vl-seg-track.surf-surface {
  background-color: var(--bg-surface);
}

.vl-seg-track.surf-base {
  background-color: var(--bg-base);
}

.vl-seg-indicator {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  border-radius: calc((var(--seg-h) - 4px) / 2);
  background-color: transparent;
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

.vl-seg-indicator::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: var(--accent-primary);
  transform-origin: center;
  transform: scale(1, 1);
  will-change: transform;
  transition: transform 0.26s var(--ease-standard);
}

.vl-seg-indicator.pressed::before,
.vl-seg-indicator.dragging::before {
  transform: scale(1.08, 1.2);
}

.vl-seg-indicator.animated {
  transition:
    transform 0.32s var(--ease-standard),
    width 0.28s var(--ease-standard);
}

.vl-seg-indicator.dragging {
  transition: none;
}

.vl-seg-item {
  position: relative;
  z-index: 2;
  height: 100%;
  border-radius: calc((var(--seg-h) - 4px) / 2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 0;
  background-color: transparent;
  transition: color 0.14s var(--ease-standard) 0.04s;
}

.vl-seg-item:focus-visible {
  outline: none;
}

.vl-seg-track.full-width .vl-seg-item {
  width: 100%;
  padding-left: 6px;
  padding-right: 6px;
}

.vl-seg-track.size-md .vl-seg-item {
  padding: 0 12px;
  font-size: var(--ui-font-sm);
}

.vl-seg-track.size-sm .vl-seg-item {
  padding: 0 9px;
  font-size: var(--ui-font-xs);
}

@media (hover: hover) and (pointer: fine) {
  .vl-seg-item:hover {
    color: var(--text-primary);
  }
}

.vl-seg-item:active {
  color: var(--text-primary);
}

.vl-seg-item.active {
  color: var(--accent-primary-ink);
  transition: color 0.14s var(--ease-standard) 0.12s;
}

.vl-seg-track.dragging .vl-seg-item,
.vl-seg-track.dragging .vl-seg-item.active {
  transition: color 0.06s linear 0s;
}

/* Morph Grid Variant */
.vl-morph-grid {
  display: grid;
  gap: 6px;
  width: 100%;
  user-select: none;
}

.vl-morph-option {
  --morph-opt-h: var(--ui-row-height);
  height: var(--morph-opt-h);
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 8px;
  font-size: var(--ui-font-md);
  font-weight: 700;
  white-space: nowrap;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.15s var(--ease-decel),
    color 0.15s var(--ease-decel);
}

.vl-morph-option.size-sm {
  --morph-opt-h: 26px;
  font-size: var(--ui-font-sm);
}

@media (hover: hover) and (pointer: fine) {
  .vl-morph-option:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-morph-option:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.vl-morph-option.active {
  border-radius: calc(var(--morph-opt-h) / 2);
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}
</style>
