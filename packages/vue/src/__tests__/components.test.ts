import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  ALL_M3_SHAPES,
  M3_EXPRESSIVE_SHAPES,
  MONET_HARMONY_OPTIONS,
  PRIDE_PALETTES,
  STANDARD_PALETTES,
  VlActivityBar,
  VlAvatar,
  VlBottomDock,
  VlNavRail,
  VlButton,
  VlCalendar,
  VlCommandPalette,
  VlDateTimePicker,
  VlDockSheet,
  VlEmptyState,
  VlIcon,
  VlLineChart,
  VlPalettePicker,
  VlPopconfirm,
  VlProgress,
  VlPullRefresh,
  VlPushDrawer,
  VlSegmentedControl,
  VlSelect,
  VlShape,
  VlSheet,
  VlSideNav,
  VlSnapPager,
  VlStepper,
  VlSteps,
  VlSwitch,
  VlTabs,
  VlTagInput,
  VlTimePicker,
  VlTimeline,
  VlTitleBar,
  generateMonetPalette,
  getAllIconNames,
  hexToHsl,
  morphM3ShapePath,
  relativeLuminance,
  useThemeMode,
  useToast,
  registerBackHandler,
  dispatchBack,
  clearBackHandlers,
} from '../index'

describe('@valance-ui/vue core components', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    if (typeof localStorage === 'undefined' || typeof localStorage?.clear !== 'function') {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = String(v)
          },
          removeItem: (k: string) => {
            delete store[k]
          },
          clear: () => {
            for (const k of Object.keys(store)) delete store[k]
          },
        },
      })
    } else {
      localStorage.clear()
    }
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-accent')
    clearBackHandlers()
  })

  it('renders VlButton variants and shapes', () => {
    const wrapper = mount(VlButton, {
      props: { variant: 'primary', shape: 'morph', icon: 'plus' },
      slots: { default: '新增操作' },
    })
    expect(wrapper.text()).toContain('新增操作')
    expect(wrapper.classes()).toContain('v-primary')
    expect(wrapper.classes()).toContain('s-morph')
  })

  it('renders builtin VlIcon glyphs including genuinely hollow sliders cutout', () => {
    expect(getAllIconNames().length).toBeGreaterThanOrEqual(60)
    const curve = mount(VlIcon, { props: { name: 'curve', size: 20 } })
    expect(curve.find('svg').attributes('width')).toBe('20')
    expect(curve.findAll('path').length).toBeGreaterThan(0)

    const sliders = mount(VlIcon, { props: { name: 'sliders', size: 20 } })
    const circles = sliders.findAll('circle')
    expect(circles.length).toBe(2)
    for (const c of circles) {
      expect(c.attributes('fill')).toBe('none')
    }
    expect(sliders.findAll('line').length).toBe(4)
  })

  it('emits update:modelValue on VlSegmentedControl', async () => {
    const wrapper = mount(VlSegmentedControl, {
      props: {
        modelValue: 'a',
        options: [
          { value: 'a', label: '选项A' },
          { value: 'b', label: '选项B' },
        ],
      },
    })
    const btns = wrapper.findAll('button')
    await btns[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('toggles VlSwitch via click and swipe gesture, and adjusts VlStepper', async () => {
    const sw = mount(VlSwitch, { props: { modelValue: false, label: '开关' } })
    await sw.trigger('click')
    expect(sw.emitted('update:modelValue')?.[0]).toEqual([true])

    const swDrag = mount(VlSwitch, { props: { modelValue: false, label: '拖动开关' } })
    await swDrag.trigger('pointerdown', { clientX: 0, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 22 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 22 }))
    expect(swDrag.emitted('update:modelValue')?.[0]).toEqual([true])

    const st = mount(VlStepper, {
      props: { modelValue: 18, min: 14, max: 24, step: 2 },
    })
    const btns = st.findAll('button')
    await btns[1]!.trigger('click')
    expect(st.emitted('update:modelValue')?.[0]).toEqual([20])
  })

  it('renders VlPushDrawer and emits open updates from scrim, including bidirectional right-drawer swipe', async () => {
    const wrapper = mount(VlPushDrawer, {
      props: { open: true, contained: true, drawerWidth: 280 },
      slots: {
        drawer: '<div class="drawer-slot">Nav</div>',
        default: '<div class="main-slot">Main</div>',
      },
    })
    expect(wrapper.find('.drawer-slot').text()).toBe('Nav')
    await wrapper.find('.vl-drawer-scrim').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])

    const dual = mount(VlPushDrawer, {
      props: { open: false, rightOpen: false, contained: true, drawerWidth: 240 },
      slots: {
        drawer: '<div class="left-slot">Left</div>',
        'right-drawer': '<div class="right-slot">Right</div>',
        default: '<div class="center-slot">Center</div>',
      },
    })
    expect(dual.find('.left-slot').text()).toBe('Left')
    expect(dual.find('.right-slot').text()).toBe('Right')
    // Swipe left opens right drawer
    await dual.find('.vl-push-shell').trigger('pointerdown', { clientX: 300, clientY: 120, button: 0, pointerType: 'touch' })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 160, clientY: 120 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 160, clientY: 120 }))
    expect(dual.emitted('update:rightOpen')?.[0]).toEqual([true])
  })

  it('renders VlDockSheet in floating and flush modes, with standalone stacking higher than unified', async () => {
    const wrapper = mount(VlDockSheet, {
      props: { detent: 'docked', title: '评论区', badge: '预留' },
      slots: { default: '<div>内容</div>' },
    })
    expect(wrapper.find('.vl-dock-title').text()).toBe('评论区')
    expect(wrapper.find('.vl-dock-sheet').classes()).toContain('standalone')
    await wrapper.find('.vl-dock-action-pill').trigger('click')
    expect(wrapper.emitted('update:detent')?.[0]).toEqual(['half'])

    const flush = mount(VlDockSheet, {
      props: { detent: 'docked', floating: false, contained: true, title: '贴边抽屉' },
      slots: { default: '<div>贴边内容</div>' },
    })
    expect(flush.find('.vl-dock-sheet').classes()).toContain('flush')
    expect(flush.find('.vl-dock-sheet').attributes('style')).toContain('border-radius: 0px')
    expect(flush.find('.vl-dock-sheet').attributes('style')).toContain('bottom: 0px')
  })

  it('renders VlSheet and closes via close button or halfway swipe gesture', async () => {
    const wrapper = mount(VlSheet, {
      props: { open: true, title: '操作抽屉', contained: true },
      slots: { default: '<div>表单</div>' },
    })
    expect(wrapper.find('.vl-sheet-title').text()).toBe('操作抽屉')
    await wrapper.find('.vl-sheet-close-btn').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])

    const swipeSheet = mount(VlSheet, {
      props: { open: true, title: '手势关闭', contained: true },
      slots: { default: '<div>内容</div>' },
    })
    await swipeSheet.find('.vl-sheet-head').trigger('pointerdown', { clientX: 100, clientY: 50, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 260 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 260 }))
    expect(swipeSheet.emitted('update:open')?.[0]).toEqual([false])

    // Standalone VlSheet (!contained) teleports to document.body to stay strictly above docked sheets
    const portaledSheet = mount(VlSheet, {
      props: { open: true, title: '顶层独立 Sheet' },
      slots: { default: '<div>高层级內容</div>' },
    })
    expect(document.body.querySelector('.vl-sheet[aria-label="顶层独立 Sheet"]')).not.toBeNull()
    portaledSheet.unmount()
  })

  it('renders VlActivityBar in mobile mode and emits select', async () => {
    const wrapper = mount(VlActivityBar, {
      props: {
        mobile: true,
        modelValue: 'library',
        items: [
          { id: 'library', label: '物质库', icon: 'flask' },
          { id: 'search', label: '搜索', icon: 'search' },
        ],
      },
    })
    expect(wrapper.find('.vl-activity-bar.mobile').exists()).toBe(true)
    const buttons = wrapper.findAll('button')
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'search' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['search'])
  })

  it('renders VlBottomDock in capsule and bar modes', async () => {
    const wrapper = mount(VlBottomDock, {
      props: {
        modelValue: 'home',
        variant: 'capsule',
        items: [
          { id: 'home', label: '首页', icon: 'home' },
          { id: 'archive', label: '归档', icon: 'archive' },
        ],
      },
    })
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['archive'])
  })

  it('renders 2-in-1 VlDockSheet with embedded floating nav and collapses on nav select', async () => {
    const wrapper = mount(VlDockSheet, {
      props: {
        detent: 'half',
        contained: true,
        title: '导航面板',
        activeNav: 'home',
        navItems: [
          { id: 'home', label: '首页', icon: 'home' },
          { id: 'archive', label: '归档', icon: 'archive' },
          { id: 'about', label: '关于', icon: 'user' },
        ],
      },
      slots: { default: '<div>内容</div>' },
    })
    expect(wrapper.find('.vl-dock-sheet.unified').exists()).toBe(true)
    const navButtons = wrapper.findAll('.vl-dock-nav-slot button')
    expect(navButtons.length).toBe(3)
    await navButtons[2]!.trigger('click')
    expect(wrapper.emitted('update:activeNav')?.[0]).toEqual(['about'])
    expect(wrapper.emitted('update:detent')?.[0]).toEqual(['docked'])
  })

  it('generates luminous harmonious Monet secondary pairings with high-lightness near-white surfaces', () => {
    expect(STANDARD_PALETTES.length).toBe(6)
    expect(PRIDE_PALETTES.length).toBe(9)
    expect(MONET_HARMONY_OPTIONS.length).toBe(3)

    const seeds = ['#FA871E', '#3B8EF3', '#F25C69', '#26BA82', '#8A6DF5', '#1F2A44']
    for (const seed of seeds) {
      for (const mode of ['counterpoint', 'botanical', 'prism'] as const) {
        const pal = generateMonetPalette(seed, mode)
        const h1 = hexToHsl(pal.primaryHex).h
        const h2 = hexToHsl(pal.secondaryHex).h
        const angularDist = Math.abs(((((h2 - h1) % 360) + 540) % 360) - 180)
        expect(angularDist).toBeGreaterThanOrEqual(42)
        // Secondary never produces clashing red-green or purple-green pairs
        if (h1 <= 22 || h1 >= 242) {
          expect(h2 >= 110 && h2 <= 172).toBe(false)
        }
        // Secondary never falls into murky yellow-olive band [65..115]
        expect(h2 > 64 && h2 < 116).toBe(false)
        // Bright daylight accent lightness (not overly dark)
        expect(hexToHsl(pal.light.primary.base).l).toBeGreaterThanOrEqual(41)
        expect(hexToHsl(pal.light.secondary.base).l).toBeGreaterThanOrEqual(41)
        // Near-white light surface (L > 0.88) and strictly never #FFFFFF
        expect(pal.light.surfaces.base).not.toBe('#FFFFFF')
        expect(relativeLuminance(pal.light.surfaces.base)).toBeGreaterThan(0.88)
      }
    }

    for (const pride of PRIDE_PALETTES) {
      expect(pride.light.surfaces.base).not.toBe('#FFFFFF')
      expect(relativeLuminance(pride.light.surfaces.base)).toBeGreaterThan(0.85)
    }
  })

  it('renders VlPalettePicker and switches palette & harmony modes cleanly', async () => {
    let themeApi: ReturnType<typeof useThemeMode> | null = null
    const Host = {
      components: { VlPalettePicker },
      template: '<VlPalettePicker compact />',
      setup() {
        themeApi = useThemeMode({ themeStorageKey: 'test-t2', paletteStorageKey: 'test-p2' })
        return {}
      },
    }
    const wrapper = mount(Host)
    const cards = wrapper.findAll('.vl-pal-card')
    expect(cards.length).toBe(15)
    await cards[7]!.trigger('click')
    expect(themeApi!.paletteId.value).toBe('pride-trans')
    expect(document.documentElement.dataset.palette).toBe('pride-trans')

    const harmonyBtns = wrapper.findAll('.vl-harmony-btn')
    expect(harmonyBtns.length).toBe(3)
    await harmonyBtns[1]!.trigger('click')
    expect(themeApi!.paletteId.value).toBe('monet')
    expect(themeApi!.monetHarmony.value).toBe('botanical')

    themeApi!.setPalette('valance')
    expect(document.documentElement.dataset.palette).toBe('valance')
  })

  it('provides all 35 Material 3 Expressive shapes in VlShape and VlAvatar clip paths', async () => {
    expect(M3_EXPRESSIVE_SHAPES.length).toBe(35)
    expect(ALL_M3_SHAPES.length).toBe(36)

    const shape = mount(VlShape, {
      props: { shape: 'clover-4', tone: 'secondary', size: 64, interactive: true },
    })
    expect(shape.find('path').attributes('d')).toContain('A 24.5,24.5')

    const avatar = mount(VlAvatar, {
      props: { name: 'Valence UI', m3Shape: 'cookie-6' },
    })
    expect(avatar.find('clipPath').exists()).toBe(true)
    expect(avatar.find('path').attributes('d')).toContain('M ')

    // Vertex resampling morphing engine produces smooth intermediate cubic paths across any shapes
    const midMorph = morphM3ShapePath('circle', 'flower', 0.5)
    expect(midMorph).toContain('C ')
    expect(midMorph.endsWith('Z')).toBe(true)

    const progMorph = mount(VlProgress, {
      props: { variant: 'morph', value: 65, showLabel: true },
    })
    expect(progMorph.find('.vl-progress-morph-wrap').exists()).toBe(true)
    expect(progMorph.find('.vl-morph-label').text()).toBe('65%')

    const empty = mount(VlEmptyState, {
      props: { title: '空占位符', description: 'M3E 形变动画' },
    })
    expect(empty.find('.vl-empty-mark svg path').exists()).toBe(true)

    const pullRefresh = mount(VlPullRefresh, {
      props: { refreshing: true },
      slots: { default: '<div class="pull-child">内容</div>' },
    })
    expect(pullRefresh.find('.vl-pull-indicator-zone.visible').exists()).toBe(true)
    expect(pullRefresh.find('.vl-pull-text').text()).toContain('正在同步刷新')

    const dtPicker = mount(VlDateTimePicker, {
      props: { modelValue: '2026-11-26T20:45', teleport: false },
    })
    await dtPicker.find('.vl-dt-trigger').trigger('click')
    await dtPicker.findAll('.vl-dt-tab')[1]!.trigger('click')
    expect(dtPicker.find('.vl-time-card.is-embedded').exists()).toBe(true)

    const tabs = mount(VlTabs, {
      props: {
        modelValue: 'a',
        items: [
          { value: 'a', label: 'Tab A' },
          { value: 'b', label: 'Tab B' },
        ],
      },
    })
    await tabs.findAll('button')[1]!.trigger('click')
    expect(tabs.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('renders self-drawn VlSelect without native select popup, enforcing rect trigger & capsule search', async () => {
    const wrapper = mount(VlSelect, {
      props: {
        modelValue: 'oral',
        teleport: false,
        searchable: true,
        shape: 'pill',
        options: [
          { value: 'oral', label: '口服 Oral' },
          { value: 'im', label: '肌内注射 IM' },
        ],
      },
    })
    expect(wrapper.find('select').exists()).toBe(false)
    // Select trigger is strictly rectangular (never capsule)
    expect(wrapper.find('.vl-select-trigger').classes()).toContain('shape-rect')
    expect(wrapper.find('.vl-select-trigger').classes()).not.toContain('shape-pill')
    await wrapper.find('.vl-select-trigger').trigger('click')
    // Searchable dropdown hosts a capsule search input at the top
    expect(wrapper.find('.vl-select-search-pill').exists()).toBe(true)
    const opts = wrapper.findAll('.vl-select-option')
    expect(opts.length).toBe(2)
    await opts[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['im'])
  })

  it('opens VlTimePicker as a centered modal dialog on mobile viewports (<= 640px)', async () => {
    const prevWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 })
    window.dispatchEvent(new Event('resize'))
    try {
      const mobilePicker = mount(VlTimePicker, {
        props: { modelValue: '10:15', label: '发药时间', teleport: false },
      })
      await mobilePicker.find('.vl-time-trigger').trigger('click')
      expect(mobilePicker.find('.vl-picker-dialog-overlay[role="dialog"]').exists()).toBe(true)
      expect(mobilePicker.find('.vl-time-card.is-dialog').exists()).toBe(true)
      await mobilePicker.find('.vl-picker-dialog-close').trigger('click')
      expect(mobilePicker.find('.vl-picker-dialog-overlay').exists()).toBe(false)
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: prevWidth })
      window.dispatchEvent(new Event('resize'))
    }
  })

  it('renders self-drawn VlCalendar and analog-dial VlTimePicker', async () => {
    const cal = mount(VlCalendar, {
      props: { modelValue: '2026-11-26' },
    })
    const dayBtns = cal.findAll('.vl-cal-cell')
    expect(dayBtns.length).toBe(42)
    await dayBtns[15]!.trigger('click')
    expect(cal.emitted('update:modelValue')?.[0]?.[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const clock = mount(VlTimePicker, {
      props: { modelValue: '09:30', inline: true, format: '24h' },
    })
    expect(clock.find('svg.vl-clock-svg').exists()).toBe(true)
    expect(clock.findAll('.vl-clock-num').length).toBe(24)
    await clock.findAll('.vl-digit-box')[1]!.trigger('click')
    expect(clock.findAll('.vl-clock-num').length).toBe(12)
  })

  it('renders VlLineChart, VlTimeline, VlCommandPalette, VlSteps, VlTagInput, VlPopconfirm', async () => {
    const chart = mount(VlLineChart, {
      props: {
        title: 'Test Chart',
        series: [
          {
            key: 's1',
            name: 'Curve A',
            points: [
              { x: 0, y: 10 },
              { x: 12, y: 40 },
              { x: 24, y: 20 },
            ],
          },
        ],
      },
    })
    expect(chart.find('svg.vl-chart-svg').exists()).toBe(true)

    const tl = mount(VlTimeline, {
      props: {
        items: [{ id: '1', time: '08:00', title: '事件一', group: '2026-11-26' }],
      },
    })
    await tl.find('.vl-tl-row').trigger('click')
    expect(tl.emitted('select')?.[0]?.[0]).toMatchObject({ id: '1' })

    const cmd = mount(VlCommandPalette, {
      props: {
        open: true,
        contained: true,
        teleport: false,
        items: [
          { id: 'overview', label: '设计规范总览' },
          { id: 'shapes', label: 'M3E 35 种几何图形' },
        ],
      },
    })
    await cmd.findAll('.vl-cmd-row')[1]!.trigger('click')
    expect(cmd.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'shapes' })

    const steps = mount(VlSteps, {
      props: {
        clickable: true,
        current: 0,
        items: [
          { id: 1, title: 'Step 1' },
          { id: 2, title: 'Step 2' },
        ],
      },
    })
    await steps.findAll('.vl-step')[1]!.trigger('click')
    expect(steps.emitted('update:current')?.[0]).toEqual([1])

    const tagInput = mount(VlTagInput, {
      props: { modelValue: ['Alpha'] },
    })
    const raw = tagInput.find('input.vl-tag-input-raw')
    await raw.setValue('Beta')
    await raw.trigger('keydown', { key: 'Enter' })
    expect(tagInput.emitted('update:modelValue')?.[0]).toEqual([['Alpha', 'Beta']])

    const pop = mount(VlPopconfirm, {
      props: { title: '确认删除？' },
      slots: { default: '<button class="trigger-btn">删</button>' },
    })
    await pop.find('.trigger-btn').trigger('click')
    await pop.find('.vl-pc-btn.confirm').trigger('click')
    expect(pop.emitted('confirm')).toBeTruthy()
  })

  it('manages theme mode & toast state', () => {
    const toast = useToast()
    toast.success('测试成功')
    expect(toast.toast.value?.text).toBe('测试成功')
    toast.dismiss()
    expect(toast.toast.value).toBeNull()

    let themeApi: ReturnType<typeof useThemeMode> | null = null
    const Host = {
      template: '<div />',
      setup() {
        themeApi = useThemeMode({ themeStorageKey: 'test-theme', accentStorageKey: 'test-accent' })
        return {}
      },
    }
    mount(Host)
    themeApi!.setThemePreference('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    themeApi!.setAccentScheme('swapped')
    expect(document.documentElement.dataset.accent).toBe('swapped')
  })

  it('supports drag-scrub switching and press states on VlBottomDock, VlActivityBar, VlSideNav, VlSegmentedControl, VlTabs', async () => {
    const mockRectList = (elements: Element[], axis: 'x' | 'y', step = 80) => {
      elements.forEach((el, idx) => {
        Object.defineProperty(el, 'getBoundingClientRect', {
          configurable: true,
          value: () =>
            axis === 'x'
              ? { left: idx * step, top: 0, width: step, height: 48, right: (idx + 1) * step, bottom: 48 }
              : { left: 0, top: idx * step, width: 50, height: step, right: 50, bottom: (idx + 1) * step },
        })
        Object.defineProperty(el, axis === 'x' ? 'offsetLeft' : 'offsetTop', {
          configurable: true,
          value: idx * step,
        })
        Object.defineProperty(el, axis === 'x' ? 'offsetWidth' : 'offsetHeight', {
          configurable: true,
          value: step,
        })
      })
    }

    const dock = mount(VlBottomDock, {
      props: {
        modelValue: 'a',
        variant: 'capsule',
        items: [
          { id: 'a', label: 'A', icon: 'home' },
          { id: 'b', label: 'B', icon: 'compass' },
          { id: 'c', label: 'C', icon: 'user' },
        ],
      },
    })
    const capsule = dock.find('.vl-dock-capsule').element
    Object.defineProperty(capsule, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 240, height: 56, right: 240, bottom: 56 }),
    })
    const dockBtns = dock.findAll('button').map((b) => b.element)
    mockRectList(dockBtns, 'x', 80)

    await dock.findAll('button')[0]!.trigger('pointerdown', { clientX: 40, clientY: 20, pointerId: 1, button: 0 })
    expect(dock.find('.vl-dock-capsule').classes()).toContain('pressed')
    expect(dock.emitted('press-change')?.[0]).toEqual([true])
    // Bounded elastic overshoot: dragging far past left edge allows slight peek (< 0) but strictly never exceeds -12px
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: -260, clientY: 20, pointerId: 1 }))
    await dock.vm.$nextTick()
    const indStyleLeft = dock.find('.vl-dock-indicator').attributes('style') ?? ''
    const leftMatch = /translate3d\((-?\d+(?:\.\d+)?)px/.exec(indStyleLeft)
    expect(leftMatch).not.toBeNull()
    const overshootX = Number(leftMatch![1])
    expect(overshootX).toBeLessThan(0)
    expect(overshootX).toBeGreaterThanOrEqual(-12)
    // Dragging to rightmost tab updates covered ink (tab 0 loses white ink!) and emits drag-follow
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 20, pointerId: 1 }))
    await dock.vm.$nextTick()
    expect(dock.findAll('button')[0]!.classes()).not.toContain('active')
    expect(dock.findAll('button')[2]!.classes()).toContain('active')
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 20, pointerId: 1 }))
    expect(dock.emitted('update:modelValue')?.[0]).toEqual(['c'])
    expect(dock.emitted('press-change')?.[1]).toEqual([false])
    expect(dock.emitted('drag-follow')?.length).toBeGreaterThan(0)

    const barDock = mount(VlBottomDock, {
      props: {
        modelValue: 'a',
        variant: 'bar',
        items: [
          { id: 'a', label: 'A', icon: 'home' },
          { id: 'b', label: 'B', icon: 'compass' },
          { id: 'c', label: 'C', icon: 'user' },
        ],
      },
    })
    const barNav = barDock.find('.vl-dock-bar').element
    Object.defineProperty(barNav, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 240, height: 58, right: 240, bottom: 58 }),
    })
    mockRectList(barDock.findAll('button').map((b) => b.element), 'x', 80)
    await barDock.findAll('button')[0]!.trigger('pointerdown', { clientX: 40, clientY: 20, pointerId: 10, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 20, pointerId: 10 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 120, clientY: 20, pointerId: 10 }))
    expect(barDock.emitted('update:modelValue')?.[0]).toEqual(['b'])

    // Workbench VlActivityBar is click-only (square <-> circle morph, no scrub drag)
    const act = mount(VlActivityBar, {
      props: {
        modelValue: 'files',
        expanded: true,
        items: [
          { id: 'files', label: 'Files', icon: 'files' },
          { id: 'search', label: 'Search', icon: 'search' },
        ],
        bottomItems: [
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ],
      },
    })
    expect(act.findAll('button')[0]!.classes()).toContain('active')
    await act.findAll('button')[2]!.trigger('click')
    expect(act.emitted('update:modelValue')?.[0]).toEqual(['settings'])

    // Vertical VlNavRail supports both floating capsule & fixed bar scrub gestures with bounded overshoot
    const navRail = mount(VlNavRail, {
      props: {
        modelValue: 'curve',
        variant: 'capsule',
        items: [
          { id: 'curve', label: '曲线', icon: 'curve' },
          { id: 'records', label: '记录', icon: 'clock' },
          { id: 'calibration', label: '校准', icon: 'biotech' },
        ],
      },
    })
    const railCapsule = navRail.find('.vl-nav-rail-capsule').element
    Object.defineProperty(railCapsule, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 64, height: 190, right: 64, bottom: 190 }),
    })
    mockRectList(navRail.findAll('button').map((b) => b.element), 'y', 60)
    await navRail.findAll('button')[0]!.trigger('pointerdown', { clientX: 30, clientY: 30, pointerId: 2, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: -240, pointerId: 2 }))
    await navRail.vm.$nextTick()
    const railIndTop = /translate3d\(0(?:px)?,\s*(-?\d+(?:\.\d+)?)px/.exec(navRail.find('.vl-rail-indicator').attributes('style') ?? '')
    expect(railIndTop).not.toBeNull()
    expect(Number(railIndTop![1])).toBeLessThan(0)
    expect(Number(railIndTop![1])).toBeGreaterThanOrEqual(-12)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 150, pointerId: 2 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 150, pointerId: 2 }))
    expect(navRail.emitted('update:modelValue')?.[0]).toEqual(['calibration'])

    const navRailBar = mount(VlNavRail, {
      props: {
        modelValue: 'a',
        variant: 'bar',
        items: [
          { id: 'a', label: 'A', icon: 'home' },
          { id: 'b', label: 'B', icon: 'compass' },
        ],
      },
    })
    const railBarEl = navRailBar.find('.vl-nav-rail-bar').element
    Object.defineProperty(railBarEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 68, height: 140, right: 68, bottom: 140 }),
    })
    mockRectList(navRailBar.findAll('button').map((b) => b.element), 'y', 70)
    await navRailBar.findAll('button')[0]!.trigger('pointerdown', { clientX: 30, clientY: 30, pointerId: 12, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 105, pointerId: 12 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 105, pointerId: 12 }))
    expect(navRailBar.emitted('update:modelValue')?.[0]).toEqual(['b'])

    const side = mount(VlSideNav, {
      props: {
        activeId: 's1',
        groups: [
          {
            id: 'g1',
            label: 'Group',
            defaultOpen: true,
            items: [
              { id: 's1', label: 'Item 1' },
              { id: 's2', label: 'Item 2' },
              { id: 's3', label: 'Item 3' },
            ],
          },
        ],
      },
    })
    const tree = side.find('.vl-side-nav').element
    Object.defineProperty(tree, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 220, height: 180, right: 220, bottom: 180 }),
    })
    mockRectList(side.findAll('.vl-nav-item').map((b) => b.element), 'y', 36)
    await side.findAll('.vl-nav-item')[0]!.trigger('pointerdown', { clientX: 30, clientY: 18, pointerId: 3, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 92, pointerId: 3 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 30, clientY: 92, pointerId: 3 }))
    expect(side.emitted('select')?.[0]?.[0]).toMatchObject({ id: 's3' })

    const seg = mount(VlSegmentedControl, {
      props: {
        modelValue: 'one',
        options: [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
          { value: 'three', label: 'Three' },
        ],
      },
    })
    const segTrack = seg.find('.vl-seg-track').element
    Object.defineProperty(segTrack, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 210, height: 30, right: 210, bottom: 30 }),
    })
    mockRectList(seg.findAll('button').map((b) => b.element), 'x', 70)
    await seg.findAll('button')[0]!.trigger('pointerdown', { clientX: 30, clientY: 15, pointerId: 4, button: 0 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 175, clientY: 15, pointerId: 4 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 175, clientY: 15, pointerId: 4 }))
    expect(seg.emitted('update:modelValue')?.[0]).toEqual(['three'])

    const tb = mount(VlTitleBar, {
      props: { mode: 'mobile', centerText: 'Mobile' },
      slots: { right: '<button class="vl-icon-btn sz-sm">T</button>' },
    })
    expect(tb.find('.vl-titlebar.mode-mobile').exists()).toBe(true)
    expect(tb.find('.vl-panel-toggle').exists()).toBe(true)

    // Instant press-target glide on non-active item (zero 6px deadzone delay)
    const instantDock = mount(VlBottomDock, {
      props: {
        modelValue: 'a',
        variant: 'capsule',
        items: [
          { id: 'a', label: 'A', icon: 'home' },
          { id: 'b', label: 'B', icon: 'compass' },
          { id: 'c', label: 'C', icon: 'user' },
        ],
      },
    })
    Object.defineProperty(instantDock.find('.vl-dock-capsule').element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 240, height: 56, right: 240, bottom: 56 }),
    })
    mockRectList(instantDock.findAll('button').map((b) => b.element), 'x', 80)
    await instantDock.findAll('button')[2]!.trigger('pointerdown', { clientX: 200, clientY: 20, pointerId: 21, button: 0 })
    await instantDock.vm.$nextTick()
    expect(instantDock.find('.vl-dock-indicator').attributes('style')).toContain('translate3d(160px')
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 20, pointerId: 21 }))
  })

  it('dispatches Android-style LIFO priority back handlers via dispatchBack and mouse side button', () => {
    const order: string[] = []
    const unregDrawer = registerBackHandler(() => {
      order.push('drawer')
      unregDrawer()
      return true
    }, 150)
    const unregDialog = registerBackHandler(() => {
      order.push('dialog')
      unregDialog()
      return true
    }, 300)

    // Mouse side back button (button === 3) closes highest-priority dialog first
    window.dispatchEvent(new MouseEvent('mouseup', { button: 3, cancelable: true }))
    expect(order).toEqual(['dialog'])

    // Next dispatchBack closes lower-priority drawer
    expect(dispatchBack()).toBe(true)
    expect(order).toEqual(['dialog', 'drawer'])
    expect(dispatchBack()).toBe(false)
  })

  it('interrupts VlSnapPager mid-flight on rapid taps without dropping animation', async () => {
    const pager = mount(VlSnapPager, {
      props: {
        modelValue: 'overview',
        pages: ['overview', 'gestures', 'buttons'],
      },
      slots: {
        default: '<div class="page-body">Page</div>',
      },
    })

    const track = pager.find('.vl-pager-track')
    const trackEl = track.element as HTMLElement
    Object.defineProperty(trackEl, 'clientWidth', { configurable: true, value: 400 })

    // Step 1: start forward transition overview -> gestures
    await pager.setProps({ modelValue: 'gestures' })
    expect(track.classes()).toContain('is-driving-kf-b')
    expect(track.attributes('style')).toContain('--vl-pager-from: 0.000%')
    expect(track.attributes('style')).toContain('--vl-pager-to: -100.000%')

    // Step 2: simulate mid-flight -40% transform (-160px on 400px track) and rapidly tap buttons
    const origGetComputedStyle = window.getComputedStyle
    const spyGetComputedStyle = ((el: Element) => {
      if (el === trackEl) {
        return { transform: 'matrix(1, 0, 0, 1, -160, 0)' } as CSSStyleDeclaration
      }
      return origGetComputedStyle.call(window, el)
    }) as typeof window.getComputedStyle
    window.getComputedStyle = spyGetComputedStyle

    try {
      await pager.setProps({ modelValue: 'buttons' })
      expect(track.classes()).toContain('is-driving-kf-a')
      expect(track.attributes('style')).toContain('--vl-pager-from: -40.000%')
      expect(track.attributes('style')).toContain('--vl-pager-to: -200.000%')

      // Step 3: immediately reverse back to gestures at -40% without losing animation
      await pager.setProps({ modelValue: 'gestures' })
      expect(track.classes()).toContain('is-driving-kf-b')
      expect(track.attributes('style')).toContain('--vl-pager-from: -40.000%')
      expect(track.attributes('style')).toContain('--vl-pager-to: -100.000%')
    } finally {
      window.getComputedStyle = origGetComputedStyle
    }
  })

  it('supports subtle-scale fade transitions with ping-pong interruption on VlSnapPager', async () => {
    const pager = mount(VlSnapPager, {
      props: {
        modelValue: 'curve',
        pages: ['curve', 'records', 'calibration'],
        transition: 'fade',
      },
      slots: {
        default: '<div class="page-body">Page</div>',
      },
    })

    await pager.setProps({ modelValue: 'records' })
    const pagesAfterFirst = pager.findAll('.vl-snap-page')
    expect(pagesAfterFirst.some((p) => p.classes().includes('is-fade-kf-enter-b'))).toBe(true)
    expect(pagesAfterFirst.some((p) => p.classes().includes('is-fade-kf-leave-b'))).toBe(true)

    await pager.setProps({ modelValue: 'calibration' })
    const pagesAfterSecond = pager.findAll('.vl-snap-page')
    expect(pagesAfterSecond.some((p) => p.classes().includes('is-fade-kf-enter-a'))).toBe(true)
    expect(pagesAfterSecond.some((p) => p.classes().includes('is-fade-kf-leave-a'))).toBe(true)
  })
})
