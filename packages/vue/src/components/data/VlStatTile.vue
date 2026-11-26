<script setup lang="ts">
import VlBadge from '../primitives/VlBadge.vue'
import VlShape from '../primitives/VlShape.vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import type { M3ShapeName } from '../../styles/m3Shapes'

withDefaults(
  defineProps<{
    title: string
    value: string | number
    subtitle?: string
    badge?: string
    tone?: 'primary' | 'secondary' | 'neutral'
    badgeTone?: 'primary' | 'secondary' | 'neutral' | 'success'
    m3Shape?: M3ShapeName
    icon?: IconName
  }>(),
  {
    tone: 'primary',
    badgeTone: 'secondary',
  },
)
</script>

<template>
  <div class="vl-stat-tile shape-rect">
    <span class="vl-stat-accent shape-rect" :class="`t-${tone}`" aria-hidden="true" />
    <div class="vl-stat-head">
      <div class="vl-stat-title-group">
        <VlShape
          v-if="m3Shape"
          :shape="m3Shape"
          hover-shape="sunny"
          :tone="tone"
          variant="soft"
          :size="24"
        >
          <VlIcon v-if="icon" :name="icon" :size="11" />
        </VlShape>
        <span class="vl-stat-name">{{ title }}</span>
      </div>
      <VlBadge v-if="badge" :tone="badgeTone" size="xs">{{ badge }}</VlBadge>
    </div>
    <div class="vl-stat-value">{{ value }}</div>
    <div v-if="subtitle" class="vl-stat-sub">{{ subtitle }}</div>
  </div>
</template>

<style scoped>
.vl-stat-tile {
  position: relative;
  padding: 12px 14px 12px 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.vl-stat-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.vl-stat-accent.t-primary {
  background-color: var(--accent-primary);
}

.vl-stat-accent.t-secondary {
  background-color: var(--accent-secondary);
}

.vl-stat-accent.t-neutral {
  background-color: var(--divider-strong);
}

.vl-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vl-stat-title-group {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.vl-stat-name {
  font-size: var(--ui-font-md);
  font-weight: 800;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}

.vl-stat-sub {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
