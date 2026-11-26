import { ref, onBeforeUnmount } from 'vue'

export interface SplitResizeOptions {
  side: 'left' | 'right'
  getWidth: () => number
  setWidth: (next: number) => void
  minWidth: number
  maxWidth: number
  defaultWidth: number
  getMaxAllowed?: () => number
}

export function useSplitResize(options: SplitResizeOptions) {
  const isDragging = ref(false)
  let startX = 0
  let startWidth = 0

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return
    const delta = e.clientX - startX
    const rawNext = options.side === 'left' ? startWidth + delta : startWidth - delta
    const dynamicMax = options.getMaxAllowed
      ? Math.min(options.maxWidth, options.getMaxAllowed())
      : options.maxWidth
    const clamped = Math.max(
      options.minWidth,
      Math.min(Math.max(options.minWidth, dynamicMax), rawNext),
    )
    options.setWidth(Math.round(clamped))
  }

  function stopDrag() {
    if (!isDragging.value) return
    isDragging.value = false
    if (typeof document !== 'undefined') {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDrag)
      window.removeEventListener('pointercancel', stopDrag)
    }
  }

  function startDrag(e: PointerEvent) {
    if (e.button !== 0 || typeof window === 'undefined') return
    e.preventDefault()
    isDragging.value = true
    startX = e.clientX
    startWidth = options.getWidth()
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
  }

  function resetWidth() {
    options.setWidth(options.defaultWidth)
  }

  onBeforeUnmount(stopDrag)

  return {
    isDragging,
    startDrag,
    resetWidth,
  }
}
