/**
 * Valance UI — Editorial High-Clarity Color Engine
 *
 * 1. Curated non-clashing secondary pairing (strictly avoids garish red-green / purple-green pairs)
 * 2. Primary leads in clarity; Secondary supports with calmer mineral/warm-neutral chroma
 * 3. High-lightness near-white rice-paper surfaces (L* >= 92, strictly never #FFFFFF)
 * 4. Standard 6 refined palettes + Monet Seed generator + 9 Pride palettes
 */

export type PaletteGroup = 'standard' | 'monet' | 'pride'
export type MonetHarmonyMode = 'counterpoint' | 'botanical' | 'prism'

export interface MonetHarmonyOption {
  id: MonetHarmonyMode
  label: string
  hint: string
}

export const MONET_HARMONY_OPTIONS: MonetHarmonyOption[] = [
  { id: 'counterpoint', label: '冷暖矿石', hint: '以沉稳矿石冷暖副色衬托主色，彻底避开红绿/紫绿俗艳撞色' },
  { id: 'botanical', label: '茶木柔搭', hint: '温润低饱和陶杏、雾蓝、鼠尾草搭配，耐看舒缓' },
  { id: 'prism', label: '晴空邻阶', hint: '同一清澄象限的阶梯邻色对位，多曲线图表高度协调' },
]

export interface AccentRamp {
  base: string
  hover: string
  text: string
  soft: string
  mid: string
  ink: string
}

export interface SurfacePalette {
  base: string
  editor: string
  surface: string
  activity: string
  titlebar: string
  elevated: string
  chip: string
  hover: string
  dividerHairline: string
  dividerStrong: string
  statusbar: string
  textStatusbar: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textProse: string
}

export interface PaletteThemeMode {
  primary: AccentRamp
  secondary: AccentRamp
  chartPalette: string[]
  surfaces: SurfacePalette
}

export interface PaletteDefinition {
  id: string
  name: string
  subtitle: string
  group: PaletteGroup
  primaryHex: string
  secondaryHex: string
  swatches?: string[]
  hueShift?: number
  harmonyMode?: MonetHarmonyMode
  light: PaletteThemeMode
  dark: PaletteThemeMode
}

export interface HslColor {
  h: number
  s: number
  l: number
}

export interface RgbColor {
  r: number
  g: number
  b: number
}

const DEFAULT_PRIMARY = '#F9841A'

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360
}

export function normalizeHex(raw: string): string {
  const clean = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toUpperCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`
  }
  return DEFAULT_PRIMARY
}

export function hexToRgb(hex: string): RgbColor {
  const clean = normalizeHex(hex).slice(1)
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const f = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase()
  return `#${f(r)}${f(g)}${f(b)}`
}

