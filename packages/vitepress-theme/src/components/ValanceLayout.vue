<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Content } from 'vitepress'
import {
  VlActivityBar,
  VlBadge,
  VlBottomDock,
  VlBreadcrumb,
  VlButton,
  VlDockSheet,
  VlIcon,
  VlIconButton,
  VlPalettePicker,
  VlProgress,
  VlPushDrawer,
  VlScrollArea,
  VlSegmentedControl,
  VlSplitPane,
  VlStatusBar,
  VlStepper,
  VlTabBar,
  VlTitleBar,
  VlToast,
  useThemeMode,
  useWidthTransition,
  type ActivityBarItem,
  type BottomDockItem,
  type SegmentOption,
} from '@valance-ui/vue'
import VpSidebarPanel from './VpSidebarPanel.vue'
import VpRightOutline from './VpRightOutline.vue'
import VpBlogHome from './VpBlogHome.vue'
import VpBlogArchive from './VpBlogArchive.vue'
import VpBlogPostHeader from './VpBlogPostHeader.vue'
import VpNotFound from './VpNotFound.vue'
import {
  useBlogState,
  BLOG_WIDTH_PX,
  type BlogActivitySection,
  type BlogWidthPreset,
} from '../composables/useBlogState'

const {
  site,
  page,
  themeCfg,
  posts,
  currentPath,
  currentPost,
  layoutKind,
  adjacentPosts,
  openTabs,
  isPhone,
  isDual,
  activitySection,
  leftWidth,
  rightWidth,
  leftShown,
  rightShown,
  dualSideRatio,
  fontSize,
  lineHeight,
  fontFamily,
  widthPreset,
  mobileDrawerOpen,
  mobileDockDetent,
  mobileNavDirection,
  readingProgress,
  headings,
  activeHeadingId,
  ensureHydrated,
  openPath,
  closeTab,
  closeOtherTabs,
  setActivitySection,
  toggleLeftPanel,
  toggleRightPanel,
  setLeftWidth,
  setRightWidth,
  setDualSideRatio,
  setFontSize,
  setWidthPreset,
  saveScroll,
  getScroll,
} = useBlogState()

const {
  resolvedTheme,
  accentScheme,
  activePalette,
  activeLightBgHex,
  activeDarkBgHex,
  toggleTheme,
  toggleAccent,
} = useThemeMode()
const { isWidthMorphing, runWidthTransition } = useWidthTransition()

const scrollRef = ref<InstanceType<typeof VlScrollArea> | null>(null)

const topActivityItems = computed<ActivityBarItem[]>(() => [
  { id: 'explorer', icon: 'files', label: '内容目录' },
  { id: 'search', icon: 'search', label: '搜索文章' },
  { id: 'archive', icon: 'tag', label: '分类与标签' },
])

const bottomActivityItems = computed<ActivityBarItem[]>(() => {
  const list: ActivityBarItem[] = []
  if (!isPhone.value) {
    list.push({
      id: 'right-outline',
      icon: 'panel-right',
      label: '大纲与信息',
      tone: 'secondary',
      active: rightShown.value,
    })
  }
  list.push({ id: 'settings', icon: 'settings', label: '外观与阅读设置' })
  return list
})

const widthOptions: SegmentOption<BlogWidthPreset>[] = [
  { value: 'narrow', label: '窄' },
  { value: 'standard', label: '标准' },
  { value: 'wide', label: '宽' },
]

const mobileDockItems = computed<BottomDockItem[]>(() => [
  { id: '/', label: '首页', icon: 'home' },
  { id: '/archive', label: '归档', icon: 'archive' },
  { id: '/about', label: '关于', icon: 'user' },
])

const activeMobileNav = computed(() => {
  const match = mobileDockItems.value.find((item) => item.id === currentPath.value)
  return match ? match.id : '/'
})

const mobileTransitionName = computed(() =>
  mobileNavDirection.value === 'left' ? 'dock-slide-left' : 'dock-slide-right',
)

