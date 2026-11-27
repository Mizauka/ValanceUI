<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, useSlots } from 'vue'
import { usePushDrawerGesture } from '../../composables/usePushDrawerGesture'
import { useBackHandler } from '../../composables/useBackNavigation'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    open: boolean
    rightOpen?: boolean
    drawerWidth?: number
    rightDrawerWidth?: number
    contained?: boolean
    disabled?: boolean
    ignoreSelector?: string
    scrimOpacity?: number
    ariaLabel?: string
    rightAriaLabel?: string
  }>(),
  {
    rightOpen: false,
    contained: false,
    disabled: false,
    scrimOpacity: 0.28,
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'update:rightOpen', open: boolean): void
  (e: 'drag-state', state: { progress: number; rightProgress: number; isDragging: boolean; velocity: number }): void
}>()

const slots = useSlots()
const hasRight = computed(() => Boolean(slots['right-drawer']))
const hasLeft = computed(() => Boolean(slots.drawer) || !hasRight.value)

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

const resolvedRightWidth = computed(() => {
  if (typeof props.rightDrawerWidth === 'number' && props.rightDrawerWidth > 0) {
    return props.rightDrawerWidth
  }
  return resolvedDrawerWidth.value
})

const isOpenRef = computed(() => props.open)
const isRightOpenRef = computed(() => props.rightOpen)
const enabledRef = computed(() => !props.disabled)

function closeDrawers() {
  if (props.open) emit('update:open', false)
  if (props.rightOpen) emit('update:rightOpen', false)
}

useBackHandler(
  computed(() => (props.open || props.rightOpen) && !props.contained && !props.disabled),
  () => {
    closeDrawers()
    return true
  },
  150,
)

const {
  progress,
  rightProgress,
  isDragging,
  velocity,
  onPointerDown,
  onClickCapture,
} = usePushDrawerGesture({
  isOpen: isOpenRef,
  setOpen: (val) => {
    if (val && props.rightOpen) emit('update:rightOpen', false)
    emit('update:open', val)
  },
  drawerWidth: resolvedDrawerWidth,
  hasLeft,
  isRightOpen: isRightOpenRef,
  setRightOpen: (val) => {
    if (val && props.open) emit('update:open', false)
    emit('update:rightOpen', val)
  },
  rightDrawerWidth: resolvedRightWidth,
  hasRight,
  enabled: enabledRef,
  ignoreSelector: props.ignoreSelector,
})

const drawerTransformStyle = computed(() => {
  const offset = ((progress.value - 1) * resolvedDrawerWidth.value).toFixed(2)
  return {
    width: `${resolvedDrawerWidth.value}px`,
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

const rightDrawerTransformStyle = computed(() => {
  const offset = ((1 - rightProgress.value) * resolvedRightWidth.value).toFixed(2)
  return {
    width: `${resolvedRightWidth.value}px`,
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

const pushedMainTransformStyle = computed(() => {
  const offset = (
    progress.value * resolvedDrawerWidth.value -
    rightProgress.value * resolvedRightWidth.value
  ).toFixed(2)
  return {
    transform: `translate3d(${offset}px, 0, 0)`,
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && (props.open || props.rightOpen) && !props.disabled) {
    closeDrawers()
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
  rightProgress,
  isDragging,
  drawerWidth: resolvedDrawerWidth,
  rightDrawerWidth: resolvedRightWidth,
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
      v-if="hasLeft"
      class="vl-push-drawer side-left shape-rect"
      :class="{ dragging: isDragging, contained }"
      :style="drawerTransformStyle"
      :aria-hidden="!open && !isDragging"
      :aria-label="ariaLabel ?? messages.pushDrawer.leftAriaLabel"
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
        :class="{ active: Math.max(progress, rightProgress) > 0.02, dragging: isDragging }"
        :style="{ opacity: Math.max(progress, rightProgress) * scrimOpacity }"
        @click="closeDrawers"
      />
    </div>

    <aside
      v-if="hasRight"
      class="vl-push-drawer side-right shape-rect"
      :class="{ dragging: isDragging, contained }"
      :style="rightDrawerTransformStyle"
      :aria-hidden="!rightOpen && !isDragging"
      :aria-label="rightAriaLabel ?? messages.pushDrawer.rightAriaLabel"
    >
      <slot name="right-drawer" />
    </aside>

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
  backface-visibility: hidden;
  transition: transform 0.36s var(--ease-standard);
}

.vl-push-drawer.side-right {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid var(--divider-hairline);
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