export function hexToHsl(hex: string): HslColor {
  const { r: r0, g: g0, b: b0 } = hexToRgb(hex)
  const r = r0 / 255
  const g = g0 / 255
  const b = b0 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  return { h: normalizeHue(h), s: s * 100, l: l * 100 }
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = normalizeHue(h) / 360
  const sat = clamp(s, 0, 100) / 100
  const lig = clamp(l, 0, 100) / 100
  if (sat === 0) {
    const v = Math.round(lig * 255)
    return rgbToHex({ r: v, g: v, b: v })
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat
  const p = 2 * lig - q
  return rgbToHex({
    r: hue2rgb(p, q, hue + 1 / 3) * 255,
    g: hue2rgb(p, q, hue) * 255,
    b: hue2rgb(p, q, hue - 1 / 3) * 255,
  })
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const chan = (c: number) => {
    const n = c / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA)
  const lB = relativeLuminance(hexB)
  const hi = Math.max(lA, lB)
  const lo = Math.min(lA, lB)
  return (hi + 0.05) / (lo + 0.05)
}

export function pickInkForBackground(bgHex: string, darkInk = '#171C1E', lightInk = '#FFFFFF'): string {
  const cWhite = contrastRatio(lightInk, bgHex)
  if (cWhite >= 2.65) return lightInk
  const cDark = contrastRatio(darkInk, bgHex)
  return cDark >= cWhite ? darkInk : lightInk
}

function ensureMinContrast(
  h: number,
  s: number,
  startL: number,
  againstHex: string,
  direction: 'darker' | 'lighter',
  minRatio = 4.6,
): string {
  let l = startL
  for (let i = 0; i < 24; i++) {
    const candidate = hslToHex(h, s, l)
    if (contrastRatio(candidate, againstHex) >= minRatio) return candidate
    l += direction === 'darker' ? -2.6 : 2.6
    l = clamp(l, 12, 92)
  }
  return hslToHex(h, s, l)
}

function makeLightSurfaces(hue: number, tintSat = 20): SurfacePalette {
  const h = normalizeHue(hue)
  const sBase = clamp(tintSat, 10, 30)
  const safeNotWhite = (hex: string) => (hex === '#FFFFFF' ? '#FDFCF9' : hex)

  return {
    elevated: safeNotWhite(hslToHex(h, clamp(sBase * 0.85, 10, 28), 99.1)),
    base: safeNotWhite(hslToHex(h, clamp(sBase, 14, 32), 98.2)),
    editor: safeNotWhite(hslToHex(h, clamp(sBase, 14, 32), 98.2)),
    surface: hslToHex(h, clamp(sBase * 0.75, 10, 26), 96.0),
    titlebar: hslToHex(h, clamp(sBase * 0.78, 10, 26), 96.4),
    sidebar: hslToHex(h, clamp(sBase * 0.75, 10, 26), 96.0),
    activity: hslToHex(h, clamp(sBase * 0.7, 9, 22), 93.8),
    chip: hslToHex(h, clamp(sBase * 0.68, 8, 22), 92.8),
    hover: hslToHex(h, clamp(sBase * 0.68, 8, 22), 89.8),
    dividerHairline: hslToHex(h, clamp(sBase * 0.54, 7, 18), 89.5),
    dividerStrong: hslToHex(h, clamp(sBase * 0.56, 7, 20), 82.8),
    statusbar: hslToHex(h, clamp(sBase * 0.65, 8, 20), 93.8),
    textStatusbar: hslToHex(h, 16, 28),
    textPrimary: hslToHex(h, 14, 13.5),
    textSecondary: hslToHex(h, 12, 34),
    textMuted: hslToHex(h, 10, 51),
    textProse: hslToHex(h, 13, 17),
  } as SurfacePalette & { sidebar?: string }
}

function makeDarkSurfaces(hue: number, tintSat = 15): SurfacePalette {
  const h = normalizeHue(hue)
  const s = clamp(tintSat, 7, 20)

  return {
    base: hslToHex(h, s, 17.5),
    editor: hslToHex(h, s, 17.5),
    surface: hslToHex(h, s, 14.8),
    activity: hslToHex(h, s, 12.2),
    titlebar: hslToHex(h, s, 13.5),
    elevated: hslToHex(h, s, 21.5),
    chip: hslToHex(h, s, 22.8),
    hover: hslToHex(h, s, 26.2),
    dividerHairline: hslToHex(h, s * 0.9, 23.2),
    dividerStrong: hslToHex(h, s * 0.9, 32.5),
    statusbar: hslToHex(h, s, 12.2),
    textStatusbar: hslToHex(h, 14, 77),
    textPrimary: hslToHex(h, 14, 94.0),
    textSecondary: hslToHex(h, 14, 76),
    textMuted: hslToHex(h, 11, 59),
    textProse: hslToHex(h, 14, 91),
  }
}

function targetLightAccentL(h: number, seedL: number): number {
  const hue = normalizeHue(h)
  const bandFloor =
    hue >= 132 && hue <= 198
      ? 42
      : hue >= 200 && hue <= 268
        ? 53
        : 52
  const bandCeil =
    hue >= 132 && hue <= 198
      ? 52
      : hue >= 200 && hue <= 268
        ? 63
        : 62
  return clamp(Math.max(seedL, bandFloor + 2), bandFloor, bandCeil)
}

function targetDarkAccentL(h: number, seedL: number): number {
  const hue = normalizeHue(h)
  const minL = hue >= 210 && hue <= 285 ? 64 : 60
  return clamp(Math.max(seedL + 10, minL), minL, 74)
}

function buildLightRamp(accentHex: string, lightBaseHex: string): AccentRamp {
  const { h, s, l } = hexToHsl(accentHex)
  const sat = clamp(s, 42, 92)
  const baseL = targetLightAccentL(h, l)
  const base = hslToHex(h, sat, baseL)
  const hover = hslToHex(h, clamp(sat * 1.03, 42, 94), clamp(baseL - 5, 38, 58))
  const soft = hslToHex(h, clamp(sat * 0.72, 26, 76), 93.4)
  const mid = hslToHex(h, clamp(sat * 0.68, 24, 70), 84.0)
  const text = ensureMinContrast(h, clamp(sat * 0.92, 38, 90), clamp(baseL - 12, 23, 44), lightBaseHex, 'darker', 4.6)
  const ink = pickInkForBackground(base, '#161B1D', '#FFFFFF')
  return { base, hover, text, soft, mid, ink }
}

function buildDarkRamp(accentHex: string, darkBaseHex: string): AccentRamp {
  const { h, s, l } = hexToHsl(accentHex)
  const sat = clamp(s, 46, 90)
  const baseL = targetDarkAccentL(h, l)
  const base = hslToHex(h, sat, baseL)
  const hover = hslToHex(h, clamp(sat * 1.04, 46, 92), clamp(baseL + 5.5, 64, 80))
  const soft = hslToHex(h, clamp(sat * 0.42, 20, 46), 23.5)
  const mid = hslToHex(h, clamp(sat * 0.48, 22, 54), 32.5)
  const text = ensureMinContrast(h, clamp(sat * 0.9, 44, 90), clamp(baseL + 9, 60, 79), darkBaseHex, 'lighter', 4.6)
  const ink = pickInkForBackground(base, '#12181B', '#FFFFFF')
  return { base, hover, text, soft, mid, ink }
}

function buildDualAccentMode(
  primaryHex: string,
  secondaryHex: string,
  surfaceHue: number,
  secondaryHue: number,
  extras?: string[],
  lightSat = 22,
  darkSat = 14,
): { light: PaletteThemeMode; dark: PaletteThemeMode } {
  const lightSurfaces = makeLightSurfaces(surfaceHue, lightSat)
  const darkSurfaces = makeDarkSurfaces(secondaryHue, darkSat)

  const h1 = hexToHsl(primaryHex).h
  const h2 = hexToHsl(secondaryHex).h
  const fallbackExtras = [
    hslToHex(normalizeHue(h2 + 32), 62, 56),
    hslToHex(normalizeHue(h1 + 210), 58, 56),
    hslToHex(normalizeHue(h1 - 28), 64, 56),
    hslToHex(normalizeHue(h2 - 36), 56, 56),
  ]

  const lightPrimary = buildLightRamp(primaryHex, lightSurfaces.base)
  const lightSecondary = buildLightRamp(secondaryHex, lightSurfaces.base)
  const darkPrimary = buildDarkRamp(primaryHex, darkSurfaces.base)
  const darkSecondary = buildDarkRamp(secondaryHex, darkSurfaces.base)

  const lightCharts = [lightPrimary.base, lightSecondary.base, ...(extras ?? fallbackExtras).slice(0, 4)]
  const darkCharts = [
    darkPrimary.base,
    darkSecondary.base,
    ...(extras ?? fallbackExtras).slice(0, 4).map((hex) => {
      const hsl = hexToHsl(hex)
      return hslToHex(hsl.h, clamp(hsl.s, 52, 86), clamp(hsl.l + 10, 62, 74))
    }),
  ]

  return {
    light: {
      primary: lightPrimary,
      secondary: lightSecondary,
      chartPalette: lightCharts,
      surfaces: lightSurfaces,
    },
    dark: {
      primary: darkPrimary,
      secondary: darkSecondary,
      chartPalette: darkCharts,
      surfaces: darkSurfaces,
    },
  }
}

/**
 * Curated anti-clash harmony tables:
 * - Zero red-green (0..18 <-> 115..165)
 * - Zero purple-green (245..305 <-> 115..170)
 * - Calm mineral/linen companion hue pairs that elevate primary rather than fighting it.
 */
const HARMONY_ANCHORS: Record<MonetHarmonyMode, Array<[number, number]>> = {
  counterpoint: [
    [0, 212],
    [28, 176],
    [52, 222],
    [136, 30],
    [176, 26],
    [216, 32],
    [262, 204],
    [306, 216],
    [340, 248],
  ],
  botanical: [
    [0, 222],
    [28, 180],
    [52, 168],
    [140, 32],
    [178, 30],
    [214, 34],
    [262, 212],
    [328, 250],
  ],
  prism: [
    [0, 206],
    [28, 182],
    [52, 214],
    [140, 198],
    [178, 28],
    [216, 264],
    [262, 206],
    [332, 218],
  ],
}

function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((((b - a) % 360) + 540) % 360) - 180
  return normalizeHue(a + diff * t)
}

