<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import VlScrollArea from '../layout/VlScrollArea.vue'
import { useBackHandler } from '../../composables/useBackNavigation'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    placement?: 'bottom' | 'left' | 'right'
    maxHeight?: string
    maxWidth?: string
    width?: string
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
    contained: false,
    closeOnBackdrop: true,
    accentTone: 'primary',
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'close'): void
}>()

const sheetRef = ref<HTMLElement | null>(null)
const nativeScrollerRef = ref<HTMLElement | null>(null)
const isNativeTouchScroll = ref(false)
const nativeMounted = ref(props.open)
const nativeBackdropRatio = ref(props.open ? 1 : 0)
const isDragging = ref(false)
const dismissing = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)

let dragStartX = 0
let dragStartY = 0
let dragLastX = 0
let dragLastY = 0
let dragLastTime = 0
let dragVelocityX = 0
let dragVelocityY = 0
let dismissFromOffset: { axis: 'X' | 'Y'; px: number } | null = null
let activeAnimCleanup: (() => void) | null = null
let nativeSettleTimer: ReturnType<typeof setTimeout> | null = null
let nativeProgrammaticTarget: 'open' | 'close' | null = null
let coarseMql: MediaQueryList | null = null

function updatePointerMode() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isNativeTouchScroll.value = false
    return
  }
  isNativeTouchScroll.value = window.matchMedia('(pointer: coarse)').matches
}

function getNativeMetrics() {
  const scroller = nativeScrollerRef.value
  if (!scroller) return null
  if (props.placement === 'bottom') {
    const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight)
    return {
      axis: 'top' as const,
      current: scroller.scrollTop,
      openPos: max,
      closePos: 0,
      ratio: Math.max(0, Math.min(1, scroller.scrollTop / max)),
    }
  }
  const max = Math.max(1, scroller.scrollWidth - scroller.clientWidth)
  if (props.placement === 'left') {
    return {
      axis: 'left' as const,
      current: scroller.scrollLeft,
      openPos: 0,
      closePos: max,
      ratio: Math.max(0, Math.min(1, 1 - scroller.scrollLeft / max)),
    }
  }
  return {
    axis: 'left' as const,
    current: scroller.scrollLeft,
    openPos: max,
    closePos: 0,
    ratio: Math.max(0, Math.min(1, scroller.scrollLeft / max)),
  }
}

function setNativeScrollInstant(pos: number) {
  const scroller = nativeScrollerRef.value
  if (!scroller) return
  if (props.placement === 'bottom') scroller.scrollTop = pos
  else scroller.scrollLeft = pos
}

function scrollNativeSmooth(target: 'open' | 'close') {
  const scroller = nativeScrollerRef.value
  const m = getNativeMetrics()
  if (!scroller || !m) {
    if (target === 'close') nativeMounted.value = false
    return
  }
  const dest = target === 'open' ? m.openPos : m.closePos
  if (Math.abs(m.current - dest) < 2) {
    nativeBackdropRatio.value = target === 'open' ? 1 : 0
    if (target === 'close') nativeMounted.value = false
    nativeProgrammaticTarget = null
    return
  }
  nativeProgrammaticTarget = target
  if (typeof scroller.scrollTo === 'function') {
    scroller.scrollTo(m.axis === 'top' ? { top: dest, behavior: 'smooth' } : { left: dest, behavior: 'smooth' })
  } else {
    setNativeScrollInstant(dest)
  }
  if (nativeSettleTimer !== null) clearTimeout(nativeSettleTimer)
  nativeSettleTimer = setTimeout(finalizeNativeScroll, 420)
}

function finalizeNativeScroll() {
  if (nativeSettleTimer !== null) {
    clearTimeout(nativeSettleTimer)
    nativeSettleTimer = null
  }
  isDragging.value = false
  const m = getNativeMetrics()
  if (!m) return
  nativeBackdropRatio.value = m.ratio

  if (nativeProgrammaticTarget === 'close') {
    nativeProgrammaticTarget = null
    if (!props.open) nativeMounted.value = false
    return
  }
  if (nativeProgrammaticTarget === 'open') {
    nativeProgrammaticTarget = null
    return
  }

  if (m.ratio < 0.45 && props.open) {
    nativeMounted.value = false
    close()
  }
}

function onNativeScroll() {
  const m = getNativeMetrics()
  if (!m) return
  nativeBackdropRatio.value = m.ratio
  if (nativeProgrammaticTarget === null) {
    isDragging.value = true
  }
  if (nativeSettleTimer !== null) clearTimeout(nativeSettleTimer)
  nativeSettleTimer = setTimeout(finalizeNativeScroll, 140)
}

