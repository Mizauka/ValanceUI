<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'

export interface ChartPoint {
  x: number
  y: number
  ciLow?: number
  ciHigh?: number
}

export interface ChartMarkerPoint {
  x: number
  y: number
  label?: string
}

export interface ChartSeriesInput {
  key: string
  name: string
  unit?: string
  color?: string
  points: ChartPoint[]
  baselinePoints?: ChartPoint[]
  markers?: ChartMarkerPoint[]
  areaFill?: boolean
  hidden?: boolean
}

export interface ChartReferenceLine {
  x?: number
  y?: number
  label?: string
  tone?: 'primary' | 'secondary' | 'neutral'
}

const props = withDefaults(
  defineProps<{
    series: ChartSeriesInput[]
    title?: string
    height?: number
    showScrubber?: boolean
    showLegend?: boolean
    xFormatter?: (x: number) => string
    yFormatter?: (y: number) => string
    referenceLines?: ChartReferenceLine[]
    emptyText?: string
  }>(),
  {
    height: 270,
    showScrubber: true,
    showLegend: true,
    emptyText: '暂无可视化时序数据',
  },
)

const emit = defineEmits<{
  (e: 'hover', payload: { x: number | null }): void
}>()

const clipUid = `vl-chart-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
const stageRef = ref<HTMLElement | null>(null)
const scrubberRef = ref<HTMLElement | null>(null)
const widthPx = ref(640)
const hiddenKeys = ref<Set<string>>(new Set())

const DEFAULT_VARS = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
  'var(--chart-series-6)',
]

// Domain bounds across all series
const fullBounds = computed(() => {
  let xMin = Infinity
  let xMax = -Infinity
  for (const s of props.series) {
    for (const p of s.points) {
      if (p.x < xMin) xMin = p.x
      if (p.x > xMax) xMax = p.x
    }
  }
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) return { xMin: 0, xMax: 24 }
  if (xMin === xMax) return { xMin: xMin - 1, xMax: xMax + 1 }
  return { xMin, xMax }
})

const viewMin = ref(0)
const viewMax = ref(24)

watch(
  fullBounds,
  (b) => {
    viewMin.value = b.xMin
    viewMax.value = b.xMax
  },
  { immediate: true },
)

const visibleSeries = computed(() =>
  props.series.map((s, idx) => ({
    ...s,
    resolvedColor: s.color || DEFAULT_VARS[idx % DEFAULT_VARS.length]!,
    isHidden: Boolean(s.hidden) || hiddenKeys.value.has(s.key),
  })),
)

const yBounds = computed(() => {
  let maxVal = -Infinity
  let minVal = 0
  for (const s of visibleSeries.value) {
    if (s.isHidden) continue
    for (const p of s.points) {
      if (p.x < viewMin.value || p.x > viewMax.value) continue
      const hi = p.ciHigh ?? p.y
      const lo = p.ciLow ?? p.y
      if (hi > maxVal) maxVal = hi
      if (lo < minVal) minVal = lo
    }
  }
  if (!Number.isFinite(maxVal) || maxVal <= minVal) {
    return { yMin: 0, yMax: 100 }
  }
  const padTop = (maxVal - minVal) * 0.14
  return { yMin: minVal, yMax: maxVal + Math.max(padTop, 1) }
})

const pad = { top: 24, right: 16, bottom: 28, left: 46 }
const plotW = computed(() => Math.max(120, widthPx.value - pad.left - pad.right))
const plotH = computed(() => Math.max(100, props.height - pad.top - pad.bottom))

function mapX(x: number): number {
  const span = Math.max(1e-6, viewMax.value - viewMin.value)
  return pad.left + ((x - viewMin.value) / span) * plotW.value
}

function mapY(y: number): number {
  const span = Math.max(1e-6, yBounds.value.yMax - yBounds.value.yMin)
  return pad.top + plotH.value - ((y - yBounds.value.yMin) / span) * plotH.value
}

function unmapX(px: number): number {
  const ratio = (px - pad.left) / Math.max(1, plotW.value)
  return viewMin.value + ratio * (viewMax.value - viewMin.value)
}

function formatX(x: number): string {
  if (props.xFormatter) return props.xFormatter(x)
  return Number.isInteger(x) ? `${x}h` : `${x.toFixed(1)}h`
}

function formatY(y: number): string {
  if (props.yFormatter) return props.yFormatter(y)
  if (Math.abs(y) >= 1000) return `${(y / 1000).toFixed(1)}k`
  return Number.isInteger(y) ? String(y) : y.toFixed(1)
}

const yTicks = computed(() => {
  const count = 4
  const { yMin, yMax } = yBounds.value
  const list: Array<{ val: number; y: number; label: string }> = []
  for (let i = 0; i <= count; i++) {
    const val = yMin + ((yMax - yMin) * i) / count
    list.push({ val, y: mapY(val), label: formatY(val) })
  }
  return list
})

const xTicks = computed(() => {
  const count = widthPx.value < 420 ? 4 : 6
  const list: Array<{ val: number; x: number; label: string }> = []
  for (let i = 0; i <= count; i++) {
    const val = viewMin.value + ((viewMax.value - viewMin.value) * i) / count
    list.push({ val, x: mapX(val), label: formatX(val) })
  }
  return list
})

function buildLinePath(pts: ChartPoint[]): string {
  if (!pts.length) return ''
  return pts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(2)},${mapY(p.y).toFixed(2)}`)
    .join(' ')
}

