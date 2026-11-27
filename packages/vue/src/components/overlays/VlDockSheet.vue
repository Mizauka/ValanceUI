<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import VlButton from '../primitives/VlButton.vue'
import type { IconName } from '../icons/iconRegistry'
import VlScrollArea from '../layout/VlScrollArea.vue'
import VlBottomDock, { type BottomDockItem } from '../navigation/VlBottomDock.vue'
import { useBackHandler } from '../../composables/useBackNavigation'

export type DockSheetDetent = 'docked' | 'half' | 'full'

export interface DockSheetMorphState {
  detent: DockSheetDetent
  height: number
  expandRatio: number
  morphFactor: number
  inset: number
  radius: number
  isDragging: boolean
}

const NAV_FRAME_PAD = 6

const props = withDefaults(
  defineProps<{
    detent?: DockSheetDetent
    dockHeight?: number
    peekHeight?: number
    navHeight?: number
    dockMargin?: number
    halfRatio?: number
    fullRatio?: number
    floating?: boolean
    contained?: boolean
    title?: string
    badge?: string
    icon?: IconName
    ariaLabel?: string
    navItems?: BottomDockItem[]
    activeNav?: string
  }>(),
  {
    detent: 'docked',
    dockHeight: 58,
    peekHeight: 46,
    dockMargin: 12,
    halfRatio: 0.58,
    fullRatio: 0.88,
    floating: true,
    contained: false,
    title: '面板',
    icon: 'comment',
    ariaLabel: '底部停靠展开面板',
  },
)

const emit = defineEmits<{
  (e: 'update:detent', detent: DockSheetDetent): void
  (e: 'update:activeNav', id: string): void
  (e: 'nav-select', id: string): void
  (e: 'morph-state', state: DockSheetMorphState): void
}>()

const hostHeight = ref(760)
const hostWidth = ref(390)
const sheetRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<InstanceType<typeof VlScrollArea> | null>(null)
const isDragging = ref(false)
const navPressed = ref(false)
const navFollow = ref({ x: 0, y: 0, dragging: false })
const dragHeight = ref<number | null>(null)

let startY = 0
let startHeight = props.dockHeight
let lastY = 0
let lastTime = 0
let velocityY = 0
let movedBeyondTap = false
let resizeObserver: ResizeObserver | null = null
let bodyStartX = 0
let bodyStartY = 0
let bodyPullActive = false
let bodyLockedAsInnerScroll = false

const hasNav = computed(() => Boolean(props.navItems && props.navItems.length > 0))

const effectiveNavHeight = computed(() => {
  if (typeof props.navHeight === 'number' && props.navHeight > 0) return props.navHeight
  if (!props.floating) return 58
  return Math.round(Math.min(66, Math.max(58, hostWidth.value * 0.152)))
})

// Include outer border pixels so inner padding stays strictly uniform and nav never overflows
const effectiveDockedHeight = computed(() => {
  if (!hasNav.value) return props.dockHeight
  return props.floating
    ? props.peekHeight + effectiveNavHeight.value + NAV_FRAME_PAD + 2
    : props.peekHeight + effectiveNavHeight.value + 1
})

// Mathematically exact concentric outer corner in floating mode; 0px flush rectangle when !floating
const dockRadius = computed(() => {
  if (!props.floating) return 0
  return hasNav.value ? Math.round(effectiveNavHeight.value / 2 + NAV_FRAME_PAD + 1) : props.dockHeight / 2
})

function measureHost() {
  const parent = sheetRef.value?.parentElement
  if (parent && parent.clientHeight > 0) {
    hostHeight.value = parent.clientHeight
    if (parent.clientWidth > 0) hostWidth.value = parent.clientWidth
  } else if (typeof window !== 'undefined') {
    hostHeight.value = Math.max(360, window.innerHeight - 50)
    hostWidth.value = window.innerWidth || 390
  }
}

