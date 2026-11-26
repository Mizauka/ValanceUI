<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import VlScrollArea from '../layout/VlScrollArea.vue'

export interface TabBarItem {
  id: string
  title: string
  subtitle?: string
  icon?: IconName
  tone?: 'primary' | 'secondary'
  pinned?: boolean
}

withDefaults(
  defineProps<{
    tabs: TabBarItem[]
    activeId: string
    emptyText?: string
    ariaLabel?: string
  }>(),
  {
    emptyText: '暂无打开的标签页',
    ariaLabel: '工作区标签页',
  },
)

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'close', id: string): void
}>()
</script>

<template>
  <div class="vl-tabbar-wrap shape-rect" role="tablist" :aria-label="ariaLabel">
    <VlScrollArea class="vl-tabs-scroll" orientation="horizontal" wheel-horizontal>
      <div class="vl-tabs-row">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="vl-tab-item shape-rect"
          :class="{
            active: activeId === tab.id,
            secondary: tab.tone === 'secondary',
          }"
          role="tab"
          :aria-selected="activeId === tab.id"
          :title="tab.title"
          @click="emit('select', tab.id)"
          @auxclick.middle.prevent="!tab.pinned && emit('close', tab.id)"
        >
          <span class="vl-tab-top-accent shape-rect" />
          <span
            v-if="tab.icon"
            class="vl-tab-icon"
            :class="{
              secondary: tab.tone === 'secondary',
              activeCircle: activeId === tab.id,
            }"
          >
            <VlIcon :name="tab.icon" :size="12" />
          </span>
          <span v-if="tab.subtitle" class="vl-tab-sub">{{ tab.subtitle }}</span>
          <span class="vl-tab-title">{{ tab.title }}</span>
          <button
            v-if="!tab.pinned"
            type="button"
            class="vl-tab-close shape-circle"
            title="关闭标签页"
            @click.stop="emit('close', tab.id)"
          >
            <VlIcon name="close" :size="10" />
          </button>
        </div>

        <div v-if="tabs.length === 0" class="vl-tab-placeholder">
          {{ emptyText }}
        </div>
      </div>
    </VlScrollArea>

    <div v-if="$slots.actions" class="vl-tab-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.vl-tabbar-wrap {
  height: 44px;
  min-height: 44px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  background-color: var(--bg-surface);
  user-select: none;
  overflow: hidden;
  flex-shrink: 0;
}

.vl-tabs-scroll {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.vl-tabs-row {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 2px;
  padding-bottom: 4px;
}

.vl-tab-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px 0 12px;
  min-width: 120px;
  max-width: 240px;
  flex-shrink: 0;
  cursor: pointer;
  background-color: var(--bg-activity);
  color: var(--text-muted);
  font-size: var(--ui-font-md);
  transition: background-color 0.18s var(--ease-standard), color 0.18s var(--ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .vl-tab-item:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-tab-item.active {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-weight: 700;
}

.vl-tab-top-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--accent-primary);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s var(--ease-decel);
}

.vl-tab-item.active .vl-tab-top-accent {
  transform: scaleX(1);
}

.vl-tab-item.active.secondary .vl-tab-top-accent {
  background-color: var(--accent-secondary);
}

.vl-tab-icon {
  width: 20px;
  height: 20px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--accent-primary-text);
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-tab-icon.secondary {
  color: var(--accent-secondary-text);
}

.vl-tab-icon.activeCircle {
  border-radius: 10px;
  background-color: var(--accent-primary-soft);
}

.vl-tab-icon.secondary.activeCircle {
  background-color: var(--accent-secondary-soft);
}

.vl-tab-sub {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.vl-tab-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-tab-close {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.65;
  transition:
    background-color 0.14s var(--ease-standard),
    color 0.14s var(--ease-standard),
    opacity 0.14s ease;
}

@media (hover: hover) and (pointer: fine) {
  .vl-tab-item:hover .vl-tab-close {
    opacity: 1;
  }

  .vl-tab-close:hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.vl-tab-item.active .vl-tab-close {
  opacity: 1;
}

.vl-tab-placeholder {
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.vl-tab-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--pane-pad);
  background-color: var(--bg-surface);
  flex-shrink: 0;
}
</style>
