/**
 * Material 3 Expressive 35 Geometric Shapes (+ Canonical Rect)
 * All paths use a normalized 0 0 100 100 SVG viewBox, zero box-shadow, zero medium CSS border-radius.
 */

export type M3ShapeName =
  | 'circle'
  | 'square'
  | 'slanted'
  | 'arch'
  | 'semicircle'
  | 'oval'
  | 'pill'
  | 'triangle'
  | 'arrow'
  | 'fan'
  | 'diamond'
  | 'clamshell'
  | 'pentagon'
  | 'gem'
  | 'very-sunny'
  | 'sunny'
  | 'cookie-4'
  | 'cookie-6'
  | 'cookie-7'
  | 'cookie-9'
  | 'cookie-12'
  | 'clover-4'
  | 'clover-8'
  | 'burst'
  | 'soft-burst'
  | 'boom'
  | 'soft-boom'
  | 'flower'
  | 'puffy'
  | 'puffy-diamond'
  | 'ghost'
  | 'pixel-circle'
  | 'pixel-triangle'
  | 'bun'
  | 'heart'
  | 'rect'

export type M3ShapeCategory = 'basic' | 'polygon' | 'scalloped' | 'organic' | 'expressive'

export interface M3ShapeMeta {
  id: M3ShapeName
  label: string
  zhLabel: string
  category: M3ShapeCategory
  path: string
}

interface Pt {
  x: number
  y: number
}

const f = (n: number) => Number(n.toFixed(2))

/** Closed C1 Catmull-Rom spline through ordered points around the loop. */
function closedSmoothPath(pts: Pt[], tension = 1 / 6): string {
  const n = pts.length
  if (n < 3) return ''
  let d = `M ${f(pts[0]!.x)},${f(pts[0]!.y)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!
    const p1 = pts[i]!
    const p2 = pts[(i + 1) % n]!
    const p3 = pts[(i + 2) % n]!
    const c1x = p1.x + (p2.x - p0.x) * tension
    const c1y = p1.y + (p2.y - p0.y) * tension
    const c2x = p2.x - (p3.x - p1.x) * tension
    const c2y = p2.y - (p3.y - p1.y) * tension
    d += ` C ${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2.x)},${f(p2.y)}`
  }
  return `${d} Z`
}

/** Rounded polygon helper: blends corners symmetrically without straight medium CSS border-radius. */
function roundedPolyPath(vertices: Pt[], radiusRatio = 0.2): string {
  const n = vertices.length
  if (n < 3) return ''
  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n]!
    const curr = vertices[i]!
    const next = vertices[(i + 1) % n]!

    const dx1 = prev.x - curr.x
    const dy1 = prev.y - curr.y
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y

    const len1 = Math.hypot(dx1, dy1) || 1
    const len2 = Math.hypot(dx2, dy2) || 1
    const r = Math.min(len1, len2) * radiusRatio

    const pIn: Pt = { x: curr.x + (dx1 / len1) * r, y: curr.y + (dy1 / len1) * r }
    const pOut: Pt = { x: curr.x + (dx2 / len2) * r, y: curr.y + (dy2 / len2) * r }

    if (i === 0) parts.push(`M ${f(pIn.x)},${f(pIn.y)}`)
    else parts.push(`L ${f(pIn.x)},${f(pIn.y)}`)
    parts.push(`Q ${f(curr.x)},${f(curr.y)} ${f(pOut.x)},${f(pOut.y)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

function regularPolyPoints(sides: number, r: number, rotateDeg = -90, rxScale = 1, ryScale = 1): Pt[] {
  const pts: Pt[] = []
  const rad0 = (rotateDeg * Math.PI) / 180
  for (let i = 0; i < sides; i++) {
    const a = rad0 + (i * 2 * Math.PI) / sides
    pts.push({
      x: 50 + Math.cos(a) * r * rxScale,
      y: 50 + Math.sin(a) * r * ryScale,
    })
  }
  return pts
}

function starPoints(pointsCount: number, rOuter: number, rInner: number, rotateDeg = -90): Pt[] {
  const pts: Pt[] = []
  const total = pointsCount * 2
  const rad0 = (rotateDeg * Math.PI) / 180
  for (let i = 0; i < total; i++) {
    const a = rad0 + (i * Math.PI) / pointsCount
    const r = i % 2 === 0 ? rOuter : rInner
    pts.push({ x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r })
  }
  return pts
}

function radialWavePath(
  lobes: number,
  rOuter: number,
  rInner: number,
  rotateDeg = -90,
  tension = 0.19,
  rxScale = 1,
  ryScale = 1,
): string {
  const pts: Pt[] = []
  const total = lobes * 2
  const rad0 = (rotateDeg * Math.PI) / 180
  for (let i = 0; i < total; i++) {
    const a = rad0 + (i * Math.PI) / lobes
    const r = i % 2 === 0 ? rOuter : rInner
    pts.push({
      x: 50 + Math.cos(a) * r * rxScale,
      y: 50 + Math.sin(a) * r * ryScale,
    })
  }
  return closedSmoothPath(pts, tension)
}

function superellipseSquirclePath(r = 44, exp = 4.6, skewX = 0): string {
  const samples = 24
  const pts: Pt[] = []
  for (let i = 0; i < samples; i++) {
    const t = (i * 2 * Math.PI) / samples
    const ct = Math.cos(t)
    const st = Math.sin(t)
    const xRaw = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / exp) * r
    const yRaw = Math.sign(st) * Math.pow(Math.abs(st), 2 / exp) * r
    pts.push({ x: 50 + xRaw + (-yRaw / r) * skewX, y: 50 + yRaw })
  }
  return closedSmoothPath(pts, 0.16)
}

