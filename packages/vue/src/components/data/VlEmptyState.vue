<script setup lang="ts">
import VlButton from '../primitives/VlButton.vue'
import VlShape from '../primitives/VlShape.vue'
import VlIcon from '../icons/VlIcon.vue'
import type { IconName } from '../icons/iconRegistry'
import type { M3ShapeName } from '../../styles/m3Shapes'

withDefaults(
  defineProps<{
    title: string
    description?: string
    ctaLabel?: string
    ctaIcon?: IconName
    compact?: boolean
    shape?: M3ShapeName
    morphShapes?: M3ShapeName[]
    icon?: IconName
    tone?: 'primary' | 'secondary'
  }>(),
  {
    compact: false,
    shape: 'clover-4',
    morphShapes: () => ['clover-4', 'cookie-7', 'flower', 'puffy'],
    tone: 'primary',
  },
)

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="vl-empty-state" :class="{ compact }">
    <div class="vl-empty-mark" aria-hidden="true">
      <VlShape
        :shape="shape"
        :auto-morph="morphShapes"
        :cycle-interval="2400"
        :morph-duration="720"
        hover-shape="sunny"
        :tone="tone"
        variant="soft"
        :size="compact ? 56 : 68"
        interactive
        class="vl-empty-outer"
      >
        <VlShape
          :shape="morphShapes[1] ?? 'cookie-7'"
          :auto-morph="[...morphShapes].reverse()"
          :cycle-interval="2400"
          :morph-duration="720"
          :tone="tone === 'primary' ? 'secondary' : 'primary'"
          variant="solid"
          :size="compact ? 26 : 30"
        >
          <VlIcon :name="icon ?? 'sparkles'" :size="compact ? 12 : 14" />
        </VlShape>
      </VlShape>
    </div>

    <div class="vl-empty-title">{{ title }}</div>
    <div v-if="description" class="vl-empty-desc">{{ description }}</div>

    <div v-if="ctaLabel || $slots.action" class="vl-empty-action">
      <slot name="action">
        <VlButton
          v-if="ctaLabel"
          variant="primary"
          shape="pill"
          :icon-right="ctaIcon"
          @click="emit('action')"
        >
          {{ ctaLabel }}
        </VlButton>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vl-empty-state {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 36px 22px;
  gap: 10px;
}

.vl-empty-state.compact {
  min-height: auto;
  padding: 24px 12px;
  gap: 8px;
}

.vl-empty-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.vl-empty-outer {
  animation: vl-empty-float 6s var(--ease-standard) infinite;
}

@keyframes vl-empty-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
}

.vl-empty-title {
  font-size: var(--ui-font-base);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-empty-desc {
  font-size: var(--ui-font-md);
  line-height: 1.65;
  color: var(--text-muted);
  max-width: 320px;
}

.vl-empty-action {
  margin-top: 6px;
}
</style>
