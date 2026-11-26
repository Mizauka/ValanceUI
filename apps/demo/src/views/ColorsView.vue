<script setup lang="ts">
import {
  VlButton,
  VlCard,
  VlColorSwatch,
  VlPalettePicker,
  VlSegmentedControl,
  useThemeMode,
  type AccentScheme,
  type SegmentOption,
  type ThemePreference,
} from '@valance-ui/vue'

const {
  themePreference,
  resolvedTheme,
  accentScheme,
  activePalette,
  activeLightBgHex,
  activeDarkBgHex,
  setThemePreference,
  setAccentScheme,
} = useThemeMode()

const themeOptions: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '亮色米白' },
  { value: 'dark', label: '暗色炭岩' },
]

const accentOptions: SegmentOption<AccentScheme>[] = [
  { value: 'default', label: '默认（主橘 #F87F04 · 辅青 #20A4A4）' },
  { value: 'swapped', label: '对调（主青 #20A4A4 · 辅橘 #F87F04）' },
]

const surfaceTokens = [
  { name: 'Activity Rail', token: '--bg-activity', description: '最底层活动栏与轨槽' },
  { name: 'Titlebar', token: '--bg-titlebar', description: '顶部标题栏背景' },
  { name: 'Surface', token: '--bg-surface', description: '侧边面板与表头背景' },
  { name: 'Base / Editor', token: '--bg-base', description: '中央主工作区画布' },
  { name: 'Elevated', token: '--bg-elevated', description: '输入框与高亮卡片' },
  { name: 'Chip / Hover', token: '--bg-chip', description: '默认药丸与按钮底色' },
]

const inkDividerTokens = [
  { name: 'Primary Ink', token: '--text-primary', description: '主标题与强调文本' },
  { name: 'Secondary Ink', token: '--text-secondary', description: '常规标签与副文本' },
  { name: 'Muted Ink', token: '--text-muted', description: '提示词与计数元信息' },
  { name: 'Hairline Divider', token: '--divider-hairline', description: '1px 弱分隔细线' },
  { name: 'Strong Divider', token: '--divider-strong', description: '边框与高对比分界线' },
  { name: 'Sash Handle', token: '--sash-handle', description: '分割条与抽屉把手' },
]

const accentTokens = [
  { name: 'Primary Accent', token: '--accent-primary', description: '主强调实心底色' },
  { name: 'Primary Hover', token: '--accent-primary-hover', description: '主按钮悬停态' },
  { name: 'Primary Soft', token: '--accent-primary-soft', description: '主色调浅底容器' },
  { name: 'Primary Text', token: '--accent-primary-text', description: '浅底上的可读强调字' },
  { name: 'Secondary Accent', token: '--accent-secondary', description: '辅强调实心底色' },
  { name: 'Secondary Soft', token: '--accent-secondary-soft', description: '辅色调浅底容器' },
  { name: 'Secondary Text', token: '--accent-secondary-text', description: '辅色调可读强调字' },
]

const semanticTokens = [
  { name: 'Danger', token: '--accent-danger', description: '删除与危险警告' },
  { name: 'Danger Soft', token: '--accent-danger-soft', description: '危险浅底' },
  { name: 'Success', token: '--accent-success', description: '成功完成态' },
  { name: 'Success Soft', token: '--accent-success-soft', description: '成功浅底' },
  { name: 'Warning', token: '--accent-warning', description: '警告提示' },
  { name: 'Info', token: '--accent-info', description: '信息提示' },
]

const chartTokens = [
  { name: 'Series 1', token: '--chart-series-1' },
  { name: 'Series 2', token: '--chart-series-2' },
  { name: 'Series 3', token: '--chart-series-3' },
  { name: 'Series 4', token: '--chart-series-4' },
  { name: 'Series 5', token: '--chart-series-5' },
  { name: 'Series 6', token: '--chart-series-6' },
]
</script>

<template>
  <div class="demo-view">
    <VlCard title="主题模式与主辅色扩散波纹切换（ViewTransition Ripple）" accent-side="left" accent-tone="primary">
      <div class="controls-stack">
        <div class="ctrl-row">
          <span class="ctrl-label">
            当前方案：{{ activePalette.name }} · {{ resolvedTheme === 'light' ? `亮色 ${activeLightBgHex}` : `暗色 ${activeDarkBgHex}` }}
          </span>
          <VlSegmentedControl
            :model-value="themePreference"
            :options="themeOptions"
            variant="morph-grid"
            :columns="3"
            @select="(val, ev) => setThemePreference(val, ev)"
          />
        </div>

        <div class="ctrl-row">
          <span class="ctrl-label">主辅强调色方案（点击触发圆形波纹过渡）</span>
          <VlSegmentedControl
            :model-value="accentScheme"
            :options="accentOptions"
            variant="morph-grid"
            :columns="2"
            @select="(val, ev) => setAccentScheme(val, ev)"
          />
        </div>

        <div class="ripple-hint-row">
          <VlButton variant="primary" :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'" @click="setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark', $event)">
            从此处点击扩散切换明暗
          </VlButton>
          <VlButton variant="secondary" icon="palette" @click="setAccentScheme(accentScheme === 'default' ? 'swapped' : 'default', $event)">
            从此处点击扩散对调橘青
          </VlButton>
        </div>
      </div>
    </VlCard>

    <VlCard title="主题配色库：明亮 6 色 / 莫奈智能对位取色 / Pride 特殊配色" subtitle="所有浅色方案保持高明度近白底面（L* ≥ 90），莫奈引擎自动避开灰褐/橄榄浊区生成明快和谐副色" accent-side="left" accent-tone="secondary">
      <VlPalettePicker />
    </VlCard>

    <section class="swatch-section">
      <h2 class="sec-heading">表面阶梯 · Surface Ladder（点击色卡复制 CSS 变量）</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="t in surfaceTokens" :key="t.token" v-bind="t" />
      </div>
    </section>

    <section class="swatch-section">
      <h2 class="sec-heading">主辅强调色阶 · Primary & Secondary Accents</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="t in accentTokens" :key="t.token" v-bind="t" />
      </div>
    </section>

    <section class="swatch-section">
      <h2 class="sec-heading">文字墨水与分隔线 · Ink & Structural Hairlines</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="t in inkDividerTokens" :key="t.token" v-bind="t" />
      </div>
    </section>

    <section class="swatch-section">
      <h2 class="sec-heading">语义色与扩展图表色板 · Semantic & Chart Palette</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="t in [...semanticTokens, ...chartTokens]" :key="t.token" v-bind="t" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.controls-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ctrl-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ctrl-label {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-secondary);
}

.ripple-hint-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}

.swatch-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sec-heading {
  margin: 0;
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
  padding-left: 10px;
  border-left: 4px solid var(--accent-secondary);
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: 10px;
}
</style>
