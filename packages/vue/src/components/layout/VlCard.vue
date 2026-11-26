<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    surface?: 'surface' | 'elevated' | 'base' | 'activity'
    accentSide?: 'none' | 'left' | 'top'
    accentTone?: 'primary' | 'secondary' | 'danger' | 'success' | 'neutral'
    bordered?: boolean
    interactive?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }>(),
  {
    surface: 'surface',
    accentSide: 'none',
    accentTone: 'primary',
    bordered: true,
    interactive: false,
    padding: 'md',
  },
)
</script>

<template>
  <article
    class="vl-card shape-rect"
    :class="[
      `surf-${surface}`,
      `acc-${accentSide}`,
      `tone-${accentTone}`,
      `pad-${padding}`,
      { bordered, interactive },
    ]"
  >
    <span v-if="accentSide !== 'none'" class="vl-card-accent shape-rect" aria-hidden="true" />

    <header v-if="$slots.header || title" class="vl-card-head">
      <slot name="header">
        <div class="vl-card-titles">
          <h3 v-if="title" class="vl-card-title">{{ title }}</h3>
          <p v-if="subtitle" class="vl-card-sub">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.extra" class="vl-card-extra">
        <slot name="extra" />
      </div>
    </header>

    <div class="vl-card-body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="vl-card-foot">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.vl-card {
  position: relative;
  display: flex;
  flex-direction: column;
  transition: background-color 0.18s var(--ease-nonlinear);
}

.vl-card.surf-surface {
  background-color: var(--bg-surface);
}

.vl-card.surf-elevated {
  background-color: var(--bg-elevated);
}

.vl-card.surf-base {
  background-color: var(--bg-base);
}

.vl-card.surf-activity {
  background-color: var(--bg-activity);
}

.vl-card.bordered {
  border: 1px solid var(--divider-hairline);
}

.vl-card.interactive {
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .vl-card.interactive:hover {
    background-color: var(--bg-hover);
  }
}

.vl-card-accent {
  position: absolute;
}

.vl-card.acc-left {
  padding-left: 4px;
}

.vl-card.acc-left .vl-card-accent {
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.vl-card.acc-top {
  padding-top: 3px;
}

.vl-card.acc-top .vl-card-accent {
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.vl-card.tone-primary .vl-card-accent {
  background-color: var(--accent-primary);
}

.vl-card.tone-secondary .vl-card-accent {
  background-color: var(--accent-secondary);
}

.vl-card.tone-danger .vl-card-accent {
  background-color: var(--accent-danger);
}

.vl-card.tone-success .vl-card-accent {
  background-color: var(--accent-success);
}

.vl-card.tone-neutral .vl-card-accent {
  background-color: var(--divider-strong);
}

.vl-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.vl-card.pad-none .vl-card-head {
  padding: 0;
}

.vl-card.pad-sm .vl-card-head {
  padding: 10px 12px 0 12px;
}

.vl-card.pad-md .vl-card-head {
  padding: 14px 16px 0 16px;
}

.vl-card.pad-lg .vl-card-head {
  padding: 18px 20px 0 20px;
}

.vl-card-titles {
  min-width: 0;
}

.vl-card-title {
  margin: 0;
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-card-sub {
  margin: 2px 0 0 0;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
}

.vl-card-extra {
  flex-shrink: 0;
}

.vl-card.pad-none .vl-card-body {
  padding: 0;
}

.vl-card.pad-sm .vl-card-body {
  padding: 10px 12px;
}

.vl-card.pad-md .vl-card-body {
  padding: 14px 16px;
}

.vl-card.pad-lg .vl-card-body {
  padding: 18px 20px;
}

.vl-card-foot {
  border-top: 1px solid var(--divider-hairline);
}

.vl-card.pad-sm .vl-card-foot {
  padding: 8px 12px;
}

.vl-card.pad-md .vl-card-foot {
  padding: 10px 16px;
}

.vl-card.pad-lg .vl-card-foot {
  padding: 12px 20px;
}
</style>
