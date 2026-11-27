<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlButton from '../primitives/VlButton.vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import { useViewportTier } from '../../composables/useViewportTier'
import { useBackHandler } from '../../composables/useBackNavigation'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    /** HH:mm string (24-hour canonical format, e.g. '14:35') */
    modelValue?: string
    label?: string
    hint?: string
    placeholder?: string
    format?: '24h' | '12h'
    tone?: 'primary' | 'secondary'
    inline?: boolean
    embedded?: boolean
    disabled?: boolean
    teleport?: boolean
    /** On mobile viewports (<= 640px), defaults to opening a centered modal dialog */
    mobileMode?: 'dialog' | 'popover'
  }>(),
  {
    modelValue: '09:30',
    format: '24h',
    tone: 'primary',
    inline: false,
    embedded: false,
    disabled: false,
    teleport: true,
    mobileMode: 'dialog',
  },
)

const { isPhone } = useViewportTier({ phoneMaxWidth: 640 })
const isDialogMode = computed(() => !props.inline && props.mobileMode === 'dialog' && isPhone.value)

const emit = defineEmits<{
  (e: 'update:modelValue', hhmm: string): void
  (e: 'confirm', hhmm: string): void
}>()

function parseHHmm(raw?: string): { h: number; m: number } {
  if (!raw || !/^\d{1,2}:\d{2}$/.test(raw.trim())) return { h: 9, m: 30 }
  const [hs, ms] = raw.trim().split(':')
  const h = Math.max(0, Math.min(23, Number(hs) || 0))
  const m = Math.max(0, Math.min(59, Number(ms) || 0))
  return { h, m }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const hostRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const dialRef = ref<SVGSVGElement | null>(null)

const open = ref(false)
useBackHandler(
  computed(() => !props.inline && open.value),
  () => {
    open.value = false
    return true
  },
  280,
)
const activeMode = ref<'hour' | 'minute'>('hour')
const entryMode = ref<'dial' | 'input'>('dial')
const dragging = ref(false)
const floatingStyle = ref<Record<string, string>>({})
const isClient = typeof window !== 'undefined'

const initial = parseHHmm(props.modelValue)
const draftHour = ref(initial.h)
const draftMinute = ref(initial.m)
const manualHourText = ref(pad2(initial.h))
const manualMinText = ref(pad2(initial.m))

watch(
  () => props.modelValue,
  (val) => {
    const parsed = parseHHmm(val)
    draftHour.value = parsed.h
    draftMinute.value = parsed.m
    manualHourText.value = pad2(parsed.h)
    manualMinText.value = pad2(parsed.m)
  },
)

const formattedValue = computed(() => `${pad2(draftHour.value)}:${pad2(draftMinute.value)}`)

const displayText = computed(() => {
  if (!props.modelValue && !props.inline) return ''
  if (props.format === '12h') {
    const h12 = draftHour.value % 12 || 12
    const period = draftHour.value >= 12 ? 'PM' : 'AM'
    return `${pad2(h12)}:${pad2(draftMinute.value)} ${period}`
  }
  return formattedValue.value
})

const displayHourBox = computed(() => {
  if (props.format === '12h') return pad2(draftHour.value % 12 || 12)
  return pad2(draftHour.value)
})

const isPm = computed(() => draftHour.value >= 12)

const CENTER = 110
const OUTER_R = 84
const INNER_R = 54

interface DialTick {
  value: number
  label: string
  x: number
  y: number
  inner?: boolean
}

const hourTicks = computed<DialTick[]>(() => {
  const ticks: DialTick[] = []
  if (props.format === '12h') {
    for (let i = 1; i <= 12; i++) {
      const ang = ((i * 30 - 90) * Math.PI) / 180
      ticks.push({
        value: i % 12,
        label: String(i),
        x: CENTER + Math.cos(ang) * OUTER_R,
        y: CENTER + Math.sin(ang) * OUTER_R,
      })
    }
    return ticks
  }
  // 24h concentric rings: 1..12 outer, 13..23 & 00 inner (canonical M3 layout)
  for (let i = 1; i <= 12; i++) {
    const ang = ((i * 30 - 90) * Math.PI) / 180
    ticks.push({
      value: i === 12 ? 12 : i,
      label: String(i),
      x: CENTER + Math.cos(ang) * OUTER_R,
      y: CENTER + Math.sin(ang) * OUTER_R,
      inner: false,
    })
  }
  for (let i = 1; i <= 12; i++) {
    const val = i === 12 ? 0 : i + 12
    const ang = ((i * 30 - 90) * Math.PI) / 180
    ticks.push({
      value: val,
      label: val === 0 ? '00' : String(val),
      x: CENTER + Math.cos(ang) * INNER_R,
      y: CENTER + Math.sin(ang) * INNER_R,
      inner: true,
    })
  }
  return ticks
})

const minuteTicks = computed<DialTick[]>(() => {
  const ticks: DialTick[] = []
  for (let i = 0; i < 12; i++) {
    const val = i * 5
    const ang = ((val * 6 - 90) * Math.PI) / 180
    ticks.push({
      value: val,
      label: pad2(val),
      x: CENTER + Math.cos(ang) * OUTER_R,
      y: CENTER + Math.sin(ang) * OUTER_R,
    })
  }
  return ticks
})

const activeDialAngleDeg = computed(() => {
  if (activeMode.value === 'hour') {
    return (draftHour.value % 12) * 30
  }
  return draftMinute.value * 6
})

const continuousHandDeg = ref(activeDialAngleDeg.value)

watch(activeDialAngleDeg, (target) => {
  const curr = continuousHandDeg.value
  const normCurr = ((curr % 360) + 360) % 360
  let delta = ((target - normCurr) % 360 + 360) % 360
  if (delta > 180) delta -= 360
  continuousHandDeg.value = curr + delta
})

const activeDialRadius = computed(() => {
  if (activeMode.value === 'minute' || props.format === '12h') return OUTER_R
  // In 24h mode: outer = 1..12, inner = 0 or 13..23
  const h = draftHour.value
  return h === 0 || h >= 13 ? INNER_R : OUTER_R
})

const handGroupStyle = computed(() => ({
  transform: `rotate(${continuousHandDeg.value}deg)`,
  transformOrigin: `${CENTER}px ${CENTER}px`,
  transition: dragging.value
    ? 'none'
    : 'transform 0.22s var(--ease-decel)',
}))

function commitDraft(emitConfirm = false) {
  const next = `${pad2(draftHour.value)}:${pad2(draftMinute.value)}`
  manualHourText.value = pad2(draftHour.value)
  manualMinText.value = pad2(draftMinute.value)
  emit('update:modelValue', next)
  if (emitConfirm) emit('confirm', next)
}

function updateFromPointer(e: PointerEvent) {
  const svg = dialRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const scaleX = 220 / Math.max(1, rect.width)
  const scaleY = 220 / Math.max(1, rect.height)
  const dx = (e.clientX - rect.left) * scaleX - CENTER
  const dy = (e.clientY - rect.top) * scaleY - CENTER

  // Angle with 0 at 12 o'clock, increasing clockwise
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
  if (deg < 0) deg += 360

  if (activeMode.value === 'hour') {
    const sector = Math.round(deg / 30) % 12 // 0..11 (0 = 12 o'clock)
    if (props.format === '12h') {
      const baseH = sector === 0 ? 0 : sector
      draftHour.value = isPm.value ? (baseH === 0 ? 12 : baseH + 12) : baseH
    } else {
      const dist = Math.hypot(dx, dy)
      const isInner = dist < (INNER_R + OUTER_R) / 2
      if (isInner) {
        draftHour.value = sector === 0 ? 0 : sector + 12
      } else {
        draftHour.value = sector === 0 ? 12 : sector
      }
    }
  } else {
    draftMinute.value = Math.round(deg / 6) % 60
  }
  commitDraft(false)
}

function onDialPointerDown(e: PointerEvent) {
  if (props.disabled) return
  dragging.value = true
  ;(e.currentTarget as SVGSVGElement).setPointerCapture?.(e.pointerId)
  updateFromPointer(e)
}

function onDialPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  updateFromPointer(e)
}

function onDialPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  if (activeMode.value === 'hour') {
    activeMode.value = 'minute'
  }
}

function setPeriod(pm: boolean) {
  if (pm && draftHour.value < 12) draftHour.value += 12
  else if (!pm && draftHour.value >= 12) draftHour.value -= 12
  commitDraft(false)
}

function setNow() {
  const n = new Date()
  draftHour.value = n.getHours()
  draftMinute.value = n.getMinutes()
  commitDraft(false)
}

function applyManualInputs() {
  const h = Math.max(0, Math.min(23, parseInt(manualHourText.value, 10) || 0))
  const m = Math.max(0, Math.min(59, parseInt(manualMinText.value, 10) || 0))
  draftHour.value = h
  draftMinute.value = m
  commitDraft(false)
}

function updatePosition() {
  if (!isClient || !triggerRef.value || !props.teleport || isDialogMode.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const vw = window.innerWidth || 1024
  const vh = window.innerHeight || 768
  const popH = 380
  const spaceBelow = vh - rect.bottom - 10
  const preferUp = spaceBelow < popH && rect.top > spaceBelow
  const width = Math.min(vw - 16, 288)
  const left = Math.max(8, Math.min(rect.left, vw - width - 8))
  floatingStyle.value = preferUp
    ? { position: 'fixed', left: `${left}px`, bottom: `${vh - rect.top + 4}px`, width: `${width}px`, zIndex: '260' }
    : { position: 'fixed', left: `${left}px`, top: `${rect.bottom + 4}px`, width: `${width}px`, zIndex: '260' }
}

function openPopover() {
  if (props.disabled) return
  activeMode.value = 'hour'
  open.value = true
  updatePosition()
}

function onDocClick(e: MouseEvent) {
  if (!open.value || props.inline || isDialogMode.value) return
  const target = e.target as Node
  if (hostRef.value?.contains(target) || popoverRef.value?.contains(target)) return
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value && !props.inline) {
    open.value = false
  }
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
  <div ref="hostRef" class="vl-time-field" :class="[`t-${tone}`, { 'is-inline': inline }]">
    <label v-if="label && !inline" class="vl-field-label">{{ label }}</label>

    <!-- Popover Trigger -->
    <button
      v-if="!inline"
      ref="triggerRef"
      type="button"
      class="vl-time-trigger shape-rect"
      :class="{ 'is-open': open, 'is-disabled': disabled }"
      :disabled="disabled"
      :aria-expanded="open"
      @click="open ? (open = false) : openPopover()"
    >
      <VlIcon name="clock" :size="14" class="vl-time-icon" />
      <span class="vl-time-val">{{ displayText || placeholder || messages.timePicker.placeholder }}</span>
      <VlIcon name="chevron-down" :size="12" class="vl-time-caret" />
    </button>

    <!-- Clock Surface (Inline OR Desktop Floating Popover OR Mobile Centered Dialog) -->
    <Teleport to="body" :disabled="inline || !teleport || !isClient">
      <Transition :name="isDialogMode ? 'sheet-backdrop' : 'panel-fade'">
        <div
          v-if="inline || open"
          :class="isDialogMode ? 'vl-picker-dialog-overlay shape-rect' : 'vl-picker-pop-host'"
          :role="isDialogMode ? 'dialog' : undefined"
          :aria-modal="isDialogMode ? 'true' : undefined"
          :aria-label="isDialogMode ? (label || messages.timePicker.selectTime) : undefined"
          @click.self="isDialogMode && (open = false)"
        >
          <div
            ref="popoverRef"
            class="vl-time-card shape-rect"
            :class="[
              `t-${tone}`,
              {
                'is-embedded': embedded,
                'is-dialog': isDialogMode,
                'is-popover': !inline && !isDialogMode && teleport,
                'is-floating-inline': !inline && !isDialogMode && !teleport,
              },
            ]"
            :style="!inline && !isDialogMode && teleport ? floatingStyle : undefined"
          >
            <template v-if="isDialogMode">
              <div class="vl-picker-dialog-bar shape-rect" :class="`t-${tone}`" />
              <div class="vl-picker-dialog-head">
                <span class="vl-picker-dialog-title">{{ label || messages.timePicker.selectTime }}</span>
                <VlIconButton
                  icon="close"
                  size="sm"
                  morph-on-hover
                  :title="messages.common.close"
                  :aria-label="messages.common.close"
                  class="vl-picker-dialog-close"
                  @click="open = false"
                />
              </div>
            </template>

            <!-- Digital Time Header -->
          <div class="vl-time-header">
            <div class="vl-time-digits">
              <button
                type="button"
                class="vl-digit-box shape-rect"
                :class="{ active: activeMode === 'hour' }"
                :aria-label="messages.timePicker.selectHour"
                @click="activeMode = 'hour'"
              >
                {{ displayHourBox }}
              </button>
              <span class="vl-digit-colon">:</span>
              <button
                type="button"
                class="vl-digit-box shape-rect"
                :class="{ active: activeMode === 'minute' }"
                :aria-label="messages.timePicker.selectMinute"
                @click="activeMode = 'minute'"
              >
                {{ pad2(draftMinute) }}
              </button>
            </div>

            <div v-if="format === '12h'" class="vl-ampm-pill shape-pill">
              <button
                type="button"
                class="vl-ampm-btn shape-pill"
                :class="{ active: !isPm }"
                @click="setPeriod(false)"
              >
                AM
              </button>
              <button
                type="button"
                class="vl-ampm-btn shape-pill"
                :class="{ active: isPm }"
                @click="setPeriod(true)"
              >
                PM
              </button>
            </div>
            <span v-else class="vl-24h-badge shape-pill">24H</span>
          </div>

          <!-- Analog Clock Dial (Material Expressive Style) OR Keyboard Fallback -->
          <Transition name="panel-fade" mode="out-in">
            <div v-if="entryMode === 'dial'" key="mode-dial" class="vl-clock-stage">
              <svg
                ref="dialRef"
                class="vl-clock-svg"
                viewBox="0 0 220 220"
                role="slider"
                :aria-label="activeMode === 'hour' ? messages.timePicker.dialHourAria : messages.timePicker.dialMinuteAria"
                :aria-valuenow="activeMode === 'hour' ? draftHour : draftMinute"
                @pointerdown="onDialPointerDown"
                @pointermove="onDialPointerMove"
                @pointerup="onDialPointerUp"
                @pointercancel="onDialPointerUp"
              >
                <!-- Outer Circle Face -->
                <circle :cx="CENTER" :cy="CENTER" r="102" class="vl-clock-face" />

                <!-- Subtle Inner Ring Guide for 24h inner hours -->
                <circle
                  v-if="activeMode === 'hour' && format === '24h'"
                  :cx="CENTER"
                  :cy="CENTER"
                  :r="INNER_R"
                  class="vl-clock-inner-guide"
                />

                <!-- Rotatable Animated Clock Hand Line + Knob (12 o'clock upright ref -> rotated smoothly) -->
                <g class="vl-clock-hand-group" :style="handGroupStyle">
                  <line
                    :x1="CENTER"
                    :y1="CENTER"
                    :x2="CENTER"
                    :y2="CENTER - activeDialRadius"
                    class="vl-clock-hand"
                  />
                  <circle :cx="CENTER" :cy="CENTER - activeDialRadius" r="16" class="vl-clock-knob" />
                  <circle
                    v-if="activeMode === 'minute' && draftMinute % 5 !== 0"
                    :cx="CENTER"
                    :cy="CENTER - activeDialRadius"
                    r="2.8"
                    class="vl-clock-knob-dot"
                  />
                </g>
                <circle :cx="CENTER" :cy="CENTER" r="4" class="vl-clock-pivot" />

                <!-- Hour / Minute Numbers with subtle crossfade -->
                <g v-if="activeMode === 'hour'" key="ticks-hour" class="vl-ticks-fade">
                  <g v-for="t in hourTicks" :key="`${t.value}-${t.inner ? 'in' : 'out'}`">
                    <text
                      :x="t.x"
                      :y="t.y + 4"
                      text-anchor="middle"
                      class="vl-clock-num"
                      :class="{
                        selected: t.value === draftHour || (format === '12h' && t.value === (draftHour % 12)),
                        inner: t.inner,
                      }"
                    >
                      {{ t.label }}
                    </text>
                  </g>
                </g>

                <g v-else key="ticks-minute" class="vl-ticks-fade">
                  <g v-for="t in minuteTicks" :key="t.value">
                    <text
                      :x="t.x"
                      :y="t.y + 4"
                      text-anchor="middle"
                      class="vl-clock-num"
                      :class="{ selected: t.value === draftMinute }"
                    >
                      {{ t.label }}
                    </text>
                  </g>
                </g>
              </svg>
            </div>

            <div v-else key="mode-input" class="vl-manual-stage">
              <div class="vl-manual-pair">
                <div class="vl-manual-col">
                  <label class="vl-manual-lbl">{{ messages.timePicker.hourLabel }}</label>
                  <input
                    v-model="manualHourText"
                    type="number"
                    min="0"
                    max="23"
                    class="vl-manual-input shape-rect"
                    @change="applyManualInputs"
                  />
                </div>
                <span class="vl-digit-colon">:</span>
                <div class="vl-manual-col">
                  <label class="vl-manual-lbl">{{ messages.timePicker.minuteLabel }}</label>
                  <input
                    v-model="manualMinText"
                    type="number"
                    min="0"
                    max="59"
                    class="vl-manual-input shape-rect"
                    @change="applyManualInputs"
                  />
                </div>
              </div>
            </div>
          </Transition>

          <!-- Footer Controls -->
          <div class="vl-time-footer">
            <VlIconButton
              :icon="entryMode === 'dial' ? 'type' : 'clock'"
              size="sm"
              morph-on-hover
              :title="entryMode === 'dial' ? messages.timePicker.switchToInput : messages.timePicker.switchToDial"
              class="vl-time-mode-btn"
              @click="entryMode = entryMode === 'dial' ? 'input' : 'dial'"
            />

            <div class="vl-time-actions">
              <VlButton size="sm" variant="neutral" shape="morph" class="vl-time-ghost" @click="setNow">
                {{ messages.common.now }}
              </VlButton>
              <VlButton
                v-if="!inline"
                size="sm"
                variant="primary"
                shape="morph"
                class="vl-time-confirm"
                @click="commitDraft(true); open = false"
              >
                {{ messages.common.ok }}
              </VlButton>
            </div>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="hint && !inline" class="vl-field-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.vl-time-field {
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

