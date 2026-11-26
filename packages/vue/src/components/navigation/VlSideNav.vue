<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useNavScrubGesture } from '../../composables/useNavScrubGesture'

export interface SideNavItem {
  id: string
  label: string
  icon?: IconName
  badge?: string
  meta?: string
  tone?: 'primary' | 'secondary'
  openDot?: boolean
  disabled?: boolean
}

export interface SideNavGroup {
  id: string
  label: string
  badge?: string
  meta?: string
  defaultOpen?: boolean
  items: SideNavItem[]
}

const props = withDefaults(
  defineProps<{
    groups: SideNavGroup[]
    activeId?: string
    expandedIds?: string[]
    ariaLabel?: string
  }>(),
  {
    ariaLabel: '侧边导航菜单',
  },
)

const emit = defineEmits<{
  (e: 'select', item: SideNavItem): void
  (e: 'update:expandedIds', ids: string[]): void
}>()

const navRef = ref<HTMLElement | null>(null)
const itemElMap = new Map<string, HTMLButtonElement | null>()

const glideY = ref(0)
const glideH = ref(0)
const glideReady = ref(false)
const animated = ref(false)

let resizeObserver: ResizeObserver | null = null

const internalExpanded = ref<string[]>(
  props.expandedIds ??
    props.groups.filter((g) => g.defaultOpen !== false).map((g) => g.id),
)

watch(
  () => props.expandedIds,
  (val) => {
    if (val) internalExpanded.value = val
  },
)

function isOpen(id: string): boolean {
  const list = props.expandedIds ?? internalExpanded.value
  return list.includes(id)
}

function toggleGroup(id: string) {
  const current = props.expandedIds ?? internalExpanded.value
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id]
  internalExpanded.value = next
  emit('update:expandedIds', next)
}

interface VisibleSideEntry {
  item: SideNavItem
  groupId: string
}

const visibleEntries = computed<VisibleSideEntry[]>(() =>
  props.groups.flatMap((g) => (isOpen(g.id) ? g.items.map((item) => ({ item, groupId: g.id })) : [])),
)

const visibleItems = computed<SideNavItem[]>(() => visibleEntries.value.map((e) => e.item))

const {
  pressed: scrubPressed,
  dragging: scrubDragging,
  coveredIndex: scrubCoveredIdx,
  dragStartPos,
  dragSize,
  onPointerDown: rawPointerDown,
  consumeSuppressedClick,
} = useNavScrubGesture({
  axis: 'y',
  scrollSafeTouch: true,
  getContainer: () => navRef.value,
  getItems: () => visibleItems.value.map((i) => itemElMap.get(i.id) ?? null),
  isDisabled: (idx) => Boolean(visibleItems.value[idx]?.disabled),
  getActiveIndex: () => visibleItems.value.findIndex((i) => i.id === props.activeId),
  getGroupIndices: (startIdx) => {
    const startGroup = visibleEntries.value[startIdx]?.groupId
    if (!startGroup) return null
    const indices: number[] = []
    visibleEntries.value.forEach((e, idx) => {
      if (e.groupId === startGroup) indices.push(idx)
    })
    return indices
  },
  onCommit: (idx) => {
    const item = visibleItems.value[idx]
    if (!item || item.disabled) return
    animated.value = true
    emit('select', item)
  },
})

const displayActiveId = computed<string | undefined>(() => {
  if (scrubDragging.value) {
    return scrubCoveredIdx.value !== null ? visibleItems.value[scrubCoveredIdx.value]?.id : undefined
  }
  return props.activeId
})

const displayTone = computed<'primary' | 'secondary'>(() => {
  const id = displayActiveId.value ?? props.activeId
  const item = visibleItems.value.find((i) => i.id === id)
  return item?.tone === 'secondary' ? 'secondary' : 'primary'
})

const glideVisible = computed(
  () => glideReady.value && glideH.value > 0 && (scrubDragging.value || visibleItems.value.some((i) => i.id === props.activeId)),
)

const glideStyle = computed(() => {
  const y = scrubDragging.value && dragStartPos.value !== null ? dragStartPos.value : glideY.value
  const h = scrubDragging.value && dragSize.value !== null ? dragSize.value : glideH.value
  return {
    height: `${h}px`,
    transform: `translateY(${y}px)`,
  }
})

