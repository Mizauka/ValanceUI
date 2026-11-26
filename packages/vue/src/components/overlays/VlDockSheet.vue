<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
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
const nativeScrollerRef = ref<HTMLElement | null>(null)
const isNativeTouchScroll = ref(false)
const nativeScrollTop = ref(0)
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
let nativeSettleTimer: ReturnType<typeof setTimeout> | null = null
let nativeProgrammaticDetent: DockSheetDetent | null = null
let coarseMql: MediaQueryList | null = null

function updatePointerMode() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isNativeTouchScroll.value = false
    return
  }
  isNativeTouchScroll.value = window.matchMedia('(pointer: coarse)').matches
}

const hasNav = computed(() => Boolean(props.navItems && props.navItems.length > 0))

const effectiveNavHeight = computed(() => {
  if (typeof props.navHeight === 'number' && props.navHeight > 0) return props.navHeight
  return Math.round(Math.min(66, Math.max(58, hostWidth.value * 0.152)))
})

// Include +2px for VlDockSheet's 1px top & bottom border so inner padding is identically NAV_FRAME_PAD on left, right, and bottom
const effectiveDockedHeight = computed(() =>
  hasNav.value ? props.peekHeight + effectiveNavHeight.value + NAV_FRAME_PAD + 2 : props.dockHeight,
)

// Mathematically exact concentric outer corner: inner capsule outer radius + uniform gap + 1px outer border
const dockRadius = computed(() =>
  hasNav.value ? Math.round(effectiveNavHeight.value / 2 + NAV_FRAME_PAD + 1) : props.dockHeight / 2,
)

