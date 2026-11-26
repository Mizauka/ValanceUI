<script setup lang="ts">
import { ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    defaultOpen?: boolean
    title: string
    count?: string | number
    icon?: IconName
    bordered?: boolean
    surface?: 'surface' | 'elevated' | 'transparent'
  }>(),
  {
    modelValue: undefined,
    defaultOpen: false,
    bordered: false,
    surface: 'surface',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', open: boolean): void
}>()

const internalOpen = ref(props.modelValue ?? props.defaultOpen)

watch(
  () => props.modelValue,
  (val) => {
    if (typeof val === 'boolean') internalOpen.value = val
  },
)

function toggle() {
  const next = !internalOpen.value
  internalOpen.value = next
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="vl-accordion shape-rect" :class="[`surf-${surface}`, { bordered }]">
    <button
      type="button"
      class="vl-accordion-head shape-rect"
      :aria-expanded="internalOpen"
      @click="toggle"
    >
      <span class="vl-accordion-chevron" :class="{ rotated: internalOpen }">
        <VlIcon name="chevron-right" :size="13" />
      </span>
      <VlIcon v-if="icon" :name="icon" :size="14" class="vl-accordion-icon" />
      <span class="vl-accordion-title">{{ title }}</span>
      <slot name="header-right">
        <span v-if="count !== undefined" class="vl-accordion-count shape-pill">
          {{ count }}
        </span>
      </slot>
    </button>

    <div class="vl-accordion-collapse" :class="{ open: internalOpen }">
      <div class="vl-accordion-collapse-inner">
        <div class="vl-accordion-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vl-accordion {
  display: flex;
  flex-direction: column;
}

.vl-accordion.surf-surface {
  background-color: var(--bg-surface);
}

.vl-accordion.surf-elevated {
  background-color: var(--bg-elevated);
}

.vl-accordion.surf-transparent {
  background-color: transparent;
}

.vl-accordion.bordered {
  border: 1px solid var(--divider-hairline);
}

.vl-accordion-head {
  height: var(--ui-row-height);
  min-height: var(--ui-row-height);
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--pane-pad);
  background-color: transparent;
  font-size: var(--ui-font-sm);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  text-align: left;
  transition: background-color 0.18s var(--ease-nonlinear), color 0.18s var(--ease-nonlinear);
}

@media (hover: hover) and (pointer: fine) {
  .vl-accordion-head:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-accordion-chevron {
  display: inline-flex;
  align-items: center;
  transition: transform 0.22s var(--ease-decel), color 0.16s var(--ease-decel);
}

.vl-accordion-chevron.rotated {
  transform: rotate(90deg);
  color: var(--accent-primary-text);
}

.vl-accordion-icon {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-accordion-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-accordion-count {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-accordion-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.24s var(--ease-decel),
    opacity 0.18s var(--ease-decel);
}

.vl-accordion-collapse.open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.vl-accordion-collapse-inner {
  min-height: 0;
  overflow: hidden;
}

.vl-accordion-content {
  transform: translateY(-6px);
  transition: transform 0.24s var(--ease-decel);
}

.vl-accordion-collapse.open .vl-accordion-content {
  transform: translateY(0);
}
</style>