const fullSheetHeight = computed(() =>
  Math.max(effectiveDockedHeight.value + 180, Math.round(hostHeight.value * props.fullRatio)),
)
const halfSheetHeight = computed(() =>
  Math.max(effectiveDockedHeight.value + 120, Math.round(hostHeight.value * props.halfRatio)),
)

function getDetentHeight(detent: DockSheetDetent): number {
  if (detent === 'docked') return effectiveDockedHeight.value
  if (detent === 'half') return halfSheetHeight.value
  return fullSheetHeight.value
}

const currentHeight = computed(() => {
  if (isDragging.value && dragHeight.value !== null) {
    return dragHeight.value
  }
  return getDetentHeight(props.detent)
})

const expandRatio = computed(() => {
  const span = Math.max(1, fullSheetHeight.value - effectiveDockedHeight.value)
  return Math.max(0, Math.min(1, (currentHeight.value - effectiveDockedHeight.value) / span))
})

const morphFactor = computed(() => {
  return Math.max(0, Math.min(1, expandRatio.value / 0.35))
})

const isExpanded = computed(() => props.detent !== 'docked')

// Unified floating width matches standalone VlBottomDock (min(360px, hostWidth - 24px)); 0 inset when flush (!floating)
const dockedTargetWidth = computed(() =>
  props.floating ? Math.min(380, Math.max(220, hostWidth.value - props.dockMargin * 2)) : hostWidth.value,
)
const dockedInsetX = computed(() =>
  props.floating ? Math.max(props.dockMargin, (hostWidth.value - dockedTargetWidth.value) / 2) : 0,
)

const computedInset = computed(
  () => (props.floating ? Math.round((1 - morphFactor.value) * dockedInsetX.value * 10) / 10 : 0),
)
const computedBottom = computed(
  () => (props.floating ? Math.round((1 - morphFactor.value) * props.dockMargin * 10) / 10 : 0),
)
const computedRadius = computed(
  () => (props.floating ? Math.round((1 - morphFactor.value) * dockRadius.value * 10) / 10 : 0),
)

