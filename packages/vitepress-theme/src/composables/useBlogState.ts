import { ref, computed, watch } from 'vue'
import { useData, useRoute, useRouter, withBase } from 'vitepress'
import {
  useViewportTier,
  type TabBarItem,
  type IconName,
} from '@valance-ui/vue'
import type { BlogPostMeta, ValanceThemeConfig, ValanceThemeOptions } from '../types'

export type BlogActivitySection = 'explorer' | 'search' | 'archive' | 'settings'
export type BlogFontFamily = 'serif' | 'sans'
export type BlogWidthPreset = 'narrow' | 'standard' | 'wide'
export type DockDetent = 'docked' | 'half' | 'full'

export interface HeadingItem {
  id: string
  title: string
  level: number
}

export const BLOG_WIDTH_PX: Record<BlogWidthPreset, number> = {
  narrow: 660,
  standard: 780,
  wide: 960,
}

export const DEFAULT_LEFT_WIDTH = 286
export const DEFAULT_RIGHT_WIDTH = 268

interface PersistedBlogPrefs {
  fontSize: number
  lineHeight: number
  fontFamily: BlogFontFamily
  widthPreset: BlogWidthPreset
  leftWidth: number
  rightWidth: number
  leftVisible: boolean
  rightVisible: boolean
  dualSideRatio: number
}

const injectedOptions = ref<ValanceThemeOptions>({})
let activeBaseUrl: string | null = null

export function setThemeOptions(options: ValanceThemeOptions): void {
  injectedOptions.value = options
}

export function normalizeBlogPath(raw: string, baseUrl?: string): string {
  let p = raw.split('?')[0]?.split('#')[0] ?? '/'
  try {
    p = decodeURI(p)
  } catch {
    // ignore malformed URI
  }
  const resolvedBase = baseUrl ?? activeBaseUrl ?? (import.meta.env.BASE_URL || '/')
  const base = resolvedBase.replace(/\/+$/, '')
  while (base && base !== '/' && (p === base || p.startsWith(`${base}/`))) {
    p = p.slice(base.length) || '/'
  }
  if (p.endsWith('/index.html')) {
    p = p.slice(0, -10) || '/'
  } else if (p.endsWith('.html')) {
    p = p.slice(0, -5)
  }
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1)
  }
  if (!p.startsWith('/')) {
    p = `/${p}`
  }
  return p
}

// Singleton shared reactive state across VitePress theme components
const activitySection = ref<BlogActivitySection>('explorer')
const openTabPaths = ref<string[]>(['/'])
const leftWidth = ref(DEFAULT_LEFT_WIDTH)
const rightWidth = ref(DEFAULT_RIGHT_WIDTH)
const leftVisible = ref(true)
const rightVisible = ref(true)
const dualSide = ref<'left' | 'right' | 'none'>('left')
const dualSideRatio = ref(0.36)

const fontSize = ref(17)
const lineHeight = ref(1.85)
const fontFamily = ref<BlogFontFamily>('sans')
const widthPreset = ref<BlogWidthPreset>('standard')

const searchQuery = ref('')
const selectedTag = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)

const mobileDrawerOpen = ref(false)
const mobileDockDetent = ref<DockDetent>('docked')
const mobileNavDirection = ref<'left' | 'right'>('left')

const readingProgress = ref(0)
const headings = ref<HeadingItem[]>([])
const activeHeadingId = ref('')

const scrollPositions = new Map<string, number>()
let hydrated = false

