export interface IconNode {
  tag: 'path' | 'circle' | 'rect' | 'line' | 'polygon'
  attrs: Record<string, string | number>
}

export type BuiltinIconName =
  | 'files'
  | 'search'
  | 'folder'
  | 'folder-open'
  | 'doc'
  | 'book'
  | 'tree'
  | 'tiles'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'close'
  | 'panel-left'
  | 'panel-right'
  | 'sun'
  | 'moon'
  | 'comment'
  | 'settings'
  | 'expand'
  | 'collapse'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'reset'
  | 'refresh'
  | 'curve'
  | 'clock'
  | 'flask'
  | 'calendar'
  | 'biotech'
  | 'sliders'
  | 'plus'
  | 'minus'
  | 'pill'
  | 'edit'
  | 'trash'
  | 'play'
  | 'check'
  | 'download'
  | 'upload'
  | 'bell'
  | 'home'
  | 'menu'
  | 'external-link'
  | 'link'
  | 'compass'
  | 'copy'
  | 'share'
  | 'filter'
  | 'sort'
  | 'more-horizontal'
  | 'more-vertical'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'pin'
  | 'bookmark'
  | 'heart'
  | 'star'
  | 'send'
  | 'info'
  | 'warning'
  | 'alert-circle'
  | 'check-circle'
  | 'help-circle'
  | 'sparkles'
  | 'code'
  | 'terminal'
  | 'tag'
  | 'hash'
  | 'layers'
  | 'palette'
  | 'type'
  | 'layout'
  | 'smartphone'
  | 'tablet'
  | 'monitor'
  | 'grid'
  | 'list'
  | 'user'
  | 'archive'
  | 'rss'
  | 'github'
  | 'mail'
  | 'globe'
  | 'gesture'

export type IconName = BuiltinIconName | (string & {})

const p = (d: string, extra: Record<string, string | number> = {}): IconNode => ({
  tag: 'path',
  attrs: { d, stroke: 'currentColor', 'stroke-width': 1.4, ...extra },
})

const c = (
  cx: number,
  cy: number,
  r: number,
  extra: Record<string, string | number> = {},
): IconNode => ({
  tag: 'circle',
  attrs: { cx, cy, r, stroke: 'currentColor', 'stroke-width': 1.4, ...extra },
})

const r = (
  x: number,
  y: number,
  width: number,
  height: number,
  extra: Record<string, string | number> = {},
): IconNode => ({
  tag: 'rect',
  attrs: { x, y, width, height, stroke: 'currentColor', 'stroke-width': 1.35, ...extra },
})

const l = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  extra: Record<string, string | number> = {},
): IconNode => ({
  tag: 'line',
  attrs: { x1, y1, x2, y2, stroke: 'currentColor', 'stroke-width': 1.45, ...extra },
})

