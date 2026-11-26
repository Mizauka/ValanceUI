<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'

withDefaults(
  defineProps<{
    mode?: 'desktop' | 'tablet' | 'mobile'
    brandName?: string
    brandTag?: string
    centerText?: string
    centerActive?: boolean
    showLeftToggle?: boolean
    showRightToggle?: boolean
    leftActive?: boolean
    rightActive?: boolean
    leftTitle?: string
    rightTitle?: string
  }>(),
  {
    mode: 'desktop',
    brandName: 'VALENCE',
    centerActive: false,
    showLeftToggle: true,
    showRightToggle: true,
    leftActive: false,
    rightActive: false,
    leftTitle: '显示/隐藏左侧面板',
    rightTitle: '显示/隐藏右侧面板',
  },
)

const emit = defineEmits<{
  (e: 'toggle-left'): void
  (e: 'toggle-right'): void
}>()
</script>

<template>
  <header class="vl-titlebar shape-rect" :class="`mode-${mode}`">
    <div class="vl-tb-left">
      <slot name="left">
        <template v-if="mode === 'mobile'">
          <button
            v-if="showLeftToggle"
            type="button"
            class="vl-panel-toggle"
            :class="{ active: leftActive }"
            :title="leftTitle"
            @click="emit('toggle-left')"
          >
            <VlIcon name="panel-left" :size="16" />
          </button>
        </template>
        <div v-else class="vl-brand-mark">
          <span class="vl-brand-dot shape-circle" />
          <span class="vl-brand-name">{{ brandName }}</span>
          <span v-if="brandTag && mode === 'desktop'" class="vl-brand-tag shape-pill">{{ brandTag }}</span>
        </div>
      </slot>
    </div>

    <div class="vl-tb-center">
      <slot name="center">
        <div v-if="centerText" class="vl-center-pill shape-pill">
          <span class="vl-center-dot shape-circle" :class="{ active: centerActive }" />
          <span class="vl-center-text">{{ centerText }}</span>
        </div>
      </slot>
    </div>

    <div class="vl-tb-right">
      <slot name="right">
        <button
          v-if="mode !== 'mobile' && showLeftToggle"
          type="button"
          class="vl-panel-toggle"
          :class="{ active: leftActive }"
          :title="leftTitle"
          @click="emit('toggle-left')"
        >
          <VlIcon name="panel-left" :size="15" />
        </button>

        <button
          v-if="showRightToggle"
          type="button"
          class="vl-panel-toggle secondary"
          :class="{ active: rightActive }"
          :title="rightTitle"
          @click="emit('toggle-right')"
        >
          <VlIcon :name="mode === 'mobile' ? 'comment' : 'panel-right'" :size="15" />
        </button>
      </slot>
    </div>
  </header>
</template>

<style scoped>
.vl-titlebar {
  height: 42px;
  min-height: 42px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 var(--pane-pad);
  background-color: var(--bg-titlebar);
  user-select: none;
  gap: 12px;
  flex-shrink: 0;
}

.vl-titlebar.mode-tablet {
  grid-template-columns: auto 1fr auto;
  gap: 10px;
}

.vl-titlebar.mode-mobile {
  height: calc(var(--titlebar-mobile-height, clamp(58px, 15.2vw, 66px)) + var(--vl-safe-top, env(safe-area-inset-top, 0px)));
  min-height: calc(var(--titlebar-mobile-height, clamp(58px, 15.2vw, 66px)) + var(--vl-safe-top, env(safe-area-inset-top, 0px)));
  padding:
    var(--vl-safe-top, env(safe-area-inset-top, 0px))
    calc(var(--pane-pad) + var(--vl-safe-right, env(safe-area-inset-right, 0px)))
    0
    calc(var(--pane-pad) + var(--vl-safe-left, env(safe-area-inset-left, 0px)));
  grid-template-columns: minmax(var(--titlebar-mobile-btn, clamp(40px, 10.6vw, 46px)), auto) 1fr minmax(var(--titlebar-mobile-btn, clamp(40px, 10.6vw, 46px)), auto);
  gap: clamp(10px, 2.8vw, 14px);
}

.vl-tb-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.vl-brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.vl-brand-dot {
  width: 10px;
  height: 10px;
  background-color: var(--accent-primary);
  display: inline-block;
  flex-shrink: 0;
}

.vl-brand-name {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  white-space: nowrap;
}

.vl-brand-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 9px;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.vl-tb-center {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.vl-center-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 14px;
  background-color: var(--bg-base);
  max-width: 440px;
  min-width: 0;
}

.vl-titlebar.mode-mobile .vl-center-pill {
  max-width: 100%;
  height: var(--titlebar-mobile-pill-height, clamp(38px, 10vw, 44px));
  padding: 0 clamp(14px, 4vw, 20px);
  gap: clamp(7px, 2vw, 10px);
}

.vl-center-dot {
  width: 7px;
  height: 7px;
  background-color: var(--text-muted);
  flex-shrink: 0;
  transition: background-color 0.2s var(--ease-standard);
}

.vl-titlebar.mode-mobile .vl-center-dot {
  width: clamp(8px, 2.2vw, 9.5px);
  height: clamp(8px, 2.2vw, 9.5px);
}

.vl-center-dot.active {
  background-color: var(--accent-primary);
}

.vl-center-text {
  font-size: var(--ui-font-md);
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

.vl-titlebar.mode-mobile .vl-center-text {
  font-size: var(--ui-font-base);
}

.vl-tb-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(8px, 2.2vw, 10px);
}

.vl-panel-toggle {
  --tb-btn-size: 28px;
  width: var(--tb-btn-size);
  height: var(--tb-btn-size);
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background-color: var(--bg-chip);
  flex-shrink: 0;
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-titlebar.mode-mobile .vl-panel-toggle,
.vl-titlebar.mode-mobile :deep(.vl-icon-btn) {
  --tb-btn-size: var(--titlebar-mobile-btn, clamp(40px, 10.6vw, 46px));
  --icon-btn-size: var(--titlebar-mobile-btn, clamp(40px, 10.6vw, 46px));
  width: var(--titlebar-mobile-btn, clamp(40px, 10.6vw, 46px));
  height: var(--titlebar-mobile-btn, clamp(40px, 10.6vw, 46px));
}

.vl-titlebar.mode-mobile .vl-panel-toggle :deep(.vl-icon),
.vl-titlebar.mode-mobile :deep(.vl-icon-btn .vl-icon) {
  width: var(--titlebar-mobile-icon, clamp(18px, 4.8vw, 22px));
  height: var(--titlebar-mobile-icon, clamp(18px, 4.8vw, 22px));
}

@media (hover: hover) and (pointer: fine) {
  .vl-panel-toggle:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-panel-toggle:active {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  border-radius: calc(var(--tb-btn-size) / 2);
}

.vl-panel-toggle.active {
  border-radius: calc(var(--tb-btn-size) / 2);
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-panel-toggle.secondary.active {
  border-radius: calc(var(--tb-btn-size) / 2);
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}
</style>
