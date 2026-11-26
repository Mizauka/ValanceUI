import { defineValanceConfig } from '@valance-ui/vitepress-theme/config'

export default defineValanceConfig({
  base: process.env.VITEPRESS_BASE || '/',
  title: 'Valance Journal',
  description: '扁平几何与工程美学随笔 · VitePress 博客模板',
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
    brandTag: 'BLOG TEMPLATE',
    heroTitle: '几何秩序、手势物理与数字花园',
    heroSubtitle:
      '基于 @valance-ui/vitepress-theme 构建的个人博客与知识工作台模板。桌面端提供三栏工作区与多标签页，移动端提供 1:1 挤压式侧边栏与 Dock-to-Sheet 交互体验。',
    footerNote: 'Powered by Valance UI',
    author: {
      name: 'Mizauka',
      role: 'Design Systems & Frontend Engineering',
      bio: '关注扁平几何设计语言、物理手势交互、科学数据可视化与沉浸式长文阅读体验。',
    },
    nav: [
      { text: '首页文章', link: '/', icon: 'home' },
      { text: '时间线归档', link: '/archive', icon: 'archive' },
      { text: '关于模板', link: '/about', icon: 'user' },
    ],
  },
})
