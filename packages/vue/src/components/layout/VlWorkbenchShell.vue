<script setup lang="ts">
import VlSplitPane from './VlSplitPane.vue'
import VlPushDrawer from './VlPushDrawer.vue'

withDefaults(
  defineProps<{
    isMobile?: boolean
    mobileDrawerOpen?: boolean
    dualMode?: boolean
    leftVisible?: boolean
    rightVisible?: boolean
    leftWidth?: number
    rightWidth?: number
    dualSideRatio?: number
    hasLeft?: boolean
    hasRight?: boolean
  }>(),
  {
    isMobile: false,
    mobileDrawerOpen: false,
    dualMode: false,
    leftVisible: true,
    rightVisible: false,
    leftWidth: 288,
    rightWidth: 288,
    dualSideRatio: 0.4,
    hasLeft: true,
    hasRight: true,
  },
)

const emit = defineEmits<{
  (e: 'update:mobileDrawerOpen', open: boolean): void
  (e: 'update:leftWidth', w: number): void
  (e: 'update:rightWidth', w: number): void
  (e: 'update:dualSideRatio', ratio: number): void
}>()
</script>

<template>
  <!-- Mobile Push-Drawer Shell -->
  <VlPushDrawer
    v-if="isMobile"
    :open="mobileDrawerOpen"
    @update:open="emit('update:mobileDrawerOpen', $event)"
  >
    <template #drawer>
      <slot name="mobile-drawer" />
    </template>

    <slot name="titlebar" />

    <div class="vl-wb-mobile-host shape-rect">
      <slot name="center" />
      <slot name="mobile-dock" />
    </div>

    <template #overlay>
      <slot name="mobile-overlay" />
    </template>
  </VlPushDrawer>

  <!-- Desktop / Tablet Multi-Pane Workbench Shell -->
  <div v-else class="vl-wb-shell shape-rect">
    <slot name="titlebar" />

    <VlSplitPane
      :left-visible="leftVisible"
      :right-visible="rightVisible"
      :left-width="leftWidth"
      :right-width="rightWidth"
      :dual-mode="dualMode"
      :dual-side-ratio="dualSideRatio"
      :has-left="hasLeft"
      :has-right="hasRight"
      @update:left-width="emit('update:leftWidth', $event)"
      @update:right-width="emit('update:rightWidth', $event)"
      @update:dual-side-ratio="emit('update:dualSideRatio', $event)"
    >
      <template #activity>
        <slot name="activity" />
      </template>
      <template #left>
        <slot name="left" />
      </template>
      <template #center>
        <slot name="center" />
      </template>
      <template #right>
        <slot name="right" />
      </template>
    </VlSplitPane>

    <slot name="statusbar" />
  </div>
</template>

<style scoped>
.vl-wb-shell {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-base);
}

.vl-wb-mobile-host {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
