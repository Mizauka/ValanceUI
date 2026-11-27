<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import VlScrollArea from '../layout/VlScrollArea.vue'
import { useBackHandler } from '../../composables/useBackNavigation'

const isClient = typeof window !== 'undefined'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    placement?: 'bottom' | 'left' | 'right'
    maxHeight?: string
    maxWidth?: string
    width?: string
    expandable?: boolean
    detent?: 'half' | 'full'
    halfRatio?: number
    fullRatio?: number
    contained?: boolean
    closeOnBackdrop?: boolean
    accentTone?: 'primary' | 'secondary'
  }>(),
  {
    title: '',
    placement: 'bottom',
    maxHeight: '88dvh',
    maxWidth: '640px',
    width: '360px',
    expandable: false,
    detent: 'half',
    halfRatio: 0.56,
    fullRatio: 0.9,
    contained: false,
    closeOnBackdrop: true,
    accentTone: 'primary',
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'update:detent', detent: 'half' | 'full'): void
  (e: 'close'): void
  (e: 'closed'): void
}>()

const sheetRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<InstanceType<typeof VlScrollArea> | null>(null)
const isDragging = ref(false)
const dismissing = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const internalDetent = ref<'half' | 'full'>(props.detent)
const dragHeightPx = ref<number | null>(null)
const hostViewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight || 800 : 800)

let dragStartX = 0
let dragStartY = 0
let dragLastX = 0
let dragLastY = 0
let dragLastTime = 0
let dragVelocityX = 0
let dragVelocityY = 0
let dragStartHeight = 0
let dragStartDetent: 'half' | 'full' = 'half'
let bodyStartX = 0
let bodyStartY = 0
let bodyStartTime = 0
let bodyPullActive = false
let bodyLockedAsInnerScroll = false
let dismissFromOffset: { axis: 'X' | 'Y'; px: number } | null = null
let activeAnimCleanup: (() => void) | null = null
let settleRafId: number | null = null

const halfPx = computed(() => Math.round(hostViewportHeight.value * props.halfRatio))
const fullPx = computed(() =>
  Math.max(halfPx.value + 80, Math.round(hostViewportHeight.value * props.fullRatio)),
)

function syncViewportHeight() {
  if (props.contained) {
    const hostEl = sheetRef.value?.parentElement
    if (hostEl && hostEl.clientHeight > 0) {
      hostViewportHeight.value = hostEl.clientHeight
      return
    }
  }
  if (typeof window !== 'undefined' && window.innerHeight > 0) {
    hostViewportHeight.value = window.innerHeight
  }
}

function setDetent(next: 'half' | 'full') {
  if (internalDetent.value === next) return
  internalDetent.value = next
  emit('update:detent', next)
}

function toggleDetent() {
  cancelSettleRaf()
  dragHeightPx.value = null
  dragOffsetY.value = 0
  setDetent(internalDetent.value === 'full' ? 'half' : 'full')
}

watch(
  () => props.detent,
  (next) => {
    internalDetent.value = next
  },
)

function cancelSettleRaf() {
  if (settleRafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(settleRafId)
    settleRafId = null
  }
}

function clearActiveAnim() {
  activeAnimCleanup?.()
  activeAnimCleanup = null
}

function offscreenTransform(): string {
  if (props.placement === 'left') return 'translate3d(-100%, 0, 0)'
  if (props.placement === 'right') return 'translate3d(100%, 0, 0)'
  return 'translate3d(0, 100%, 0)'
}

function close() {
  emit('update:open', false)
  emit('close')
}

useBackHandler(
  computed(() => props.open && !props.contained),
  () => {
    close()
    return true
  },
  250,
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      syncViewportHeight()
      cancelSettleRaf()
      internalDetent.value = props.detent
      dragHeightPx.value = null
      dismissing.value = false
      dismissFromOffset = null
      isDragging.value = false
      dragOffsetX.value = 0
      dragOffsetY.value = 0
    }
  },
)

