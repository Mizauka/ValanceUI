<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'

export interface DropdownItem {
  id: string
  label: string
  icon?: IconName
  shortcut?: string
  danger?: boolean
  divider?: boolean
  disabled?: boolean
}

withDefaults(
  defineProps<{
    items: DropdownItem[]
    align?: 'left' | 'right'
  }>(),
  {
    align: 'left',
  },
)

const emit = defineEmits<{
  (e: 'select', item: DropdownItem): void
}>()

const open = ref(false)
const hostRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function handleSelect(item: DropdownItem) {
  if (item.disabled || item.divider) return
  emit('select', item)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value || !hostRef.value) return
  if (!hostRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocClick)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocClick)
  }
})
</script>

<template>
  <div ref="hostRef" class="vl-dropdown-host">
    <div class="vl-dropdown-trigger" @click="toggle">
      <slot name="trigger" :open="open" />
    </div>

    <Transition name="winui-flyout">
      <div
        v-if="open"
        class="vl-dropdown-menu shape-rect"
        :class="`align-${align}`"
        role="menu"
      >
        <template v-for="item in items" :key="item.id">
          <div v-if="item.divider" class="vl-dropdown-divider" role="separator" />
          <button
            v-else
            type="button"
            role="menuitem"
            class="vl-dropdown-item shape-pill"
            :class="{ danger: item.danger, disabled: item.disabled }"
            :disabled="item.disabled"
            @click="handleSelect(item)"
          >
            <VlIcon v-if="item.icon" :name="item.icon" :size="13" />
            <span class="vl-dropdown-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="vl-dropdown-shortcut">{{ item.shortcut }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.vl-dropdown-host {
  position: relative;
  display: inline-flex;
}

.vl-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  z-index: 75;
  min-width: 180px;
  padding: 4px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-dropdown-menu.align-left {
  left: 0;
}

.vl-dropdown-menu.align-right {
  right: 0;
}

.vl-dropdown-divider {
  height: 1px;
  margin: 3px 4px;
  background-color: var(--divider-hairline);
}

.vl-dropdown-item {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ui-font-md);
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  transition: background-color 0.14s var(--ease-nonlinear), color 0.14s var(--ease-nonlinear);
}

.vl-dropdown-item:not(:disabled):hover {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-dropdown-item.danger {
  color: var(--accent-danger-text);
}

.vl-dropdown-item.danger:not(:disabled):hover {
  background-color: var(--accent-danger-soft);
  color: var(--accent-danger-text);
}

.vl-dropdown-item.disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.vl-dropdown-label {
  flex: 1;
  white-space: nowrap;
}

.vl-dropdown-shortcut {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>