const useMobileDockSheet = computed(() => {
  const mode = themeCfg.value.mobileBottomMode ?? 'unified'
  return mode !== 'nav-dock'
})

const breadcrumbItems = computed(() => {
  const items: { label: string; to?: string; active?: boolean }[] = [
    { label: themeCfg.value.brandTitle ?? site.value.title, to: '/' },
  ]
  if (layoutKind.value === 'archive') {
    items.push({ label: '时间线归档', active: true })
  } else if (layoutKind.value === 'doc') {
    if (currentPost.value?.category) {
      items.push({ label: currentPost.value.category, to: '/archive' })
    }
    items.push({ label: currentPost.value?.title ?? page.value.title ?? currentPath.value, active: true })
  } else if (layoutKind.value === '404') {
    items.push({ label: '404', active: true })
  } else {
    items.push({ label: '全部文章', active: true })
  }
  return items
})

const centerPillText = computed(() => {
  if (currentPost.value) return `${currentPost.value.category ?? 'POST'} / ${currentPost.value.title}`
  if (layoutKind.value === 'archive') return `归档 · ${posts.value.length} 篇文章`
  return `${themeCfg.value.brandTitle ?? site.value.title} · ${posts.value.length} 篇`
})

const canvasMaxWidth = computed(() => {
  if (layoutKind.value === 'home' || layoutKind.value === 'archive') return '1040px'
  return `${BLOG_WIDTH_PX[widthPreset.value]}px`
})

function onActivitySelect(item: ActivityBarItem) {
  if (item.id === 'right-outline') {
    toggleRightPanel()
    return
  }
  setActivitySection(item.id as BlogActivitySection)
}

function collectHeadings() {
  const vp = scrollRef.value?.getViewport()
  if (!vp) {
    headings.value = []
    return
  }
  const els = Array.from(vp.querySelectorAll<HTMLElement>('.vp-doc h2, .vp-doc h3'))
  headings.value = els
    .filter((el) => Boolean(el.id))
    .map((el) => ({
      id: el.id,
      title: (el.textContent || '').replace(/^\s*#\s*/, '').trim(),
      level: Number(el.tagName.slice(1)) || 2,
    }))
  activeHeadingId.value = headings.value[0]?.id ?? ''
}

function handleCanvasScroll(vp: HTMLElement) {
  saveScroll(currentPath.value, vp.scrollTop)
  const maxScroll = vp.scrollHeight - vp.clientHeight
  readingProgress.value =
    maxScroll <= 1 ? (vp.scrollTop > 0 ? 100 : 0) : Math.min(100, Math.max(0, (vp.scrollTop / maxScroll) * 100))

  if (headings.value.length > 0) {
    const vpTop = vp.getBoundingClientRect().top
    let current = headings.value[0]?.id ?? ''
    for (const h of headings.value) {
      const el = vp.querySelector<HTMLElement>(`#${CSS.escape(h.id)}`)
      if (el && el.getBoundingClientRect().top - vpTop <= 96) {
        current = h.id
      }
    }
    activeHeadingId.value = current
  }
}

function jumpToHeading(id: string) {
  const vp = scrollRef.value?.getViewport()
  if (!vp) return
  const target = vp.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  if (isPhone.value) {
    mobileDrawerOpen.value = false
    mobileDockDetent.value = 'docked'
  }
}

function changeWidthPreset(next: BlogWidthPreset) {
  if (next === widthPreset.value) return
  runWidthTransition(() => setWidthPreset(next), {
    getScroller: () => scrollRef.value?.getViewport() ?? null,
    getWidthPx: () => BLOG_WIDTH_PX[widthPreset.value],
    getNextWidthPx: () => BLOG_WIDTH_PX[next],
    paragraphSelector: '.vp-doc p',
  })
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    if (e.shiftKey) toggleRightPanel()
    else toggleLeftPanel()
  }
}