const sheetDynamicStyle = computed(() => {
  const base: Record<string, string> = {}
  if (props.placement === 'bottom') {
    if (props.expandable) {
      const targetH =
        dragHeightPx.value !== null
          ? dragHeightPx.value
          : internalDetent.value === 'full'
            ? fullPx.value
            : halfPx.value
      base.height = `${Math.round(targetH)}px`
      base.maxHeight = `${fullPx.value}px`
    } else {
      base.maxHeight = props.maxHeight
    }
    base['--vl-sheet-max-w'] = props.maxWidth
    if (dragOffsetY.value > 0 && (isDragging.value || dismissing.value || settleRafId !== null)) {
      base.transform = `translate3d(0, ${dragOffsetY.value}px, 0)`
      if (isDragging.value) base.transition = 'none'
    }
  } else {
    base.width = props.width
    if (dragOffsetX.value !== 0 && (isDragging.value || dismissing.value || settleRafId !== null)) {
      base.transform = `translate3d(${dragOffsetX.value}px, 0, 0)`
      if (isDragging.value) base.transition = 'none'
    }
  }
  return base
})

const backdropDragStyle = computed(() => {
  if (!isDragging.value) return undefined
  const dim =
    props.placement === 'bottom'
      ? sheetRef.value?.offsetHeight || 420
      : sheetRef.value?.offsetWidth || 360
  const offset = props.placement === 'bottom' ? dragOffsetY.value : Math.abs(dragOffsetX.value)
  if (offset <= 0) return undefined
  const ratio = Math.max(0.05, 1 - offset / Math.max(1, dim))
  return {
    opacity: ratio,
    transition: 'none',
  }
})

function onBeforeEnter(el: Element) {
  clearActiveAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'none'
  htmlEl.style.transform = offscreenTransform()
}

function onEnter(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  syncViewportHeight()
  const totalDim =
    props.placement === 'bottom' ? htmlEl.offsetHeight || 420 : htmlEl.offsetWidth || 360
  const durMs = Math.round(Math.min(460, Math.max(360, 310 + totalDim * 0.16)))
  void htmlEl.offsetHeight

  let settled = false
  let enterRaf: number | null = null
  const finish = () => {
    if (settled) return
    settled = true
    clearActiveAnim()
    done()
  }
  const onEnd = (e: TransitionEvent) => {
    if (e.target === htmlEl && e.propertyName === 'transform') finish()
  }
  const timer = window.setTimeout(finish, durMs + 100)
  htmlEl.addEventListener('transitionend', onEnd)
  activeAnimCleanup = () => {
    if (enterRaf !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(enterRaf)
      enterRaf = null
    }
    window.clearTimeout(timer)
    htmlEl.removeEventListener('transitionend', onEnd)
  }

  const startTransition = () => {
    enterRaf = null
    if (settled) return
    htmlEl.style.transition = `transform ${durMs}ms cubic-bezier(0.26, 0.68, 0.28, 1)`
    htmlEl.style.transform = 'translate3d(0, 0, 0)'
  }

  // Defer one animation frame so heavy sheet children never coalesce away the initial offscreen paint
  if (typeof requestAnimationFrame === 'function') {
    enterRaf = requestAnimationFrame(() => {
      void htmlEl.offsetHeight
      startTransition()
    })
  } else {
    startTransition()
  }
}

function onAfterEnter(el: Element) {
  clearActiveAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = ''
  htmlEl.style.transform = ''
}

function onBeforeLeave(el: Element) {
  clearActiveAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'none'
  if (dismissFromOffset) {
    htmlEl.style.transform =
      dismissFromOffset.axis === 'Y'
        ? `translate3d(0, ${dismissFromOffset.px}px, 0)`
        : `translate3d(${dismissFromOffset.px}px, 0, 0)`
  } else {
    htmlEl.style.transform = 'translate3d(0, 0, 0)'
  }
}

