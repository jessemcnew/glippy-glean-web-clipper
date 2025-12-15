export type ToastVariant = "success" | "error" | "warning" | "info"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
  action?: ToastAction
}

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}

