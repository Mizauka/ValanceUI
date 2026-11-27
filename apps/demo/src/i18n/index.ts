import { computed, watch } from 'vue'
import { useLocale, type SideNavGroup, type ValanceLocale } from '@valance-ui/vue'
import { DEMO_SECTIONS, buildDemoNavGroups } from '../demoCatalog'
import type { DemoMessages } from './types'
import { DEMO_ZH_CN } from './zh-CN'
import { DEMO_ZH_TW } from './zh-TW'
import { DEMO_EN } from './en'
import { DEMO_JA } from './ja'

export type { DemoMessages, DemoSectionText } from './types'

export const DEMO_MESSAGES: Record<ValanceLocale, DemoMessages> = {
  'zh-CN': DEMO_ZH_CN,
  'zh-TW': DEMO_ZH_TW,
  en: DEMO_EN,
  ja: DEMO_JA,
}

export function getDemoMessages(locale: ValanceLocale): DemoMessages {
  return DEMO_MESSAGES[locale] ?? DEMO_ZH_CN
}

export function useDemoI18n() {
  const { locale, localePreference, localeOptions, setLocale, cycleLocale } = useLocale()
  const t = computed<DemoMessages>(() => getDemoMessages(locale.value))

  watch(
    () => t.value.meta.documentTitle,
    (title) => {
      if (typeof document !== 'undefined') {
        document.title = title
      }
    },
    { immediate: true }
  )

  const localizedSections = computed(() =>
    DEMO_SECTIONS.map((sec) => {
      const tr = t.value.catalog.sections[sec.id]
      if (!tr) return sec
      return {
        ...sec,
        title: tr.title,
        group: tr.group,
        badge: tr.badge !== undefined ? tr.badge : sec.badge,
        summary: tr.summary,
      }
    })
  )

  function getLocalizedNavGroups(openIds: Set<string>): SideNavGroup[] {
    return buildDemoNavGroups(openIds).map((grp) => {
      const items = grp.items.map((item) => {
        const tr = t.value.catalog.sections[item.id]
        if (!tr) return item
        return {
          ...item,
          label: tr.title,
          badge: tr.badge !== undefined ? tr.badge : item.badge,
        }
      })
      const firstId = items[0]?.id
      const groupTitle = firstId ? t.value.catalog.sections[firstId]?.group : undefined
      return {
        ...grp,
        label: groupTitle ?? grp.label,
        items,
      }
    })
  }

  return {
    t,
    locale,
    localePreference,
    localeOptions,
    setLocale,
    cycleLocale,
    localizedSections,
    getLocalizedNavGroups,
  }
}
