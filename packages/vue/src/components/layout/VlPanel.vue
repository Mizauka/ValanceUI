<script setup lang="ts">
import VlBadge from '../primitives/VlBadge.vue'
import VlScrollArea from './VlScrollArea.vue'

withDefaults(
  defineProps<{
    title?: string
    badge?: string
    badgeTone?: 'primary' | 'secondary' | 'neutral'
    hideHeader?: boolean
    scrollable?: boolean
    padded?: boolean
    headerBorder?: boolean
  }>(),
  {
    badgeTone: 'secondary',
    hideHeader: false,
    scrollable: true,
    padded: false,
    headerBorder: false,
  },
)
</script>

<template>
  <section class="vl-panel shape-rect">
    <div v-if="!hideHeader" class="vl-panel-header shape-rect" :class="{ bordered: headerBorder }">
      <span class="vl-panel-title">{{ title }}</span>
      <div class="vl-panel-header-right">
        <slot name="header-right">
          <VlBadge v-if="badge" :tone="badgeTone" size="xs">{{ badge }}</VlBadge>
        </slot>
      </div>
    </div>

    <slot name="toolbar" />

    <VlScrollArea v-if="scrollable" class="vl-panel-scroll">
      <div :class="{ 'vl-panel-padded': padded }">
        <slot />
      </div>
    </VlScrollArea>
    <div v-else class="vl-panel-static" :class="{ 'vl-panel-padded': padded }">
      <slot />
    </div>

    <slot name="footer" />
  </section>
</template>

<style scoped>
.vl-panel {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-surface);
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.vl-panel-header {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--pane-pad);
  gap: 8px;
  user-select: none;
  flex-shrink: 0;
}

.vl-panel-header.bordered {
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-panel-title {
  font-size: var(--ui-font-md);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-panel-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.vl-panel-scroll {
  flex: 1;
  min-height: 0;
}

.vl-panel-static {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.vl-panel-padded {
  padding: var(--pane-pad);
}
</style>
