import type { IconName, SideNavGroup } from '@valance-ui/vue'

export interface DemoSectionMeta {
  id: string
  title: string
  subtitle: string
  group: string
  icon: IconName
  tone?: 'primary' | 'secondary'
  badge?: string
  summary: string
}

export const DEMO_SECTIONS: DemoSectionMeta[] = [
  {
    id: 'overview',
    title: '设计规范总览',
    subtitle: 'SPEC',
    group: '设计系统 Foundation',
    icon: 'compass',
    tone: 'primary',
    badge: '必读',
    summary: '三大允许几何形状、零阴影色调层级、响应式三端架构。',
  },
  {
    id: 'colors',
    title: '色彩系统与主题切换',
    subtitle: 'COLOR',
    group: '设计系统 Foundation',
    icon: 'palette',
    tone: 'secondary',
    badge: 'Ripple',
    summary: '高明度近白纸底 / 莫奈冷暖对位 / Pride 特殊色板 / 语义色。',
  },
  {
    id: 'shapes',
    title: 'M3E 35 种几何图形',
    subtitle: 'SHAPES',
    group: '设计系统 Foundation',
    icon: 'star',
    tone: 'primary',
    badge: '35 图形',
    summary: 'Material 3 Expressive 全套 35 种矢量几何轮廓与头像剪裁。',
  },
  {
    id: 'motion',
    title: '字体、动效与形态变形',
    subtitle: 'MOTION',
    group: '设计系统 Foundation',
    icon: 'sparkles',
    tone: 'primary',
    summary: '非线性缓动曲线、方圆/方胶囊变形、快照列宽过渡。',
  },
  {
    id: 'icons',
    title: '几何图标系统',
    subtitle: 'ICONS',
    group: '设计系统 Foundation',
    icon: 'grid',
    tone: 'secondary',
    badge: '85+',
    summary: '覆盖阅读器、科学工作台与通用博客的全部 16×16 线性图标。',
  },
  {
    id: 'buttons',
    title: '按钮、分段器与标签',
    subtitle: 'ACTION',
    group: '基础与表单 Controls',
    icon: 'plus',
    tone: 'primary',
    summary: 'Morph 按钮矩阵、图标按钮、步进器、滑块分段控制器、徽章标签。',
  },
  {
    id: 'forms',
    title: '表单与输入控件',
    subtitle: 'FORMS',
    group: '基础与表单 Controls',
    icon: 'sliders',
    tone: 'secondary',
    summary: '输入框、多行文本、选择器、开关、复选框、单选组、滑杆。',
  },
  {
    id: 'navigation',
    title: '导航栏、侧边栏与底栏',
    subtitle: 'NAV',
    group: '导航体系 Navigation',
    icon: 'menu',
    tone: 'primary',
    summary: 'TitleBar、ActivityBar、SideNav、BottomDock（悬浮胶囊/通栏）、TabBar、分页。',
  },
  {
    id: 'gestures',
    title: '挤压侧边栏与 Dock-to-Sheet',
    subtitle: 'GESTURE',
    group: '手势与布局 Layout & UX',
    icon: 'gesture',
    tone: 'secondary',
    badge: '交互实验',
    summary: '1:1 全屏拖拽挤压抽屉、Dock 变形为 Sheet、可拖拽分屏滑块与 WinUI 滚动条。',
  },
  {
    id: 'overlays',
    title: 'Sheet、弹窗与反馈',
    subtitle: 'OVERLAY',
    group: '手势与布局 Layout & UX',
    icon: 'layers',
    tone: 'primary',
    summary: '底部/侧边 Sheet、模态弹窗、Toast 胶囊、Tooltip、下拉菜单、进度与骨架屏。',
  },
  {
    id: 'data',
    title: '数据展示与排版',
    subtitle: 'DATA',
    group: '数据与排版 Data & Prose',
    icon: 'book',
    tone: 'secondary',
    summary: 'Card、StatTile、Table、Accordion、Avatar、Kbd 与 Prose 排版规范。',
  },
]

export function buildDemoNavGroups(openIds: Set<string>): SideNavGroup[] {
  const map = new Map<string, SideNavGroup>()
  for (const s of DEMO_SECTIONS) {
    let grp = map.get(s.group)
    if (!grp) {
      grp = {
        id: s.group,
        label: s.group,
        defaultOpen: true,
        items: [],
      }
      map.set(s.group, grp)
    }
    grp.items.push({
      id: s.id,
      label: s.title,
      icon: s.icon,
      badge: s.badge,
      tone: s.tone,
      openDot: openIds.has(s.id),
    })
  }
  return Array.from(map.values())
}
