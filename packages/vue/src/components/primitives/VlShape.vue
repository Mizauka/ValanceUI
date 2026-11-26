<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getM3ShapePath, type M3ShapeName } from '../../styles/m3Shapes'
import {
  expressiveMorphEase,
  getSampledM3Loop,
  interpolateLoops,
  loopToSvgPath,
  type MorphPoint,
} from '../../styles/m3ShapeMorph'

const props = withDefaults(
  defineProps<{
    shape?: M3ShapeName
    hoverShape?: M3ShapeName
    activeShape?: M3ShapeName
    morphTo?: M3ShapeName
    morphProgress?: number
    autoMorph?: M3ShapeName[]
    cycleInterval?: number
    morphDuration?: number
    spinDeg?: number
    size?: number | string
    tone?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
    variant?: 'solid' | 'soft' | 'outline'
    interactive?: boolean
    active?: boolean
  }>(),
  {
    shape: 'clover-4',
    size: 56,
    tone: 'primary',
    variant: 'solid',
    interactive: false,
    active: false,
    cycleInterval: 1100,
    morphDuration: 380,
    morphProgress: 0,
    spinDeg: 0,
  },
)

const hovering = ref(false)
const cycleIndex = ref(0)
const renderedPath = ref(getM3ShapePath(props.shape))

let currentLoop: MorphPoint[] = getSampledM3Loop(props.shape)
let rafId: number | null = null
let cycleTimer: ReturnType<typeof setInterval> | null = null

const isAutoMorphing = computed(() => Boolean(props.autoMorph && props.autoMorph.length >= 2))
const isManualMorph = computed(() => Boolean(props.morphTo) && !isAutoMorphing.value)

const targetShape = computed<M3ShapeName>(() => {
  if (isAutoMorphing.value) {
    const seq = props.autoMorph!
    return seq[cycleIndex.value % seq.length] ?? props.shape
  }
  if (props.active && props.activeShape) return props.activeShape
  if (hovering.value && props.hoverShape) return props.hoverShape
  return props.shape
})

function cancelMorph() {
  if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function animateToShape(nextShape: M3ShapeName) {
  cancelMorph()
  const toLoop = getSampledM3Loop(nextShape)
  if (typeof requestAnimationFrame === 'undefined' || props.morphDuration <= 0) {
    currentLoop = toLoop
    renderedPath.value = getM3ShapePath(nextShape)
    return
  }

  const fromLoop = currentLoop.slice()
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dur = Math.max(60, props.morphDuration)

  const step = (now: number) => {
    const rawT = Math.min(1, (now - startTime) / dur)
    const eased = expressiveMorphEase(rawT)
    const interp = interpolateLoops(fromLoop, toLoop, eased)
    currentLoop = interp
    if (rawT >= 1) {
      currentLoop = toLoop
      renderedPath.value = getM3ShapePath(nextShape)
      rafId = null
    } else {
      renderedPath.value = loopToSvgPath(interp)
      rafId = requestAnimationFrame(step)
    }
  }
  rafId = requestAnimationFrame(step)
}

watch(
  () => [props.shape, props.morphTo, props.morphProgress, isManualMorph.value] as const,
  () => {
    if (!isManualMorph.value || !props.morphTo) return
    cancelMorph()
    const a = getSampledM3Loop(props.shape)
    const b = getSampledM3Loop(props.morphTo)
    const interp = interpolateLoops(a, b, props.morphProgress)
    currentLoop = interp
    renderedPath.value =
      props.morphProgress <= 0.005
        ? getM3ShapePath(props.shape)
        : props.morphProgress >= 0.995
          ? getM3ShapePath(props.morphTo)
          : loopToSvgPath(interp)
  },
  { immediate: true },
)

watch(targetShape, (next, prev) => {
  if (isManualMorph.value) return
  if (next === prev && renderedPath.value) return
  animateToShape(next)
})

function setupCycle() {
  if (cycleTimer !== null) {
    clearInterval(cycleTimer)
    cycleTimer = null
  }
  if (!isAutoMorphing.value) return
  cycleTimer = setInterval(() => {
    cycleIndex.value = (cycleIndex.value + 1) % (props.autoMorph?.length || 1)
  }, Math.max(260, props.cycleInterval))
}

watch(() => [props.autoMorph, props.cycleInterval] as const, setupCycle)

onMounted(() => {
  setupCycle()
})

onBeforeUnmount(() => {
  cancelMorph()
  if (cycleTimer !== null) clearInterval(cycleTimer)
})

const sizeCss = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
)

const svgSpinStyle = computed(() =>
  props.spinDeg ? { transform: `rotate(${props.spinDeg}deg)` } : undefined,
)
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="vl-m3-shape"
    :class="[
      `t-${tone}`,
      `v-${variant}`,
      {
        'is-interactive': interactive,
        'is-active': active,
        'has-swap': Boolean(hoverShape || activeShape || isAutoMorphing),
      },
    ]"
    :style="{ width: sizeCss, height: sizeCss }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <svg
      class="vl-m3-shape-svg"
      viewBox="0 0 100 100"
      :style="svgSpinStyle"
      aria-hidden="true"
    >
      <path :d="renderedPath" class="vl-m3-shape-path" />
    </svg>
    <span v-if="$slots.default" class="vl-m3-shape-inner">
      <slot />
    </span>
  </component>