const sheetStyle = computed(() => {
  const mf = morphFactor.value
  const safeFactor = props.floating ? mf : 1
  const bottomSafeFactor = props.floating ? 1 - mf : 0
  const heightPx = Math.round(currentHeight.value)
  const insetPx = computedInset.value
  const bottomPx = computedBottom.value
  const radiusPx = computedRadius.value
  const applyFollow =
    hasNav.value &&
    props.floating &&
    !isExpanded.value &&
    !isDragging.value &&
    (navPressed.value || navFollow.value.dragging || navFollow.value.x !== 0 || navFollow.value.y !== 0)
  const dockScale = navPressed.value || navFollow.value.dragging ? 1.03 : 1
  const followTransform = applyFollow
    ? `translate3d(${navFollow.value.x}px, ${navFollow.value.y}px, 0) scale(${dockScale})`
    : undefined

  if (props.contained) {
    return {
      height: `${heightPx}px`,
      left: `${insetPx}px`,
      right: `${insetPx}px`,
      bottom: `${bottomPx}px`,
      paddingBottom: '0px',
      borderRadius: `${radiusPx}px`,
      ...(followTransform ? { transform: followTransform } : {}),
    }
  }

  return {
    height: `calc(${heightPx}px + ${safeFactor.toFixed(3)} * var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
    left: `${insetPx}px`,
    right: `${insetPx}px`,
    bottom: `calc(${bottomPx}px + ${bottomSafeFactor.toFixed(3)} * var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
    paddingBottom: `calc(${safeFactor.toFixed(3)} * var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
    borderRadius: `${radiusPx}px`,
    ...(followTransform ? { transform: followTransform } : {}),
  }
})

const navSlotStyle = computed(() => {
  const padX = props.floating ? Math.round((NAV_FRAME_PAD + morphFactor.value * dockedInsetX.value) * 10) / 10 : 0
  return {
    '--dock-capsule-height': `${effectiveNavHeight.value}px`,
    paddingLeft: `${padX}px`,
    paddingRight: `${padX}px`,
  }
})

watch(
  [currentHeight, expandRatio, morphFactor, computedInset, computedRadius, isDragging, () => props.detent],
  () => {
    emit('morph-state', {
      detent: props.detent,
      height: Math.round(currentHeight.value),
      expandRatio: Math.round(expandRatio.value * 1000) / 1000,
      morphFactor: Math.round(morphFactor.value * 1000) / 1000,
      inset: computedInset.value,
      radius: computedRadius.value,
      isDragging: isDragging.value,
    })
  },
  { immediate: true },
)

function clampHeightWithRubberBand(val: number): number {
  const minH = effectiveDockedHeight.value
  const maxH = fullSheetHeight.value
  if (val < minH) {
    return minH - (minH - val) * 0.15
  }
  if (val > maxH) {
    return maxH + (val - maxH) * 0.15
  }
  return val
}

function setDetent(next: DockSheetDetent) {
  emit('update:detent', next)
}

useBackHandler(
  computed(() => !props.contained && props.detent !== 'docked'),
  () => {
    setDetent('docked')
    return true
  },
  200,
)

function handleNavSelect(id: string) {
  emit('update:activeNav', id)
  emit('nav-select', id)
  if (props.detent !== 'docked') {
    setDetent('docked')
  }
}

function onHandlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || typeof window === 'undefined') return
  measureHost()
  isDragging.value = true
  movedBeyondTap = false
  startY = e.clientY
  lastY = e.clientY
  lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  velocityY = 0
  startHeight = getDetentHeight(props.detent)
  dragHeight.value = startHeight

  const target = e.currentTarget as HTMLElement | null
  target?.setPointerCapture?.(e.pointerId)

  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dy = e.clientY - startY
  if (Math.abs(dy) > 6) {
    movedBeyondTap = true
  }
  if (e.cancelable) e.preventDefault()

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dt = Math.max(1, now - lastTime)
  velocityY = (e.clientY - lastY) / dt
  lastY = e.clientY
  lastTime = now

  dragHeight.value = clampHeightWithRubberBand(startHeight - dy)
}

function cleanupListeners() {
  if (typeof window === 'undefined') return
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function onPointerUp() {
  if (!isDragging.value) return
  const finalH = dragHeight.value ?? startHeight
  isDragging.value = false
  dragHeight.value = null
  cleanupListeners()

  if (!movedBeyondTap) return

  if (velocityY < -0.45) {
    setDetent(props.detent === 'docked' ? 'half' : 'full')
    return
  }
  if (velocityY > 0.45) {
    setDetent(props.detent === 'full' ? 'half' : 'docked')
    return
  }

  const candidates: { detent: DockSheetDetent; dist: number }[] = [
    { detent: 'full', dist: Math.abs(finalH - fullSheetHeight.value) },
    { detent: 'half', dist: Math.abs(finalH - halfSheetHeight.value) },
    { detent: 'docked', dist: Math.abs(finalH - effectiveDockedHeight.value) },
  ]
  candidates.sort((a, b) => a.dist - b.dist)
  const best = candidates[0]
  if (best) setDetent(best.detent)
}

function onBodyTouchStart(e: TouchEvent) {
  if (props.detent === 'docked' || e.touches.length !== 1) return
  const t = e.touches[0]!
  bodyStartX = t.clientX
  bodyStartY = t.clientY
  bodyPullActive = false
  bodyLockedAsInnerScroll = false
}

function onBodyTouchMove(e: TouchEvent) {
  if (props.detent === 'docked' || e.touches.length !== 1 || bodyLockedAsInnerScroll) return
  const t = e.touches[0]!
  const dx = t.clientX - bodyStartX
  const dy = t.clientY - bodyStartY

  if (!bodyPullActive) {
    if (Math.hypot(dx, dy) < 6) return
    if (Math.abs(dx) > Math.abs(dy)) {
      bodyLockedAsInnerScroll = true
      return
    }
    const vp = scrollAreaRef.value?.getViewport()
    const atTop = !vp || vp.scrollTop <= 1
    if (dy > 0 && atTop) {
      bodyPullActive = true
      measureHost()
      isDragging.value = true
      movedBeyondTap = true
      startY = t.clientY
      lastY = t.clientY
      lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
      velocityY = 0
      startHeight = getDetentHeight(props.detent)
      dragHeight.value = startHeight
    } else {
      bodyLockedAsInnerScroll = true
      return
    }
  }

  if (e.cancelable) e.preventDefault()
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dt = Math.max(1, now - lastTime)
  velocityY = (t.clientY - lastY) / dt
  lastY = t.clientY
  lastTime = now
  dragHeight.value = clampHeightWithRubberBand(startHeight - (t.clientY - startY))
}

function onBodyTouchEnd() {
  if (!bodyPullActive) {
    bodyLockedAsInnerScroll = false
    return
  }
  bodyPullActive = false
  bodyLockedAsInnerScroll = false
  onPointerUp()
}

function handleHeaderClick() {
  if (movedBeyondTap) {
    movedBeyondTap = false
    return
  }
  setDetent(props.detent === 'docked' ? 'half' : 'docked')
}

function cycleDetent(e: MouseEvent) {
  e.stopPropagation()
  if (props.detent === 'full') setDetent('docked')
  else if (props.detent === 'half') setDetent('full')
  else setDetent('half')
}

onMounted(() => {
  measureHost()
  const parent = sheetRef.value?.parentElement
  if (typeof ResizeObserver !== 'undefined' && parent) {
    resizeObserver = new ResizeObserver(measureHost)
    resizeObserver.observe(parent)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cleanupListeners()
})
</script>

<template>
  <div
    class="vl-dock-sheet-scrim"
    :class="{ active: expandRatio > 0.02, dragging: isDragging, standalone: !hasNav }"
    :style="{ opacity: expandRatio * 0.36 }"
    @click="setDetent('docked')"
  />

  <section
    ref="sheetRef"
    class="vl-dock-sheet"
    :class="{
      dragging: isDragging,
      expanded: isExpanded,
      unified: hasNav,
      standalone: !hasNav,
      flush: !floating,
      'nav-pressed': navPressed,
      'nav-dragging': navFollow.dragging && !isExpanded,
    }"
    :style="sheetStyle"
    :aria-label="ariaLabel"
  >
    <!-- Upper Draggable Peek Header -->
    <div
      class="vl-dock-header"
      :style="{
        height: `${hasNav ? peekHeight : dockHeight}px`,
        minHeight: `${hasNav ? peekHeight : dockHeight}px`,
      }"
      @pointerdown="onHandlePointerDown"
      @click="handleHeaderClick"
    >
      <div class="vl-handle-zone" aria-hidden="true">
        <span class="vl-sheet-handle" :class="{ active: isDragging, unified: hasNav }" />
      </div>

      <div class="vl-dock-bar-row">
        <div class="vl-dock-left">
          <slot name="dock-left">
            <span class="vl-dock-icon" :class="{ active: isExpanded, 'is-circle': hasNav }">
              <VlIcon :name="icon" :size="hasNav ? 15 : 14" />
            </span>
            <span class="vl-dock-title">{{ title }}</span>
            <span v-if="badge" class="vl-dock-badge shape-pill">{{ badge }}</span>
          </slot>
        </div>

        <div class="vl-dock-right">
          <slot name="dock-right" />
          <VlButton
            size="xs"
            shape="pill"
            :variant="isExpanded ? 'primary' : 'neutral'"
            class="vl-dock-action-pill"
            :class="{ expanded: isExpanded }"
            :title="detent === 'docked' ? '展开面板' : detent === 'half' ? '全屏展开' : '收起'"
            @pointerdown.stop
            @click="cycleDetent"
          >
            {{ detent === 'docked' ? '展开' : detent === 'half' ? '全屏' : '收起' }}
          </VlButton>
        </div>
      </div>
    </div>

    <!-- Expandable Sheet Body (Pulling down at scrollTop === 0 seamlessly collapses the sheet) -->
    <div
      class="vl-dock-body-wrap"
      @touchstart.passive="onBodyTouchStart"
      @touchmove="onBodyTouchMove"
      @touchend="onBodyTouchEnd"
      @touchcancel="onBodyTouchEnd"
    >
      <VlScrollArea ref="scrollAreaRef" class="vl-dock-scroll" :style="{ opacity: morphFactor }">
        <slot />
      </VlScrollArea>
    </div>

    <!-- Embedded Floating/Flush Nav (2-in-1 Mode) -->
    <div
      v-if="hasNav"
      class="vl-dock-nav-slot"
      :class="{ flush: !floating }"
      :style="navSlotStyle"
    >
      <VlBottomDock
        embedded
        :model-value="activeNav ?? navItems![0]?.id ?? ''"
        :items="navItems!"
        :variant="floating ? 'capsule' : 'bar'"
        aria-label="底部导航"
        @update:model-value="handleNavSelect"
        @press-change="navPressed = $event"
        @drag-follow="navFollow = $event"
      />
    </div>
  </section>
</template>

<style scoped>
.vl-dock-sheet-scrim {
  position: absolute;
  inset: 0;
  background-color: #000000;
  opacity: 0;
  pointer-events: none;
  z-index: 30;
  transition: opacity 0.32s var(--ease-standard);
}

.vl-dock-sheet-scrim.standalone {
  z-index: 45;
}

.vl-dock-sheet-scrim.active {
  pointer-events: auto;
}

.vl-dock-sheet-scrim.dragging {
  transition: none;
}

.vl-dock-sheet {
  position: absolute;
  z-index: 40;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  contain: layout style;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  transform-origin: center bottom;
  will-change: transform, height;
  transition:
    height 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    left 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    right 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    bottom 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    border-radius 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    transform 0.3s var(--ease-standard),
    background-color 0.24s var(--ease-standard);
  user-select: none;
}

/* Standalone dock sheet without embedded nav bar always stacks higher than with-nav dock sheets */
.vl-dock-sheet.standalone {
  z-index: 50;
}

.vl-dock-sheet.unified {
  background-color: var(--bg-activity);
  border-color: var(--divider-strong);
  /* Allow the enlarged / overshooting nav indicator color block to peek without clipping in ALL states;
     scroll content itself is clipped by .vl-dock-body-wrap (overflow: hidden) while nav capsule stays strictly inside! */
  overflow: visible;
}

.vl-dock-sheet.unified:not(.expanded) .vl-dock-header,
.vl-dock-sheet.unified:not(.expanded) .vl-dock-nav-slot {
  background-color: transparent;
}

.vl-dock-sheet.flush {
  border-left-color: transparent;
  border-right-color: transparent;
  border-bottom-color: transparent;
  background-color: var(--bg-activity);
}

.vl-dock-sheet.flush:not(.unified) {
  border-top: 2px solid var(--accent-primary);
}

.vl-dock-sheet.unified.nav-dragging {
  transition:
    height 0.42s var(--ease-emphasized-decel),
    left 0.42s var(--ease-emphasized-decel),
    right 0.42s var(--ease-emphasized-decel),
    bottom 0.42s var(--ease-emphasized-decel),
    padding-bottom 0.42s var(--ease-emphasized-decel),
    border-radius 0.42s var(--ease-emphasized-decel),
    background-color 0.26s var(--ease-standard);
}

.vl-dock-sheet.expanded {
  border-left-color: transparent;
  border-right-color: transparent;
  border-bottom-color: transparent;
  background-color: var(--bg-surface);
}

.vl-dock-sheet.dragging {
  transition: none;
}

.vl-dock-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: var(--bg-activity);
  cursor: grab;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition: padding 0.24s var(--ease-decel), background-color 0.16s var(--ease-decel);
}

.vl-dock-sheet.unified .vl-dock-header {
  padding: 6px 18px 0 18px;
}

.vl-dock-sheet.flush .vl-dock-header {
  padding: 4px var(--pane-pad) 0 var(--pane-pad);
}

.vl-dock-sheet.expanded .vl-dock-header {
  padding: 4px var(--pane-pad) 0 var(--pane-pad);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-dock-header:active {
  cursor: grabbing;
}

.vl-handle-zone {
  position: absolute;
  top: 5px;
  left: 0;
  right: 0;
  height: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.vl-sheet-handle {
  width: 38px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--sash-handle);
  transition:
    width 0.26s var(--ease-nonlinear),
    height 0.26s var(--ease-nonlinear),
    border-radius 0.26s var(--ease-nonlinear),
    background-color 0.22s var(--ease-nonlinear);
}

.vl-sheet-handle.unified {
  width: 48px;
  background-color: var(--accent-primary);
}

@media (hover: hover) and (pointer: fine) {
  .vl-dock-header:hover .vl-sheet-handle {
    width: 64px;
    height: 5px;
    border-radius: 0px;
    background-color: var(--accent-primary);
  }
}

.vl-dock-header:active .vl-sheet-handle,
.vl-sheet-handle.active {
  width: 64px;
  height: 5px;
  border-radius: 0px;
  background-color: var(--accent-primary);
}

.vl-dock-bar-row {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.vl-dock-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}

.vl-dock-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.vl-dock-icon {
  width: 24px;
  height: 24px;
  border-radius: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.16s var(--ease-decel),
    color 0.16s var(--ease-decel);
}

.vl-dock-icon.is-circle {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-dock-icon.active,
.vl-dock-icon.is-circle.active {
  border-radius: 14px;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-dock-title {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
  flex: 0 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-dock-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 2px 9px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 42%;
  flex: 0 1 auto;
}

.vl-dock-action-pill {
  height: 26px;
  padding: 0 12px;
  font-size: var(--ui-font-sm);
  font-weight: 700;
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  white-space: nowrap;
  transition: background-color 0.2s var(--ease-nonlinear), color 0.2s var(--ease-nonlinear);
}

.vl-dock-action-pill.expanded {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-dock-body-wrap {
  position: relative;
  z-index: 1;
  flex: 1 1 0px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vl-dock-scroll {
  flex: 1 1 0px;
  min-height: 0;
  overflow: hidden;
  transition: opacity 0.28s var(--ease-standard);
}

.vl-dock-scroll :deep(.csa-viewport) {
  overscroll-behavior-y: none;
}

.vl-dock-sheet.dragging .vl-dock-scroll {
  transition: none;
}

.vl-dock-nav-slot {
  position: relative;
  z-index: 3;
  flex-shrink: 0;
  width: 100%;
  padding-top: 0;
  padding-bottom: 6px;
  overflow: visible;
  background-color: var(--bg-activity);
  box-sizing: border-box;
  transition:
    padding-left 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    padding-right 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    padding-top 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    background-color 0.24s var(--ease-standard);
}

.vl-dock-nav-slot.flush {
  padding-bottom: 0;
}

.vl-dock-sheet.dragging .vl-dock-nav-slot {
  transition: none;
}

.vl-dock-sheet.expanded .vl-dock-nav-slot {
  border-top: 1px solid var(--divider-hairline);
  padding-top: 6px;
}

.vl-dock-sheet.flush.expanded .vl-dock-nav-slot.flush {
  border-top: none;
  padding-top: 0;
}
</style>
