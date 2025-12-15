"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { Toast, ToastOptions } from "@/lib/toast-types"
import { ToastContainer } from "@/components/Toast"

interface ToastContextType {
  toasts: Toast[]
  addToast: (options: ToastOptions) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant || "info",
        duration: options.duration ?? 5000,
        action: options.action,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, newToast.duration)
      }
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

