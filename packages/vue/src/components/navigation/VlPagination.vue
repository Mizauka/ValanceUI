<script setup lang="ts">
import { computed } from 'vue'
import VlIcon from '../icons/VlIcon.vue'

const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    maxVisible?: number
  }>(),
  {
    maxVisible: 7,
  },
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
}>()

const pages = computed<(number | 'ellipsis')[]>(() => {
  const total = Math.max(1, props.totalPages)
  if (total <= props.maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const curr = Math.max(1, Math.min(total, props.page))
  const list: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, curr - 1)
  const end = Math.min(total - 1, curr + 1)
  if (start > 2) list.push('ellipsis')
  for (let i = start; i <= end; i++) list.push(i)
  if (end < total - 1) list.push('ellipsis')
  list.push(total)
  return list
})

function go(p: number) {
  const clamped = Math.max(1, Math.min(props.totalPages, p))
  if (clamped !== props.page) {
    emit('update:page', clamped)
  }
}
</script>

<template>
  <nav class="vl-pagination" aria-label="分页导航">
    <button
      type="button"
      class="vl-page-nav shape-pill"
      :disabled="page <= 1"
      @click="go(page - 1)"
    >
      <VlIcon name="chevron-left" :size="13" />
      <span>上一页</span>
    </button>

    <div class="vl-page-nums">
      <template v-for="(item, idx) in pages" :key="`${item}-${idx}`">
        <span v-if="item === 'ellipsis'" class="vl-page-ellipsis">…</span>
        <button
          v-else
          type="button"
          class="vl-page-num"
          :class="{ active: item === page }"
          :aria-current="item === page ? 'page' : undefined"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </template>
    </div>

    <button
      type="button"
      class="vl-page-nav shape-pill"
      :disabled="page >= totalPages"
      @click="go(page + 1)"
    >
      <span>下一页</span>
      <VlIcon name="chevron-right" :size="13" />
    </button>
  </nav>
</template>

<style scoped>
.vl-pagination {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  flex-wrap: wrap;
}

.vl-page-nav {
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  background-color: var(--bg-chip);
  color: var(--text-primary);
  transition: background-color 0.18s var(--ease-nonlinear), color 0.18s var(--ease-nonlinear);
}

.vl-page-nav:not(:disabled):hover {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-page-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.vl-page-nums {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.vl-page-num {
  width: 30px;
  height: 30px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-page-num:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.vl-page-num.active {
  border-radius: 15px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-page-ellipsis {
  padding: 0 4px;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
}
</style>
