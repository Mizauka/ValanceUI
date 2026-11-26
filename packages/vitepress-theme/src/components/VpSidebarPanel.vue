<script setup lang="ts">
import { computed } from 'vue'
import {
  VlPanel,
  VlPalettePicker,
  VlSideNav,
  VlInput,
  VlSegmentedControl,
  VlStepper,
  VlButton,
  VlTag,
  VlBadge,
  VlEmptyState,
  useThemeMode,
  type SideNavGroup,
  type SideNavItem,
  type SegmentOption,
  type ThemePreference,
  type AccentScheme,
} from '@valance-ui/vue'
import {
  useBlogState,
  normalizeBlogPath,
  type BlogFontFamily,
  type BlogWidthPreset,
} from '../composables/useBlogState'

const {
  themeCfg,
  posts,
  currentPath,
  allCategories,
  allTags,
  openTabs,
  isPhone,
  isDual,
  activitySection,
  searchQuery,
  selectedTag,
  selectedCategory,
  fontSize,
  lineHeight,
  fontFamily,
  widthPreset,
  openPath,
  setFontSize,
  setLineHeight,
  setFontFamily,
  setWidthPreset,
  resetLayout,
} = useBlogState()

const {
  themePreference,
  resolvedTheme,
  accentScheme,
  activeLightBgHex,
  activeDarkBgHex,
  setThemePreference,
  setAccentScheme,
} = useThemeMode()

const themeOptions: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
]

const accentOptions: SegmentOption<AccentScheme>[] = [
  { value: 'default', label: '默认（橘 / 青）' },
  { value: 'swapped', label: '对调（青 / 橘）' },
]

const fontOptions: SegmentOption<BlogFontFamily>[] = [
  { value: 'sans', label: '无衬线黑体' },
  { value: 'serif', label: '衬线宋体' },
]

const widthOptions: SegmentOption<BlogWidthPreset>[] = [
  { value: 'narrow', label: '窄' },
  { value: 'standard', label: '标准' },
  { value: 'wide', label: '宽' },
]

const openSet = computed(() => new Set(openTabs.value.map((t) => t.id)))

const navGroups = computed<SideNavGroup[]>(() => {
  const navItems: SideNavItem[] = (themeCfg.value.nav ?? [
    { text: '首页', link: '/', icon: 'home' },
    { text: '时间线归档', link: '/archive', icon: 'archive' },
    { text: '关于博客', link: '/about', icon: 'user' },
  ]).map((n) => ({
    id: normalizeBlogPath(n.link),
    label: n.text,
    icon: n.icon ?? 'compass',
    openDot: openSet.value.has(normalizeBlogPath(n.link)),
  }))

  const catMap = new Map<string, SideNavItem[]>()
  for (const post of posts.value) {
    const cat = post.category || '文章列表'
    const list = catMap.get(cat) ?? []
    const norm = normalizeBlogPath(post.url)
    list.push({
      id: norm,
      label: post.title,
      icon: 'doc',
      openDot: openSet.value.has(norm),
      meta: post.date?.slice(5, 10),
    })
    catMap.set(cat, list)
  }

  const groups: SideNavGroup[] = [
    {
      id: 'site-nav',
      label: '站点页面',
      badge: `${navItems.length}`,
      defaultOpen: true,
      items: navItems,
    },
  ]

  for (const [cat, items] of catMap.entries()) {
    groups.push({
      id: `cat-${cat}`,
      label: cat,
      meta: `${items.length} 篇`,
      defaultOpen: true,
      items,
    })
  }

  return groups
})

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return posts.value.filter((p) => {
    const hay = `${p.title} ${p.excerpt ?? ''} ${p.category ?? ''} ${(p.tags ?? []).join(' ')} ${p.plainText ?? ''}`.toLowerCase()
    return hay.includes(q)
  })
})

function onSelectNav(item: SideNavItem) {
  openPath(item.id)
}

function pickTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? null : tag
  openPath('/')
}

function pickCategory(cat: string) {
  selectedCategory.value = selectedCategory.value === cat ? null : cat
  openPath('/')
}
</script>

