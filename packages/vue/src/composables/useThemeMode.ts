import { computed, ref } from 'vue'
import {
  ALL_PRESET_PALETTES,
  MANAGED_CSS_VARS,
  getPaletteById,
  normalizeHex,
  resolvePaletteTokens,
  type MonetHarmonyMode,
  type PaletteDefinition,
} from '../styles/colorEngine'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
export type AccentScheme = 'default' | 'swapped'

export interface ThemeModeOptions {
  themeStorageKey?: string
  accentStorageKey?: string
  paletteStorageKey?: string
  monetSeedStorageKey?: string
  monetHarmonyStorageKey?: string
  monetHueShiftStorageKey?: string
  defaultTheme?: ThemePreference
  defaultAccent?: AccentScheme
  defaultPalette?: string
  defaultMonetHarmony?: MonetHarmonyMode
  syncMetaThemeColor?: boolean
}

const activeConfig: Required<ThemeModeOptions> = {
  themeStorageKey: 'valance-theme-preference',
  accentStorageKey: 'valance-accent-scheme',
  paletteStorageKey: 'valance-palette-id',
  monetSeedStorageKey: 'valance-monet-seed',
  monetHarmonyStorageKey: 'valance-monet-harmony',
  monetHueShiftStorageKey: 'valance-monet-hue-shift',
  defaultTheme: 'system',
  defaultAccent: 'default',
  defaultPalette: 'valance',
  defaultMonetHarmony: 'counterpoint',
  syncMetaThemeColor: true,
}

const themePreference = ref<ThemePreference>('system')
const resolvedTheme = ref<ResolvedTheme>('light')
const accentScheme = ref<AccentScheme>('default')
const paletteId = ref<string>('valance')
const monetSeed = ref<string>('#FA871E')
const monetHarmony = ref<MonetHarmonyMode>('counterpoint')
const monetHueShift = ref<number>(148)
let initialized = false
let mediaQuery: MediaQueryList | null = null

export function configureThemeMode(options: ThemeModeOptions): void {
  Object.assign(activeConfig, options)
}

function computeResolved(pref: ThemePreference): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function syncMetaThemeColor(resolved: ResolvedTheme, customTitlebar?: string): void {
  if (!activeConfig.syncMetaThemeColor || typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  meta.setAttribute('content', customTitlebar ?? (resolved === 'dark' ? '#1D2427' : '#F5F4EF'))
}

function safeSetStorage(key: string, val: string): void {
  if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function') {
    try {
      localStorage.setItem(key, val)
    } catch {
      // ignore storage errors
    }
  }
}

function applyPaletteVars(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.palette = paletteId.value
  const tokens = resolvePaletteTokens(
    paletteId.value,
    resolvedTheme.value,
    accentScheme.value,
    monetSeed.value,
    monetHarmony.value,
  )
  if (!tokens) {
    for (const k of MANAGED_CSS_VARS) {
      root.style.removeProperty(k)
    }
    syncMetaThemeColor(resolvedTheme.value)
    return
  }
  for (const [k, v] of Object.entries(tokens)) {
    root.style.setProperty(k, v)
  }
  syncMetaThemeColor(resolvedTheme.value, tokens['--bg-titlebar'])
}

function commitPreference(pref: ThemePreference, save = true): void {
  themePreference.value = pref
  const nextResolved = computeResolved(pref)
  resolvedTheme.value = nextResolved

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = nextResolved
    applyPaletteVars()
  }
  if (save) {
    safeSetStorage(activeConfig.themeStorageKey, pref)
  }
}

function commitAccent(scheme: AccentScheme, save = true): void {
  accentScheme.value = scheme
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.accent = scheme
    applyPaletteVars()
  }
  if (save) {
    safeSetStorage(activeConfig.accentStorageKey, scheme)
  }
}

function commitPalette(nextId: string, save = true): void {
  paletteId.value = nextId
  applyPaletteVars()
  if (save) {
    safeSetStorage(activeConfig.paletteStorageKey, nextId)
  }
}