watch(currentPath, async (next, prev) => {
  const vp = scrollRef.value?.getViewport()
  if (vp && prev) saveScroll(prev, vp.scrollTop)
  await nextTick()
  const newVp = scrollRef.value?.getViewport()
  if (newVp) {
    newVp.scrollTop = getScroll(next)
    handleCanvasScroll(newVp)
  }
  collectHeadings()
  scrollRef.value?.syncMetrics()
})

onMounted(async () => {
  ensureHydrated()
  await nextTick()
  collectHeadings()
  const vp = scrollRef.value?.getViewport()
  if (vp) handleCanvasScroll(vp)
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <!-- ==================== MOBILE PUSH-DRAWER + DOCK / DOCK-TO-SHEET ==================== -->
  <VlPushDrawer
    v-if="isPhone"
    :open="mobileDrawerOpen"
    @update:open="mobileDrawerOpen = $event"
  >
    <template #drawer>
      <VlActivityBar
        :items="topActivityItems"
        :bottom-items="bottomActivityItems"
        :model-value="activitySection"
        mobile
        @select="onActivitySelect"
      />
      <div class="mobile-drawer-panel">
        <VpSidebarPanel />
      </div>
    </template>

    <VlTitleBar
      mode="mobile"
      :brand-name="themeCfg.brandTitle ?? site.title"
      :center-text="centerPillText"
      center-active
      :left-active="mobileDrawerOpen"
      :right-active="mobileDockDetent !== 'docked'"
      :show-right-toggle="useMobileDockSheet"
      @toggle-left="toggleLeftPanel"
      @toggle-right="toggleRightPanel"
    />

    <div class="mobile-stage-host">
      <VlProgress v-if="layoutKind === 'doc'" :value="readingProgress" :height="3" />

      <VlScrollArea
        ref="scrollRef"
        class="center-scroll"
        @scroll="handleCanvasScroll"
      >
        <Transition :name="mobileTransitionName" mode="out-in">
          <div
            :key="currentPath"
            class="center-canvas mobile"
            :style="{
              maxWidth: '100%',
              '--reader-font-size': `${fontSize}px`,
              '--reader-line-height': `${lineHeight}`,
            }"
          >
            <VpBlogHome v-if="layoutKind === 'home'" />
            <VpBlogArchive v-else-if="layoutKind === 'archive'" />
            <VpNotFound v-else-if="layoutKind === '404'" />
            <article v-else class="blog-doc-article">
              <slot name="doc-before" />
              <VpBlogPostHeader />
              <div class="vp-doc vl-prose" :class="`font-${fontFamily}`">
                <Content />
              </div>
              <slot name="doc-after" />
            </article>
          </div>
        </Transition>
      </VlScrollArea>

      <!-- 2-in-1 Floating Nav + Dock-to-Sheet (always keeps nav bar accessible across Home / Archive / About / Posts) -->
      <VlDockSheet
        v-if="useMobileDockSheet"
        :detent="mobileDockDetent"
        :nav-items="mobileDockItems"
        :active-nav="activeMobileNav"
        :title="layoutKind === 'doc' ? '大纲与快捷调节' : '外观与快捷导航'"
        :badge="layoutKind === 'doc' && headings.length ? `${headings.length} 节` : activePalette.name"
        :icon="layoutKind === 'doc' ? 'book' : 'palette'"
        @update:detent="mobileDockDetent = $event"
        @update:active-nav="openPath"
      >
        <template #dock-right>
          <VlBadge v-if="layoutKind === 'doc'" tone="primary" size="xs">
            {{ Math.round(readingProgress) }}%
          </VlBadge>
        </template>

        <div class="mobile-sheet-content">
          <div class="mobile-quick-prefs">
            <VlStepper
              :model-value="fontSize"
              :min="14"
              :max="24"
              :step="1"
              :precision="0"
              label="阅读字号"
              :hint="`${fontSize} px`"
              @update:model-value="setFontSize"
            />
          </div>
          <div class="mobile-quick-prefs">
            <VlPalettePicker compact />
          </div>
          <slot name="dock-sheet-body">
            <VpRightOutline v-if="layoutKind === 'doc'" @jump-heading="jumpToHeading" />
          </slot>
        </div>
      </VlDockSheet>

      <VlBottomDock
        v-else
        :model-value="activeMobileNav"
        :items="mobileDockItems"
        variant="capsule"
        @update:model-value="openPath"
      />
    </div>
  </VlPushDrawer>

  <!-- ==================== DESKTOP / DUAL-PANE 3-PANEL WORKBENCH ==================== -->
  <div v-else class="vp-workbench-shell shape-rect">
    <VlTitleBar
      :mode="isDual ? 'tablet' : 'desktop'"
      :brand-name="themeCfg.brandTitle ?? site.title"
      :brand-tag="themeCfg.brandTag ?? 'BLOG'"
      :center-text="centerPillText"
      :center-active="Boolean(currentPost)"
      :left-active="leftShown"
      :right-active="rightShown"
      @toggle-left="toggleLeftPanel"
      @toggle-right="toggleRightPanel"
    >
      <template #right>
        <slot name="titlebar-right" />
        <VlIconButton
          :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
          size="sm"
          tone="neutral"
          morph-on-hover
          title="切换亮色 / 暗色模式"
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
          title="显示/隐藏左侧面板 (Ctrl+B)"
          @click="toggleLeftPanel"
        />
        <VlIconButton
          icon="panel-right"
          size="sm"
          tone="secondary"
          :active="rightShown"
          title="显示/隐藏右侧大纲 (Ctrl+Shift+B)"
          @click="toggleRightPanel"
        />
      </template>
    </VlTitleBar>

    <VlSplitPane
      :left-visible="leftShown"
      :right-visible="rightShown"
      :left-width="leftWidth"
      :right-width="rightWidth"
      :dual-mode="isDual"
      :dual-side-ratio="dualSideRatio"
      @update:left-width="setLeftWidth"
      @update:right-width="setRightWidth"
      @update:dual-side-ratio="setDualSideRatio"
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
        <VpSidebarPanel />
      </template>

      <template #center>
        <VlTabBar
          v-if="themeCfg.enableTabs !== false"
          :tabs="openTabs"
          :active-id="currentPath"
          @select="openPath"
          @close="closeTab"
        >
          <template v-if="openTabs.length > 1" #actions>
            <VlButton size="xs" shape="pill" @click="closeOtherTabs(currentPath)">
              清理标签
            </VlButton>
          </template>
        </VlTabBar>

        <VlBreadcrumb
          :items="breadcrumbItems"
          @navigate="(item) => item.to && openPath(item.to)"
        >
          <template #trailing>
            <span v-if="currentPost?.wordCount" class="doc-stat">
              {{ currentPost.wordCount.toLocaleString() }} 字 · 约 {{ currentPost.readingMinutes ?? 3 }} 分钟
            </span>
            <VlSegmentedControl
              v-if="layoutKind === 'doc'"
              :model-value="widthPreset"
              :options="widthOptions"
              size="sm"
              surface="surface"
              aria-label="版心宽度"
              @update:model-value="changeWidthPreset"
            />
          </template>
        </VlBreadcrumb>

        <VlProgress v-if="layoutKind === 'doc'" :value="readingProgress" :height="3" />

        <VlScrollArea
          ref="scrollRef"
          class="center-scroll"
          :class="{ 'vt-width-target': isWidthMorphing }"
          @scroll="handleCanvasScroll"
        >
          <div
            class="center-canvas"
            :style="{
              maxWidth: canvasMaxWidth,
              '--reader-font-size': `${fontSize}px`,
              '--reader-line-height': `${lineHeight}`,
            }"
          >
            <VpBlogHome v-if="layoutKind === 'home'">
              <template #home-hero-after>
                <slot name="home-hero-after" />
              </template>
            </VpBlogHome>
            <VpBlogArchive v-else-if="layoutKind === 'archive'" />
            <VpNotFound v-else-if="layoutKind === '404'" />
            <article v-else class="blog-doc-article">
              <slot name="doc-before" />
              <VpBlogPostHeader />
              <div class="vp-doc vl-prose" :class="`font-${fontFamily}`">
                <Content />
              </div>
              <slot name="doc-after" />

              <!-- Prev / Next Post Pager -->
              <nav
                v-if="adjacentPosts.prev || adjacentPosts.next"
                class="post-pager shape-rect"
                aria-label="上下篇导航"
              >
                <button
                  v-if="adjacentPosts.prev"
                  type="button"
                  class="pager-btn shape-pill"
                  @click="openPath(adjacentPosts.prev.url)"
                >
                  <VlIcon name="arrow-left" :size="14" />
                  <span class="pager-text">
                    <small>上一篇</small>
                    <strong>{{ adjacentPosts.prev.title }}</strong>
                  </span>
                </button>
                <div v-else />

                <button
                  v-if="adjacentPosts.next"
                  type="button"
                  class="pager-btn shape-pill"
                  @click="openPath(adjacentPosts.next.url)"
                >
                  <span class="pager-text align-right">
                    <small>下一篇</small>
                    <strong>{{ adjacentPosts.next.title }}</strong>
                  </span>
                  <VlIcon name="arrow-right" :size="14" />
                </button>
              </nav>
            </article>
          </div>
        </VlScrollArea>
      </template>

      <template #right>
        <VpRightOutline @jump-heading="jumpToHeading">
          <template #right-panel-after>
            <slot name="right-panel-after" />
          </template>
        </VpRightOutline>
      </template>
    </VlSplitPane>

    <VlStatusBar :brand="themeCfg.brandTitle ?? site.title">
      <template #left>
        <VlBadge tone="secondary" size="xs">{{ posts.length }} 篇文章</VlBadge>
        <span class="status-mono">{{ currentPath }}</span>
        <span v-if="themeCfg.footerNote" class="status-muted">{{ themeCfg.footerNote }}</span>
      </template>
      <template #right>
        <VlBadge v-if="layoutKind === 'doc'" tone="primary" size="xs">
          进度 {{ Math.round(readingProgress) }}%
        </VlBadge>
        <span class="status-muted">{{ fontSize }}px</span>
        <span class="status-theme">
          <span class="status-dot shape-circle" />
          {{ resolvedTheme === 'light' ? `亮色 ${activeLightBgHex}` : `暗色 ${activeDarkBgHex}` }}
        </span>
      </template>
    </VlStatusBar>
  </div>

  <VlToast />
