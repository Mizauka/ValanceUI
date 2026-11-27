<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  M3_EXPRESSIVE_SHAPES,
  VlAvatar,
  VlBadge,
  VlButton,
  VlCard,
  VlIcon,
  VlSegmentedControl,
  VlSlider,
  VlShape,
  getLocalizedShapeLabel,
  type M3ShapeCategory,
  type M3ShapeName,
  type SegmentOption,
} from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()

const categoryFilter = ref<'all' | M3ShapeCategory>('all')
const previewTone = ref<'primary' | 'secondary' | 'neutral'>('primary')
const previewVariant = ref<'solid' | 'soft' | 'outline'>('solid')
const selectedShape = ref<M3ShapeName>('clover-4')
const morphActive = ref(false)
const morphToShape = ref<M3ShapeName>('flower')
const morphManualRatio = ref(35)
const autoCycleEnabled = ref(true)

const categoryOptions = computed<SegmentOption<'all' | M3ShapeCategory>[]>(() => [
  { value: 'all', label: t.value.shapes.categories.all },
  { value: 'basic', label: t.value.shapes.categories.basic },
  { value: 'polygon', label: t.value.shapes.categories.polygon },
  { value: 'scalloped', label: t.value.shapes.categories.scalloped },
  { value: 'organic', label: t.value.shapes.categories.organic },
  { value: 'expressive', label: t.value.shapes.categories.expressive },
])

const variantOptions = computed<SegmentOption<'solid' | 'soft' | 'outline'>[]>(() => [
  { value: 'solid', label: t.value.shapes.variants.solid },
  { value: 'soft', label: t.value.shapes.variants.soft },
  { value: 'outline', label: t.value.shapes.variants.outline },
])

const toneOptions = computed<SegmentOption<'primary' | 'secondary' | 'neutral'>[]>(() => [
  { value: 'primary', label: t.value.shapes.tones.primary },
  { value: 'secondary', label: t.value.shapes.tones.secondary },
  { value: 'neutral', label: t.value.shapes.tones.neutral },
])

const filteredShapes = computed(() =>
  categoryFilter.value === 'all'
    ? M3_EXPRESSIVE_SHAPES
    : M3_EXPRESSIVE_SHAPES.filter((s) => s.category === categoryFilter.value),
)

const activeMeta = computed(
  () => M3_EXPRESSIVE_SHAPES.find((s) => s.id === selectedShape.value) ?? M3_EXPRESSIVE_SHAPES[0]!,
)
</script>

