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

// Lab 1: Bidirectional Push Drawer State (Right-swipe Left Drawer + Left-swipe Right Drawer)
const drawerOpen = ref(false)
const rightDrawerOpen = ref(false)
const drawerWidth = ref(236)
const drawerDragState = ref({ progress: 0, rightProgress: 0, isDragging: false, velocity: 0 })
const drawerAct = ref('files')
const drawerDoc = ref('s1')
const rightInspectorMode = ref('layout')
const rightInspectorOpts: SegmentOption<'layout' | 'tokens'>[] = [
  { value: 'layout', label: '几何规格' },
  { value: 'tokens', label: '物理参数' },
]

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
const dockMode = ref<'unified' | 'unified-flush' | 'floating-only'>('unified')
const dockModeOpts: SegmentOption<'unified' | 'unified-flush' | 'floating-only'>[] = [
  { value: 'unified', label: '二合一悬浮' },
  { value: 'unified-flush', label: '二合一贴边' },
  { value: 'floating-only', label: '纯浮动胶囊' },
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
  height: 113,
  expandRatio: 0,
  morphFactor: 0,
  inset: 14,
  radius: 37,
  isDragging: false,
})

const detentOpts: SegmentOption<DockSheetDetent>[] = [
  { value: 'docked', label: '停靠 Docked' },
  { value: 'half', label: '半屏 Half' },
  { value: 'full', label: '全高 Full' },
]

