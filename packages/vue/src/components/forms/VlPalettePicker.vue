<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useThemeMode } from '../../composables/useThemeMode'
import { useLocale } from '../../composables/useLocale'
import {
  MONET_HARMONY_OPTIONS,
  PRIDE_PALETTES,
  STANDARD_PALETTES,
  generateMonetPalette,
  normalizeHex,
  type MonetHarmonyMode,
} from '../../styles/colorEngine'
import VlIcon from '../icons/VlIcon.vue'

withDefaults(
  defineProps<{
    compact?: boolean
    showMonet?: boolean
    showPride?: boolean
  }>(),
  {
    compact: false,
    showMonet: true,
    showPride: true,
  },
)

const {
  paletteId,
  monetSeed,
  monetHarmony,
  setPalette,
  setMonetSeed,
  setMonetHarmony,
} = useThemeMode()
const { messages } = useLocale()

function palName(id: string, fallback: string) {
  return messages.value.palettePicker.palettes[id]?.name ?? fallback
}

function palSubtitle(id: string, fallback: string) {
  return messages.value.palettePicker.palettes[id]?.subtitle ?? fallback
}

function harmonyLabel(id: MonetHarmonyMode, fallback: string) {
  return messages.value.palettePicker.harmonies[id]?.label ?? fallback
}

function harmonyHint(id: MonetHarmonyMode, fallback: string) {
  return messages.value.palettePicker.harmonies[id]?.hint ?? fallback
}

const hexDraft = ref(monetSeed.value)
watch(monetSeed, (v) => {
  hexDraft.value = v
})

const monetPreview = computed(() =>
  generateMonetPalette(monetSeed.value, monetHarmony.value),
)

const MONET_SWATCHES = ['#F9841A', '#4282E8', '#E35B69', '#2F9C76', '#826AE8', '#E06388']

function applyHexDraft() {
  const clean = hexDraft.value.trim()
  if (/^#?[0-9a-fA-F]{3,6}$/.test(clean)) {
    const norm = normalizeHex(clean)
    hexDraft.value = norm
    setMonetSeed(norm, monetHarmony.value)
  } else {
    hexDraft.value = monetSeed.value
  }
}

function onNativeColorInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  setMonetSeed(val, monetHarmony.value)
}

function selectHarmony(mode: MonetHarmonyMode, event: MouseEvent) {
  setMonetHarmony(mode, event)
}
</script>

