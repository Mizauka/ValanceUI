<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VlBadge,
  VlButton,
  VlCard,
  VlSegmentedControl,
  useWidthTransition,
  type SegmentOption,
} from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()

const raceActive = ref(false)
const morphCircleActive = ref(false)
const morphPillActive = ref(false)

const widthPreset = ref<'narrow' | 'standard' | 'wide'>('standard')
const widthMap = { narrow: 420, standard: 620, wide: 820 }
const widthOptions = computed<SegmentOption<'narrow' | 'standard' | 'wide'>[]>(() => [
  { value: 'narrow', label: t.value.motion.measureOptions.narrow },
  { value: 'standard', label: t.value.motion.measureOptions.standard },
  { value: 'wide', label: t.value.motion.measureOptions.wide },
])

const columnHostRef = ref<HTMLElement | null>(null)
const { isWidthMorphing, runWidthTransition } = useWidthTransition()

function switchColumnWidth(next: 'narrow' | 'standard' | 'wide') {
  if (next === widthPreset.value) return
  runWidthTransition(() => {
    widthPreset.value = next
  }, {
    getScroller: () => columnHostRef.value,
    getWidthPx: () => widthMap[widthPreset.value],
    getNextWidthPx: () => widthMap[next],
    paragraphSelector: '.width-sample p',
  })
}
</script>

<template>
  <div class="demo-view">
    <!-- Easing Curve Racer -->
    <VlCard :title="t.motion.raceCardTitle" :subtitle="t.motion.raceCardSubtitle" accent-side="left" accent-tone="primary">
      <template #extra>
        <VlButton variant="primary" icon="play" @click="raceActive = !raceActive">
          {{ raceActive ? t.motion.raceReset : t.motion.raceStart }}
        </VlButton>
      </template>

      <div class="racer-list">
        <div class="racer-row">
          <div class="racer-meta">
            <strong>--ease-decel</strong>
            <code>cubic-bezier(0.04, 0.94, 0.12, 1)</code>
            <VlBadge tone="primary" size="xs">{{ t.motion.decelBadge }}</VlBadge>
          </div>
          <div class="racer-track shape-rect">
            <span class="racer-puck shape-pill nonlinear" :class="{ go: raceActive }" />
          </div>
        </div>

        <div class="racer-row">
          <div class="racer-meta">
            <strong>--ease-snappy</strong>
            <code>cubic-bezier(0.08, 0.96, 0.14, 1)</code>
            <VlBadge tone="secondary" size="xs">{{ t.motion.snappyBadge }}</VlBadge>
          </div>
          <div class="racer-track shape-rect">
            <span class="racer-puck shape-pill expressive" :class="{ go: raceActive }" />
          </div>
        </div>

        <div class="racer-row">
          <div class="racer-meta">
            <strong>--ease-accel-decel</strong>
            <code>cubic-bezier(0.3, 0.08, 0.08, 1)</code>
            <VlBadge tone="neutral" size="xs">{{ t.motion.emphasizedBadge }}</VlBadge>
          </div>
          <div class="racer-track shape-rect">
            <span class="racer-puck shape-pill standard" :class="{ go: raceActive }" />
          </div>
        </div>
      </div>
    </VlCard>

    <!-- Geometric Morph Playground -->
    <VlCard :title="t.motion.morphCardTitle" accent-side="left" accent-tone="secondary">
      <div class="morph-grid">
        <div class="morph-demo-box shape-rect">
          <button
            type="button"
            class="demo-sq-circle"
            :class="{ active: morphCircleActive }"
            @click="morphCircleActive = !morphCircleActive"
          >
            {{ morphCircleActive ? '26px' : '0px' }}
          </button>
          <div>
            <strong>{{ t.motion.squareCircleTitle }}</strong>
            <p class="morph-desc">{{ t.motion.squareCircleDesc }}</p>
          </div>
        </div>

        <div class="morph-demo-box shape-rect">
          <button
            type="button"
            class="demo-sq-pill"
            :class="{ active: morphPillActive }"
            @click="morphPillActive = !morphPillActive"
          >
            {{ morphPillActive ? '19px' : '0px' }}
          </button>
          <div>
            <strong>{{ t.motion.squarePillTitle }}</strong>
            <p class="morph-desc">{{ t.motion.squarePillDesc }}</p>
          </div>
        </div>
      </div>
    </VlCard>

    <!-- Reader Column Width Snapshot Morph -->
    <VlCard :title="t.motion.measureCardTitle" :subtitle="t.motion.measureCardSubtitle" accent-side="top" accent-tone="primary">
      <template #extra>
        <VlSegmentedControl
          :model-value="widthPreset"
          :options="widthOptions"
          size="sm"
          surface="activity"
          @update:model-value="switchColumnWidth"
        />
      </template>

      <div ref="columnHostRef" class="width-host" :class="{ 'vt-width-target': isWidthMorphing }">
        <div class="width-sample shape-rect" :style="{ maxWidth: `${widthMap[widthPreset]}px` }">
          <p>{{ t.motion.measureBody1 }}</p>
          <p>{{ t.motion.measureBody2 }}</p>
        </div>
      </div>
    </VlCard>

    <!-- Typography Scale -->
    <VlCard :title="t.motion.typoCardTitle" surface="surface">
      <div class="typo-scale">
        <div class="typo-row"><code>--ui-font-xs</code><span style="font-size: var(--ui-font-xs)">{{ t.motion.typoScale.xs }}</span></div>
        <div class="typo-row"><code>--ui-font-sm</code><span style="font-size: var(--ui-font-sm)">{{ t.motion.typoScale.sm }}</span></div>
        <div class="typo-row"><code>--ui-font-md</code><span style="font-size: var(--ui-font-md)">{{ t.motion.typoScale.md }}</span></div>
        <div class="typo-row"><code>--ui-font-base</code><span style="font-size: var(--ui-font-base)">{{ t.motion.typoScale.base }}</span></div>
        <div class="typo-row"><code>--ui-font-lg</code><span style="font-size: var(--ui-font-lg)">{{ t.motion.typoScale.lg }}</span></div>
      </div>
    </VlCard>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.racer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.racer-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.racer-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: var(--ui-font-sm);
}

