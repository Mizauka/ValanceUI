<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { DropdownItem } from './VlDropdown.vue'

withDefaults(
  defineProps<{
    items: DropdownItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'select', item: DropdownItem): void
}>()

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })
const menuRef = ref<HTMLElement | null>(null)
const isClient = typeof window !== 'undefined'

function openAt(e: MouseEvent) {
  if (!isClient) return
  const vw = window.innerWidth || 1024
  const vh = window.innerHeight || 768
  const x = Math.max(8, Math.min(e.clientX, vw - 208))
  const y = Math.max(8, Math.min(e.clientY, vh - 220))
  pos.value = { x, y }
  visible.value = true
}

function handleContextMenu(e: MouseEvent) {
  openAt(e)
}

function handleSelect(item: DropdownItem) {
  if (item.disabled || item.divider) return
  emit('select', item)
  visible.value = false
}

function onDocDown(e: MouseEvent) {
  if (!visible.value) return
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    visible.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') visible.value = false
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', onDocDown)
    document.removeEventListener('keydown', onKey)
  }
})
</script>

<template>
  <div class="vl-ctx-trigger" @contextmenu="disabled ? undefined : ($event.preventDefault(), handleContextMenu($event))">
    <slot />

    <Teleport to="body" :disabled="!isClient">
      <Transition name="panel-fade">
        <div
          v-if="visible"
          ref="menuRef"
          role="menu"
          class="vl-ctx-menu shape-rect"
          :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
        >
          <template v-for="item in items" :key="item.id">
            <div v-if="item.divider" class="vl-ctx-divider" />
            <button
              v-else
              type="button"
              role="menuitem"
              class="vl-ctx-item shape-rect"
              :class="{ danger: item.danger, disabled: item.disabled }"
              :disabled="item.disabled"
              @click="handleSelect(item)"
            >
              <VlIcon v-if="item.icon" :name="item.icon" :size="13" />
              <span class="vl-ctx-label">{{ item.label }}</span>
              <span v-if="item.shortcut" class="vl-ctx-shortcut">{{ item.shortcut }}</span>
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.vl-ctx-trigger {
  display: block;
}
</style>

<style>
.vl-ctx-menu {
  position: fixed;
  z-index: 280;
  min-width: 196px;
  padding: 4px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-ctx-divider {
  height: 1px;
  margin: 3px 4px;
  background-color: var(--divider-hairline);
}

.vl-ctx-item {
  width: 100%;
  height: 30px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ui-font-sm);
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
}

.vl-ctx-item:not(:disabled):hover {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-ctx-item.danger {
  color: var(--accent-danger-text);
}

.vl-ctx-item.danger:not(:disabled):hover {
  background-color: var(--accent-danger-soft);
}

.vl-ctx-item.disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.vl-ctx-label {
  flex: 1;
}

.vl-ctx-shortcut {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>