<template>
  <div class="vl-palette-picker" :class="{ compact }">
    <!-- Standard Editorial Palettes -->
    <section class="vl-pp-sec">
      <div class="vl-pp-head">
        <span class="vl-pp-title">{{ messages.palettePicker.standardTitle }}</span>
        <span class="vl-pp-meta">{{ messages.palettePicker.standardMeta }}</span>
      </div>
      <div class="vl-pp-grid" :class="{ 'cols-2': compact, 'cols-3': !compact }">
        <button
          v-for="pal in STANDARD_PALETTES"
          :key="pal.id"
          type="button"
          class="vl-pal-card shape-rect"
          :class="{ active: paletteId === pal.id }"
          :style="{ '--pal-p': pal.primaryHex, '--pal-s': pal.secondaryHex }"
          @click="setPalette(pal.id, $event)"
        >
          <span class="vl-pal-bar shape-rect" />
          <span class="vl-pal-dots">
            <span class="vl-pal-dot shape-circle" :style="{ backgroundColor: pal.primaryHex }" />
            <span class="vl-pal-dot shape-circle" :style="{ backgroundColor: pal.secondaryHex }" />
            <span
              class="vl-pal-dot shape-circle"
              :style="{
                backgroundColor: pal.light.surfaces.base,
                border: '1px solid var(--divider-strong)',
              }"
              :title="messages.palettePicker.lightPaperBgTitle"
            />
          </span>
          <span class="vl-pal-info">
            <strong class="vl-pal-name">{{ palName(pal.id, pal.name) }}</strong>
            <small v-if="!compact" class="vl-pal-sub">{{ palSubtitle(pal.id, pal.subtitle) }}</small>
          </span>
          <VlIcon v-if="paletteId === pal.id" name="check" :size="12" class="vl-pal-check" />
        </button>
      </div>
    </section>

    <!-- Monet Dynamic Extraction -->
    <section v-if="showMonet" class="vl-pp-sec">
      <div class="vl-pp-head">
        <span class="vl-pp-title">{{ messages.palettePicker.monetTitle }}</span>
        <button
          type="button"
          class="vl-pp-chip shape-pill"
          :class="{ active: paletteId === 'monet' }"
          @click="setPalette('monet', $event)"
        >
          {{ paletteId === 'monet' ? messages.palettePicker.monetActive : messages.palettePicker.enableMonet }}
        </button>
      </div>

      <div class="vl-monet-box shape-rect" :class="{ active: paletteId === 'monet' }">
        <div class="vl-monet-row">
          <label class="vl-seed-picker shape-rect" :title="messages.palettePicker.pickSeedTitle">
            <input
              type="color"
              class="vl-color-native"
              :value="monetSeed"
              :aria-label="messages.palettePicker.pickSeedAria"
              @input="onNativeColorInput"
            />
            <span class="vl-seed-swatch shape-circle" :style="{ backgroundColor: monetSeed }" />
            <span class="vl-seed-label">{{ messages.palettePicker.seedLabel }}</span>
          </label>

          <div class="flat-input-box" style="flex: 1; min-width: 0">
            <input
              v-model="hexDraft"
              type="text"
              class="flat-input"
              :aria-label="messages.palettePicker.seedHexAria"
              placeholder="#FA871E"
              @change="applyHexDraft"
              @keydown.enter.prevent="applyHexDraft"
            />
          </div>

          <div class="vl-monet-quick">
            <button
              v-for="sw in MONET_SWATCHES"
              :key="sw"
              type="button"
              class="vl-mini-swatch shape-circle"
              :class="{ active: monetSeed === sw && paletteId === 'monet' }"
              :style="{ backgroundColor: sw }"
              :title="messages.palettePicker.useSeedTitle(sw)"
              @click="setMonetSeed(sw, monetHarmony, $event)"
            />
          </div>
        </div>

        <div class="vl-harmony-row">
          <span class="vl-harmony-label">{{ messages.palettePicker.harmonyLabel }}</span>
          <div class="vl-harmony-tabs">
            <button
              v-for="opt in MONET_HARMONY_OPTIONS"
              :key="opt.id"
              type="button"
              class="vl-harmony-btn shape-rect"
              :class="{ active: monetHarmony === opt.id }"
              :title="harmonyHint(opt.id, opt.hint)"
              @click="selectHarmony(opt.id, $event)"
            >
              {{ harmonyLabel(opt.id, opt.label) }}
            </button>
          </div>
        </div>

        <div class="vl-monet-preview">
          <span class="vl-pv-chip shape-pill">
            <span class="vl-pv-dot shape-circle" :style="{ backgroundColor: monetPreview.light.primary.base }" />
            <span>{{ messages.palettePicker.primaryChip(monetPreview.light.primary.base) }}</span>
          </span>
          <span class="vl-pv-chip shape-pill">
            <span class="vl-pv-dot shape-circle" :style="{ backgroundColor: monetPreview.light.secondary.base }" />
            <span>{{ messages.palettePicker.secondaryChip(monetPreview.light.secondary.base) }}</span>
          </span>
          <span class="vl-pv-chip shape-pill">
            <span
              class="vl-pv-dot shape-circle"
              :style="{
                backgroundColor: monetPreview.light.surfaces.base,
                border: '1px solid var(--divider-strong)',
              }"
            />
            <span>{{ messages.palettePicker.surfaceChip(monetPreview.light.surfaces.base) }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Pride Special Palettes -->
    <section v-if="showPride" class="vl-pp-sec">
      <div class="vl-pp-head">
        <span class="vl-pp-title">{{ messages.palettePicker.prideTitle }}</span>
        <span class="vl-pp-meta">{{ messages.palettePicker.prideMeta(PRIDE_PALETTES.length) }}</span>
      </div>
      <div class="vl-pp-grid" :class="{ 'cols-2': compact, 'cols-3': !compact }">
        <button
          v-for="pal in PRIDE_PALETTES"
          :key="pal.id"
          type="button"
          class="vl-pal-card vl-pride-card shape-rect"
          :class="{ active: paletteId === pal.id }"
          :style="{ '--pal-p': pal.primaryHex, '--pal-s': pal.secondaryHex }"
          @click="setPalette(pal.id, $event)"
        >
          <span class="vl-flag-strip shape-rect" aria-hidden="true">
            <span
              v-for="(band, idx) in pal.swatches ?? []"
              :key="idx"
              class="vl-flag-band"
              :style="{ backgroundColor: band }"
            />
          </span>
          <span class="vl-pal-info">
            <strong class="vl-pal-name">{{ palName(pal.id, pal.name) }}</strong>
            <small v-if="!compact" class="vl-pal-sub">{{ palSubtitle(pal.id, pal.subtitle) }}</small>
          </span>
          <VlIcon v-if="paletteId === pal.id" name="check" :size="12" class="vl-pal-check" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.vl-palette-picker {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.vl-pp-sec {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vl-pp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.vl-pp-title {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-pp-meta {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.vl-pp-chip {
  height: 24px;
  padding: 0 10px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.vl-pp-chip.active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-pp-grid {
  display: grid;
  gap: 6px;
}

.vl-pp-grid.cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.vl-pp-grid.cols-3 {
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
}

.vl-pal-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  text-align: left;
  transition:
    background-color 0.18s var(--ease-standard),
    border-color 0.18s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .vl-pal-card:hover {
    background-color: var(--bg-hover);
  }
}

.vl-pal-card.active {
  border-color: var(--accent-primary);
  background-color: var(--accent-primary-soft);
}

.vl-pal-bar {
  width: 3px;
  align-self: stretch;
  background-color: var(--pal-p, var(--accent-primary));
  flex-shrink: 0;
}

.vl-pal-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.vl-pal-dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.vl-flag-strip {
  display: inline-flex;
  width: 24px;
  height: 22px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--divider-hairline);
  flex-shrink: 0;
}

.vl-flag-band {
  flex: 1;
  width: 100%;
}

.vl-pal-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-pal-name {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-pal-sub {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-pal-check {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-monet-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  border-left: 3px solid var(--divider-strong);
}

.vl-monet-box.active {
  border-left-color: var(--accent-primary);
}

.vl-monet-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.vl-seed-picker {
  position: relative;
  height: var(--ui-row-height);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  background-color: var(--bg-chip);
  cursor: pointer;
}

.vl-color-native {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.vl-seed-swatch {
  width: 14px;
  height: 14px;
  border: 1px solid var(--divider-strong);
}

.vl-seed-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-monet-quick {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.vl-mini-swatch {
  width: 18px;
  height: 18px;
  border: 1px solid transparent;
  transition: transform 0.16s var(--ease-nonlinear);
}

.vl-mini-swatch.active {
  border-color: var(--text-primary);
  transform: scale(1.16);
}

.vl-harmony-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.vl-harmony-label {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-muted);
}

.vl-harmony-tabs {
  display: inline-flex;
  flex: 1;
  min-width: 180px;
  border: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
}

.vl-harmony-btn {
  flex: 1;
  height: 28px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-secondary);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.vl-harmony-btn + .vl-harmony-btn {
  border-left: 1px solid var(--divider-hairline);
}

.vl-harmony-btn.active {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-monet-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.vl-pv-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  background-color: var(--bg-surface);
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.vl-pv-dot {
  width: 8px;
  height: 8px;
}
</style>
