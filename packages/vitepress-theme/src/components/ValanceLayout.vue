<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  markRaw,
  shallowReactive,
  type Component,
  type ComponentPublicInstance,
} from 'vue'
import { Content, useRoute } from 'vitepress'
import {
  VlActivityBar,
  VlBackTop,
  VlBadge,
  VlBottomDock,
  VlBreadcrumb,
  VlButton,
  VlCommandPalette,
  VlDockSheet,
  VlIcon,
  VlIconButton,
  VlPalettePicker,
  VlProgress,
  VlPushDrawer,
  VlScrollArea,
  VlSegmentedControl,
  VlSnapPager,
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
  type CommandPaletteItem,
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
  normalizeBlogPath,
  BLOG_WIDTH_PX,
  type BlogActivitySection,
  type BlogFontFamily,
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
  setLineHeight,
  setFontFamily,
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
const route = useRoute()

const scrollRef = ref<InstanceType<typeof VlScrollArea> | null>(null)
const desktopVp = ref<HTMLElement | null>(null)
const cmdPaletteOpen = ref(false)

const pageScrollRefs: Record<string, InstanceType<typeof VlScrollArea> | null> = {}
const docComponents = shallowReactive<Record<string, Component>>({})
const docNotFoundPaths = shallowReactive<Record<string, boolean>>({})

function setPageScrollRef(path: string, el: Element | ComponentPublicInstance | null) {
  pageScrollRefs[path] = (el as InstanceType<typeof VlScrollArea> | null) ?? null
}

function captureCurrentRoute() {
  const norm = currentPath.value
  if (layoutKind.value === '404') {
    docNotFoundPaths[norm] = true
    return
  }
  delete docNotFoundPaths[norm]
  if (layoutKind.value === 'doc' && route.component) {
    docComponents[norm] = markRaw(route.component)
  }
}

watch(
  [currentPath, layoutKind, () => route.component],
  () => {
    captureCurrentRoute()
  },
  { immediate: true },
)

function getActiveScrollArea(): InstanceType<typeof VlScrollArea> | null {
  return isPhone.value ? (pageScrollRefs[currentPath.value] ?? null) : scrollRef.value
}

function getActiveViewport(): HTMLElement | null {
  return getActiveScrollArea()?.getViewport() ?? null
}

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

const fontOptions: SegmentOption<BlogFontFamily>[] = [
  { value: 'sans', label: '无衬线' },
  { value: 'serif', label: '衬线体' },
]

const mobileDockItems = computed<BottomDockItem[]>(() => [
  { id: '/', label: '首页', icon: 'home' },
  { id: '/archive', label: '归档', icon: 'archive' },
  { id: '/about', label: '关于', icon: 'user' },
])

const mobileDockIds = computed(() => mobileDockItems.value.map((item) => item.id))

const activeMobileNav = computed(() => {
  const match = mobileDockItems.value.find((item) => item.id === currentPath.value)
  return match ? match.id : '/'
})

const mobilePagerDirection = computed<'next' | 'prev'>(() =>
  mobileNavDirection.value === 'left' ? 'next' : 'prev',
)

const useMobileDockSheet = computed(() => {
  const mode = themeCfg.value.mobileBottomMode ?? 'unified'
  return mode !== 'nav-dock'
})

const commandItems = computed<CommandPaletteItem[]>(() => {
  const items: CommandPaletteItem[] = [
    { id: '/', label: '首页文章', subtitle: '全部文章与筛选看板', group: '站点导航', icon: 'home', badge: `${posts.value.length} 篇` },
    { id: '/archive', label: '时间线归档', subtitle: '按年份与标签索引浏览', group: '站点导航', icon: 'archive' },
    { id: '/about', label: '关于模板', subtitle: '主题架构、配置与使用指南', group: '站点导航', icon: 'user' },
    ...posts.value.map((post) => ({
      id: normalizeBlogPath(post.url),
      label: post.title,
      subtitle: `${post.category ?? '随笔'} · ${post.dateText ?? post.date}`,
      excerpt: post.excerpt,
      group: '文章目录',
      icon: 'doc' as const,
      badge: post.readingMinutes ? `${post.readingMinutes}m` : undefined,
      keywords: [...(post.tags ?? []), post.category ?? '', post.plainText?.slice(0, 180) ?? ''],
    })),
    {
      id: 'action:theme',
      label: resolvedTheme.value === 'dark' ? '切换为亮色暖纸 (#FDFCF9)' : '切换为暗色炭岩 (#273033)',
      subtitle: '圆形扩散明暗切换',
      group: '快捷指令',
      icon: resolvedTheme.value === 'dark' ? 'sun' : 'moon',
    },
    {
      id: 'action:accent',
      label: accentScheme.value === 'default' ? '对调主辅主题色（主青辅橘）' : '恢复默认主题色（主橘辅青）',
      subtitle: `当前调色板：${activePalette.value.name}`,
      group: '快捷指令',
      icon: 'palette',
    },
  ]
  if (!isPhone.value) {
    items.push(
      {
        id: 'action:toggle-left',
        label: leftShown.value ? '收起左侧目录面板' : '展开左侧目录面板',
        group: '快捷指令',
        icon: 'panel-left',
        shortcut: 'Ctrl+B',
      },
      {
        id: 'action:toggle-right',
        label: rightShown.value ? '收起右侧大纲面板' : '展开右侧大纲面板',
        group: '快捷指令',
        icon: 'panel-right',
        shortcut: 'Ctrl+Shift+B',
      },
    )
  }
  return items
})

function onCommandSelect(item: CommandPaletteItem) {
  if (item.id === 'action:theme') {
    toggleTheme()
    return
  }
  if (item.id === 'action:accent') {
    toggleAccent()
    return
  }
  if (item.id === 'action:toggle-left') {
    toggleLeftPanel()
    return
  }
  if (item.id === 'action:toggle-right') {
    toggleRightPanel()
    return
  }
  openPath(item.id)
}

function getAdjacentForPath(path: string) {
  const norm = normalizeBlogPath(path)
  const idx = posts.value.findIndex((p) => normalizeBlogPath(p.url) === norm)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx < posts.value.length - 1 ? posts.value[idx + 1] ?? null : null,
    next: idx > 0 ? posts.value[idx - 1] ?? null : null,
  }
}

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
  const vp = getActiveViewport()
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
  const vp = getActiveViewport()
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
  if (!isPhone.value) {
    const vp = scrollRef.value?.getViewport()
    if (vp && prev) saveScroll(prev, vp.scrollTop)
  }
  await nextTick()
  const activeArea = getActiveScrollArea()
  const newVp = activeArea?.getViewport() ?? null
  if (newVp) {
    if (!isPhone.value) {
      newVp.scrollTop = getScroll(next)
    }
    handleCanvasScroll(newVp)
  }
  if (!isPhone.value) {
    desktopVp.value = newVp
  }
  collectHeadings()
  activeArea?.syncMetrics()
})