export function pickHarmoniousSecondaryHue(
  primaryHue: number,
  mode: MonetHarmonyMode = 'counterpoint',
): number {
  const h = normalizeHue(primaryHue)
  const stops = HARMONY_ANCHORS[mode] ?? HARMONY_ANCHORS.counterpoint
  let picked = stops[0]![1]

  for (let i = 0; i < stops.length; i++) {
    const [aH, aTarget] = stops[i]!
    const next = stops[(i + 1) % stops.length]!
    const bH = i === stops.length - 1 ? next[0] + 360 : next[0]
    const cmpH = h < stops[0]![0] ? h + 360 : h
    if (cmpH >= aH && cmpH <= bH) {
      const span = Math.max(1, bH - aH)
      picked = lerpAngle(aTarget, next[1], (cmpH - aH) / span)
      break
    }
  }

  // Keep secondary out of muddy yellow-olive [64..116]
  if (picked >= 64 && picked <= 90) picked = 38
  else if (picked > 90 && picked <= 116) picked = 174

  // Strictly block red-green and purple-green clashes
  const isRedOrPurple = h <= 22 || h >= 242
  if (isRedOrPurple && picked >= 110 && picked <= 172) {
    picked = 212
  }
  const isGreenBand = h >= 100 && h <= 168
  if (isGreenBand && (picked <= 16 || picked >= 265)) {
    picked = 30
  }

  // Ensure crisp hue distance from primary
  const angularDist = Math.abs(((((picked - h) % 360) + 540) % 360) - 180)
  if (angularDist < 42) {
    picked = h >= 190 && h <= 280 ? 32 : 212
  }

  return Math.round(picked)
}

