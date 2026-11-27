<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  VlActivityBar,
  VlBottomDock,
  VlNavRail,
  VlBreadcrumb,
  VlButton,
  VlCard,
  VlPagination,
  VlSideNav,
  VlStatusBar,
  VlSwitch,
  VlTabBar,
  VlTabs,
  VlTitleBar,
  VlBadge,
  type ActivityBarItem,
  type BottomDockItem,
  type NavRailItem,
  type SideNavGroup,
  type TabBarItem,
  type TabOption,
} from '@valance-ui/vue'
import { VlSteps, type StepItem } from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()

const actActive = ref('explorer')
const actExpanded = ref(false)
const actTopItems = computed<ActivityBarItem[]>(() => [
  { id: 'explorer', icon: 'files', label: t.value.navigation.actTop.explorer },
  { id: 'search', icon: 'search', label: t.value.navigation.actTop.search, badge: 3 },
  { id: 'plans', icon: 'calendar', label: t.value.navigation.actTop.plans },
])
const actCenterItems = computed<ActivityBarItem[]>(() => [
  { id: 'lab', icon: 'flask', label: t.value.navigation.actCenter.lab },
  { id: 'clock', icon: 'clock', label: t.value.navigation.actCenter.clock },
])
const actBottomItems = computed<ActivityBarItem[]>(() => [
  { id: 'comment', icon: 'comment', label: t.value.navigation.actBottom.comment, tone: 'secondary', active: true },
  { id: 'settings', icon: 'settings', label: t.value.navigation.actBottom.settings },
])

const sideActive = ref('ch1-s2')
const sideGroups = computed<SideNavGroup[]>(() => [
  {
    id: 'ch0',
    label: t.value.navigation.sideGroups.ch0.label,
    badge: 'v2.1',
    meta: t.value.navigation.sideGroups.ch0.meta,
    defaultOpen: true,
    items: [
      { id: 'ch0-s1', label: t.value.navigation.sideGroups.ch0.s1, icon: 'doc', openDot: true, meta: '3.2k' },
      { id: 'ch0-full', label: t.value.navigation.sideGroups.ch0.full, icon: 'book', tone: 'secondary', meta: '12k' },
    ],
  },
  {
    id: 'ch1',
    label: t.value.navigation.sideGroups.ch1.label,
    badge: 'v1.4',
    meta: t.value.navigation.sideGroups.ch1.meta,
    defaultOpen: true,
    items: [
      { id: 'ch1-s1', label: t.value.navigation.sideGroups.ch1.s1, icon: 'doc', meta: '4.1k' },
      { id: 'ch1-s2', label: t.value.navigation.sideGroups.ch1.s2, icon: 'doc', openDot: true, meta: '5.6k' },
    ],
  },
])

const dockCapsuleTab = ref('curve')
const dockBarTab = ref('home')
const railCapsuleTab = ref('curve')
const railBarTab = ref('home')
const capsuleItems = computed<BottomDockItem[]>(() => [
  { id: 'curve', label: t.value.navigation.dockItems.curve, icon: 'curve' },
  { id: 'records', label: t.value.navigation.dockItems.records, icon: 'clock', badge: 4 },
  { id: 'calibration', label: t.value.navigation.dockItems.calibration, icon: 'biotech' },
])
const railCapsuleItems = computed<NavRailItem[]>(() => capsuleItems.value)
const barItems = computed<BottomDockItem[]>(() => [
  { id: 'home', label: t.value.navigation.barItems.home, icon: 'home' },
  { id: 'explore', label: t.value.navigation.barItems.explore, icon: 'compass' },
  { id: 'archive', label: t.value.navigation.barItems.archive, icon: 'archive' },
  { id: 'user', label: t.value.navigation.barItems.user, icon: 'user' },
])
const railBarItems = computed<NavRailItem[]>(() => barItems.value)

const demoTabs = ref<TabBarItem[]>([
  { id: 'curve', title: t.value.navigation.initialTabs.curve, subtitle: 'PK', icon: 'curve', pinned: true },
  { id: 'ev', title: 'Estradiol Valerate', subtitle: 'HRT', icon: 'flask', tone: 'secondary' },
  { id: 'plan', title: t.value.navigation.initialTabs.plan, subtitle: 'PLAN', icon: 'calendar', tone: 'secondary' },
])
watch(t, (nextT) => {
  demoTabs.value = demoTabs.value.map((tab) => {
    if (tab.id === 'curve') return { ...tab, title: nextT.navigation.initialTabs.curve }
    if (tab.id === 'plan') return { ...tab, title: nextT.navigation.initialTabs.plan }
    return tab
  })
})
const activeTabId = ref('curve')
let tabSeq = 1

