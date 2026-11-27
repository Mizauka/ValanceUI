<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ICON_CATEGORIES,
  VlBadge,
  VlCard,
  VlIcon,
  VlInput,
  VlSlider,
  VlTag,
  getLocalizedIconGroupLabel,
  useToast,
} from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()
const toast = useToast()
const query = ref('')
const activeCategory = ref<string>('all')
const iconSize = ref(20)

const filteredCategories = computed(() => {
  const q = query.value.trim().toLowerCase()
  return ICON_CATEGORIES.filter(
    (c) => activeCategory.value === 'all' || c.id === activeCategory.value,
  )
    .map((c) => ({
      ...c,
      icons: c.icons.filter((name) => !q || name.toLowerCase().includes(q)),
    }))
    .filter((c) => c.icons.length > 0)
})

const totalVisible = computed(() =>
  filteredCategories.value.reduce((acc, c) => acc + c.icons.length, 0),
)

async function copyIcon(name: string) {
  const snippet = `<VlIcon name="${name}" :size="${iconSize.value}" />`
  try {
    await navigator.clipboard?.writeText(snippet)
    toast.success(t.value.icons.copiedToast(snippet))
  } catch {
    toast.info(snippet)
  }
}
</script>

<template>
  <div class="demo-view">
    <VlCard :title="t.icons.cardTitle" :subtitle="t.icons.cardSubtitle" accent-side="left" accent-tone="secondary">
      <div class="icon-controls">
        <VlInput
          v-model="query"
          shape="pill"
          prefix-icon="search"
          clearable
          :placeholder="t.icons.searchPlaceholder"
          style="flex: 1"
        />
        <div style="width: 200px">
          <VlSlider v-model="iconSize" :min="12" :max="36" :step="2" :label="t.icons.sizeLabel" unit="px" />
        </div>
        <VlBadge tone="primary" size="md">{{ t.icons.countBadge(totalVisible) }}</VlBadge>
      </div>

      <div class="cat-chips">
        <VlTag
          clickable
          :active="activeCategory === 'all'"
          tone="primary"
          @click="activeCategory = 'all'"
        >
          {{ t.icons.allCategories }}
        </VlTag>
        <VlTag
          v-for="cat in ICON_CATEGORIES"
          :key="cat.id"
          clickable
          :active="activeCategory === cat.id"
          tone="secondary"
          @click="activeCategory = cat.id"
        >
          {{ getLocalizedIconGroupLabel(cat.id) }}
        </VlTag>
      </div>
    </VlCard>

    <section v-for="cat in filteredCategories" :key="cat.id" class="icon-section">
      <div class="cat-head">
        <strong>{{ getLocalizedIconGroupLabel(cat.id) }}</strong>
        <VlBadge tone="neutral" size="xs">{{ cat.icons.length }}</VlBadge>
      </div>

      <div class="icon-grid">
        <button
          v-for="name in cat.icons"
          :key="name"
          type="button"
          class="icon-tile shape-rect"
          :title="t.icons.copyTitle(name)"
          @click="copyIcon(name)"
        >
          <span class="icon-box">
            <VlIcon :name="name" :size="iconSize" />
          </span>
          <span class="icon-name">{{ name }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.icon-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.cat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.icon-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ui-font-base);
  color: var(--text-primary);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
}

.icon-tile {
  padding: 12px 8px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition:
    background-color 0.16s var(--ease-nonlinear),
    border-color 0.16s var(--ease-nonlinear);
}

.icon-tile:hover {
  background-color: var(--bg-elevated);
  border-color: var(--accent-primary);
}

.icon-tile:hover .icon-box {
  border-radius: 22px;
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-activity);
  color: var(--text-primary);
  transition:
    border-radius 0.22s var(--ease-decel),
    background-color 0.14s var(--ease-decel),
    color 0.14s var(--ease-decel);
}

.icon-name {
  font-family: var(--font-mono);
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  word-break: break-all;
}
</style>
