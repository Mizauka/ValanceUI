<script setup lang="ts">
import { ref } from 'vue'
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

const actActive = ref('explorer')
const actExpanded = ref(false)
const actTopItems: ActivityBarItem[] = [
  { id: 'explorer', icon: 'files', label: '资源管理器' },
  { id: 'search', icon: 'search', label: '全文搜索', badge: 3 },
  { id: 'plans', icon: 'calendar', label: '周期方案' },
]
const actCenterItems: ActivityBarItem[] = [
  { id: 'lab', icon: 'flask', label: '曲线实验室' },
  { id: 'clock', icon: 'clock', label: '时间轴' },
]
const actBottomItems: ActivityBarItem[] = [
  { id: 'comment', icon: 'comment', label: '评论面板', tone: 'secondary', active: true },
  { id: 'settings', icon: 'settings', label: '工作台设置' },
]

const sideActive = ref('ch1-s2')
const sideGroups: SideNavGroup[] = [
  {
    id: 'ch0',
    label: '第0章 序幕',
    badge: 'v2.1',
    meta: '3幕',
    defaultOpen: true,
    items: [
      { id: 'ch0-s1', label: '幕1 放出', icon: 'doc', openDot: true, meta: '3.2k' },
      { id: 'ch0-full', label: '第0章 全文', icon: 'book', tone: 'secondary', meta: '12k' },
    ],
  },
  {
    id: 'ch1',
    label: '第1章 平原之上',
    badge: 'v1.4',
    meta: '2幕',
    defaultOpen: true,
    items: [
      { id: 'ch1-s1', label: '幕1 初遇', icon: 'doc', meta: '4.1k' },
      { id: 'ch1-s2', label: '幕2 晚风与信号', icon: 'doc', openDot: true, meta: '5.6k' },
    ],
  },
]

const dockCapsuleTab = ref('curve')
const dockBarTab = ref('home')
const railCapsuleTab = ref('curve')
const railBarTab = ref('home')
const capsuleItems: BottomDockItem[] = [
  { id: 'curve', label: '曲线', icon: 'curve' },
  { id: 'records', label: '记录', icon: 'clock', badge: 4 },
  { id: 'calibration', label: '校准', icon: 'biotech' },
]
const railCapsuleItems: NavRailItem[] = capsuleItems
const barItems: BottomDockItem[] = [
  { id: 'home', label: '首页', icon: 'home' },
  { id: 'explore', label: '探索', icon: 'compass' },
  { id: 'archive', label: '归档', icon: 'archive' },
  { id: 'user', label: '我的', icon: 'user' },
]
const railBarItems: NavRailItem[] = barItems

const demoTabs = ref<TabBarItem[]>([
  { id: 'curve', title: '浓度曲线', subtitle: 'PK', icon: 'curve', pinned: true },
  { id: 'ev', title: 'Estradiol Valerate', subtitle: 'HRT', icon: 'flask', tone: 'secondary' },
  { id: 'plan', title: '常规 5 日周期', subtitle: 'PLAN', icon: 'calendar', tone: 'secondary' },
])
const activeTabId = ref('curve')
let tabSeq = 1

function addDemoTab() {
  const id = `doc-${tabSeq++}`
  demoTabs.value.push({
    id,
    title: `新建文档 #${tabSeq - 1}`,
    subtitle: 'DOC',
    icon: 'doc',
  })
  activeTabId.value = id
}

function closeDemoTab(id: string) {
  demoTabs.value = demoTabs.value.filter((t) => t.id !== id)
  if (activeTabId.value === id) {
    activeTabId.value = demoTabs.value[0]?.id ?? ''
  }
}

const subTab = ref('calibration')
const subTabItems: TabOption<'calibration' | 'inspector' | 'logs'>[] = [
  { value: 'calibration', label: '血检校准', icon: 'biotech', badge: 2 },
  { value: 'inspector', label: '记录编辑', icon: 'sliders' },
  { value: 'logs', label: '计算日志', icon: 'terminal' },
]

const currentPage = ref(3)
const currentStep = ref(1)
const demoSteps: StepItem[] = [
  { id: 1, title: '色彩引擎解析', description: '提取主色并计算冷暖对位副色' },
  { id: 2, title: '几何形态装配', description: '应用直角 / 正圆 / 胶囊 / M3E 35 轮廓' },
  { id: 3, title: '流体多端发布', description: '自动适配移动端比例与 Safe Area' },
]
</script>

