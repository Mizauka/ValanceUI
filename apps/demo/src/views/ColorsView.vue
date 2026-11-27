<script setup lang="ts">
import { computed } from 'vue'
import {
  VlButton,
  VlCard,
  VlColorSwatch,
  VlPalettePicker,
  VlSegmentedControl,
  getLocalizedPaletteName,
  useThemeMode,
  type AccentScheme,
  type SegmentOption,
  type ThemePreference,
} from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()

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

const themeOptions = computed<SegmentOption<ThemePreference>[]>(() => [
  { value: 'system', label: t.value.colors.themeOptions.system },
  { value: 'light', label: t.value.colors.themeOptions.light },
  { value: 'dark', label: t.value.colors.themeOptions.dark },
])

const accentOptions = computed<SegmentOption<AccentScheme>[]>(() => [
  { value: 'default', label: t.value.colors.accentOptions.default },
  { value: 'swapped', label: t.value.colors.accentOptions.swapped },
])

const surfaceTokens = computed(() => [
  { name: 'Activity Rail', token: '--bg-activity', description: t.value.colors.tokens['--bg-activity'] },
  { name: 'Titlebar', token: '--bg-titlebar', description: t.value.colors.tokens['--bg-titlebar'] },
  { name: 'Surface', token: '--bg-surface', description: t.value.colors.tokens['--bg-surface'] },
  { name: 'Base / Editor', token: '--bg-base', description: t.value.colors.tokens['--bg-base'] },
  { name: 'Elevated', token: '--bg-elevated', description: t.value.colors.tokens['--bg-elevated'] },
  { name: 'Chip / Hover', token: '--bg-chip', description: t.value.colors.tokens['--bg-chip'] },
])

const inkDividerTokens = computed(() => [
  { name: 'Primary Ink', token: '--text-primary', description: t.value.colors.tokens['--text-primary'] },
  { name: 'Secondary Ink', token: '--text-secondary', description: t.value.colors.tokens['--text-secondary'] },
  { name: 'Muted Ink', token: '--text-muted', description: t.value.colors.tokens['--text-muted'] },
  { name: 'Hairline Divider', token: '--divider-hairline', description: t.value.colors.tokens['--divider-hairline'] },
  { name: 'Strong Divider', token: '--divider-strong', description: t.value.colors.tokens['--divider-strong'] },
  { name: 'Sash Handle', token: '--sash-handle', description: t.value.colors.tokens['--sash-handle'] },
])

const accentTokens = computed(() => [
  { name: 'Primary Accent', token: '--accent-primary', description: t.value.colors.tokens['--accent-primary'] },
  { name: 'Primary Hover', token: '--accent-primary-hover', description: t.value.colors.tokens['--accent-primary-hover'] },
  { name: 'Primary Soft', token: '--accent-primary-soft', description: t.value.colors.tokens['--accent-primary-soft'] },
  { name: 'Primary Text', token: '--accent-primary-text', description: t.value.colors.tokens['--accent-primary-text'] },
  { name: 'Secondary Accent', token: '--accent-secondary', description: t.value.colors.tokens['--accent-secondary'] },
  { name: 'Secondary Soft', token: '--accent-secondary-soft', description: t.value.colors.tokens['--accent-secondary-soft'] },
  { name: 'Secondary Text', token: '--accent-secondary-text', description: t.value.colors.tokens['--accent-secondary-text'] },
])

const semanticTokens = computed(() => [
  { name: 'Danger', token: '--accent-danger', description: t.value.colors.tokens['--accent-danger'] },
  { name: 'Danger Soft', token: '--accent-danger-soft', description: t.value.colors.tokens['--accent-danger-soft'] },
  { name: 'Success', token: '--accent-success', description: t.value.colors.tokens['--accent-success'] },
  { name: 'Success Soft', token: '--accent-success-soft', description: t.value.colors.tokens['--accent-success-soft'] },
  { name: 'Warning', token: '--accent-warning', description: t.value.colors.tokens['--accent-warning'] },
  { name: 'Info', token: '--accent-info', description: t.value.colors.tokens['--accent-info'] },
])

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
    <VlCard :title="t.colors.modeCardTitle" accent-side="left" accent-tone="primary">
      <div class="controls-stack">
        <div class="ctrl-row">
          <span class="ctrl-label">
            {{
              t.colors.currentSchemeText(
                getLocalizedPaletteName(activePalette.id, activePalette.name),
                resolvedTheme,
                resolvedTheme === 'light' ? activeLightBgHex : activeDarkBgHex
              )
            }}
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
          <span class="ctrl-label">{{ t.colors.accentControlLabel }}</span>
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
            {{ t.colors.rippleToggleTheme }}
          </VlButton>
          <VlButton variant="secondary" icon="palette" @click="setAccentScheme(accentScheme === 'default' ? 'swapped' : 'default', $event)">
            {{ t.colors.rippleSwapAccent }}
          </VlButton>
        </div>
      </div>
    </VlCard>

    <VlCard :title="t.colors.libraryCardTitle" :subtitle="t.colors.libraryCardSubtitle" accent-side="left" accent-tone="secondary">
      <VlPalettePicker />
    </VlCard>

    <section class="swatch-section">
      <h2 class="sec-heading">{{ t.colors.headings.surface }}</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="tok in surfaceTokens" :key="tok.token" v-bind="tok" />
      </div>
    </section>

    <section class="swatch-section">
      <h2 class="sec-heading">{{ t.colors.headings.accents }}</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="tok in accentTokens" :key="tok.token" v-bind="tok" />
      </div>
    </section>

    <section class="swatch-section">
      <h2 class="sec-heading">{{ t.colors.headings.ink }}</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="tok in inkDividerTokens" :key="tok.token" v-bind="tok" />
      </div>
    </section>

    <section class="swatch-section">
      <h2 class="sec-heading">{{ t.colors.headings.semantic }}</h2>
      <div class="swatch-grid">
        <VlColorSwatch v-for="tok in [...semanticTokens, ...chartTokens]" :key="tok.token" v-bind="tok" />
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
