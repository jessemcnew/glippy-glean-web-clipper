"use client"

import type React from "react"
import { useState } from "react"
import type { Toast, ToastVariant } from "@/lib/toast-types"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const variantConfig: Record<ToastVariant, { icon: React.ElementType; borderColor: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    borderColor: "border-green-500",
    iconColor: "text-green-500",
  },
  error: {
    icon: XCircle,
    borderColor: "border-red-500",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-amber-500",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    borderColor: "border-blue-500",
    iconColor: "text-blue-500",
  },
}

export function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)
  const config = variantConfig[toast.variant]
  const Icon = config.icon

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // Match animation duration
  }

  return (
    <div
      className={cn(
        "pointer-events-auto",
        "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg",
        `border-l-4 ${config.borderColor}`,
        "p-4 pr-8 relative",
        "transition-all duration-300 ease-in-out",
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      )}
      style={{
        animation: isExiting ? undefined : "slideInRight 0.3s ease-out",
      }}
    >
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-3">
        <Icon className={cn("w-5 h-5", config.iconColor, "flex-shrink-0 mt-0.5")} />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{toast.title}</h3>

          {toast.description && <p className="text-sm text-zinc-700 dark:text-zinc-400 mt-1 leading-snug">{toast.description}</p>}

          {toast.action && (
            <Button
              size="sm"
              variant="outline"
              onClick={toast.action.onClick}
              className="mt-3 h-8 text-xs border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 bg-transparent"
            >
              {toast.action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
