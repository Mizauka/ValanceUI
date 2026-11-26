<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import VlIcon from '../icons/VlIcon.vue'

const props = withDefaults(
  defineProps<{
    target?: HTMLElement | null
    threshold?: number
    tone?: 'primary' | 'secondary'
    bottomOffset?: number
  }>(),
  {
    target: null,
    threshold: 240,
    tone: 'primary',
    bottomOffset: 24,
  },
)

const visible = ref(false)

function getScrollTop(): number {
  if (props.target) return props.target.scrollTop
  if (typeof window !== 'undefined') return window.scrollY || document.documentElement.scrollTop || 0
  return 0
}

function updateVisibility() {
  visible.value = getScrollTop() >= props.threshold
}

function scrollToTop() {
  if (props.target) {
    props.target.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  const el = props.target ?? (typeof window !== 'undefined' ? window : null)
  el?.addEventListener('scroll', updateVisibility, { passive: true })
  updateVisibility()
})

onBeforeUnmount(() => {
  const el = props.target ?? (typeof window !== 'undefined' ? window : null)
  el?.removeEventListener('scroll', updateVisibility)
})
</script>

<template>
  <Transition name="panel-fade">
    <button
      v-if="visible"
      type="button"
      class="vl-back-top"
      :class="`t-${tone}`"
      :style="{ bottom: `calc(${bottomOffset}px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))` }"
      aria-label="回到顶部"
      title="回到顶部"
      @click="scrollToTop"
    >
      <VlIcon name="arrow-up" :size="16" />
    </button>
  </Transition>
</template>

<style scoped>
.vl-back-top {
  position: fixed;
  right: calc(20px + var(--vl-safe-right, env(safe-area-inset-right, 0px)));
  z-index: 80;
  width: 42px;
  height: 42px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
  cursor: pointer;
  transition:
    border-radius 0.22s var(--ease-decel),
    transform 0.2s var(--ease-decel),
    background-color 0.14s var(--ease-decel);
}

.vl-back-top.t-secondary {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

@media (hover: hover) and (pointer: fine) {
  .vl-back-top:hover {
    border-radius: 21px;
    transform: translateY(-2px);
  }
}

.vl-back-top:active {
  border-radius: 21px;
}
</style>
