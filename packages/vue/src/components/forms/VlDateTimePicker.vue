<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlButton from '../primitives/VlButton.vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import VlCalendar from './VlCalendar.vue'
import VlTimePicker from './VlTimePicker.vue'
import { useViewportTier } from '../../composables/useViewportTier'
import { useBackHandler } from '../../composables/useBackNavigation'

const props = withDefaults(
  defineProps<{
    /** ISO local datetime: YYYY-MM-DDTHH:mm */
    modelValue?: string
    label?: string
    hint?: string
    placeholder?: string
    tone?: 'primary' | 'secondary'
    format?: '24h' | '12h'
    disabled?: boolean
    teleport?: boolean
    /** On mobile viewports (<= 640px), defaults to opening a centered modal dialog */
    mobileMode?: 'dialog' | 'popover'
  }>(),
  {
    modelValue: '',
    placeholder: '选择日期与时间…',
    tone: 'primary',
    format: '24h',
    disabled: false,
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
const activeTab = ref<'date' | 'time'>('date')
const tabDirection = computed(() => (activeTab.value === 'time' ? 'vl-slide-h-next' : 'vl-slide-h-prev'))
const floatingStyle = ref<Record<string, string>>({})
const isClient = typeof window !== 'undefined'

const datePart = computed(() => {
  if (!props.modelValue) {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }
  return props.modelValue.split('T')[0] ?? ''
})

const timePart = computed(() => {
  if (!props.modelValue || !props.modelValue.includes('T')) return '09:30'
  return (props.modelValue.split('T')[1] ?? '09:30').slice(0, 5)
})

const displayFormatted = computed(() => {
  if (!props.modelValue) return ''
  return `${datePart.value} · ${timePart.value}`
})

function updateDate(d: string) {
  emit('update:modelValue', `${d}T${timePart.value}`)
  activeTab.value = 'time'
}

function updateTime(t: string) {
  emit('update:modelValue', `${datePart.value}T${t}`)
}

function updatePosition() {
  if (!isClient || !triggerRef.value || !props.teleport || isDialogMode.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const vw = window.innerWidth || 1024
  const vh = window.innerHeight || 768
  const spaceBelow = vh - rect.bottom - 10
  const preferUp = spaceBelow < 430 && rect.top > spaceBelow
  const width = Math.min(vw - 16, 312)
  const left = Math.max(8, Math.min(rect.left, vw - width - 8))
  floatingStyle.value = preferUp
    ? { position: 'fixed', left: `${left}px`, bottom: `${vh - rect.top + 4}px`, width: `${width}px`, zIndex: '260' }
    : { position: 'fixed', left: `${left}px`, top: `${rect.bottom + 4}px`, width: `${width}px`, zIndex: '260' }
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    activeTab.value = 'date'
    updatePosition()
  }
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
  <div ref="hostRef" class="vl-dt-field">
    <label v-if="label" class="vl-field-label">{{ label }}</label>

    <button
      ref="triggerRef"
      type="button"
      class="vl-dt-trigger shape-rect"
      :class="{ 'is-open': open, 'is-disabled': disabled, 'is-placeholder': !modelValue }"
      :disabled="disabled"
      :aria-expanded="open"
      @click="toggle"
    >
      <VlIcon name="calendar" :size="14" class="vl-dt-icon" />
      <span class="vl-dt-val">{{ displayFormatted || placeholder }}</span>
      <VlIcon name="clock" :size="13" class="vl-dt-clock" />
    </button>

    <Teleport to="body" :disabled="!teleport || !isClient">
      <Transition :name="isDialogMode ? 'sheet-backdrop' : 'panel-fade'">
        <div
          v-if="open"
          :class="isDialogMode ? 'vl-picker-dialog-overlay shape-rect' : 'vl-dt-pop-host'"
          :role="isDialogMode ? 'dialog' : undefined"
          :aria-modal="isDialogMode ? 'true' : undefined"
          :aria-label="isDialogMode ? (label || '选择日期与时间') : undefined"
          @click.self="isDialogMode && (open = false)"
        >
          <div
            ref="popoverRef"
            class="vl-dt-pop shape-rect"
            :class="{ 'is-inline': !teleport && !isDialogMode, 'is-dialog': isDialogMode }"
            :style="teleport && !isDialogMode ? floatingStyle : undefined"
          >
            <template v-if="isDialogMode">
              <div class="vl-dt-dialog-bar shape-rect" :class="`t-${tone}`" />
              <div class="vl-dt-dialog-head">
                <span class="vl-dt-dialog-title">{{ label || '选择日期与时间' }}</span>
                <VlIconButton
                  icon="close"
                  size="sm"
                  morph-on-hover
                  title="关闭"
                  aria-label="关闭"
                  class="vl-dt-dialog-close"
                  @click="open = false"
                />
              </div>
            </template>
            <div class="vl-dt-tabs">
            <span
              class="vl-dt-tab-bar shape-pill"
              :style="{ transform: `translateX(${activeTab === 'time' ? '100%' : '0%'})` }"
              aria-hidden="true"
            />
            <button
              type="button"
              class="vl-dt-tab shape-rect"
              :class="{ active: activeTab === 'date' }"
              @click="activeTab = 'date'"
            >
              <VlIcon name="calendar" :size="12" />
              <span>{{ datePart }}</span>
            </button>
            <button
              type="button"
              class="vl-dt-tab shape-rect"
              :class="{ active: activeTab === 'time' }"
              @click="activeTab = 'time'"
            >
              <VlIcon name="clock" :size="12" />
              <span>{{ timePart }}</span>
            </button>
          </div>

          <div class="vl-dt-body">
            <Transition :name="tabDirection">
              <VlCalendar
                v-if="activeTab === 'date'"
                key="dt-cal"
                :model-value="datePart"
                :tone="tone"
                embedded
                @select="updateDate"
              />
              <VlTimePicker
                v-else
                key="dt-time"
                :model-value="timePart"
                :tone="tone"
                :format="format"
                inline
                embedded
                @update:model-value="updateTime"
              />
            </Transition>
          </div>

          <div class="vl-dt-foot">
            <VlButton
              variant="primary"
              size="sm"
              shape="morph"
              class="vl-dt-done"
              @click="open = false"
            >
              完成选择
            </VlButton>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="hint" class="vl-field-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.vl-dt-field {
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

.vl-dt-trigger {
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

.vl-dt-trigger.is-open {
  border-color: var(--accent-primary);
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.vl-dt-trigger.is-disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.vl-dt-trigger.is-placeholder .vl-dt-val {
  color: var(--text-muted);
}

.vl-dt-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-dt-val {
  flex: 1;
  text-align: left;
  font-family: var(--font-mono);
  font-size: var(--ui-font-md);
  font-weight: 600;
}

.vl-dt-clock {
  color: var(--text-muted);
}

.vl-field-hint {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>

<style>
.vl-dt-pop {
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.vl-dt-pop.is-dialog {
  width: min(100%, 332px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  animation: vl-picker-dialog-in 0.22s var(--ease-decel);
}

.vl-dt-dialog-bar {
  height: 3px;
  width: 100%;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-dt-dialog-bar.t-secondary {
  background-color: var(--accent-secondary);
}

.vl-dt-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-dt-dialog-title {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-dt-dialog-close {
  width: 26px;
  height: 26px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.2s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-dt-dialog-close:hover,
.vl-dt-dialog-close:active {
  border-radius: 13px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-dt-pop.is-inline {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 312px;
  max-width: calc(100vw - 16px);
  z-index: 95;
}

.vl-dt-tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
}

.vl-dt-tab-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 50%;
  height: 3px;
  background-color: var(--accent-primary);
  pointer-events: none;
  z-index: 2;
  transition: transform 0.22s var(--ease-decel);
}

.vl-dt-tab {
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-secondary);
  transition:
    background-color 0.16s var(--ease-decel),
    color 0.16s var(--ease-decel);
}

.vl-dt-tab + .vl-dt-tab {
  border-left: 1px solid var(--divider-hairline);
}

.vl-dt-tab.active {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-dt-body {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.vl-dt-foot {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--divider-hairline);
}
</style>
