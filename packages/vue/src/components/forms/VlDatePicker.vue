<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import VlCalendar from './VlCalendar.vue'
import { useViewportTier } from '../../composables/useViewportTier'
import { useBackHandler } from '../../composables/useBackNavigation'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    placeholder?: string
    min?: string
    max?: string
    tone?: 'primary' | 'secondary'
    disabled?: boolean
    clearable?: boolean
    teleport?: boolean
    /** On mobile viewports (<= 640px), defaults to opening a centered modal dialog */
    mobileMode?: 'dialog' | 'popover'
  }>(),
  {
    modelValue: '',
    placeholder: '选择日期 (YYYY-MM-DD)',
    tone: 'primary',
    disabled: false,
    clearable: false,
    teleport: true,
    mobileMode: 'dialog',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { isPhone } = useViewportTier({ phoneMaxWidth: 640 })
const isDialogMode = computed(() => props.mobileMode === 'dialog' && isPhone.value)

const hostRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const open = ref(false)
useBackHandler(
  open,
  () => {
    open.value = false
    return true
  },
  280,
)
const floatingStyle = ref<Record<string, string>>({})
const isClient = typeof window !== 'undefined'

function updatePosition() {
  if (!isClient || !triggerRef.value || !props.teleport || isDialogMode.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const vw = window.innerWidth || 1024
  const vh = window.innerHeight || 768
  const spaceBelow = vh - rect.bottom - 10
  const preferUp = spaceBelow < 340 && rect.top > spaceBelow
  const left = Math.max(8, Math.min(rect.left, vw - 320))
  floatingStyle.value = preferUp
    ? { position: 'fixed', left: `${left}px`, bottom: `${vh - rect.top + 4}px`, zIndex: '260' }
    : { position: 'fixed', left: `${left}px`, top: `${rect.bottom + 4}px`, zIndex: '260' }
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) updatePosition()
}

function handleSelect(val: string) {
  emit('update:modelValue', val)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value || isDialogMode.value) return
  const target = e.target as Node
  if (hostRef.value?.contains(target) || popoverRef.value?.contains(target)) return
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => {
  if (typeof document !== 'undefined') document.addEventListener('mousedown', onDocClick)
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updatePosition, { passive: true })
    window.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('mousedown', onDocClick)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updatePosition)
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <div ref="hostRef" class="vl-date-field">
    <label v-if="label" class="vl-field-label">{{ label }}</label>

    <button
      ref="triggerRef"
      type="button"
      class="vl-date-trigger shape-rect"
      :class="{ 'is-open': open, 'is-disabled': disabled, 'is-placeholder': !modelValue }"
      :disabled="disabled"
      :aria-expanded="open"
      @click="toggle"
    >
      <VlIcon name="calendar" :size="14" class="vl-date-icon" />
      <span class="vl-date-val">{{ modelValue || placeholder }}</span>
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="vl-date-clear shape-circle"
        aria-label="清除日期"
        @click.stop="emit('update:modelValue', '')"
      >
        <VlIcon name="close" :size="10" />
      </button>
      <VlIcon name="chevron-down" :size="12" class="vl-date-caret" />
    </button>

    <Teleport to="body" :disabled="!teleport || !isClient">
      <Transition :name="isDialogMode ? 'sheet-backdrop' : 'panel-fade'">
        <div
          v-if="open"
          :class="isDialogMode ? 'vl-picker-dialog-overlay shape-rect' : 'vl-date-pop-host'"
          :role="isDialogMode ? 'dialog' : undefined"
          :aria-modal="isDialogMode ? 'true' : undefined"
          :aria-label="isDialogMode ? (label || '选择日期') : undefined"
          @click.self="isDialogMode && (open = false)"
        >
          <div
            ref="popoverRef"
            class="vl-date-pop shape-rect"
            :class="{ 'is-inline': !teleport && !isDialogMode, 'is-dialog': isDialogMode }"
            :style="teleport && !isDialogMode ? floatingStyle : undefined"
          >
            <template v-if="isDialogMode">
              <div class="vl-date-dialog-bar shape-rect" :class="`t-${tone}`" />
              <div class="vl-date-dialog-head">
                <span class="vl-date-dialog-title">{{ label || '选择日期' }}</span>
                <VlIconButton
                  icon="close"
                  size="sm"
                  morph-on-hover
                  title="关闭"
                  aria-label="关闭"
                  class="vl-date-dialog-close"
                  @click="open = false"
                />
              </div>
            </template>
            <VlCalendar
              :model-value="modelValue"
              :min="min"
              :max="max"
              :tone="tone"
              :embedded="isDialogMode"
              @select="handleSelect"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="hint" class="vl-field-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.vl-date-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.vl-field-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-secondary);
}

.vl-date-trigger {
  height: var(--ui-row-height);
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  color: var(--text-primary);
  cursor: pointer;
}

.vl-date-trigger.is-open {
  border-color: var(--accent-primary);
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.vl-date-trigger.is-disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.vl-date-trigger.is-placeholder .vl-date-val {
  color: var(--text-muted);
}

.vl-date-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-date-val {
  flex: 1;
  text-align: left;
  font-family: var(--font-mono);
  font-size: var(--ui-font-md);
  font-weight: 600;
}

.vl-date-clear {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-muted);
}

.vl-date-caret {
  color: var(--text-muted);
}

.vl-date-pop.is-inline {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 95;
}

.vl-field-hint {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>

<style>
.vl-date-pop.is-dialog {
  width: min(100%, 328px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  animation: vl-picker-dialog-in 0.22s var(--ease-decel);
}

.vl-date-dialog-bar {
  height: 3px;
  width: 100%;
  background-color: var(--accent-primary);
}

.vl-date-dialog-bar.t-secondary {
  background-color: var(--accent-secondary);
}

.vl-date-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-date-dialog-title {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
}
</style>