function buildAreaPath(pts: ChartPoint[]): string {
  if (pts.length < 2) return ''
  const baseY = mapY(yBounds.value.yMin)
  const top = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(2)},${mapY(p.y).toFixed(2)}`).join(' ')
  const lastX = mapX(pts[pts.length - 1]!.x).toFixed(2)
  const firstX = mapX(pts[0]!.x).toFixed(2)
  return `${top} L ${lastX},${baseY.toFixed(2)} L ${firstX},${baseY.toFixed(2)} Z`
}

function buildBandPath(pts: ChartPoint[]): string {
  const bandPts = pts.filter((p) => p.ciLow !== undefined && p.ciHigh !== undefined)
  if (bandPts.length < 2) return ''
  const hi = bandPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(2)},${mapY(p.ciHigh!).toFixed(2)}`).join(' ')
  const lo = [...bandPts].reverse().map((p) => `L ${mapX(p.x).toFixed(2)},${mapY(p.ciLow!).toFixed(2)}`).join(' ')
  return `${hi} ${lo} Z`
}

function interpolateSeriesAt(pts: ChartPoint[], x: number): ChartPoint | null {
  if (!pts.length) return null
  if (x <= pts[0]!.x) return pts[0]!
  if (x >= pts[pts.length - 1]!.x) return pts[pts.length - 1]!
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!
    const b = pts[i + 1]!
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / Math.max(1e-9, b.x - a.x)
      return {
        x,
        y: a.y + (b.y - a.y) * t,
        ciLow: a.ciLow !== undefined && b.ciLow !== undefined ? a.ciLow + (b.ciLow - a.ciLow) * t : undefined,
        ciHigh: a.ciHigh !== undefined && b.ciHigh !== undefined ? a.ciHigh + (b.ciHigh - a.ciHigh) * t : undefined,
      }
    }
  }
  return null
}

// Crosshair interaction
const hoverDomainX = ref<number | null>(null)
const isPanning = ref(false)
let panStartClientX = 0
let panStartMin = 0
let panStartMax = 0

const activeReadoutX = computed(() => {
  if (hoverDomainX.value !== null) return hoverDomainX.value
  return viewMax.value
})

const hoverScreenX = computed(() => {
  if (hoverDomainX.value === null) return null
  return mapX(hoverDomainX.value)
})

