<template>
  <kbd class="vl-kbd shape-rect"><slot /></kbd>
</template>

<style scoped>
.vl-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-primary);
  background-color: var(--bg-chip);
  border: 1px solid var(--divider-strong);
  border-bottom-width: 2px;
  white-space: nowrap;
  user-select: none;
}
</style>
