<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { getM3ShapePath, type M3ShapeName } from '../../styles/m3Shapes'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    shape?: 'circle' | 'rect'
    m3Shape?: M3ShapeName
    tone?: 'primary' | 'secondary' | 'neutral'
    status?: 'online' | 'busy' | 'offline' | null
  }>(),
  {
    name: 'V',
    size: 'md',
    shape: 'circle',
    tone: 'primary',
    status: null,
  },
)

const imgError = ref(false)
const clipId = `vl-av-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

const m3Path = computed(() => (props.m3Shape ? getM3ShapePath(props.m3Shape) : ''))

const initials = computed(() => {
  const clean = props.name.trim()
  if (!clean) return 'V'
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
})
</script>

<template>
  <span
    class="vl-avatar"
    :class="[
      `sz-${size}`,
      `t-${tone}`,
      m3Shape ? 'has-m3' : shape === 'circle' ? 'shape-circle' : 'shape-rect',
    ]"
  >
    <svg
      v-if="m3Shape"
      class="vl-avatar-m3-svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <defs>
        <clipPath :id="clipId">
          <path :d="m3Path" />
        </clipPath>
      </defs>
      <path :d="m3Path" class="vl-avatar-m3-bg" />
      <image
        v-if="src && !imgError"
        :href="src"
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="xMidYMid slice"
        :clip-path="`url(#${clipId})`"
      />
    </svg>

    <template v-else>
      <img
        v-if="src && !imgError"
        :src="src"
        :alt="name"
        class="vl-avatar-img"
        :class="shape === 'circle' ? 'shape-circle' : 'shape-rect'"
        @error="imgError = true"
      />
    </template>

    <span v-if="!src || imgError" class="vl-avatar-text">{{ initials }}</span>
    <span v-if="status" class="vl-avatar-status shape-circle" :class="`st-${status}`" />
  </span>
</template>

<style scoped>
.vl-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  user-select: none;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.vl-avatar.sz-sm {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.vl-avatar.sz-md {
  width: 34px;
  height: 34px;
  font-size: 12px;
}

.vl-avatar.sz-lg {
  width: 46px;
  height: 46px;
  font-size: 15px;
}

.vl-avatar.sz-xl {
  width: 64px;
  height: 64px;
  font-size: 20px;
}

.vl-avatar.t-primary {
  background-color: var(--accent-primary-soft);
  color: var(--accent-primary-text);
}

.vl-avatar.t-secondary {
  background-color: var(--accent-secondary-soft);
  color: var(--accent-secondary-text);
}

.vl-avatar.t-neutral {
  background-color: var(--bg-chip);
  color: var(--text-primary);
}

.vl-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vl-avatar.has-m3 {
  background-color: transparent !important;
}

.vl-avatar-m3-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.vl-avatar.t-primary .vl-avatar-m3-bg {
  fill: var(--accent-primary-soft);
}

.vl-avatar.t-secondary .vl-avatar-m3-bg {
  fill: var(--accent-secondary-soft);
}

.vl-avatar.t-neutral .vl-avatar-m3-bg {
  fill: var(--bg-chip);
}

.vl-avatar-text {
  position: relative;
  z-index: 1;
}

.vl-avatar-status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--bg-base);
}

.vl-avatar-status.st-online {
  background-color: var(--accent-success);
}

.vl-avatar-status.st-busy {
  background-color: var(--accent-warning);
}

.vl-avatar-status.st-offline {
  background-color: var(--text-muted);
}
</style>
