import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export type ViewportTier = 'phone' | 'dual' | 'desktop'

export interface ViewportTierOptions {
  phoneMaxWidth?: number
  dualMaxWidth?: number
  fallbackWidth?: number
}

export function detectViewportTier(
  width: number,
  phoneMaxWidth = 640,
  dualMaxWidth = 1080,
): ViewportTier {
  if (width <= phoneMaxWidth) return 'phone'
  if (width <= dualMaxWidth) return 'dual'
  return 'desktop'
}

export function useViewportTier(options: ViewportTierOptions = {}) {
  const phoneMax = options.phoneMaxWidth ?? 640
  const dualMax = options.dualMaxWidth ?? 1080
  const fallbackWidth = options.fallbackWidth ?? 1280

  const viewportWidth = ref(
    typeof window !== 'undefined' ? window.innerWidth : fallbackWidth,
  )

  const tier = computed<ViewportTier>(() =>
    detectViewportTier(viewportWidth.value, phoneMax, dualMax),
  )
  const isPhone = computed(() => tier.value === 'phone')
  const isMobile = isPhone
  const isDual = computed(() => tier.value === 'dual')
  const isDesktop = computed(() => tier.value === 'desktop')

  function sync() {
    if (typeof window !== 'undefined') {
      viewportWidth.value = window.innerWidth
    }
  }

  onMounted(() => {
    sync()
    window.addEventListener('resize', sync, { passive: true })
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', sync)
    }
  })

  return {
    viewportWidth,
    tier,
    isPhone,
    isMobile,
    isDual,
    isDesktop,
    sync,
  }
}
