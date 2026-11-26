import { getM3ShapePath, type M3ShapeName } from './m3Shapes'

export interface MorphPoint {
  x: number
  y: number
}

const SAMPLE_COUNT = 72
const sampledLoopCache = new Map<string, MorphPoint[]>()

const f = (n: number) => Number(n.toFixed(2))

function tokenizePath(d: string): string[] {
  return d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? []
}

function evalQuad(p0: MorphPoint, c: MorphPoint, p1: MorphPoint, t: number): MorphPoint {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  }
}

function evalCubic(
  p0: MorphPoint,
  c1: MorphPoint,
  c2: MorphPoint,
  p1: MorphPoint,
  t: number,
): MorphPoint {
  const mt = 1 - t
  const mt2 = mt * mt
  const t2 = t * t
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t2 * t * p1.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t2 * t * p1.y,
  }
}

/** SVG elliptical arc (endpoint parametrization) sampled as points (W3C F.6.5/F.6.6). */
function sampleSvgArc(
  p0: MorphPoint,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  largeArc: boolean,
  sweep: boolean,
  p1: MorphPoint,
  steps = 16,
): MorphPoint[] {
  let rx = Math.abs(rxIn)
  let ry = Math.abs(ryIn)
  if (rx < 1e-6 || ry < 1e-6) return [p1]

  const dx = p0.x - p1.x
  const dy = p0.y - p1.y
  if (dx * dx + dy * dy < 1e-8) return [p1]

  const phi = (phiDeg * Math.PI) / 180
  const cosP = Math.cos(phi)
  const sinP = Math.sin(phi)

  const x1p = (cosP * dx) / 2 + (sinP * dy) / 2
  const y1p = (-sinP * dx) / 2 + (cosP * dy) / 2

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    const s = Math.sqrt(lambda)
    rx *= s
    ry *= s
  }

  const rx2 = rx * rx
  const ry2 = ry * ry
  const x1p2 = x1p * x1p
  const y1p2 = y1p * y1p
  const num = Math.max(0, rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2)
  const den = rx2 * y1p2 + ry2 * x1p2 || 1
  const factor = (largeArc === sweep ? -1 : 1) * Math.sqrt(num / den)

  const cxp = factor * ((rx * y1p) / ry)
  const cyp = factor * -((ry * x1p) / rx)

  const cx = cosP * cxp - sinP * cyp + (p0.x + p1.x) / 2
  const cy = sinP * cxp + cosP * cyp + (p0.y + p1.y) / 2

  const vecAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy
    const len = (Math.hypot(ux, uy) * Math.hypot(vx, vy)) || 1
    const raw = Math.acos(Math.max(-1, Math.min(1, dot / len)))
    return ux * vy - uy * vx < 0 ? -raw : raw
  }

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dTheta = vecAngle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  )

  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI

  const out: MorphPoint[] = []
  for (let i = 1; i <= steps; i++) {
    const t = theta1 + (dTheta * i) / steps
    const px = rx * Math.cos(t)
    const py = ry * Math.sin(t)
    out.push({
      x: cx + cosP * px - sinP * py,
      y: cy + sinP * px + cosP * py,
    })
  }
  return out
}

function pathToDensePolyline(d: string): MorphPoint[] {
  const tokens = tokenizePath(d)
  const pts: MorphPoint[] = []
  let idx = 0
  let cmd = ''
  let curr: MorphPoint = { x: 0, y: 0 }
  let start: MorphPoint = { x: 0, y: 0 }

  const readNum = () => Number(tokens[idx++] ?? 0)
  const isCmd = (tok: string | undefined) => Boolean(tok && /^[a-zA-Z]$/.test(tok))

  const pushPt = (p: MorphPoint) => {
    const last = pts[pts.length - 1]
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.01) {
      pts.push(p)
    }
    curr = p
  }

  while (idx < tokens.length) {
    if (isCmd(tokens[idx])) {
      cmd = tokens[idx++]!
      if (cmd === 'Z' || cmd === 'z') {
        if (pts.length > 0 && Math.hypot(start.x - curr.x, start.y - curr.y) > 0.05) {
          pts.push({ ...start })
        }
        curr = { ...start }
        continue
      }
    }

    switch (cmd) {
      case 'M': {
        const p = { x: readNum(), y: readNum() }
        start = { ...p }
        pushPt(p)
        cmd = 'L'
        break
      }
      case 'L': {
        const p = { x: readNum(), y: readNum() }
        const last = { ...curr }
        for (let s = 1; s <= 4; s++) {
          const t = s / 4
          pushPt({ x: last.x + (p.x - last.x) * t, y: last.y + (p.y - last.y) * t })
        }
        break
      }
      case 'H': {
        const p = { x: readNum(), y: curr.y }
        const last = { ...curr }
        for (let s = 1; s <= 3; s++) {
          const t = s / 3
          pushPt({ x: last.x + (p.x - last.x) * t, y: last.y })
        }
        break
      }
      case 'V': {
        const p = { x: curr.x, y: readNum() }
        const last = { ...curr }
        for (let s = 1; s <= 3; s++) {
          const t = s / 3
          pushPt({ x: last.x, y: last.y + (p.y - last.y) * t })
        }
        break
      }
      case 'Q': {
        const c = { x: readNum(), y: readNum() }
        const p1 = { x: readNum(), y: readNum() }
        const p0 = { ...curr }
        for (let s = 1; s <= 8; s++) {
          pushPt(evalQuad(p0, c, p1, s / 8))
        }
        break
      }
      case 'C': {
        const c1 = { x: readNum(), y: readNum() }
        const c2 = { x: readNum(), y: readNum() }
        const p1 = { x: readNum(), y: readNum() }
        const p0 = { ...curr }
        for (let s = 1; s <= 10; s++) {
          pushPt(evalCubic(p0, c1, c2, p1, s / 10))
        }
        break
      }
      case 'A': {
        const rx = readNum()
        const ry = readNum()
        const rot = readNum()
        const large = readNum() !== 0
        const sweep = readNum() !== 0
        const p1 = { x: readNum(), y: readNum() }
        const arcPts = sampleSvgArc({ ...curr }, rx, ry, rot, large, sweep, p1, 14)
        for (const ap of arcPts) pushPt(ap)
        break
      }
      default:
        idx++
        break
    }
  }

  return pts
}

