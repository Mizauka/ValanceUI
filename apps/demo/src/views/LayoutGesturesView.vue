<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VlActivityBar,
  VlBadge,
  VlBottomDock,
  VlButton,
  VlCard,
  VlDockSheet,
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

const toast = useToast()
const isRefreshing = ref(false)
const refreshCount = ref(0)

function handlePullRefresh() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  setTimeout(() => {
    refreshCount.value++
    isRefreshing.value = false
    toast.success(`M3E 下拉同步完成（第 ${refreshCount.value} 次）`)
  }, 1100)
}

// Lab 1: Push Drawer State
const drawerOpen = ref(false)
const drawerWidth = ref(248)
const drawerDragState = ref({ progress: 0, isDragging: false, velocity: 0 })
const drawerAct = ref('files')
const drawerDoc = ref('s1')

const drawerActItems: ActivityBarItem[] = [
  { id: 'files', icon: 'files', label: '目录' },
  { id: 'search', icon: 'search', label: '搜索' },
]
const drawerActBottom: ActivityBarItem[] = [
  { id: 'settings', icon: 'settings', label: '设置' },
]
const drawerGroups: SideNavGroup[] = [
  {
    id: 'ch0',
    label: '第0章 序幕',
    badge: 'v2.0',
    defaultOpen: true,
    items: [
      { id: 's1', label: '幕1 放出', icon: 'doc', openDot: true },
      { id: 's2', label: '幕2 荒原信号', icon: 'doc' },
      { id: 'full', label: '本章全文', icon: 'book', tone: 'secondary' },
    ],
  },
]

// Lab 2: Dock-to-Sheet + Unified Floating Nav State
const dockMode = ref<'unified' | 'floating-only' | 'standalone'>('unified')
const dockModeOpts: SegmentOption<'unified' | 'floating-only' | 'standalone'>[] = [
  { value: 'unified', label: '二合一导航+Sheet' },
  { value: 'floating-only', label: '纯浮动胶囊导航' },
  { value: 'standalone', label: '纯 Sheet' },
]
const dockNavItems: BottomDockItem[] = [
  { id: 'read', label: '阅读', icon: 'home' },
  { id: 'archive', label: '归档', icon: 'archive' },
  { id: 'about', label: '关于', icon: 'user' },
]
const dockNavTab = ref('read')
const dockNavDir = ref<'left' | 'right'>('left')
const dockSlideName = computed(() =>
  dockNavDir.value === 'left' ? 'dock-slide-left' : 'dock-slide-right',
)

function switchDockNav(next: string) {
  const fromIdx = dockNavItems.findIndex((i) => i.id === dockNavTab.value)
  const toIdx = dockNavItems.findIndex((i) => i.id === next)
  dockNavDir.value = toIdx >= fromIdx ? 'left' : 'right'
  dockNavTab.value = next
}

const dockDetent = ref<DockSheetDetent>('docked')
const morphTelemetry = ref<DockSheetMorphState>({
  detent: 'docked',
  height: 56,
  expandRatio: 0,
  morphFactor: 0,
  inset: 14,
  radius: 28,
  isDragging: false,
})

const detentOpts: SegmentOption<DockSheetDetent>[] = [
  { value: 'docked', label: '停靠胶囊 Docked' },
  { value: 'half', label: '半屏 Half' },
  { value: 'full', label: '全高 Full' },
]

// Lab 3: SplitPane State
const splitLeftOpen = ref(true)
const splitRightOpen = ref(true)
const splitLeftW = ref(200)
const splitRightW = ref(190)
</script>

