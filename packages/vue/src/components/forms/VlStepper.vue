<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    precision?: number
    label?: string
    hint?: string
    unit?: string
    decrementLabel?: string
    incrementLabel?: string
    showValue?: boolean
    disabled?: boolean
  }>(),
  {
    min: -Infinity,
    max: Infinity,
    step: 1,
    precision: 2,
    unit: '',
    decrementLabel: '-',
    incrementLabel: '+',
    showValue: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const canDec = computed(() => !props.disabled && props.modelValue - props.step >= props.min - 1e-9)
const canInc = computed(() => !props.disabled && props.modelValue + props.step <= props.max + 1e-9)

const formatted = computed(() => {
  const factor = 10 ** props.precision
  const rounded = Math.round(props.modelValue * factor) / factor
  return `${rounded}${props.unit}`
})

function adjust(delta: number) {
  if (props.disabled) return
  const factor = 10 ** props.precision
  const raw = Math.round((props.modelValue + delta) * factor) / factor
  const clamped = Math.max(props.min, Math.min(props.max, raw))
  emit('update:modelValue', clamped)
}
</script>

<template>
  <div class="vl-stepper-wrap" :class="{ 'has-label': Boolean(label) }">
    <div v-if="label || hint" class="vl-stepper-meta">
      <span v-if="label" class="vl-stepper-label">{{ label }}</span>
      <span v-if="hint" class="vl-stepper-hint">{{ hint }}</span>
    </div>

    <div class="vl-stepper-controls">
      <button
        type="button"
        class="vl-step-btn"
        :disabled="!canDec"
        :title="messages.stepper.decTitle(decrementLabel)"
        @click="adjust(-step)"
      >
        {{ decrementLabel }}
      </button>

      <span v-if="showValue" class="vl-step-value">{{ formatted }}</span>

      <button
        type="button"
        class="vl-step-btn"
        :disabled="!canInc"
        :title="messages.stepper.incTitle(incrementLabel)"
        @click="adjust(step)"
      >
        {{ incrementLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.vl-stepper-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  user-select: none;
}

.vl-stepper-wrap.has-label {
  width: 100%;
}

.vl-stepper-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-stepper-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-stepper-hint {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.vl-stepper-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.vl-step-btn {
  width: var(--ui-row-height);
  height: var(--ui-row-height);
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ui-font-md);
  font-weight: 800;
  background-color: var(--bg-chip);
  color: var(--text-primary);
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel),
    opacity 0.14s ease;
}

.vl-step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .vl-step-btn:not(:disabled):hover {
    border-radius: calc(var(--ui-row-height) / 2);
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.vl-step-btn:not(:disabled):active {
  border-radius: calc(var(--ui-row-height) / 2);
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-step-value {
  min-width: 44px;
  text-align: center;
  font-size: var(--ui-font-md);
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
</style>