watch(isPhone, async () => {
  await nextTick()
  desktopVp.value = isPhone.value ? null : (scrollRef.value?.getViewport() ?? null)
  collectHeadings()
})

onMounted(async () => {
  ensureHydrated()
  captureCurrentRoute()
  await nextTick()
  const activeArea = getActiveScrollArea()
  const vp = activeArea?.getViewport() ?? null
  if (!isPhone.value) {
    desktopVp.value = vp
  }
  collectHeadings()
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
  <!-- ==================== MOBILE PUSH-DRAWER + 120HZ SNAP PAGER + DOCK-TO-SHEET ==================== -->
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
      @toggle-left="toggleLeftPanel"
      @toggle-right="toggleRightPanel"
    >
      <template #right>
        <div class="mobile-tb-actions">
          <VlIconButton
            icon="search"
            size="sm"
            morph-on-hover
            title="快速搜索文章 (Ctrl+K)"
            @click="cmdPaletteOpen = true"
          />
          <VlIconButton
            :icon="resolvedTheme === 'dark' ? 'sun' : 'moon'"
            size="sm"
            morph-on-hover
            title="切换亮暗模式"
            @click="toggleTheme($event)"
          />
        </div>
      </template>
    </VlTitleBar>

    <div class="mobile-stage-host">
      <VlProgress v-if="layoutKind === 'doc'" :value="readingProgress" :height="3" />

      <VlSnapPager
        class="center-scroll"
        :model-value="currentPath"
        :pages="mobileDockIds"
        :direction="mobilePagerDirection"
        transition="fade"
        aria-label="移动端博客分页"
      >
        <template #default="{ pageId }">
          <VlScrollArea
            :ref="(el) => setPageScrollRef(pageId, el)"
            class="center-scroll"
            @scroll="(vp) => pageId === currentPath && handleCanvasScroll(vp)"
          >
            <div
              class="center-canvas mobile"
              :style="{
                maxWidth: '100%',
                '--reader-font-size': `${fontSize}px`,
                '--reader-line-height': `${lineHeight}`,
              }"
            >
              <VpBlogHome v-if="pageId === '/'" />
              <VpBlogArchive v-else-if="pageId === '/archive'" />
              <VpNotFound v-else-if="docNotFoundPaths[pageId]" />
              <article v-else class="blog-doc-article">
                <slot v-if="pageId === currentPath" name="doc-before" />
                <VpBlogPostHeader :post-path="pageId" />
                <div class="vp-doc vl-prose" :class="`font-${fontFamily}`">
                  <component :is="docComponents[pageId]" v-if="docComponents[pageId]" />
                  <Content v-else-if="pageId === currentPath" />
                </div>
                <slot v-if="pageId === currentPath" name="doc-after" />

                <nav
                  v-if="getAdjacentForPath(pageId).prev || getAdjacentForPath(pageId).next"
                  class="post-pager mobile shape-rect"
                  aria-label="上下篇导航"
                >
                  <button
                    v-if="getAdjacentForPath(pageId).prev"
                    type="button"
                    class="pager-btn shape-pill"
                    @click="openPath(getAdjacentForPath(pageId).prev!.url)"
                  >
                    <VlIcon name="arrow-left" :size="14" />
                    <span class="pager-text">
                      <small>上一篇</small>
                      <strong>{{ getAdjacentForPath(pageId).prev!.title }}</strong>
                    </span>
                  </button>

                  <button
                    v-if="getAdjacentForPath(pageId).next"
                    type="button"
                    class="pager-btn shape-pill"
                    @click="openPath(getAdjacentForPath(pageId).next!.url)"
                  >
                    <span class="pager-text align-right">
                      <small>下一篇</small>
                      <strong>{{ getAdjacentForPath(pageId).next!.title }}</strong>
                    </span>
                    <VlIcon name="arrow-right" :size="14" />
                  </button>
                </nav>
              </article>
            </div>
          </VlScrollArea>
        </template>
      </VlSnapPager>

      <!-- 2-in-1 Floating Nav + Dock-to-Sheet -->
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
            <div class="mobile-pref-row">
              <span class="mobile-pref-label">阅读字体</span>
              <VlSegmentedControl
                :model-value="fontFamily"
                :options="fontOptions"
                size="sm"
                surface="surface"
                @update:model-value="setFontFamily"
              />
            </div>
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
          icon="search"
          size="sm"
          morph-on-hover
          title="全局搜索与快捷指令 (Ctrl+K)"
          @click="cmdPaletteOpen = true"
        />
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

    <VlBackTop v-if="desktopVp" :target="desktopVp" :bottom-offset="42" />
  </div>

  <VlCommandPalette
    v-model:open="cmdPaletteOpen"
    :items="commandItems"
    placeholder="搜索文章标题、标签、正文或切换主题 (支持正则)…"
    enable-hotkey
    @select="onCommandSelect"
  />
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

.mobile-tb-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  padding: 16px 14px calc(144px + var(--vl-safe-bottom, env(safe-area-inset-bottom, 0px))) 14px;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mobile-pref-label {
  font-size: var(--ui-font-sm);
  font-weight: 700;
  color: var(--text-primary);
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

.post-pager.mobile {
  margin-top: 32px;
  padding-top: 18px;
  flex-direction: column;
  align-items: stretch;
}

.post-pager.mobile .pager-btn {
  max-width: 100%;
  justify-content: space-between;
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
