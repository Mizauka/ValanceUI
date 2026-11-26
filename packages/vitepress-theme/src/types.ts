import type { IconName } from '@valance-ui/vue'

export interface BlogPostMeta {
  url: string
  title: string
  date: string
  dateText?: string
  category?: string
  tags?: string[]
  excerpt?: string
  readingMinutes?: number
  wordCount?: number
  featured?: boolean
  author?: string
  plainText?: string
}

export interface BlogAuthor {
  name: string
  role?: string
  bio?: string
  avatar?: string
  links?: { label: string; href: string; icon?: IconName }[]
}

export interface BlogNavItem {
  text: string
  link: string
  icon?: IconName
}

export interface ValanceThemeConfig {
  brandTitle?: string
  brandTag?: string
  description?: string
  heroTitle?: string
  heroSubtitle?: string
  author?: BlogAuthor
  nav?: BlogNavItem[]
  posts?: BlogPostMeta[]
  enableTabs?: boolean
  enableReadingSettings?: boolean
  mobileBottomMode?: 'auto' | 'unified' | 'dock-sheet' | 'nav-dock'
  footerNote?: string
  accentDefault?: 'default' | 'swapped'
  storagePrefix?: string
}

export interface ValanceThemeOptions {
  posts?: BlogPostMeta[]
  config?: Partial<ValanceThemeConfig>
}
