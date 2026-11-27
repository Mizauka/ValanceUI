<script setup lang="ts">
import { ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    shape?: 'rect' | 'pill'
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    prefixIcon?: IconName
    clearable?: boolean
    disabled?: boolean
    readonly?: boolean
    autofocus?: boolean
    list?: string
    step?: string | number
    min?: string | number
    max?: string | number
    name?: string
    autocomplete?: string
    ariaLabel?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
    shape: 'rect',
    clearable: false,
    disabled: false,
    readonly: false,
    autofocus: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
  (e: 'change', event: Event): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({
  focus,
  getInput: () => inputRef.value,
})
</script>

<template>
  <div class="vl-field" :class="{ 'has-error': Boolean(error), 'is-disabled': disabled }">
    <label v-if="label" class="vl-field-label">{{ label }}</label>

    <div
      class="vl-input-box"
      :class="{ 'is-pill': shape === 'pill', 'has-error': Boolean(error), 'is-disabled': disabled }"
    >
      <slot name="prefix">
        <VlIcon v-if="prefixIcon" :name="prefixIcon" :size="14" class="vl-input-lead" />
      </slot>

      <input
        ref="inputRef"
        class="vl-input-native"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autofocus="autofocus"
        :list="list"
        :step="step"
        :min="min"
        :max="max"
        :name="name"
        :autocomplete="autocomplete"
        :aria-label="ariaLabel ?? label ?? placeholder"
        @input="onInput"
        @change="emit('change', $event)"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
        @keydown="emit('keydown', $event)"
      />

      <button
        v-if="clearable && String(modelValue).length > 0 && !disabled && !readonly"
        type="button"
        class="vl-input-clear shape-circle"
        :title="messages.common.clear"
        :aria-label="messages.common.clear"
        @click="clear"
      >
        <VlIcon name="close" :size="10" />
      </button>

      <slot name="suffix" />
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

.vl-field-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
}

.vl-input-box {
  height: var(--ui-row-height);
  border-radius: 0px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px 0 12px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition:
    background-color 0.14s var(--ease-decel),
    border-color 0.14s var(--ease-decel),
    outline-color 0.14s var(--ease-decel);
}

.vl-input-box.is-pill {
  border-radius: calc(var(--ui-row-height) / 2);
}

.vl-input-box:focus-within {
  background-color: var(--bg-base);
  border-color: var(--accent-primary);
  outline-color: var(--accent-primary);
}

.vl-input-box.has-error {
  outline-color: var(--accent-danger);
}

.vl-input-box.is-disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.vl-input-lead {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-input-native {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: var(--ui-font-md);
  color: var(--text-primary);
}

.vl-input-native::placeholder {
  color: var(--text-muted);
}

.vl-input-native:disabled {
  cursor: not-allowed;
}

.vl-input-clear {
  width: 19px;
  height: 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: background-color 0.15s var(--ease-standard), color 0.15s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .vl-input-clear:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
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
  line-height: 1.5;
}
</style>
