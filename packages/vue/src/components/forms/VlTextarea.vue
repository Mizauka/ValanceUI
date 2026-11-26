<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    maxlength?: number
    showCount?: boolean
    disabled?: boolean
    readonly?: boolean
    resize?: 'none' | 'vertical'
  }>(),
  {
    modelValue: '',
    rows: 3,
    showCount: false,
    disabled: false,
    readonly: false,
    resize: 'vertical',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const lengthText = computed(() => {
  const len = props.modelValue.length
  return props.maxlength ? `${len} / ${props.maxlength}` : `${len}`
})
</script>

<template>
  <div class="vl-field">
    <div v-if="label || showCount" class="vl-field-head">
      <label v-if="label" class="vl-field-label">{{ label }}</label>
      <span v-if="showCount" class="vl-field-count">{{ lengthText }}</span>
    </div>

    <div
      class="vl-textarea-box shape-rect"
      :class="{ 'has-error': Boolean(error), 'is-disabled': disabled }"
    >
      <textarea
        class="vl-textarea-native"
        :style="{ resize }"
        :rows="rows"
        :maxlength="maxlength"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div v-if="error" class="vl-field-error">{{ error }}</div>
    <div v-else-if="hint" class="vl-field-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.vl-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.vl-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vl-field-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
}

.vl-field-count {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.vl-textarea-box {
  background-color: var(--bg-elevated);
  padding: 8px 12px;
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition:
    background-color 0.16s var(--ease-standard),
    outline-color 0.18s var(--ease-standard);
}

.vl-textarea-box:focus-within {
  background-color: var(--bg-base);
  outline-color: var(--accent-primary);
}

.vl-textarea-box.has-error {
  outline-color: var(--accent-danger);
}

.vl-textarea-box.is-disabled {
  opacity: 0.52;
}

.vl-textarea-native {
  width: 100%;
  border: none;
  background: transparent;
  font-size: var(--ui-font-md);
  line-height: 1.6;
  color: var(--text-primary);
}

.vl-textarea-native::placeholder {
  color: var(--text-muted);
}

.vl-field-hint {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.5;
}

.vl-field-error {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--accent-danger-text);
}
</style>