function resolveHarmonyParam(option?: MonetHarmonyMode | number): MonetHarmonyMode {
  if (option === 'counterpoint' || option === 'botanical' || option === 'prism') {
    return option
  }
  if (typeof option === 'number' && Number.isFinite(option)) {
    if (option <= 135) return 'botanical'
    if (option >= 155) return 'prism'
  }
  return 'counterpoint'
}

export function generateMonetPalette(
  seedHex: string,
  harmonyOrShift: MonetHarmonyMode | number = 'counterpoint',
): PaletteDefinition {
  const cleanSeed = normalizeHex(seedHex)
  const harmonyMode = resolveHarmonyParam(harmonyOrShift)
  const seedHsl = hexToHsl(cleanSeed)

  const effectiveSat = seedHsl.s < 16 ? 76 : clamp(seedHsl.s, 58, 90)
  const primaryL = targetLightAccentL(seedHsl.h, seedHsl.l)
  const primaryHex = hslToHex(seedHsl.h, effectiveSat, primaryL)

  const h2 = pickHarmoniousSecondaryHue(seedHsl.h, harmonyMode)
  // Secondary stays intentionally calmer & slightly mineral so it complements rather than clashes
  const secSat = clamp(effectiveSat * 0.72, 46, 72)
  const secL = targetLightAccentL(h2, seedLForSecondary(h2))
  const secondaryHex = hslToHex(h2, secSat, secL)
  const hueShift = Math.round(((h2 - seedHsl.h) % 360 + 360) % 360)

  const modes = buildDualAccentMode(primaryHex, secondaryHex, seedHsl.h, h2, undefined, 24, 14)

  const harmonyLabel = MONET_HARMONY_OPTIONS.find((m) => m.id === harmonyMode)?.label ?? '冷暖矿石'

  return {
    id: 'monet',
    name: '莫奈动态取色',
    subtitle: `${cleanSeed} · ${harmonyLabel}（辅色 ${secondaryHex}）`,
    group: 'monet',
    primaryHex,
    secondaryHex,
    swatches: [primaryHex, secondaryHex, modes.light.surfaces.base, modes.dark.surfaces.base],
    hueShift,
    harmonyMode,
    ...modes,
  }
}