function tiltedEllipsePath(rx: number, ry: number, angleDeg = -45): string {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const pts: Pt[] = []
  const count = 16
  for (let i = 0; i < count; i++) {
    const t = (i * 2 * Math.PI) / count
    const px = rx * Math.cos(t)
    const py = ry * Math.sin(t)
    pts.push({
      x: 50 + px * cos - py * sin,
      y: 50 + px * sin + py * cos,
    })
  }
  return closedSmoothPath(pts, 0.167)
}

function tiltedCapsulePath(halfSpan: number, radius: number, angleDeg = -45): string {
  const rad = (angleDeg * Math.PI) / 180
  const ux = Math.cos(rad)
  const uy = Math.sin(rad)
  const nx = -uy
  const ny = ux
  const c1 = { x: 50 - ux * halfSpan, y: 50 - uy * halfSpan }
  const c2 = { x: 50 + ux * halfSpan, y: 50 + uy * halfSpan }
  const p1 = { x: c1.x + nx * radius, y: c1.y + ny * radius }
  const p2 = { x: c2.x + nx * radius, y: c2.y + ny * radius }
  const p3 = { x: c2.x - nx * radius, y: c2.y - ny * radius }
  const p4 = { x: c1.x - nx * radius, y: c1.y - ny * radius }
  return [
    `M ${f(p1.x)},${f(p1.y)}`,
    `L ${f(p2.x)},${f(p2.y)}`,
    `A ${f(radius)},${f(radius)} 0 1,0 ${f(p3.x)},${f(p3.y)}`,
    `L ${f(p4.x)},${f(p4.y)}`,
    `A ${f(radius)},${f(radius)} 0 1,0 ${f(p1.x)},${f(p1.y)}`,
    'Z',
  ].join(' ')
}

function pixelCirclePath(): string {
  // Orthogonal stepped 10x10 quantized pixel circle inside 8..92
  return 'M 36,8 H 64 V 16 H 76 V 24 H 84 V 36 H 92 V 64 H 84 V 76 H 76 V 84 H 64 V 92 H 36 V 84 H 24 V 76 H 16 V 64 H 8 V 36 H 16 V 24 H 24 V 16 H 36 Z'
}

