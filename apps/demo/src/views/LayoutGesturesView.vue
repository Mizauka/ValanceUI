<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VlActivityBar,
  VlBadge,
  VlBottomDock,
  VlButton,
  VlCard,
  VlDockSheet,
  VlEmptyState,
  VlPullRefresh,
  VlPushDrawer,
  VlScrollArea,
  VlSegmentedControl,
  VlSideNav,
  VlSlider,
  VlSplitPane,
  VlTitleBar,
  useToast,
  type ActivityBarItem,
  type BottomDockItem,
  type DockSheetDetent,
  type DockSheetMorphState,
  type SegmentOption,
  type SideNavGroup,
} from '@valance-ui/vue'
import { useDemoI18n } from '../i18n'

const { t } = useDemoI18n()
const toast = useToast()
const isRefreshing = ref(false)
const refreshCount = ref(0)

function handlePullRefresh() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  setTimeout(() => {
    refreshCount.value++
    isRefreshing.value = false
    toast.success(t.value.gestures.pullToast(refreshCount.value))
  }, 1100)
}

// Lab 1: Bidirectional Push Drawer State (Right-swipe Left Drawer + Left-swipe Right Drawer)
const drawerOpen = ref(false)
const rightDrawerOpen = ref(false)
const drawerWidth = ref(236)
const drawerDragState = ref({ progress: 0, rightProgress: 0, isDragging: false, velocity: 0 })
const drawerAct = ref('files')
const drawerDoc = ref('s1')
const rightInspectorMode = ref('layout')
const rightInspectorOpts = computed<SegmentOption<'layout' | 'tokens'>[]>(() => [
  { value: 'layout', label: t.value.gestures.rightInspectorOpts.layout },
  { value: 'tokens', label: t.value.gestures.rightInspectorOpts.tokens },
])

const drawerActItems = computed<ActivityBarItem[]>(() => [
  { id: 'files', icon: 'files', label: t.value.gestures.drawerActItems.files },
  { id: 'search', icon: 'search', label: t.value.gestures.drawerActItems.search },
])
const drawerActBottom = computed<ActivityBarItem[]>(() => [
  { id: 'settings', icon: 'settings', label: t.value.gestures.drawerActBottom.settings },
])
const drawerGroups = computed<SideNavGroup[]>(() => [
  {
    id: 'ch0',
    label: t.value.gestures.drawerGroup.label,
    badge: 'v2.0',
    defaultOpen: true,
    items: [
      { id: 's1', label: t.value.gestures.drawerGroup.s1, icon: 'doc', openDot: true },
      { id: 's2', label: t.value.gestures.drawerGroup.s2, icon: 'doc' },
      { id: 'full', label: t.value.gestures.drawerGroup.full, icon: 'book', tone: 'secondary' },
    ],
  },
])

// Lab 2: Dock-to-Sheet + Unified Floating Nav State
const dockMode = ref<'unified' | 'unified-flush' | 'floating-only'>('unified')
const dockModeOpts = computed<SegmentOption<'unified' | 'unified-flush' | 'floating-only'>[]>(() => [
  { value: 'unified', label: t.value.gestures.dockModeOpts.unified },
  { value: 'unified-flush', label: t.value.gestures.dockModeOpts.unifiedFlush },
  { value: 'floating-only', label: t.value.gestures.dockModeOpts.floatingOnly },
])
const dockNavItems = computed<BottomDockItem[]>(() => [
  { id: 'read', label: t.value.gestures.dockNavItems.read, icon: 'home' },
  { id: 'archive', label: t.value.gestures.dockNavItems.archive, icon: 'archive' },
  { id: 'about', label: t.value.gestures.dockNavItems.about, icon: 'user' },
])
const dockNavTab = ref('read')
const dockNavDir = ref<'left' | 'right'>('left')
const dockSlideName = computed(() =>
  dockNavDir.value === 'left' ? 'dock-slide-left' : 'dock-slide-right',
)

