import { createContentLoader } from 'vitepress'
import type { BlogPostMeta } from '@valance-ui/vitepress-theme'

declare const data: BlogPostMeta[]
export { data }

function stripMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default createContentLoader('posts/*.md', {
  includeSrc: true,
  excerpt: true,
  transform(rawData): BlogPostMeta[] {
    return rawData
      .map((page) => {
        const fm = page.frontmatter || {}
        const src = page.src || ''
        const plain = stripMarkdown(src)
        const cjkCount = (plain.match(/[\u4e00-\u9fa5]/g) || []).length
        const wordTokens = (plain.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length
        const wordCount = cjkCount + wordTokens
        const readingMinutes = Math.max(1, Math.ceil(wordCount / 360))
        const rawDate = fm.date ? String(fm.date) : '2026-11-26'
        const date = rawDate.slice(0, 10)

        return {
          url: page.url,
          title: String(fm.title || '未命名文章'),
          date,
          dateText: date,
          category: fm.category ? String(fm.category) : '工程随笔',
          tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
          excerpt:
            (fm.description ? String(fm.description) : '') ||
            stripMarkdown(page.excerpt || '').slice(0, 140),
          featured: Boolean(fm.featured),
          wordCount,
          readingMinutes,
          plainText: plain.slice(0, 2400),
        }
      })
      .sort((a, b) => (b.date > a.date ? 1 : -1))
  },
})