export const ICON_REGISTRY: Record<string, IconNode[]> = {
  files: [
    r(2, 2, 8, 10, { 'stroke-width': 1.4 }),
    p('M10 5H13.5V14H5.5V12'),
  ],
  search: [
    c(7, 7, 4.5, { 'stroke-width': 1.5 }),
    l(10.4, 10.4, 14, 14, { 'stroke-width': 1.6 }),
  ],
  folder: [p('M1.5 3H6.2L7.7 4.8H14.5V13H1.5V3Z', { 'stroke-width': 1.35 })],
  'folder-open': [
    p('M1.5 3H6.2L7.7 4.8H13.5V7H3.2L1.5 13V3Z', { 'stroke-width': 1.35 }),
    p('M1.5 13L3.2 7H14.8L13.1 13H1.5Z', { 'stroke-width': 1.35 }),
  ],
  doc: [
    p('M3 1.5H10L13 4.5V14.5H3V1.5Z', { 'stroke-width': 1.35 }),
    p('M10 1.5V4.5H13', { 'stroke-width': 1.35 }),
    l(5.2, 7.5, 10.8, 7.5, { 'stroke-width': 1.2 }),
    l(5.2, 10.5, 9.2, 10.5, { 'stroke-width': 1.2 }),
  ],
  book: [
    r(2.2, 2, 11.6, 12),
    l(5.5, 2, 5.5, 14, { 'stroke-width': 1.35 }),
    l(7.8, 5.5, 11.4, 5.5, { 'stroke-width': 1.2 }),
    l(7.8, 8.5, 11.4, 8.5, { 'stroke-width': 1.2 }),
  ],
  tree: [
    l(2, 3.5, 14, 3.5, { 'stroke-width': 1.4 }),
    l(5, 8, 14, 8, { 'stroke-width': 1.4 }),
    l(5, 12.5, 14, 12.5, { 'stroke-width': 1.4 }),
    p('M2.5 5V12.5H4.2', { 'stroke-width': 1.2 }),
  ],
  tiles: [
    r(2, 2, 5, 5),
    r(9, 2, 5, 5),
    r(2, 9, 5, 5),
    r(9, 9, 5, 5),
  ],
  'chevron-right': [p('M6 3.5L10.5 8L6 12.5', { 'stroke-width': 1.45 })],
  'chevron-left': [p('M10 3.5L5.5 8L10 12.5', { 'stroke-width': 1.45 })],
  'chevron-down': [p('M3.5 6L8 10.5L12.5 6', { 'stroke-width': 1.45 })],
  'chevron-up': [p('M3.5 10L8 5.5L12.5 10', { 'stroke-width': 1.45 })],
  close: [
    l(4, 4, 12, 12, { 'stroke-width': 1.5 }),
    l(12, 4, 4, 12, { 'stroke-width': 1.5 }),
  ],
  'panel-left': [
    r(1.5, 2.5, 13, 11),
    l(5.8, 2.5, 5.8, 13.5, { 'stroke-width': 1.35 }),
    { tag: 'rect', attrs: { x: 2.2, y: 3.2, width: 3, height: 9.6, fill: 'currentColor', 'fill-opacity': 0.4 } },
  ],
  'panel-right': [
    r(1.5, 2.5, 13, 11),
    l(10.2, 2.5, 10.2, 13.5, { 'stroke-width': 1.35 }),
    { tag: 'rect', attrs: { x: 10.8, y: 3.2, width: 3, height: 9.6, fill: 'currentColor', 'fill-opacity': 0.4 } },
  ],
  sun: [
    c(8, 8, 3, { 'stroke-width': 1.45 }),
    l(8, 1.2, 8, 3),
    l(8, 13, 8, 14.8),
    l(1.2, 8, 3, 8),
    l(13, 8, 14.8, 8),
    l(3.2, 3.2, 4.5, 4.5),
    l(11.5, 11.5, 12.8, 12.8),
    l(12.8, 3.2, 11.5, 4.5),
    l(4.5, 11.5, 3.2, 12.8),
  ],
  moon: [p('M12.6 9.8A5.2 5.2 0 0 1 6.2 3.4A5.5 5.5 0 1 0 12.6 9.8Z', { 'stroke-width': 1.45 })],
  comment: [
    p('M2 2.5H14V11H6.5L3 14V11H2V2.5Z', { 'stroke-width': 1.35 }),
    l(5, 5.8, 11, 5.8, { 'stroke-width': 1.25 }),
    l(5, 8.2, 9, 8.2, { 'stroke-width': 1.25 }),
  ],
  settings: [
    c(8, 8, 2.4),
    c(8, 8, 5.1, { 'stroke-width': 1.35, 'stroke-dasharray': '2.4 1.6' }),
  ],
  expand: [p('M4 6L8 2.5L12 6'), p('M4 10L8 13.5L12 10')],
  collapse: [p('M4 3L8 6.5L12 3'), p('M4 13L8 9.5L12 13')],
  'arrow-left': [l(13, 8, 3.5, 8), p('M7.5 4L3.5 8L7.5 12', { 'stroke-width': 1.45 })],
  'arrow-right': [l(3, 8, 12.5, 8), p('M8.5 4L12.5 8L8.5 12', { 'stroke-width': 1.45 })],
  'arrow-up': [l(8, 13, 8, 3.5), p('M4 7.5L8 3.5L12 7.5', { 'stroke-width': 1.45 })],
  'arrow-down': [l(8, 3, 8, 12.5), p('M4 8.5L8 12.5L12 8.5', { 'stroke-width': 1.45 })],
  reset: [p('M12.5 8A4.5 4.5 0 1 1 11.2 4.8'), p('M11.5 2V5.2H8.3')],
  refresh: [p('M12.5 8A4.5 4.5 0 1 1 11.2 4.8'), p('M11.5 2V5.2H8.3')],
  curve: [
    p('M2 13.5H14', { 'stroke-width': 1.35 }),
    p('M2 13.5V2.5', { 'stroke-width': 1.35 }),
    p('M2.5 12C4.2 12 5.2 4 7.2 4C9.2 4 10.6 9.8 14 10.8', { 'stroke-width': 1.5 }),
    { tag: 'circle', attrs: { cx: 7.2, cy: 4, r: 1.4, fill: 'currentColor' } },
  ],
  clock: [c(8, 8, 5.6), p('M8 4.6V8.2L10.6 9.8')],
  flask: [
    p('M6 2H10M6.8 2V5.8L3 13.2H13L9.2 5.8V2', { 'stroke-width': 1.35 }),
    l(4.8, 10.2, 11.2, 10.2, { 'stroke-width': 1.25 }),
  ],
  calendar: [
    r(2, 3.2, 12, 10.6),
    l(2, 6.4, 14, 6.4, { 'stroke-width': 1.35 }),
    l(5.2, 1.8, 5.2, 4.4, { 'stroke-width': 1.4 }),
    l(10.8, 1.8, 10.8, 4.4, { 'stroke-width': 1.4 }),
    { tag: 'rect', attrs: { x: 4.8, y: 8.6, width: 2.2, height: 2.2, fill: 'currentColor' } },
    { tag: 'rect', attrs: { x: 9, y: 8.6, width: 2.2, height: 2.2, fill: 'currentColor' } },
  ],
  biotech: [
    c(8, 4.2, 2.2, { 'stroke-width': 1.35 }),
    p('M8 6.4V11.2', { 'stroke-width': 1.35 }),
    p('M4.2 13.5H11.8', { 'stroke-width': 1.45 }),
    p('M5.5 9.2H10.5', { 'stroke-width': 1.35 }),
  ],
  sliders: [
    l(2, 4.5, 4.2, 4.5, { 'stroke-width': 1.35 }),
    l(7.8, 4.5, 14, 4.5, { 'stroke-width': 1.35 }),
    { tag: 'circle', attrs: { cx: 6, cy: 4.5, r: 1.7, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.35 } },
    l(2, 11.5, 8.4, 11.5, { 'stroke-width': 1.35 }),
    l(12, 11.5, 14, 11.5, { 'stroke-width': 1.35 }),
    { tag: 'circle', attrs: { cx: 10.2, cy: 11.5, r: 1.7, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.35 } },
  ],
  plus: [l(8, 3, 8, 13, { 'stroke-width': 1.6 }), l(3, 8, 13, 8, { 'stroke-width': 1.6 })],
  minus: [l(3, 8, 13, 8, { 'stroke-width': 1.6 })],
  pill: [r(2.2, 5, 11.6, 6, { rx: 3 }), l(8, 5, 8, 11, { 'stroke-width': 1.35 })],
  edit: [p('M2.5 13.5H5.5L13 6L10 3L2.5 10.5V13.5Z', { 'stroke-width': 1.35 })],
  trash: [
    l(2.5, 4.2, 13.5, 4.2, { 'stroke-width': 1.35 }),
    p('M5.6 4.2V2.4H10.4V4.2', { 'stroke-width': 1.35 }),
    p('M4.2 4.2L4.8 13.5H11.2L11.8 4.2', { 'stroke-width': 1.35 }),
  ],
  play: [p('M4.5 3L13 8L4.5 13V3Z', { 'stroke-width': 1.35, fill: 'currentColor', 'fill-opacity': 0.2 })],
  check: [p('M3 8.2L6.5 11.7L13 4.5', { 'stroke-width': 1.6 })],
  download: [
    l(8, 2.5, 8, 10.5),
    p('M4.8 7.5L8 10.7L11.2 7.5', { 'stroke-width': 1.45 }),
    l(2.5, 13.5, 13.5, 13.5),
  ],
  upload: [
    l(8, 10.5, 8, 2.5),
    p('M4.8 5.7L8 2.5L11.2 5.7', { 'stroke-width': 1.45 }),
    l(2.5, 13.5, 13.5, 13.5),
  ],
  bell: [
    p('M4.2 10.5V7.2A3.8 3.8 0 0 1 11.8 7.2V10.5L13.2 12H2.8L4.2 10.5Z', { 'stroke-width': 1.35 }),
    p('M6.5 13.5A1.5 1.5 0 0 0 9.5 13.5', { 'stroke-width': 1.35 }),
  ],
  home: [
    p('M2.2 7.6L8 2.5L13.8 7.6V13.8H10V9.6H6V13.8H2.2V7.6Z', { 'stroke-width': 1.35 }),
  ],
  menu: [
    l(2.2, 4.2, 13.8, 4.2),
    l(2.2, 8, 13.8, 8),
    l(2.2, 11.8, 13.8, 11.8),
  ],
  'external-link': [
    p('M9.5 2.5H13.5V6.5'),
    l(13.5, 2.5, 7.5, 8.5),
    p('M11.5 9V13.5H2.5V4.5H7', { 'stroke-width': 1.35 }),
  ],
  link: [
    p('M6.8 9.2L9.2 6.8', { 'stroke-width': 1.4 }),
    p('M5.5 10.5L4.2 11.8A2.4 2.4 0 0 1 4.2 8.4L6.2 6.4A2.4 2.4 0 0 1 9.6 6.4'),
    p('M10.5 5.5L11.8 4.2A2.4 2.4 0 0 1 11.8 7.6L9.8 9.6A2.4 2.4 0 0 1 6.4 9.6'),
  ],
  compass: [
    c(8, 8, 6),
    { tag: 'polygon', attrs: { points: '10.6,5.4 6.6,6.8 5.4,10.6 9.4,9.2', stroke: 'currentColor', 'stroke-width': 1.25, fill: 'currentColor', 'fill-opacity': 0.2 } },
  ],
  copy: [
    r(5.2, 5.2, 8.3, 8.3),
    p('M10.8 5.2V2.5H2.5V10.8H5.2', { 'stroke-width': 1.35 }),
  ],
  share: [
    c(12, 3.4, 1.7),
    c(4, 8, 1.7),
    c(12, 12.6, 1.7),
    l(5.5, 7.1, 10.5, 4.3, { 'stroke-width': 1.3 }),
    l(5.5, 8.9, 10.5, 11.7, { 'stroke-width': 1.3 }),
  ],
  filter: [p('M2 3H14L9.4 8.5V13.2L6.6 11.8V8.5L2 3Z', { 'stroke-width': 1.35 })],
  sort: [
    l(5, 2.8, 5, 13.2),
    p('M2.6 5.2L5 2.8L7.4 5.2'),
    l(11, 13.2, 11, 2.8),
    p('M8.6 10.8L11 13.2L13.4 10.8'),
  ],
  'more-horizontal': [
    { tag: 'circle', attrs: { cx: 3.5, cy: 8, r: 1.2, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 8, cy: 8, r: 1.2, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 12.5, cy: 8, r: 1.2, fill: 'currentColor' } },
  ],
  'more-vertical': [
    { tag: 'circle', attrs: { cx: 8, cy: 3.5, r: 1.2, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 8, cy: 8, r: 1.2, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 8, cy: 12.5, r: 1.2, fill: 'currentColor' } },
  ],
  eye: [
    p('M1.6 8C3.1 5 5.4 3.6 8 3.6C10.6 3.6 12.9 5 14.4 8C12.9 11 10.6 12.4 8 12.4C5.4 12.4 3.1 11 1.6 8Z', { 'stroke-width': 1.35 }),
    c(8, 8, 1.9),
  ],
  'eye-off': [
    p('M1.6 8C3.1 5 5.4 3.6 8 3.6C10.6 3.6 12.9 5 14.4 8C12.9 11 10.6 12.4 8 12.4C5.4 12.4 3.1 11 1.6 8Z', { 'stroke-width': 1.35 }),
    l(2.5, 2.5, 13.5, 13.5, { 'stroke-width': 1.45 }),
  ],
  lock: [
    r(3.2, 7, 9.6, 6.8),
    p('M5.2 7V4.8A2.8 2.8 0 0 1 10.8 4.8V7', { 'stroke-width': 1.35 }),
    { tag: 'circle', attrs: { cx: 8, cy: 10.4, r: 1.0, fill: 'currentColor' } },
  ],
  unlock: [
    r(3.2, 7, 9.6, 6.8),
    p('M5.2 7V4.8A2.8 2.8 0 0 1 10.4 3.6', { 'stroke-width': 1.35 }),
  ],
  pin: [
    p('M5 2.5H11L10.2 7.2L12.5 9.2H3.5L5.8 7.2L5 2.5Z', { 'stroke-width': 1.35 }),
    l(8, 9.2, 8, 14.2),
  ],
  bookmark: [p('M3.8 2.2H12.2V14L8 11.2L3.8 14V2.2Z', { 'stroke-width': 1.35 })],
  heart: [p('M8 13.4C8 13.4 2.2 9.6 2.2 5.7A3.1 3.1 0 0 1 8 4.2A3.1 3.1 0 0 1 13.8 5.7C13.8 9.6 8 13.4 8 13.4Z', { 'stroke-width': 1.35 })],
  star: [
    { tag: 'polygon', attrs: { points: '8,1.8 9.9,5.6 14.1,6.2 11,9.2 11.8,13.4 8,11.4 4.2,13.4 5,9.2 1.9,6.2 6.1,5.6', stroke: 'currentColor', 'stroke-width': 1.3 } },
  ],
  send: [
    p('M2 8L14 2.5L10.5 14L7.8 9.2L2 8Z', { 'stroke-width': 1.35 }),
    l(7.8, 9.2, 14, 2.5, { 'stroke-width': 1.25 }),
  ],
  info: [
    c(8, 8, 5.8),
    l(8, 7.2, 8, 11.2, { 'stroke-width': 1.5 }),
    { tag: 'circle', attrs: { cx: 8, cy: 4.8, r: 0.9, fill: 'currentColor' } },
  ],
  warning: [
    { tag: 'polygon', attrs: { points: '8,2.2 14.2,13.2 1.8,13.2', stroke: 'currentColor', 'stroke-width': 1.35 } },
    l(8, 6.2, 8, 9.6, { 'stroke-width': 1.45 }),
    { tag: 'circle', attrs: { cx: 8, cy: 11.4, r: 0.85, fill: 'currentColor' } },
  ],
  'alert-circle': [
    c(8, 8, 5.8),
    l(8, 4.8, 8, 8.8, { 'stroke-width': 1.5 }),
    { tag: 'circle', attrs: { cx: 8, cy: 11.1, r: 0.9, fill: 'currentColor' } },
  ],
  'check-circle': [
    c(8, 8, 5.8),
    p('M5.3 8.2L7.2 10.1L10.9 6.1', { 'stroke-width': 1.45 }),
  ],
  'help-circle': [
    c(8, 8, 5.8),
    p('M6.3 6.2A1.8 1.8 0 0 1 9.8 6.8C9.8 8 8 8.3 8 9.5', { 'stroke-width': 1.35 }),
    { tag: 'circle', attrs: { cx: 8, cy: 11.5, r: 0.85, fill: 'currentColor' } },
  ],
  sparkles: [
    p('M8 2L9.2 6.8L14 8L9.2 9.2L8 14L6.8 9.2L2 8L6.8 6.8L8 2Z', { 'stroke-width': 1.25 }),
  ],
  code: [
    p('M5.5 4.5L2 8L5.5 11.5'),
    p('M10.5 4.5L14 8L10.5 11.5'),
    l(9, 3.2, 7, 12.8, { 'stroke-width': 1.3 }),
  ],
  terminal: [
    r(1.8, 2.5, 12.4, 11),
    p('M4.5 6L7 8L4.5 10'),
    l(8.5, 10.5, 11.8, 10.5),
  ],
  tag: [
    p('M2.5 2.5H7.8L13.5 8.2L8.2 13.5L2.5 7.8V2.5Z', { 'stroke-width': 1.35 }),
    { tag: 'circle', attrs: { cx: 5.5, cy: 5.5, r: 1.0, fill: 'currentColor' } },
  ],
  hash: [
    l(5.8, 2.5, 4.4, 13.5),
    l(11.6, 2.5, 10.2, 13.5),
    l(2.5, 5.8, 13.8, 5.8),
    l(2.2, 10.2, 13.5, 10.2),
  ],
  layers: [
    { tag: 'polygon', attrs: { points: '8,2.2 14,5.4 8,8.6 2,5.4', stroke: 'currentColor', 'stroke-width': 1.3 } },
    p('M2 8.2L8 11.4L14 8.2', { 'stroke-width': 1.3 }),
    p('M2 10.8L8 14L14 10.8', { 'stroke-width': 1.3 }),
  ],
  palette: [
    c(8, 8, 5.8),
    { tag: 'circle', attrs: { cx: 6, cy: 6.2, r: 1.0, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 10, cy: 6.2, r: 1.0, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 5.6, cy: 9.6, r: 1.0, fill: 'currentColor' } },
    { tag: 'circle', attrs: { cx: 10, cy: 10.4, r: 1.3, stroke: 'currentColor', 'stroke-width': 1.2 } },
  ],
  type: [
    l(3, 3.2, 13, 3.2, { 'stroke-width': 1.5 }),
    l(8, 3.2, 8, 13.2, { 'stroke-width': 1.5 }),
    l(5.8, 13.2, 10.2, 13.2, { 'stroke-width': 1.4 }),
  ],
  layout: [
    r(1.8, 2.2, 12.4, 11.6),
    l(1.8, 5.6, 14.2, 5.6, { 'stroke-width': 1.3 }),
    l(6, 5.6, 6, 13.8, { 'stroke-width': 1.3 }),
  ],
  smartphone: [
    r(4.2, 1.8, 7.6, 12.4),
    l(6.6, 12.2, 9.4, 12.2, { 'stroke-width': 1.4 }),
  ],
  tablet: [
    r(2.6, 1.8, 10.8, 12.4),
    l(6.6, 12.2, 9.4, 12.2, { 'stroke-width': 1.4 }),
  ],
  monitor: [
    r(1.8, 2.5, 12.4, 8.8),
    l(8, 11.3, 8, 13.6),
    l(5, 13.6, 11, 13.6),
  ],
  grid: [
    r(2, 2, 5, 5),
    r(9, 2, 5, 5),
    r(2, 9, 5, 5),
    r(9, 9, 5, 5),
  ],
  list: [
    { tag: 'rect', attrs: { x: 2.2, y: 3.1, width: 1.8, height: 1.8, fill: 'currentColor' } },
    l(5.8, 4, 13.8, 4),
    { tag: 'rect', attrs: { x: 2.2, y: 7.1, width: 1.8, height: 1.8, fill: 'currentColor' } },
    l(5.8, 8, 13.8, 8),
    { tag: 'rect', attrs: { x: 2.2, y: 11.1, width: 1.8, height: 1.8, fill: 'currentColor' } },
    l(5.8, 12, 13.8, 12),
  ],
  user: [
    c(8, 5.2, 2.6),
    p('M3 13.5C3.4 10.7 5.5 9.2 8 9.2C10.5 9.2 12.6 10.7 13 13.5', { 'stroke-width': 1.4 }),
  ],
  archive: [
    r(2, 2.4, 12, 3.2),
    p('M3 5.6V13.4H13V5.6', { 'stroke-width': 1.35 }),
    l(6.2, 8.5, 9.8, 8.5, { 'stroke-width': 1.4 }),
  ],
  rss: [
    { tag: 'circle', attrs: { cx: 3.8, cy: 12.2, r: 1.3, fill: 'currentColor' } },
    p('M2.8 7.5A5.7 5.7 0 0 1 8.5 13.2', { 'stroke-width': 1.4 }),
    p('M2.8 3.2A10 10 0 0 1 12.8 13.2', { 'stroke-width': 1.4 }),
  ],
  github: [
    p('M6 13.5V11.2C4.2 11.6 3.7 10.4 3.7 10.4C3.3 9.4 2.7 9.1 2.7 9.1C1.9 8.6 2.8 8.6 2.8 8.6C3.7 8.7 4.2 9.5 4.2 9.5C5 10.8 6.2 10.4 6.6 10.2C6.7 9.6 6.9 9.2 7.2 9C5.5 8.8 3.7 8.1 3.7 5.2C3.7 4.4 4 3.7 4.5 3.2C4.4 3 4.1 2.2 4.6 1.2C4.6 1.2 5.3 1 6.7 2C7.3 1.8 8 1.7 8.7 1.7C9.4 1.7 10.1 1.8 10.7 2C12.1 1 12.8 1.2 12.8 1.2C13.3 2.2 13 3 12.9 3.2C13.4 3.7 13.7 4.4 13.7 5.2C13.7 8.1 11.9 8.8 10.2 9C10.5 9.3 10.8 9.9 10.8 10.8V13.5', { 'stroke-width': 1.25 }),
  ],
  mail: [
    r(1.8, 3.2, 12.4, 9.6),
    p('M2.2 3.8L8 8.6L13.8 3.8', { 'stroke-width': 1.35 }),
  ],
  globe: [
    c(8, 8, 5.8, { 'stroke-width': 1.35 }),
    l(2.2, 8, 13.8, 8, { 'stroke-width': 1.25 }),
    p('M8 2.2C10.1 4.4 10.1 11.6 8 13.8C5.9 11.6 5.9 4.4 8 2.2', { 'stroke-width': 1.25 }),
  ],
  gesture: [
    c(5, 5, 2.2),
    p('M8.5 5H13.5M11.5 2.8L13.8 5L11.5 7.2'),
    p('M5 8.8V13.2L8 11.4L11 13.2V8.8', { 'stroke-width': 1.3 }),
  ],
}

