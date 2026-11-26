<script setup lang="ts">
withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
    strong?: boolean
    label?: string
    spacing?: 'none' | 'sm' | 'md'
  }>(),
  {
    orientation: 'horizontal',
    strong: false,
    spacing: 'none',
  },
)
</script>

<template>
  <div
    class="vl-divider shape-rect"
    :class="[`o-${orientation}`, `sp-${spacing}`, { 'is-strong': strong, 'has-label': Boolean(label) }]"
    role="separator"
    :aria-orientation="orientation"
  >
    <template v-if="orientation === 'horizontal' && label">
      <span class="vl-divider-line" />
      <span class="vl-divider-label">{{ label }}</span>
      <span class="vl-divider-line" />
    </template>
  </div>
</template>

<style scoped>
.vl-divider.o-horizontal {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.vl-divider.o-horizontal:not(.has-label) {
  height: 1px;
  background-color: var(--divider-hairline);
}

.vl-divider.o-horizontal.is-strong:not(.has-label) {
  background-color: var(--divider-strong);
}

.vl-divider-line {
  flex: 1;
  height: 1px;
  background-color: var(--divider-hairline);
}

.vl-divider.is-strong .vl-divider-line {
  background-color: var(--divider-strong);
}

.vl-divider-label {
  font-size: var(--ui-font-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  white-space: nowrap;
}

.vl-divider.o-vertical {
  width: 1px;
  align-self: stretch;
  background-color: var(--divider-hairline);
}

.vl-divider.o-vertical.is-strong {
  background-color: var(--divider-strong);
}

.vl-divider.o-horizontal.sp-sm {
  margin: 8px 0;
}

.vl-divider.o-horizontal.sp-md {
  margin: 16px 0;
}
</style>
