import type { Theme } from 'vitepress'
import '@valance-ui/vue/tokens.css'
import '@valance-ui/vue/base.css'
import '@valance-ui/vue/workbench.css'
import '@valance-ui/vue/prose.css'
import '@valance-ui/vue/style.css'
import './styles/theme.css'
import ValanceUI, { configureThemeMode, createThemeInitScript } from '@valance-ui/vue'
import ValanceLayout from './components/ValanceLayout.vue'
import VpBlogHome from './components/VpBlogHome.vue'
import VpBlogArchive from './components/VpBlogArchive.vue'
import VpBlogPostHeader from './components/VpBlogPostHeader.vue'
import VpSidebarPanel from './components/VpSidebarPanel.vue'
import VpRightOutline from './components/VpRightOutline.vue'
import VpNotFound from './components/VpNotFound.vue'
import { setThemeOptions, useBlogState } from './composables/useBlogState'
import type { ValanceThemeOptions } from './types'

export type {
  BlogPostMeta,
  BlogAuthor,
  BlogNavItem,
  ValanceThemeConfig,
  ValanceThemeOptions,
} from './types'

export {
  ValanceLayout,
  VpBlogHome,
  VpBlogArchive,
  VpBlogPostHeader,
  VpSidebarPanel,
  VpRightOutline,
  VpNotFound,
  useBlogState,
  createThemeInitScript,
}

export function createValanceTheme(options: ValanceThemeOptions = {}): Theme {
  setThemeOptions(options)
  const prefix = options.config?.storagePrefix ?? 'vl-blog'
  configureThemeMode({
    themeStorageKey: `${prefix}-theme`,
    accentStorageKey: `${prefix}-accent`,
    defaultAccent: options.config?.accentDefault ?? 'default',
  })

  return {
    Layout: ValanceLayout,
    enhanceApp({ app }) {
      app.use(ValanceUI)
    },
  }
}

const defaultTheme: Theme = createValanceTheme()

export default defaultTheme