// Lab 3: Standalone Bottom Dock Sheet (CatsOnPlains Floating vs Edge-Flush, no bottom nav)
const soloSheetStyle = ref<'floating' | 'flush'>('floating')
const soloSheetStyleOpts: SegmentOption<'floating' | 'flush'>[] = [
  { value: 'floating', label: '悬浮版 (CatsOnPlains)' },
  { value: 'flush', label: '贴边不悬浮版' },
]
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
      <VlCard title="实验室 1 · 双向挤压式侧边栏（VlPushDrawer）" subtitle="向右滑打开左侧目录，向左滑打开右侧检查器；复用 1:1 拖拽与 120Hz scroll-snap 手势引擎" accent-side="left" accent-tone="primary">
        <template #extra>
          <div style="display: flex; gap: 6px">
            <VlButton size="sm" :variant="drawerOpen ? 'primary' : 'outline'" icon="panel-left" @click="rightDrawerOpen = false; drawerOpen = !drawerOpen">
              左侧
            </VlButton>
            <VlButton size="sm" :variant="rightDrawerOpen ? 'secondary' : 'outline'" icon="panel-right" @click="drawerOpen = false; rightDrawerOpen = !rightDrawerOpen">
              右侧
            </VlButton>
          </div>
        </template>

        <div class="telemetry-bar shape-rect">
          <span>激活：<strong>{{ rightDrawerOpen ? 'RIGHT' : drawerOpen ? 'LEFT' : 'CENTER' }}</strong></span>
          <span>左进度：<strong>{{ (drawerDragState.progress * 100).toFixed(0) }}%</strong></span>
          <span>右进度：<strong>{{ (drawerDragState.rightProgress * 100).toFixed(0) }}%</strong></span>
          <span>速度：<strong>{{ drawerDragState.velocity.toFixed(2) }}</strong></span>
        </div>

        <div class="slider-ctrl">
          <VlSlider v-model="drawerWidth" :min="200" :max="276" label="抽屉宽度" unit="px" />
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
                <div class="drawer-head">左侧 · 章节目录</div>
                <VlSideNav
                  :groups="drawerGroups"
                  :active-id="drawerDoc"
                  @select="drawerDoc = $event.id; drawerOpen = false"
                />
              </div>
            </template>

            <template #right-drawer>
              <div class="drawer-inner">
                <div class="drawer-head">右侧 · 属性检查器</div>
                <VlSegmentedControl
                  v-model="rightInspectorMode"
                  :options="rightInspectorOpts"
                  size="sm"
                  surface="activity"
                />
                <div class="right-drawer-stack">
                  <template v-if="rightInspectorMode === 'layout'">
                    <div class="right-kv shape-rect"><span>右侧宽度</span><code>{{ drawerWidth }}px</code></div>
                    <div class="right-kv shape-rect"><span>打开方式</span><strong>向左滑动 ←</strong></div>
                    <div class="right-kv shape-rect"><span>合拢方式</span><strong>向右滑动 →</strong></div>
                  </template>
                  <template v-else>
                    <div class="right-kv shape-rect"><span>触控帧率</span><code>120Hz scroll-snap</code></div>
                    <div class="right-kv shape-rect"><span>桌面过渡</span><code>cubic-bezier</code></div>
                  </template>
                  <VlButton size="sm" variant="secondary" block @click="rightDrawerOpen = false">
                    收起右侧栏
                  </VlButton>
                </div>
              </div>
            </template>

            <VlTitleBar
              mode="mobile"
              center-text="幕1 放出"
              center-active
              :left-active="drawerOpen"
              :right-active="rightDrawerOpen"
              right-icon="panel-right"
              right-title="切换右侧栏"
              @toggle-left="rightDrawerOpen = false; drawerOpen = !drawerOpen"
              @toggle-right="drawerOpen = false; rightDrawerOpen = !rightDrawerOpen"
            />

            <div class="phone-canvas">
              <div class="gesture-banner shape-rect">
                <strong>→ 右滑左抽屉 · ← 左滑右抽屉</strong>
                <p>
                  同一套 <code>VlPushDrawer</code> + <code>usePushDrawerGesture</code> 引擎：在画布任意位置右滑呼出左侧目录，左滑呼出右侧检查器。
                </p>
              </div>
              <p class="sample-p">
                触控设备上通过 <code>[左抽屉 | 主舞台 | 右抽屉]</code> 三段原生 <code>scroll-snap</code> 在合成器线程跟手滑动，零掉帧。
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap">
                <VlButton size="sm" variant="primary" @click="rightDrawerOpen = false; drawerOpen = !drawerOpen">
                  切左侧栏
                </VlButton>
                <VlButton size="sm" variant="secondary" @click="drawerOpen = false; rightDrawerOpen = !rightDrawerOpen">
                  切右侧栏
                </VlButton>
              </div>
            </div>
          </VlPushDrawer>
        </div>
      </VlCard>

      <!-- LAB 2: Dock to Sheet + Unified Nav (Floating vs Flush) -->
      <VlCard title="实验室 2 · 二合一导航 + Dock to Sheet（VlDockSheet）" subtitle="拖住上方把手展开 Sheet；底部常驻导航滑块色块支持出界弹性放大且外框绝不越界" accent-side="left" accent-tone="secondary">
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
            :center-text="dockMode === 'unified' ? `二合一悬浮 · ${dockNavTab}` : dockMode === 'unified-flush' ? `二合一贴边 · ${dockNavTab}` : '纯浮动胶囊导航'"
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
                      ? '阅读页 · 长按滑动底部导航色块试试'
                      : dockNavTab === 'archive'
                        ? '归档页 · 支持悬浮胶囊与贴边直条两种二合一'
                        : '关于页 · 色块放大可自然溢出边界不被裁切'
                  }}
                </strong>
                <p>
                  导航容器严格贴合外框内边距，同时保留色块缩放与越界跟手弹性。
                </p>
              </div>
            </Transition>

            <VlDockSheet
              v-if="dockMode !== 'floating-only'"
              v-model:detent="dockDetent"
              :nav-items="dockNavItems"
              :active-nav="dockNavTab"
              :floating="dockMode !== 'unified-flush'"
              contained
              title="快捷大纲与设置"
              badge="实时变形"
              icon="sparkles"
              @update:active-nav="switchDockNav"
              @morph-state="morphTelemetry = $event"
            >
              <template #dock-right>
                <VlBadge tone="primary" size="xs">{{ (morphTelemetry.expandRatio * 100).toFixed(0) }}%</VlBadge>
              </template>

              <div class="dock-sheet-demo-body">
                <p>当前形态：<strong>{{ dockMode === 'unified-flush' ? '贴边不悬浮 (FLUSH)' : '居中悬浮 (FLOATING)' }}</strong> · {{ dockDetent.toUpperCase() }}</p>
                <div class="comment-stub shape-rect" v-for="i in 5" :key="i">
                  <strong>快捷条目标记 #{{ i }}</strong>
                  <span>二合一结构保证底层导航始终触手可及。</span>
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
      <VlCard title="实验室 3 · 独立底部 Sheet（无底部导航栏 · 悬浮 vs 贴边）" subtitle="对照 CatsOnPlains 同款居中悬浮胶囊 Sheet，并提供零边距直角贴边不悬浮版本" accent-side="left" accent-tone="primary">
        <div class="lab2-controls">
          <VlSegmentedControl v-model="soloSheetStyle" :options="soloSheetStyleOpts" size="sm" surface="activity" />
          <VlSegmentedControl v-model="soloSheetDetent" :options="detentOpts" size="sm" surface="activity" />
        </div>

        <div class="telemetry-bar shape-rect">
          <span>样式：<strong>{{ soloSheetStyle === 'floating' ? 'FLOATING' : 'FLUSH' }}</strong></span>
          <span>高度：<strong>{{ soloTelemetry.height }}px</strong></span>
          <span>边距：<strong>{{ soloTelemetry.inset }}px</strong></span>
          <span>圆角：<strong>{{ soloTelemetry.radius }}px</strong></span>
        </div>

        <div class="phone-stage shape-rect" style="margin-top: 10px">
          <VlTitleBar
            mode="mobile"
            :center-text="soloSheetStyle === 'floating' ? 'CatsOnPlains 悬浮停靠 Sheet' : '贴边不悬浮 Bottom Sheet'"
            center-active
            :show-left-toggle="false"
            :right-active="soloSheetDetent !== 'docked'"
            @toggle-right="soloSheetDetent = soloSheetDetent === 'docked' ? 'half' : 'docked'"
          />

          <div class="phone-canvas" style="flex: 1; position: relative">
            <div class="gesture-banner shape-rect">
              <strong>{{ soloSheetStyle === 'floating' ? '悬浮态（CatsOnPlains 同款）' : '贴边不悬浮态（Edge Flush）' }}</strong>
              <p>
                {{
                  soloSheetStyle === 'floating'
                    ? '未绑定底部导航栏，仅在底部居中药丸停靠；向上拖拽手柄可展开为全宽阅读评论区面板。'
                    : '紧贴屏幕左右及底部边缘，遵循三大几何法则采用 0px 纯直角架构与 2px 顶部强调条，展开零横向边距跳变。'
                }}
              </p>
            </div>
            <p class="sample-p">
              独立底部 Sheet 层级默认高于带底部导航栏的 Dock Sheet，同时独立弹窗式 <code>VlSheet</code> 始终处于最上层。
            </p>

            <VlDockSheet
              v-model:detent="soloSheetDetent"
              :floating="soloSheetStyle === 'floating'"
              contained
              title="评论区"
              badge="预留"
              icon="comment"
              @morph-state="soloTelemetry = $event"
            >
              <template #dock-right>
                <VlBadge tone="primary" size="xs">42%</VlBadge>
              </template>

              <div class="dock-sheet-demo-body">
                <VlEmptyState
                  compact
                  title="评论区与扩展内容"
                  description="拉住底部停靠栏把手向上展开即可变为全宽面板；支持悬浮药丸与零间隙贴边两种底座几何。"
                />
                <div class="comment-stub shape-rect" v-for="i in 4" :key="i">
                  <strong>读者段评示例 #{{ i }}</strong>
                  <span>无底部导航栏的纯净扩展抽屉，适合阅读器评论区或播放器面板。</span>
                </div>
              </div>
            </VlDockSheet>
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
