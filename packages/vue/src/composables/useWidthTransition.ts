import { ref, nextTick } from 'vue'

export interface WidthTransitionOptions {
  getScroller: () => HTMLElement | null
  getWidthPx: () => number
  getNextWidthPx: () => number
  paragraphSelector?: string
}

export function useWidthTransition() {
  const isWidthMorphing = ref(false)

  function runWidthTransition(commit: () => void, options: WidthTransitionOptions): void {
    const vp = options.getScroller()
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      commit()
      return
    }

    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> }
    }
    const canTransition = typeof doc.startViewTransition === 'function'
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!vp || !canTransition || reducedMotion) {
      commit()
      return
    }

    const selector = options.paragraphSelector ?? '.vl-prose p, .reader-prose p'
    const vpRect = vp.getBoundingClientRect()
    const paragraphs = Array.from(vp.querySelectorAll<HTMLElement>(selector))

    let anchorIndex = -1
    let anchorDeltaY = 0
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i]
      if (!p) continue
      const r = p.getBoundingClientRect()
      if (r.bottom > vpRect.top + 12) {
        anchorIndex = i
        anchorDeltaY = r.top - vpRect.top
        break
      }
    }

    const oldW = Math.min(vpRect.width, options.getWidthPx())
    const newW = Math.min(vpRect.width, options.getNextWidthPx())
    const fromInset = Math.max(0, Math.round((vpRect.width - oldW) / 2))
    const toInset = Math.max(0, Math.round((vpRect.width - newW) / 2))

    const root = document.documentElement
    root.style.setProperty('--width-inset-from', `${fromInset}px`)
    root.style.setProperty('--width-inset-to', `${toInset}px`)
    root.dataset.vtKind = 'width'
    isWidthMorphing.value = true

    nextTick(() => {
      const transition = doc.startViewTransition!(async () => {
        commit()
        await nextTick()
        if (anchorIndex >= 0) {
          const nextParas = vp.querySelectorAll<HTMLElement>(selector)
          const anchorEl = nextParas[anchorIndex]
          if (anchorEl) {
            const newVpTop = vp.getBoundingClientRect().top
            const newAnchorTop = anchorEl.getBoundingClientRect().top
            vp.scrollTop += newAnchorTop - (newVpTop + anchorDeltaY)
          }
        }
      })

      transition.finished.finally(() => {
        isWidthMorphing.value = false
        if (root.dataset.vtKind === 'width') {
          delete root.dataset.vtKind
        }
      })
    })
  }

  return {
    isWidthMorphing,
    runWidthTransition,
  }
}
