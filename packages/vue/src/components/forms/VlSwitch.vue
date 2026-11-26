<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    description?: string
    tone?: 'primary' | 'secondary'
    size?: 'sm' | 'md'
    disabled?: boolean
  }>(),
  {
    tone: 'primary',
    size: 'md',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const maxTravelPx = computed(() => (props.size === 'sm' ? 16 : 20))
const pressed = ref(false)
const dragging = ref(false)
const dragRatio = ref<number | null>(null)

let startX = 0
let startTime = 0
let maxDeltaAbs = 0
let startChecked = false
let suppressNextClick = false

const displayChecked = computed(() => {
  if (dragging.value && dragRatio.value !== null) {
    return dragRatio.value >= 0.5
  }
  return props.modelValue
})

const thumbStyle = computed<Record<string, string> | undefined>(() => {
  if (dragging.value && dragRatio.value !== null) {
    const px = (dragRatio.value * maxTravelPx.value).toFixed(2)
    return {
      transform: `translateX(${px}px)`,
      transition: 'none',
    } as Record<string, string>
  }
  return undefined
})

function onPointerDown(e: PointerEvent) {
  if (props.disabled) return
  if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
  startX = e.clientX
  startTime = Date.now()
  maxDeltaAbs = 0
  startChecked = props.modelValue
  pressed.value = true
  dragging.value = true
  dragRatio.value = startChecked ? 1 : 0

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowCancel)
  }
}

function onWindowMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - startX
  maxDeltaAbs = Math.max(maxDeltaAbs, Math.abs(dx))
  const span = maxTravelPx.value
  const base = startChecked ? 1 : 0
  dragRatio.value = Math.max(0, Math.min(1, base + dx / span))
}

function cleanupListeners() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowCancel)
  }
}

function finishDrag(e: PointerEvent | null, cancelled: boolean) {
  cleanupListeners()
  pressed.value = false
  if (!dragging.value) return

  const wasSwipe = !cancelled && maxDeltaAbs >= 5
  const ratio = dragRatio.value ?? (props.modelValue ? 1 : 0)
  const dx = e ? e.clientX - startX : 0
  const elapsed = Math.max(16, Date.now() - startTime)
  const velocity = dx / elapsed

  dragging.value = false
  dragRatio.value = null

  if (wasSwipe) {
    suppressNextClick = true
    setTimeout(() => {
      suppressNextClick = false
    }, 40)

    let nextValue: boolean
    if (Math.abs(velocity) > 0.25) {
      nextValue = velocity > 0
    } else {
      nextValue = ratio >= 0.5
    }
    if (nextValue !== props.modelValue) {
      emit('update:modelValue', nextValue)
    }
  }
}

function onWindowUp(e: PointerEvent) {
  finishDrag(e, false)
}

function onWindowCancel() {
  finishDrag(null, true)
}

function toggle() {
  if (props.disabled) return
  if (suppressNextClick) {
    suppressNextClick = false
    return
  }
  emit('update:modelValue', !props.modelValue)
}

onBeforeUnmount(() => {
  cleanupListeners()
})
</script>

<template>
  <button
    type="button"
    role="switch"
    class="vl-switch-row shape-rect"
    :class="{ 'is-disabled': disabled, 'is-dragging': dragging, 'has-text': Boolean(label || description) }"
    :aria-checked="modelValue"
    :disabled="disabled"
    @pointerdown="onPointerDown"
    @click="toggle"
  >
    <span v-if="label || description" class="vl-switch-text">
      <span v-if="label" class="vl-switch-label">{{ label }}</span>
      <span v-if="description" class="vl-switch-desc">{{ description }}</span>
    </span>

    <span
      class="vl-switch-track"
      :class="[`sz-${size}`, `t-${tone}`, { checked: displayChecked, dragging, pressed }]"
      aria-hidden="true"
    >
      <span class="vl-switch-thumb" :style="thumbStyle" />
    </span>
  </button>
</template>

<style scoped>
.vl-switch-row {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  user-select: none;
  touch-action: pan-y;
}

.vl-switch-row:focus-visible {
  outline: none;
}

.vl-switch-row:focus-visible .vl-switch-track {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.vl-switch-row.has-text {
  width: 100%;
}

.vl-switch-row.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.vl-switch-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.vl-switch-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-switch-desc {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.45;
}

.vl-switch-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background-color: var(--bg-chip);
  border: 1px solid var(--divider-strong);
  flex-shrink: 0;
  cursor: grab;
  touch-action: pan-y;
  transition:
    background-color 0.24s var(--ease-nonlinear),
    border-color 0.24s var(--ease-nonlinear);
}

.vl-switch-track.dragging {
  cursor: grabbing;
}

.vl-switch-track.sz-sm {
  width: 36px;
  height: 20px;
  border-radius: 10px;
}

.vl-switch-track.sz-md {
  width: 44px;
  height: 24px;
  border-radius: 12px;
}

.vl-switch-thumb {
  background-color: var(--text-secondary);
  transition:
    transform 0.2s var(--ease-accel-decel),
    border-radius 0.2s var(--ease-decel),
    background-color 0.16s var(--ease-decel);
}

.vl-switch-track.sz-sm .vl-switch-thumb {
  width: 12px;
  height: 12px;
  border-radius: 6px;
}

.vl-switch-track.sz-md .vl-switch-thumb {
  width: 16px;
  height: 16px;
  border-radius: 8px;
}

.vl-switch-track.checked.t-primary {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.vl-switch-track.checked.t-secondary {
  background-color: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.vl-switch-track.checked.sz-sm .vl-switch-thumb {
  transform: translateX(16px);
}

.vl-switch-track.checked.sz-md .vl-switch-thumb {
  transform: translateX(20px);
}

.vl-switch-track.checked.t-primary .vl-switch-thumb {
  background-color: var(--accent-primary-ink);
}

.vl-switch-track.checked.t-secondary .vl-switch-thumb {
  background-color: var(--accent-secondary-ink);
}
</style>
