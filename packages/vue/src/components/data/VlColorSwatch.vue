<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useThemeMode } from '../../composables/useThemeMode'
import { useToast } from '../../composables/useToast'
import { useLocale } from '../../composables/useLocale'

const props = defineProps<{
  name: string
  token: string
  description?: string
}>()

const { resolvedTheme, accentScheme } = useThemeMode()
const toast = useToast()
const { messages } = useLocale()

const swatchRef = ref<HTMLElement | null>(null)
const computedHex = ref('')

function readColor() {
  if (typeof window === 'undefined' || !swatchRef.value) return
  const rgb = window.getComputedStyle(swatchRef.value).backgroundColor
  const m = rgb.match(/\d+/g)
  if (m && m.length >= 3) {
    const r = Number(m[0]).toString(16).padStart(2, '0')
    const g = Number(m[1]).toString(16).padStart(2, '0')
    const b = Number(m[2]).toString(16).padStart(2, '0')
    computedHex.value = `#${r}${g}${b}`.toUpperCase()
  } else {
    computedHex.value = rgb
  }
}

async function copyToken() {
  const val = `var(${props.token})`
  try {
    await navigator.clipboard?.writeText(val)
    toast.success(messages.value.colorSwatch.copied(val, computedHex.value))
  } catch {
    toast.info(`${val} · ${computedHex.value}`)
  }
}

onMounted(() => {
  readColor()
})

watch([resolvedTheme, accentScheme], () => {
  setTimeout(readColor, 30)
})
</script>

<template>
  <button type="button" class="vl-swatch-card shape-rect" @click="copyToken">
    <span
      ref="swatchRef"
      class="vl-swatch-block shape-rect"
      :style="{ backgroundColor: `var(${token})` }"
    />
    <span class="vl-swatch-meta">
      <strong class="vl-swatch-name">{{ name }}</strong>
      <code class="vl-swatch-token">{{ token }}</code>
      <span class="vl-swatch-hex">{{ computedHex || '—' }}</span>
      <span v-if="description" class="vl-swatch-desc">{{ description }}</span>
    </span>
  </button>
</template>

<style scoped>
.vl-swatch-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  overflow: hidden;
  transition: border-color 0.18s var(--ease-nonlinear), background-color 0.18s var(--ease-nonlinear);
}

.vl-swatch-card:hover {
  border-color: var(--accent-primary);
  background-color: var(--bg-elevated);
}

.vl-swatch-block {
  width: 100%;
  height: 52px;
  border-bottom: 1px solid var(--divider-hairline);
}

.vl-swatch-meta {
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vl-swatch-name {
  font-size: var(--ui-font-md);
  font-weight: 800;
  color: var(--text-primary);
}

.vl-swatch-token {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--accent-primary-text);
}

.vl-swatch-hex {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  font-weight: 700;
  color: var(--text-muted);
}

.vl-swatch-desc {
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}
</style>
