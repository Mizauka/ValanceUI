<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * Pure GPU-composited (`translate3d` @keyframes) horizontal 2-page transition switcher.
 *
 * - Always keeps `overflow: hidden` so parent `VlPushDrawer` 120Hz horizontal swipe works from anywhere.
 * - Uses smooth iOS-grade deceleration curve (`0.42s cubic-bezier(0.32, 0.72, 0, 1)`) via `@keyframes`
 *   in `base.css`, jumping directly between any two pages with zero middle-page flash.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Ordered page IDs used to compute forward ('next') vs backward ('prev') direction */
    pages?: string[]
    /** Optional explicit direction override ('next' | 'prev') */
    direction?: 'next' | 'prev'
    ariaLabel?: string
  }>(),
  {
    pages: () => [],
    ariaLabel: '分页视图',
  },
)

const activeDirection = ref<'next' | 'prev'>('next')

function resolveDirection(prev: string, next: string): 'next' | 'prev' {
  if (props.direction) return props.direction
  if (props.pages.length > 0) {
    const fromIdx = props.pages.indexOf(prev)
    const toIdx = props.pages.indexOf(next)
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      return toIdx > fromIdx ? 'next' : 'prev'
    }
  }
  return 'next'
}

const transitionName = computed(() =>
  activeDirection.value === 'next' ? 'vl-slide-h-next' : 'vl-slide-h-prev',
)

watch(
  () => props.modelValue,
  (next, prev) => {
    if (!prev || prev === next) return
    activeDirection.value = resolveDirection(prev, next)
  },
)
</script>

<template>
  <div class="vl-snap-pager" role="region" :aria-label="ariaLabel">
    <Transition :name="transitionName">
      <div :key="modelValue" class="vl-snap-page">
        <slot :page-id="modelValue" :active="true" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.vl-snap-pager {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.vl-snap-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