<template>
  <div class="demo-view">
    <VlCard
      :title="t.shapes.cardTitle"
      :subtitle="t.shapes.cardSubtitle"
      accent-side="left"
      accent-tone="primary"
    >
      <template #extra>
        <VlBadge tone="secondary" size="xs">35 M3E SHAPES</VlBadge>
      </template>

      <div class="controls-bar">
        <VlSegmentedControl v-model="categoryFilter" :options="categoryOptions" size="sm" surface="activity" />
        <div class="controls-right">
          <VlSegmentedControl v-model="previewVariant" :options="variantOptions" size="sm" />
          <VlSegmentedControl v-model="previewTone" :options="toneOptions" size="sm" />
        </div>
      </div>

      <!-- Interactive Inspector -->
      <div class="inspector-band shape-rect">
        <VlShape
          :shape="selectedShape"
          hover-shape="sunny"
          :active="morphActive"
          active-shape="flower"
          :tone="previewTone"
          :variant="previewVariant"
          :size="92"
          interactive
          @click="morphActive = !morphActive"
        >
          <VlIcon name="sparkles" :size="24" />
        </VlShape>

        <div class="inspector-meta">
          <div class="inspector-title">
            <strong>{{ activeMeta.label }}</strong>
            <span v-if="getLocalizedShapeLabel(activeMeta.id) !== activeMeta.label" class="zh-sub">{{ getLocalizedShapeLabel(activeMeta.id) }}</span>
            <VlBadge tone="primary" size="xs">{{ activeMeta.category }}</VlBadge>
          </div>
          <p class="inspector-desc">{{ t.shapes.inspectorDesc(activeMeta.id) }}</p>
        </div>

        <div class="inspector-avatars">
          <VlAvatar name="VU" size="lg" :m3-shape="selectedShape" tone="primary" />
          <VlAvatar name="M3" size="lg" m3-shape="cookie-6" tone="secondary" />
          <VlAvatar name="EX" size="lg" m3-shape="heart" tone="primary" />
        </div>
      </div>

      <!-- Continuous M3E Vertex Morphing Lab -->
      <div class="morph-lab shape-rect">
        <div class="morph-lab-preview">
          <VlShape
            :shape="selectedShape"
            :morph-to="morphToShape"
            :morph-progress="morphManualRatio / 100"
            :tone="previewTone"
            :variant="previewVariant"
            :size="84"
          />
          <VlShape
            shape="circle"
            :auto-morph="autoCycleEnabled ? ['circle', 'clover-4', 'sunny', 'flower', 'cookie-9', 'heart', 'puffy'] : undefined"
            :cycle-interval="950"
            :morph-duration="520"
            tone="secondary"
            variant="solid"
            :size="84"
          >
            <VlIcon name="refresh" :size="20" />
          </VlShape>
        </div>

        <div class="morph-lab-controls">
          <div class="inspector-title">
            <strong>{{ t.shapes.morphEngineTitle }}</strong>
            <VlBadge tone="secondary" size="xs">{{ selectedShape }} → {{ morphToShape }}</VlBadge>
          </div>
          <p class="inspector-desc">{{ t.shapes.morphEngineDesc }}</p>
          <VlSlider v-model="morphManualRatio" :min="0" :max="100" :label="t.shapes.morphRatioLabel" unit="%" />
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px">
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'flower'">{{ t.shapes.targets.flower }}</VlButton>
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'heart'">{{ t.shapes.targets.heart }}</VlButton>
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'sunny'">{{ t.shapes.targets.sunny }}</VlButton>
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'burst'">{{ t.shapes.targets.burst }}</VlButton>
            <VlButton size="xs" variant="secondary" shape="pill" @click="autoCycleEnabled = !autoCycleEnabled">
              {{ autoCycleEnabled ? t.shapes.autoCyclePause : t.shapes.autoCycleStart }}
            </VlButton>
          </div>
        </div>
      </div>

      <!-- Complete 7x5 M3 Expressive Shape Grid -->
      <div class="m3-grid">
        <button
          v-for="item in filteredShapes"
          :key="item.id"
          type="button"
          class="m3-cell shape-rect"
          :class="{ active: selectedShape === item.id }"
          @click="selectedShape = item.id"
        >
          <VlShape
            :shape="item.id"
            :tone="selectedShape === item.id ? 'secondary' : previewTone"
            :variant="previewVariant"
            :size="48"
          />
          <span class="m3-name">{{ item.label }}</span>
          <span class="m3-zh">{{ getLocalizedShapeLabel(item.id) !== item.label ? getLocalizedShapeLabel(item.id) : item.id }}</span>
        </button>
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

.controls-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.controls-right {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.inspector-band {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  border-left: 4px solid var(--accent-secondary);
}

.inspector-meta {
  flex: 1;
  min-width: 220px;
}

.inspector-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--ui-font-base);
  color: var(--text-primary);
}

.zh-sub {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
}

.inspector-desc {
  margin: 6px 0 0;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.55;
}

.inspector-desc code {
  font-family: var(--font-mono);
  background-color: var(--bg-chip);
  padding: 1px 5px;
  font-size: var(--ui-font-xs);
}

.inspector-avatars {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.morph-lab {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: var(--bg-activity);
  border: 1px solid var(--divider-hairline);
}

.morph-lab-preview {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.morph-lab-controls {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.m3-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
}

.m3-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 6px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

@media (hover: hover) and (pointer: fine) {
  .m3-cell:hover {
    background-color: var(--bg-hover);
    border-color: var(--divider-strong);
  }
}

.m3-cell.active {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
}

.m3-name {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.m3-zh {
  font-size: 10px;
  color: var(--text-muted);
}
</style>
