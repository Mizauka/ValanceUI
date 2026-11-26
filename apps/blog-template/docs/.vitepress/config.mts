import { defineValanceConfig } from '@valance-ui/vitepress-theme/config'

export default defineValanceConfig({
  base: process.env.VITEPRESS_BASE || '/',
  title: 'Valance Journal',
  description: '扁平几何与 120Hz 物理手势工程美学随笔 · VitePress 博客模板',
  lang: 'zh-CN',
  cleanUrls: true,
  storagePrefix: 'vl-blog-template',
  markdown: {
    headers: {
      level: [2, 3],
    },
  },
  themeConfig: {
    brandTitle: 'Valance Journal',
    brandTag: 'WORKBENCH BLOG',
    heroTitle: '几何秩序、120Hz 物理手势与数字花园',
    heroSubtitle:
      '基于 @valance-ui/vitepress-theme 构建的个人博客与阅读工作台模板。桌面端支持三栏分屏、多标签阅读与 Ctrl+K 全局检索；移动端提供 Safari 120Hz scroll-snap 侧边栏、可打断 scroll-timeline 分页与 Dock-to-Sheet 连续面板。',
    footerNote: 'Powered by Valance UI',
    author: {
      name: 'Mizauka',
      role: 'Design Systems & Frontend Engineering',
      bio: '关注扁平几何设计语言、120Hz WebKit 手势物理、Monet 自适应色彩引擎与沉浸式长文阅读体验。',
    },
    nav: [
      { text: '首页文章', link: '/', icon: 'home' },
      { text: '时间线归档', link: '/archive', icon: 'archive' },
      { text: '关于模板', link: '/about', icon: 'user' },
    ],
  },
})