function switchDockNav(next: string) {
  const fromIdx = dockNavItems.value.findIndex((i) => i.id === dockNavTab.value)
  const toIdx = dockNavItems.value.findIndex((i) => i.id === next)
  dockNavDir.value = toIdx >= fromIdx ? 'left' : 'right'
  dockNavTab.value = next
}

const dockDetent = ref<DockSheetDetent>('docked')
const morphTelemetry = ref<DockSheetMorphState>({
  detent: 'docked',
  height: 113,
  expandRatio: 0,
  morphFactor: 0,
  inset: 14,
  radius: 37,
  isDragging: false,
})

const detentOpts = computed<SegmentOption<DockSheetDetent>[]>(() => [
  { value: 'docked', label: t.value.gestures.detentOpts.docked },
  { value: 'half', label: t.value.gestures.detentOpts.half },
  { value: 'full', label: t.value.gestures.detentOpts.full },
])

// Lab 3: Standalone Bottom Dock Sheet (CatsOnPlains Floating vs Edge-Flush, no bottom nav)
const soloSheetStyle = ref<'floating' | 'flush'>('floating')
const soloSheetStyleOpts = computed<SegmentOption<'floating' | 'flush'>[]>(() => [
  { value: 'floating', label: t.value.gestures.soloStyleOpts.floating },
  { value: 'flush', label: t.value.gestures.soloStyleOpts.flush },
])
const soloSheetDetent = ref<DockSheetDetent>('docked')
const soloTelemetry = ref<DockSheetMorphState>({
  detent: 'docked',
  height: 58,
  expandRatio: 0,
  morphFactor: 0,
  inset: 12,
  radius: 29,
  isDragging: false,
})

// Lab 4: SplitPane State
const splitLeftOpen = ref(true)
const splitRightOpen = ref(true)
const splitLeftW = ref(200)
const splitRightW = ref(190)
</script>

