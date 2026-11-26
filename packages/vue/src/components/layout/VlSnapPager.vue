<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    pages: string[]
    /** Kept for API compatibility */
    swipeable?: boolean
    /** Mount each page lazily on first visit and keep alive afterwards */
    lazy?: boolean
    ariaLabel?: string
  }>(),
  {
    swipeable: false,
    lazy: false,
    ariaLabel: '分页视图',
  },
)

const visited = ref<Set<string>>(new Set([props.modelValue]))
const animated = ref(false)

const activeIndex = computed(() => {
  const idx = props.pages.indexOf(props.modelValue)
  return idx >= 0 ? idx : 0
})

function isPageMounted(id: string): boolean {
  if (!props.lazy) return true
  return visited.value.has(id) || id === props.modelValue
}

const trackStyle = computed(() => ({
  transform: `translate3d(-${activeIndex.value * 100}%, 0, 0)`,
}))

watch(
  () => props.modelValue,
  (next) => {
    animated.value = true
    if (next && !visited.value.has(next)) {
      const copy = new Set(visited.value)
      copy.add(next)
      visited.value = copy
    }
  },
)
</script>

<template>
  <div class="vl-snap-pager" role="region" :aria-label="ariaLabel">
    <div
      class="vl-snap-track"
      :class="{ animated }"
      :style="trackStyle"
    >
      <div
        v-for="pageId in pages"
        :key="pageId"
        class="vl-snap-page"
        :aria-hidden="pageId !== modelValue"
      >
        <slot v-if="isPageMounted(pageId)" :name="pageId" :active="pageId === modelValue" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vl-snap-pager {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  /* Never intercept horizontal swipes so parent VlPushDrawer 120Hz swipe works from anywhere */
}

.vl-snap-track {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.vl-snap-track.animated {
  transition: transform 0.34s var(--ease-standard);
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
