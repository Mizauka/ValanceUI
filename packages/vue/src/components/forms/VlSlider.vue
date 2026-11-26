<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    label?: string
    unit?: string
    showValue?: boolean
    tone?: 'primary' | 'secondary'
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    unit: '',
    showValue: true,
    tone: 'primary',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const dragging = ref(false)

const percent = computed(() => {
  const span = Math.max(1e-9, props.max - props.min)
  return Math.max(0, Math.min(100, ((props.modelValue - props.min) / span) * 100))
})

function onPointerDown() {
  if (props.disabled) return
  dragging.value = true
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
  }
}

function stopDrag() {
  dragging.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointerup', stopDrag)
    window.removeEventListener('pointercancel', stopDrag)
  }
}

function onInput(e: Event) {
  const num = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(num)) emit('update:modelValue', num)
}

onBeforeUnmount(() => {
  stopDrag()
})
</script>

<template>
  <div class="vl-slider" :class="[`t-${tone}`, { 'is-disabled': disabled, 'is-dragging': dragging }]">
    <div v-if="label || showValue" class="vl-slider-head">
      <span v-if="label" class="vl-slider-label">{{ label }}</span>
      <span v-if="showValue" class="vl-slider-val">{{ modelValue }}{{ unit }}</span>
    </div>

    <div class="vl-slider-rail-wrap">
      <div class="vl-slider-track shape-rect">
        <div class="vl-slider-fill shape-rect" :style="{ width: `${percent}%` }" />
      </div>
      <div class="vl-slider-thumb" :style="{ left: `${percent}%` }" aria-hidden="true" />
      <input
        type="range"
        class="vl-slider-native"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        :aria-label="label"
        @pointerdown="onPointerDown"
        @input="onInput"
      />
    </div>
  </div>
</template>

<style scoped>
.vl-slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
  user-select: none;
}

.vl-slider.is-disabled {
  opacity: 0.45;
}

.vl-slider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vl-slider-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-secondary);
}

.vl-slider-val {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.vl-slider-rail-wrap {
  position: relative;
  height: 22px;
  display: flex;
  align-items: center;
}

.vl-slider-track {
  width: 100%;
  height: 4px;
  background-color: var(--bg-chip);
  overflow: hidden;
  transition: background-color 0.16s var(--ease-decel);
}

.vl-slider.is-dragging .vl-slider-track {
  background-color: var(--divider-strong);
}

.vl-slider-fill {
  height: 100%;
}

.vl-slider.t-primary .vl-slider-fill {
  background-color: var(--accent-primary);
}

.vl-slider.t-secondary .vl-slider-fill {
  background-color: var(--accent-secondary);
}

.vl-slider-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 0px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border: 2px solid var(--bg-base);
  transition:
    border-radius 0.2s var(--ease-decel),
    background-color 0.15s var(--ease-decel);
}

.vl-slider.t-primary .vl-slider-thumb {
  background-color: var(--accent-primary);
}

.vl-slider.t-secondary .vl-slider-thumb {
  background-color: var(--accent-secondary);
}

.vl-slider-rail-wrap:hover .vl-slider-thumb,
.vl-slider.is-dragging .vl-slider-thumb {
  border-radius: 7px;
}

.vl-slider-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}

.vl-slider-native:disabled {
  cursor: not-allowed;
}
</style>
