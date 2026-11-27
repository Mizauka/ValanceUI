<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    title?: string
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
    trigger?: 'click' | 'hover'
    width?: string
    closable?: boolean
  }>(),
  {
    placement: 'bottom-start',
    trigger: 'click',
    width: '260px',
    closable: false,
  },
)

const open = ref(false)
const hostRef = ref<HTMLElement | null>(null)
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function openMenu() {
  if (hoverTimer) clearTimeout(hoverTimer)
  open.value = true
}

function scheduleClose() {
  if (props.trigger !== 'hover') return
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    open.value = false
  }, 140)
}

function toggle() {
  if (props.trigger !== 'click') return
  open.value = !open.value
}

function onDocClick(e: MouseEvent) {
  if (!open.value || !hostRef.value) return
  if (!hostRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (hoverTimer) clearTimeout(hoverTimer)
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', onDocClick)
    document.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <div
    ref="hostRef"
    class="vl-popover-host"
    @mouseenter="trigger === 'hover' ? openMenu() : undefined"
    @mouseleave="scheduleClose"
  >
    <div class="vl-popover-trigger" @click="toggle">
      <slot name="trigger" :open="open" />
    </div>

    <Transition name="panel-fade">
      <div
        v-if="open"
        class="vl-popover-panel shape-rect"
        :class="`pos-${placement}`"
        :style="{ width }"
        role="dialog"
      >
        <div v-if="title || closable" class="vl-popover-head">
          <span class="vl-popover-title">{{ title }}</span>
          <button
            v-if="closable"
            type="button"
            class="vl-popover-close shape-circle"
            :aria-label="messages.common.close"
            @click="open = false"
          >
            <VlIcon name="close" :size="10" />
          </button>
        </div>
        <div class="vl-popover-body">
          <slot :close="() => (open = false)" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.vl-popover-host {
  position: relative;
  display: inline-flex;
}

.vl-popover-trigger {
  display: inline-flex;
  align-items: center;
}

.vl-popover-panel {
  position: absolute;
  z-index: 88;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vl-popover-panel.pos-bottom-start {
  top: calc(100% + 6px);
  left: 0;
}

.vl-popover-panel.pos-bottom-end {
  top: calc(100% + 6px);
  right: 0;
}

.vl-popover-panel.pos-top-start {
  bottom: calc(100% + 6px);
  left: 0;
}

.vl-popover-panel.pos-top-end {
  bottom: calc(100% + 6px);
  right: 0;
}

.vl-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-popover-title {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-popover-close {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-muted);
}

.vl-popover-body {
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.55;
}
</style>
