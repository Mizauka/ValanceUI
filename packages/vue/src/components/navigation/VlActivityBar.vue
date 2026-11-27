<script setup lang="ts">
import { computed } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

export interface ActivityBarItem {
  id: string
  icon: IconName
  label: string
  title?: string
  tone?: 'primary' | 'secondary'
  active?: boolean
  badge?: string | number
}

export type ActivityBarGroupAlign = 'start' | 'center' | 'end' | 'custom'

export interface ActivityBarGroup {
  id: string
  align?: ActivityBarGroupAlign
  /** Custom CSS margin-top offset when align === 'custom' (e.g. '24px') */
  offset?: string
  items: ActivityBarItem[]
}

const props = withDefaults(
  defineProps<{
    items?: ActivityBarItem[]
    centerItems?: ActivityBarItem[]
    bottomItems?: ActivityBarItem[]
    /** Optional explicit alignment groups (start / center / end / custom). Overrides items/centerItems/bottomItems when provided. */
    groups?: ActivityBarGroup[]
    modelValue?: string
    activeVisible?: boolean
    mobile?: boolean
    expanded?: boolean
    ariaLabel?: string
  }>(),
  {
    items: () => [],
    centerItems: () => [],
    bottomItems: () => [],
    activeVisible: true,
    mobile: false,
    expanded: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
  (e: 'select', item: ActivityBarItem): void
}>()

const normalizedGroups = computed<ActivityBarGroup[]>(() => {
  if (props.groups && props.groups.length > 0) {
    return props.groups.map((g) => ({
      ...g,
      align: g.align ?? 'start',
    }))
  }
  const list: ActivityBarGroup[] = []
  if (props.items.length > 0) {
    list.push({ id: '__start', align: 'start', items: props.items })
  }
  if (props.centerItems.length > 0) {
    list.push({ id: '__center', align: 'center', items: props.centerItems })
  }
  if (props.bottomItems.length > 0) {
    list.push({ id: '__end', align: 'end', items: props.bottomItems })
  }
  return list
})

const hasCenterGroup = computed(() =>
  normalizedGroups.value.some((g) => g.align === 'center'),
)

function isItemActive(item: ActivityBarItem): boolean {
  if (typeof item.active === 'boolean') return item.active
  if (!props.activeVisible) return false
  return props.modelValue === item.id
}

function handleClick(item: ActivityBarItem) {
  emit('select', item)
  if (typeof item.active !== 'boolean') {
    emit('update:modelValue', item.id)
  }
}

function groupStyle(group: ActivityBarGroup): Record<string, string> | undefined {
  if (group.align === 'custom' && group.offset) {
    return { marginTop: group.offset }
  }
  return undefined
}
</script>

<template>
  <nav
    class="vl-activity-bar shape-rect"
    :class="{ mobile, expanded, 'has-center': hasCenterGroup }"
    :aria-label="ariaLabel ?? messages.nav.activityBarAria"
  >
    <div
      v-for="(group, gIdx) in normalizedGroups"
      :key="group.id"
      class="vl-activity-group"
      :class="[
        `align-${group.align ?? 'start'}`,
        {
          'push-bottom':
            group.align === 'end' &&
            !hasCenterGroup &&
            gIdx === normalizedGroups.findIndex((x) => x.align === 'end'),
        },
      ]"
      :style="groupStyle(group)"
    >
      <slot
        v-if="group.align === 'end' && gIdx === normalizedGroups.findIndex((x) => x.align === 'end')"
        name="bottom"
      />
      <button
        v-for="item in group.items"
        :key="item.id"
        type="button"
        class="vl-activity-btn"
        :class="[
          item.tone === 'secondary' ? 'secondary-mode' : 'primary-mode',
          { active: isItemActive(item), expanded },
        ]"
        :title="item.title ?? item.label"
        :aria-label="item.label"
        :aria-current="isItemActive(item) ? 'page' : undefined"
        @click="handleClick(item)"
      >
        <span class="vl-act-strip shape-rect" aria-hidden="true" />
        <span class="vl-act-icon">
          <VlIcon :name="item.icon" :size="18" />
          <span v-if="item.badge !== undefined" class="vl-act-badge shape-pill">
            {{ item.badge }}
          </span>
        </span>
        <span v-if="expanded" class="vl-act-label">{{ item.label }}</span>
      </button>
    </div>

    <div
      v-if="!normalizedGroups.some((g) => g.align === 'end') && $slots.bottom"
      class="vl-activity-group align-end push-bottom"
    >
      <slot name="bottom" />
    </div>
  </nav>