export interface IconCategory {
  id: string
  label: string
  icons: BuiltinIconName[]
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'navigation',
    label: '导航与布局',
    icons: [
      'home', 'menu', 'panel-left', 'panel-right', 'layout', 'compass',
      'chevron-right', 'chevron-left', 'chevron-down', 'chevron-up',
      'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
      'expand', 'collapse', 'external-link', 'link',
    ],
  },
  {
    id: 'files',
    label: '文档与视图',
    icons: [
      'files', 'folder', 'folder-open', 'doc', 'book', 'tree', 'tiles',
      'grid', 'list', 'archive', 'tag', 'hash', 'layers', 'code', 'terminal',
    ],
  },
  {
    id: 'actions',
    label: '操作与交互',
    icons: [
      'search', 'plus', 'minus', 'edit', 'trash', 'copy', 'share', 'play',
      'check', 'close', 'refresh', 'reset', 'download', 'upload', 'filter',
      'sort', 'pin', 'bookmark', 'send', 'more-horizontal', 'more-vertical',
      'gesture',
    ],
  },
  {
    id: 'status',
    label: '状态与主题',
    icons: [
      'sun', 'moon', 'palette', 'type', 'settings', 'sliders', 'bell',
      'comment', 'eye', 'eye-off', 'lock', 'unlock', 'heart', 'star',
      'info', 'warning', 'alert-circle', 'check-circle', 'help-circle', 'sparkles',
    ],
  },
  {
    id: 'domain',
    label: '科学、设备与社交',
    icons: [
      'curve', 'clock', 'flask', 'calendar', 'biotech', 'pill',
      'smartphone', 'tablet', 'monitor', 'globe', 'user', 'rss', 'github', 'mail',
    ],
  },
]

export function registerIcons(custom: Record<string, IconNode[]>): void {
  Object.assign(ICON_REGISTRY, custom)
}

export function getAllIconNames(): string[] {
  return Object.keys(ICON_REGISTRY)
}
