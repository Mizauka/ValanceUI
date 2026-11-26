<script setup lang="ts">
import { computed } from 'vue'
import VlShape from '../primitives/VlShape.vue'
import type { M3ShapeName } from '../../styles/m3Shapes'

const MORPH_MILESTONES: M3ShapeName[] = ['circle', 'cookie-4', 'clover-4', 'sunny', 'flower', 'cookie-9']

const props = withDefaults(
  defineProps<{
    value?: number
    variant?: 'linear' | 'ring' | 'morph'
    shape?: 'pill' | 'rect'
    tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    height?: number
    ringSize?: number
    ringStroke?: number
    indeterminate?: boolean
    showLabel?: boolean
    morphShapes?: M3ShapeName[]
  }>(),
  {
    value: 0,
    variant: 'linear',
    shape: 'pill',
    tone: 'primary',
    height: 6,
    ringSize: 48,
    ringStroke: 4,
    indeterminate: false,
    showLabel: false,
  },
)

const clamped = computed(() => Math.max(0, Math.min(100, props.value)))
const radius = computed(() => Math.max(4, (props.ringSize - props.ringStroke) / 2))
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - clamped.value / 100))

const determinateMorph = computed<{ from: M3ShapeName; to: M3ShapeName; t: number }>(() => {
  const list = props.morphShapes && props.morphShapes.length >= 2 ? props.morphShapes : MORPH_MILESTONES
  const scaled = (clamped.value / 100) * (list.length - 1)
  const idx = Math.min(list.length - 2, Math.floor(scaled))
  return {
    from: list[idx] ?? 'circle',
    to: list[idx + 1] ?? 'flower',
    t: Math.max(0, Math.min(1, scaled - idx)),
  }
})
</script>

<template>
  <!-- Linear Progress Bar (Pill or Rect) -->
  <div
    v-if="variant === 'linear'"
    class="vl-progress-linear-wrap"
    :class="`t-${tone}`"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : Math.round(clamped)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="vl-progress-track"
      :class="shape === 'rect' ? 'shape-rect' : 'shape-pill'"
      :style="{ height: `${height}px` }"
    >
      <div
        class="vl-progress-fill"
        :class="[shape === 'rect' ? 'shape-rect' : 'shape-pill', { indeterminate }]"
        :style="indeterminate ? undefined : { width: `${clamped}%` }"
      />
    </div>
    <span v-if="showLabel && !indeterminate" class="vl-progress-label">
      {{ Math.round(clamped) }}%
    </span>
  </div>

  <!-- M3 Expressive Morphing Shape Indicator (Continuous Indeterminate OR Scrubbed Progress) -->
  <div
    v-else-if="variant === 'morph'"
    class="vl-progress-morph-wrap"
    :class="[`t-${tone}`, { indeterminate }]"
    :style="{ width: `${ringSize}px`, height: `${ringSize}px` }"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : Math.round(clamped)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <VlShape
      shape="soft-burst"
      :morph-to="indeterminate ? undefined : 'sunny'"
      :morph-progress="indeterminate ? 0 : clamped / 100"
      :tone="tone"
      variant="soft"
      :size="ringSize"
      class="vl-morph-halo"
    />
    <VlShape
      v-if="indeterminate"
      :auto-morph="morphShapes ?? MORPH_MILESTONES"
      :cycle-interval="780"
      :morph-duration="540"
      :tone="tone"
      variant="solid"
      :size="Math.round(ringSize * 0.68)"
      class="vl-morph-core"
    >
      <span v-if="showLabel" class="vl-morph-label">···</span>
    </VlShape>
    <VlShape
      v-else
      :shape="determinateMorph.from"
      :morph-to="determinateMorph.to"
      :morph-progress="determinateMorph.t"
      :spin-deg="Math.round(clamped * 2.4)"
      :tone="tone"
      variant="solid"
      :size="Math.round(ringSize * 0.68)"
      class="vl-morph-core"
    >
      <span v-if="showLabel" class="vl-morph-label">{{ Math.round(clamped) }}%</span>
    </VlShape>
  </div>

  <!-- Circular Progress Ring (Pure Circle) -->
  <div
    v-else
    class="vl-progress-ring-wrap"
    :class="`t-${tone}`"
    :style="{ width: `${ringSize}px`, height: `${ringSize}px` }"
    role="progressbar"
    :aria-valuenow="Math.round(clamped)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg :width="ringSize" :height="ringSize" :viewBox="`0 0 ${ringSize} ${ringSize}`">
      <circle
        class="vl-ring-bg"
        :cx="ringSize / 2"
        :cy="ringSize / 2"
        :r="radius"
        :stroke-width="ringStroke"
        fill="none"
      />
      <circle
        class="vl-ring-fg"
        :cx="ringSize / 2"
        :cy="ringSize / 2"
        :r="radius"
        :stroke-width="ringStroke"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
    <span v-if="showLabel" class="vl-ring-label">{{ Math.round(clamped) }}%</span>
  </div>
</template>

<style scoped>
.vl-progress-linear-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.vl-progress-track {
  position: relative;
  flex: 1;
  min-width: 0;
  background-color: var(--bg-chip);
  overflow: hidden;
}

.vl-progress-fill {
  height: 100%;
  transition: width 0.24s var(--ease-nonlinear);
}

.vl-progress-fill.indeterminate {
  width: 38%;
  animation: vl-progress-indet 1.4s var(--ease-standard) infinite;
}

@keyframes vl-progress-indet {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(320%);
  }
}

.t-primary .vl-progress-fill {
  background-color: var(--accent-primary);
}

.t-secondary .vl-progress-fill {
  background-color: var(--accent-secondary);
}

.t-success .vl-progress-fill {
  background-color: var(--accent-success);
}

.t-warning .vl-progress-fill {
  background-color: var(--accent-warning);
}

.t-danger .vl-progress-fill {
  background-color: var(--accent-danger);
}

.vl-progress-label {
  font-size: var(--ui-font-xs);
  font-weight: 800;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.vl-progress-morph-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vl-morph-halo {
  position: absolute;
  inset: 0;
}

.vl-progress-morph-wrap.indeterminate .vl-morph-halo {
  animation: vl-halo-spin 7.2s linear infinite;
}

.vl-morph-core {
  position: relative;
  z-index: 1;
}

.vl-morph-label {
  font-size: 10px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

@keyframes vl-halo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vl-progress-ring-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.vl-progress-ring-wrap svg {
  transform: rotate(-90deg);
}

.vl-ring-bg {
  stroke: var(--bg-chip);
}

.vl-ring-fg {
  transition: stroke-dashoffset 0.25s var(--ease-nonlinear);
}

.t-primary .vl-ring-fg {
  stroke: var(--accent-primary);
}

.t-secondary .vl-ring-fg {
  stroke: var(--accent-secondary);
}

.t-success .vl-ring-fg {
  stroke: var(--accent-success);
}

.t-warning .vl-ring-fg {
  stroke: var(--accent-warning);
}

.t-danger .vl-ring-fg {
  stroke: var(--accent-danger);
}

.vl-ring-label {
  position: absolute;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
</style>
