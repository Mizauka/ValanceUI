<script setup lang="ts">
import { ref } from 'vue'
import {
  VlBadge,
  VlButton,
  VlCard,
  VlSegmentedControl,
  useWidthTransition,
  type SegmentOption,
} from '@valance-ui/vue'

const raceActive = ref(false)
const morphCircleActive = ref(false)
const morphPillActive = ref(false)

const widthPreset = ref<'narrow' | 'standard' | 'wide'>('standard')
const widthMap = { narrow: 420, standard: 620, wide: 820 }
const widthOptions: SegmentOption<'narrow' | 'standard' | 'wide'>[] = [
  { value: 'narrow', label: '窄版心 (420px)' },
  { value: 'standard', label: '标准版心 (620px)' },
  { value: 'wide', label: '宽版心 (820px)' },
]

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
    <VlCard title="非线性缓动曲线赛跑实验室" subtitle="对比 Valance 的三种核心时间函数" accent-side="left" accent-tone="primary">
      <template #extra>
        <VlButton variant="primary" icon="play" @click="raceActive = !raceActive">
          {{ raceActive ? '复位起点' : '触发齐发' }}
        </VlButton>
      </template>

      <div class="racer-list">
        <div class="racer-row">
          <div class="racer-meta">
            <strong>--ease-decel</strong>
            <code>cubic-bezier(0.04, 0.94, 0.12, 1)</code>
            <VlBadge tone="primary" size="xs">高初速减速</VlBadge>
          </div>
          <div class="racer-track shape-rect">
            <span class="racer-puck shape-pill nonlinear" :class="{ go: raceActive }" />
          </div>
        </div>

        <div class="racer-row">
          <div class="racer-meta">
            <strong>--ease-snappy</strong>
            <code>cubic-bezier(0.08, 0.96, 0.14, 1)</code>
            <VlBadge tone="secondary" size="xs">瞬发定位</VlBadge>
          </div>
          <div class="racer-track shape-rect">
            <span class="racer-puck shape-pill expressive" :class="{ go: raceActive }" />
          </div>
        </div>

        <div class="racer-row">
          <div class="racer-meta">
            <strong>--ease-accel-decel</strong>
            <code>cubic-bezier(0.3, 0.08, 0.08, 1)</code>
            <VlBadge tone="neutral" size="xs">高力度先加后减</VlBadge>
          </div>
          <div class="racer-track shape-rect">
            <span class="racer-puck shape-pill standard" :class="{ go: raceActive }" />
          </div>
        </div>
      </div>
    </VlCard>

    <!-- Geometric Morph Playground -->
    <VlCard title="几何形变演练场（Square ↔ Circle & Square ↔ Pill）" accent-side="left" accent-tone="secondary">
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
            <strong>方圆变形 · 活动栏 / 图标钮</strong>
            <p class="morph-desc">在 <code>0px</code>（纯方）与精确半高 <code>26px</code>（纯圆）之间纯 px 连续插值，点击或悬停触发。</p>
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
            <strong>方胶变形 · 主按钮 / 选项条</strong>
            <p class="morph-desc">在 <code>0px</code>（直角）与精确短边半高 <code>19px</code>（<code>calc(H / 2)</code>）之间 M3E 弹簧过渡。</p>
          </div>
        </div>
      </div>
    </VlCard>

    <!-- Reader Column Width Snapshot Morph -->
    <VlCard title="KDE / Win11 风格版心宽度快照剪裁过渡" subtitle="避免实时 reflow 文字抖动，保留阅读锚点行位置" accent-side="top" accent-tone="primary">
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
          <p>
            Valance UI 的阅读画布切换版心宽度时，并不会直接让 <code>max-width</code> 在 340ms 内每一帧重排段落折行（这会导致严重文字抖动），而是借助 View Transitions API 对旧版心与新版心同时做水平 <code>clip-path: inset(...)</code> 剪裁交叉淡入淡出。
          </p>
          <p>
            同时算法会锚定当前视口顶端正在阅读的那一行段落，在新排版提交后瞬间对齐 scrollTop，保证视线焦点零丢失。
          </p>
        </div>
      </div>
    </VlCard>

    <!-- Typography Scale -->
    <VlCard title="桌面端 / 平板 / 手机自适应字号阶梯" surface="surface">
      <div class="typo-scale">
        <div class="typo-row"><code>--ui-font-xs</code><span style="font-size: var(--ui-font-xs)">10px 徽章、时间戳与辅助角标</span></div>
        <div class="typo-row"><code>--ui-font-sm</code><span style="font-size: var(--ui-font-sm)">11px 次级元信息与表单标签</span></div>
        <div class="typo-row"><code>--ui-font-md</code><span style="font-size: var(--ui-font-md)">12px 按钮、输入框与面板标题</span></div>
        <div class="typo-row"><code>--ui-font-base</code><span style="font-size: var(--ui-font-base)">13px 主列表与导航项</span></div>
        <div class="typo-row"><code>--ui-font-lg</code><span style="font-size: var(--ui-font-lg)">14px Sheet 与弹窗标题</span></div>
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