<template>
  <div class="demo-view">
    <div class="labs-grid">
      <!-- LAB 1: Bidirectional Squeeze / Push Drawer + 1:1 Gesture -->
      <VlCard :title="t.gestures.lab1.title" :subtitle="t.gestures.lab1.subtitle" accent-side="left" accent-tone="primary">
        <template #extra>
          <div style="display: flex; gap: 6px">
            <VlButton size="sm" :variant="drawerOpen ? 'primary' : 'outline'" icon="panel-left" @click="rightDrawerOpen = false; drawerOpen = !drawerOpen">
              {{ t.gestures.lab1.leftBtn }}
            </VlButton>
            <VlButton size="sm" :variant="rightDrawerOpen ? 'secondary' : 'outline'" icon="panel-right" @click="drawerOpen = false; rightDrawerOpen = !rightDrawerOpen">
              {{ t.gestures.lab1.rightBtn }}
            </VlButton>
          </div>
        </template>

        <div class="telemetry-bar shape-rect">
          <span>{{ t.gestures.lab1.activeLabel }}: <strong>{{ rightDrawerOpen ? 'RIGHT' : drawerOpen ? 'LEFT' : 'CENTER' }}</strong></span>
          <span>{{ t.gestures.lab1.leftProgress }}: <strong>{{ (drawerDragState.progress * 100).toFixed(0) }}%</strong></span>
          <span>{{ t.gestures.lab1.rightProgress }}: <strong>{{ (drawerDragState.rightProgress * 100).toFixed(0) }}%</strong></span>
          <span>{{ t.gestures.lab1.velocityLabel }}: <strong>{{ drawerDragState.velocity.toFixed(2) }}</strong></span>
        </div>

        <div class="slider-ctrl">
          <VlSlider v-model="drawerWidth" :min="200" :max="276" :label="t.gestures.lab1.drawerWidthLabel" unit="px" />
        </div>

        <div class="phone-stage shape-rect">
          <VlPushDrawer
            v-model:open="drawerOpen"
            v-model:right-open="rightDrawerOpen"
            :drawer-width="drawerWidth"
            contained
            @drag-state="drawerDragState = $event"
          >
            <template #drawer>
              <VlActivityBar
                v-model="drawerAct"
                :items="drawerActItems"
                :bottom-items="drawerActBottom"
                mobile
              />
              <div class="drawer-inner">
                <div class="drawer-head">{{ t.gestures.lab1.leftDrawerHead }}</div>
                <VlSideNav
                  :groups="drawerGroups"
                  :active-id="drawerDoc"
                  @select="drawerDoc = $event.id; drawerOpen = false"
                />
              </div>
            </template>

            <template #right-drawer>
              <div class="drawer-inner">
                <div class="drawer-head">{{ t.gestures.lab1.rightDrawerHead }}</div>
                <VlSegmentedControl
                  v-model="rightInspectorMode"
                  :options="rightInspectorOpts"
                  size="sm"
                  surface="activity"
                />
                <div class="right-drawer-stack">
                  <template v-if="rightInspectorMode === 'layout'">
                    <div class="right-kv shape-rect"><span>{{ t.gestures.lab1.rightWidthKey }}</span><code>{{ drawerWidth }}px</code></div>
                    <div class="right-kv shape-rect"><span>{{ t.gestures.lab1.openGestureKey }}</span><strong>{{ t.gestures.lab1.openGestureVal }}</strong></div>
                    <div class="right-kv shape-rect"><span>{{ t.gestures.lab1.closeGestureKey }}</span><strong>{{ t.gestures.lab1.closeGestureVal }}</strong></div>
                  </template>
                  <template v-else>
                    <div class="right-kv shape-rect"><span>{{ t.gestures.lab1.pointerDriverKey }}</span><code>pointer gesture</code></div>
                    <div class="right-kv shape-rect"><span>{{ t.gestures.lab1.easingKey }}</span><code>cubic-bezier</code></div>
                  </template>
                  <VlButton size="sm" variant="secondary" block @click="rightDrawerOpen = false">
                    {{ t.gestures.lab1.collapseRightBtn }}
                  </VlButton>
                </div>
              </div>
            </template>

            <VlTitleBar
              mode="mobile"
              :center-text="t.gestures.lab1.phoneTitle"
              center-active
              :left-active="drawerOpen"
              :right-active="rightDrawerOpen"
              right-icon="panel-right"
              :right-title="t.gestures.lab1.rightToggleTitle"
              @toggle-left="rightDrawerOpen = false; drawerOpen = !drawerOpen"
              @toggle-right="drawerOpen = false; rightDrawerOpen = !rightDrawerOpen"
            />

            <div class="phone-canvas" data-drawer-drag-zone>
              <div class="gesture-banner shape-rect">
                <strong>{{ t.gestures.lab1.bannerTitle }}</strong>
                <p>{{ t.gestures.lab1.bannerDesc }}</p>
              </div>
              <p class="sample-p">{{ t.gestures.lab1.sampleText }}</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap">
                <VlButton size="sm" variant="primary" @click="rightDrawerOpen = false; drawerOpen = !drawerOpen">
                  {{ t.gestures.lab1.toggleLeftBtn }}
                </VlButton>
                <VlButton size="sm" variant="secondary" @click="drawerOpen = false; rightDrawerOpen = !rightDrawerOpen">
                  {{ t.gestures.lab1.toggleRightBtn }}
                </VlButton>
              </div>
            </div>
          </VlPushDrawer>
        </div>
      </VlCard>

      <!-- LAB 2: Dock to Sheet + Unified Nav (Floating vs Flush) -->
      <VlCard :title="t.gestures.lab2.title" :subtitle="t.gestures.lab2.subtitle" accent-side="left" accent-tone="secondary">
        <div class="lab2-controls">
          <VlSegmentedControl v-model="dockMode" :options="dockModeOpts" size="sm" surface="activity" />
          <VlSegmentedControl v-model="dockDetent" :options="detentOpts" size="sm" surface="activity" />
        </div>

        <div class="telemetry-bar shape-rect">
          <span>{{ t.gestures.lab2.heightLabel }}: <strong>{{ morphTelemetry.height }}px</strong></span>
          <span>{{ t.gestures.lab2.morphRateLabel }}: <strong>{{ (morphTelemetry.morphFactor * 100).toFixed(0) }}%</strong></span>
          <span>{{ t.gestures.lab2.insetLabel }}: <strong>{{ morphTelemetry.inset }}px</strong></span>
          <span>{{ t.gestures.lab2.radiusLabel }}: <strong>{{ morphTelemetry.radius }}px</strong></span>
        </div>

        <div class="phone-stage shape-rect" style="margin-top: 10px">
          <VlTitleBar
            mode="mobile"
            :center-text="dockMode === 'unified' ? t.gestures.lab2.centerTitleUnified(dockNavTab) : dockMode === 'unified-flush' ? t.gestures.lab2.centerTitleFlush(dockNavTab) : t.gestures.lab2.centerTitleFloating"
            center-active
            :show-left-toggle="false"
            :right-active="dockDetent !== 'docked'"
            @toggle-right="dockDetent = dockDetent === 'docked' ? 'half' : 'docked'"
          />

          <div class="phone-canvas" style="flex: 1; position: relative">
            <Transition :name="dockSlideName" mode="out-in">
              <div :key="dockNavTab" class="gesture-banner shape-rect">
                <strong>
                  {{
                    dockNavTab === 'read'
                      ? t.gestures.lab2.bannerRead
                      : dockNavTab === 'archive'
                        ? t.gestures.lab2.bannerArchive
                        : t.gestures.lab2.bannerAbout
                  }}
                </strong>
                <p>{{ t.gestures.lab2.bannerDesc }}</p>
              </div>
            </Transition>

            <VlDockSheet
              v-if="dockMode !== 'floating-only'"
              v-model:detent="dockDetent"
              :nav-items="dockNavItems"
              :active-nav="dockNavTab"
              :floating="dockMode !== 'unified-flush'"
              contained
              :title="t.gestures.lab2.sheetTitle"
              :badge="t.gestures.lab2.sheetBadge"
              icon="sparkles"
              @update:active-nav="switchDockNav"
              @morph-state="morphTelemetry = $event"
            >
              <template #dock-right>
                <VlBadge tone="primary" size="xs">{{ (morphTelemetry.expandRatio * 100).toFixed(0) }}%</VlBadge>
              </template>

              <div class="dock-sheet-demo-body">
                <p>{{ t.gestures.lab2.currentModeLabel }}: <strong>{{ dockMode === 'unified-flush' ? t.gestures.lab2.modeFlush : t.gestures.lab2.modeFloating }}</strong> · {{ dockDetent.toUpperCase() }}</p>
                <div class="comment-stub shape-rect" v-for="i in 5" :key="i">
                  <strong>{{ t.gestures.lab2.itemTitle(i) }}</strong>
                  <span>{{ t.gestures.lab2.itemDesc }}</span>
                </div>
              </div>
            </VlDockSheet>

            <VlBottomDock
              v-else
              :model-value="dockNavTab"
              :items="dockNavItems"
              contained
              variant="capsule"
              @update:model-value="switchDockNav"
            />
          </div>
        </div>
      </VlCard>

      <!-- LAB 3: Standalone Bottom Dock Sheet (CatsOnPlains Floating vs Edge Flush) -->
      <VlCard :title="t.gestures.lab3.title" :subtitle="t.gestures.lab3.subtitle" accent-side="left" accent-tone="primary">
        <div class="lab2-controls">
          <VlSegmentedControl v-model="soloSheetStyle" :options="soloSheetStyleOpts" size="sm" surface="activity" />
          <VlSegmentedControl v-model="soloSheetDetent" :options="detentOpts" size="sm" surface="activity" />
        </div>

        <div class="telemetry-bar shape-rect">
          <span>{{ t.gestures.lab3.styleLabel }}: <strong>{{ soloSheetStyle === 'floating' ? 'FLOATING' : 'FLUSH' }}</strong></span>
          <span>{{ t.gestures.lab3.heightLabel }}: <strong>{{ soloTelemetry.height }}px</strong></span>
          <span>{{ t.gestures.lab3.insetLabel }}: <strong>{{ soloTelemetry.inset }}px</strong></span>
          <span>{{ t.gestures.lab3.radiusLabel }}: <strong>{{ soloTelemetry.radius }}px</strong></span>
        </div>

        <div class="phone-stage shape-rect" style="margin-top: 10px">
          <VlTitleBar
            mode="mobile"
            :center-text="soloSheetStyle === 'floating' ? t.gestures.lab3.centerFloating : t.gestures.lab3.centerFlush"
            center-active
            :show-left-toggle="false"
            :right-active="soloSheetDetent !== 'docked'"
            @toggle-right="soloSheetDetent = soloSheetDetent === 'docked' ? 'half' : 'docked'"
          />

          <div class="phone-canvas" style="flex: 1; position: relative">
            <div class="gesture-banner shape-rect">
              <strong>{{ soloSheetStyle === 'floating' ? t.gestures.lab3.bannerFloatingTitle : t.gestures.lab3.bannerFlushTitle }}</strong>
              <p>
                {{
                  soloSheetStyle === 'floating'
                    ? t.gestures.lab3.bannerFloatingDesc
                    : t.gestures.lab3.bannerFlushDesc
                }}
              </p>
            </div>
            <p class="sample-p">{{ t.gestures.lab3.sampleText }}</p>

            <VlDockSheet
              v-model:detent="soloSheetDetent"
              :floating="soloSheetStyle === 'floating'"
              contained
              :title="t.gestures.lab3.sheetTitle"
              :badge="t.gestures.lab3.sheetBadge"
              icon="comment"
              @morph-state="soloTelemetry = $event"
            >
              <template #dock-right>
                <VlBadge tone="primary" size="xs">42%</VlBadge>
              </template>

              <div class="dock-sheet-demo-body">
                <VlEmptyState
                  compact
                  :title="t.gestures.lab3.emptyTitle"
                  :description="t.gestures.lab3.emptyDesc"
                />
                <div class="comment-stub shape-rect" v-for="i in 4" :key="i">
                  <strong>{{ t.gestures.lab3.commentTitle(i) }}</strong>
                  <span>{{ t.gestures.lab3.commentDesc }}</span>
                </div>
              </div>
            </VlDockSheet>
          </div>
        </div>
      </VlCard>
    </div>

    <!-- LAB 3: SplitPane + WinUI ScrollArea -->
    <VlCard :title="t.gestures.splitLab.title" :subtitle="t.gestures.splitLab.subtitle" accent-side="top" accent-tone="primary">
      <template #extra>
        <div style="display: flex; gap: 6px">
          <VlButton size="xs" :variant="splitLeftOpen ? 'primary' : 'neutral'" @click="splitLeftOpen = !splitLeftOpen">
            {{ t.gestures.splitLab.leftBtn }}
          </VlButton>
          <VlButton size="xs" :variant="splitRightOpen ? 'secondary' : 'neutral'" @click="splitRightOpen = !splitRightOpen">
            {{ t.gestures.splitLab.rightBtn }}
          </VlButton>
        </div>
      </template>

      <div class="split-lab-stage shape-rect">
        <VlSplitPane
          v-model:left-width="splitLeftW"
          v-model:right-width="splitRightW"
          :left-visible="splitLeftOpen"
          :right-visible="splitRightOpen"
          :min-left-width="140"
          :min-right-width="140"
          :min-center-width="180"
          :activity-bar-width="0"
        >
          <template #left>
            <div class="split-col-demo">
              <strong>{{ t.gestures.splitLab.leftPanel(splitLeftW) }}</strong>
              <p>{{ t.gestures.splitLab.leftDesc }}</p>
            </div>
          </template>

          <template #center>
            <VlScrollArea class="split-scroll-demo">
              <div class="split-scroll-inner">
                <strong>{{ t.gestures.splitLab.centerTitle }}</strong>
                <p v-for="n in 14" :key="n" class="scroll-line">
                  {{ t.gestures.splitLab.scrollLine(n) }}
                </p>
              </div>
            </VlScrollArea>
          </template>

          <template #right>
            <div class="split-col-demo">
              <strong>{{ t.gestures.splitLab.rightPanel(splitRightW) }}</strong>
              <p>{{ t.gestures.splitLab.rightDesc }}</p>
            </div>
          </template>
        </VlSplitPane>
      </div>
    </VlCard>

    <!-- LAB 4: M3E Pull-to-Refresh -->
    <VlCard
      :title="t.gestures.pullLab.title"
      :subtitle="t.gestures.pullLab.subtitle"
      accent-side="left"
      accent-tone="secondary"
    >
      <template #extra>
        <VlButton size="xs" variant="secondary" shape="pill" icon="refresh" :loading="isRefreshing" @click="handlePullRefresh">
          {{ t.gestures.pullLab.triggerBtn(refreshCount) }}
        </VlButton>
      </template>

      <div class="pull-lab-box shape-rect">
        <VlPullRefresh :refreshing="isRefreshing" tone="primary" @refresh="handlePullRefresh">
          <div class="pull-lab-list">
            <div class="comment-stub shape-rect" v-for="idx in 4" :key="idx">
              <strong>{{ t.gestures.pullLab.itemTitle(refreshCount * 4 + idx) }}</strong>
              <span>{{ t.gestures.pullLab.itemDesc }}</span>
            </div>
          </div>
        </VlPullRefresh>
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