.vl-time-trigger {
  height: var(--ui-row-height);
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.vl-time-trigger.is-open {
  border-color: var(--accent-primary);
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.vl-time-icon {
  color: var(--accent-primary-text);
}

.vl-time-val {
  flex: 1;
  text-align: left;
  font-family: var(--font-mono);
  font-size: var(--ui-font-md);
  font-weight: 700;
}

.vl-time-caret {
  color: var(--text-muted);
}

.vl-field-hint {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>

<style>
.vl-picker-pop-host {
  width: 100%;
}

.vl-picker-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 260;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(24, 21, 18, 0.44);
}

.vl-picker-dialog-bar {
  height: 3px;
  width: calc(100% + 24px);
  margin: -12px -12px 0 -12px;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-picker-dialog-bar.t-secondary {
  background-color: var(--accent-secondary);
}

.vl-picker-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: -10px -12px 0 -12px;
  padding: 10px 12px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-picker-dialog-title {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-picker-dialog-close {
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

.vl-picker-dialog-close:hover,
.vl-picker-dialog-close:active {
  border-radius: 13px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-time-card {
  width: 288px;
  max-width: 100%;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  user-select: none;
  touch-action: none;
}

.vl-time-card.is-dialog {
  width: min(100%, 324px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  animation: vl-picker-dialog-in 0.22s var(--ease-decel);
}

@keyframes vl-picker-dialog-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vl-time-card.is-embedded {
  width: 100%;
  border: none;
}

.vl-time-card.is-floating-inline {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 95;
}

.vl-time-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vl-time-digits {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.vl-digit-box {
  min-width: 58px;
  height: 46px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.vl-digit-box.active {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

.vl-time-card.t-secondary .vl-digit-box.active {
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  outline-color: var(--accent-secondary);
}

.vl-digit-colon {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-muted);
}

.vl-24h-badge {
  padding: 2px 9px;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  background-color: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid var(--divider-hairline);
}

.vl-ampm-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  gap: 2px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.vl-ampm-btn {
  width: 38px;
  height: 24px;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  color: var(--text-secondary);
  transition: background-color 0.2s var(--ease-nonlinear), color 0.2s var(--ease-nonlinear);
}

.vl-ampm-btn.active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-time-card.t-secondary .vl-ampm-btn.active {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-clock-stage {
  display: flex;
  justify-content: center;
  padding: 2px 0;
}

.vl-clock-svg {
  width: 220px;
  height: 220px;
  display: block;
  cursor: pointer;
  touch-action: none;
}

.vl-clock-face {
  fill: var(--bg-surface);
  stroke: var(--divider-hairline);
  stroke-width: 1;
}

.vl-clock-inner-guide {
  fill: none;
  stroke: var(--divider-hairline);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.vl-clock-hand {
  stroke: var(--accent-primary);
  stroke-width: 2.2;
  stroke-linecap: round;
  transition: y2 0.2s var(--ease-decel);
}

.vl-clock-knob {
  fill: var(--accent-primary);
  transition: cy 0.2s var(--ease-decel);
}

.vl-clock-pivot {
  fill: var(--accent-primary);
}

.vl-clock-knob-dot {
  fill: var(--accent-primary-ink);
  transition: cy 0.2s var(--ease-decel);
}

.vl-ticks-fade {
  animation: vl-ticks-in 0.18s var(--ease-decel);
}

@keyframes vl-ticks-in {
  from {
    opacity: 0.25;
  }
  to {
    opacity: 1;
  }
}

.vl-time-card.t-secondary .vl-clock-hand {
  stroke: var(--accent-secondary);
}
.vl-time-card.t-secondary .vl-clock-knob,
.vl-time-card.t-secondary .vl-clock-pivot {
  fill: var(--accent-secondary);
}
.vl-time-card.t-secondary .vl-clock-knob-dot {
  fill: var(--accent-secondary-ink);
}

.vl-clock-num {
  font-size: 13px;
  font-weight: 700;
  fill: var(--text-primary);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.vl-clock-num.inner {
  font-size: 11px;
  fill: var(--text-secondary);
}

.vl-clock-num.selected {
  fill: var(--accent-primary-ink);
  font-weight: 800;
}

.vl-time-card.t-secondary .vl-clock-num.selected {
  fill: var(--accent-secondary-ink);
}

.vl-manual-stage {
  padding: 16px 6px;
}

.vl-manual-pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.vl-manual-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vl-manual-lbl {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  text-align: center;
}

.vl-manual-input {
  width: 72px;
  height: 44px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 800;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-strong);
  color: var(--text-primary);
}

.vl-time-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--divider-hairline);
}

.vl-time-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
