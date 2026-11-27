import { onBeforeUnmount, watch, type Ref } from 'vue'

export interface BackHandlerEntry {
  id: number
  priority: number
  order: number
  handler: () => boolean | void
}

const backStack: BackHandlerEntry[] = []
let nextHandlerId = 1
let nextOrder = 1
let listenersInstalled = false
let sentinelPushed = false
let ignoreNextPopstate = false
let releaseTimer: number | null = null

function cancelScheduledRelease() {
  if (releaseTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(releaseTimer)
    releaseTimer = null
  }
}

function sortStack() {
  backStack.sort((a, b) => (b.priority !== a.priority ? b.priority - a.priority : b.order - a.order))
}

function ensureHistorySentinel() {
  if (typeof window === 'undefined' || typeof window.history === 'undefined') return
  cancelScheduledRelease()
  if (sentinelPushed || backStack.length === 0) return
  try {
    window.history.pushState({ ...(window.history.state ?? {}), __vlBackSentinel: true }, '')
    sentinelPushed = true
  } catch {
    // Restricted history environments (e.g. sandboxed iframes / file://)
  }
}

function releaseHistorySentinel() {
  if (typeof window === 'undefined' || typeof window.history === 'undefined') return
  if (!sentinelPushed || backStack.length > 0) return
  cancelScheduledRelease()
  // Defer release to the next macrotask so any concurrent router navigation
  // (e.g. clicking a link inside a closing push drawer or sheet) pushes its new
  // history entry first, preventing a spurious history.back() from reverting it.
  releaseTimer = window.setTimeout(() => {
    releaseTimer = null
    if (!sentinelPushed || backStack.length > 0) return
    sentinelPushed = false
    if (window.history.state?.__vlBackSentinel) {
      try {
        ignoreNextPopstate = true
        window.history.back()
      } catch {
        ignoreNextPopstate = false
      }
    }
  }, 0)
}

/**
 * Dispatches a back action to the highest-priority / most-recently-opened active handler.
 * Returns `true` if a handler consumed the back event.
 */
export function dispatchBack(): boolean {
  if (backStack.length === 0) return false
  sortStack()
  for (let i = 0; i < backStack.length; i++) {
    const entry = backStack[i]
    if (!entry) continue
    const result = entry.handler()
    if (result !== false) {
      return true
    }
  }
  return false
}

function onPopState() {
  if (ignoreNextPopstate) {
    ignoreNextPopstate = false
    return
  }
  if (backStack.length === 0) {
    sentinelPushed = false
    return
  }
  const handled = dispatchBack()
  if (handled) {
    sentinelPushed = false
    if (backStack.length > 0) {
      ensureHistorySentinel()
    }
  } else {
    sentinelPushed = false
  }
}

function onMouseBackUp(e: MouseEvent) {
  // Mouse side back button (XButton1 / button === 3) common in Electron / Tauri / Desktop browsers
  if (e.button !== 3) return
  if (backStack.length === 0) return
  e.preventDefault()
  e.stopPropagation()
  dispatchBack()
}

function onMouseBackAuxClick(e: MouseEvent) {
  if (e.button !== 3) return
  e.preventDefault()
  e.stopPropagation()
}

function onKeyBack(e: KeyboardEvent) {
  const isBrowserBack = e.key === 'BrowserBack' || (e.altKey && e.key === 'ArrowLeft')
  if (!isBrowserBack || backStack.length === 0) return
  e.preventDefault()
  e.stopPropagation()
  dispatchBack()
}

function onCustomBackEvent(e: Event) {
  const handled = dispatchBack()
  if (handled && e.cancelable) {
    e.preventDefault()
  }
}

function ensureGlobalListeners() {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  window.addEventListener('popstate', onPopState)
  window.addEventListener('mouseup', onMouseBackUp, true)
  window.addEventListener('auxclick', onMouseBackAuxClick, true)
  window.addEventListener('keydown', onKeyBack, true)
  window.addEventListener('valance:back', onCustomBackEvent)
}

/** Clear all registered back handlers (primarily for test teardown or full app reset) */
export function clearBackHandlers(): void {
  cancelScheduledRelease()
  backStack.length = 0
  sentinelPushed = false
  ignoreNextPopstate = false
}

/**
 * Register an imperative Android-style back handler (LIFO + priority).
 * Returns an unregister function.
 */
export function registerBackHandler(
  handler: () => boolean | void,
  priority = 100,
): () => void {
  ensureGlobalListeners()
  const id = nextHandlerId++
  backStack.push({ id, priority, order: nextOrder++, handler })
  sortStack()
  ensureHistorySentinel()

  return () => {
    const idx = backStack.findIndex((e) => e.id === id)
    if (idx !== -1) backStack.splice(idx, 1)
    if (backStack.length === 0) {
      releaseHistorySentinel()
    }
  }
}

/**
 * Reactive composable: automatically registers a back handler while `isActive` is true
 * (ideal for VlDialog, VlSheet, VlDockSheet, VlPushDrawer, VlCommandPalette, and mobile pickers).
 */
export function useBackHandler(
  isActive: Ref<boolean>,
  onBack: () => boolean | void,
  priority = 100,
) {
  let unregister: (() => void) | null = null

  const sync = (active: boolean) => {
    if (active && !unregister) {
      unregister = registerBackHandler(onBack, priority)
    } else if (!active && unregister) {
      unregister()
      unregister = null
    }
  }

  watch(isActive, sync, { immediate: true })

  onBeforeUnmount(() => {
    unregister?.()
    unregister = null
  })
}

export function useBackNavigation() {
  ensureGlobalListeners()
  return {
    registerBackHandler,
    useBackHandler,
    dispatchBack,
    getStackSize: () => backStack.length,
  }
}
