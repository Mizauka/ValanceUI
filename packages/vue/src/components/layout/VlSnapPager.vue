<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    pages: string[]
    /** Allow direct horizontal finger swiping between pages (disable when nested inside VlPushDrawer) */
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

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const scrollerRef = ref<HTMLElement | null>(null)
const visited = ref<Set<string>>(new Set([props.modelValue]))

let resizeObserver: ResizeObserver | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let programmaticTargetIdx: number | null = null
let lastMeasuredWidth = 0

const activeIndex = computed(() => {
  const idx = props.pages.indexOf(props.modelValue)
  return idx >= 0 ? idx : 0
})

function isPageMounted(id: string): boolean {
  if (!props.lazy) return true
  return visited.value.has(id) || id === props.modelValue
}

function scrollToIndex(idx: number, instant: boolean) {
  const el = scrollerRef.value
  if (!el) return
  const w = el.clientWidth
  if (w <= 0) return
  lastMeasuredWidth = w
  const targetLeft = idx * w
  if (instant) {
    programmaticTargetIdx = null
    el.scrollLeft = targetLeft
    return
  }
  if (Math.abs(el.scrollLeft - targetLeft) < 1) return
  programmaticTargetIdx = idx
  if (typeof el.scrollTo === 'function') {
    // Runs on iOS Safari's native 120Hz ProMotion scroll compositor!
    el.scrollTo({ left: targetLeft, behavior: 'smooth' })
  } else {
    el.scrollLeft = targetLeft
  }
  if (settleTimer !== null) clearTimeout(settleTimer)
  settleTimer = setTimeout(finalizeScroll, 420)
}

function finalizeScroll() {
  if (settleTimer !== null) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
  const el = scrollerRef.value
  if (!el || el.clientWidth <= 0) return
  const idx = Math.max(0, Math.min(props.pages.length - 1, Math.round(el.scrollLeft / el.clientWidth)))
  if (programmaticTargetIdx !== null) {
    programmaticTargetIdx = null
    return
  }
  if (props.swipeable) {
    const targetId = props.pages[idx]
    if (targetId && targetId !== props.modelValue) {
      emit('update:modelValue', targetId)
    }
  }
}

function onScroll() {
  if (!props.swipeable) return
  if (settleTimer !== null) clearTimeout(settleTimer)
  settleTimer = setTimeout(finalizeScroll, 140)
}

watch(
  () => props.modelValue,
  (next) => {
    if (next && !visited.value.has(next)) {
      const copy = new Set(visited.value)
      copy.add(next)
      visited.value = copy
    }
    nextTick(() => scrollToIndex(activeIndex.value, false))
  },
)

watch(
  () => props.pages.join('\0'),
  () => {
    nextTick(() => scrollToIndex(activeIndex.value, true))
  },
)

onMounted(() => {
  nextTick(() => scrollToIndex(activeIndex.value, true))
  if (typeof ResizeObserver !== 'undefined' && scrollerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      const el = scrollerRef.value
      if (!el) return
      const w = el.clientWidth
      if (w > 0 && w !== lastMeasuredWidth) {
        scrollToIndex(activeIndex.value, true)
      }
    })
    resizeObserver.observe(scrollerRef.value)
  }
})

onBeforeUnmount(() => {
  if (settleTimer !== null) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="scrollerRef"
    class="vl-snap-pager"
    :class="{ 'no-swipe': !swipeable }"
    role="region"
    :aria-label="ariaLabel"
    @scroll.passive="onScroll"
    @scrollend="finalizeScroll"
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
</template>

<style scoped>
.vl-snap-pager {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.vl-snap-pager::-webkit-scrollbar {
  display: none;
}

.vl-snap-pager.no-swipe {
  scroll-snap-type: none;
  touch-action: pan-y;
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
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
</style>
