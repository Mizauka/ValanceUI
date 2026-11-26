<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'neutral' | 'outline' | 'ghost' | 'danger'
    shape?: 'morph' | 'rect' | 'pill' | 'circle'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    icon?: IconName
    iconRight?: IconName
    loading?: boolean
    disabled?: boolean
    block?: boolean
    active?: boolean
    type?: 'button' | 'submit' | 'reset'
    title?: string
  }>(),
  {
    variant: 'neutral',
    shape: 'morph',
    size: 'md',
    loading: false,
    disabled: false,
    block: false,
    active: false,
    type: 'button',
  },
)

const iconSizeMap = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 15,
} as const
</script>

<template>
  <button
    :type="type"
    class="vl-btn"
    :class="[
      `v-${variant}`,
      `s-${shape}`,
      `sz-${size}`,
      { 'is-block': block, 'is-active': active, 'is-loading': loading },
    ]"
    :disabled="disabled || loading"
    :title="title"
  >
    <VlIcon v-if="loading" name="refresh" :size="iconSizeMap[size]" spin />
    <VlIcon v-else-if="icon" :name="icon" :size="iconSizeMap[size]" />
    <span v-if="$slots.default" class="vl-btn-label"><slot /></span>
    <VlIcon v-if="iconRight && !loading" :name="iconRight" :size="iconSizeMap[size]" />
  </button>
</template>

<style scoped>
.vl-btn {
  --btn-h: var(--ui-row-height);
  height: var(--btn-h);
  padding: 0 14px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: var(--ui-font-md);
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  user-select: none;
  transition:
    border-radius 0.28s var(--ease-standard),
    background-color 0.2s var(--ease-standard),
    color 0.2s var(--ease-standard),
    border-color 0.2s var(--ease-standard),
    opacity 0.18s ease;
}

.vl-btn.sz-xs {
  --btn-h: 22px;
  padding: 0 9px;
  font-size: var(--ui-font-xs);
  gap: 4px;
}

.vl-btn.sz-sm {
  --btn-h: 26px;
  padding: 0 11px;
  font-size: var(--ui-font-sm);
  gap: 5px;
}

.vl-btn.sz-md {
  --btn-h: var(--ui-row-height);
  padding: 0 14px;
  font-size: var(--ui-font-md);
}

.vl-btn.sz-lg {
  --btn-h: 38px;
  padding: 0 18px;
  font-size: var(--ui-font-base);
  gap: 7px;
}

.vl-btn.is-block {
  width: 100%;
}

.vl-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

/* Shapes (all animated radii strictly in px to avoid %->px or 9999px clamping artifacts) */
.vl-btn.s-rect {
  border-radius: 0px;
}

.vl-btn.s-pill {
  border-radius: calc(var(--btn-h) / 2);
}

.vl-btn.s-circle {
  width: var(--btn-h);
  padding: 0;
  border-radius: calc(var(--btn-h) / 2);
}

.vl-btn.s-morph {
  border-radius: 0px;
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.s-morph:not(:disabled):hover {
    border-radius: calc(var(--btn-h) / 2);
  }
}

.vl-btn.s-morph:not(:disabled):active,
.vl-btn.s-morph:not(:disabled).is-touch-active,
.vl-btn.s-morph.is-active {
  border-radius: calc(var(--btn-h) / 2);
}

/* Variants */
.vl-btn.v-neutral {
  background-color: var(--bg-chip);
  color: var(--text-primary);
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.v-neutral:not(:disabled):hover {
    background-color: var(--bg-hover);
  }
}

.vl-btn.v-neutral.is-active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-btn.v-primary {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.v-primary:not(:disabled):hover {
    background-color: var(--accent-primary-hover);
  }
}

.vl-btn.v-secondary {
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.v-secondary:not(:disabled):hover {
    background-color: var(--accent-secondary);
    color: var(--accent-secondary-ink);
  }
}

.vl-btn.v-secondary.is-active {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-btn.v-outline {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--divider-strong);
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.v-outline:not(:disabled):hover {
    background-color: var(--bg-hover);
    border-color: var(--accent-primary);
    color: var(--accent-primary-text);
  }
}

.vl-btn.v-outline.is-active {
  background-color: var(--accent-primary-soft);
  border-color: var(--accent-primary);
  color: var(--accent-primary-text);
}

.vl-btn.v-ghost {
  background-color: transparent;
  color: var(--text-secondary);
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.v-ghost:not(:disabled):hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-btn.v-ghost.is-active {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-btn.v-danger {
  background-color: var(--accent-danger-soft);
  color: var(--accent-danger-text);
}

@media (hover: hover) and (pointer: fine) {
  .vl-btn.v-danger:not(:disabled):hover {
    background-color: var(--accent-danger);
    color: var(--accent-danger-ink);
  }
}

.vl-btn.v-danger.is-active {
  background-color: var(--accent-danger);
  color: var(--accent-danger-ink);
}
</style>