function setItemEl(id: string, el: unknown) {
  if (el) itemElMap.set(id, el as HTMLButtonElement)
  else itemElMap.delete(id)
}

function measureGlide(enableAnim: boolean) {
  const nav = navRef.value
  const id = props.activeId
  if (!nav || !id || !visibleItems.value.some((i) => i.id === id)) {
    glideH.value = 0
    return
  }
  const el = itemElMap.get(id)
  if (!el) {
    glideH.value = 0
    return
  }
  const navRect = nav.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  if (elRect.height <= 0 && el.offsetHeight <= 0) return
  if (enableAnim && glideReady.value) animated.value = true
  glideY.value = elRect.height > 0 && navRect.height > 0 ? elRect.top - navRect.top : el.offsetTop
  glideH.value = elRect.height > 0 ? elRect.height : el.offsetHeight
  if (!glideReady.value) glideReady.value = true
}

function onItemPointerDown(e: PointerEvent, item: SideNavItem) {
  if (item.disabled) return
  const idx = visibleItems.value.findIndex((i) => i.id === item.id)
  if (idx !== -1) rawPointerDown(e, idx)
}

function onItemClick(item: SideNavItem) {
  if (consumeSuppressedClick()) return
  animated.value = true
  emit('select', item)
}

watch(
  () => [props.activeId, props.groups, internalExpanded.value, props.expandedIds] as const,
  async () => {
    await nextTick()
    measureGlide(true)
  },
  { deep: true },
)

onMounted(() => {
  nextTick(() => {
    measureGlide(false)
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => measureGlide(false))
    }
  })
  if (typeof ResizeObserver !== 'undefined' && navRef.value) {
    resizeObserver = new ResizeObserver(() => measureGlide(false))
    resizeObserver.observe(navRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="navRef"
    class="vl-side-nav"
    :class="{ pressed: scrubPressed, dragging: scrubDragging }"
    role="tree"
    :aria-label="ariaLabel"
    @transitionend="measureGlide(false)"
  >
    <span
      v-show="glideVisible"
      class="vl-sidenav-glide-block shape-rect"
      :class="[
        displayTone === 'secondary' ? 'tone-secondary' : 'tone-primary',
        { animated: animated && !scrubDragging, pressed: scrubPressed, dragging: scrubDragging },
      ]"
      :style="glideStyle"
      aria-hidden="true"
    >
      <span class="vl-sidenav-glide-bar shape-rect" />
    </span>

    <div v-for="group in groups" :key="group.id" class="vl-nav-group" role="treeitem">
      <button
        type="button"
        class="vl-nav-row vl-nav-folder shape-rect"
        :aria-expanded="isOpen(group.id)"
        @click="toggleGroup(group.id)"
      >
        <span class="vl-nav-chevron" :class="{ rotated: isOpen(group.id) }">
          <VlIcon name="chevron-right" :size="13" />
        </span>
        <span class="vl-nav-folder-icon">
          <VlIcon :name="isOpen(group.id) ? 'folder-open' : 'folder'" :size="15" />
        </span>
        <span class="vl-nav-label vl-nav-folder-label">{{ group.label }}</span>
        <span v-if="group.badge" class="vl-nav-badge shape-pill">{{ group.badge }}</span>
        <span v-if="group.meta" class="vl-nav-meta">{{ group.meta }}</span>
      </button>

      <div class="vl-nav-collapse" :class="{ open: isOpen(group.id) }" role="group">
        <div class="vl-nav-collapse-inner">
          <div class="vl-nav-children">
            <button
              v-for="item in group.items"
              :key="item.id"
              :ref="(el) => setItemEl(item.id, el)"
              type="button"
              class="vl-nav-row vl-nav-item shape-rect"
              :class="[
                item.tone === 'secondary' ? 'tone-secondary' : 'tone-primary',
                {
                  active: displayActiveId === item.id,
                  disabled: item.disabled,
                  'no-glide-fallback': !glideVisible,
                },
              ]"
              :disabled="item.disabled"
              :tabindex="isOpen(group.id) ? 0 : -1"
              @pointerdown="onItemPointerDown($event, item)"
              @click="onItemClick(item)"
            >
              <span v-if="!glideVisible" class="vl-nav-active-bar shape-rect" />
              <span v-if="item.icon" class="vl-nav-item-icon">
                <VlIcon :name="item.icon" :size="14" />
              </span>
              <span class="vl-nav-label">{{ item.label }}</span>
              <span v-if="item.openDot" class="vl-nav-open-dot shape-circle" />
              <span v-if="item.badge" class="vl-nav-item-badge shape-pill">{{ item.badge }}</span>
              <span v-if="item.meta" class="vl-nav-meta">{{ item.meta }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vl-side-nav {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  user-select: none;
}

.vl-side-nav.dragging {
  cursor: grabbing;
}

.vl-sidenav-glide-block {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 1;
  background-color: var(--accent-primary-soft);
  transition: background-color 0.14s var(--ease-decel);
}

.vl-sidenav-glide-block.tone-secondary {
  background-color: var(--accent-secondary-soft);
}

.vl-sidenav-glide-block.pressed,
.vl-sidenav-glide-block.dragging {
  background-color: var(--accent-primary-mid);
}

.vl-sidenav-glide-block.tone-secondary.pressed,
.vl-sidenav-glide-block.tone-secondary.dragging {
  background-color: var(--accent-secondary-mid);
}

.vl-sidenav-glide-block.animated {
  transition:
    transform 0.22s var(--ease-decel),
    height 0.2s var(--ease-decel),
    background-color 0.14s var(--ease-decel);
}

.vl-sidenav-glide-block.dragging {
  transition: background-color 0.12s var(--ease-decel);
}

.vl-sidenav-glide-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--accent-primary);
  transition: background-color 0.14s var(--ease-decel);
}

