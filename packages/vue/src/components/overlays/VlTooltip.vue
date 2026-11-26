<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    text: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    shape?: 'pill' | 'rect'
  }>(),
  {
    placement: 'top',
    shape: 'pill',
  },
)

const visible = ref(false)
</script>

<template>
  <span
    class="vl-tooltip-host"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
    @focusin="visible = true"
    @focusout="visible = false"
  >
    <slot />
    <span
      v-if="visible && text"
      role="tooltip"
      class="vl-tooltip-bubble"
      :class="[`place-${placement}`, shape === 'pill' ? 'shape-pill' : 'shape-rect']"
    >
      {{ text }}
    </span>
  </span>
</template>

<style scoped>
.vl-tooltip-host {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.vl-tooltip-bubble {
  position: absolute;
  z-index: 90;
  padding: 4px 11px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  background-color: var(--text-primary);
  color: var(--bg-base);
}

.vl-tooltip-bubble.place-top {
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
}

.vl-tooltip-bubble.place-bottom {
  left: 50%;
  top: calc(100% + 6px);
  transform: translateX(-50%);
}

.vl-tooltip-bubble.place-left {
  right: calc(100% + 6px);
  top: 50%;
  transform: translateY(-50%);
}

.vl-tooltip-bubble.place-right {
  left: calc(100% + 6px);
  top: 50%;
  transform: translateY(-50%);
}
</style>
