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
import { useDemoI18n } from '../i18n'

const emit = defineEmits<{
  (e: 'navigate', id: string): void
}>()

const { t, localizedSections } = useDemoI18n()
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
        <p class="hero-desc">{{ t.overview.heroDesc }}</p>

        <div class="hero-actions">
          <VlButton variant="primary" icon-right="arrow-right" @click="emit('navigate', 'gestures')">
            {{ t.overview.heroButtons.gestures }}
          </VlButton>
          <VlButton variant="secondary" icon="palette" @click="toggleAccent($event)">
            {{ t.overview.heroButtons.swapAccent(accentScheme) }}
          </VlButton>
          <VlButton
            variant="outline"
            :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
            @click="toggleTheme($event)"
          >
            {{ t.overview.heroButtons.toggleTheme(resolvedTheme) }}
          </VlButton>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <VlStatTile :title="t.overview.stats.componentsTitle" value="60+" :subtitle="t.overview.stats.componentsSubtitle" badge="VUE 3" tone="primary" />
      <VlStatTile :title="t.overview.stats.iconsTitle" :value="iconCount" :subtitle="t.overview.stats.iconsSubtitle" badge="SVG" tone="secondary" />
      <VlStatTile :title="t.overview.stats.shapesTitle" value="3 + 35" :subtitle="t.overview.stats.shapesSubtitle" badge="STRICT" tone="primary" />
      <VlStatTile :title="t.overview.stats.shadowTitle" value="0 px" :subtitle="t.overview.stats.shadowSubtitle" badge="FLAT" tone="secondary" />
    </section>

    <!-- Strict 3-Geometry Rule Visual Proof -->
    <VlCard :title="t.overview.rules.cardTitle" :subtitle="t.overview.rules.cardSubtitle" accent-side="top" accent-tone="primary">
      <div class="geo-grid">
        <div class="geo-card shape-rect">
          <div class="geo-preview">
            <div class="geo-rect shape-rect" />
          </div>
          <strong>{{ t.overview.rules.rectTitle }}</strong>
          <code>border-radius: 0</code>
          <span>{{ t.overview.rules.rectDesc }}</span>
        </div>

        <div class="geo-card shape-rect">
          <div class="geo-preview">
            <div class="geo-circle shape-circle" />
          </div>
          <strong>{{ t.overview.rules.circleTitle }}</strong>
          <code>border-radius: 50% (W === H)</code>
          <span>{{ t.overview.rules.circleDesc }}</span>
        </div>

        <div class="geo-card shape-rect">
          <div class="geo-preview">
            <div class="geo-pill shape-pill" />
          </div>
          <strong>{{ t.overview.rules.pillTitle }}</strong>
          <code>border-radius: 9999px / calc(H / 2)</code>
          <span>{{ t.overview.rules.pillDesc }}</span>
        </div>
      </div>
    </VlCard>

    <VlAlert tone="warning" :title="t.overview.banAlert.title">
      {{ t.overview.banAlert.body }}
    </VlAlert>

    <!-- Quick Module Directory -->
    <section class="module-grid">
      <VlCard
        v-for="sec in localizedSections.slice(1)"
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