function measureHost() {
  const parent = isNativeTouchScroll.value
    ? nativeScrollerRef.value?.parentElement
    : sheetRef.value?.parentElement
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

const nativeHalfOffset = computed(() => Math.max(1, halfSheetHeight.value - effectiveDockedHeight.value))
const nativeFullOffset = computed(() => Math.max(2, fullSheetHeight.value - effectiveDockedHeight.value))

function getNativeDetentScrollTop(detent: DockSheetDetent): number {
  if (detent === 'docked') return 0
  if (detent === 'half') return nativeHalfOffset.value
  return nativeFullOffset.value
}

function getDetentHeight(detent: DockSheetDetent): number {
  if (detent === 'docked') return effectiveDockedHeight.value
  if (detent === 'half') return halfSheetHeight.value
  return fullSheetHeight.value
}

const currentHeight = computed(() => {
  if (isNativeTouchScroll.value) {
    return effectiveDockedHeight.value + nativeScrollTop.value
  }
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

// Unified floating width matches standalone VlBottomDock (min(360px, hostWidth - 24px))
const dockedTargetWidth = computed(() =>
  Math.min(380, Math.max(220, hostWidth.value - props.dockMargin * 2)),
)
const dockedInsetX = computed(() =>
  Math.max(props.dockMargin, (hostWidth.value - dockedTargetWidth.value) / 2),
)

const computedInset = computed(
  () => Math.round((1 - morphFactor.value) * dockedInsetX.value * 10) / 10,
)
const computedBottom = computed(
  () => Math.round((1 - morphFactor.value) * props.dockMargin * 10) / 10,
)
const computedRadius = computed(
  () => Math.round((1 - morphFactor.value) * dockRadius.value * 10) / 10,
)

const sheetStyle = computed(() => {
  const mf = morphFactor.value
  const heightPx = Math.round(currentHeight.value)
  const insetPx = computedInset.value
  const bottomPx = computedBottom.value
  const radiusPx = computedRadius.value
  const applyFollow =
    hasNav.value &&
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
    height: `calc(${heightPx}px + ${mf.toFixed(3)} * var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
    left: `${insetPx}px`,
    right: `${insetPx}px`,
    bottom: `calc(${bottomPx}px + ${(1 - mf).toFixed(3)} * var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
    paddingBottom: `calc(${mf.toFixed(3)} * var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
    borderRadius: `${radiusPx}px`,
    ...(followTransform ? { transform: followTransform } : {}),
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

function syncNativeDetent(instant: boolean) {
  const scroller = nativeScrollerRef.value
  if (!scroller || !isNativeTouchScroll.value) return
  const targetTop = getNativeDetentScrollTop(props.detent)
  nativeScrollTop.value = targetTop
  if (instant) {
    nativeProgrammaticDetent = null
    scroller.scrollTop = targetTop
    return
  }
  if (Math.abs(scroller.scrollTop - targetTop) < 2) return
  nativeProgrammaticDetent = props.detent
  if (typeof scroller.scrollTo === 'function') {
    scroller.scrollTo({ top: targetTop, behavior: 'smooth' })
  } else {
    scroller.scrollTop = targetTop
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
  const scroller = nativeScrollerRef.value
  if (!scroller || !isNativeTouchScroll.value) return
  const top = Math.max(0, Math.min(nativeFullOffset.value, scroller.scrollTop))
  nativeScrollTop.value = top

  if (nativeProgrammaticDetent !== null) {
    nativeProgrammaticDetent = null
    return
  }

  const candidates: { detent: DockSheetDetent; dist: number }[] = [
    { detent: 'docked', dist: Math.abs(top - 0) },
    { detent: 'half', dist: Math.abs(top - nativeHalfOffset.value) },
    { detent: 'full', dist: Math.abs(top - nativeFullOffset.value) },
  ]
  candidates.sort((a, b) => a.dist - b.dist)
  const best = candidates[0]
  if (best && best.detent !== props.detent) {
    setDetent(best.detent)
  }
}

function onNativeScroll() {
  const scroller = nativeScrollerRef.value
  if (!scroller || !isNativeTouchScroll.value) return
  nativeScrollTop.value = Math.max(0, Math.min(nativeFullOffset.value, scroller.scrollTop))
  if (nativeProgrammaticDetent === null) {
    isDragging.value = true
  }
  if (nativeSettleTimer !== null) clearTimeout(nativeSettleTimer)
  nativeSettleTimer = setTimeout(finalizeNativeScroll, 140)
}

watch(
  () => props.detent,
  () => {
    if (isNativeTouchScroll.value) {
      syncNativeDetent(false)
    }
  },
)

watch([hostHeight, isNativeTouchScroll], () => {
  if (isNativeTouchScroll.value) {
    nextTick(() => syncNativeDetent(true))
  }
})

const nativeMorphedExpanded = computed(() => expandRatio.value > 0.08)

const nativeSheetStyle = computed(() => {
  const expanded = nativeMorphedExpanded.value
  const insetPx = expanded ? 0 : dockedInsetX.value
  const radiusPx = expanded ? 0 : dockRadius.value
  const applyFollow =
    hasNav.value &&
    !expanded &&
    !isDragging.value &&
    (navPressed.value || navFollow.value.dragging || navFollow.value.x !== 0 || navFollow.value.y !== 0)
  const dockScale = navPressed.value || navFollow.value.dragging ? 1.03 : 1
  const followTransform = applyFollow
    ? `translate3d(${navFollow.value.x}px, ${navFollow.value.y}px, 0) scale(${dockScale})`
    : undefined

  return {
    height: `${fullSheetHeight.value}px`,
    marginLeft: `${insetPx}px`,
    marginRight: `${insetPx}px`,
    borderRadius: `${radiusPx}px`,
    ...(followTransform ? { transform: followTransform } : {}),
  }
})

onMounted(() => {
  updatePointerMode()
  nextTick(() => {
    measureHost()
    if (isNativeTouchScroll.value) {
      syncNativeDetent(true)
    }
    const parent = isNativeTouchScroll.value
      ? nativeScrollerRef.value?.parentElement
      : sheetRef.value?.parentElement
    if (typeof ResizeObserver !== 'undefined' && parent) {
      resizeObserver = new ResizeObserver(measureHost)
      resizeObserver.observe(parent)
    }
  })
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    coarseMql = window.matchMedia('(pointer: coarse)')
    coarseMql.addEventListener?.('change', updatePointerMode)
  }
})

onBeforeUnmount(() => {
  if (nativeSettleTimer !== null) {
    clearTimeout(nativeSettleTimer)
    nativeSettleTimer = null
  }
  coarseMql?.removeEventListener?.('change', updatePointerMode)
  resizeObserver?.disconnect()
  cleanupListeners()
})
</script>

<template>
  <div
    class="vl-dock-sheet-scrim"
    :class="{ active: expandRatio > 0.02, dragging: isDragging }"
    :style="{ opacity: expandRatio * 0.36 }"
    @click="setDetent('docked')"
  />

  <!-- ==================== NATIVE 120Hz 3-DETENT SCROLL-SNAP DOCK-SHEET (TOUCH / SAFARI PROMOTION) ==================== -->
  <div
    v-if="isNativeTouchScroll"
    ref="nativeScrollerRef"
    class="vl-dock-native-scroller"
    @scroll.passive="onNativeScroll"
    @scrollend="finalizeNativeScroll"
  >
    <div
      class="vl-dock-native-track"
      :style="{ minHeight: `${hostHeight + nativeFullOffset}px` }"
    >
      <!-- 3 zero-height snap anchors: docked (0), half (halfOffset), full (fullOffset) -->
      <div class="vl-dock-snap-anchor" style="top: 0px" aria-hidden="true" />
      <div class="vl-dock-snap-anchor" :style="{ top: `${nativeHalfOffset}px` }" aria-hidden="true" />
      <div class="vl-dock-snap-anchor" :style="{ top: `${nativeFullOffset}px` }" aria-hidden="true" />

      <!-- Pass-through top spacer so the page behind stays 100% interactive when docked -->
      <div
        class="vl-dock-native-spacer"
        :style="{
          height: contained
            ? `${Math.max(0, hostHeight - effectiveDockedHeight - dockMargin)}px`
            : `calc(${Math.max(0, hostHeight - effectiveDockedHeight - dockMargin)}px - var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))`,
        }"
        aria-hidden="true"
      />

      <section
        ref="sheetRef"
        class="vl-dock-sheet native-scroll"
        :class="{
          dragging: isDragging,
          expanded: nativeMorphedExpanded,
          unified: hasNav,
          'nav-pressed': navPressed,
          'nav-dragging': navFollow.dragging && !nativeMorphedExpanded,
        }"
        :style="nativeSheetStyle"
        :aria-label="ariaLabel"
      >
        <div
          class="vl-dock-header native-scroll"
          :style="{
            height: `${hasNav ? peekHeight : dockHeight}px`,
            minHeight: `${hasNav ? peekHeight : dockHeight}px`,
          }"
          @click="handleHeaderClick"
        >
          <div class="vl-handle-zone" aria-hidden="true">
            <span class="vl-sheet-handle" :class="{ active: isDragging, unified: hasNav }" />
          </div>

          <div class="vl-dock-bar-row">
            <div class="vl-dock-left">
              <slot name="dock-left">
                <span class="vl-dock-icon" :class="{ active: nativeMorphedExpanded, 'is-circle': hasNav }">
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
                :variant="nativeMorphedExpanded ? 'primary' : 'neutral'"
                class="vl-dock-action-pill"
                :class="{ expanded: nativeMorphedExpanded }"
                :title="detent === 'docked' ? '展开面板' : detent === 'half' ? '全屏展开' : '收起'"
                @click="cycleDetent"
              >
                {{ detent === 'docked' ? '展开' : detent === 'half' ? '全屏' : '收起' }}
              </VlButton>
            </div>
          </div>
        </div>

        <VlScrollArea class="vl-dock-scroll" :style="{ opacity: morphFactor }">
          <slot />
        </VlScrollArea>

        <div
          v-if="hasNav"
          class="vl-dock-nav-slot native-sticky"
          :style="{ '--dock-capsule-height': `${effectiveNavHeight}px` }"
        >
          <VlBottomDock
            embedded
            :model-value="activeNav ?? navItems![0]?.id ?? ''"
            :items="navItems!"
            variant="capsule"
            aria-label="底部导航"
            @update:model-value="handleNavSelect"
            @press-change="navPressed = $event"
            @drag-follow="navFollow = $event"
          />
        </div>
      </section>
    </div>
  </div>

  <!-- ==================== DESKTOP / FINE-POINTER DOCK-SHEET ==================== -->
  <section
    v-else
    ref="sheetRef"
    class="vl-dock-sheet"
    :class="{
      dragging: isDragging,
      expanded: isExpanded,
      unified: hasNav,
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

    <!-- Expandable Sheet Body -->
    <VlScrollArea class="vl-dock-scroll" :style="{ opacity: morphFactor }">
      <slot />
    </VlScrollArea>

    <!-- Embedded Enlarged Floating Nav Capsule (2-in-1 Mode) -->
    <div
      v-if="hasNav"
      class="vl-dock-nav-slot"
      :style="{ '--dock-capsule-height': `${effectiveNavHeight}px` }"
    >
      <VlBottomDock
        embedded
        :model-value="activeNav ?? navItems![0]?.id ?? ''"
        :items="navItems!"
        variant="capsule"
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

.vl-dock-sheet-scrim.active {
  pointer-events: auto;
}

.vl-dock-sheet-scrim.dragging {
  transition: none;
}

.vl-dock-native-scroller {
  position: absolute;
  inset: 0;
  z-index: 40;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  pointer-events: none;
}

.vl-dock-native-scroller::-webkit-scrollbar {
  display: none;
}

.vl-dock-native-track {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.vl-dock-snap-anchor {
  position: absolute;
  left: 0;
  width: 1px;
  height: 1px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  pointer-events: none;
}

.vl-dock-native-spacer {
  flex-shrink: 0;
  width: 100%;
  pointer-events: none;
}

.vl-dock-sheet.native-scroll {
  position: relative;
  left: auto;
  right: auto;
  bottom: auto;
  z-index: auto;
  pointer-events: auto;
  flex-shrink: 0;
  transition:
    margin-left 0.28s var(--ease-standard),
    margin-right 0.28s var(--ease-standard),
    border-radius 0.28s var(--ease-standard),
    transform 0.32s var(--ease-standard),
    background-color 0.24s var(--ease-standard);
}

.vl-dock-header.native-scroll {
  touch-action: pan-y;
}

.vl-dock-nav-slot.native-sticky {
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding-bottom: calc(6px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)));
}

.vl-dock-sheet {
  position: absolute;
  z-index: 40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  transform-origin: center bottom;
  transition:
    height 0.42s var(--ease-emphasized-decel),
    left 0.42s var(--ease-emphasized-decel),
    right 0.42s var(--ease-emphasized-decel),
    bottom 0.42s var(--ease-emphasized-decel),
    padding-bottom 0.42s var(--ease-emphasized-decel),
    border-radius 0.42s var(--ease-emphasized-decel),
    transform 0.32s var(--ease-standard),
    background-color 0.26s var(--ease-standard);
  user-select: none;
}

.vl-dock-sheet.unified {
  background-color: var(--bg-activity);
  border-color: var(--divider-strong);
}

/* Allow the enlarged & slightly-overshooting nav indicator to peek past the dock without clipping;
   inner header & nav-slot backgrounds are transparent when docked so the outer rounded shell stays crisp! */
.vl-dock-sheet.unified:not(.expanded) {
  overflow: visible;
}

.vl-dock-sheet.unified:not(.expanded) .vl-dock-header,
.vl-dock-sheet.unified:not(.expanded) .vl-dock-nav-slot {
  background-color: transparent;
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
  flex-shrink: 0;
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

.vl-dock-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  transition: opacity 0.28s var(--ease-standard);
}

.vl-dock-sheet.dragging .vl-dock-scroll {
  transition: none;
}

.vl-dock-nav-slot {
  flex-shrink: 0;
  padding: 0 6px 6px 6px;
  background-color: var(--bg-activity);
}

.vl-dock-sheet.expanded .vl-dock-nav-slot {
  border-top: 1px solid var(--divider-hairline);
  padding: 6px 10px 6px 10px;
}
</style>
