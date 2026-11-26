<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import VlScrollArea from '../layout/VlScrollArea.vue'

export interface SelectOption {
  value: string | number
  label: string
  description?: string
  icon?: IconName
  badge?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SelectOption[]
    shape?: 'rect' | 'pill'
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
    searchPlaceholder?: string
    emptyText?: string
    ariaLabel?: string
    teleport?: boolean
  }>(),
  {
    modelValue: '',
    shape: 'rect',
    placeholder: '请选择…',
    disabled: false,
    searchable: false,
    searchPlaceholder: '搜索选项…',
    emptyText: '无匹配选项',
    teleport: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', option: SelectOption): void
}>()

const hostRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const open = ref(false)
const query = ref('')
const highlightedIndex = ref(-1)
const floatingStyle = ref<Record<string, string>>({})
const dropDirection = ref<'down' | 'up'>('down')

const isClient = typeof window !== 'undefined'

const selectedOption = computed(() =>
  props.options.find((o) => String(o.value) === String(props.modelValue ?? '')) ?? null,
)

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      String(opt.value).toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q)),
  )
})

function updatePosition() {
  if (!isClient || !triggerRef.value || !props.teleport) return
  const rect = triggerRef.value.getBoundingClientRect()
  const vw = window.innerWidth || 1024
  const vh = window.innerHeight || 768
  const maxHeight = Math.max(140, Math.min(320, vh - 24))
  const width = Math.min(vw - 16, Math.max(rect.width, 180))
  const left = Math.max(8, Math.min(rect.left, vw - width - 8))

  // Unified WinUI ComboBox positioning for BOTH searchable & non-searchable selects:
  // Aligns the active option directly over the trigger row (offsetting cleanly for the top capsule search box
  // when searchable) and expands top & bottom edges outward simultaneously around the anchor band.
  const selIdx = Math.max(
    0,
    filteredOptions.value.findIndex((o) => String(o.value) === String(props.modelValue ?? '')),
  )
  const estItemH = Math.max(34, Math.round(rect.height || 34)) + 2
  const searchHeaderH = props.searchable ? estItemH + 14 : 0
  const estMenuH = Math.max(
    54,
    Math.min(maxHeight, searchHeaderH + Math.max(1, filteredOptions.value.length) * estItemH + 10),
  )
  const desiredTop = rect.top - (searchHeaderH + selIdx * estItemH + 5)
  const clampedTop = Math.max(8, Math.min(desiredTop, vh - estMenuH - 8))
  const triggerCenterY = rect.top + rect.height / 2
  const originPct = Math.round(
    Math.max(24, Math.min(76, ((triggerCenterY - clampedTop) / estMenuH) * 100)),
  )
  const clipTop = Math.max(20, Math.min(48, originPct - 4))
  const clipBottom = Math.max(20, Math.min(48, 96 - originPct))
  dropDirection.value = clampedTop < rect.top ? 'up' : 'down'
  floatingStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${clampedTop}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: '260',
    '--winui-origin-y': `${originPct}%`,
    '--winui-clip-top': `${clipTop}%`,
    '--winui-clip-bottom': `${clipBottom}%`,
  }
}

function openMenu() {
  if (props.disabled) return
  open.value = true
  query.value = ''
  const idx = filteredOptions.value.findIndex(
    (o) => !o.disabled && String(o.value) === String(props.modelValue ?? ''),
  )
  highlightedIndex.value = idx >= 0 ? idx : filteredOptions.value.findIndex((o) => !o.disabled)
  updatePosition()
  nextTick(() => {
    updatePosition()
    if (props.searchable) searchInputRef.value?.focus()
  })
}

function closeMenu(restoreFocus = false) {
  if (!open.value) return
  open.value = false
  query.value = ''
  if (restoreFocus) {
    triggerRef.value?.focus()
  }
}

function toggleMenu() {
  if (props.disabled) return
  if (open.value) closeMenu()
  else openMenu()
}

function selectOption(opt: SelectOption) {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt)
  closeMenu(true)
}

