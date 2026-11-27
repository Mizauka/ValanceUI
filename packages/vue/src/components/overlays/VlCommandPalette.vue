<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import VlScrollArea from '../layout/VlScrollArea.vue'
import { useBackHandler } from '../../composables/useBackNavigation'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

export interface CommandPaletteItem {
  id: string
  label: string
  subtitle?: string
  excerpt?: string
  group?: string
  icon?: IconName
  shortcut?: string
  badge?: string
  keywords?: string[]
}

const props = withDefaults(
  defineProps<{
    open: boolean
    items: CommandPaletteItem[]
    placeholder?: string
    allowRegex?: boolean
    enableHotkey?: boolean
    teleport?: boolean
    contained?: boolean
  }>(),
  {
    allowRegex: true,
    enableHotkey: false,
    teleport: true,
    contained: false,
  },
)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'select', item: CommandPaletteItem): void
}>()

const query = ref('')
const useRegex = ref(false)
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const isClient = typeof window !== 'undefined'

interface MatchedSegment {
  text: string
  hit: boolean
}

function splitMatch(source: string, needle: string, regexObj: RegExp | null): MatchedSegment[] {
  if (!source || (!needle && !regexObj)) return [{ text: source, hit: false }]
  const segs: MatchedSegment[] = []
  if (regexObj) {
    const r = new RegExp(regexObj.source, regexObj.flags.includes('g') ? regexObj.flags : `${regexObj.flags}g`)
    let lastIdx = 0
    let guard = 0
    for (const m of source.matchAll(r)) {
      if (guard++ > 20 || !m[0]) break
      const start = m.index ?? 0
      if (start > lastIdx) segs.push({ text: source.slice(lastIdx, start), hit: false })
      segs.push({ text: m[0], hit: true })
      lastIdx = start + m[0].length
    }
    if (lastIdx < source.length) segs.push({ text: source.slice(lastIdx), hit: false })
    return segs.length ? segs : [{ text: source, hit: false }]
  }

  const lowerSrc = source.toLowerCase()
  const lowerQ = needle.toLowerCase()
  const idx = lowerSrc.indexOf(lowerQ)
  if (idx < 0) return [{ text: source, hit: false }]
  if (idx > 0) segs.push({ text: source.slice(0, idx), hit: false })
  segs.push({ text: source.slice(idx, idx + needle.length), hit: true })
  if (idx + needle.length < source.length) segs.push({ text: source.slice(idx + needle.length), hit: false })
  return segs
}

const regexCompile = computed<{ regex: RegExp | null; error: string | null }>(() => {
  const q = query.value.trim()
  if (!useRegex.value || !q) return { regex: null, error: null }
  try {
    return { regex: new RegExp(q, 'i'), error: null }
  } catch (err) {
    return { regex: null, error: err instanceof Error ? err.message : messages.value.commandPalette.regexSyntaxError }
  }
})

const filteredItems = computed(() => {
  const q = query.value.trim()
  if (!q) return props.items
  if (useRegex.value) {
    const rx = regexCompile.value.regex
    if (!rx) return []
    return props.items.filter((item) => {
      const hay = `${item.label} ${item.subtitle ?? ''} ${item.excerpt ?? ''} ${(item.keywords ?? []).join(' ')}`
      return rx.test(hay)
    })
  }
  const lower = q.toLowerCase()
  return props.items.filter((item) => {
    const hay = `${item.label} ${item.subtitle ?? ''} ${item.excerpt ?? ''} ${(item.keywords ?? []).join(' ')}`.toLowerCase()
    return hay.includes(lower)
  })
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      query.value = ''
      activeIndex.value = 0
      nextTick(() => inputRef.value?.focus())
    }
  },
)

watch(filteredItems, () => {
  activeIndex.value = 0
})

function close() {
  emit('update:open', false)
}

useBackHandler(
  computed(() => props.open && !props.contained),
  () => {
    close()
    return true
  },
  290,
)