function pixelTrianglePath(): string {
  // Right-pointing stepped 8-bit pixel triangle inside 14..88
  return 'M 14,8 H 28 V 18 H 42 V 28 H 58 V 38 H 74 V 44 H 88 V 56 H 74 V 62 H 58 V 72 H 42 V 82 H 28 V 92 H 14 Z'
}

function clover4Path(): string {
  // 4 overlapping lobes centered at (33,33), (67,33), (67,67), (33,67), r=24.5
  return [
    'M 50,15.36',
    'A 24.5,24.5 0 1,1 84.64,50',
    'A 24.5,24.5 0 1,1 50,84.64',
    'A 24.5,24.5 0 1,1 15.36,50',
    'A 24.5,24.5 0 1,1 50,15.36',
    'Z',
  ].join(' ')
}

function puffyDiamondPath(): string {
  // 4 lobes along N/E/S/W axes centered at (50,27),(73,50),(50,73),(27,50), r=20
  return [
    'M 64.14,35.86',
    'A 20,20 0 1,0 35.86,35.86',
    'A 20,20 0 1,0 35.86,64.14',
    'A 20,20 0 1,0 64.14,64.14',
    'A 20,20 0 1,0 64.14,35.86',
    'Z',
  ].join(' ')
}

function clover8Path(): string {
  return radialWavePath(8, 45.5, 36.5, -90, 0.22)
}

function puffyCloudPath(): string {
  return radialWavePath(10, 45.5, 37.5, -90, 0.22, 1.06, 0.88)
}