</template>

<style scoped>
.vl-activity-bar {
  --act-size: var(--activity-btn-size, 36px);
  --act-radius: calc(var(--act-size) / 2);
  --rail-safe-l: 0px;
  position: relative;
  width: var(--activity-bar-width, 50px);
  min-width: var(--activity-bar-width, 50px);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: var(--activity-gap, 8px);
  padding: var(--activity-pad-y, 8px) 0;
  background-color: var(--bg-activity);
  user-select: none;
  flex-shrink: 0;
  transition: width 0.24s var(--ease-decel);
}

.vl-activity-bar.expanded {
  width: 156px;
  min-width: 156px;
  align-items: stretch;
  padding: var(--activity-pad-y, 8px) 7px;
}

.vl-activity-bar.mobile {
  --activity-bar-width: var(--activity-bar-mobile-width, clamp(60px, 16vw, 76px));
  --activity-btn-size: var(--activity-btn-mobile-size, clamp(44px, 11.8vw, 56px));
  --activity-icon-size: var(--activity-icon-mobile-size, clamp(21px, 5.6vw, 27px));
  --activity-gap: var(--activity-gap-mobile, clamp(10px, 2.8vw, 14px));
  --activity-pad-y: var(--activity-pad-y-mobile, clamp(10px, 2.8vw, 14px));
  --act-size: var(--activity-btn-size);
  --act-radius: calc(var(--act-size) / 2);
  --rail-safe-l: var(--vl-safe-left, env(safe-area-inset-left, 0px));
  width: calc(var(--activity-bar-width) + var(--rail-safe-l));
  min-width: calc(var(--activity-bar-width) + var(--rail-safe-l));
  padding:
    calc(var(--activity-pad-y) + var(--vl-safe-top, env(safe-area-inset-top, 0px)))
    0
    calc(var(--activity-pad-y) + 4px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px)))
    var(--rail-safe-l);
}

.vl-activity-bar.mobile.expanded {
  width: calc(156px + var(--rail-safe-l));
  min-width: calc(156px + var(--rail-safe-l));
  padding-left: calc(7px + var(--rail-safe-l));
  padding-right: 7px;
}

.vl-activity-group {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--activity-gap, 8px);
}

.vl-activity-group.align-center {
  margin-top: auto;
  margin-bottom: auto;
}

.vl-activity-group.push-bottom {
  margin-top: auto;
}

.vl-activity-bar.expanded .vl-activity-group {
  align-items: stretch;
}

/* Workbench Classic: Pure 0px Square Idle <-> Exact px Circle/Pill Morph on Active */
.vl-activity-btn {
  position: relative;
  width: var(--act-size);
  height: var(--act-size);
  border-radius: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--text-secondary);
  background-color: transparent;
  cursor: pointer;
  transition:
    border-radius 0.24s var(--ease-decel),
    background-color 0.16s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.vl-activity-btn:focus-visible {
  outline: none;
  background-color: var(--bg-hover);
}

.vl-activity-btn.expanded {
  width: 100%;
  padding: 0 11px;
  justify-content: flex-start;
}

.vl-act-strip {
  position: absolute;
  left: -7px;
  top: 50%;
  width: 3.5px;
  height: 22px;
  margin-top: -11px;
  background-color: var(--accent-primary);
  transform: scaleY(0);
  transform-origin: center;
  pointer-events: none;
  transition: transform 0.22s var(--ease-decel), background-color 0.16s var(--ease-decel);
}

.vl-activity-btn.secondary-mode .vl-act-strip {
  background-color: var(--accent-secondary);
}

.vl-activity-btn.active .vl-act-strip {
  transform: scaleY(1);
}

.vl-act-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vl-act-icon :deep(.vl-icon) {
  width: var(--activity-icon-size, 18px);
  height: var(--activity-icon-size, 18px);
}

.vl-act-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-act-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

@media (hover: hover) and (pointer: fine) {
  .vl-activity-btn:not(.active):hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }
}

.vl-activity-btn.active {
  border-radius: var(--act-radius);
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

@media (hover: hover) and (pointer: fine) {
  .vl-activity-btn.active:hover {
    background-color: var(--accent-primary-hover);
  }
}

.vl-activity-btn.secondary-mode.active {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

@media (hover: hover) and (pointer: fine) {
  .vl-activity-btn.secondary-mode.active:hover {
    background-color: var(--accent-secondary-hover);
  }
}
</style>
