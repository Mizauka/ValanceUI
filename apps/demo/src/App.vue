<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  VlActivityBar,
  VlBadge,
  VlBreadcrumb,
  VlButton,
  VlCard,
  VlDockSheet,
  VlIconButton,
  VlInput,
  VlPalettePicker,
  VlPanel,
  VlPushDrawer,
  VlScrollArea,
  VlSegmentedControl,
  VlSideNav,
  VlSplitPane,
  VlStatusBar,
  VlTabBar,
  VlTitleBar,
  VlToast,
  VlCommandPalette,
  useThemeMode,
  useViewportTier,
  type ActivityBarItem,
  type BottomDockItem,
  type CommandPaletteItem,
  type DockSheetDetent,
  type SegmentOption,
  type SideNavItem,
  type TabBarItem,
  type ThemePreference,
  type AccentScheme,
} from '@valance-ui/vue'
import { DEMO_SECTIONS, buildDemoNavGroups } from './demoCatalog'
import OverviewView from './views/OverviewView.vue'
import ColorsView from './views/ColorsView.vue'
import ShapesView from './views/ShapesView.vue'
import TypographyMotionView from './views/TypographyMotionView.vue'
import IconsView from './views/IconsView.vue'
import ButtonsView from './views/ButtonsView.vue'
import FormsView from './views/FormsView.vue'
import NavigationView from './views/NavigationView.vue'
import LayoutGesturesView from './views/LayoutGesturesView.vue'
import OverlaysFeedbackView from './views/OverlaysFeedbackView.vue'
import DataDisplayView from './views/DataDisplayView.vue'

const {
  themePreference,
  resolvedTheme,
  accentScheme,
  activePalette,
  activeLightBgHex,
  activeDarkBgHex,
  setThemePreference,
  setAccentScheme,
  toggleTheme,
  toggleAccent,
} = useThemeMode()

const { isPhone, isDual } = useViewportTier({
  phoneMaxWidth: 720,
  dualMaxWidth: 1080,
})

const activitySection = ref<'catalog' | 'search' | 'settings'>('catalog')
const activityOrder: ('catalog' | 'search' | 'settings')[] = ['catalog', 'search', 'settings']
const activityDir = ref<'next' | 'prev'>('next')
const sidebarTransition = computed(() =>
  activityDir.value === 'next' ? 'vl-slide-fade-v-next' : 'vl-slide-fade-v-prev',
)
const leftVisible = ref(true)
const rightVisible = ref(true)
const leftWidth = ref(278)
const rightWidth = ref(276)
const dualSide = ref<'left' | 'right' | 'none'>('left')
const dualSideRatio = ref(0.36)
const mobileDrawerOpen = ref(false)
const mobileDockDetent = ref<DockSheetDetent>('docked')
const mobileDockDir = ref<'left' | 'right'>('left')
const desktopViewDir = ref<'next' | 'prev'>('next')
// Preset 1: Seamless horizontal slide for mobile views
const mobileDockTransition = computed(() =>
  mobileDockDir.value === 'left' ? 'vl-slide-h-next' : 'vl-slide-h-prev',
)
// Preset 3 (Vertical): Slide + fade for desktop workbench sidebar view switching
const desktopViewTransition = computed(() =>
  desktopViewDir.value === 'next' ? 'vl-slide-fade-v-next' : 'vl-slide-fade-v-prev',
)
const activeMobileDockId = computed(() =>
  mobileDockItems.some((item) => item.id === activeSectionId.value) ? activeSectionId.value : 'overview',
)

const leftShown = computed(() => (isDual.value ? dualSide.value === 'left' : leftVisible.value))
const rightShown = computed(() => (isDual.value ? dualSide.value === 'right' : rightVisible.value))

const openIds = ref<string[]>(['overview', 'gestures', 'buttons'])
const activeSectionId = ref('overview')
const searchQuery = ref('')
const cmdPaletteOpen = ref(false)
const commandItems = computed<CommandPaletteItem[]>(() =>
  DEMO_SECTIONS.map((s) => ({
    id: s.id,
    label: s.title,
    subtitle: s.subtitle,
    excerpt: s.summary,
    group: s.group,
    icon: s.icon,
    badge: s.badge,
  })),
)

const activeSection = computed(
  () => DEMO_SECTIONS.find((s) => s.id === activeSectionId.value) ?? DEMO_SECTIONS[0]!,
)

const openTabs = computed<TabBarItem[]>(() =>
  openIds.value
    .map((id) => DEMO_SECTIONS.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      icon: s.icon,
      tone: s.tone,
      pinned: s.id === 'overview',
    })),
)