function commitMonet(seed: string, harmony?: MonetHarmonyMode, save = true): void {
  monetSeed.value = normalizeHex(seed)
  if (harmony === 'counterpoint' || harmony === 'botanical' || harmony === 'prism') {
    monetHarmony.value = harmony
  }
  paletteId.value = 'monet'
  const generated = getPaletteById('monet', monetSeed.value, monetHarmony.value)
  if (typeof generated.hueShift === 'number') {
    monetHueShift.value = generated.hueShift
  }
  if (save) safeSetStorage(activeConfig.paletteStorageKey, 'monet')
  applyPaletteVars()
  if (save) {
    safeSetStorage(activeConfig.monetSeedStorageKey, monetSeed.value)
    safeSetStorage(activeConfig.monetHarmonyStorageKey, monetHarmony.value)
  }
}

function runRippleTransition(updateDom: () => void, event?: MouseEvent): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    updateDom()
    return
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> }
  }
  const canTransition = typeof doc.startViewTransition === 'function'
  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!canTransition || !event || reducedMotion) {
    updateDom()
    return
  }

  const w = window.innerWidth || document.documentElement.clientWidth || 1
  const h = window.innerHeight || document.documentElement.clientHeight || 1

  const hasPointer = Boolean(event.clientX > 0 || event.clientY > 0)
  const x = hasPointer ? event.clientX : w / 2
  const y = hasPointer ? event.clientY : h / 2

  const xPct = `${((x / w) * 100).toFixed(4)}%`
  const yPct = `${((y / h) * 100).toFixed(4)}%`
  const endRadius = `${Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 24}px`

  const root = document.documentElement
  root.style.setProperty('--ripple-x', xPct)
  root.style.setProperty('--ripple-y', yPct)
  root.style.setProperty('--ripple-radius', endRadius)
  root.dataset.vtKind = 'ripple'

  const transition = doc.startViewTransition!(() => {
    updateDom()
  })

  transition.finished.finally(() => {
    if (root.dataset.vtKind === 'ripple') {
      delete root.dataset.vtKind
    }
  })
}

function handleSystemChange(): void {
  if (themePreference.value === 'system') {
    commitPreference('system', false)
  }
}

