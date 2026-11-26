import { defineConfig, type DefaultTheme, type UserConfig } from 'vitepress'
import type { ValanceThemeConfig } from './types'

export function createThemeInitScript(options?: {
  themeStorageKey?: string
  accentStorageKey?: string
  defaultTheme?: 'system' | 'light' | 'dark'
  defaultAccent?: 'default' | 'swapped'
}): string {
  const themeKey = options?.themeStorageKey ?? 'vl-blog-theme'
  const accentKey = options?.accentStorageKey ?? 'vl-blog-accent'
  const defaultTheme = options?.defaultTheme ?? 'system'
  const defaultAccent = options?.defaultAccent ?? 'default'

  return `(() => {
  try {
    const pref = localStorage.getItem(${JSON.stringify(themeKey)}) || ${JSON.stringify(defaultTheme)};
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = pref === 'dark' || pref === 'light' ? pref : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolved;
    const accent = localStorage.getItem(${JSON.stringify(accentKey)}) || ${JSON.stringify(defaultAccent)};
    document.documentElement.dataset.accent = accent === 'swapped' ? 'swapped' : 'default';
  } catch {}
})();`
}

export function defineValanceConfig(
  config: UserConfig<ValanceThemeConfig> & {
    storagePrefix?: string
    defaultAccent?: 'default' | 'swapped'
  },
) {
  const prefix = config.storagePrefix ?? config.themeConfig?.storagePrefix ?? 'vl-blog'
  const initScript = createThemeInitScript({
    themeStorageKey: `${prefix}-theme`,
    accentStorageKey: `${prefix}-accent`,
    defaultAccent: config.defaultAccent ?? config.themeConfig?.accentDefault ?? 'default',
  })

  return defineConfig({
    ...config,
    appearance: false,
    head: [
      ['script', {}, initScript],
      ...(config.head ?? []),
    ],
    vite: {
      ...config.vite,
      ssr: {
        noExternal: ['@valance-ui/vue', '@valance-ui/vitepress-theme'],
      },
    },
  } as UserConfig<DefaultTheme.Config>)
}
