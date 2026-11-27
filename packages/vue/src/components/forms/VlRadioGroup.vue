<script setup lang="ts" generic="T extends string = string">
import { useLocale } from '../../composables/useLocale'

export interface RadioOption<V extends string = string> {
  value: V
  label: string
  description?: string
  disabled?: boolean
}

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: RadioOption<T>[]
    direction?: 'row' | 'column'
    variant?: 'circle' | 'card'
    tone?: 'primary' | 'secondary'
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    direction: 'column',
    variant: 'circle',
    tone: 'primary',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

function select(opt: RadioOption<T>) {
  if (props.disabled || opt.disabled || opt.value === props.modelValue) return
  emit('update:modelValue', opt.value)
}
</script>

<template>
  <div
    class="vl-radio-group"
    :class="[`dir-${direction}`, `v-${variant}`]"
    role="radiogroup"
    :aria-label="ariaLabel ?? messages.radioGroup.ariaLabel"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      class="vl-radio-item shape-rect"
      :class="[
        `t-${tone}`,
        { active: modelValue === opt.value, 'is-disabled': disabled || opt.disabled },
      ]"
      :aria-checked="modelValue === opt.value"
      :disabled="disabled || opt.disabled"
      @click="select(opt)"
    >
      <span class="vl-radio-outer shape-circle" aria-hidden="true">
        <span class="vl-radio-inner shape-circle" />
      </span>
      <span class="vl-radio-text">
        <span class="vl-radio-label">{{ opt.label }}</span>
        <span v-if="opt.description" class="vl-radio-desc">{{ opt.description }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.vl-radio-group {
  display: flex;
  gap: 8px;
}

.vl-radio-group.dir-row {
  flex-direction: row;
  flex-wrap: wrap;
}

.vl-radio-group.dir-column {
  flex-direction: column;
}

.vl-radio-item {
  display: inline-flex;
  align-items: flex-start;
  gap: 9px;
  text-align: left;
  user-select: none;
  transition: background-color 0.18s var(--ease-nonlinear), border-color 0.18s var(--ease-nonlinear);
}

.vl-radio-group.v-card .vl-radio-item {
  padding: 10px 12px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
}

.vl-radio-group.v-card .vl-radio-item.active.t-primary {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
}

.vl-radio-group.v-card .vl-radio-item.active.t-secondary {
  background-color: var(--accent-secondary-soft);
  border-color: var(--accent-secondary);
}

.vl-radio-item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.vl-radio-outer {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--divider-strong);
  background-color: var(--bg-elevated);
  flex-shrink: 0;
  transition: border-color 0.2s var(--ease-nonlinear);
}

.vl-radio-item.active.t-primary .vl-radio-outer {
  border-color: var(--accent-primary);
}

.vl-radio-item.active.t-secondary .vl-radio-outer {
  border-color: var(--accent-secondary);
}

.vl-radio-inner {
  width: 8px;
  height: 8px;
  transform: scale(0);
  transition: transform 0.24s var(--ease-expressive), background-color 0.2s ease;
}

.vl-radio-item.active.t-primary .vl-radio-inner {
  transform: scale(1);
  background-color: var(--accent-primary);
}

.vl-radio-item.active.t-secondary .vl-radio-inner {
  transform: scale(1);
  background-color: var(--accent-secondary);
}

.vl-radio-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-radio-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-radio-desc {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.45;
}
</style>