const navGroups = computed(() => buildDemoNavGroups(new Set(openIds.value)))

const filteredSearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return DEMO_SECTIONS
  return DEMO_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q),
  )
})

const topActivityItems: ActivityBarItem[] = [
  { id: 'catalog', icon: 'files', label: '组件目录' },
  { id: 'search', icon: 'search', label: '搜索模块' },
]

const bottomActivityItems = computed<ActivityBarItem[]>(() => [
  ...(!isPhone.value
    ? [{ id: 'inspector', icon: 'sliders' as const, label: '规范检查器', tone: 'secondary' as const, active: rightShown.value }]
    : []),
  { id: 'settings', icon: 'settings', label: '外观设置' },
])

const mobileDockItems: BottomDockItem[] = [
  { id: 'overview', label: '总览', icon: 'compass' },
  { id: 'gestures', label: '手势', icon: 'gesture' },
  { id: 'buttons', label: '控件', icon: 'plus' },
]

const themeOpts: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: '系统' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
]

const accentOpts: SegmentOption<AccentScheme>[] = [
  { value: 'default', label: '默认（橘 / 青）' },
  { value: 'swapped', label: '对调（青 / 橘）' },
]

function openSection(id: string) {
  const fromSecIdx = DEMO_SECTIONS.findIndex((s) => s.id === activeSectionId.value)
  const toSecIdx = DEMO_SECTIONS.findIndex((s) => s.id === id)
  if (fromSecIdx !== -1 && toSecIdx !== -1 && fromSecIdx !== toSecIdx) {
    desktopViewDir.value = toSecIdx > fromSecIdx ? 'next' : 'prev'
  }
  const fromDockIdx = mobileDockItems.findIndex((d) => d.id === activeSectionId.value)
  const toDockIdx = mobileDockItems.findIndex((d) => d.id === id)
  if (fromDockIdx !== -1 && toDockIdx !== -1 && fromDockIdx !== toDockIdx) {
    mobileDockDir.value = toDockIdx > fromDockIdx ? 'left' : 'right'
  } else if (fromSecIdx !== -1 && toSecIdx !== -1 && fromSecIdx !== toSecIdx) {
    mobileDockDir.value = toSecIdx > fromSecIdx ? 'left' : 'right'
  }
  if (!openIds.value.includes(id)) {
    openIds.value = [...openIds.value, id]
  }
  activeSectionId.value = id
  if (isPhone.value) {
    mobileDrawerOpen.value = false
    mobileDockDetent.value = 'docked'
  }
}

function closeTab(id: string) {
  if (id === 'overview') return
  const idx = openIds.value.indexOf(id)
  if (idx === -1) return
  openIds.value = openIds.value.filter((x) => x !== id)
  if (activeSectionId.value === id) {
    activeSectionId.value = openIds.value[Math.min(idx, openIds.value.length - 1)] ?? 'overview'
  }
}

function closeOtherTabs() {
  openIds.value = activeSectionId.value === 'overview' ? ['overview'] : ['overview', activeSectionId.value]
}

function onSelectNav(item: SideNavItem) {
  openSection(item.id)
}

function onActivitySelect(item: ActivityBarItem) {
  if (item.id === 'inspector') {
    toggleRightPanel()
    return
  }
  const next = item.id as 'catalog' | 'search' | 'settings'
  const fromIdx = activityOrder.indexOf(activitySection.value)
  const toIdx = activityOrder.indexOf(next)
  if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
    activityDir.value = toIdx > fromIdx ? 'next' : 'prev'
  }
  if (isPhone.value) {
    activitySection.value = next
    mobileDrawerOpen.value = true
    return
  }
  if (isDual.value) {
    if (activitySection.value === next && dualSide.value === 'left') dualSide.value = 'none'
    else {
      activitySection.value = next
      dualSide.value = 'left'
    }
    return
  }
  if (activitySection.value === next && leftVisible.value) leftVisible.value = false
  else {
    activitySection.value = next
    leftVisible.value = true
  }
}

function toggleLeftPanel() {
  if (isPhone.value) {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
    return
  }
  if (isDual.value) {
    dualSide.value = dualSide.value === 'left' ? 'none' : 'left'
    return
  }
  leftVisible.value = !leftVisible.value
}