function seedLForSecondary(h: number): number {
  const hue = normalizeHue(h)
  if (hue >= 134 && hue <= 198) return 45
  if (hue >= 200 && hue <= 270) return 58
  return 56
}

function createPresetPalette(
  id: string,
  name: string,
  subtitle: string,
  group: PaletteGroup,
  primaryHex: string,
  secondaryHex: string,
  options?: {
    flagColors?: string[]
    chartExtras?: string[]
    surfaceHue?: number
    lightSat?: number
    hueShift?: number
  },
): PaletteDefinition {
  const h1 = hexToHsl(primaryHex).h
  const h2 = hexToHsl(secondaryHex).h
  const modes = buildDualAccentMode(
    primaryHex,
    secondaryHex,
    options?.surfaceHue ?? h1,
    h2,
    options?.chartExtras,
    options?.lightSat ?? 20,
    14,
  )

  return {
    id,
    name,
    subtitle,
    group,
    primaryHex,
    secondaryHex,
    swatches: options?.flagColors ?? [primaryHex, secondaryHex],
    hueShift: options?.hueShift ?? Math.round(((h2 - h1) % 360 + 360) % 360),
    ...modes,
  }
}

/** Six refined, non-clashing editorial palettes (zero red-green / purple-green). */
export const STANDARD_PALETTES: PaletteDefinition[] = [
  createPresetPalette('valance', '暖橙青碧（默认）', '晴橙 #F9841A × 矿青 #1FA8A0', 'standard', '#F9841A', '#1FA8A0', {
    surfaceHue: 34,
    lightSat: 24,
  }),
  createPresetPalette('crimson', '绯樱靛蓝', '朱樱 #E35B69 × 晴靛 #3F7FC2', 'standard', '#E35B69', '#3F7FC2', {
    surfaceHue: 18,
    lightSat: 16,
  }),
  createPresetPalette('cobalt', '晴空茶金', '晴蓝 #4282E8 × 柔茶 #CE9356', 'standard', '#4282E8', '#CE9356', {
    surfaceHue: 212,
    lightSat: 20,
  }),
  createPresetPalette('forest', '松林暖杏', '雪松 #2F9C76 × 陶杏 #CF8B53', 'standard', '#2F9C76', '#CF8B53', {
    surfaceHue: 152,
    lightSat: 18,
  }),
  createPresetPalette('violet', '鸢尾海蓝', '鸢尾 #826AE8 × 云蓝 #3B9AD9', 'standard', '#826AE8', '#3B9AD9', {
    surfaceHue: 256,
    lightSat: 18,
  }),
  createPresetPalette('rose', '山茶丁香', '山茶 #E06388 × 雾紫 #7B72CF', 'standard', '#E06388', '#7B72CF', {
    surfaceHue: 340,
    lightSat: 18,
  }),
]

