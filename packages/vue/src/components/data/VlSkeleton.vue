<script setup lang="ts">
import VlShape from '../primitives/VlShape.vue'
import type { M3ShapeName } from '../../styles/m3Shapes'

withDefaults(
  defineProps<{
    shape?: 'rect' | 'circle' | 'pill' | 'm3'
    m3Shape?: M3ShapeName
    morphShapes?: M3ShapeName[]
    width?: string
    height?: string
    lines?: number
  }>(),
  {
    shape: 'pill',
    m3Shape: 'cookie-6',
    width: '100%',
    height: '14px',
    lines: 1,
  },
)
</script>

<template>
  <div v-if="lines > 1" class="vl-skeleton-stack">
    <span
      v-for="idx in lines"
      :key="idx"
      class="vl-skeleton"
      :class="shape === 'circle' ? 'shape-circle' : shape === 'rect' ? 'shape-rect' : 'shape-pill'"
      :style="{
        width: idx === lines ? '72%' : width,
        height,
      }"
    />
  </div>

  <VlShape
    v-else-if="shape === 'm3'"
    :shape="m3Shape"
    :auto-morph="morphShapes ?? ['cookie-6', 'clover-4', 'sunny']"
    :cycle-interval="1600"
    :morph-duration="500"
    tone="neutral"
    variant="soft"
    :size="width"
    class="vl-skeleton-m3"
  />

  <span
    v-else
    class="vl-skeleton"
    :class="shape === 'circle' ? 'shape-circle' : shape === 'rect' ? 'shape-rect' : 'shape-pill'"
    :style="{ width, height }"
  />
</template>

<style scoped>
.vl-skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.vl-skeleton {
  display: block;
  background-color: var(--bg-chip);
  animation: vl-skeleton-pulse 1.5s var(--ease-standard) infinite;
}

.vl-skeleton-m3 {
  animation: vl-skeleton-pulse-opacity 1.5s var(--ease-standard) infinite;
}

@keyframes vl-skeleton-pulse {
  0%,
  100% {
    background-color: var(--bg-chip);
  }
  50% {
    background-color: var(--bg-hover);
  }
}

@keyframes vl-skeleton-pulse-opacity {
  0%,
  100% {
    opacity: 0.72;
  }
  50% {
    opacity: 1;
  }
}
</style>