function moveHighlight(delta: number) {
  const list = filteredOptions.value
  if (!list.length) return
  let next = highlightedIndex.value
  for (let i = 0; i < list.length; i++) {
    next = (next + delta + list.length) % list.length
    if (!list[next]?.disabled) {
      highlightedIndex.value = next
      break
    }
  }
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!open.value) {
      openMenu()
    } else if (e.key === 'ArrowDown') {
      moveHighlight(1)
    } else if (e.key === 'ArrowUp') {
      moveHighlight(-1)
    } else {
      const target = filteredOptions.value[highlightedIndex.value]
      if (target) selectOption(target)
    }
  } else if (e.key === 'Escape') {
    closeMenu(true)
  }
}

function onMenuKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveHighlight(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveHighlight(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = filteredOptions.value[highlightedIndex.value]
    if (target) selectOption(target)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu(true)
  }
}

function onDocPointerDown(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (hostRef.value?.contains(target) || menuRef.value?.contains(target)) return
  closeMenu(false)
}

function onWindowReflow() {
  if (open.value) updatePosition()
}

watch(filteredOptions, (list) => {
  if (highlightedIndex.value >= list.length || list[highlightedIndex.value]?.disabled) {
    highlightedIndex.value = list.findIndex((o) => !o.disabled)
  }
})

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', onDocPointerDown)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowReflow, { passive: true })
    window.addEventListener('scroll', onWindowReflow, true)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', onDocPointerDown)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onWindowReflow)
    window.removeEventListener('scroll', onWindowReflow, true)
  }
})
</script>

<template>
  <div ref="hostRef" class="vl-field" :class="{ 'is-open': open }">
    <label v-if="label" class="vl-field-label">{{ label }}</label>

    <button
      ref="triggerRef"
      type="button"
      role="combobox"
      class="vl-select-trigger shape-rect"
      :class="{ 'is-open': open, 'is-disabled': disabled, 'has-error': Boolean(error), 'is-placeholder': !selectedOption }"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="ariaLabel ?? label ?? placeholder"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <VlIcon v-if="selectedOption?.icon" :name="selectedOption.icon" :size="14" class="vl-select-lead-icon" />
      <span class="vl-select-value-text">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <span v-if="selectedOption?.badge" class="vl-select-val-badge shape-pill">
        {{ selectedOption.badge }}
      </span>
      <VlIcon
        name="chevron-down"
        :size="13"
        class="vl-select-caret"
        :class="{ flipped: open }"
      />
    </button>

    <Teleport to="body" :disabled="!teleport || !isClient">
      <Transition name="winui-flyout">
        <div
          v-if="open"
          ref="menuRef"
          role="listbox"
          class="vl-select-menu shape-rect"
          :class="[teleport ? 'is-teleported' : 'is-inline', `dir-${dropDirection}`]"
          :style="teleport ? floatingStyle : undefined"
          @keydown="onMenuKeydown"
        >
          <div v-if="searchable" class="vl-select-search-row">
            <div class="vl-select-search-pill">
              <VlIcon name="search" :size="13" class="vl-select-search-icon" />
              <input
                ref="searchInputRef"
                v-model="query"
                type="text"
                class="vl-select-search-input"
                :placeholder="searchPlaceholder"
                aria-label="过滤选项"
              />
            </div>
          </div>

          <VlScrollArea max-height="252px" class="vl-select-scroll">
            <div v-if="filteredOptions.length === 0" class="vl-select-empty">
              {{ emptyText }}
            </div>

            <button
              v-for="(opt, idx) in filteredOptions"
              :key="String(opt.value)"
              type="button"
              role="option"
              class="vl-select-option shape-rect"
              :class="{
                selected: selectedOption && String(selectedOption.value) === String(opt.value),
                highlighted: idx === highlightedIndex,
                disabled: opt.disabled,
              }"
              :aria-selected="Boolean(selectedOption && String(selectedOption.value) === String(opt.value))"
              :disabled="opt.disabled"
              @mouseenter="highlightedIndex = idx"
              @click="selectOption(opt)"
            >
              <span class="vl-opt-bar shape-rect" aria-hidden="true" />
              <VlIcon v-if="opt.icon" :name="opt.icon" :size="14" class="vl-opt-icon" />
              <span class="vl-opt-body">
                <span class="vl-opt-label">{{ opt.label }}</span>
                <span v-if="opt.description" class="vl-opt-desc">{{ opt.description }}</span>
              </span>
              <span v-if="opt.badge" class="vl-opt-badge shape-pill">{{ opt.badge }}</span>
              <VlIcon
                v-if="selectedOption && String(selectedOption.value) === String(opt.value)"
                name="check"
                :size="13"
                class="vl-opt-check"
              />
            </button>
          </VlScrollArea>
        </div>
      </Transition>
    </Teleport>

    <div v-if="error" class="vl-field-error">{{ error }}</div>
    <div v-else-if="hint" class="vl-field-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.vl-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.vl-field.is-open {
  z-index: 65;
}