function onNativeBackdropClick(e: MouseEvent) {
  if (!props.closeOnBackdrop) return
  if (e.target === e.currentTarget) {
    close()
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
  async (isOpen) => {
    if (isOpen) {
      dismissing.value = false
      dismissFromOffset = null
      isDragging.value = false
      dragOffsetX.value = 0
      dragOffsetY.value = 0
      if (isNativeTouchScroll.value) {
        nativeMounted.value = true
        nativeBackdropRatio.value = 0
        await nextTick()
        const m = getNativeMetrics()
        if (m) setNativeScrollInstant(m.closePos)
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => scrollNativeSmooth('open'))
        } else {
          scrollNativeSmooth('open')
        }
      }
    } else if (isNativeTouchScroll.value && nativeMounted.value) {
      scrollNativeSmooth('close')
    }
  },
)

const sheetDynamicStyle = computed(() => {
  const base: Record<string, string> = {}
  if (props.placement === 'bottom') {
    base.maxHeight = props.maxHeight
    base['--vl-sheet-max-w'] = props.maxWidth
    if ((isDragging.value || dismissing.value) && dragOffsetY.value > 0) {
      base.transform = `translate3d(0, ${dragOffsetY.value}px, 0)`
      if (isDragging.value) base.transition = 'none'
    }
  } else {
    base.width = props.width
    if ((isDragging.value || dismissing.value) && dragOffsetX.value !== 0) {
      base.transform = `translate3d(${dragOffsetX.value}px, 0, 0)`
      if (isDragging.value) base.transition = 'none'
    }
  }
  return base
})

function onBeforeEnter(el: Element) {
  clearActiveAnim()
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'none'
  htmlEl.style.transform = offscreenTransform()
}

function onEnter(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
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
  const timer = window.setTimeout(finish, 450)
  htmlEl.addEventListener('transitionend', onEnd)
  activeAnimCleanup = () => {
    window.clearTimeout(timer)
    htmlEl.removeEventListener('transitionend', onEnd)
  }
  htmlEl.style.transition = 'transform 0.36s var(--ease-standard)'
  htmlEl.style.transform = 'translate3d(0, 0, 0)'
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
  const durMs = Math.round(240 + 140 * remainRatio)

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
  const timer = window.setTimeout(finish, durMs + 60)
  htmlEl.addEventListener('transitionend', onEnd)
  activeAnimCleanup = () => {
    window.clearTimeout(timer)
    htmlEl.removeEventListener('transitionend', onEnd)
  }
  htmlEl.style.transition = `transform ${durMs}ms var(--ease-standard)`
  htmlEl.style.transform = offscreenTransform()
}

function onAfterLeave() {
  clearActiveAnim()
  dismissing.value = false
  dismissFromOffset = null
  dragOffsetX.value = 0
  dragOffsetY.value = 0
}

function onAnimCancel() {
  clearActiveAnim()
}

function onHandlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || typeof window === 'undefined') return
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
    const dy = Math.max(0, e.clientY - dragStartY)
    dragVelocityY = (e.clientY - dragLastY) / dt
    dragOffsetY.value = dy
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

function onHandlePointerUp() {
  if (!isDragging.value) return
  cleanupDrag()
  const sheetHeight = sheetRef.value?.offsetHeight || 420
  const sheetWidth = sheetRef.value?.offsetWidth || 360
  let shouldDismiss = false
  if (props.placement === 'bottom') {
    shouldDismiss = dragVelocityY > 0.45 || dragOffsetY.value > Math.min(160, sheetHeight * 0.28)
  } else if (props.placement === 'left') {
    shouldDismiss = dragVelocityX < -0.45 || Math.abs(dragOffsetX.value) > Math.min(160, sheetWidth * 0.3)
  } else {
    shouldDismiss = dragVelocityX > 0.45 || dragOffsetX.value > Math.min(160, sheetWidth * 0.3)
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
  isDragging.value = false
  dragOffsetX.value = 0
  dragOffsetY.value = 0
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close()
  }
}

onMounted(() => {
  updatePointerMode()
  if (isNativeTouchScroll.value && props.open) {
    nativeMounted.value = true
    nextTick(() => {
      const m = getNativeMetrics()
      if (m) {
        setNativeScrollInstant(m.openPos)
        nativeBackdropRatio.value = 1
      }
    })
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
    if (typeof window.matchMedia === 'function') {
      coarseMql = window.matchMedia('(pointer: coarse)')
      coarseMql.addEventListener?.('change', updatePointerMode)
    }
  }
})

