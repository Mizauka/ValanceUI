<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
  active?: boolean
}

withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    separator?: string
  }>(),
  {
    separator: '/',
  },
)

const emit = defineEmits<{
  (e: 'navigate', item: BreadcrumbItem, index: number): void
}>()
</script>

<template>
  <div class="vl-breadcrumb-bar shape-rect">
    <nav class="vl-breadcrumbs" aria-label="面包屑导航">
      <template v-for="(item, idx) in items" :key="`${item.label}-${idx}`">
        <span v-if="idx > 0" class="vl-crumb-sep">{{ separator }}</span>
        <button
          v-if="item.to && !item.active"
          type="button"
          class="vl-crumb-link"
          @click="emit('navigate', item, idx)"
        >
          {{ item.label }}
        </button>
        <span
          v-else
          class="vl-crumb-text"
          :class="{ active: item.active || idx === items.length - 1 }"
        >
          {{ item.label }}
        </span>
      </template>
      <slot name="badge" />
    </nav>

    <div v-if="$slots.trailing" class="vl-breadcrumb-trailing">
      <slot name="trailing" />
    </div>
  </div>
</template>

<style scoped>
.vl-breadcrumb-bar {
  height: calc(var(--ui-row-height) + 2px);
  min-height: calc(var(--ui-row-height) + 2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--bg-base);
  font-size: var(--ui-font-md);
  user-select: none;
  gap: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.vl-breadcrumbs {
  flex: 1 1 0%;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.vl-crumb-sep,
.vl-crumb-text {
  color: var(--text-muted);
  white-space: nowrap;
}

.vl-crumb-link {
  color: var(--text-muted);
  font-size: inherit;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.16s var(--ease-standard);
}

.vl-crumb-link:hover {
  color: var(--accent-primary-text);
}

.vl-crumb-text.active {
  color: var(--text-primary);
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-breadcrumb-trailing {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>