function addDemoTab() {
  const id = `doc-${tabSeq++}`
  demoTabs.value.push({
    id,
    title: t.value.navigation.newTabTitle(tabSeq - 1),
    subtitle: 'DOC',
    icon: 'doc',
  })
  activeTabId.value = id
}

function closeDemoTab(id: string) {
  demoTabs.value = demoTabs.value.filter((item) => item.id !== id)
  if (activeTabId.value === id) {
    activeTabId.value = demoTabs.value[0]?.id ?? ''
  }
}

const subTab = ref('calibration')
const subTabItems = computed<TabOption<'calibration' | 'inspector' | 'logs'>[]>(() => [
  { value: 'calibration', label: t.value.navigation.subTabs.calibration, icon: 'biotech', badge: 2 },
  { value: 'inspector', label: t.value.navigation.subTabs.inspector, icon: 'sliders' },
  { value: 'logs', label: t.value.navigation.subTabs.logs, icon: 'terminal' },
])

const currentPage = ref(3)
const currentStep = ref(1)
const demoSteps = computed<StepItem[]>(() => [
  { id: 1, title: t.value.navigation.steps.step1Title, description: t.value.navigation.steps.step1Desc },
  { id: 2, title: t.value.navigation.steps.step2Title, description: t.value.navigation.steps.step2Desc },
  { id: 3, title: t.value.navigation.steps.step3Title, description: t.value.navigation.steps.step3Desc },
])
</script>

<template>
  <div class="demo-view">
    <!-- 1. Two Distinct Side Navigation Paradigms: Workbench ActivityBar vs Vertical Gesture NavRail -->
    <div class="two-col">
      <VlCard :title="t.navigation.actCardTitle" :subtitle="t.navigation.actCardSubtitle" accent-side="left" accent-tone="primary">
        <template #extra>
          <VlSwitch v-model="actExpanded" size="sm" :label="t.navigation.actExpandSwitch" />
        </template>

        <div class="rail-stage shape-rect">
          <VlActivityBar
            v-model="actActive"
            :items="actTopItems"
            :center-items="actCenterItems"
            :bottom-items="actBottomItems"
            :expanded="actExpanded"
          />
          <div class="rail-preview">
            <strong>{{ t.navigation.actCurrentSection(actActive) }}</strong>
            <p>{{ t.navigation.actCardBody }}</p>
          </div>
        </div>
      </VlCard>

      <VlCard :title="t.navigation.sideCardTitle" :subtitle="t.navigation.sideCardSubtitle" accent-side="left" accent-tone="secondary">
        <div class="sidenav-stage shape-rect">
          <VlSideNav
            :groups="sideGroups"
            :active-id="sideActive"
            @select="sideActive = $event.id"
          />
        </div>
      </VlCard>
    </div>

    <!-- 1b. Vertical Gesture Navigation Rail (Floating Capsule vs Flush Fixed Bar) -->
    <VlCard :title="t.navigation.railCardTitle" :subtitle="t.navigation.railCardSubtitle" accent-side="left" accent-tone="secondary">
      <div class="two-col">
        <div class="vrail-frame shape-rect">
          <VlNavRail v-model="railCapsuleTab" :items="railCapsuleItems" variant="capsule" contained />
          <div class="rail-preview">
            <strong>{{ t.navigation.railCapsuleTitle }}</strong>
            <p>{{ t.navigation.railCapsuleDesc }}</p>
            <VlBadge tone="primary">{{ t.navigation.selectedBadge(railCapsuleTab) }}</VlBadge>
          </div>
        </div>

        <div class="vrail-frame shape-rect">
          <VlNavRail v-model="railBarTab" :items="railBarItems" variant="bar" contained />
          <div class="rail-preview">
            <strong>{{ t.navigation.railBarTitle }}</strong>
            <p>{{ t.navigation.railBarDesc }}</p>
            <VlBadge tone="secondary">{{ t.navigation.selectedBadge(railBarTab) }}</VlBadge>
          </div>
        </div>
      </div>
    </VlCard>

    <!-- 2. Bottom Navigation Bars (Both Variants) -->
    <VlCard :title="t.navigation.dockCardTitle" accent-side="top" accent-tone="primary">
      <div class="two-col">
        <div class="dock-frame shape-rect">
          <div class="dock-frame-body">
            <strong>{{ t.navigation.dockCapsuleTitle }}</strong>
            <p>{{ t.navigation.dockCapsuleDesc }}</p>
            <VlBadge tone="primary">{{ t.navigation.selectedBadge(dockCapsuleTab) }}</VlBadge>
          </div>
          <VlBottomDock v-model="dockCapsuleTab" :items="capsuleItems" variant="capsule" contained />
        </div>

        <div class="dock-frame shape-rect">
          <div class="dock-frame-body">
            <strong>{{ t.navigation.dockBarTitle }}</strong>
            <p>{{ t.navigation.dockBarDesc }}</p>
            <VlBadge tone="secondary">{{ t.navigation.selectedBadge(dockBarTab) }}</VlBadge>
          </div>
          <VlBottomDock v-model="dockBarTab" :items="barItems" variant="bar" contained />
        </div>
      </div>
    </VlCard>

    <!-- 3. TabBar, Tabs, Breadcrumb, Pagination -->
    <VlCard :title="t.navigation.tabsCardTitle" accent-side="left" accent-tone="secondary">
      <div class="nav-stack">
        <div class="demo-box shape-rect">
          <VlTabBar
            :tabs="demoTabs"
            :active-id="activeTabId"
            @select="activeTabId = $event"
            @close="closeDemoTab"
          >
            <template #actions>
              <VlButton size="xs" variant="primary" icon="plus" @click="addDemoTab">{{ t.navigation.addTabBtn }}</VlButton>
            </template>
          </VlTabBar>
        </div>

        <div class="demo-box shape-rect">
          <VlTabs v-model="subTab" :items="subTabItems" tone="secondary">
            <template #extra>
              <VlBadge tone="secondary" size="xs">TAB: {{ subTab }}</VlBadge>
            </template>
          </VlTabs>
        </div>

        <div class="demo-box shape-rect">
          <VlBreadcrumb
            :items="[
              { label: 'ValanceUI', to: '/' },
              { label: t.navigation.breadcrumbRoot, to: '/nav' },
              { label: t.navigation.breadcrumbLeaf, active: true },
            ]"
          >
            <template #trailing>
              <VlBadge tone="primary" size="xs">v1.0.0</VlBadge>
            </template>
          </VlBreadcrumb>
        </div>

        <div class="pager-row">
          <VlPagination v-model:page="currentPage" :total-pages="12" />
        </div>
      </div>
    </VlCard>

    <!-- 4. TitleBar & StatusBar -->
    <VlCard :title="t.navigation.titleStatusCardTitle" surface="surface">
      <div class="demo-box shape-rect">
        <VlTitleBar
          brand-name="VALENCE"
          brand-tag="DEMO"
          :center-text="t.navigation.titleBarCenter"
          center-active
          left-active
        />
        <div class="mini-gap" />
        <VlStatusBar brand="VALENCE">
          <template #left>
            <VlBadge tone="secondary" size="xs">v1.0</VlBadge>
            <span>/components/navigation</span>
          </template>
          <template #right>
            <VlBadge tone="primary" size="xs">{{ t.navigation.progressBadge }}</VlBadge>
            <span>100% Flat</span>
          </template>
        </VlStatusBar>
      </div>
    </VlCard>

    <!-- 5. Steps Workflow Progress -->
    <VlCard :title="t.navigation.stepsCardTitle" accent-side="left" accent-tone="primary">
      <template #extra>
        <div style="display: flex; gap: 6px">
          <VlButton size="xs" variant="outline" :disabled="currentStep <= 0" @click="currentStep--">{{ t.navigation.prevStep }}</VlButton>
          <VlButton size="xs" variant="primary" :disabled="currentStep >= demoSteps.length - 1" @click="currentStep++">{{ t.navigation.nextStep }}</VlButton>
        </div>
      </template>

      <div style="display: flex; flex-direction: column; gap: 18px">
        <VlSteps v-model:current="currentStep" :items="demoSteps" clickable />
        <VlSteps v-model:current="currentStep" :items="demoSteps" direction="vertical" tone="secondary" clickable />
      </div>
    </VlCard>
  </div>