</template>

<style scoped>
.vp-workbench-shell {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-base);
}

.mobile-drawer-panel {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.mobile-stage-host {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.center-scroll {
  flex: 1;
  min-height: 0;
  background-color: var(--bg-base);
}

.center-scroll.vt-width-target {
  view-transition-name: reader-column;
}

.center-canvas {
  width: 100%;
  margin: 0 auto;
  padding: 28px 32px 84px 32px;
}

.center-canvas.mobile {
  padding: 18px 16px calc(144px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px))) 16px;
}

.doc-stat {
  font-size: var(--ui-font-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.mobile-sheet-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-quick-prefs {
  padding: 10px 12px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--divider-hairline);
}

.post-pager {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--divider-hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pager-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background-color: var(--bg-surface);
  color: var(--text-primary);
  max-width: 48%;
  transition: background-color 0.2s var(--ease-nonlinear), color 0.2s var(--ease-nonlinear);
}

.pager-btn:hover {
  background-color: var(--accent-primary);
  color: var(--accent-primary-ink);
}

.pager-btn:hover small {
  color: var(--accent-primary-ink);
  opacity: 0.85;
}

.pager-text {
  display: flex;
  flex-direction: column;
  text-align: left;
  min-width: 0;
}

.pager-text.align-right {
  text-align: right;
}

.pager-text small {
  font-size: var(--ui-font-xs);
  color: var(--text-muted);
  font-weight: 700;
}

.pager-text strong {
  font-size: var(--ui-font-md);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-mono {
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.status-muted {
  color: var(--text-muted);
}

.status-theme {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background-color: var(--accent-primary);
}
</style>
