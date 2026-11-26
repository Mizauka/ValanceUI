<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'

export interface StepItem {
  id: string | number
  title: string
  description?: string
  icon?: IconName
  status?: 'wait' | 'process' | 'finish' | 'error'
}

const props = withDefaults(
  defineProps<{
    items: StepItem[]
    current?: number
    direction?: 'horizontal' | 'vertical'
    tone?: 'primary' | 'secondary'
    clickable?: boolean
  }>(),
  {
    current: 0,
    direction: 'horizontal',
    tone: 'primary',
    clickable: false,
  },
)

const emit = defineEmits<{
  (e: 'update:current', idx: number): void
  (e: 'change', idx: number): void
}>()

function resolveStatus(item: StepItem, idx: number): 'wait' | 'process' | 'finish' | 'error' {
  if (item.status) return item.status
  if (idx < props.current) return 'finish'
  if (idx === props.current) return 'process'
  return 'wait'
}

function handleClick(idx: number) {
  if (!props.clickable) return
  emit('update:current', idx)
  emit('change', idx)
}
</script>

<template>
  <ol class="vl-steps" :class="[`dir-${direction}`, `t-${tone}`]">
    <li
      v-for="(item, idx) in items"
      :key="String(item.id)"
      class="vl-step"
      :class="[`st-${resolveStatus(item, idx)}`, { clickable }]"
      @click="handleClick(idx)"
    >
      <div class="vl-step-head">
        <span
          class="vl-step-node"
          :class="{ 'is-process': resolveStatus(item, idx) === 'process' }"
        >
          <VlIcon v-if="resolveStatus(item, idx) === 'finish'" name="check" :size="12" />
          <VlIcon v-else-if="resolveStatus(item, idx) === 'error'" name="close" :size="12" />
          <VlIcon v-else-if="item.icon" :name="item.icon" :size="12" />
          <span v-else>{{ idx + 1 }}</span>
        </span>
        <span v-if="idx < items.length - 1" class="vl-step-rail" aria-hidden="true" />
      </div>

      <div class="vl-step-body">
        <strong class="vl-step-title">{{ item.title }}</strong>
        <p v-if="item.description" class="vl-step-desc">{{ item.description }}</p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.vl-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 8px;
}

.vl-steps.dir-horizontal {
  flex-direction: row;
  align-items: flex-start;
  overflow-x: auto;
}

.vl-steps.dir-vertical {
  flex-direction: column;
}

.vl-step {
  flex: 1;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vl-steps.dir-vertical .vl-step {
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
  min-height: 52px;
}

.vl-step.clickable {
  cursor: pointer;
}

.vl-step-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vl-steps.dir-vertical .vl-step-head {
  flex-direction: column;
}

.vl-step-node {
  width: 26px;
  height: 26px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  background-color: var(--bg-chip);
  color: var(--text-muted);
  border: 1px solid var(--divider-strong);
  flex-shrink: 0;
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.15s var(--ease-decel),
    color 0.15s var(--ease-decel);
}

.vl-step-node.is-process {
  border-radius: 13px;
}

.vl-step.st-finish .vl-step-node {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
  color: var(--accent-primary-text);
}

.vl-step.st-process .vl-step-node {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-steps.t-secondary .vl-step.st-finish .vl-step-node {
  background-color: var(--accent-secondary-soft);
  border-color: var(--accent-secondary);
  color: var(--accent-secondary-text);
}

.vl-steps.t-secondary .vl-step.st-process .vl-step-node {
  background-color: var(--accent-secondary);
  border-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-step.st-error .vl-step-node {
  background-color: var(--accent-danger-soft);
  border-color: var(--accent-danger);
  color: var(--accent-danger-text);
}

.vl-step-rail {
  flex: 1;
  height: 2px;
  background-color: var(--divider-hairline);
}

.vl-steps.dir-vertical .vl-step-rail {
  width: 2px;
  min-height: 20px;
  height: auto;
}

.vl-step.st-finish .vl-step-rail {
  background-color: var(--accent-primary);
}

.vl-steps.t-secondary .vl-step.st-finish .vl-step-rail {
  background-color: var(--accent-secondary);
}

.vl-step-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 8px;
}

.vl-step-title {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-step.st-wait .vl-step-title {
  color: var(--text-muted);
}

.vl-step-desc {
  margin: 0;
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  line-height: 1.45;
}
</style>
