<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
    variant?: 'soft' | 'solid'
    size?: 'xs' | 'sm' | 'md'
    dot?: boolean
  }>(),
  {
    tone: 'primary',
    variant: 'soft',
    size: 'sm',
    dot: false,
  },
)
</script>

<template>
  <span
    class="vl-badge shape-pill"
    :class="[`t-${tone}`, `v-${variant}`, `sz-${size}`, { 'is-dot': dot }]"
  >
    <span v-if="dot" class="vl-badge-dot shape-circle" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.vl-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}

.vl-badge.sz-xs {
  font-size: var(--ui-font-xs);
  padding: 1px 7px;
}

.vl-badge.sz-sm {
  font-size: var(--ui-font-xs);
  padding: 2px 9px;
}

.vl-badge.sz-md {
  font-size: var(--ui-font-sm);
  padding: 3px 11px;
}

.vl-badge-dot {
  width: 6px;
  height: 6px;
  background-color: currentColor;
  flex-shrink: 0;
}

/* Soft Tones */
.vl-badge.v-soft.t-primary {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-badge.v-soft.t-secondary {
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.vl-badge.v-soft.t-neutral {
  background-color: var(--bg-chip);
  color: var(--text-secondary);
}

.vl-badge.v-soft.t-success {
  background-color: var(--accent-success-soft);
  color: var(--accent-success-text);
}

.vl-badge.v-soft.t-warning {
  background-color: var(--accent-warning-soft);
  color: var(--accent-warning-text);
}

.vl-badge.v-soft.t-danger {
  background-color: var(--accent-danger-soft);
  color: var(--accent-danger-text);
}

.vl-badge.v-soft.t-info {
  background-color: var(--accent-info-soft);
  color: var(--accent-info-text);
}

/* Solid Tones */
.vl-badge.v-solid.t-primary {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-badge.v-solid.t-secondary {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-badge.v-solid.t-neutral {
  background-color: var(--text-primary);
  color: var(--bg-base);
}

.vl-badge.v-solid.t-success {
  background-color: var(--accent-success);
  color: var(--accent-success-ink);
}

.vl-badge.v-solid.t-warning {
  background-color: var(--accent-warning);
  color: var(--accent-warning-ink);
}

.vl-badge.v-solid.t-danger {
  background-color: var(--accent-danger);
  color: var(--accent-danger-ink);
}

.vl-badge.v-solid.t-info {
  background-color: var(--accent-info);
  color: var(--accent-info-ink);
}
</style>
