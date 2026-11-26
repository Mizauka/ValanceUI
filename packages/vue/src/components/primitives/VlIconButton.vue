<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'

withDefaults(
  defineProps<{
    icon?: IconName
    size?: 'xs' | 'sm' | 'md' | 'lg'
    tone?: 'primary' | 'secondary' | 'danger' | 'neutral'
    active?: boolean
    morphOnHover?: boolean
    surface?: 'chip' | 'transparent'
    disabled?: boolean
    title?: string
    ariaLabel?: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    size: 'md',
    tone: 'primary',
    active: false,
    morphOnHover: false,
    surface: 'chip',
    disabled: false,
    type: 'button',
  },
)

const iconSizeMap = {
  xs: 10,
  sm: 13,
  md: 15,
  lg: 18,
} as const
</script>

<template>
  <button
    :type="type"
    class="vl-icon-btn"
    :class="[
      `sz-${size}`,
      `t-${tone}`,
      `surf-${surface}`,
      { 'is-active': active, 'morph-hover': morphOnHover },
    ]"
    :disabled="disabled"
    :title="title"
    :aria-label="ariaLabel ?? title"
  >
    <slot>
      <VlIcon v-if="icon" :name="icon" :size="iconSizeMap[size]" />
    </slot>
  </button>
</template>

<style scoped>
.vl-icon-btn {
  --icon-btn-size: var(--ui-row-height);
  width: var(--icon-btn-size);
  height: var(--icon-btn-size);
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
  user-select: none;
  transition:
    border-radius 0.28s var(--ease-standard),
    background-color 0.2s var(--ease-standard),
    color 0.2s var(--ease-standard),
    opacity 0.18s ease;
}

.vl-icon-btn.sz-xs {
  --icon-btn-size: 20px;
}

.vl-icon-btn.sz-sm {
  --icon-btn-size: 28px;
}

.vl-icon-btn.sz-md {
  --icon-btn-size: var(--ui-row-height);
}

.vl-icon-btn.sz-lg {
  --icon-btn-size: 36px;
}

.vl-icon-btn.surf-chip {
  background-color: var(--bg-chip);
}

.vl-icon-btn.surf-transparent {
  background-color: transparent;
}

.vl-icon-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .vl-icon-btn:not(:disabled):hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }

  .vl-icon-btn.morph-hover:not(:disabled):hover {
    border-radius: calc(var(--icon-btn-size) / 2);
  }

  .vl-icon-btn.morph-hover.t-primary:not(:disabled):hover {
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }

  .vl-icon-btn.morph-hover.t-secondary:not(:disabled):hover {
    background-color: var(--accent-secondary);
    color: var(--accent-secondary-ink);
  }

  .vl-icon-btn.morph-hover.t-danger:not(:disabled):hover {
    background-color: var(--accent-danger);
    color: var(--accent-danger-ink);
  }
}

.vl-icon-btn:not(:disabled):active,
.vl-icon-btn:not(:disabled).is-touch-active {
  border-radius: calc(var(--icon-btn-size) / 2);
}

.vl-icon-btn.is-active {
  border-radius: calc(var(--icon-btn-size) / 2);
}

.vl-icon-btn.is-active.t-primary {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-icon-btn.is-active.t-secondary {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-icon-btn.is-active.t-danger {
  background-color: var(--accent-danger);
  color: var(--accent-danger-ink);
}

.vl-icon-btn.is-active.t-neutral {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}
</style>