.vl-field-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
}

.vl-select-trigger {
  position: relative;
  width: 100%;
  height: var(--ui-row-height);
  padding: 0 12px;
  border-radius: 0px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  border-bottom: 2px solid var(--divider-strong);
  outline: 2px solid transparent;
  outline-offset: -2px;
  text-align: left;
  color: var(--text-primary);
  cursor: pointer;
  transition:
    background-color 0.14s var(--ease-decel),
    border-color 0.14s var(--ease-decel),
    outline-color 0.14s var(--ease-decel);
}

@media (hover: hover) and (pointer: fine) {
  .vl-select-trigger:not(:disabled):hover {
    background-color: var(--bg-hover);
    border-color: var(--divider-strong);
  }
}

.vl-select-trigger.is-open,
.vl-select-trigger:focus-visible {
  background-color: var(--bg-base);
  border-color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  outline-color: transparent;
}

.vl-select-trigger.has-error {
  outline-color: var(--accent-danger);
  border-color: var(--accent-danger);
}

.vl-select-trigger.is-disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.vl-select-trigger.is-placeholder .vl-select-value-text {
  color: var(--text-muted);
}

.vl-select-lead-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-select-value-text {
  flex: 1;
  min-width: 0;
  font-size: var(--ui-font-md);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-select-val-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 1px 7px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  flex-shrink: 0;
}

.vl-select-caret {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.22s var(--ease-nonlinear), color 0.18s ease;
}

.vl-select-caret.flipped {
  transform: rotate(180deg);
  color: var(--accent-primary-text);
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
  line-height: 1.45;
}
</style>

<style>
/* Non-scoped so teleported body popup receives Valance CSS vars & flat geometry cleanly */
.vl-select-menu {
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vl-select-menu.is-inline {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 95;
}

.vl-select-search-row {
  padding: 7px 8px;
  border-bottom: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
}

.vl-select-search-pill {
  height: var(--ui-row-height);
  padding: 0 12px;
  border-radius: calc(var(--ui-row-height) / 2);
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition:
    background-color 0.14s var(--ease-decel),
    border-color 0.14s var(--ease-decel),
    outline-color 0.14s var(--ease-decel);
}

.vl-select-search-pill:focus-within {
  background-color: var(--bg-base);
  border-color: var(--accent-primary);
  outline-color: var(--accent-primary);
}

.vl-select-search-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-select-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--ui-font-md);
  outline: none;
}

.vl-select-scroll {
  padding: 5px;
}

.vl-select-empty {
  padding: 18px 12px;
  text-align: center;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
}

.vl-select-option {
  position: relative;
  width: 100%;
  min-height: var(--ui-row-height);
  padding: 5px 12px 5px 10px;
  border-radius: 0px;
  display: flex;
  align-items: center;
  gap: 9px;
  text-align: left;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition:
    background-color 0.12s var(--ease-decel),
    color 0.12s var(--ease-decel);
}

.vl-select-option + .vl-select-option {
  margin-top: 2px;
}

.vl-opt-bar {
  width: 3px;
  height: 16px;
  border-radius: 0px;
  background-color: transparent;
  flex-shrink: 0;
  opacity: 0;
  transition:
    opacity 0.14s var(--ease-decel),
    background-color 0.12s var(--ease-decel);
}

.vl-select-option.highlighted {
  background-color: var(--bg-hover);
}

.vl-select-option.selected {
  background-color: var(--bg-chip);
  color: var(--text-primary);
}

.vl-select-option.selected.highlighted {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-select-option.selected .vl-opt-bar {
  background-color: var(--accent-primary);
  opacity: 1;
  transform: scaleY(1);
}

.vl-select-option.disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.vl-opt-icon {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.vl-select-option.selected .vl-opt-icon {
  color: var(--accent-primary-text);
}

.vl-opt-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.vl-opt-label {
  font-size: var(--ui-font-md);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-opt-desc {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-opt-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 1px 7px;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.vl-opt-check {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}
</style>