function resampleEquidistantClosed(raw: MorphPoint[], count: number): MorphPoint[] {
  if (raw.length < 3) {
    return Array.from({ length: count }, () => ({ x: 50, y: 50 }))
  }

  // Ensure closed loop and clockwise winding in screen space (+Area in y-down coords)
  const poly = raw.slice()
  const first = poly[0]!
  const last = poly[poly.length - 1]!
  if (Math.hypot(first.x - last.x, first.y - last.y) > 0.05) {
    poly.push({ ...first })
  }

  let signedArea = 0
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!
    const b = poly[i + 1]!
    signedArea += a.x * b.y - b.x * a.y
  }
  if (signedArea < 0) poly.reverse()

  const cumLen = [0]
  let total = 0
  for (let i = 1; i < poly.length; i++) {
    total += Math.hypot(poly[i]!.x - poly[i - 1]!.x, poly[i]!.y - poly[i - 1]!.y)
    cumLen.push(total)
  }

  if (total < 1e-4) {
    return Array.from({ length: count }, () => ({ ...first }))
  }

  const samples: MorphPoint[] = []
  let segIdx = 0
  for (let k = 0; k < count; k++) {
    const target = (k * total) / count
    while (segIdx < poly.length - 2 && cumLen[segIdx + 1]! < target) {
      segIdx++
    }
    const l0 = cumLen[segIdx]!
    const l1 = cumLen[segIdx + 1]!
    const span = l1 - l0 || 1
    const alpha = Math.max(0, Math.min(1, (target - l0) / span))
    const p0 = poly[segIdx]!
    const p1 = poly[segIdx + 1]!
    samples.push({
      x: p0.x + (p1.x - p0.x) * alpha,
      y: p0.y + (p1.y - p0.y) * alpha,
    })
  }

  // Align loop index 0 to closest point to straight-up (-PI / 2) from center (50, 50)
  let bestIdx = 0
  let bestDiff = Infinity
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i]!
    let diff = Math.abs(Math.atan2(p.y - 50, p.x - 50) - -Math.PI / 2)
    if (diff > Math.PI) diff = 2 * Math.PI - diff
    if (diff < bestDiff) {
      bestDiff = diff
      bestIdx = i
    }
  }

  if (bestIdx === 0) return samples
  return [...samples.slice(bestIdx), ...samples.slice(0, bestIdx)]
}

export function getSampledM3Loop(shape: M3ShapeName | string): MorphPoint[] {
  const key = shape
  const cached = sampledLoopCache.get(key)
  if (cached) return cached
  const d = typeof shape === 'string' && shape.startsWith('M ') ? shape : getM3ShapePath(shape as M3ShapeName)
  const loop = resampleEquidistantClosed(pathToDensePolyline(d), SAMPLE_COUNT)
  sampledLoopCache.set(key, loop)
  return loop
}

export function sampleRawPathToLoop(d: string): MorphPoint[] {
  return resampleEquidistantClosed(pathToDensePolyline(d), SAMPLE_COUNT)
}

export function loopToSvgPath(pts: MorphPoint[]): string {
  const n = pts.length
  if (n < 3) return ''
  let d = `M ${f(pts[0]!.x)},${f(pts[0]!.y)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!
    const p1 = pts[i]!
    const p2 = pts[(i + 1) % n]!
    const p3 = pts[(i + 2) % n]!
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2.x)},${f(p2.y)}`
  }
  return `${d} Z`
}

export function interpolateLoops(from: MorphPoint[], to: MorphPoint[], t: number): MorphPoint[] {
  const clamped = Math.max(0, Math.min(1, t))
  const len = Math.min(from.length, to.length)
  const out: MorphPoint[] = new Array(len)
  for (let i = 0; i < len; i++) {
    const a = from[i]!
    const b = to[i]!
    out[i] = {
      x: a.x + (b.x - a.x) * clamped,
      y: a.y + (b.y - a.y) * clamped,
    }
  }
  return out
}

export function interpolateM3ShapePath(
  fromShape: M3ShapeName | string,
  toShape: M3ShapeName | string,
  t: number,
): string {
  const clamped = Math.max(0, Math.min(1, t))
  if (clamped <= 0.001 && !fromShape.startsWith('M ')) return getM3ShapePath(fromShape as M3ShapeName)
  if (clamped >= 0.999 && !toShape.startsWith('M ')) return getM3ShapePath(toShape as M3ShapeName)
  const a = getSampledM3Loop(fromShape)
  const b = getSampledM3Loop(toShape)
  return loopToSvgPath(interpolateLoops(a, b, clamped))
}

/** Expressive springy ease helper for M3E shape morphing. */
export function expressiveMorphEase(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  // Crisp smooth quintic + slight overshoot impulse that clamps softly inside [0, 1] for vertices
  return 1 - Math.pow(1 - x, 3)
}
