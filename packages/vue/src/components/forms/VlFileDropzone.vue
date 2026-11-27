<script setup lang="ts">
import { ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

export interface DroppedFileItem {
  name: string
  size: number
  type: string
  raw: File
}

const props = withDefaults(
  defineProps<{
    accept?: string
    multiple?: boolean
    disabled?: boolean
    title?: string
    subtitle?: string
  }>(),
  {
    multiple: true,
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'select', files: DroppedFileItem[]): void
  (e: 'remove', index: number): void
}>()

const dragActive = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<DroppedFileItem[]>([])

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function handleFileList(list: FileList | null) {
  if (!list || !list.length || props.disabled) return
  const next = Array.from(list).map((f) => ({
    name: f.name,
    size: f.size,
    type: f.type,
    raw: f,
  }))
  selectedFiles.value = props.multiple ? [...selectedFiles.value, ...next] : next.slice(0, 1)
  emit('select', selectedFiles.value)
}

function removeFile(idx: number) {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== idx)
  emit('remove', idx)
  emit('select', selectedFiles.value)
}
</script>

<template>
  <div class="vl-dropzone-wrap">
    <div
      class="vl-dropzone shape-rect"
      :class="{ dragging: dragActive, disabled }"
      role="button"
      tabindex="0"
      @click="!disabled && inputRef?.click()"
      @keydown.enter.prevent="!disabled && inputRef?.click()"
      @dragover.prevent="!disabled && (dragActive = true)"
      @dragleave.prevent="dragActive = false"
      @drop.prevent="dragActive = false; handleFileList($event.dataTransfer?.files ?? null)"
    >
      <input
        ref="inputRef"
        type="file"
        class="vl-dropzone-input"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        @change="handleFileList(($event.target as HTMLInputElement).files)"
      />
      <span class="vl-dropzone-badge shape-circle">
        <VlIcon name="upload" :size="18" />
      </span>
      <strong class="vl-dropzone-title">{{ title ?? messages.fileDropzone.title }}</strong>
      <span class="vl-dropzone-sub">{{ subtitle ?? messages.fileDropzone.subtitle }}</span>
    </div>

    <div v-if="selectedFiles.length" class="vl-dropzone-list">
      <div v-for="(file, idx) in selectedFiles" :key="`${file.name}-${idx}`" class="vl-file-row shape-rect">
        <VlIcon name="doc" :size="14" class="vl-file-icon" />
        <span class="vl-file-name">{{ file.name }}</span>
        <span class="vl-file-size">{{ formatSize(file.size) }}</span>
        <button type="button" class="vl-file-del shape-circle" :aria-label="messages.fileDropzone.removeFile" @click="removeFile(idx)">
          <VlIcon name="close" :size="10" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vl-dropzone-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vl-dropzone {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface);
  border: 1.5px dashed var(--divider-strong);
  cursor: pointer;
  text-align: center;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

@media (hover: hover) and (pointer: fine) {
  .vl-dropzone:not(.disabled):hover {
    background-color: var(--bg-elevated);
    border-color: var(--accent-primary);
  }
}

.vl-dropzone.dragging {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
}

.vl-dropzone.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vl-dropzone-input {
  display: none;
}

.vl-dropzone-badge {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  margin-bottom: 2px;
}

.vl-dropzone-title {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-dropzone-sub {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.vl-dropzone-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vl-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
}

.vl-file-icon {
  color: var(--accent-secondary-text);
  flex-shrink: 0;
}

.vl-file-name {
  flex: 1;
  min-width: 0;
  font-size: var(--ui-font-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-file-size {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.vl-file-del {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-muted);
}
</style>
