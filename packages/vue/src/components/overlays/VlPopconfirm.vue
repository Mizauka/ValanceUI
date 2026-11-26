<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlButton from '../primitives/VlButton.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    tone?: 'danger' | 'warning' | 'primary'
    align?: 'left' | 'right'
  }>(),
  {
    confirmText: '确认',
    cancelText: '取消',
    tone: 'danger',
    align: 'left',
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const open = ref(false)
const hostRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (!open.value || !hostRef.value) return
  if (!hostRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => {
  if (typeof document !== 'undefined') document.addEventListener('mousedown', onDocClick)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('mousedown', onDocClick)
})

function handleConfirm() {
  open.value = false
  emit('confirm')
}

function handleCancel() {
  open.value = false
  emit('cancel')
}
</script>

<template>
  <div ref="hostRef" class="vl-popconfirm-host">
    <div class="vl-popconfirm-trigger" @click="open = !open">
      <slot />
    </div>

    <Transition name="panel-fade">
      <div
        v-if="open"
        class="vl-popconfirm-box shape-rect"
        :class="[`t-${tone}`, `align-${align}`]"
        role="alertdialog"
      >
        <div class="vl-popconfirm-top">
          <VlIcon name="warning" :size="15" class="vl-popconfirm-icon" />
          <div class="vl-popconfirm-copy">
            <strong class="vl-popconfirm-title">{{ title }}</strong>
            <p v-if="description" class="vl-popconfirm-desc">{{ description }}</p>
          </div>
        </div>

        <div class="vl-popconfirm-actions">
          <VlButton size="xs" variant="neutral" shape="morph" class="vl-pc-btn cancel" @click="handleCancel">
            {{ cancelText }}
          </VlButton>
          <VlButton
            size="xs"
            :variant="tone === 'primary' ? 'primary' : 'danger'"
            shape="morph"
            class="vl-pc-btn confirm"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </VlButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.vl-popconfirm-host {
  position: relative;
  display: inline-flex;
}

.vl-popconfirm-trigger {
  display: inline-flex;
}

.vl-popconfirm-box {
  position: absolute;
  top: calc(100% + 6px);
  z-index: 90;
  width: 248px;
  padding: 10px 12px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  border-left: 3px solid var(--accent-danger);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vl-popconfirm-box.align-left {
  left: 0;
}

.vl-popconfirm-box.align-right {
  right: 0;
}

.vl-popconfirm-box.t-warning {
  border-left-color: var(--accent-warning);
}

.vl-popconfirm-box.t-primary {
  border-left-color: var(--accent-primary);
}

.vl-popconfirm-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.vl-popconfirm-icon {
  margin-top: 2px;
  color: var(--accent-danger-text);
  flex-shrink: 0;
}

.vl-popconfirm-box.t-warning .vl-popconfirm-icon {
  color: var(--accent-warning-text);
}

.vl-popconfirm-box.t-primary .vl-popconfirm-icon {
  color: var(--accent-primary-text);
}

.vl-popconfirm-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-popconfirm-title {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-popconfirm-desc {
  margin: 0;
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  line-height: 1.45;
}

.vl-popconfirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.vl-pc-btn {
  height: 24px;
  padding: 0 11px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
}

.vl-pc-btn.cancel {
  background-color: var(--bg-chip);
  color: var(--text-secondary);
}

.vl-pc-btn.confirm {
  background-color: var(--accent-danger);
  color: var(--accent-danger-ink);
}

.vl-popconfirm-box.t-warning .vl-pc-btn.confirm {
  background-color: var(--accent-warning);
  color: var(--accent-warning-ink);
}

.vl-popconfirm-box.t-primary .vl-pc-btn.confirm {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}
</style>