.racer-meta code {
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.racer-track {
  position: relative;
  height: 28px;
  padding: 4px;
  background-color: var(--bg-activity);
  border: 1px solid var(--divider-hairline);
}

.racer-puck {
  display: block;
  width: 56px;
  height: 18px;
  background-color: var(--accent-primary);
  transform: translateX(0);
}

.racer-puck.nonlinear {
  transition: transform 0.72s var(--ease-nonlinear);
}

.racer-puck.expressive {
  background-color: var(--accent-secondary);
  transition: transform 0.72s var(--ease-expressive);
}

.racer-puck.standard {
  background-color: var(--text-primary);
  transition: transform 0.72s var(--ease-standard);
}

.racer-puck.go {
  transform: translateX(min(420px, calc(100vw - 220px)));
}

.morph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.morph-demo-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
}

.morph-demo-box strong {
  font-size: var(--ui-font-md);
  color: var(--text-primary);
}

.morph-desc {
  margin: 4px 0 0 0;
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.5;
}

.demo-sq-circle {
  width: 52px;
  height: 52px;
  border-radius: 0px;
  flex-shrink: 0;
  font-weight: 800;
  font-size: var(--ui-font-xs);
  background-color: var(--bg-chip);
  color: var(--text-primary);
  transition:
    border-radius 0.24s var(--ease-decel),
    background-color 0.16s var(--ease-decel),
    color 0.16s var(--ease-decel);
}

.demo-sq-circle:hover,
.demo-sq-circle.active {
  border-radius: 26px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.demo-sq-pill {
  height: 38px;
  min-width: 112px;
  padding: 0 16px;
  border-radius: 0px;
  flex-shrink: 0;
  font-weight: 800;
  font-size: var(--ui-font-xs);
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  transition:
    border-radius 0.24s var(--ease-decel),
    background-color 0.16s var(--ease-decel),
    color 0.16s var(--ease-decel);
}

.demo-sq-pill:hover,
.demo-sq-pill.active {
  border-radius: 19px;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.width-host {
  overflow: hidden;
  padding: 8px 0;
}

.width-host.vt-width-target {
  view-transition-name: reader-column;
}

.width-sample {
  margin: 0 auto;
  padding: 16px 20px;
  background-color: var(--bg-elevated);
  border-left: 4px solid var(--accent-primary);
  font-size: var(--ui-font-md);
  line-height: 1.75;
  color: var(--text-secondary);
}

.width-sample p {
  margin: 0 0 8px 0;
}

.width-sample p:last-child {
  margin-bottom: 0;
}

.typo-scale {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.typo-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-hairline);
}

.typo-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.typo-row code {
  width: 120px;
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--accent-primary-text);
  flex-shrink: 0;
}
</style>
