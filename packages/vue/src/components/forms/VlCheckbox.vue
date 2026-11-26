<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    description?: string
    indeterminate?: boolean
    tone?: 'primary' | 'secondary'
    disabled?: boolean
  }>(),
  {
    indeterminate: false,
    tone: 'primary',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    class="vl-check-row shape-rect"
    :class="{ 'is-disabled': disabled }"
    :aria-checked="indeterminate ? 'mixed' : modelValue"
    :disabled="disabled"
    @click="toggle"
  >
    <span
      class="vl-check-box shape-rect"
      :class="[`t-${tone}`, { checked: modelValue || indeterminate }]"
      aria-hidden="true"
    >
      <VlIcon v-if="indeterminate" name="minus" :size="11" />
      <VlIcon v-else-if="modelValue" name="check" :size="11" />
    </span>

    <span v-if="label || description" class="vl-check-text">
      <span v-if="label" class="vl-check-label">{{ label }}</span>
      <span v-if="description" class="vl-check-desc">{{ description }}</span>
    </span>
  </button>
</template>

<style scoped>
.vl-check-row {
  display: inline-flex;
  align-items: flex-start;
  gap: 9px;
  text-align: left;
  user-select: none;
}

.vl-check-row.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.vl-check-box {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-elevated);
  border: 2px solid var(--divider-strong);
  color: transparent;
  flex-shrink: 0;
  transition:
    background-color 0.2s var(--ease-nonlinear),
    border-color 0.2s var(--ease-nonlinear),
    color 0.2s var(--ease-nonlinear);
}

.vl-check-box.checked.t-primary {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-check-box.checked.t-secondary {
  background-color: var(--accent-secondary);
  border-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-check-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-check-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-check-desc {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.45;
}
</style>