function choose(item: CommandPaletteItem) {
  emit('select', item)
  close()
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredItems.value.length) activeIndex.value = (activeIndex.value + 1) % filteredItems.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredItems.value.length) {
      activeIndex.value = (activeIndex.value - 1 + filteredItems.value.length) % filteredItems.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = filteredItems.value[activeIndex.value]
    if (target) choose(target)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (!props.enableHotkey) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    emit('update:open', !props.open)
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <Teleport to="body" :disabled="!teleport || contained || !isClient">
    <Transition name="sheet-backdrop">
      <div
        v-if="open"
        class="vl-cmd-backdrop"
        :class="{ contained }"
        role="presentation"
        @mousedown.self="close"
      >
        <div class="vl-cmd-box shape-rect" role="dialog" :aria-label="messages.commandPalette.ariaLabel">
          <div class="vl-cmd-search-bar">
            <VlIcon name="search" :size="15" class="vl-cmd-lead" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="vl-cmd-input"
              :placeholder="placeholder ?? messages.commandPalette.placeholder"
              @keydown="onInputKeydown"
            />
            <button
              v-if="allowRegex"
              type="button"
              class="vl-cmd-mode shape-pill"
              :class="{ active: useRegex }"
              :title="messages.commandPalette.toggleRegexTitle"
              @click="useRegex = !useRegex"
            >
              .*
            </button>
            <button
              v-if="query"
              type="button"
              class="vl-cmd-clear shape-circle"
              :aria-label="messages.common.clear"
              @click="query = ''"
            >
              <VlIcon name="close" :size="10" />
            </button>
          </div>

          <div v-if="regexCompile.error" class="vl-cmd-error">
            {{ messages.commandPalette.regexErrorPrefix }}{{ regexCompile.error }}
          </div>

          <VlScrollArea max-height="340px" class="vl-cmd-results">
            <div v-if="filteredItems.length === 0" class="vl-cmd-empty">
              {{ messages.commandPalette.emptyText }}
            </div>

            <button
              v-for="(item, idx) in filteredItems"
              :key="item.id"
              type="button"
              class="vl-cmd-row shape-rect"
              :class="{ active: idx === activeIndex }"
              @mouseenter="activeIndex = idx"
              @click="choose(item)"
            >
              <span class="vl-cmd-bar shape-rect" />
              <VlIcon v-if="item.icon" :name="item.icon" :size="15" class="vl-cmd-icon" />
              <div class="vl-cmd-body">
                <div class="vl-cmd-top">
                  <strong class="vl-cmd-label">
                    <template v-for="(seg, sIdx) in splitMatch(item.label, query.trim(), regexCompile.regex)" :key="sIdx">
                      <mark v-if="seg.hit" class="vl-cmd-mark shape-rect">{{ seg.text }}</mark>
                      <template v-else>{{ seg.text }}</template>
                    </template>
                  </strong>
                  <span v-if="item.group" class="vl-cmd-group">{{ item.group }}</span>
                </div>
                <p v-if="item.subtitle || item.excerpt" class="vl-cmd-excerpt">
                  <template
                    v-for="(seg, sIdx) in splitMatch(item.excerpt || item.subtitle || '', query.trim(), regexCompile.regex)"
                    :key="sIdx"
                  >
                    <mark v-if="seg.hit" class="vl-cmd-mark shape-rect">{{ seg.text }}</mark>
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </p>
              </div>
              <span v-if="item.badge" class="vl-cmd-badge shape-pill">{{ item.badge }}</span>
              <span v-if="item.shortcut" class="vl-cmd-shortcut shape-rect">{{ item.shortcut }}</span>
            </button>
          </VlScrollArea>

          <div class="vl-cmd-foot">
            <span>{{ messages.commandPalette.navHint }}</span>
            <span>{{ messages.commandPalette.selectHint }}</span>
            <span>{{ messages.commandPalette.closeHint }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.vl-cmd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 290;
  background-color: rgba(15, 19, 21, 0.42);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: min(12vh, 96px) 16px 24px;
}

.vl-cmd-backdrop.contained {
  position: absolute;
  padding-top: 24px;
}

.vl-cmd-box {
  width: min(600px, 100%);
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-strong);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: vl-cmd-pop 0.28s var(--ease-emphasized-decel);
}

@keyframes vl-cmd-pop {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vl-cmd-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--divider-hairline);
  background-color: var(--bg-base);
}

.vl-cmd-lead {
  color: var(--accent-primary-text);
  flex-shrink: 0;
}

.vl-cmd-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--ui-font-base);
  font-weight: 600;
  outline: none;
}

.vl-cmd-mode {
  height: 24px;
  padding: 0 9px;
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  font-weight: 800;
  background-color: var(--bg-chip);
  color: var(--text-secondary);
}

.vl-cmd-mode.active {
  background-color: var(--accent-secondary);
  color: var(--accent-secondary-ink);
}

.vl-cmd-clear {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-chip);
  color: var(--text-muted);
}

.vl-cmd-error {
  padding: 8px 14px;
  background-color: var(--accent-danger-soft);
  color: var(--accent-danger-text);
  font-size: var(--ui-font-xs);
  font-weight: 700;
}

.vl-cmd-results {
  padding: 6px;
}

.vl-cmd-empty {
  padding: 28px 14px;
  text-align: center;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
}

.vl-cmd-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.vl-cmd-row.active {
  background-color: var(--accent-primary-soft);
}

.vl-cmd-bar {
  width: 3px;
  align-self: stretch;
  background-color: transparent;
  flex-shrink: 0;
}

.vl-cmd-row.active .vl-cmd-bar {
  background-color: var(--accent-primary);
}

.vl-cmd-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.vl-cmd-row.active .vl-cmd-icon {
  color: var(--accent-primary-text);
}

.vl-cmd-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-cmd-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vl-cmd-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.vl-cmd-group {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.vl-cmd-excerpt {
  margin: 0;
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vl-cmd-mark {
  background-color: var(--accent-primary-mid);
  color: var(--text-primary);
  padding: 0 2px;
}

.vl-cmd-badge {
  padding: 1px 8px;
  font-size: var(--ui-font-xs);
  font-weight: 700;
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.vl-cmd-shortcut {
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  background-color: var(--bg-chip);
  color: var(--text-muted);
  border: 1px solid var(--divider-hairline);
}

.vl-cmd-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 7px 14px;
  border-top: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}
</style>
