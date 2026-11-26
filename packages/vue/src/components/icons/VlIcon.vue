<script setup lang="ts">
import { computed } from 'vue'
import { ICON_REGISTRY, type IconName } from './iconRegistry'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    spin?: boolean
  }>(),
  {
    size: 16,
    spin: false,
  },
)

const nodes = computed(() => ICON_REGISTRY[props.name] ?? ICON_REGISTRY['help-circle'] ?? [])
</script>

<template>
  <svg
    class="vl-icon"
    :class="{ 'is-spin': spin }"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <component
      :is="node.tag"
      v-for="(node, idx) in nodes"
      :key="idx"
      v-bind="node.attrs"
    />
  </svg>
</template>

<style scoped>
.vl-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}

.vl-icon.is-spin {
  animation: vl-icon-spin 1s linear infinite;
}

@keyframes vl-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
