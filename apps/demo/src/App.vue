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
  VlSnapPager,
  VlSplitPane,
  VlStatusBar,
  VlTabBar,
  VlTitleBar,
  VlToast,
  VlCommandPalette,
  getLocalizedPaletteName,
  useThemeMode,
  useViewportTier,
  type ActivityBarItem,
  type BottomDockItem,
  type CommandPaletteItem,
  type DockSheetDetent,
  type LocalePreference,
  type SegmentOption,
  type SideNavItem,
  type TabBarItem,
  type ThemePreference,
  type AccentScheme,
} from '@valance-ui/vue'
import { useDemoI18n } from './i18n'
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
  t,
  locale,
  localePreference,
  localeOptions,
  setLocale,
  cycleLocale,
  localizedSections,
  getLocalizedNavGroups,
} = useDemoI18n()

const localeSegOpts = computed<SegmentOption<LocalePreference>[]>(() =>
  localeOptions.value.map((opt) => ({ value: opt.value, label: opt.label })),
)

const activeLocaleDisplayLabel = computed(
  () => localeOptions.value.find((opt) => opt.value === localePreference.value)?.label ?? locale.value,
)

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
const mobileSlideDirection = computed<'next' | 'prev'>(() =>
  mobileDockDir.value === 'left' ? 'next' : 'prev',
)
// Preset 3 (Vertical): Slide + fade for desktop workbench sidebar view switching
const desktopViewTransition = computed(() =>
  desktopViewDir.value === 'next' ? 'vl-slide-fade-v-next' : 'vl-slide-fade-v-prev',
)
const activeMobileDockId = computed(() =>
  mobileDockItems.value.some((item) => item.id === activeSectionId.value) ? activeSectionId.value : 'overview',
)

const leftShown = computed(() => (isDual.value ? dualSide.value === 'left' : leftVisible.value))
const rightShown = computed(() => (isDual.value ? dualSide.value === 'right' : rightVisible.value))

const openIds = ref<string[]>(['overview', 'gestures', 'buttons'])
const activeSectionId = ref('overview')
const searchQuery = ref('')
const cmdPaletteOpen = ref(false)
const commandItems = computed<CommandPaletteItem[]>(() =>
  localizedSections.value.map((s) => ({
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
  () => localizedSections.value.find((s) => s.id === activeSectionId.value) ?? localizedSections.value[0]!,
)

const openTabs = computed<TabBarItem[]>(() =>
  openIds.value
    .map((id) => localizedSections.value.find((s) => s.id === id))
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

const navGroups = computed(() => getLocalizedNavGroups(new Set(openIds.value)))

const filteredSearch = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return localizedSections.value
  return localizedSections.value.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q),
  )
})

const topActivityItems = computed<ActivityBarItem[]>(() => [
  { id: 'catalog', icon: 'files', label: t.value.app.activity.catalog },
  { id: 'search', icon: 'search', label: t.value.app.activity.search },
])

const bottomActivityItems = computed<ActivityBarItem[]>(() => [
  ...(!isPhone.value
    ? [{ id: 'inspector', icon: 'sliders' as const, label: t.value.app.activity.inspector, tone: 'secondary' as const, active: rightShown.value }]
    : []),
  { id: 'settings', icon: 'settings', label: t.value.app.activity.settings },
])

const mobileDockItems = computed<BottomDockItem[]>(() => [
  { id: 'overview', label: t.value.app.mobileDock.overview, icon: 'compass' },
  { id: 'gestures', label: t.value.app.mobileDock.gestures, icon: 'gesture' },
  { id: 'buttons', label: t.value.app.mobileDock.buttons, icon: 'plus' },
])

const themeOpts = computed<SegmentOption<ThemePreference>[]>(() => [
  { value: 'system', label: t.value.app.themeOptions.system },
  { value: 'light', label: t.value.app.themeOptions.light },
  { value: 'dark', label: t.value.app.themeOptions.dark },
])

const accentOpts = computed<SegmentOption<AccentScheme>[]>(() => [
  { value: 'default', label: t.value.app.accentOptions.default },
  { value: 'swapped', label: t.value.app.accentOptions.swapped },
])