/** Nine Pride-inspired palettes calibrated for airy luminous readability. */
export const PRIDE_PALETTES: PaletteDefinition[] = [
  createPresetPalette('pride-rainbow', 'Rainbow 彩虹', '亮虹炽橙 × 晴空海蓝', 'pride', '#F05044', '#3B82F6', {
    flagColors: ['#FF453A', '#FF9F0A', '#FFD60A', '#30D158', '#3B82F6', '#9B5DE5'],
    surfaceHue: 36,
    lightSat: 18,
    chartExtras: ['#F5A623', '#30B87B', '#9B5DE5', '#FF8533'],
  }),
  createPresetPalette('pride-trans', 'Transgender 跨性别', '透亮晴蓝 × 柔润樱粉 × 极轻纸白', 'pride', '#46B3EB', '#F27C99', {
    flagColors: ['#5BCEFA', '#F5A9B8', '#FDFCF9', '#F5A9B8', '#5BCEFA'],
    surfaceHue: 202,
    lightSat: 26,
    chartExtras: ['#68BFF0', '#F491AA', '#5A9BE0', '#D97290'],
  }),
  createPresetPalette('pride-lesbian', 'Lesbian 日落', '暖阳杏橘 × 晚霞玫紫', 'pride', '#F06A3E', '#C45396', {
    flagColors: ['#E5461E', '#F78442', '#FFA86A', '#FDFCF9', '#DC74B2', '#C45396', '#A8266E'],
    surfaceHue: 20,
    lightSat: 20,
    chartExtras: ['#F78442', '#DC74B2', '#FFA86A', '#B53D80'],
  }),
  createPresetPalette('pride-bi', 'Bisexual 双性恋', '洋红霓粉 × 星蓝靛青', 'pride', '#E8428E', '#4B74E6', {
    flagColors: ['#E8308C', '#E8308C', '#A663CC', '#2F5FE0', '#2F5FE0'],
    surfaceHue: 315,
    lightSat: 18,
    chartExtras: ['#A663CC', '#5E85EB', '#C954A6', '#3CA2D8'],
  }),
  createPresetPalette('pride-pan', 'Pansexual 泛性恋', '洋红桃粉 × 晴空湖蓝', 'pride', '#F04694', '#24A8EB', {
    flagColors: ['#FF3D9A', '#FFD83B', '#2EC4FF'],
    surfaceHue: 206,
    lightSat: 20,
    chartExtras: ['#F2B81C', '#6A7BF0', '#2BBF8D', '#F26B44'],
  }),
  createPresetPalette('pride-nonbinary', 'Non-Binary 非二元', '紫罗兰光 × 向日琥珀', 'pride', '#9B5DE5', '#E8A81E', {
    flagColors: ['#FCEB46', '#FDFCF9', '#A864EB', '#34363D'],
    surfaceHue: 274,
    lightSat: 18,
    chartExtras: ['#7682A6', '#46B37C', '#CC68A6', '#697BF0'],
  }),
  createPresetPalette('pride-ace', 'Asexual 无性恋', '暮兰紫晶 × 青石岩蓝', 'pride', '#9A52B8', '#527999', {
    flagColors: ['#2C2F36', '#A8AEB8', '#FDFCF9', '#9A52B8'],
    surfaceHue: 280,
    lightSat: 14,
    chartExtras: ['#A668C2', '#6C8FA8', '#C46894', '#4EA19C'],
  }),
  createPresetPalette('pride-aro', 'Aromantic 无浪漫', '春叶新绿 × 温润海青', 'pride', '#38B258', '#2C8BA2', {
    flagColors: ['#44B84D', '#AEE079', '#FDFCF9', '#B3B8BD', '#2C2F36'],
    surfaceHue: 136,
    lightSat: 18,
    chartExtras: ['#7EC452', '#3CA6C4', '#7C8C88', '#D9A634'],
  }),
  createPresetPalette('pride-gay', 'MLM 海洋青蓝', '海盐青碧 × 琉璃靛蓝', 'pride', '#1EB89A', '#5D66E6', {
    flagColors: ['#16A888', '#38D6B4', '#A2F0CE', '#FDFCF9', '#84B8EA', '#6368E8', '#5034A6'],
    surfaceHue: 174,
    lightSat: 22,
    chartExtras: ['#38D6B4', '#69A0EB', '#8064DC', '#3296D4'],
  }),
]

export const ALL_PRESET_PALETTES: PaletteDefinition[] = [...STANDARD_PALETTES, ...PRIDE_PALETTES]

