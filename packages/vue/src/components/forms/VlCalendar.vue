<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlButton from '../primitives/VlButton.vue'

const props = withDefaults(
  defineProps<{
    /** ISO Date string YYYY-MM-DD */
    modelValue?: string
    min?: string
    max?: string
    firstDayOfWeek?: 0 | 1
    tone?: 'primary' | 'secondary'
    showToday?: boolean
    embedded?: boolean
  }>(),
  {
    modelValue: '',
    firstDayOfWeek: 1,
    tone: 'primary',
    showToday: true,
    embedded: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', isoDate: string): void
  (e: 'select', isoDate: string): void
}>()

function parseIsoDate(iso?: string): { y: number; m: number; d: number } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [ys, ms, ds] = iso.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

function formatIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const now = new Date()
const todayIso = formatIso(now.getFullYear(), now.getMonth() + 1, now.getDate())

const initial = parseIsoDate(props.modelValue)
const viewYear = ref(initial?.y ?? now.getFullYear())
const viewMonth = ref(initial?.m ?? now.getMonth() + 1)
const pickerMode = ref<'days' | 'months'>('days')

watch(
  () => props.modelValue,
  (val) => {
    const parsed = parseIsoDate(val)
    if (parsed) {
      viewYear.value = parsed.y
      viewMonth.value = parsed.m
    }
  },
)

const WEEKDAYS_MON = ['一', '二', '三', '四', '五', '六', '日']
const WEEKDAYS_SUN = ['日', '一', '二', '三', '四', '五', '六']
const weekdays = computed(() => (props.firstDayOfWeek === 0 ? WEEKDAYS_SUN : WEEKDAYS_MON))

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

interface DayCell {
  iso: string
  day: number
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  disabled: boolean
}

function isIsoDisabled(iso: string): boolean {
  if (props.min && iso < props.min) return true
  if (props.max && iso > props.max) return true
  return false
}

const dayCells = computed<DayCell[]>(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDate = new Date(y, m - 1, 1)
  const jsDow = firstDate.getDay() // 0 Sun..6 Sat
  const lead = props.firstDayOfWeek === 1 ? (jsDow === 0 ? 6 : jsDow - 1) : jsDow

  const daysInMonth = new Date(y, m, 0).getDate()
  const prevMonthDays = new Date(y, m - 1, 0).getDate()
  const prevY = m === 1 ? y - 1 : y
  const prevM = m === 1 ? 12 : m - 1
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1

  const cells: DayCell[] = []

  for (let i = lead - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const iso = formatIso(prevY, prevM, day)
    cells.push({
      iso,
      day,
      inMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === props.modelValue,
      disabled: isIsoDisabled(iso),
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = formatIso(y, m, day)
    cells.push({
      iso,
      day,
      inMonth: true,
      isToday: iso === todayIso,
      isSelected: iso === props.modelValue,
      disabled: isIsoDisabled(iso),
    })
  }

  let tailDay = 1
  while (cells.length < 42) {
    const iso = formatIso(nextY, nextM, tailDay)
    cells.push({
      iso,
      day: tailDay,
      inMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === props.modelValue,
      disabled: isIsoDisabled(iso),
    })
    tailDay++
  }

  return cells
})

function stepMonth(delta: number) {
  let y = viewYear.value
  let m = viewMonth.value + delta
  if (m < 1) {
    m = 12
    y--
  } else if (m > 12) {
    m = 1
    y++
  }
  viewYear.value = y
  viewMonth.value = m
}

function selectDay(cell: DayCell) {
  if (cell.disabled) return
  if (!cell.inMonth) {
    const parsed = parseIsoDate(cell.iso)
    if (parsed) {
      viewYear.value = parsed.y
      viewMonth.value = parsed.m
    }
  }
  emit('update:modelValue', cell.iso)
  emit('select', cell.iso)
}

function selectMonth(monthIdx: number) {
  viewMonth.value = monthIdx
  pickerMode.value = 'days'
}

function jumpToday() {
  viewYear.value = now.getFullYear()
  viewMonth.value = now.getMonth() + 1
  pickerMode.value = 'days'
  if (!isIsoDisabled(todayIso)) {
    emit('update:modelValue', todayIso)
    emit('select', todayIso)
  }
}
</script>

<template>
  <div
    class="vl-calendar shape-rect"
    :class="[`t-${tone}`, { 'is-embedded': embedded }]"
    role="group"
    aria-label="自绘日历选择器"
  >
    <div class="vl-cal-head">
      <button
        type="button"
        class="vl-cal-nav shape-circle"
        aria-label="上一年"
        title="上一年"
        @click="viewYear--"
      >
        <VlIcon name="chevron-left" :size="12" />
      </button>
      <button
        v-if="pickerMode === 'days'"
        type="button"
        class="vl-cal-nav shape-circle"
        aria-label="上一月"
        title="上一月"
        @click="stepMonth(-1)"
      >
        <VlIcon name="arrow-left" :size="11" />
      </button>

      <button
        type="button"
        class="vl-cal-title shape-pill"
        @click="pickerMode = pickerMode === 'days' ? 'months' : 'days'"
      >
        <span>{{ viewYear }}年 {{ String(viewMonth).padStart(2, '0') }}月</span>
        <VlIcon name="chevron-down" :size="11" />
      </button>

      <button
        v-if="pickerMode === 'days'"
        type="button"
        class="vl-cal-nav shape-circle"
        aria-label="下一月"
        title="下一月"
        @click="stepMonth(1)"
      >
        <VlIcon name="arrow-right" :size="11" />
      </button>
      <button
        type="button"
        class="vl-cal-nav shape-circle"
        aria-label="下一年"
        title="下一年"
        @click="viewYear++"
      >
        <VlIcon name="chevron-right" :size="12" />
      </button>
    </div>

    <!-- Month Switcher Matrix / Day Matrix with Smooth Mode Transition -->
    <Transition name="panel-fade" mode="out-in">
      <div v-if="pickerMode === 'months'" key="cal-months" class="vl-cal-months">
        <button
          v-for="(label, idx) in MONTH_NAMES"
          :key="label"
          type="button"
          class="vl-cal-month-btn shape-pill"
          :class="{ active: idx + 1 === viewMonth }"
          @click="selectMonth(idx + 1)"
        >
          {{ label }}
        </button>
      </div>

      <div v-else key="cal-days" class="vl-cal-days-stage">
        <div class="vl-cal-weekdays">
          <span v-for="wd in weekdays" :key="wd" class="vl-cal-wd">{{ wd }}</span>
        </div>

        <div class="vl-cal-grid">
          <button
            v-for="cell in dayCells"
            :key="cell.iso"
            type="button"
            class="vl-cal-cell"
            :class="[
              cell.isSelected ? 'shape-circle is-selected' : cell.isToday ? 'shape-circle is-today' : 'shape-rect',
              { 'is-muted': !cell.inMonth, 'is-disabled': cell.disabled },
            ]"
            :disabled="cell.disabled"
            :aria-label="cell.iso"
            :aria-pressed="cell.isSelected"
            @click="selectDay(cell)"
          >
            {{ cell.day }}
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="showToday" class="vl-cal-foot">
      <span class="vl-cal-sel-readout">{{ modelValue || '未选择日期' }}</span>
      <VlButton size="xs" variant="secondary" shape="morph" class="vl-cal-today-btn" @click="jumpToday">
        今天
      </VlButton>
    </div>
  </div>
</template>

<style scoped>
.vl-calendar {
  width: 312px;
  max-width: 100%;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  user-select: none;
}

.vl-calendar.is-embedded {
  width: 100%;
  border: none;
}

.vl-cal-head {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vl-cal-nav {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: background-color 0.16s ease, color 0.16s ease;
}

@media (hover: hover) and (pointer: fine) {
  .vl-cal-nav:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-cal-title {
  flex: 1;
  min-width: 0;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
  background-color: var(--bg-surface);
  font-variant-numeric: tabular-nums;
}

.vl-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-top: 2px;
}

.vl-cal-wd {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-muted);
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vl-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.vl-cal-cell {
  width: 34px;
  height: 34px;
  margin-inline: auto;
  border-radius: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ui-font-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  transition:
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel),
    border-radius 0.2s var(--ease-decel);
}

.vl-cal-cell.is-muted {
  color: var(--text-muted);
  opacity: 0.62;
}

.vl-cal-cell.is-disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .vl-cal-cell:not(.is-disabled):not(.is-selected):hover {
    background-color: var(--bg-hover);
    border-radius: 17px;
  }
}

.vl-cal-cell:not(.is-disabled):active {
  border-radius: 17px;
}

.vl-cal-cell.is-today:not(.is-selected) {
  border: 1.5px solid var(--accent-primary);
  border-radius: 17px;
  color: var(--accent-primary-text);
  font-weight: 800;
}

.vl-calendar.t-secondary .vl-cal-cell.is-today:not(.is-selected) {
  border-color: var(--accent-secondary);
  color: var(--accent-secondary-text);
}

.vl-cal-cell.is-selected {
  border-radius: 17px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
  font-weight: 800;
  opacity: 1;
}

.vl-calendar.t-secondary .vl-cal-cell.is-selected {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-cal-months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 6px 0;
}

.vl-cal-month-btn {
  height: 36px;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.vl-cal-month-btn.active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
  border-color: var(--accent-primary);
}

.vl-cal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid var(--divider-hairline);
}

.vl-cal-sel-readout {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.vl-cal-today-btn {
  height: 24px;
  padding: 0 11px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}
</style>
