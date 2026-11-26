<script setup lang="ts">
import { computed } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'

const props = withDefaults(
  defineProps<{
    tone?: 'primary' | 'secondary' | 'info' | 'tip' | 'success' | 'warning' | 'danger'
    title?: string
    icon?: IconName
    closable?: boolean
  }>(),
  {
    tone: 'info',
    closable: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const defaultIconMap: Record<string, IconName> = {
  primary: 'sparkles',
  secondary: 'compass',
  info: 'info',
  tip: 'check-circle',
  success: 'check-circle',
  warning: 'warning',
  danger: 'alert-circle',
}

const resolvedIcon = computed(() => props.icon ?? defaultIconMap[props.tone] ?? 'info')
</script>

<template>
  <div class="vl-alert shape-rect" :class="`t-${tone}`" role="note">
    <VlIcon :name="resolvedIcon" :size="16" class="vl-alert-icon" />

    <div class="vl-alert-body">
      <div v-if="title" class="vl-alert-title">{{ title }}</div>
      <div class="vl-alert-content">
        <slot />
      </div>
    </div>

    <button
      v-if="closable"
      type="button"
      class="vl-alert-close shape-circle"
      aria-label="关闭提示"
      @click="emit('close')"
    >
      <VlIcon name="close" :size="11" />
    </button>
  </div>
</template>

<style scoped>
.vl-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-left: 4px solid var(--accent-info);
  background-color: var(--accent-info-soft);
  color: var(--text-secondary);
}

.vl-alert-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.vl-alert-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.vl-alert-title {
  font-size: var(--ui-font-md);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.vl-alert-content {
  font-size: var(--ui-font-md);
  line-height: 1.55;
}

.vl-alert-close {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  opacity: 0.72;
  flex-shrink: 0;
}

.vl-alert-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.vl-alert.t-primary {
  border-left-color: var(--accent-primary);
  background-color: var(--accent-primary-soft);
}

.vl-alert.t-primary .vl-alert-icon,
.vl-alert.t-primary .vl-alert-title {
  color: var(--accent-primary-text);
}

.vl-alert.t-secondary,
.vl-alert.t-tip {
  border-left-color: var(--accent-secondary);
  background-color: var(--accent-secondary-soft);
}

.vl-alert.t-secondary .vl-alert-icon,
.vl-alert.t-secondary .vl-alert-title,
.vl-alert.t-tip .vl-alert-icon,
.vl-alert.t-tip .vl-alert-title {
  color: var(--accent-secondary-text);
}

.vl-alert.t-info {
  border-left-color: var(--accent-info);
  background-color: var(--accent-info-soft);
}

.vl-alert.t-info .vl-alert-icon,
.vl-alert.t-info .vl-alert-title {
  color: var(--accent-info-text);
}

.vl-alert.t-success {
  border-left-color: var(--accent-success);
  background-color: var(--accent-success-soft);
}

.vl-alert.t-success .vl-alert-icon,
.vl-alert.t-success .vl-alert-title {
  color: var(--accent-success-text);
}

.vl-alert.t-warning {
  border-left-color: var(--accent-warning);
  background-color: var(--accent-warning-soft);
}

.vl-alert.t-warning .vl-alert-icon,
.vl-alert.t-warning .vl-alert-title {
  color: var(--accent-warning-text);
}

.vl-alert.t-danger {
  border-left-color: var(--accent-danger);
  background-color: var(--accent-danger-soft);
}

.vl-alert.t-danger .vl-alert-icon,
.vl-alert.t-danger .vl-alert-title {
  color: var(--accent-danger-text);
}
</style>