.labs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 16px;
}

.lab2-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 10px;
}

.telemetry-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  background-color: var(--bg-activity);
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.telemetry-bar strong {
  color: var(--accent-primary-text);
}

.slider-ctrl {
  margin: 10px 0;
}

.phone-stage {
  height: 490px;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  border: 2px solid var(--divider-strong);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-base);
}

.drawer-inner {
  flex: 1;
  min-width: 0;
  padding: 10px;
  background-color: var(--bg-surface);
}

.drawer-head {
  font-size: var(--ui-font-sm);
  font-weight: 800;
  color: var(--text-primary);
  padding: 6px 8px 10px 8px;
}

.right-drawer-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.right-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background-color: var(--bg-elevated);
  border-left: 3px solid var(--accent-secondary);
  font-size: var(--ui-font-xs);
  color: var(--text-secondary);
}

.right-kv code,
.right-kv strong {
  font-family: var(--font-mono);
  color: var(--accent-secondary-text);
  font-weight: 700;
}

.phone-canvas {
  flex: 1;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.gesture-banner {
  padding: 12px 14px;
  background-color: var(--accent-primary-soft);
  border-left: 4px solid var(--accent-primary);
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
  line-height: 1.55;
}

.gesture-banner strong {
  color: var(--accent-primary-text);
  display: block;
  margin-bottom: 4px;
}

.gesture-banner p {
  margin: 0;
}

.sample-p {
  margin: 0;
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  line-height: 1.6;
}

.dock-sheet-demo-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
}

.dock-sheet-demo-body p {
  margin: 0;
}

.comment-stub {
  padding: 10px 12px;
  background-color: var(--bg-elevated);
  border-left: 3px solid var(--accent-secondary);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.comment-stub strong {
  font-size: var(--ui-font-sm);
  color: var(--text-primary);
}

.split-lab-stage {
  height: 260px;
  border: 1px solid var(--divider-hairline);
  overflow: hidden;
  display: flex;
}

.split-col-demo {
  height: 100%;
  padding: 14px;
  background-color: var(--bg-surface);
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
}

.split-col-demo strong {
  color: var(--text-primary);
  display: block;
  margin-bottom: 6px;
}

.split-scroll-demo {
  flex: 1;
  height: 100%;
}

.split-scroll-inner {
  padding: 14px 18px;
  font-size: var(--ui-font-sm);
  color: var(--text-secondary);
}

.scroll-line {
  margin: 8px 0;
  padding: 6px 10px;
  background-color: var(--bg-surface);
}

.pull-lab-box {
  border: 1px solid var(--divider-hairline);
  background-color: var(--bg-surface);
  overflow: hidden;
}

.pull-lab-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
