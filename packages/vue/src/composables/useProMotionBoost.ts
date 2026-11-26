/**
 * iOS Safari ProMotion 120Hz Display Booster.
 *
 * Inspired by Rida F'kih's WebKit ProMotion analysis (rida.dev/blog/bypassing-ios-safari-60-fps-limit):
 * On ProMotion iOS devices, WebKit keeps the display at 60-90Hz for standalone GPU-accelerated CSS
 * transitions unless a native smooth-scroll and a live GPU transform animation are simultaneously
 * active. This lightweight booster wakes ONLY on iOS Safari ('GestureEvent' in window) during active
 * touch interactions and automatically shuts down 1000ms after finger lift (zero idle battery cost).
 */

const PACER_PERIOD_MS = 250
const PACER_TRAVEL_PX = 200
const RELEASE_AFTER_MS = 1000

let installedCleanup: (() => void) | null = null

export function installProMotionBoost(): () => void {
  if (installedCleanup) return installedCleanup
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }
  // Only activate on iOS Safari / WebKit touch browsers that expose GestureEvent
  if (!('GestureEvent' in window)) {
    return () => {}
  }

  const host = document.createElement('div')
  host.className = 'vl-promotion-host'
  host.setAttribute('aria-hidden', 'true')

  const pacer = document.createElement('div')
  pacer.className = 'vl-promotion-pacer'
  pacer.setAttribute('aria-hidden', 'true')

  const spacer = document.createElement('div')
  spacer.style.height = `${PACER_TRAVEL_PX * 2}px`
  pacer.appendChild(spacer)
  host.appendChild(pacer)

  const mark = document.createElement('span')
  mark.className = 'vl-promotion-mark'
  mark.setAttribute('aria-hidden', 'true')

  const mountHost = () => {
    if (!host.isConnected && document.body) {
      document.body.appendChild(host)
    }
  }
  if (document.body) {
    mountHost()
  } else {
    document.addEventListener('DOMContentLoaded', mountHost, { once: true })
  }

  let active = false
  let rafId = 0
  let releaseTimer: ReturnType<typeof setTimeout> | null = null
  let forward = true
  let lastPaceAt = -Infinity

  const pace = (now: number) => {
    if (now - lastPaceAt < PACER_PERIOD_MS) return
    lastPaceAt = now
    if (typeof pacer.scrollTo === 'function') {
      pacer.scrollTo({ top: forward ? PACER_TRAVEL_PX : 0, behavior: 'smooth' })
    }
    forward = !forward
  }

  const tick = (now: number) => {
    if (!active) return
    pace(now)
    rafId = window.requestAnimationFrame(tick)
  }

  const stop = () => {
    if (!active) return
    active = false
    if (rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }
    lastPaceAt = -Infinity
    if (mark.isConnected) mark.remove()
  }

  const clearRelease = () => {
    if (releaseTimer !== null) {
      clearTimeout(releaseTimer)
      releaseTimer = null
    }
  }

  const wake = () => {
    mountHost()
    clearRelease()
    if (!mark.isConnected) host.appendChild(mark)
    pace(typeof performance !== 'undefined' ? performance.now() : Date.now())
    if (active) return
    active = true
    rafId = window.requestAnimationFrame(tick)
  }

  const scheduleRelease = (remainingTouches: number) => {
    if (remainingTouches > 0 || !active) return
    clearRelease()
    releaseTimer = setTimeout(stop, RELEASE_AFTER_MS)
  }

  const onTouchStart = () => wake()
  const onTouchEnd = (e: TouchEvent) => scheduleRelease(e.touches.length)
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') {
      clearRelease()
      stop()
    }
  }

  const opts: AddEventListenerOptions = { passive: true, capture: true }
  window.addEventListener('touchstart', onTouchStart, opts)
  window.addEventListener('touchend', onTouchEnd, opts)
  window.addEventListener('touchcancel', onTouchEnd, opts)
  document.addEventListener('visibilitychange', onVisibility)

  installedCleanup = () => {
    window.removeEventListener('touchstart', onTouchStart, opts)
    window.removeEventListener('touchend', onTouchEnd, opts)
    window.removeEventListener('touchcancel', onTouchEnd, opts)
    document.removeEventListener('visibilitychange', onVisibility)
    clearRelease()
    stop()
    host.remove()
    installedCleanup = null
  }

  return installedCleanup
}
