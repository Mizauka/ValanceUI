<script setup lang="ts">
withDefaults(
  defineProps<{
    brand?: string
    brandTone?: 'primary' | 'secondary'
  }>(),
  {
    brand: 'VALENCE',
    brandTone: 'primary',
  },
)
</script>

<template>
  <footer class="vl-statusbar shape-rect">
    <div class="vl-status-left">
      <span
        v-if="brand"
        class="vl-status-brand shape-rect"
        :class="`t-${brandTone}`"
      >
        {{ brand }}
      </span>
      <slot name="left" />
    </div>

    <div class="vl-status-right">
      <slot name="right" />
    </div>
  </footer>
</template>

<style scoped>
.vl-statusbar {
  height: 26px;
  min-height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: var(--pane-pad);
  background-color: var(--bg-statusbar);
  color: var(--text-statusbar);
  font-size: 11px;
  user-select: none;
  overflow: hidden;
  flex-shrink: 0;
}

.vl-status-left,
.vl-status-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.vl-status-brand {
  height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 var(--pane-pad);
  font-weight: 800;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.vl-status-brand.t-primary {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-status-brand.t-secondary {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}
</style>