const telemetryItems = computed(() =>
  visibleSeries.value
    .filter((s) => !s.isHidden && s.points.length > 0)
    .map((s) => {
      const sample = interpolateSeriesAt(s.points, activeReadoutX.value)
      return {
        key: s.key,
        name: s.name,
        unit: s.unit ?? '',
        color: s.resolvedColor,
        val: sample?.y ?? 0,
        ciLow: sample?.ciLow,
        ciHigh: sample?.ciHigh,
        yPx: sample ? mapY(sample.y) : pad.top,
      }
    }),
)

function onStagePointerDown(e: PointerEvent) {
  if (!stageRef.value) return
  isPanning.value = true
  panStartClientX = e.clientX
  panStartMin = viewMin.value
  panStartMax = viewMax.value
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onStagePointerMove(e: PointerEvent) {
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  const localX = Math.max(pad.left, Math.min(pad.left + plotW.value, e.clientX - rect.left))
  if (isPanning.value) {
    const dxPx = e.clientX - panStartClientX
    const span = panStartMax - panStartMin
    const deltaDomain = -(dxPx / Math.max(1, plotW.value)) * span
    const fb = fullBounds.value
    const clampedDelta = Math.max(fb.xMin - panStartMin, Math.min(fb.xMax - panStartMax, deltaDomain))
    viewMin.value = panStartMin + clampedDelta
    viewMax.value = panStartMax + clampedDelta
  } else {
    hoverDomainX.value = unmapX(localX)
    emit('hover', { x: hoverDomainX.value })
  }
}

function onStagePointerUp() {
  isPanning.value = false
}

function onStagePointerLeave() {
  isPanning.value = false
  hoverDomainX.value = null
  emit('hover', { x: null })
}

function onStageWheel(e: WheelEvent) {
  e.preventDefault()
  const fb = fullBounds.value
  const span = viewMax.value - viewMin.value
  const fullSpan = Math.max(1e-6, fb.xMax - fb.xMin)
  const factor = e.deltaY > 0 ? 1.15 : 0.87
  const nextSpan = Math.max(fullSpan * 0.08, Math.min(fullSpan, span * factor))
  const anchor = hoverDomainX.value ?? (viewMin.value + viewMax.value) / 2
  const ratio = (anchor - viewMin.value) / Math.max(1e-6, span)
  let nextMin = anchor - ratio * nextSpan
  let nextMax = nextMin + nextSpan
  if (nextMin < fb.xMin) {
    nextMin = fb.xMin
    nextMax = Math.min(fb.xMax, nextMin + nextSpan)
  }
  if (nextMax > fb.xMax) {
    nextMax = fb.xMax
    nextMin = Math.max(fb.xMin, nextMax - nextSpan)
  }
  viewMin.value = nextMin
  viewMax.value = nextMax
}

function resetZoom() {
  viewMin.value = fullBounds.value.xMin
  viewMax.value = fullBounds.value.xMax
}

function toggleSeries(key: string) {
  const next = new Set(hiddenKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  hiddenKeys.value = next
}

// Scrubber preview & handles
const scrubberPreviewPath = computed(() => {
  const first = visibleSeries.value.find((s) => !s.isHidden && s.points.length > 1)
  if (!first) return ''
  const fb = fullBounds.value
  const spanX = Math.max(1e-6, fb.xMax - fb.xMin)
  let yMax = 1
  for (const p of first.points) {
    if (p.y > yMax) yMax = p.y
  }
  const w = Math.max(100, widthPx.value - 24)
  return first.points
    .map((p, idx) => {
      const px = ((p.x - fb.xMin) / spanX) * w
      const py = 20 - (p.y / yMax) * 16
      return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')
})

const scrubberStyle = computed(() => {
  const fb = fullBounds.value
  const span = Math.max(1e-6, fb.xMax - fb.xMin)
  const left = ((viewMin.value - fb.xMin) / span) * 100
  const width = ((viewMax.value - viewMin.value) / span) * 100
  return {
    left: `${Math.max(0, Math.min(100, left))}%`,
    width: `${Math.max(4, Math.min(100 - left, width))}%`,
  }
})

let scrubMode: 'none' | 'pan' | 'left' | 'right' = 'none'
let scrubStartX = 0
let scrubStartMin = 0
let scrubStartMax = 0

function startScrub(mode: 'pan' | 'left' | 'right', e: PointerEvent) {
  e.stopPropagation()
  scrubMode = mode
  scrubStartX = e.clientX
  scrubStartMin = viewMin.value
  scrubStartMax = viewMax.value
  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onScrubMove)
    window.addEventListener('pointerup', stopScrub)
  }
}

function onScrubMove(e: PointerEvent) {
  if (scrubMode === 'none' || !scrubberRef.value) return
  const fb = fullBounds.value
  const fullSpan = Math.max(1e-6, fb.xMax - fb.xMin)
  const w = Math.max(1, scrubberRef.value.getBoundingClientRect().width)
  const deltaDomain = ((e.clientX - scrubStartX) / w) * fullSpan
  const minSpan = fullSpan * 0.08

  if (scrubMode === 'pan') {
    const span = scrubStartMax - scrubStartMin
    const clamped = Math.max(fb.xMin - scrubStartMin, Math.min(fb.xMax - scrubStartMax, deltaDomain))
    viewMin.value = scrubStartMin + clamped
    viewMax.value = scrubStartMin + span + clamped
  } else if (scrubMode === 'left') {
    viewMin.value = Math.max(fb.xMin, Math.min(scrubStartMax - minSpan, scrubStartMin + deltaDomain))
  } else if (scrubMode === 'right') {
    viewMax.value = Math.min(fb.xMax, Math.max(scrubStartMin + minSpan, scrubStartMax + deltaDomain))
  }
}

function stopScrub() {
  scrubMode = 'none'
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onScrubMove)
    window.removeEventListener('pointerup', stopScrub)
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (stageRef.value) {
    widthPx.value = Math.max(260, stageRef.value.clientWidth || 640)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width
        if (w && w > 80) widthPx.value = Math.round(w)
      })
      resizeObserver.observe(stageRef.value)
    }
  }
})