function openSection(id: string) {
  const fromSecIdx = localizedSections.value.findIndex((s) => s.id === activeSectionId.value)
  const toSecIdx = localizedSections.value.findIndex((s) => s.id === id)
  if (fromSecIdx !== -1 && toSecIdx !== -1 && fromSecIdx !== toSecIdx) {
    desktopViewDir.value = toSecIdx > fromSecIdx ? 'next' : 'prev'
  }
  const fromDockIdx = mobileDockItems.value.findIndex((d) => d.id === activeSectionId.value)
  const toDockIdx = mobileDockItems.value.findIndex((d) => d.id === id)
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
          <VlPanel v-if="activitySection === 'catalog'" key="mobile-catalog" :title="t.app.panels.mobileCatalogTitle" badge="DEMO" padded>
            <VlSideNav :groups="navGroups" :active-id="activeSectionId" @select="onSelectNav" />
          </VlPanel>
          <VlPanel v-else-if="activitySection === 'search'" key="mobile-search" :title="t.app.panels.mobileSearchTitle" badge="SEARCH" padded>
            <VlInput v-model="searchQuery" shape="pill" prefix-icon="search" clearable :placeholder="t.app.panels.mobileSearchPlaceholder" />
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
          <VlPanel v-else key="mobile-settings" :title="t.app.panels.mobileSettingsTitle" badge="THEME" padded>
            <div class="setting-stack">
              <div class="set-lbl">{{ t.app.panels.languageSectionTitle }}</div>
              <VlSegmentedControl
                :model-value="localePreference"
                :options="localeSegOpts"
                variant="morph-grid"
                :columns="2"
                @update:model-value="setLocale($event)"
              />

              <div class="set-lbl" style="margin-top: 8px">{{ t.app.panels.appearanceModeTitle }}</div>
              <VlSegmentedControl
                :model-value="themePreference"
                :options="themeOpts"
                variant="morph-grid"
                :columns="3"
                @select="(v, e) => setThemePreference(v, e)"
              />
              <div class="set-lbl" style="margin-top: 8px">{{ t.app.panels.accentSwapTitle }}</div>
              <VlSegmentedControl
                :model-value="accentScheme"
                :options="accentOpts"
                variant="morph-grid"
                :columns="2"
                @select="(v, e) => setAccentScheme(v, e)"
              />

              <div class="set-lbl" style="margin-top: 8px">{{ t.app.panels.paletteSectionTitle }}</div>
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
      :right-title="t.app.actions.expandQuickSettings"
      @toggle-left="toggleLeftPanel"
      @toggle-right="mobileDockDetent = mobileDockDetent === 'docked' ? 'half' : 'docked'"
    >
      <template #right>
        <VlIconButton
          icon="globe"
          morph-on-hover
          :title="`${t.app.actions.cycleLocale} (${locale})`"
          @click="cycleLocale(false)"
        />
        <VlIconButton
          :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
          morph-on-hover
          :title="t.app.actions.toggleTheme"
          @click="toggleTheme($event)"
        />
      </template>
    </VlTitleBar>

    <div class="mobile-stage">
      <VlSnapPager
        class="center-scroll"
        :model-value="activeSectionId"
        :pages="['overview', 'gestures', 'buttons']"
        :direction="mobileSlideDirection"
        transition="fade"
        :aria-label="t.app.panels.mobilePagerAria"
      >
        <template #default="{ pageId }">
          <VlScrollArea class="center-scroll">
            <div class="center-pad mobile">
              <OverviewView v-if="pageId === 'overview'" @navigate="openSection" />
              <ColorsView v-else-if="pageId === 'colors'" />
              <ShapesView v-else-if="pageId === 'shapes'" />
              <TypographyMotionView v-else-if="pageId === 'motion'" />
              <IconsView v-else-if="pageId === 'icons'" />
              <ButtonsView v-else-if="pageId === 'buttons'" />
              <FormsView v-else-if="pageId === 'forms'" />
              <NavigationView v-else-if="pageId === 'navigation'" />
              <LayoutGesturesView v-else-if="pageId === 'gestures'" />
              <OverlaysFeedbackView v-else-if="pageId === 'overlays'" />
              <DataDisplayView v-else />
            </div>
          </VlScrollArea>
        </template>
      </VlSnapPager>

      <VlDockSheet
        v-model:detent="mobileDockDetent"
        :nav-items="mobileDockItems"
        :active-nav="activeMobileDockId"
        :title="activeSection.title"
        :badge="getLocalizedPaletteName(activePalette.id, activePalette.name)"
        icon="compass"
        @update:active-nav="openSection"
      >
        <div class="setting-stack" style="padding: 12px">
          <VlSegmentedControl
            :model-value="localePreference"
            :options="localeSegOpts"
            variant="morph-grid"
            :columns="2"
            @update:model-value="setLocale($event)"
          />
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
          icon="globe"
          size="sm"
          morph-on-hover
          :title="`${t.app.actions.cycleLocale} (${locale})`"
          @click="cycleLocale(false)"
        />
        <VlIconButton
          :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
          size="sm"
          morph-on-hover
          :title="t.app.actions.toggleTheme"
          @click="toggleTheme($event)"
        />
        <VlIconButton
          icon="palette"
          size="sm"
          :tone="accentScheme === 'swapped' ? 'secondary' : 'primary'"
          :active="accentScheme === 'swapped'"
          :title="t.app.actions.swapAccent"
          @click="toggleAccent($event)"
        />
        <VlIconButton
          icon="panel-left"
          size="sm"
          tone="primary"
          :active="leftShown"
          :title="t.app.actions.toggleLeftSidebar"
          @click="toggleLeftPanel"
        />
        <VlIconButton
          icon="panel-right"
          size="sm"
          tone="secondary"
          :active="rightShown"
          :title="t.app.actions.toggleRightInspector"
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
          <VlPanel v-if="activitySection === 'catalog'" key="left-catalog" :title="t.app.panels.leftCatalogTitle" :badge="t.app.panels.leftCatalogBadge" padded>
            <VlSideNav :groups="navGroups" :active-id="activeSectionId" @select="onSelectNav" />
          </VlPanel>

          <VlPanel v-else-if="activitySection === 'search'" key="left-search" :title="t.app.panels.leftSearchTitle" badge="SEARCH" padded>
            <VlInput v-model="searchQuery" shape="pill" prefix-icon="search" clearable :placeholder="t.app.panels.leftSearchPlaceholder" />
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

          <VlPanel v-else key="left-settings" :title="t.app.panels.leftSettingsTitle" badge="TOKENS" padded>
            <div class="setting-stack">
              <div class="set-lbl">{{ t.app.panels.languageSectionTitle }}</div>
              <VlSegmentedControl
                :model-value="localePreference"
                :options="localeSegOpts"
                variant="morph-grid"
                :columns="2"
                @update:model-value="setLocale($event)"
              />

              <div class="set-lbl" style="margin-top: 8px">{{ t.app.panels.appearanceModeTitle }}</div>
              <VlSegmentedControl
                :model-value="themePreference"
                :options="themeOpts"
                variant="morph-grid"
                :columns="3"
                @select="(v, e) => setThemePreference(v, e)"
              />

              <div class="set-lbl" style="margin-top: 8px">{{ t.app.panels.accentSwapTitle }}</div>
              <VlSegmentedControl
                :model-value="accentScheme"
                :options="accentOpts"
                variant="morph-grid"
                :columns="2"
                @select="(v, e) => setAccentScheme(v, e)"
              />

              <div class="set-lbl" style="margin-top: 8px">{{ t.app.panels.paletteSectionTitle }}</div>
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
            <VlButton size="xs" shape="pill" @click="closeOtherTabs">{{ t.app.actions.cleanTabs }}</VlButton>
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
        <VlPanel :title="t.app.inspector.panelTitle" badge="LIVE SPEC" header-border padded>
          <div class="insp-stack">
            <VlCard :title="t.app.inspector.currentModuleCard" accent-side="left" accent-tone="primary" surface="elevated" padding="sm">
              <div class="insp-kv">
                <span>{{ t.app.inspector.moduleId }}</span>
                <code>{{ activeSection.id }}</code>
              </div>
              <div class="insp-kv">
                <span>{{ t.app.inspector.moduleGroup }}</span>
                <strong>{{ activeSection.group }}</strong>
              </div>
              <p class="insp-desc">{{ activeSection.summary }}</p>
            </VlCard>

            <VlCard :title="t.app.inspector.themeStateCard" accent-side="left" accent-tone="secondary" surface="elevated" padding="sm">
              <div class="insp-kv">
                <span>{{ t.app.inspector.themeMode }}</span>
                <code>{{ resolvedTheme }}</code>
              </div>
              <div class="insp-kv">
                <span>{{ t.app.inspector.palette }}</span>
                <code>{{ getLocalizedPaletteName(activePalette.id, activePalette.name) }}</code>
              </div>
              <div class="insp-kv">
                <span>{{ t.app.inspector.accentScheme }}</span>
                <code>{{ accentScheme }}</code>
              </div>
              <div class="insp-kv">
                <span>{{ t.app.inspector.language }}</span>
                <code>{{ activeLocaleDisplayLabel }} ({{ locale }})</code>
              </div>
              <div class="insp-kv">
                <span>{{ t.app.inspector.openTabs }}</span>
                <strong>{{ t.app.inspector.tabCountUnit(openTabs.length) }}</strong>
              </div>
            </VlCard>

            <VlButton variant="primary" icon="gesture" block @click="openSection('gestures')">
              {{ t.app.actions.goGesturesLab }}
            </VlButton>
          </div>
        </VlPanel>
      </template>
    </VlSplitPane>

    <VlStatusBar brand="VALENCE UI">
      <template #left>
        <VlBadge tone="secondary" size="xs">v1.0.0</VlBadge>
        <span>@valance-ui/vue</span>
        <span class="st-muted">{{ t.app.statusBar.tabsCount(openTabs.length) }}</span>
      </template>
      <template #right>
        <VlBadge tone="primary" size="xs">{{ activeSection.subtitle }}</VlBadge>
        <span>{{ t.app.statusBar.themeLabel(resolvedTheme, resolvedTheme === 'light' ? activeLightBgHex : activeDarkBgHex) }}</span>
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