onBeforeUnmount(() => {
  clearActiveAnim()
  cleanupDrag()
  if (nativeSettleTimer !== null) {
    clearTimeout(nativeSettleTimer)
    nativeSettleTimer = null
  }
  coarseMql?.removeEventListener?.('change', updatePointerMode)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <!-- ==================== NATIVE 120Hz SCROLL-SNAP SHEET (TOUCH / SAFARI PROMOTION) ==================== -->
  <template v-if="isNativeTouchScroll">
    <div
      v-if="nativeMounted"
      class="vl-sheet-backdrop shape-rect native-scroll"
      :class="{ contained }"
      :style="{ opacity: nativeBackdropRatio }"
      aria-hidden="true"
    />

    <div
      v-if="nativeMounted"
      ref="nativeScrollerRef"
      class="vl-sheet-native-scroller"
      :class="[`place-${placement}`, { contained }]"
      @scroll.passive="onNativeScroll"
      @scrollend="finalizeNativeScroll"
    >
      <!-- Dismiss snap stop BEFORE sheet for bottom / right placements -->
      <div
        v-if="placement !== 'left'"
        class="vl-sheet-snap-dismiss"
        @click="onNativeBackdropClick"
      />

      <!-- Present snap stop holding the actual sheet -->
      <div
        class="vl-sheet-snap-present"
        :class="`place-${placement}`"
        @click="onNativeBackdropClick"
      >
        <section
          ref="sheetRef"
          class="vl-sheet shape-rect native-scroll"
          :class="[`place-${placement}`, `t-${accentTone}`, { contained, dragging: isDragging }]"
          :style="sheetDynamicStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <div class="vl-sheet-head shape-rect native-scroll">
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
                <VlIconButton
                  icon="close"
                  size="sm"
                  morph-on-hover
                  title="关闭"
                  aria-label="关闭"
                  class="vl-sheet-close-btn"
                  @click="close"
                />
              </div>
            </div>
          </div>

          <VlScrollArea class="vl-sheet-scroll">
            <div class="vl-sheet-body">
              <slot />
            </div>
          </VlScrollArea>

          <footer v-if="$slots.footer" class="vl-sheet-footer shape-rect">
            <slot name="footer" />
          </footer>
        </section>
      </div>

      <!-- Dismiss snap stop AFTER sheet for left placement -->
      <div
        v-if="placement === 'left'"
        class="vl-sheet-snap-dismiss"
        @click="onNativeBackdropClick"
      />
    </div>
  </template>

  <!-- ==================== DESKTOP / FINE-POINTER SHEET ==================== -->
  <template v-else>
    <Transition name="sheet-backdrop">
      <div
        v-if="open"
        class="vl-sheet-backdrop shape-rect"
        :class="{ contained }"
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
        :class="[`place-${placement}`, `t-${accentTone}`, { contained, dragging: isDragging }]"
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

        <VlScrollArea class="vl-sheet-scroll">
          <div class="vl-sheet-body">
            <slot />
          </div>
        </VlScrollArea>

        <footer v-if="$slots.footer" class="vl-sheet-footer shape-rect">
          <slot name="footer" />
        </footer>
      </section>
    </Transition>
  </template>
</template>

<style scoped>
.vl-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background-color: rgba(24, 21, 18, 0.36);
}

.vl-sheet-backdrop.contained {
  position: absolute;
}

.vl-sheet-backdrop.native-scroll {
  pointer-events: none;
  will-change: opacity;
}

.vl-sheet-native-scroller {
  position: fixed;
  inset: 0;
  z-index: 65;
  display: flex;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.vl-sheet-native-scroller::-webkit-scrollbar {
  display: none;
}

.vl-sheet-native-scroller.contained {
  position: absolute;
}

.vl-sheet-native-scroller.place-bottom {
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
}

.vl-sheet-native-scroller.place-left,
.vl-sheet-native-scroller.place-right {
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
}

.vl-sheet-snap-dismiss {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.vl-sheet-snap-present {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  display: flex;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.vl-sheet-snap-present.place-bottom {
  align-items: flex-end;
  justify-content: center;
}

.vl-sheet-snap-present.place-left {
  align-items: stretch;
  justify-content: flex-start;
}

.vl-sheet-snap-present.place-right {
  align-items: stretch;
  justify-content: flex-end;
}

.vl-sheet {
  position: fixed;
  z-index: 65;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
  overflow: hidden;
  transition: transform 0.36s var(--ease-standard);
}

.vl-sheet.native-scroll {
  position: relative;
  left: auto;
  right: auto;
  top: auto;
  bottom: auto;
  z-index: auto;
  transition: none;
}

.vl-sheet.native-scroll.place-bottom {
  width: 100%;
}

.vl-sheet.native-scroll.place-left,
.vl-sheet.native-scroll.place-right {
  height: 100%;
}

.vl-sheet-head.native-scroll {
  touch-action: pan-x pan-y;
}

.vl-sheet.contained {
  position: absolute;
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

.vl-sheet-scroll {
  flex: 1;
  min-height: 0;
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

.vl-sheet-left-enter-active,
.vl-sheet-right-enter-active {
  transition: transform 0.4s var(--ease-m3-spatial);
}

.vl-sheet-left-leave-active,
.vl-sheet-right-leave-active {
  transition: transform 0.24s var(--ease-standard);
}

.vl-sheet-left-enter-from,
.vl-sheet-left-leave-to {
  transform: translateX(-100%);
}

.vl-sheet-right-enter-from,
.vl-sheet-right-leave-to {
  transform: translateX(100%);
}
</style>