.vl-sidenav-glide-block.tone-secondary .vl-sidenav-glide-bar {
  background-color: var(--accent-secondary);
}

.vl-nav-group {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.vl-nav-row {
  position: relative;
  width: 100%;
  height: var(--ui-row-height);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  text-align: left;
  font-size: var(--ui-font-base);
  color: var(--text-secondary);
  background-color: transparent;
  transition:
    background-color 0.12s var(--ease-decel),
    color 0.12s var(--ease-decel);
}

@media (hover: hover) and (pointer: fine) {
  .vl-nav-row:not(:disabled):not(.active):hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
}

.vl-nav-folder {
  font-weight: 700;
  color: var(--text-primary);
}

.vl-nav-chevron {
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.34s var(--ease-m3-spatial-fast), color 0.2s var(--ease-m3-effects);
}

.vl-nav-chevron.rotated {
  transform: rotate(90deg);
  color: var(--accent-primary-text);
}

.vl-nav-folder-icon {
  display: inline-flex;
  align-items: center;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-nav-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-nav-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 2px 8px;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
  flex-shrink: 0;
}

.vl-nav-meta {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.vl-nav-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.38s var(--ease-m3-spatial),
    opacity 0.24s var(--ease-m3-effects);
}

.vl-nav-collapse.open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.vl-nav-collapse-inner {
  min-height: 0;
  overflow: hidden;
}

.vl-nav-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 6px 0;
  transform: translateY(-6px);
  transition: transform 0.38s var(--ease-m3-spatial);
}

.vl-nav-collapse.open .vl-nav-children {
  transform: translateY(0);
}

.vl-nav-item {
  padding-left: 24px;
}

.vl-nav-item.disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.vl-nav-active-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: transparent;
  transition: background-color 0.2s var(--ease-m3-effects);
}

.vl-nav-item.active.tone-primary {
  color: var(--text-primary);
  font-weight: 700;
}

.vl-nav-item.active.tone-primary.no-glide-fallback {
  background-color: var(--accent-primary-soft);
}

.vl-nav-item.active.tone-primary .vl-nav-active-bar {
  background-color: var(--accent-primary);
}

.vl-nav-item.active.tone-secondary {
  color: var(--text-primary);
  font-weight: 700;
}

.vl-nav-item.active.tone-secondary.no-glide-fallback {
  background-color: var(--accent-secondary-soft);
}

.vl-nav-item.active.tone-secondary .vl-nav-active-bar {
  background-color: var(--accent-secondary);
}

.vl-nav-item-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--accent-primary-text);
}

.vl-nav-item.tone-secondary .vl-nav-item-icon {
  color: var(--accent-secondary-text);
}

.vl-nav-open-dot {
  width: 6px;
  height: 6px;
  background-color: var(--accent-primary);
  flex-shrink: 0;
}

.vl-nav-item-badge {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 1px 7px;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
}
</style>