const RAW_SHAPES: M3ShapeMeta[] = [
  // Row 1
  {
    id: 'circle',
    label: 'Circle',
    zhLabel: '正圆',
    category: 'basic',
    path: 'M 50,4 A 46,46 0 1,1 49.99,4 Z',
  },
  {
    id: 'square',
    label: 'Square',
    zhLabel: 'M3 方圆',
    category: 'basic',
    path: superellipseSquirclePath(44, 4.8, 0),
  },
  {
    id: 'slanted',
    label: 'Slanted',
    zhLabel: '斜切方',
    category: 'basic',
    path: superellipseSquirclePath(41, 4.8, 8.5),
  },
  {
    id: 'arch',
    label: 'Arch',
    zhLabel: '拱门',
    category: 'basic',
    path: 'M 10,50 A 40,42 0 0,1 90,50 V 74 Q 90,90 74,90 H 26 Q 10,90 10,74 Z',
  },
  {
    id: 'semicircle',
    label: 'Semicircle',
    zhLabel: '半圆',
    category: 'basic',
    path: 'M 6,62 A 44,42 0 0,1 94,62 V 70 Q 94,82 82,82 H 18 Q 6,82 6,70 Z',
  },

  // Row 2
  {
    id: 'oval',
    label: 'Oval',
    zhLabel: '斜椭圆',
    category: 'basic',
    path: tiltedEllipsePath(47, 29, -45),
  },
  {
    id: 'pill',
    label: 'Pill',
    zhLabel: '斜胶囊',
    category: 'basic',
    path: tiltedCapsulePath(15, 29, -45),
  },
  {
    id: 'triangle',
    label: 'Triangle',
    zhLabel: '三角',
    category: 'polygon',
    path: roundedPolyPath(
      [
        { x: 50, y: 8 },
        { x: 92, y: 82 },
        { x: 8, y: 82 },
      ],
      0.16,
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    zhLabel: '箭头三角',
    category: 'polygon',
    path: closedSmoothPath(
      [
        { x: 50, y: 10 },
        { x: 70, y: 40 },
        { x: 92, y: 74 },
        { x: 76, y: 84 },
        { x: 50, y: 74 },
        { x: 24, y: 84 },
        { x: 8, y: 74 },
        { x: 30, y: 40 },
      ],
      0.16,
    ),
  },
  {
    id: 'fan',
    label: 'Fan',
    zhLabel: '折扇',
    category: 'basic',
    path: 'M 10,20 Q 10,8 22,8 H 24 A 68,68 0 0,1 92,76 V 78 Q 92,90 80,90 H 24 Q 10,90 10,76 Z',
  },

  // Row 3
  {
    id: 'diamond',
    label: 'Diamond',
    zhLabel: '菱形',
    category: 'polygon',
    path: roundedPolyPath(
      [
        { x: 50, y: 5 },
        { x: 86, y: 50 },
        { x: 50, y: 95 },
        { x: 14, y: 50 },
      ],
      0.22,
    ),
  },
  {
    id: 'clamshell',
    label: 'Clamshell',
    zhLabel: '贝壳',
    category: 'polygon',
    path: roundedPolyPath(
      [
        { x: 28, y: 18 },
        { x: 72, y: 18 },
        { x: 95, y: 50 },
        { x: 72, y: 82 },
        { x: 28, y: 82 },
        { x: 5, y: 50 },
      ],
      0.24,
    ),
  },
  {
    id: 'pentagon',
    label: 'Pentagon',
    zhLabel: '五边形',
    category: 'polygon',
    path: roundedPolyPath(regularPolyPoints(5, 46, -90), 0.16),
  },
  {
    id: 'gem',
    label: 'Gem',
    zhLabel: '宝石',
    category: 'polygon',
    path: roundedPolyPath(
      [
        { x: 50, y: 6 },
        { x: 88, y: 26 },
        { x: 84, y: 74 },
        { x: 50, y: 94 },
        { x: 16, y: 74 },
        { x: 12, y: 26 },
      ],
      0.22,
    ),
  },
  {
    id: 'very-sunny',
    label: 'Very sunny',
    zhLabel: '八芒晴日',
    category: 'scalloped',
    path: radialWavePath(8, 46, 33, -90, 0.2),
  },

  // Row 4
  {
    id: 'sunny',
    label: 'Sunny',
    zhLabel: '柔芒太阳',
    category: 'scalloped',
    path: radialWavePath(8, 46, 38, -67.5, 0.16),
  },
  {
    id: 'cookie-4',
    label: '4-sided cookie',
    zhLabel: '四瓣曲奇',
    category: 'scalloped',
    path: radialWavePath(4, 46, 34.5, -45, 0.22),
  },
  {
    id: 'cookie-6',
    label: '6-sided cookie',
    zhLabel: '六瓣曲奇',
    category: 'scalloped',
    path: radialWavePath(6, 46, 38.5, -90, 0.2),
  },
  {
    id: 'cookie-7',
    label: '7-sided cookie',
    zhLabel: '七瓣曲奇',
    category: 'scalloped',
    path: radialWavePath(7, 46, 39.5, -90, 0.2),
  },
  {
    id: 'cookie-9',
    label: '9-sided cookie',
    zhLabel: '九瓣曲奇',
    category: 'scalloped',
    path: radialWavePath(9, 46, 40.5, -90, 0.2),
  },

  // Row 5
  {
    id: 'cookie-12',
    label: '12-sided cookie',
    zhLabel: '十二瓣曲奇',
    category: 'scalloped',
    path: radialWavePath(12, 46, 41.5, -90, 0.2),
  },
  {
    id: 'clover-4',
    label: '4-leaf clover',
    zhLabel: '四叶草',
    category: 'organic',
    path: clover4Path(),
  },
  {
    id: 'clover-8',
    label: '8-leaf clover',
    zhLabel: '八叶草',
    category: 'organic',
    path: clover8Path(),
  },
  {
    id: 'burst',
    label: 'Burst',
    zhLabel: '星芒爆发',
    category: 'expressive',
    path: closedSmoothPath(starPoints(12, 47, 29, -90), 0.04),
  },
  {
    id: 'soft-burst',
    label: 'Soft burst',
    zhLabel: '柔角星爆',
    category: 'expressive',
    path: radialWavePath(10, 46, 34, -90, 0.14),
  },

  // Row 6
  {
    id: 'boom',
    label: 'Boom',
    zhLabel: '尖峰辐射',
    category: 'expressive',
    path: closedSmoothPath(starPoints(15, 48, 21, -90), 0.03),
  },
  {
    id: 'soft-boom',
    label: 'Soft boom',
    zhLabel: '绒花辐射',
    category: 'expressive',
    path: radialWavePath(16, 46, 26.5, -90, 0.15),
  },
  {
    id: 'flower',
    label: 'Flower',
    zhLabel: '繁花',
    category: 'organic',
    path: radialWavePath(8, 46, 28, -90, 0.21),
  },
  {
    id: 'puffy',
    label: 'Puffy',
    zhLabel: '蓬松云朵',
    category: 'organic',
    path: puffyCloudPath(),
  },
  {
    id: 'puffy-diamond',
    label: 'Puffy diamond',
    zhLabel: '蓬松菱花',
    category: 'organic',
    path: puffyDiamondPath(),
  },

  // Row 7
  {
    id: 'ghost',
    label: 'Ghost-ish',
    zhLabel: '波浪幽灵',
    category: 'expressive',
    path: 'M 10,50 A 40,42 0 0,1 90,50 V 72 C 90,90 74,94 63,86 C 55,80 45,80 37,86 C 26,94 10,90 10,72 Z',
  },
  {
    id: 'pixel-circle',
    label: 'Pixel circle',
    zhLabel: '像素圆',
    category: 'expressive',
    path: pixelCirclePath(),
  },
  {
    id: 'pixel-triangle',
    label: 'Pixel triangle',
    zhLabel: '像素三角',
    category: 'expressive',
    path: pixelTrianglePath(),
  },
  {
    id: 'bun',
    label: 'Bun',
    zhLabel: '双层软包',
    category: 'expressive',
    path: 'M 20.1,50 A 18,18 0 0,1 26,15 H 74 A 18,18 0 0,1 79.9,50 A 18,18 0 0,1 74,85 H 26 A 18,18 0 0,1 20.1,50 Z',
  },
  {
    id: 'heart',
    label: 'Heart',
    zhLabel: '爱心',
    category: 'expressive',
    path: 'M 50,90 C 46,87 9,59 9,33 C 9,17 21,8 34,8 C 42,8 47,12 50,18 C 53,12 58,8 66,8 C 79,8 91,17 91,33 C 91,59 54,87 50,90 Z',
  },
]

export const M3_SHAPE_CANONICAL_RECT: M3ShapeMeta = {
  id: 'rect',
  label: 'Canonical Rect',
  zhLabel: '标准直角',
  category: 'basic',
  path: 'M 4,4 H 96 V 96 H 4 Z',
}

/** Complete array of the 35 Material 3 Expressive shapes. */
export const M3_EXPRESSIVE_SHAPES: M3ShapeMeta[] = RAW_SHAPES

/** All 36 available geometric shapes in Valance UI (35 M3 Expressive + canonical rect). */
export const ALL_M3_SHAPES: M3ShapeMeta[] = [...RAW_SHAPES, M3_SHAPE_CANONICAL_RECT]

export const M3_SHAPE_MAP: Record<M3ShapeName, M3ShapeMeta> = Object.fromEntries(
  ALL_M3_SHAPES.map((s) => [s.id, s]),
) as Record<M3ShapeName, M3ShapeMeta>

export function getM3ShapePath(shape: M3ShapeName): string {
  return (M3_SHAPE_MAP[shape] ?? M3_SHAPE_CANONICAL_RECT).path
}

export { getSampledM3Loop as getM3ShapePoints, interpolateM3ShapePath as morphM3ShapePath } from './m3ShapeMorph'
