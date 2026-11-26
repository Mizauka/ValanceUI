<script setup lang="ts">
import { computed } from 'vue'
import { useToast, type ToastMessage } from '../../composables/useToast'

const props = withDefaults(
  defineProps<{
    toast?: ToastMessage | null
    position?: 'bottom' | 'top'
    contained?: boolean
  }>(),
  {
    toast: undefined,
    position: 'bottom',
    contained: false,
  },
)

const store = useToast()
const activeToast = computed(() =>
  props.toast !== undefined ? props.toast : store.toast.value,
)

function handleDismiss() {
  if (props.toast === undefined) {
    store.dismiss()
  }
}
</script>

<template>
  <Transition name="vl-toast-fade">
    <div
      v-if="activeToast"
      class="vl-toast shape-pill"
      :class="[`t-${activeToast.tone}`, `pos-${position}`, { contained }]"
      role="status"
      @click="handleDismiss"
    >
      <span class="vl-toast-dot shape-circle" aria-hidden="true" />
      <span class="vl-toast-text">{{ activeToast.text }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.vl-toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 16px;
  font-size: var(--ui-font-md);
  font-weight: 700;
  max-width: calc(100vw - 28px);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.vl-toast.contained {
  position: absolute;
  max-width: calc(100% - 24px);
}

.vl-toast.pos-bottom {
  bottom: 38px;
}

.vl-toast.pos-top {
  top: 52px;
}

@media (max-width: 640px) {
  .vl-toast.pos-bottom:not(.contained) {
    bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  }
}

.vl-toast.t-info {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-toast.t-success {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-toast.t-warning {
  background-color: var(--accent-warning);
  color: var(--accent-warning-ink);
}

.vl-toast.t-error {
  background-color: var(--accent-danger);
  color: var(--accent-danger-ink);
}

.vl-toast-dot {
  width: 6px;
  height: 6px;
  background-color: currentColor;
  flex-shrink: 0;
}

.vl-toast-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-toast-fade-enter-active,
.vl-toast-fade-leave-active {
  transition: opacity 0.2s var(--ease-standard), transform 0.24s var(--ease-nonlinear);
}

.vl-toast-fade-enter-from,
.vl-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
