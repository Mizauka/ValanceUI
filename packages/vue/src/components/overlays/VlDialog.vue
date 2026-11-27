<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import VlIconButton from '../primitives/VlIconButton.vue'
import { useBackHandler } from '../../composables/useBackNavigation'
import { useLocale } from '../../composables/useLocale'

const { messages } = useLocale()

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    tone?: 'primary' | 'secondary' | 'danger'
    width?: string
    contained?: boolean
    closeOnBackdrop?: boolean
  }>(),
  {
    tone: 'primary',
    width: '440px',
    contained: false,
    closeOnBackdrop: true,
  },
)

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'close'): void
}>()

const isClient = typeof window !== 'undefined'

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
  300,
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body" :disabled="contained || !isClient">
    <Transition name="sheet-backdrop">
      <div
        v-if="open"
        class="vl-dialog-overlay shape-rect"
        :class="{ contained }"
        @click.self="closeOnBackdrop && close()"
      >
      <section
        class="vl-dialog-card shape-rect"
        :class="`t-${tone}`"
        :style="{ width: `min(100%, ${width})` }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="vl-dialog-top-bar shape-rect" />

        <header class="vl-dialog-head">
          <div class="vl-dialog-titles">
            <h3 class="vl-dialog-title">{{ title }}</h3>
            <p v-if="description" class="vl-dialog-desc">{{ description }}</p>
          </div>
          <VlIconButton
            icon="close"
            size="sm"
            morph-on-hover
            :title="messages.common.close"
            :aria-label="messages.common.close"
            class="vl-dialog-close"
            @click="close"
          />
        </header>

        <div v-if="$slots.default" class="vl-dialog-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="vl-dialog-foot">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>
.vl-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 260;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(24, 21, 18, 0.42);
}

.vl-dialog-overlay.contained {
  position: absolute;
  z-index: 80;
}

.vl-dialog-card {
  position: relative;
  background-color: var(--bg-base);
  border: 1px solid var(--divider-strong);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: vl-dialog-pop 0.28s var(--ease-emphasized-decel);
}

@keyframes vl-dialog-pop {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vl-dialog-top-bar {
  height: 3px;
  width: 100%;
  background-color: var(--accent-primary);
}

.vl-dialog-card.t-secondary .vl-dialog-top-bar {
  background-color: var(--accent-secondary);
}

.vl-dialog-card.t-danger .vl-dialog-top-bar {
  background-color: var(--accent-danger);
}

.vl-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px 16px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-dialog-titles {
  min-width: 0;
}

.vl-dialog-title {
  margin: 0;
  font-size: var(--ui-font-lg);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-dialog-desc {
  margin: 4px 0 0 0;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.vl-dialog-close {
  width: 26px;
  height: 26px;
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

.vl-dialog-close:hover {
  border-radius: 13px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.vl-dialog-close:active {
  border-radius: 13px;
}

.vl-dialog-body {
  padding: 16px;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  line-height: 1.65;
}

.vl-dialog-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