export function getPaletteById(
  id: string,
  monetSeed = DEFAULT_PRIMARY,
  monetHarmonyOrShift: MonetHarmonyMode | number = 'counterpoint',
): PaletteDefinition {
  if (id === 'monet') {
    return generateMonetPalette(monetSeed, monetHarmonyOrShift)
  }
  return ALL_PRESET_PALETTES.find((p) => p.id === id) ?? STANDARD_PALETTES[0]!
}

export const MANAGED_CSS_VARS = [
  '--bg-base',
  '--bg-editor',
  '--bg-surface',
  '--bg-activity',
  '--bg-titlebar',
  '--bg-sidebar',
  '--bg-elevated',
  '--bg-chip',
  '--bg-hover',
  '--bg-statusbar',
  '--divider-hairline',
  '--divider-strong',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--text-prose',
  '--text-statusbar',
  '--accent-primary',
  '--accent-primary-hover',
  '--accent-primary-text',
  '--accent-primary-soft',
  '--accent-primary-mid',
  '--accent-primary-ink',
  '--accent-secondary',
  '--accent-secondary-hover',
  '--accent-secondary-text',
  '--accent-secondary-soft',
  '--accent-secondary-mid',
  '--accent-secondary-ink',
  '--chart-series-1',
  '--chart-series-2',
  '--chart-series-3',
  '--chart-series-4',
  '--chart-series-5',
  '--chart-series-6',
] as const

export function resolvePaletteTokens(
  paletteId: string,
  resolvedTheme: 'light' | 'dark',
  accentScheme: 'default' | 'swapped',
  monetSeed = DEFAULT_PRIMARY,
  monetHarmonyOrShift: MonetHarmonyMode | number = 'counterpoint',
): Record<string, string> | null {
  if (paletteId === 'valance') {
    return null
  }
  const palette = getPaletteById(paletteId, monetSeed, monetHarmonyOrShift)
  const mode = resolvedTheme === 'dark' ? palette.dark : palette.light
  const primary = accentScheme === 'swapped' ? mode.secondary : mode.primary
  const secondary = accentScheme === 'swapped' ? mode.primary : mode.secondary

  return {
    '--bg-base': mode.surfaces.base,
    '--bg-editor': mode.surfaces.editor,
    '--bg-surface': mode.surfaces.surface,
    '--bg-activity': mode.surfaces.activity,
    '--bg-titlebar': mode.surfaces.titlebar,
    '--bg-sidebar': mode.surfaces.surface,
    '--bg-elevated': mode.surfaces.elevated,
    '--bg-chip': mode.surfaces.chip,
    '--bg-hover': mode.surfaces.hover,
    '--bg-statusbar': mode.surfaces.statusbar,
    '--divider-hairline': mode.surfaces.dividerHairline,
    '--divider-strong': mode.surfaces.dividerStrong,
    '--text-primary': mode.surfaces.textPrimary,
    '--text-secondary': mode.surfaces.textSecondary,
    '--text-muted': mode.surfaces.textMuted,
    '--text-prose': mode.surfaces.textProse,
    '--text-statusbar': mode.surfaces.textStatusbar,
    '--accent-primary': primary.base,
    '--accent-primary-hover': primary.hover,
    '--accent-primary-text': primary.text,
    '--accent-primary-soft': primary.soft,
    '--accent-primary-mid': primary.mid,
    '--accent-primary-ink': primary.ink,
    '--accent-secondary': secondary.base,
    '--accent-secondary-hover': secondary.hover,
    '--accent-secondary-text': secondary.text,
    '--accent-secondary-soft': secondary.soft,
    '--accent-secondary-mid': secondary.mid,
    '--accent-secondary-ink': secondary.ink,
    '--chart-series-1': primary.base,
    '--chart-series-2': secondary.base,
    '--chart-series-3': mode.chartPalette[2] ?? primary.hover,
    '--chart-series-4': mode.chartPalette[3] ?? secondary.hover,
    '--chart-series-5': mode.chartPalette[4] ?? primary.text,
    '--chart-series-6': mode.chartPalette[5] ?? secondary.text,
  }
}
