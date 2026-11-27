<script setup lang="ts">
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

withDefaults(
  defineProps<{
    shape?: 'pill' | 'rect'
    tone?: 'primary' | 'secondary' | 'neutral'
    active?: boolean
    clickable?: boolean
    closable?: boolean
    icon?: IconName
    size?: 'sm' | 'md'
  }>(),
  {
    shape: 'pill',
    tone: 'primary',
    active: false,
    clickable: false,
    closable: false,
    size: 'md',
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
  (e: 'close'): void
}>()
</script>

<template>
  <span
    class="vl-tag"
    :class="[
      shape === 'pill' ? 'shape-pill' : 'shape-rect',
      `t-${tone}`,
      `sz-${size}`,
      { 'is-active': active, 'is-clickable': clickable },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="clickable && emit('click', $event)"
    @keydown.enter.prevent="clickable && emit('click', $event as unknown as MouseEvent)"
  >
    <VlIcon v-if="icon" :name="icon" :size="size === 'sm' ? 11 : 12" />
    <span class="vl-tag-label"><slot /></span>
    <button
      v-if="closable"
      type="button"
      class="vl-tag-close shape-circle"
      :aria-label="messages.tag.removeAria"
      @click.stop="emit('close')"
    >
      <VlIcon name="close" :size="9" />
    </button>
  </span>
</template>

<style scoped>
.vl-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  white-space: nowrap;
  user-select: none;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    background-color 0.18s var(--ease-nonlinear),
    color 0.18s var(--ease-nonlinear);
}

.vl-tag.sz-sm {
  height: 22px;
  padding: 0 9px;
  font-size: var(--ui-font-xs);
}

.vl-tag.sz-md {
  height: 26px;
  padding: 0 11px;
  font-size: var(--ui-font-sm);
}

.vl-tag.is-clickable {
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .vl-tag.is-clickable:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-tag.is-active.t-primary {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-tag.is-active.t-secondary {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-tag.is-active.t-neutral {
  background-color: var(--text-primary);
  color: var(--bg-base);
}

.vl-tag-close {
  width: 15px;
  height: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: currentColor;
  opacity: 0.72;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.vl-tag-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.14);
}
</style>