<template>
  <div class="demo-view">
    <!-- 1. Two Distinct Side Navigation Paradigms: Workbench ActivityBar vs Vertical Gesture NavRail -->
    <div class="two-col">
      <VlCard title="侧面活动栏 · 工作台式（VlActivityBar）" subtitle="无手势纯点击，激活态由 0px 纯方变形为正圆" accent-side="left" accent-tone="primary">
        <template #extra>
          <VlSwitch v-model="actExpanded" size="sm" label="展开文本标签" />
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
            <strong>当前工作台分区：{{ actActive }}</strong>
            <p>面向工作台与 IDE 场景的经典活动栏：点击切换无拖拽干扰，激活态保留 0px 正方 ↔ 正圆变形动画与左侧强调竖条，次级面板使用青色通道区分。</p>
          </div>
        </div>
      </VlCard>

      <VlCard title="侧边导航树（VlSideNav）" subtitle="支持非线性 Grid 展开折叠、4px 侧边激活条与徽章" accent-side="left" accent-tone="secondary">
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
    <VlCard title="侧面手势导航栏 · 竖向版（VlNavRail）：浮动胶囊 vs 固定侧栏" subtitle="与工作台活动栏区分：支持上下拖拽切换、色块按压缩放与有上限弹性轻微越界" accent-side="left" accent-tone="secondary">
      <div class="two-col">
        <div class="vrail-frame shape-rect">
          <VlNavRail v-model="railCapsuleTab" :items="railCapsuleItems" variant="capsule" contained />
          <div class="rail-preview">
            <strong>竖向浮动胶囊 (variant="capsule")</strong>
            <p>底部浮动导航栏的竖向镜像形态：上下按压拖拽时色块放大并可弹性轻微越界（上限 12px），同时带动容器做 Liquid 风格纯色微位移。</p>
            <VlBadge tone="primary">当前选中：{{ railCapsuleTab }}</VlBadge>
          </div>
        </div>

        <div class="vrail-frame shape-rect">
          <VlNavRail v-model="railBarTab" :items="railBarItems" variant="bar" contained />
          <div class="rail-preview">
            <strong>竖向固定侧栏 (variant="bar")</strong>
            <p>贴边通高竖向导航栏：左侧 3px 指示条与底色块随手指上下滑动并支持按压缩放与限位微越界，适合平板端/宽屏主导航。</p>
            <VlBadge tone="secondary">当前选中：{{ railBarTab }}</VlBadge>
          </div>
        </div>
      </div>
    </VlCard>

    <!-- 2. Bottom Navigation Bars (Both Variants) -->
    <VlCard title="底部导航栏（VlBottomDock）：悬浮固定胶囊 vs 通栏底栏" accent-side="top" accent-tone="primary">
      <div class="two-col">
        <div class="dock-frame shape-rect">
          <div class="dock-frame-body">
            <strong>悬浮纯胶囊模式 (variant="capsule")</strong>
            <p>流式放大胶囊宽度与高度并内置随动滑块指示器；可独立使用或嵌套于 <code>VlDockSheet</code> 组成二合一浮动导航栏。</p>
            <VlBadge tone="primary">当前选中：{{ dockCapsuleTab }}</VlBadge>
          </div>
          <VlBottomDock v-model="dockCapsuleTab" :items="capsuleItems" variant="capsule" contained />
        </div>

        <div class="dock-frame shape-rect">
          <div class="dock-frame-body">
            <strong>通栏底部导航模式 (variant="bar")</strong>
            <p>满宽贴底导航栏，顶部带有 3px scaleX 展开指示线，激活图标方圆变形。</p>
            <VlBadge tone="secondary">当前选中：{{ dockBarTab }}</VlBadge>
          </div>
          <VlBottomDock v-model="dockBarTab" :items="barItems" variant="bar" contained />
        </div>
      </div>
    </VlCard>

    <!-- 3. TabBar, Tabs, Breadcrumb, Pagination -->
    <VlCard title="多标签栏（VlTabBar）、内容选项卡（VlTabs）、面包屑与分页" accent-side="left" accent-tone="secondary">
      <div class="nav-stack">
        <div class="demo-box shape-rect">
          <VlTabBar
            :tabs="demoTabs"
            :active-id="activeTabId"
            @select="activeTabId = $event"
            @close="closeDemoTab"
          >
            <template #actions>
              <VlButton size="xs" variant="primary" icon="plus" @click="addDemoTab">新增标签</VlButton>
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
              { label: '导航体系', to: '/nav' },
              { label: '面包屑与分页示例', active: true },
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
    <VlCard title="顶栏（VlTitleBar）与状态栏（VlStatusBar）" surface="surface">
      <div class="demo-box shape-rect">
        <VlTitleBar
          brand-name="VALENCE"
          brand-tag="DEMO"
          center-text="第1章 / 幕2 晚风与信号"
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
            <VlBadge tone="primary" size="xs">进度 68%</VlBadge>
            <span>100% Flat</span>
          </template>
        </VlStatusBar>
      </div>
    </VlCard>

    <!-- 5. Steps Workflow Progress -->
    <VlCard title="步骤引导条（VlSteps）：水平与垂直流程" accent-side="left" accent-tone="primary">
      <template #extra>
        <div style="display: flex; gap: 6px">
          <VlButton size="xs" variant="outline" :disabled="currentStep <= 0" @click="currentStep--">上一步</VlButton>
          <VlButton size="xs" variant="primary" :disabled="currentStep >= demoSteps.length - 1" @click="currentStep++">下一步</VlButton>
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
