<script setup lang="ts">
import { ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlTag from '../primitives/VlTag.vue'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    label?: string
    hint?: string
    placeholder?: string
    maxTags?: number
    tone?: 'primary' | 'secondary' | 'neutral'
    shape?: 'pill' | 'rect'
    disabled?: boolean
  }>(),
  {
    maxTags: 20,
    tone: 'secondary',
    shape: 'pill',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', tags: string[]): void
}>()

const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function addTag(raw: string) {
  if (props.disabled) return
  const clean = raw.trim().replace(/^,|,$/g, '')
  if (!clean) return
  if (props.modelValue.includes(clean)) {
    draft.value = ''
    return
  }
  if (props.modelValue.length >= props.maxTags) return
  emit('update:modelValue', [...props.modelValue, clean])
  draft.value = ''
}

function removeAt(idx: number) {
  if (props.disabled) return
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== idx),
  )
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag(draft.value)
  } else if (e.key === 'Backspace' && !draft.value && props.modelValue.length > 0) {
    removeAt(props.modelValue.length - 1)
  }
}
</script>

<template>
  <div class="vl-field">
    <label v-if="label" class="vl-field-label">{{ label }}</label>

    <div
      class="vl-tag-input-box shape-rect"
      :class="{ 'is-disabled': disabled }"
      @click="inputRef?.focus()"
    >
      <VlTag
        v-for="(t, idx) in modelValue"
        :key="t"
        :tone="tone"
        :shape="shape"
        :closable="!disabled"
        @close="removeAt(idx)"
      >
        {{ t }}
      </VlTag>

      <input
        ref="inputRef"
        v-model="draft"
        type="text"
        class="vl-tag-input-raw"
        :placeholder="modelValue.length < maxTags ? (placeholder ?? messages.tagInput.placeholder) : messages.tagInput.maxItems(maxTags)"
        :disabled="disabled || modelValue.length >= maxTags"
        @keydown="onKeydown"
        @blur="addTag(draft)"
      />

      <button
        v-if="draft.trim() && !disabled"
        type="button"
        class="vl-tag-add-btn shape-circle"
        :aria-label="messages.tagInput.addTagAria"
        @click.stop="addTag(draft)"
      >
        <VlIcon name="plus" :size="11" />
      </button>
    </div>

    <div v-if="hint" class="vl-field-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.vl-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.vl-field-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-secondary);
}

.vl-tag-input-box {
  min-height: var(--ui-row-height);
  padding: 3px 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  cursor: text;
}

.vl-tag-input-box:focus-within {
  background-color: var(--bg-base);
  border-color: var(--accent-primary);
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.vl-tag-input-box.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.vl-tag-input-raw {
  flex: 1;
  min-width: 110px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--ui-font-sm);
  outline: none;
}

.vl-tag-add-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-field-hint {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>
