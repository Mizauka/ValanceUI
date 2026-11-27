<script setup lang="ts" generic="T extends string = string">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useNavScrubGesture } from '../../composables/useNavScrubGesture'
import { useLocale } from '../../composables/useLocale'

export interface TabOption<V extends string = string> {
  value: V
  label: string
  icon?: IconName
  badge?: string | number
}

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    modelValue: T
    items: TabOption<T>[]
    tone?: 'primary' | 'secondary'
    ariaLabel?: string
  }>(),
  {
    tone: 'secondary',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const tabRefs = ref<(HTMLButtonElement | null)[]>([])
const barX = ref(0)
const barW = ref(0)
const ready = ref(false)
const animated = ref(false)

let resizeObserver: ResizeObserver | null = null

const {
  pressed: scrubPressed,
  dragging: scrubDragging,
  coveredIndex: scrubCoveredIdx,
  dragStartPos,
  dragSize,
  pressTargetPos,
  pressTargetSize,
  onPointerDown,
  consumeSuppressedClick,
} = useNavScrubGesture({
  axis: 'x',
  getContainer: () => trackRef.value,
  getItems: () => tabRefs.value,
  getActiveIndex: () => props.items.findIndex((i) => i.value === props.modelValue),
  maxOvershoot: 8,
  onCommit: (idx) => {
    const item = props.items[idx]
    if (!item || item.value === props.modelValue) return
    const el = tabRefs.value[idx] ?? null
    if (el) {
      barX.value = el.offsetLeft
      barW.value = el.offsetWidth
    }
    animated.value = true
    emit('update:modelValue', item.value)
  },
})

const displayValue = computed(() => {
  if (scrubDragging.value || (scrubPressed.value && pressTargetPos.value !== null)) {
    return scrubCoveredIdx.value !== null ? (props.items[scrubCoveredIdx.value]?.value ?? null) : null
  }
  return props.modelValue
})

const indicatorStyle = computed(() => {
  const x =
    scrubDragging.value && dragStartPos.value !== null
      ? dragStartPos.value
      : scrubPressed.value && pressTargetPos.value !== null
        ? pressTargetPos.value
        : barX.value
  const w =
    scrubDragging.value && dragSize.value !== null
      ? dragSize.value
      : scrubPressed.value && pressTargetSize.value !== null
        ? pressTargetSize.value
        : barW.value
  return {
    width: `${w}px`,
    transform: `translate3d(${x}px, 0, 0)`,
  }
})

function setTabRef(el: unknown, idx: number) {
  tabRefs.value[idx] = el as HTMLButtonElement | null
}

function measureBar(enableAnim: boolean) {
  const idx = props.items.findIndex((i) => i.value === props.modelValue)
  const el = tabRefs.value[idx] ?? null
  if (!el) return
  if (enableAnim && ready.value) animated.value = true
  barX.value = el.offsetLeft
  barW.value = el.offsetWidth
  if (!ready.value) ready.value = true
}

function selectTab(val: T) {
  if (consumeSuppressedClick()) return
  if (val === props.modelValue) return
  animated.value = true
  emit('update:modelValue', val)
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    measureBar(true)
  },
)

watch(
  () => props.items,
  async () => {
    await nextTick()
    measureBar(false)
  },
)

onMounted(() => {
  nextTick(() => {
    measureBar(false)
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        measureBar(false)
        if (ready.value) animated.value = true
      })
    } else if (ready.value) {
      animated.value = true
    }
  })
  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    resizeObserver = new ResizeObserver(() => measureBar(false))
    resizeObserver.observe(trackRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="vl-tabs-bar shape-rect" role="tablist" :aria-label="ariaLabel ?? messages.nav.tabsAria">
    <div ref="trackRef" class="vl-tabs-items" :class="{ pressed: scrubPressed, dragging: scrubDragging }">
      <span
        v-show="ready && barW > 0"
        class="vl-tabs-indicator"
        :class="[
          `t-${tone}`,
          {
            animated: (animated || (scrubPressed && pressTargetPos !== null)) && !scrubDragging,
            pressed: scrubPressed,
            dragging: scrubDragging,
          },
        ]"
        :style="indicatorStyle"
        aria-hidden="true"
      />

      <button
        v-for="(item, idx) in items"
        :key="item.value"
        :ref="(el) => setTabRef(el, idx)"
        type="button"
        role="tab"
        class="vl-header-tab shape-rect"
        :class="[`t-${tone}`, { active: displayValue === item.value }]"
        :aria-selected="modelValue === item.value"
        @pointerdown="onPointerDown($event, idx)"
        @click="selectTab(item.value)"
      >
        <VlIcon v-if="item.icon" :name="item.icon" :size="13" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge !== undefined" class="vl-tab-count shape-pill">
          {{ item.badge }}
        </span>
      </button>
    </div>

    <div v-if="$slots.extra" class="vl-tabs-extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.vl-tabs-bar {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--pane-pad);
  gap: 8px;
  border-bottom: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  user-select: none;
  flex-shrink: 0;
}

.vl-tabs-items {
  position: relative;
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 14px;
  min-width: 0;
  touch-action: none;
}

.vl-tabs-indicator {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 0px;
  background-color: transparent;
  pointer-events: none;
  z-index: 2;
  will-change: transform;
}

.vl-tabs-indicator::before {
  content: '';
  position: absolute;
  inset: 0;
  transform-origin: center bottom;
  transform: scale(1, 1);
  will-change: transform;
  transition: transform 0.24s var(--ease-standard);
}

.vl-tabs-indicator.t-primary::before {
  background-color: var(--accent-primary);
}

.vl-tabs-indicator.t-secondary::before {
  background-color: var(--accent-secondary);
}

.vl-tabs-indicator.pressed::before,
.vl-tabs-indicator.dragging::before {
  transform: scale(1.08, 1.5);
}

.vl-tabs-indicator.animated {
  transition:
    transform 0.32s var(--ease-standard),
    width 0.28s var(--ease-standard);
}

.vl-tabs-indicator.dragging {
  transition: none;
}

.vl-header-tab {
  position: relative;
  z-index: 3;
  transform: translate3d(0, 0, 0);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 100%;
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  transition: color 0.14s var(--ease-standard) 0.04s;
}

.vl-header-tab:focus-visible {
  outline: none;
  color: var(--text-primary);
}

.vl-header-tab:hover {
  color: var(--text-primary);
}

.vl-header-tab.active {
  color: var(--text-primary);
  font-weight: 800;
  transition: color 0.14s var(--ease-standard) 0.11s;
}

.vl-tabs-items.dragging .vl-header-tab,
.vl-tabs-items.dragging .vl-header-tab.active {
  transition: color 0.06s linear 0s;
}

.vl-tab-count {
  font-size: var(--ui-font-xs);
  font-weight: 700;
  padding: 1px 7px;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
}

.vl-tabs-extra {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
</style>