</template>

<style scoped>
.demo-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.rail-stage {
  height: 316px;
  display: flex;
  border: 1px solid var(--divider-hairline);
  background-color: var(--bg-base);
  overflow: hidden;
}

.vrail-frame {
  height: 280px;
  display: flex;
  align-items: stretch;
  border: 1px solid var(--divider-hairline);
  background-color: var(--bg-base);
  overflow: visible;
}

.rail-preview {
  flex: 1;
  padding: 16px;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  line-height: 1.65;
}

.rail-preview strong {
  color: var(--text-primary);
}

.sidenav-stage {
  padding: 8px;
  background-color: var(--bg-surface);
  border: 1px solid var(--divider-hairline);
}

.dock-frame {
  position: relative;
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--bg-base);
  border: 1px solid var(--divider-hairline);
  overflow: visible;
}

.dock-frame-body {
  padding: 16px;
  font-size: var(--ui-font-md);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.dock-frame-body strong {
  color: var(--text-primary);
}

.dock-frame-body p {
  margin: 0;
  line-height: 1.55;
}

.nav-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-box {
  border: 1px solid var(--divider-hairline);
  overflow: hidden;
}

.mini-gap {
  height: 24px;
  background-color: var(--bg-base);
}

.pager-row {
  display: flex;
  align-items: center;
  padding-top: 4px;
}
</style>
