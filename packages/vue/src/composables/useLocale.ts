import { computed, ref } from 'vue'
import {
  VL_MESSAGES,
  type LocalePreference,
  type ValanceLocale,
  type VlLocaleMessages,
} from '../locales/messages'

export type { LocalePreference, ValanceLocale, VlLocaleMessages }

export interface LocaleConfigOptions {
  storageKey?: string
  defaultPreference?: LocalePreference
  syncHtmlLang?: boolean
}

export interface LocaleSelectOption {
  value: LocalePreference
  label: string
  nativeLabel: string
  shortLabel: string
}

const activeConfig: Required<LocaleConfigOptions> = {
  storageKey: 'valance-locale-preference',
  defaultPreference: 'system',
  syncHtmlLang: true,
}

const localePreference = ref<LocalePreference>('system')
const resolvedLocale = ref<ValanceLocale>('zh-CN')
let initialized = false
let langListenerAttached = false

export function normalizeValanceLocale(tag: string | null | undefined): ValanceLocale | null {
  if (!tag) return null
  const lower = tag.trim().toLowerCase()
  if (!lower) return null
  if (
    /^zh\b.*(tw|hk|mo|hant)/.test(lower) ||
    lower === 'zh-tw' ||
    lower === 'zh-hk' ||
    lower === 'zh-mo' ||
    lower === 'zh_tw'
  ) {
    return 'zh-TW'
  }
  if (lower.startsWith('zh')) return 'zh-CN'
  if (lower.startsWith('ja')) return 'ja'
  if (lower.startsWith('en')) return 'en'
  return null
}

export function detectBrowserLocale(): ValanceLocale {
  if (typeof navigator === 'undefined') return 'zh-CN'
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ].filter(Boolean)

  for (const cand of candidates) {
    const matched = normalizeValanceLocale(cand)
    if (matched) return matched
  }
  return 'zh-CN'
}

function safeReadStorage(key: string): string | null {
  if (typeof localStorage === 'undefined' || typeof localStorage?.getItem !== 'function') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWriteStorage(key: string, val: string): void {
  if (typeof localStorage === 'undefined' || typeof localStorage?.setItem !== 'function') return
  try {
    localStorage.setItem(key, val)
  } catch {
    // ignore storage errors
  }
}

function computeResolvedLocale(pref: LocalePreference): ValanceLocale {
  if (pref !== 'system') return pref
  return detectBrowserLocale()
}

function syncHtmlLang(locale: ValanceLocale): void {
  if (!activeConfig.syncHtmlLang || typeof document === 'undefined') return
  document.documentElement.lang = locale
}

function isValidLocalePreference(val: string | null): val is LocalePreference {
  return val === 'system' || val === 'zh-CN' || val === 'zh-TW' || val === 'en' || val === 'ja'
}

export function configureLocale(options: LocaleConfigOptions): void {
  Object.assign(activeConfig, options)
}

export function initLocale(): void {
  if (initialized) return
  initialized = true
  const stored = safeReadStorage(activeConfig.storageKey)
  const initialPref: LocalePreference = isValidLocalePreference(stored)
    ? stored
    : activeConfig.defaultPreference
  localePreference.value = initialPref
  resolvedLocale.value = computeResolvedLocale(initialPref)
  syncHtmlLang(resolvedLocale.value)

  if (!langListenerAttached && typeof window !== 'undefined') {
    langListenerAttached = true
    window.addEventListener('languagechange', () => {
      if (localePreference.value === 'system') {
        resolvedLocale.value = computeResolvedLocale('system')
        syncHtmlLang(resolvedLocale.value)
      }
    })
  }
}

export function getActiveLocale(): ValanceLocale {
  initLocale()
  return resolvedLocale.value
}

export function getVlMessages(loc?: ValanceLocale): VlLocaleMessages {
  return VL_MESSAGES[loc ?? getActiveLocale()]
}

export function useLocale() {
  initLocale()

  const locale = computed(() => resolvedLocale.value)
  const messages = computed<VlLocaleMessages>(() => VL_MESSAGES[resolvedLocale.value])

  const localeOptions = computed<LocaleSelectOption[]>(() => {
    const names = messages.value.localeNames
    return [
      { value: 'system', label: names.system, nativeLabel: names.system, shortLabel: 'AUTO' },
      { value: 'zh-CN', label: '简体中文', nativeLabel: '简体中文', shortLabel: '简' },
      { value: 'zh-TW', label: '繁體中文', nativeLabel: '繁體中文', shortLabel: '繁' },
      { value: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN' },
      { value: 'ja', label: '日本語', nativeLabel: '日本語', shortLabel: 'JP' },
    ]
  })

  function setLocale(pref: LocalePreference): void {
    localePreference.value = pref
    safeWriteStorage(activeConfig.storageKey, pref)
    resolvedLocale.value = computeResolvedLocale(pref)
    syncHtmlLang(resolvedLocale.value)
  }

  function cycleLocale(includeSystem = false): ValanceLocale {
    const order: LocalePreference[] = includeSystem
      ? ['system', 'zh-CN', 'zh-TW', 'en', 'ja']
      : ['zh-CN', 'zh-TW', 'en', 'ja']
    const current = includeSystem ? localePreference.value : resolvedLocale.value
    const idx = order.indexOf(current)
    const next = order[(idx + 1) % order.length]!
    setLocale(next)
    return resolvedLocale.value
  }

  return {
    localePreference,
    resolvedLocale,
    locale,
    messages,
    localeOptions,
    setLocale,
    cycleLocale,
  }
}

export function getLocalizedShapeLabel(shapeId: string, loc?: ValanceLocale): string {
  const m = getVlMessages(loc)
  return m.shapes[shapeId] ?? shapeId
}

export function getLocalizedIconGroupLabel(groupId: string, loc?: ValanceLocale): string {
  const m = getVlMessages(loc)
  return (m.iconGroups as Record<string, string>)[groupId] ?? groupId
}

export function getLocalizedPaletteName(paletteId: string, fallbackName = '', loc?: ValanceLocale): string {
  const m = getVlMessages(loc)
  return m.palettePicker.palettes[paletteId]?.name ?? fallbackName
}

export function getLocalizedPaletteSubtitle(paletteId: string, fallbackSubtitle = '', loc?: ValanceLocale): string {
  const m = getVlMessages(loc)
  return m.palettePicker.palettes[paletteId]?.subtitle ?? fallbackSubtitle
}

export function createLocaleInitScript(options?: LocaleConfigOptions): string {
  const storageKey = options?.storageKey ?? 'valance-locale-preference'
  const defaultPref = options?.defaultPreference ?? 'system'
  return `(function () {
  try {
    var pref = localStorage.getItem(${JSON.stringify(storageKey)}) || ${JSON.stringify(defaultPref)};
    var lang = pref;
    if (pref === 'system') {
      var nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      var low = String(nav).toLowerCase();
      if (/^zh\\b.*(tw|hk|mo|hant)/.test(low) || low === 'zh-tw' || low === 'zh-hk' || low === 'zh-mo') lang = 'zh-TW';
      else if (low.indexOf('zh') === 0) lang = 'zh-CN';
      else if (low.indexOf('ja') === 0) lang = 'ja';
      else if (low.indexOf('en') === 0) lang = 'en';
      else lang = 'zh-CN';
    }
    document.documentElement.lang = lang;
  } catch (e) {}
})();`
}