export function useThemeMode(options?: ThemeModeOptions) {
  if (options) configureThemeMode(options)

  if (!initialized && typeof window !== 'undefined') {
    initialized = true
    let initialTheme: ThemePreference = activeConfig.defaultTheme
    let initialAccent: AccentScheme = activeConfig.defaultAccent
    let initialPalette = activeConfig.defaultPalette
    let initialSeed = monetSeed.value
    let initialHarmony: MonetHarmonyMode = activeConfig.defaultMonetHarmony

    if (typeof localStorage !== 'undefined' && typeof localStorage?.getItem === 'function') {
      try {
        const savedTheme = localStorage.getItem(activeConfig.themeStorageKey)
        if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark') {
          initialTheme = savedTheme
        }
        const savedAccent = localStorage.getItem(activeConfig.accentStorageKey)
        if (savedAccent === 'default' || savedAccent === 'swapped') {
          initialAccent = savedAccent
        }
        const savedPalette = localStorage.getItem(activeConfig.paletteStorageKey)
        if (savedPalette && (savedPalette === 'monet' || ALL_PRESET_PALETTES.some((p) => p.id === savedPalette))) {
          initialPalette = savedPalette
        }
        const savedSeed = localStorage.getItem(activeConfig.monetSeedStorageKey)
        if (savedSeed && /^#?[0-9a-fA-F]{3,6}$/.test(savedSeed.trim())) {
          initialSeed = normalizeHex(savedSeed)
        }
        const savedHarmony = localStorage.getItem(activeConfig.monetHarmonyStorageKey)
        if (savedHarmony === 'counterpoint' || savedHarmony === 'botanical' || savedHarmony === 'prism') {
          initialHarmony = savedHarmony
        }
      } catch {
        // ignore storage errors
      }
    }

    paletteId.value = initialPalette
    monetSeed.value = initialSeed
    monetHarmony.value = initialHarmony
    const initPal = getPaletteById('monet', initialSeed, initialHarmony)
    monetHueShift.value = initPal.hueShift ?? 148
    commitAccent(initialAccent, false)
    commitPreference(initialTheme, false)

    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleSystemChange)
      } else if (typeof (mediaQuery as MediaQueryList).addListener === 'function') {
        ;(mediaQuery as MediaQueryList).addListener(handleSystemChange)
      }
    }
  } else {
    if (options?.defaultTheme !== undefined && themePreference.value !== options.defaultTheme) {
      commitPreference(options.defaultTheme, false)
    }
    if (options?.defaultAccent !== undefined && accentScheme.value !== options.defaultAccent) {
      commitAccent(options.defaultAccent, false)
    }
    if (options?.defaultPalette !== undefined && paletteId.value !== options.defaultPalette) {
      commitPalette(options.defaultPalette, false)
    }
  }

  function setThemePreference(pref: ThemePreference, event?: MouseEvent): void {
    const prevResolved = resolvedTheme.value
    const nextResolved = computeResolved(pref)
    if (prevResolved === nextResolved) {
      commitPreference(pref, true)
      return
    }
    runRippleTransition(() => {
      commitPreference(pref, true)
    }, event)
  }

  function setAccentScheme(scheme: AccentScheme, event?: MouseEvent): void {
    if (scheme === accentScheme.value) return
    runRippleTransition(() => {
      commitAccent(scheme, true)
    }, event)
  }

  function setPalette(id: string, event?: MouseEvent): void {
    if (id === paletteId.value) return
    runRippleTransition(() => {
      commitPalette(id, true)
    }, event)
  }

  function setMonetSeed(seedHex: string, harmonyOrShift?: MonetHarmonyMode | number, event?: MouseEvent): void {
    const nextHarmony =
      harmonyOrShift === 'counterpoint' || harmonyOrShift === 'botanical' || harmonyOrShift === 'prism'
        ? harmonyOrShift
        : monetHarmony.value
    runRippleTransition(() => {
      commitMonet(seedHex, nextHarmony, true)
    }, event)
  }

  function setMonetHarmony(harmony: MonetHarmonyMode, event?: MouseEvent): void {
    runRippleTransition(() => {
      commitMonet(monetSeed.value, harmony, true)
    }, event)
  }

  function setMonetHueShift(hueShift: number, event?: MouseEvent): void {
    const nextHarmony: MonetHarmonyMode = hueShift <= 135 ? 'botanical' : hueShift >= 155 ? 'prism' : 'counterpoint'
    setMonetHarmony(nextHarmony, event)
  }

  function toggleTheme(event?: MouseEvent): void {
    const next: ThemePreference = resolvedTheme.value === 'dark' ? 'light' : 'dark'
    setThemePreference(next, event)
  }

  function toggleAccent(event?: MouseEvent): void {
    const next: AccentScheme = accentScheme.value === 'default' ? 'swapped' : 'default'
    setAccentScheme(next, event)
  }

  const activePalette = computed<PaletteDefinition>(() =>
    getPaletteById(paletteId.value, monetSeed.value, monetHarmony.value),
  )

  const activeLightBgHex = computed(() =>
    paletteId.value === 'valance' ? '#FDFCF9' : activePalette.value.light.surfaces.base,
  )

  const activeDarkBgHex = computed(() =>
    paletteId.value === 'valance' ? '#273033' : activePalette.value.dark.surfaces.base,
  )

  return {
    themePreference,
    resolvedTheme,
    accentScheme,
    paletteId,
    monetSeed,
    monetHarmony,
    monetHueShift,
    activePalette,
    activeLightBgHex,
    activeDarkBgHex,
    setThemePreference,
    setAccentScheme,
    setPalette,
    setMonetSeed,
    setMonetHarmony,
    setMonetHueShift,
    toggleTheme,
    toggleAccent,
  }
}

export function createThemeInitScript(options?: ThemeModeOptions): string {
  const themeKey = options?.themeStorageKey ?? 'valance-theme-preference'
  const accentKey = options?.accentStorageKey ?? 'valance-accent-scheme'
  const paletteKey = options?.paletteStorageKey ?? 'valance-palette-id'
  const defaultTheme = options?.defaultTheme ?? 'system'
  const defaultAccent = options?.defaultAccent ?? 'default'
  const defaultPalette = options?.defaultPalette ?? 'valance'

  return `(function () {
  try {
    var pref = localStorage.getItem(${JSON.stringify(themeKey)}) || ${JSON.stringify(defaultTheme)};
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = pref === 'dark' || pref === 'light' ? pref : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolved;
    var accent = localStorage.getItem(${JSON.stringify(accentKey)}) || ${JSON.stringify(defaultAccent)};
    document.documentElement.dataset.accent = accent === 'swapped' ? 'swapped' : 'default';
    var pal = localStorage.getItem(${JSON.stringify(paletteKey)}) || ${JSON.stringify(defaultPalette)};
    document.documentElement.dataset.palette = pal;
  } catch (e) {}
})();`
}