function onLeave(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  const totalDim =
    props.placement === 'bottom'
      ? htmlEl.offsetHeight || 420
      : htmlEl.offsetWidth || 360
  const traveled = dismissFromOffset ? Math.abs(dismissFromOffset.px) : 0
  const remainRatio = Math.max(0.25, Math.min(1, 1 - traveled / Math.max(1, totalDim)))
  const durMs = Math.round(Math.max(260, (310 + totalDim * 0.15) * remainRatio))

  void htmlEl.offsetHeight
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    clearActiveAnim()
    done()
  }
  const onEnd = (e: TransitionEvent) => {
    if (e.target === htmlEl && e.propertyName === 'transform') finish()
  }
  const timer = window.setTimeout(finish, durMs + 80)
  htmlEl.addEventListener('transitionend', onEnd)
  activeAnimCleanup = () => {
    window.clearTimeout(timer)
    htmlEl.removeEventListener('transitionend', onEnd)
  }
  htmlEl.style.transition = `transform ${durMs}ms cubic-bezier(0.32, 0.08, 0.24, 1)`
  htmlEl.style.transform = offscreenTransform()
}

function onAfterLeave() {
  clearActiveAnim()
  cancelSettleRaf()
  dismissing.value = false
  dismissFromOffset = null
  dragOffsetX.value = 0
  dragOffsetY.value = 0
  dragHeightPx.value = null
  emit('closed')
}

function onAnimCancel() {
  clearActiveAnim()
}

function applyExpandableVerticalDrag(dy: number) {
  const half = halfPx.value
  const full = fullPx.value
  const candidateH = dragStartHeight - dy
  if (candidateH >= half) {
    const clampedH =
      candidateH > full ? full + (candidateH - full) * 0.15 : candidateH
    dragHeightPx.value = Math.round(clampedH)
    dragOffsetY.value = 0
  } else {
    dragHeightPx.value = half
    dragOffsetY.value = Math.max(0, half - candidateH)
  }
}

function releaseWithSmoothTransition() {
  isDragging.value = false
  cancelSettleRaf()
  if (typeof requestAnimationFrame === 'function') {
    settleRafId = requestAnimationFrame(() => {
      settleRafId = null
      dragHeightPx.value = null
      dragOffsetX.value = 0
      dragOffsetY.value = 0
    })
  } else {
    dragHeightPx.value = null
    dragOffsetX.value = 0
    dragOffsetY.value = 0
  }
}

function settleExpandableVerticalDrag() {
  const half = halfPx.value
  const full = fullPx.value
  const curH = dragHeightPx.value ?? (dragStartDetent === 'full' ? full : half)
  const downOffset = dragOffsetY.value

  if (downOffset > 0 && (dragVelocityY > 0.42 || downOffset > Math.min(140, half * 0.24))) {
    dismissFromOffset = { axis: 'Y', px: downOffset }
    dismissing.value = true
    isDragging.value = false
    dragHeightPx.value = null
    close()
    return
  }

  let nextDetent: 'half' | 'full'
  if (dragStartDetent === 'full' && downOffset === 0 && dragVelocityY > 0.7 && curH < half + 40) {
    nextDetent = 'half'
  } else if (dragVelocityY < -0.35) {
    nextDetent = 'full'
  } else if (dragVelocityY > 0.35) {
    nextDetent = 'half'
  } else {
    nextDetent = curH >= (half + full) / 2 ? 'full' : 'half'
  }

  setDetent(nextDetent)
  // Keep current height/offset for 1 animation frame after removing .dragging so CSS transition catches it smoothly
  releaseWithSmoothTransition()
}

function onHandlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || typeof window === 'undefined') return
  cancelSettleRaf()
  syncViewportHeight()
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragLastX = e.clientX
  dragLastY = e.clientY
  dragLastTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  dragVelocityX = 0
  dragVelocityY = 0
  dragOffsetX.value = 0
  dragOffsetY.value = 0
  dragStartDetent = internalDetent.value
  dragStartHeight = dragStartDetent === 'full' ? fullPx.value : halfPx.value
  if (props.expandable && props.placement === 'bottom') {
    dragHeightPx.value = dragStartHeight
  }

  window.addEventListener('pointermove', onHandlePointerMove, { passive: false })
  window.addEventListener('pointerup', onHandlePointerUp)
  window.addEventListener('pointercancel', onHandlePointerUp)
}

function onHandlePointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  if (e.cancelable) e.preventDefault()
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dt = Math.max(1, now - dragLastTime)
  if (props.placement === 'bottom') {
    const rawDy = e.clientY - dragStartY
    dragVelocityY = (e.clientY - dragLastY) / dt
    if (props.expandable) {
      applyExpandableVerticalDrag(rawDy)
    } else {
      dragOffsetY.value = Math.max(0, rawDy)
    }
  } else if (props.placement === 'left') {
    const dx = Math.min(0, e.clientX - dragStartX)
    dragVelocityX = (e.clientX - dragLastX) / dt
    dragOffsetX.value = dx
  } else {
    const dx = Math.max(0, e.clientX - dragStartX)
    dragVelocityX = (e.clientX - dragLastX) / dt
    dragOffsetX.value = dx
  }
  dragLastX = e.clientX
  dragLastY = e.clientY
  dragLastTime = now
}

function cleanupDrag() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onHandlePointerMove)
  window.removeEventListener('pointerup', onHandlePointerUp)
  window.removeEventListener('pointercancel', onHandlePointerUp)
}

function finalizeNonExpandableDrag() {
  const sheetHeight = sheetRef.value?.offsetHeight || 420
  const sheetWidth = sheetRef.value?.offsetWidth || 360
  let shouldDismiss = false
  if (props.placement === 'bottom') {
    shouldDismiss = dragVelocityY > 0.42 || dragOffsetY.value > Math.min(160, sheetHeight * 0.26)
  } else if (props.placement === 'left') {
    shouldDismiss = dragVelocityX < -0.42 || Math.abs(dragOffsetX.value) > Math.min(160, sheetWidth * 0.3)
  } else {
    shouldDismiss = dragVelocityX > 0.42 || dragOffsetX.value > Math.min(160, sheetWidth * 0.3)
  }
  if (shouldDismiss) {
    dismissFromOffset =
      props.placement === 'bottom'
        ? { axis: 'Y', px: dragOffsetY.value }
        : { axis: 'X', px: dragOffsetX.value }
    dismissing.value = true
    isDragging.value = false
    close()
    return
  }
  releaseWithSmoothTransition()
}

function onHandlePointerUp() {
  if (!isDragging.value) return
  cleanupDrag()
  if (props.expandable && props.placement === 'bottom') {
    settleExpandableVerticalDrag()
    return
  }
  finalizeNonExpandableDrag()
}

function onBodyTouchStart(e: TouchEvent) {
  if (props.placement !== 'bottom' || e.touches.length !== 1) return
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [data-no-sheet-drag], .vl-slider, .vl-clock-svg, .vl-calendar')) {
    bodyLockedAsInnerScroll = true
    return
  }
  const t = e.touches[0]!
  bodyStartX = t.clientX
  bodyStartY = t.clientY
  bodyStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  bodyPullActive = false
  bodyLockedAsInnerScroll = false
}

