import { ref, readonly } from 'vue'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: number
  text: string
  tone: ToastTone
}

const currentToast = ref<ToastMessage | null>(null)
let nextId = 1
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function dismiss(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    currentToast.value = null
  }

  function show(text: string, tone: ToastTone = 'info', duration = 2600): void {
    if (timer) clearTimeout(timer)
    currentToast.value = { id: nextId++, text, tone }
    timer = setTimeout(() => {
      currentToast.value = null
      timer = null
    }, duration)
  }

  return {
    toast: readonly(currentToast),
    show,
    info: (text: string, duration?: number) => show(text, 'info', duration),
    success: (text: string, duration?: number) => show(text, 'success', duration),
    warning: (text: string, duration?: number) => show(text, 'warning', duration ?? 3200),
    error: (text: string, duration?: number) => show(text, 'error', duration ?? 3600),
    dismiss,
  }
}
