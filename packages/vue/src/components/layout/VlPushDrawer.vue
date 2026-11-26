<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePushDrawerGesture } from '../../composables/usePushDrawerGesture'
import { useBackHandler } from '../../composables/useBackNavigation'

const props = withDefaults(
  defineProps<{
    open: boolean
    drawerWidth?: number
    contained?: boolean
    disabled?: boolean
    ignoreSelector?: string
    scrimOpacity?: number
    ariaLabel?: string
  }>(),
  {
    contained: false,
    disabled: false,
    scrimOpacity: 0.28,
    ariaLabel: '左侧推挤抽屉',
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'drag-state', state: { progress: number; isDragging: boolean; velocity: number }): void
}>()

const shellRef = ref<HTMLElement | null>(null)
const measuredHostWidth = ref(390)
let resizeObserver: ResizeObserver | null = null

function measureWidth() {
  if (props.contained && shellRef.value && shellRef.value.clientWidth > 0) {
    measuredHostWidth.value = shellRef.value.clientWidth
  } else if (typeof window !== 'undefined') {
    measuredHostWidth.value = window.innerWidth
  }
}

const resolvedDrawerWidth = computed(() => {
  if (typeof props.drawerWidth === 'number' && props.drawerWidth > 0) {
    return props.drawerWidth
  }
  if (props.contained) {
    return Math.min(340, Math.max(248, Math.round(measuredHostWidth.value * 0.84)))
  }
  return Math.min(400, Math.max(276, Math.round(measuredHostWidth.value * 0.86)))
})

const isOpenRef = computed(() => props.open)
const enabledRef = computed(() => !props.disabled)

useBackHandler(
  computed(() => props.open && !props.contained && !props.disabled),
  () => {
    emit('update:open', false)
    return true
  },
  150,
)

const { progress, isDragging, velocity, onPointerDown, onClickCapture } = usePushDrawerGesture({
  isOpen: isOpenRef,
  setOpen: (val) => emit('update:open', val),
  drawerWidth: resolvedDrawerWidth,
  enabled: enabledRef,
  ignoreSelector: props.ignoreSelector,
})

watch(
  [progress, isDragging, velocity],
  ([p, d, v]) => {
    emit('drag-state', { progress: p, isDragging: d, velocity: v })
  },
  { immediate: true },
)

const drawerTransformStyle = computed(() => {
  const offset = ((progress.value - 1) * resolvedDrawerWidth.value).toFixed(2)
  return {
    width: `${resolvedDrawerWidth.value}px`,
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

const pushedMainTransformStyle = computed(() => {
  const offset = (progress.value * resolvedDrawerWidth.value).toFixed(2)
  return {
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open && !props.disabled) {
    emit('update:open', false)
  }
}

onMounted(() => {
  measureWidth()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', measureWidth, { passive: true })
    window.addEventListener('keydown', onKeydown)
  }
  if (typeof ResizeObserver !== 'undefined' && shellRef.value) {
    resizeObserver = new ResizeObserver(measureWidth)
    resizeObserver.observe(shellRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', measureWidth)
    window.removeEventListener('keydown', onKeydown)
  }
})

defineExpose({
  progress,
  isDragging,
  drawerWidth: resolvedDrawerWidth,
})
</script>

<template>
  <div
    ref="shellRef"
    class="vl-push-shell shape-rect"
    :class="{ contained }"
    @pointerdown="onPointerDown"
    @click.capture="onClickCapture"
  >
    <aside
      class="vl-push-drawer shape-rect"
      :class="{ dragging: isDragging, contained }"
      :style="drawerTransformStyle"
      :aria-hidden="!open && !isDragging"
      :aria-label="ariaLabel"
    >
      <slot name="drawer" />
    </aside>

    <div
      class="vl-push-stage shape-rect"
      :class="{ dragging: isDragging }"
      :style="pushedMainTransformStyle"
    >
      <slot />

      <div
        class="vl-drawer-scrim"
        :class="{ active: progress > 0.02, dragging: isDragging }"
        :style="{ opacity: progress * scrimOpacity }"
        @click="emit('update:open', false)"
      />
    </div>

    <slot name="overlay" />
  </div>
</template>

<style scoped>
.vl-push-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--bg-base);
  touch-action: pan-y;
}

.vl-push-shell.contained {
  width: 100%;
  height: 100%;
  --vl-safe-top: 0px;
  --vl-safe-bottom: 0px;
  --vl-safe-left: 0px;
  --vl-safe-right: 0px;
}

.vl-push-drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  background-color: var(--bg-surface);
  border-right: 1px solid var(--divider-hairline);
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transition: transform 0.36s var(--ease-standard);
}

.vl-push-drawer.dragging {
  transition: none;
}

.vl-push-drawer:not(.contained) > :not(.vl-activity-bar) {
  padding-top: var(--vl-safe-top, env(safe-area-inset-top, 0px));
}

.vl-push-stage {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  overflow: hidden;
  transition: transform 0.36s var(--ease-standard);
}

.vl-push-stage.dragging {
  transition: none;
}

.vl-drawer-scrim {
  position: absolute;
  inset: 0;
  background-color: #000000;
  opacity: 0;
  pointer-events: none;
  z-index: 50;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transition: opacity 0.32s var(--ease-standard);
}

.vl-drawer-scrim.dragging {
  transition: none;
}

.vl-drawer-scrim.active {
  pointer-events: auto;
}
</style>