<template>
  <!-- SECTION 1: Explorer -->
  <VlPanel
    v-if="activitySection === 'explorer'"
    title="内容资源管理器"
    badge="EXPLORER"
    padded
  >
    <VlSideNav
      :groups="navGroups"
      :active-id="currentPath"
      @select="onSelectNav"
    />
  </VlPanel>

  <!-- SECTION 2: Search -->
  <VlPanel
    v-else-if="activitySection === 'search'"
    title="全局搜索"
    badge="SEARCH"
  >
    <template #toolbar>
      <div class="sidebar-search-bar">
        <VlInput
          v-model="searchQuery"
          shape="pill"
          prefix-icon="search"
          clearable
          placeholder="搜索标题、正文、标签…"
        />
      </div>
    </template>

    <div class="sidebar-pad">
      <VlEmptyState
        v-if="!searchQuery.trim()"
        compact
        title="站内即时检索"
        description="输入关键词快速定位文章标题、分类、标签与正文片段。"
      />

      <VlEmptyState
        v-else-if="searchResults.length === 0"
        compact
        title="未命中任何文章"
        description="换个关键词试试看。"
      />

      <div v-else class="search-hits">
        <button
          v-for="hit in searchResults"
          :key="hit.url"
          type="button"
          class="search-hit-item shape-rect"
          :class="{ active: normalizeBlogPath(hit.url) === currentPath }"
          @click="openPath(hit.url)"
        >
          <div class="hit-top">
            <strong class="hit-title">{{ hit.title }}</strong>
            <VlBadge v-if="hit.category" tone="primary" size="xs">{{ hit.category }}</VlBadge>
          </div>
          <p v-if="hit.excerpt" class="hit-excerpt">{{ hit.excerpt }}</p>
        </button>
      </div>
    </div>
  </VlPanel>

  <!-- SECTION 3: Categories & Tags -->
  <VlPanel
    v-else-if="activitySection === 'archive'"
    title="分类与标签"
    badge="TAXONOMY"
    padded
  >
    <div class="tax-section">
      <div class="tax-label">分类目录</div>
      <div class="tax-list">
        <VlTag
          v-for="cat in allCategories"
          :key="cat.name"
          clickable
          tone="primary"
          :active="selectedCategory === cat.name"
          icon="folder"
          @click="pickCategory(cat.name)"
        >
          {{ cat.name }} ({{ cat.count }})
        </VlTag>
      </div>

      <div class="tax-label" style="margin-top: 14px">主题标签</div>
      <div class="tax-list">
        <VlTag
          v-for="tag in allTags"
          :key="tag.name"
          clickable
          tone="secondary"
          :active="selectedTag === tag.name"
          @click="pickTag(tag.name)"
        >
          # {{ tag.name }} ({{ tag.count }})
        </VlTag>
      </div>
    </div>
  </VlPanel>

  <!-- SECTION 4: Settings -->
  <VlPanel
    v-else
    title="外观与阅读设置"
    badge="PREFERENCES"
  >
    <div class="settings-list">
      <section class="setting-item">
        <div class="setting-head">
          <span class="setting-label">外观模式</span>
          <span class="setting-meta">{{ resolvedTheme === 'light' ? activeLightBgHex : activeDarkBgHex }}</span>
        </div>
        <VlSegmentedControl
          :model-value="themePreference"
          :options="themeOptions"
          variant="morph-grid"
          :columns="3"
          @select="(val, ev) => setThemePreference(val, ev)"
        />
      </section>

      <section class="setting-item">
        <div class="setting-head">
          <span class="setting-label">主题色对调</span>
          <span class="setting-meta">{{ accentScheme === 'default' ? '主橘 · 辅青' : '主青 · 辅橘' }}</span>
        </div>
        <VlSegmentedControl
          :model-value="accentScheme"
          :options="accentOptions"
          variant="morph-grid"
          :columns="2"
          @select="(val, ev) => setAccentScheme(val, ev)"
        />
      </section>

      <section class="setting-item">
        <VlPalettePicker compact />
      </section>

      <section class="setting-item">
        <div class="setting-head">
          <span class="setting-label">正文字体</span>
        </div>
        <VlSegmentedControl
          :model-value="fontFamily"
          :options="fontOptions"
          variant="morph-grid"
          :columns="2"
          @update:model-value="setFontFamily"
        />
      </section>

      <section class="setting-item">
        <VlStepper
          :model-value="fontSize"
          :min="14"
          :max="24"
          :step="1"
          :precision="0"
          label="正文字号"
          :hint="`${fontSize} px`"
          decrement-label="A-"
          increment-label="A+"
          @update:model-value="setFontSize"
        />
      </section>

      <section class="setting-item">
        <VlStepper
          :model-value="lineHeight"
          :min="1.5"
          :max="2.3"
          :step="0.1"
          :precision="2"
          label="正文行距"
          :hint="`${lineHeight.toFixed(2)} 倍`"
          @update:model-value="setLineHeight"
        />
      </section>

      <section v-if="!isPhone" class="setting-item">
        <div class="setting-head">
          <span class="setting-label">版心宽度</span>
        </div>
        <VlSegmentedControl
          :model-value="widthPreset"
          :options="widthOptions"
          variant="morph-grid"
          :columns="3"
          @update:model-value="setWidthPreset"
        />
      </section>

      <section v-if="!isPhone" class="setting-item">
        <div class="setting-head">
          <span class="setting-label">{{ isDual ? '双栏分屏' : '三栏分屏' }}</span>
          <span class="setting-meta">双击滑块也可重置</span>
        </div>
        <VlButton variant="secondary" icon="reset" block @click="resetLayout">
          恢复默认分屏布局
        </VlButton>
      </section>
    </div>
  </VlPanel>
</template>

<style scoped>
.sidebar-search-bar {
  padding: 4px var(--pane-pad) 10px var(--pane-pad);
}

.sidebar-pad {
  padding: 0 var(--pane-pad) 16px var(--pane-pad);
}

.search-hits {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-hit-item {
  width: 100%;
  padding: 9px 10px;
  text-align: left;
  background-color: var(--bg-elevated);
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.search-hit-item:hover {
  background-color: var(--bg-hover);
}

.search-hit-item.active {
  background-color: var(--accent-primary-soft);
  border-left-color: var(--accent-primary);
}

.hit-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.hit-title {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.hit-excerpt {
  margin: 0;
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tax-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tax-label {
  font-size: var(--ui-font-xs);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.tax-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.settings-list {
  padding: 0 var(--pane-pad) 20px var(--pane-pad);
  display: flex;
  flex-direction: column;
}

.setting-item {
  padding: 13px 0;
  border-top: 1px solid var(--divider-hairline);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item:first-child {
  border-top: none;
  padding-top: 6px;
}

.setting-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.setting-label {
  font-size: var(--ui-font-md);
  font-weight: 700;
  color: var(--text-primary);
}

.setting-meta {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