onBeforeUnmount(() => {
  stopScrub()
  resizeObserver?.disconnect()
})
</script>

<template>
  <section class="vl-chart-root shape-rect">
    <!-- Top Live Telemetry Strip -->
    <div class="vl-chart-bar">
      <div class="vl-chart-head-left">
        <span v-if="title" class="vl-chart-title">{{ title }}</span>
        <span class="vl-chart-xpill shape-pill">
          <VlIcon name="curve" :size="11" />
          <span>{{ formatX(activeReadoutX) }}</span>
        </span>
      </div>

      <div class="vl-chart-telemetry">
        <span v-for="item in telemetryItems" :key="item.key" class="vl-tele-item">
          <span class="vl-tele-dot shape-circle" :style="{ backgroundColor: item.color }" />
          <span class="vl-tele-name">{{ item.name }}</span>
          <strong class="vl-tele-val">{{ formatY(item.val) }}</strong>
          <span v-if="item.unit" class="vl-tele-unit">{{ item.unit }}</span>
        </span>
      </div>
    </div>

    <!-- SVG Stage -->
    <div
      ref="stageRef"
      class="vl-chart-stage"
      :class="{ panning: isPanning }"
      @pointerdown="onStagePointerDown"
      @pointermove="onStagePointerMove"
      @pointerup="onStagePointerUp"
      @pointercancel="onStagePointerUp"
      @pointerleave="onStagePointerLeave"
      @wheel="onStageWheel"
      @dblclick="resetZoom"
    >
      <svg
        v-if="series.some((s) => s.points.length > 0)"
        class="vl-chart-svg"
        :width="widthPx"
        :height="height"
        :viewBox="`0 0 ${widthPx} ${height}`"
      >
        <defs>
          <clipPath :id="clipUid">
            <rect :x="pad.left" :y="pad.top - 4" :width="plotW" :height="plotH + 8" />
          </clipPath>
        </defs>

        <!-- Horizontal Gridlines + Y Labels -->
        <g>
          <template v-for="t in yTicks" :key="t.val">
            <line
              :x1="pad.left"
              :x2="pad.left + plotW"
              :y1="t.y"
              :y2="t.y"
              :class="t.val === 0 ? 'vl-axis-base' : 'vl-axis-grid'"
            />
            <text :x="pad.left - 8" :y="t.y + 3.5" text-anchor="end" class="vl-axis-text">
              {{ t.label }}
            </text>
          </template>
        </g>

        <!-- X Ticks -->
        <g>
          <template v-for="(xt, idx) in xTicks" :key="idx">
            <line :x1="xt.x" :x2="xt.x" :y1="pad.top + plotH" :y2="pad.top + plotH + 4" class="vl-axis-tick" />
            <text :x="xt.x" :y="pad.top + plotH + 17" text-anchor="middle" class="vl-axis-text">
              {{ xt.label }}
            </text>
          </template>
        </g>

        <!-- Clipped Plot Curves & Confidence Bands -->
        <g :clip-path="`url(#${clipUid})`">
          <!-- Reference Lines -->
          <g v-for="(refLine, rIdx) in referenceLines" :key="rIdx">
            <line
              v-if="refLine.x !== undefined"
              :x1="mapX(refLine.x)"
              :x2="mapX(refLine.x)"
              :y1="pad.top"
              :y2="pad.top + plotH"
              class="vl-ref-line"
            />
            <line
              v-if="refLine.y !== undefined"
              :x1="pad.left"
              :x2="pad.left + plotW"
              :y1="mapY(refLine.y)"
              :y2="mapY(refLine.y)"
              class="vl-ref-line"
            />
          </g>

          <template v-for="s in visibleSeries" :key="s.key">
            <template v-if="!s.isHidden">
              <!-- Area Tint -->
              <path
                v-if="s.areaFill !== false"
                :d="buildAreaPath(s.points)"
                :fill="s.resolvedColor"
                fill-opacity="0.09"
              />

              <!-- CI Confidence Band -->
              <path
                v-if="s.points.some((p) => p.ciLow !== undefined && p.ciHigh !== undefined)"
                :d="buildBandPath(s.points)"
                :fill="s.resolvedColor"
                fill-opacity="0.16"
              />

              <!-- Optional Baseline Dashed Prediction -->
              <path
                v-if="s.baselinePoints?.length"
                :d="buildLinePath(s.baselinePoints)"
                fill="none"
                :stroke="s.resolvedColor"
                stroke-width="1.4"
                stroke-dasharray="5 4"
                stroke-opacity="0.58"
              />

              <!-- Primary Curve -->
              <path
                :d="buildLinePath(s.points)"
                fill="none"
                :stroke="s.resolvedColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Observation Scatter Dots -->
              <circle
                v-for="(mk, mIdx) in s.markers ?? []"
                :key="mIdx"
                :cx="mapX(mk.x)"
                :cy="mapY(mk.y)"
                r="4.2"
                fill="var(--bg-base)"
                :stroke="s.resolvedColor"
                stroke-width="2.2"
              >
                <title>{{ mk.label ?? `${s.name}: ${formatY(mk.y)}` }}</title>
              </circle>
            </template>
          </template>

          <!-- Crosshair Vertical Line + Track Dots -->
          <g v-if="hoverScreenX !== null">
            <line :x1="hoverScreenX" :x2="hoverScreenX" :y1="pad.top" :y2="pad.top + plotH" class="vl-crosshair" />
            <circle
              v-for="item in telemetryItems"
              :key="item.key"
              :cx="hoverScreenX"
              :cy="item.yPx"
              r="4.2"
              :fill="item.color"
              stroke="var(--bg-base)"
              stroke-width="2"
            />
          </g>
        </g>
      </svg>

      <div v-else class="vl-chart-empty">{{ emptyText }}</div>
    </div>

    <!-- Bottom Overview Scrubber -->
    <div v-if="showScrubber && series.some((s) => s.points.length > 1)" ref="scrubberRef" class="vl-scrubber shape-rect">
      <svg class="vl-scrubber-svg" preserveAspectRatio="none" :viewBox="`0 0 ${Math.max(100, widthPx - 24)} 22`">
        <path :d="scrubberPreviewPath" fill="none" stroke="var(--text-muted)" stroke-opacity="0.48" stroke-width="1.3" />
      </svg>
      <div class="vl-scrubber-win shape-rect" :style="scrubberStyle" @pointerdown="startScrub('pan', $event)">
        <span class="vl-scrub-handle left" @pointerdown="startScrub('left', $event)" />
        <span class="vl-scrub-handle right" @pointerdown="startScrub('right', $event)" />
      </div>
    </div>

    <!-- Legend Strip -->
    <div v-if="showLegend && series.length" class="vl-chart-legend">
      <button
        v-for="s in visibleSeries"
        :key="s.key"
        type="button"
        class="vl-legend-pill shape-pill"
        :class="{ muted: s.isHidden }"
        @click="toggleSeries(s.key)"
      >
        <span class="vl-legend-dot shape-circle" :style="{ backgroundColor: s.resolvedColor }" />
        <span>{{ s.name }}</span>
        <span v-if="s.unit" class="vl-legend-unit">{{ s.unit }}</span>
      </button>
      <span class="vl-legend-tip">滚轮缩放 · 拖拽平移 · 双击复原</span>
    </div>
  </section>
