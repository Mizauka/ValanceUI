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
  type M3ShapeCategory,
  type M3ShapeName,
  type SegmentOption,
} from '@valance-ui/vue'

const categoryFilter = ref<'all' | M3ShapeCategory>('all')
const previewTone = ref<'primary' | 'secondary' | 'neutral'>('primary')
const previewVariant = ref<'solid' | 'soft' | 'outline'>('solid')
const selectedShape = ref<M3ShapeName>('clover-4')
const morphActive = ref(false)
const morphToShape = ref<M3ShapeName>('flower')
const morphManualRatio = ref(35)
const autoCycleEnabled = ref(true)

const categoryOptions: SegmentOption<'all' | M3ShapeCategory>[] = [
  { value: 'all', label: '全部 35 种' },
  { value: 'basic', label: '基础曲线' },
  { value: 'polygon', label: '多边形/钻石' },
  { value: 'scalloped', label: '太阳/曲奇' },
  { value: 'organic', label: '花草云朵' },
  { value: 'expressive', label: '高表现力' },
]

const variantOptions: SegmentOption<'solid' | 'soft' | 'outline'>[] = [
  { value: 'solid', label: '实心 Solid' },
  { value: 'soft', label: '浅色 Soft' },
  { value: 'outline', label: '描边 Outline' },
]

const toneOptions: SegmentOption<'primary' | 'secondary' | 'neutral'>[] = [
  { value: 'primary', label: '主色调' },
  { value: 'secondary', label: '副色调' },
  { value: 'neutral', label: '炭岩中性' },
]

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
      title="Material 3 Expressive 35 种原生几何轮廓（VlShape）"
      subtitle="严格避开中等圆角矩形（0px / 50% / 9999px + 35 种高表现力 SVG 矢量图形）"
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
            <span class="zh-sub">{{ activeMeta.zhLabel }}</span>
            <VlBadge tone="primary" size="xs">{{ activeMeta.category }}</VlBadge>
          </div>
          <p class="inspector-desc">
            当前选中 <code>shape="{{ activeMeta.id }}"</code>。点击左侧图形触发形态变换（默认悬停变形为 <code>sunny</code>，激活态切换为 <code>flower</code>），全部采用统一 <code>0 0 100 100</code> 矢量路径渲染，零阴影、零中等圆角矩形。
          </p>
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
            <strong>实时 72 顶点等弧长形变引擎（M3E Smooth Morphing）</strong>
            <VlBadge tone="secondary" size="xs">{{ selectedShape }} → {{ morphToShape }}</VlBadge>
          </div>
          <p class="inspector-desc">
            支持任意两种 M3E 矢量图形之间 60fps 丝滑顶点插值，用于下拉刷新进度驱动、M3E 形变加载指示器与空状态呼吸占位符。
          </p>
          <VlSlider v-model="morphManualRatio" :min="0" :max="100" label="手动混合形变插值比例" unit="%" />
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px">
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'flower'">目标：繁花</VlButton>
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'heart'">目标：爱心</VlButton>
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'sunny'">目标：晴日</VlButton>
            <VlButton size="xs" variant="outline" shape="pill" @click="morphToShape = 'burst'">目标：爆发</VlButton>
            <VlButton size="xs" variant="secondary" shape="pill" @click="autoCycleEnabled = !autoCycleEnabled">
              {{ autoCycleEnabled ? '暂停连续循环' : '开启连续循环' }}
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
          <span class="m3-zh">{{ item.zhLabel }}</span>
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