function toggleRightPanel() {
  if (isDual.value) {
    dualSide.value = dualSide.value === 'right' ? 'none' : 'right'
    return
  }
  rightVisible.value = !rightVisible.value
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    if (e.shiftKey) toggleRightPanel()
    else toggleLeftPanel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <!-- MOBILE WORKBENCH DEMO SHELL -->
  <VlPushDrawer v-if="isPhone" v-model:open="mobileDrawerOpen">
    <template #drawer>
      <VlActivityBar
        :items="topActivityItems"
        :bottom-items="bottomActivityItems"
        :model-value="activitySection"
        mobile
        @select="onActivitySelect"
      />
      <div class="drawer-body">
        <Transition :name="sidebarTransition" mode="out-in">
          <VlPanel v-if="activitySection === 'catalog'" key="mobile-catalog" title="组件与规范目录" badge="DEMO" padded>
            <VlSideNav :groups="navGroups" :active-id="activeSectionId" @select="onSelectNav" />
          </VlPanel>
          <VlPanel v-else-if="activitySection === 'search'" key="mobile-search" title="搜索演示模块" badge="SEARCH" padded>
            <VlInput v-model="searchQuery" shape="pill" prefix-icon="search" clearable placeholder="搜索模块…" />
            <div class="search-list">
              <button
                v-for="item in filteredSearch"
                :key="item.id"
                type="button"
                class="search-row shape-rect"
                :class="{ active: item.id === activeSectionId }"
                @click="openSection(item.id)"
              >
                <strong>{{ item.title }}</strong>
                <small>{{ item.summary }}</small>
              </button>
            </div>
          </VlPanel>
          <VlPanel v-else key="mobile-settings" title="外观设置" badge="THEME" padded>
            <div class="setting-stack">
              <VlSegmentedControl
                :model-value="themePreference"
                :options="themeOpts"
                variant="morph-grid"
                :columns="3"
                @select="(v, e) => setThemePreference(v, e)"
              />
              <VlSegmentedControl
                :model-value="accentScheme"
                :options="accentOpts"
                variant="morph-grid"
                :columns="2"
                @select="(v, e) => setAccentScheme(v, e)"
              />

              <div class="set-lbl" style="margin-top: 8px">配色方案与莫奈 / Pride</div>
              <VlPalettePicker compact />
            </div>
          </VlPanel>
        </Transition>
      </div>
    </template>

    <VlTitleBar
      mode="mobile"
      brand-name="VALENCE UI"
      :center-text="activeSection.title"
      center-active
      :left-active="mobileDrawerOpen"
      :right-active="mobileDockDetent !== 'docked'"
      right-title="展开快捷设置面板"
      @toggle-left="toggleLeftPanel"
      @toggle-right="mobileDockDetent = mobileDockDetent === 'docked' ? 'half' : 'docked'"
    >
      <template #right>
        <VlIconButton
          :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
          morph-on-hover
          title="切换明暗模式"
          @click="toggleTheme($event)"
        />
      </template>
    </VlTitleBar>

    <div class="mobile-stage">
      <VlScrollArea class="center-scroll">
        <div class="mobile-slide-stage">
          <Transition :name="mobileDockTransition">
            <div :key="activeSectionId" class="center-pad mobile">
              <OverviewView v-if="activeSectionId === 'overview'" @navigate="openSection" />
              <ColorsView v-else-if="activeSectionId === 'colors'" />
              <ShapesView v-else-if="activeSectionId === 'shapes'" />
              <TypographyMotionView v-else-if="activeSectionId === 'motion'" />
              <IconsView v-else-if="activeSectionId === 'icons'" />
              <ButtonsView v-else-if="activeSectionId === 'buttons'" />
              <FormsView v-else-if="activeSectionId === 'forms'" />
              <NavigationView v-else-if="activeSectionId === 'navigation'" />
              <LayoutGesturesView v-else-if="activeSectionId === 'gestures'" />
              <OverlaysFeedbackView v-else-if="activeSectionId === 'overlays'" />
              <DataDisplayView v-else />
            </div>
          </Transition>
        </div>
      </VlScrollArea>

      <VlDockSheet
        v-model:detent="mobileDockDetent"
        :nav-items="mobileDockItems"
        :active-nav="activeMobileDockId"
        :title="activeSection.title"
        :badge="activePalette.name"
        icon="compass"
        @update:active-nav="openSection"
      >
        <div class="setting-stack" style="padding: 12px">
          <VlPalettePicker compact />
        </div>
      </VlDockSheet>
    </div>
  </VlPushDrawer>

  <!-- DESKTOP / DUAL-PANE WORKBENCH DEMO SHELL -->
  <div v-else class="demo-shell shape-rect">
    <VlTitleBar
      :mode="isDual ? 'tablet' : 'desktop'"
      brand-name="VALENCE UI"
      brand-tag="COMPONENT SHOWCASE"
      :center-text="`${activeSection.subtitle} / ${activeSection.title}`"
      center-active
      :left-active="leftShown"
      :right-active="rightShown"
      @toggle-left="toggleLeftPanel"
      @toggle-right="toggleRightPanel"
    >
      <template #right>
        <VlIconButton
          :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
          size="sm"
          morph-on-hover
          title="切换明暗模式"
          @click="toggleTheme($event)"
        />
        <VlIconButton
          icon="palette"
          size="sm"
          :tone="accentScheme === 'swapped' ? 'secondary' : 'primary'"
          :active="accentScheme === 'swapped'"
          title="对调主辅主题色"
          @click="toggleAccent($event)"
        />
        <VlIconButton
          icon="panel-left"
          size="sm"
          tone="primary"
          :active="leftShown"
          title="显示/隐藏左侧目录 (Ctrl+B)"
          @click="toggleLeftPanel"
        />
        <VlIconButton
          icon="panel-right"
          size="sm"
          tone="secondary"
          :active="rightShown"
          title="显示/隐藏右侧检查器 (Ctrl+Shift+B)"
          @click="toggleRightPanel"
        />
      </template>
    </VlTitleBar>

    <VlSplitPane
      v-model:left-width="leftWidth"
      v-model:right-width="rightWidth"
      v-model:dual-side-ratio="dualSideRatio"
      :left-visible="leftShown"
      :right-visible="rightShown"
      :dual-mode="isDual"
    >
      <template #activity>
        <VlActivityBar
          :items="topActivityItems"
          :bottom-items="bottomActivityItems"
          :model-value="activitySection"
          :active-visible="leftShown"
          @select="onActivitySelect"
        />
      </template>

      <template #left>
        <Transition :name="sidebarTransition" mode="out-in">
          <VlPanel v-if="activitySection === 'catalog'" key="left-catalog" title="组件与规范目录" badge="11 MODULES" padded>
            <VlSideNav :groups="navGroups" :active-id="activeSectionId" @select="onSelectNav" />
          </VlPanel>

          <VlPanel v-else-if="activitySection === 'search'" key="left-search" title="搜索模块" badge="SEARCH" padded>
            <VlInput v-model="searchQuery" shape="pill" prefix-icon="search" clearable placeholder="筛选组件或主题…" />
            <div class="search-list">
              <button
                v-for="item in filteredSearch"
                :key="item.id"
                type="button"
                class="search-row shape-rect"
                :class="{ active: item.id === activeSectionId }"
                @click="openSection(item.id)"
              >
                <strong>{{ item.title }}</strong>
                <small>{{ item.summary }}</small>
              </button>
            </div>
          </VlPanel>

          <VlPanel v-else key="left-settings" title="外观与主题配置" badge="TOKENS" padded>
            <div class="setting-stack">
              <div class="set-lbl">外观模式</div>
              <VlSegmentedControl
                :model-value="themePreference"
                :options="themeOpts"
                variant="morph-grid"
                :columns="3"
                @select="(v, e) => setThemePreference(v, e)"
              />

              <div class="set-lbl" style="margin-top: 8px">主辅色对调</div>
              <VlSegmentedControl
                :model-value="accentScheme"
                :options="accentOpts"
                variant="morph-grid"
                :columns="2"
                @select="(v, e) => setAccentScheme(v, e)"
              />

              <div class="set-lbl" style="margin-top: 8px">配色方案与莫奈 / Pride</div>
              <VlPalettePicker compact />
            </div>
          </VlPanel>
        </Transition>
      </template>

      <template #center>
        <VlTabBar
          :tabs="openTabs"
          :active-id="activeSectionId"
          @select="openSection"
          @close="closeTab"
        >
          <template v-if="openTabs.length > 1" #actions>
            <VlButton size="xs" shape="pill" @click="closeOtherTabs">清理标签</VlButton>
          </template>
        </VlTabBar>

        <VlBreadcrumb
          :items="[
            { label: 'ValanceUI', to: 'overview' },
            { label: activeSection.group },
            { label: activeSection.title, active: true },
          ]"
          @navigate="(item) => item.to && openSection(item.to)"
        >
          <template #trailing>
            <VlBadge tone="secondary" size="xs">{{ activeSection.subtitle }}</VlBadge>
          </template>
        </VlBreadcrumb>

        <VlScrollArea class="center-scroll">
          <div class="center-pad">
            <Transition :name="desktopViewTransition" mode="out-in">
              <OverviewView v-if="activeSectionId === 'overview'" key="overview" @navigate="openSection" />
              <ColorsView v-else-if="activeSectionId === 'colors'" key="colors" />
              <ShapesView v-else-if="activeSectionId === 'shapes'" key="shapes" />
              <TypographyMotionView v-else-if="activeSectionId === 'motion'" key="motion" />
              <IconsView v-else-if="activeSectionId === 'icons'" key="icons" />
              <ButtonsView v-else-if="activeSectionId === 'buttons'" key="buttons" />
              <FormsView v-else-if="activeSectionId === 'forms'" key="forms" />
              <NavigationView v-else-if="activeSectionId === 'navigation'" key="navigation" />
              <LayoutGesturesView v-else-if="activeSectionId === 'gestures'" key="gestures" />
              <OverlaysFeedbackView v-else-if="activeSectionId === 'overlays'" key="overlays" />
              <DataDisplayView v-else key="data" />
            </Transition>
          </div>
        </VlScrollArea>
      </template>

      <template #right>
        <VlPanel title="实时设计检查器" badge="LIVE SPEC" header-border padded>
          <div class="insp-stack">
            <VlCard title="当前视图模块" accent-side="left" accent-tone="primary" surface="elevated" padding="sm">
              <div class="insp-kv">
                <span>模块 ID</span>
                <code>{{ activeSection.id }}</code>
              </div>
              <div class="insp-kv">
                <span>所属分组</span>
                <strong>{{ activeSection.group }}</strong>
              </div>
              <p class="insp-desc">{{ activeSection.summary }}</p>
            </VlCard>

            <VlCard title="当前主题状态" accent-side="left" accent-tone="secondary" surface="elevated" padding="sm">
              <div class="insp-kv">
                <span>明暗模式</span>
                <code>{{ resolvedTheme }}</code>
              </div>
              <div class="insp-kv">
                <span>配色方案</span>
                <code>{{ activePalette.name }}</code>
              </div>
              <div class="insp-kv">
                <span>强调方案</span>
                <code>{{ accentScheme }}</code>
              </div>
              <div class="insp-kv">
                <span>已打开标签</span>
                <strong>{{ openTabs.length }} 个</strong>
              </div>
            </VlCard>

            <VlButton variant="primary" icon="gesture" block @click="openSection('gestures')">
              前往手势 & Dock 实验室
            </VlButton>
          </div>
        </VlPanel>
      </template>
    </VlSplitPane>

    <VlStatusBar brand="VALENCE UI">
      <template #left>
        <VlBadge tone="secondary" size="xs">v1.0.0</VlBadge>
        <span>@valance-ui/vue</span>
        <span class="st-muted">{{ openTabs.length }} 个标签页</span>
      </template>
      <template #right>
        <VlBadge tone="primary" size="xs">{{ activeSection.subtitle }}</VlBadge>
        <span>{{ resolvedTheme === 'light' ? `亮色 ${activeLightBgHex}` : `暗色 ${activeDarkBgHex}` }}</span>
      </template>
    </VlStatusBar>
  </div>

  <VlCommandPalette
    v-model:open="cmdPaletteOpen"
    :items="commandItems"
    enable-hotkey
    @select="(item) => openSection(item.id)"
  />
  <VlToast />
</template>

<style scoped>
.demo-shell {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-base);
}

.drawer-body {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.mobile-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-slide-stage {
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
}

.center-scroll {
  flex: 1;
  min-height: 0;
}

.center-pad {
  max-width: 1060px;
  margin: 0 auto;
  padding: 20px 24px 64px 24px;
}

.center-pad.mobile {
  padding: 14px 14px calc(144px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px))) 14px;
}

.search-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.search-row {
  padding: 9px 10px;
  text-align: left;
  background-color: var(--bg-elevated);
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.search-row:hover {
  background-color: var(--bg-hover);
}

.search-row.active {
  background-color: var(--accent-primary-soft);
  border-left-color: var(--accent-primary);
}

.search-row strong {
  font-size: var(--ui-font-md);
  color: var(--text-primary);
}

.search-row small {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
}

.setting-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.set-lbl {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.insp-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insp-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  padding: 3px 0;
}

.insp-kv code {
  font-family: var(--font-mono);
  color: var(--accent-primary-text);
  font-weight: 700;
}

.insp-desc {
  margin: 6px 0 0 0;
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  line-height: 1.55;
}

.st-muted {
  color: var(--text-muted);
}
</style>