function onBodyTouchMove(e: TouchEvent) {
  if (props.placement !== 'bottom' || e.touches.length !== 1 || bodyLockedAsInnerScroll) return
  const t = e.touches[0]!
  const dx = t.clientX - bodyStartX
  const dy = t.clientY - bodyStartY

  if (!bodyPullActive) {
    if (Math.hypot(dx, dy) < 8) return
    if (Math.abs(dx) > Math.abs(dy)) {
      bodyLockedAsInnerScroll = true
      return
    }
    const vp = scrollAreaRef.value?.getViewport()
    const atTop = !vp || vp.scrollTop <= 1
    if (dy > 0 && atTop) {
      cancelSettleRaf()
      syncViewportHeight()
      bodyPullActive = true
      isDragging.value = true
      dragStartY = bodyStartY
      dragLastY = bodyStartY
      dragLastTime = bodyStartTime
      dragVelocityY = 0
      dragOffsetY.value = 0
      dragStartDetent = internalDetent.value
      dragStartHeight = dragStartDetent === 'full' ? fullPx.value : halfPx.value
      if (props.expandable) {
        dragHeightPx.value = dragStartHeight
      }
    } else {
      bodyLockedAsInnerScroll = true
      return
    }
  }

  if (e.cancelable) e.preventDefault()
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dt = Math.max(1, now - dragLastTime)
  dragVelocityY = (t.clientY - dragLastY) / dt
  dragLastY = t.clientY
  dragLastTime = now
  const rawDy = t.clientY - dragStartY
  if (props.expandable) {
    applyExpandableVerticalDrag(rawDy)
  } else {
    dragOffsetY.value = Math.max(0, rawDy)
  }
}

function onBodyTouchEnd() {
  if (!bodyPullActive) {
    bodyLockedAsInnerScroll = false
    return
  }
  bodyPullActive = false
  bodyLockedAsInnerScroll = false
  if (props.expandable) {
    settleExpandableVerticalDrag()
  } else {
    finalizeNonExpandableDrag()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close()
  }
}

onMounted(() => {
  syncViewportHeight()
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', syncViewportHeight, { passive: true })
  }
})

onBeforeUnmount(() => {
  clearActiveAnim()
  cancelSettleRaf()
  cleanupDrag()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', syncViewportHeight)
  }
})
</script>

<template>
  <Teleport to="body" :disabled="contained || !isClient">
    <Transition name="sheet-backdrop">
      <div
        v-if="open"
        class="vl-sheet-backdrop shape-rect"
        :class="{ contained }"
        :style="backdropDragStyle"
        @click="closeOnBackdrop && close()"
      />
    </Transition>

    <Transition
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @enter-cancelled="onAnimCancel"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
      @leave-cancelled="onAnimCancel"
    >
      <section
        v-if="open"
        ref="sheetRef"
        class="vl-sheet shape-rect"
        :class="[`place-${placement}`, `t-${accentTone}`, { contained, expandable, dragging: isDragging }]"
        :style="sheetDynamicStyle"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div
          class="vl-sheet-head shape-rect"
          @pointerdown="onHandlePointerDown"
        >
          <div v-if="placement === 'bottom'" class="vl-sheet-handle-row">
            <span class="vl-sheet-handle shape-pill" :class="{ active: isDragging }" />
          </div>

          <div class="vl-sheet-title-row">
            <div class="vl-sheet-title-left">
              <span class="vl-sheet-accent shape-rect" />
              <h2 class="vl-sheet-title">{{ title }}</h2>
            </div>

            <div class="vl-sheet-title-right">
              <slot name="header-extra" />
              <button
                v-if="expandable && placement === 'bottom'"
                type="button"
                class="vl-sheet-detent-btn shape-pill"
                :class="{ active: internalDetent === 'full' }"
                :aria-label="internalDetent === 'full' ? '切换半屏' : '切换全高'"
                @pointerdown.stop
                @click="toggleDetent"
              >
                {{ internalDetent === 'full' ? '半屏' : '全高' }}
              </button>
              <VlIconButton
                icon="close"
                size="sm"
                morph-on-hover
                title="关闭"
                aria-label="关闭"
                class="vl-sheet-close-btn"
                @pointerdown.stop
                @click="close"
              />
            </div>
          </div>
        </div>

        <div
          class="vl-sheet-scroll-wrap"
          @touchstart.passive="onBodyTouchStart"
          @touchmove="onBodyTouchMove"
          @touchend="onBodyTouchEnd"
          @touchcancel="onBodyTouchEnd"
        >
          <VlScrollArea ref="scrollAreaRef" class="vl-sheet-scroll">
            <div class="vl-sheet-body">
              <slot />
            </div>
          </VlScrollArea>
        </div>

        <footer v-if="$slots.footer" class="vl-sheet-footer shape-rect">
          <slot name="footer" />
        </footer>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vl-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 235;
  background-color: rgba(24, 21, 18, 0.36);
}