</template>

<style scoped>
.vl-chart-root {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  user-select: none;
}

.vl-chart-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-chart-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vl-chart-title {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-chart-xpill {
  height: 22px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-chart-telemetry {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.vl-tele-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
}

.vl-tele-dot {
  width: 7px;
  height: 7px;
}

.vl-tele-val {
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.vl-tele-unit {
  color: var(--text-muted);
}

.vl-chart-stage {
  position: relative;
  width: 100%;
  cursor: crosshair;
  touch-action: pan-y;
}

.vl-chart-stage.panning {
  cursor: grabbing;
}

.vl-chart-svg {
  display: block;
  width: 100%;
}

.vl-axis-grid {
  stroke: var(--divider-hairline);
  stroke-width: 1;
}

.vl-axis-base {
  stroke: var(--divider-strong);
  stroke-width: 1.2;
}

.vl-axis-tick {
  stroke: var(--divider-strong);
  stroke-width: 1;
}

.vl-axis-text {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--text-muted);
}

.vl-ref-line {
  stroke: var(--accent-secondary);
  stroke-width: 1.25;
  stroke-dasharray: 4 3;
}

.vl-crosshair {
  stroke: var(--text-muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.vl-chart-empty {
  padding: 40px 16px;
  text-align: center;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
}

.vl-scrubber {
  position: relative;
  height: 24px;
  margin: 0 12px 8px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  overflow: hidden;
}

.vl-scrubber-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.vl-scrubber-win {
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: color-mix(in srgb, var(--accent-primary) 16%, transparent);
  border-top: 1px solid var(--accent-primary);
  border-bottom: 1px solid var(--accent-primary);
  cursor: grab;
}

.vl-scrub-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background-color: var(--accent-primary);
  cursor: ew-resize;
}

.vl-scrub-handle.left {
  left: 0;
}

.vl-scrub-handle.right {
  right: 0;
}

.vl-chart-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--divider-hairline);
}

.vl-legend-pill {
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  color: var(--text-primary);
}

.vl-legend-pill.muted {
  opacity: 0.45;
}

.vl-legend-dot {
  width: 7px;
  height: 7px;
}

.vl-legend-unit {
  color: var(--text-muted);
}

.vl-legend-tip {
  margin-left: auto;
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>
