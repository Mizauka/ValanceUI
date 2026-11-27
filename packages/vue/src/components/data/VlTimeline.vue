<script setup lang="ts">
import { computed } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

export interface TimelineItem {
  id: string | number
  time: string
  title: string
  subtitle?: string
  badge?: string
  tone?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger'
  icon?: IconName
  group?: string
}

export interface TimelineGroup {
  key: string
  label: string
  count?: number | string
  items: TimelineItem[]
}

const props = withDefaults(
  defineProps<{
    items?: TimelineItem[]
    groups?: TimelineGroup[]
    activeId?: string | number | null
    clickable?: boolean
    tone?: 'primary' | 'secondary'
    emptyText?: string
  }>(),
  {
    items: () => [],
    groups: () => [],
    activeId: null,
    clickable: true,
    tone: 'primary',
  },
)

const emit = defineEmits<{
  (e: 'select', item: TimelineItem): void
}>()

const resolvedGroups = computed<TimelineGroup[]>(() => {
  if (props.groups.length > 0) return props.groups
  if (!props.items.length) return []

  const map = new Map<string, TimelineItem[]>()
  for (const item of props.items) {
    const key = item.group || messages.value.timeline.allGroup
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return Array.from(map.entries()).map(([label, items]) => ({
    key: label,
    label,
    count: items.length,
    items,
  }))
})
</script>

<template>
  <div class="vl-timeline" :class="`t-${tone}`">
    <div v-if="resolvedGroups.length === 0" class="vl-tl-empty">
      {{ emptyText ?? messages.timeline.emptyText }}
    </div>

    <section v-for="grp in resolvedGroups" :key="grp.key" class="vl-tl-group">
      <div class="vl-tl-head shape-rect">
        <span class="vl-tl-accent shape-rect" />
        <span class="vl-tl-date">{{ grp.label }}</span>
        <span v-if="grp.count !== undefined" class="vl-tl-count shape-pill">
          {{ grp.count }}
        </span>
      </div>

      <div class="vl-tl-rows">
        <button
          v-for="item in grp.items"
          :key="String(item.id)"
          type="button"
          class="vl-tl-row shape-rect"
          :class="[
            `it-${item.tone ?? tone}`,
            { active: activeId !== null && String(activeId) === String(item.id), clickable },
          ]"
          :disabled="!clickable"
          @click="clickable && emit('select', item)"
        >
          <span class="vl-tl-bar shape-rect" aria-hidden="true" />
          <span class="vl-tl-time">{{ item.time }}</span>
          <VlIcon v-if="item.icon" :name="item.icon" :size="13" class="vl-tl-icon" />
          <span class="vl-tl-main">
            <strong class="vl-tl-title">{{ item.title }}</strong>
            <small v-if="item.subtitle" class="vl-tl-sub">{{ item.subtitle }}</small>
          </span>
          <span v-if="item.badge" class="vl-tl-badge shape-pill">{{ item.badge }}</span>
          <VlIcon v-if="clickable" name="chevron-right" :size="12" class="vl-tl-arrow" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.vl-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vl-tl-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.vl-tl-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vl-tl-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-tl-accent {
  width: 3px;
  height: 14px;
  background-color: var(--accent-primary);
}

.vl-timeline.t-secondary .vl-tl-accent {
  background-color: var(--accent-secondary);
}

.vl-tl-date {
  flex: 1;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.vl-tl-count {
  padding: 1px 8px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.vl-tl-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.vl-tl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
  text-align: left;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.vl-tl-row.clickable {
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .vl-tl-row.clickable:hover {
    background-color: var(--bg-hover);
  }
}

.vl-tl-row.active {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
}

.vl-tl-bar {
  width: 3px;
  align-self: stretch;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-tl-row.it-secondary .vl-tl-bar {
  background-color: var(--accent-secondary);
}

.vl-tl-row.it-success .vl-tl-bar {
  background-color: var(--accent-success);
}

.vl-tl-row.it-warning .vl-tl-bar {
  background-color: var(--accent-warning);
}

.vl-tl-row.it-danger .vl-tl-bar {
  background-color: var(--accent-danger);
}

.vl-tl-row.it-neutral .vl-tl-bar {
  background-color: var(--divider-strong);
}

.vl-tl-time {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.vl-tl-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-tl-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-tl-title {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-tl-sub {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.vl-tl-badge {
  padding: 1px 8px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  flex-shrink: 0;
}

.vl-tl-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