</template>

<style scoped>
.vl-m3-shape {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
  transition: transform 0.28s var(--ease-expressive);
}

.vl-m3-shape.is-interactive {
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .vl-m3-shape.is-interactive:hover {
    transform: scale(1.06) rotate(4deg);
  }
}

.vl-m3-shape.is-interactive:active {
  transform: scale(0.94);
}

.vl-m3-shape-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  transition: transform 0.14s linear;
}

.vl-m3-shape-path {
  vector-effect: non-scaling-stroke;
  transition:
    fill 0.2s var(--ease-standard),
    stroke 0.2s var(--ease-standard);
}

.vl-m3-shape-inner {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* Solid */
.vl-m3-shape.v-solid.t-primary { color: var(--accent-primary-ink); }
.vl-m3-shape.v-solid.t-primary .vl-m3-shape-path { fill: var(--accent-primary); }

.vl-m3-shape.v-solid.t-secondary { color: var(--accent-secondary-ink); }
.vl-m3-shape.v-solid.t-secondary .vl-m3-shape-path { fill: var(--accent-secondary); }

.vl-m3-shape.v-solid.t-neutral { color: var(--bg-base); }
.vl-m3-shape.v-solid.t-neutral .vl-m3-shape-path { fill: var(--text-primary); }

.vl-m3-shape.v-solid.t-success { color: var(--accent-success-ink); }
.vl-m3-shape.v-solid.t-success .vl-m3-shape-path { fill: var(--accent-success); }

.vl-m3-shape.v-solid.t-warning { color: var(--accent-warning-ink); }
.vl-m3-shape.v-solid.t-warning .vl-m3-shape-path { fill: var(--accent-warning); }

.vl-m3-shape.v-solid.t-danger { color: var(--accent-danger-ink); }
.vl-m3-shape.v-solid.t-danger .vl-m3-shape-path { fill: var(--accent-danger); }

.vl-m3-shape.v-solid.t-info { color: var(--accent-info-ink); }
.vl-m3-shape.v-solid.t-info .vl-m3-shape-path { fill: var(--accent-info); }

/* Soft */
.vl-m3-shape.v-soft.t-primary { color: var(--accent-primary-text); }
.vl-m3-shape.v-soft.t-primary .vl-m3-shape-path { fill: var(--accent-primary-soft); }

.vl-m3-shape.v-soft.t-secondary { color: var(--accent-secondary-text); }
.vl-m3-shape.v-soft.t-secondary .vl-m3-shape-path { fill: var(--accent-secondary-soft); }

.vl-m3-shape.v-soft.t-neutral { color: var(--text-primary); }
.vl-m3-shape.v-soft.t-neutral .vl-m3-shape-path { fill: var(--bg-chip); }

.vl-m3-shape.v-soft.t-success { color: var(--accent-success-text); }
.vl-m3-shape.v-soft.t-success .vl-m3-shape-path { fill: var(--accent-success-soft); }

.vl-m3-shape.v-soft.t-warning { color: var(--accent-warning-text); }
.vl-m3-shape.v-soft.t-warning .vl-m3-shape-path { fill: var(--accent-warning-soft); }

.vl-m3-shape.v-soft.t-danger { color: var(--accent-danger-text); }
.vl-m3-shape.v-soft.t-danger .vl-m3-shape-path { fill: var(--accent-danger-soft); }

.vl-m3-shape.v-soft.t-info { color: var(--accent-info-text); }
.vl-m3-shape.v-soft.t-info .vl-m3-shape-path { fill: var(--accent-info-soft); }

/* Outline */
.vl-m3-shape.v-outline .vl-m3-shape-path {
  fill: var(--bg-elevated);
  stroke-width: 2;
}
.vl-m3-shape.v-outline.t-primary { color: var(--accent-primary-text); }
.vl-m3-shape.v-outline.t-primary .vl-m3-shape-path { stroke: var(--accent-primary); }

.vl-m3-shape.v-outline.t-secondary { color: var(--accent-secondary-text); }
.vl-m3-shape.v-outline.t-secondary .vl-m3-shape-path { stroke: var(--accent-secondary); }

.vl-m3-shape.v-outline.t-neutral { color: var(--text-secondary); }
.vl-m3-shape.v-outline.t-neutral .vl-m3-shape-path { stroke: var(--divider-strong); }

.vl-m3-shape.v-outline.t-success { color: var(--accent-success-text); }
.vl-m3-shape.v-outline.t-success .vl-m3-shape-path { stroke: var(--accent-success); }

.vl-m3-shape.v-outline.t-warning { color: var(--accent-warning-text); }
.vl-m3-shape.v-outline.t-warning .vl-m3-shape-path { stroke: var(--accent-warning); }

.vl-m3-shape.v-outline.t-danger { color: var(--accent-danger-text); }
.vl-m3-shape.v-outline.t-danger .vl-m3-shape-path { stroke: var(--accent-danger); }

.vl-m3-shape.v-outline.t-info { color: var(--accent-info-text); }
.vl-m3-shape.v-outline.t-info .vl-m3-shape-path { stroke: var(--accent-info); }
</style>