<template>
  <div class="demo-view">
    <div class="labs-grid">
      <!-- LAB 1: Squeeze / Push Drawer + 1:1 Gesture -->
      <VlCard title="实验室 1 · 挤压式侧边栏与 1:1 拖拽手势（VlPushDrawer）" subtitle="在下方手机框内任意位置向右滑动打开，向左滑动关闭，支持速度惯性回弹" accent-side="left" accent-tone="primary">
        <template #extra>
          <VlButton size="sm" variant="primary" icon="panel-left" @click="drawerOpen = !drawerOpen">
            {{ drawerOpen ? '收起抽屉' : '推开抽屉' }}
          </VlButton>
        </template>

        <div class="telemetry-bar shape-rect">
          <span>状态：<strong>{{ drawerOpen ? 'OPEN' : 'CLOSED' }}</strong></span>
          <span>进度：<strong>{{ (drawerDragState.progress * 100).toFixed(0) }}%</strong></span>
          <span>拖拽中：<strong>{{ drawerDragState.isDragging ? 'YES' : 'NO' }}</strong></span>
          <span>速度：<strong>{{ drawerDragState.velocity.toFixed(2) }} px/ms</strong></span>
        </div>

        <div class="slider-ctrl">
          <VlSlider v-model="drawerWidth" :min="210" :max="290" label="抽屉宽度" unit="px" />
        </div>

        <div class="phone-stage shape-rect">
          <VlPushDrawer
            v-model:open="drawerOpen"
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
                <div class="drawer-head">章节目录</div>
                <VlSideNav
                  :groups="drawerGroups"
                  :active-id="drawerDoc"
                  @select="drawerDoc = $event.id; drawerOpen = false"
                />
              </div>
            </template>

            <VlTitleBar
              mode="mobile"
              center-text="幕1 放出"
              center-active
              :left-active="drawerOpen"
              :show-right-toggle="false"
              @toggle-left="drawerOpen = !drawerOpen"
            />

            <div class="phone-canvas">
              <div class="gesture-banner shape-rect">
                <strong>全屏任意位置向右滑动 →</strong>
                <p>
                  基于 <code>usePushDrawerGesture</code> 的 1:1 指针跟随与牛顿迭代 <code>cubic-bezier(0.22, 1, 0.36, 1)</code> rAF 连续补间，彻底消除 iOS Safari 释放闪屏。
                </p>
              </div>
              <p class="sample-p">
                左侧抽屉与主画布同步以 <code>translate3d</code> 推挤位移，非覆盖遮罩，保持物理空间连贯性。
              </p>
              <VlButton variant="secondary" @click="drawerOpen = !drawerOpen">
                点击或手势切换抽屉
              </VlButton>
            </div>
          </VlPushDrawer>
        </div>
      </VlCard>

      <!-- LAB 2: Dock to Sheet (Standalone or 2-in-1 Unified with Floating Nav) -->
      <VlCard title="实验室 2 · 二合一浮动导航 + Dock to Sheet（VlDockSheet）" subtitle="拖住上方圆形标志把手向上拉起展开 Sheet；底部常驻胶囊导航与页面切换动画并存" accent-side="left" accent-tone="secondary">
        <div class="lab2-controls">
          <VlSegmentedControl v-model="dockMode" :options="dockModeOpts" size="sm" surface="activity" />
          <VlSegmentedControl v-model="dockDetent" :options="detentOpts" size="sm" surface="activity" />
        </div>

        <div class="telemetry-bar shape-rect">
          <span>高度：<strong>{{ morphTelemetry.height }}px</strong></span>
          <span>变形率：<strong>{{ (morphTelemetry.morphFactor * 100).toFixed(0) }}%</strong></span>
          <span>边距：<strong>{{ morphTelemetry.inset }}px</strong></span>
          <span>圆角：<strong>{{ morphTelemetry.radius }}px</strong></span>
        </div>

        <div class="phone-stage shape-rect" style="margin-top: 10px">
          <VlTitleBar
            mode="mobile"
            :center-text="dockMode === 'unified' ? `二合一舞台 · ${dockNavTab}` : 'Dock-to-Sheet 舞台'"
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
                      ? '阅读页 · 拖住下方二合一头部上滑 ↑'
                      : dockNavTab === 'archive'
                        ? '归档页 · 导航栏切换具备方向过渡动画'
                        : '关于页 · 进入关于页导航栏依然常驻'
                  }}
                </strong>
                <p>
                  停靠态呈居中胶囊并带有圆角呼应，点击底部标签可无缝切换页面并自动收起展开面板。
                </p>
              </div>
            </Transition>

            <VlDockSheet
              v-if="dockMode !== 'floating-only'"
              v-model:detent="dockDetent"
              :nav-items="dockMode === 'unified' ? dockNavItems : undefined"
              :active-nav="dockNavTab"
              contained
              :title="dockMode === 'unified' ? '快捷大纲与设置' : '评论区与扩展抽屉'"
              badge="实时变形"
              :icon="dockMode === 'unified' ? 'sparkles' : 'comment'"
              @update:active-nav="switchDockNav"
              @morph-state="morphTelemetry = $event"
            >
              <template #dock-right>
                <VlBadge tone="primary" size="xs">{{ (morphTelemetry.expandRatio * 100).toFixed(0) }}%</VlBadge>
              </template>

              <div class="dock-sheet-demo-body">
                <p>现在处于 <strong>{{ dockDetent.toUpperCase() }}</strong> 停靠挡位（当前子页：{{ dockNavTab }}）。</p>
                <p>独立胶囊导航与二合一吸附胶囊保持完全一致的居中定宽。</p>
                <div class="comment-stub shape-rect" v-for="i in 6" :key="i">
                  <strong>快捷条目标记 #{{ i }}</strong>
                  <span>二合一结构保证了底层页面导航始终触手可及，不再因进入正文/关于页而丢失导航。</span>
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
    </div>

    <!-- LAB 3: SplitPane + WinUI ScrollArea -->
    <VlCard title="实验室 3 · 可拖拽三栏分屏（VlSplitPane）与 WinUI 动画滚动条（VlScrollArea）" subtitle="拖动灰色分屏把手调整宽窄，双击复位；鼠标悬停右侧滚动条观察药丸展开为纯直角橘色条" accent-side="top" accent-tone="primary">
      <template #extra>
        <div style="display: flex; gap: 6px">
          <VlButton size="xs" :variant="splitLeftOpen ? 'primary' : 'neutral'" @click="splitLeftOpen = !splitLeftOpen">
            左侧栏
          </VlButton>
          <VlButton size="xs" :variant="splitRightOpen ? 'secondary' : 'neutral'" @click="splitRightOpen = !splitRightOpen">
            右侧栏
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
              <strong>左面板 ({{ splitLeftW }}px)</strong>
              <p>宽度低于阈值不可继续缩窄，折叠时伴随平移动画。</p>
            </div>
          </template>

          <template #center>
            <VlScrollArea class="split-scroll-demo">
              <div class="split-scroll-inner">
                <strong>中央画布 · WinUI 悬浮滚动条</strong>
                <p v-for="n in 14" :key="n" class="scroll-line">
                  滚动测试行 #{{ n }} — 轨道固定在边缘，拇指在悬停时从 4px 药丸展开为 10px 橘色纯直角条，零位移跳动。
                </p>
              </div>
            </VlScrollArea>
          </template>

          <template #right>
            <div class="split-col-demo">
              <strong>右面板 ({{ splitRightW }}px)</strong>
              <p>双击分隔条上的把手即可重置为默认宽度。</p>
            </div>
          </template>
        </VlSplitPane>
      </div>
    </VlCard>

    <!-- LAB 4: M3E Pull-to-Refresh -->
    <VlCard
      title="实验室 4 · M3E 几何形态渐变下拉刷新（VlPullRefresh）"
      subtitle="按住列表向下拖拽时圆球平滑形变为四叶草、晴日与繁花；也可直接点击右上角按钮触发刷新循环"
      accent-side="left"
      accent-tone="secondary"
    >
      <template #extra>
        <VlButton size="xs" variant="secondary" shape="pill" icon="refresh" :loading="isRefreshing" @click="handlePullRefresh">
          触发同步（已刷新 {{ refreshCount }} 次）
        </VlButton>
      </template>

      <div class="pull-lab-box shape-rect">
        <VlPullRefresh :refreshing="isRefreshing" tone="primary" @refresh="handlePullRefresh">
          <div class="pull-lab-list">
            <div class="comment-stub shape-rect" v-for="idx in 4" :key="idx">
              <strong>动态数据条目 #{{ refreshCount * 4 + idx }}</strong>
              <span>在区域顶部按住鼠标或手指下拉即可预览实时 72 顶点几何形变指示器。</span>
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