export function useBlogState() {
  const { site, page, frontmatter, theme } = useData<ValanceThemeConfig>()
  const route = useRoute()
  const router = useRouter()

  if (site.value?.base) {
    activeBaseUrl = site.value.base
  }
  watch(
    () => site.value?.base,
    (nextBase) => {
      if (nextBase) activeBaseUrl = nextBase
    },
  )

  const normPath = (raw: string) => normalizeBlogPath(raw, site.value?.base)

  const { viewportWidth, tier, isPhone, isDual, isDesktop } = useViewportTier({
    phoneMaxWidth: 768,
    dualMaxWidth: 1080,
  })

  const themeCfg = computed<ValanceThemeConfig>(() => ({
    ...(theme.value ?? {}),
    ...(injectedOptions.value.config ?? {}),
  }))

  const storagePrefix = computed(() => themeCfg.value.storagePrefix ?? 'vl-blog')

  const posts = computed<BlogPostMeta[]>(() => {
    const raw = injectedOptions.value.posts ?? themeCfg.value.posts ?? []
    return [...raw].sort((a, b) => {
      const da = Date.parse(a.date || '') || 0
      const db = Date.parse(b.date || '') || 0
      return db - da
    })
  })

  const postsByUrl = computed<Record<string, BlogPostMeta>>(() => {
    const map: Record<string, BlogPostMeta> = {}
    for (const p of posts.value) {
      map[normPath(p.url)] = p
    }
    return map
  })

  const currentPath = computed(() => normPath(route.path))
  const currentPost = computed<BlogPostMeta | null>(
    () => postsByUrl.value[currentPath.value] ?? null,
  )

  const layoutKind = computed<'home' | 'archive' | 'doc' | '404'>(() => {
    if (page.value.isNotFound) return '404'
    const fmLayout = frontmatter.value?.layout
    if (fmLayout === 'home') return 'home'
    if (fmLayout === 'archive') return 'archive'
    return 'doc'
  })

  const leftShown = computed(() => (isDual.value ? dualSide.value === 'left' : leftVisible.value))
  const rightShown = computed(() => (isDual.value ? dualSide.value === 'right' : rightVisible.value))

  const allCategories = computed(() => {
    const map = new Map<string, number>()
    for (const p of posts.value) {
      const cat = p.category?.trim() || '随笔'
      map.set(cat, (map.get(cat) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  })

  const allTags = computed(() => {
    const map = new Map<string, number>()
    for (const p of posts.value) {
      for (const t of p.tags ?? []) {
        map.set(t, (map.get(t) ?? 0) + 1)
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  const adjacentPosts = computed(() => {
    const idx = posts.value.findIndex((p) => normPath(p.url) === currentPath.value)
    if (idx === -1) return { prev: null as BlogPostMeta | null, next: null as BlogPostMeta | null }
    return {
      prev: idx < posts.value.length - 1 ? posts.value[idx + 1] ?? null : null,
      next: idx > 0 ? posts.value[idx - 1] ?? null : null,
    }
  })

  function resolveTabMeta(path: string): TabBarItem {
    const norm = normPath(path)
    if (norm === '/') {
      return { id: '/', title: '首页', subtitle: 'HOME', icon: 'home', pinned: true }
    }
    if (norm === '/archive') {
      return { id: '/archive', title: '归档', subtitle: 'ARCHIVE', icon: 'archive', tone: 'secondary' }
    }
    if (norm === '/about') {
      return { id: '/about', title: '关于', subtitle: 'ABOUT', icon: 'user' }
    }
    const post = postsByUrl.value[norm]
    if (post) {
      return {
        id: norm,
        title: post.title,
        subtitle: post.category ?? 'POST',
        icon: 'doc',
        tone: 'primary',
      }
    }
    const navMatch = themeCfg.value.nav?.find((n) => normPath(n.link) === norm)
    return {
      id: norm,
      title: navMatch?.text ?? (norm === currentPath.value ? page.value.title || norm : norm),
      subtitle: 'PAGE',
      icon: (navMatch?.icon as IconName | undefined) ?? 'doc',
    }
  }

  const openTabs = computed<TabBarItem[]>(() => openTabPaths.value.map(resolveTabMeta))

  function persist() {
    if (!hydrated || typeof localStorage === 'undefined' || typeof localStorage?.setItem !== 'function') return
    const payload: PersistedBlogPrefs = {
      fontSize: fontSize.value,
      lineHeight: lineHeight.value,
      fontFamily: fontFamily.value,
      widthPreset: widthPreset.value,
      leftWidth: leftWidth.value,
      rightWidth: rightWidth.value,
      leftVisible: leftVisible.value,
      rightVisible: rightVisible.value,
      dualSideRatio: dualSideRatio.value,
    }
    try {
      localStorage.setItem(`${storagePrefix.value}-prefs-v1`, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }

  function ensureHydrated() {
    if (hydrated) return
    hydrated = true
    if (typeof localStorage !== 'undefined' && typeof localStorage?.getItem === 'function') {
      try {
        const raw = localStorage.getItem(`${storagePrefix.value}-prefs-v1`)
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedBlogPrefs>
          if (typeof parsed.fontSize === 'number' && parsed.fontSize >= 14 && parsed.fontSize <= 24) {
            fontSize.value = parsed.fontSize
          }
          if (
            typeof parsed.lineHeight === 'number' &&
            parsed.lineHeight >= 1.5 &&
            parsed.lineHeight <= 2.3
          ) {
            lineHeight.value = parsed.lineHeight
          }
          if (parsed.fontFamily === 'serif' || parsed.fontFamily === 'sans') {
            fontFamily.value = parsed.fontFamily
          }
          if (
            parsed.widthPreset === 'narrow' ||
            parsed.widthPreset === 'standard' ||
            parsed.widthPreset === 'wide'
          ) {
            widthPreset.value = parsed.widthPreset
          }
          if (typeof parsed.leftWidth === 'number' && parsed.leftWidth >= 230 && parsed.leftWidth <= 500) {
            leftWidth.value = parsed.leftWidth
          }
          if (typeof parsed.rightWidth === 'number' && parsed.rightWidth >= 220 && parsed.rightWidth <= 480) {
            rightWidth.value = parsed.rightWidth
          }
          if (typeof parsed.leftVisible === 'boolean') leftVisible.value = parsed.leftVisible
          if (typeof parsed.rightVisible === 'boolean') rightVisible.value = parsed.rightVisible
          if (typeof parsed.dualSideRatio === 'number') dualSideRatio.value = parsed.dualSideRatio
        }
      } catch {
        // ignore
      }
    }
    const norm = currentPath.value
    if (!openTabPaths.value.includes(norm)) {
      openTabPaths.value = [...openTabPaths.value, norm]
    }
  }

  function getNavOrderIndex(path: string): number {
    const norm = normPath(path)
    const navLinks = (themeCfg.value.nav ?? []).map((n) => normPath(n.link))
    const list = navLinks.length ? navLinks : ['/', '/archive', '/about']
    const idx = list.indexOf(norm)
    if (idx !== -1) return idx
    if (norm.startsWith('/posts')) return list.length
    return list.length + 1
  }

  function updateMobileDirection(prevPath: string, nextPath: string) {
    const fromIdx = getNavOrderIndex(prevPath)
    const toIdx = getNavOrderIndex(nextPath)
    mobileNavDirection.value = toIdx >= fromIdx ? 'left' : 'right'
  }

  async function openPath(path: string) {
    const norm = normPath(path)
    updateMobileDirection(currentPath.value, norm)
    if (!openTabPaths.value.includes(norm)) {
      openTabPaths.value = [...openTabPaths.value, norm]
    }
    if (isPhone.value) {
      mobileDrawerOpen.value = false
      mobileDockDetent.value = 'docked'
    }
    if (currentPath.value !== norm) {
      await router.go(withBase(norm === '/' ? '/' : norm))
    }
  }

  async function closeTab(path: string) {
    const norm = normPath(path)
    if (norm === '/') return
    const idx = openTabPaths.value.indexOf(norm)
    if (idx === -1) return
    const next = openTabPaths.value.filter((p) => p !== norm)
    openTabPaths.value = next.length ? next : ['/']
    scrollPositions.delete(norm)
    if (currentPath.value === norm) {
      const target = openTabPaths.value[Math.min(idx, openTabPaths.value.length - 1)] ?? '/'
      await router.go(withBase(target))
    }
  }

  async function closeOtherTabs(keepPath: string) {
    const norm = normPath(keepPath)
    openTabPaths.value = norm === '/' ? ['/'] : ['/', norm]
    if (currentPath.value !== norm) {
      await router.go(withBase(norm))
    }
  }

  function setActivitySection(sec: BlogActivitySection) {
    if (isPhone.value) {
      activitySection.value = sec
      mobileDrawerOpen.value = true
      mobileDockDetent.value = 'docked'
      return
    }
    if (isDual.value) {
      if (activitySection.value === sec && dualSide.value === 'left') {
        dualSide.value = 'none'
      } else {
        activitySection.value = sec
        dualSide.value = 'left'
      }
      return
    }
    if (activitySection.value === sec && leftVisible.value) {
      leftVisible.value = false
    } else {
      activitySection.value = sec
      leftVisible.value = true
    }
    persist()
  }

  function toggleLeftPanel() {
    if (isPhone.value) {
      mobileDrawerOpen.value = !mobileDrawerOpen.value
      if (mobileDrawerOpen.value) mobileDockDetent.value = 'docked'
      return
    }
    if (isDual.value) {
      dualSide.value = dualSide.value === 'left' ? 'none' : 'left'
      return
    }
    leftVisible.value = !leftVisible.value
    persist()
  }

  function toggleRightPanel() {
    if (isPhone.value) {
      mobileDockDetent.value = mobileDockDetent.value === 'docked' ? 'half' : 'docked'
      if (mobileDockDetent.value !== 'docked') mobileDrawerOpen.value = false
      return
    }
    if (isDual.value) {
      dualSide.value = dualSide.value === 'right' ? 'none' : 'right'
      return
    }
    rightVisible.value = !rightVisible.value
    persist()
  }

  function setLeftWidth(w: number) {
    leftWidth.value = w
    persist()
  }

  function setRightWidth(w: number) {
    rightWidth.value = w
    persist()
  }

  function setDualSideRatio(r: number) {
    dualSideRatio.value = r
    persist()
  }

  function setFontSize(val: number) {
    fontSize.value = Math.max(14, Math.min(24, val))
    persist()
  }

  function setLineHeight(val: number) {
    lineHeight.value = Math.round(Math.max(1.5, Math.min(2.3, val)) * 100) / 100
    persist()
  }

  function setFontFamily(f: BlogFontFamily) {
    fontFamily.value = f
    persist()
  }

  function setWidthPreset(w: BlogWidthPreset) {
    widthPreset.value = w
    persist()
  }

  function resetLayout() {
    leftWidth.value = DEFAULT_LEFT_WIDTH
    rightWidth.value = DEFAULT_RIGHT_WIDTH
    leftVisible.value = true
    rightVisible.value = true
    dualSideRatio.value = 0.36
    dualSide.value = 'left'
    persist()
  }

  function saveScroll(path: string, top: number) {
    scrollPositions.set(normPath(path), top)
  }

  function getScroll(path: string): number {
    return scrollPositions.get(normPath(path)) ?? 0
  }

  watch(currentPath, (next, prev) => {
    if (prev && prev !== next) {
      updateMobileDirection(prev, next)
    }
    if (!openTabPaths.value.includes(next)) {
      openTabPaths.value = [...openTabPaths.value, next]
    }
    if (isPhone.value) {
      mobileDrawerOpen.value = false
      mobileDockDetent.value = 'docked'
    }
  })

  return {
    site,
    page,
    frontmatter,
    themeCfg,
    posts,
    postsByUrl,
    currentPath,
    currentPost,
    layoutKind,
    adjacentPosts,
    allCategories,
    allTags,
    openTabs,
    viewportWidth,
    tier,
    isPhone,
    isDual,
    isDesktop,
    activitySection,
    leftWidth,
    rightWidth,
    leftVisible,
    rightVisible,
    leftShown,
    rightShown,
    dualSideRatio,
    fontSize,
    lineHeight,
    fontFamily,
    widthPreset,
    searchQuery,
    selectedTag,
    selectedCategory,
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
    resetLayout,
    saveScroll,
    getScroll,
  }
}
