<script setup lang="ts">
import {
  VlAlert,
  VlBadge,
  VlButton,
  VlCard,
  VlStatTile,
  useThemeMode,
  getAllIconNames,
} from '@valance-ui/vue'
import { DEMO_SECTIONS } from '../demoCatalog'

const emit = defineEmits<{
  (e: 'navigate', id: string): void
}>()

const { resolvedTheme, accentScheme, toggleTheme, toggleAccent } = useThemeMode()
const iconCount = getAllIconNames().length
</script>

<template>
  <div class="demo-view">
    <section class="hero-banner shape-rect">
      <span class="hero-accent shape-rect" />
      <div class="hero-body">
        <div class="hero-tags">
          <VlBadge tone="primary" variant="solid">VALENCE UI · V1.0</VlBadge>
          <VlBadge tone="secondary">M3 EXPRESSIVE FLAT GEOMETRIC</VlBadge>
          <VlBadge tone="neutral">VUE 3 + TYPESCRIPT</VlBadge>
        </div>

        <h1 class="hero-title">Valance Flat Geometric Design System</h1>
        <p class="hero-desc">
          提炼并统一自 <strong>CatsOnPlains 阅读工作台</strong> 与 <strong>The Valence Project</strong> 的高表现力扁平几何 Vue 3 组件库与 VitePress 主题系统。坚持严格的三大几何法则、零投影色调层级与非线性物理手势交互。
        </p>

        <div class="hero-actions">
          <VlButton variant="primary" icon-right="arrow-right" @click="emit('navigate', 'gestures')">
            体验手势抽屉与 Dock-to-Sheet
          </VlButton>
          <VlButton variant="secondary" icon="palette" @click="toggleAccent($event)">
            对调主题色 ({{ accentScheme === 'default' ? '主橘 / 辅青' : '主青 / 辅橘' }})
          </VlButton>
          <VlButton
            variant="outline"
            :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
            @click="toggleTheme($event)"
          >
            切换{{ resolvedTheme === 'dark' ? '亮色暖纸' : '暗色炭岩' }}
          </VlButton>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <VlStatTile title="核心组件数量" value="60+" subtitle="含图表、时间线、命令面板、自绘表盘/日历/选择框" badge="VUE 3" tone="primary" />
      <VlStatTile title="内置几何图标" :value="iconCount" subtitle="16×16 统一视框 · 真镂空路径" badge="SVG" tone="secondary" />
      <VlStatTile title="几何轮廓体系" value="3 + 35" subtitle="0px · 50% · 9999px + M3E 35 图形（禁用中圆角）" badge="STRICT" tone="primary" />
      <VlStatTile title="阴影与模糊" value="0 px" subtitle="禁用一切 box-shadow / drop-shadow" badge="FLAT" tone="secondary" />
    </section>

    <!-- Strict 3-Geometry Rule Visual Proof -->
    <VlCard title="三大严格几何法则（Three-Geometry Law）" subtitle="任何元素仅允许在这三种几何形态之间存在或进行非线性形变过渡" accent-side="top" accent-tone="primary">
      <div class="geo-grid">
        <div class="geo-card shape-rect">
          <div class="geo-preview">
            <div class="geo-rect shape-rect" />
          </div>
          <strong>1. 纯直角矩形 · Pure Rect</strong>
          <code>border-radius: 0</code>
          <span>用于页面画布、分割面板、卡片容器、工具栏、表格及按钮静态。</span>
        </div>

        <div class="geo-card shape-rect">
          <div class="geo-preview">
            <div class="geo-circle shape-circle" />
          </div>
          <strong>2. 纯正圆 · Pure Circle</strong>
          <code>border-radius: 50% (W === H)</code>
          <span>用于活动栏激活态、图标按钮、关闭按钮、状态点、头像与空状态核心。</span>
        </div>

        <div class="geo-card shape-rect">
          <div class="geo-preview">
            <div class="geo-pill shape-pill" />
          </div>
          <strong>3. 纯胶囊 · Pure Pill</strong>
          <code>border-radius: 9999px / calc(H / 2)</code>
          <span>用于悬浮 Dock、分段滑动指示器、药丸徽章、搜索框及按钮悬停形变终态。</span>
        </div>
      </div>
    </VlCard>

    <VlAlert tone="warning" title="设计禁令：零中等圆角 · 零阴影">
      严禁使用 <code>border-radius: 4px / 8px / 12px</code> 等中间圆角，严禁使用任何 <code>box-shadow</code>、<code>drop-shadow</code> 或 <code>text-shadow</code>。层级感完全通过 <strong>5 阶表面色阶梯 + 1px 结构细线 + 3~4px 强调条</strong> 建立。
    </VlAlert>

    <!-- Quick Module Directory -->
    <section class="module-grid">
      <VlCard
        v-for="sec in DEMO_SECTIONS.slice(1)"
        :key="sec.id"
        :title="sec.title"
        accent-side="left"
        :accent-tone="sec.tone ?? 'primary'"
        interactive
        padding="sm"
        @click="emit('navigate', sec.id)"
      >
        <template #extra>
          <VlBadge :tone="sec.tone ?? 'primary'" size="xs">{{ sec.subtitle }}</VlBadge>
        </template>
        <p class="mod-desc">{{ sec.summary }}</p>
      </VlCard>
    </section>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-banner {
  position: relative;
  padding: 22px 24px 22px 28px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.hero-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background-color: var(--accent-primary);
}

.hero-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-title {
  margin: 0;
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  color: var(--text-primary);
}

.hero-desc {
  margin: 0;
  font-size: var(--ui-font-base);
  color: var(--text-secondary);
  line-height: 1.65;
  max-width: 780px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}

.geo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.geo-card {
  padding: 14px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.geo-preview {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  margin-bottom: 4px;
}

.geo-rect {
  width: 44px;
  height: 44px;
  background-color: var(--accent-primary);
}

.geo-circle {
  width: 44px;
  height: 44px;
  background-color: var(--accent-secondary);
}

.geo-pill {
  width: 96px;
  height: 36px;
  background-color: var(--accent-primary);
}

.geo-card strong {
  font-size: var(--ui-font-md);
  color: var(--text-primary);
}

.geo-card code {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--accent-primary-text);
}

.geo-card span {
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.mod-desc {
  margin: 4px 0 0 0;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.55;
}
</style>