.vl-sheet-backdrop.contained {
  position: absolute;
  z-index: 60;
}

.vl-sheet {
  position: fixed;
  z-index: 240;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  overflow: hidden;
  will-change: transform;
  transition: transform 0.38s cubic-bezier(0.26, 0.68, 0.28, 1);
}

.vl-sheet.expandable {
  will-change: transform, height;
  transition:
    height 0.36s cubic-bezier(0.26, 0.68, 0.28, 1),
    transform 0.38s cubic-bezier(0.26, 0.68, 0.28, 1);
}

.vl-sheet.dragging,
.vl-sheet.expandable.dragging {
  transition: none;
}

.vl-sheet.contained {
  position: absolute;
  z-index: 65;
}

.vl-sheet.place-bottom {
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-top: 2px solid var(--accent-primary);
}

@media (min-width: 641px) {
  .vl-sheet.place-bottom:not(.contained) {
    width: min(var(--vl-sheet-max-w, 640px), calc(100% - 48px));
    margin-inline: auto;
    border-left: 1px solid var(--divider-strong);
    border-right: 1px solid var(--divider-strong);
  }
}

.vl-sheet.place-bottom.t-secondary {
  border-top-color: var(--accent-secondary);
}

.vl-sheet.place-left {
  top: 0;
  bottom: 0;
  left: 0;
  max-width: 92%;
  border-right: 2px solid var(--accent-primary);
}

.vl-sheet.place-right {
  top: 0;
  bottom: 0;
  right: 0;
  max-width: 92%;
  border-left: 2px solid var(--accent-primary);
}

.vl-sheet.contained.place-bottom {
  padding-bottom: 0;
}

.vl-sheet-head {
  flex-shrink: 0;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
  padding: 8px 14px 10px 14px;
  user-select: none;
  touch-action: none;
  cursor: grab;
}

.vl-sheet.dragging .vl-sheet-head {
  cursor: grabbing;
}

.vl-sheet-handle-row {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.vl-sheet-handle {
  width: 44px;
  height: 4px;
  background-color: var(--sash-handle);
  transition:
    width 0.2s var(--ease-decel),
    background-color 0.16s var(--ease-decel);
}

.vl-sheet-handle.active {
  width: 72px;
  background-color: var(--accent-primary);
}

.vl-sheet-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.vl-sheet-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.vl-sheet-title-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.vl-sheet-accent {
  width: 5px;
  height: 16px;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-sheet.t-secondary .vl-sheet-accent {
  background-color: var(--accent-secondary);
}

.vl-sheet-title {
  margin: 0;
  font-size: var(--ui-font-lg);
  font-weight: 800;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-sheet-detent-btn {
  height: 26px;
  padding: 0 11px;
  font-size: var(--ui-font-xs);
  font-weight: 800;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.16s var(--ease-decel),
    color 0.16s var(--ease-decel);
}

.vl-sheet-detent-btn.active {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-sheet-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

@media (hover: hover) and (pointer: fine) {
  .vl-sheet-close-btn:hover {
    border-radius: 15px;
    background-color: var(--accent-primary);
    color: var(--accent-primary-ink);
  }
}

.vl-sheet-close-btn:active {
  border-radius: 15px;
  background-color: var(--accent-primary-hover);
  color: var(--accent-primary-ink);
}

.vl-sheet-scroll-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vl-sheet-scroll {
  flex: 1;
  min-height: 0;
}

.vl-sheet-scroll :deep(.csa-viewport) {
  overscroll-behavior-y: none;
}

.vl-sheet-body {
  padding: 14px 14px 24px 14px;
}

.vl-sheet-footer {
  flex-shrink: 0;
  padding: 10px 14px;
  border-top: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
