'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CollapsibleSidebarProps {
  isOpen: boolean
  onToggle: () => void
  side: 'left' | 'right'
  width?: string
  children: React.ReactNode
  className?: string
}

export function CollapsibleSidebar({
  isOpen,
  onToggle,
  side,
  width = 'w-72',
  children,
  className,
}: CollapsibleSidebarProps) {
  const isLeft = side === 'left'

  return (
    <div className="relative flex">
      {/* Sidebar content */}
      <div
        className={cn(
          'flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-all duration-200 ease-in-out overflow-hidden',
          isLeft ? 'border-r' : 'border-l',
          'border-zinc-200 dark:border-zinc-800',
          isOpen ? width : 'w-0',
          isOpen ? 'opacity-100' : 'opacity-0',
          className
        )}
      >
        <div className={cn('flex flex-col h-full', isOpen ? 'visible' : 'invisible')}>
          {children}
        </div>
      </div>

      {/* Toggle button - positioned on edge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 z-10',
          'h-6 w-6 rounded-full',
          'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700',
          'border border-zinc-200 dark:border-zinc-700',
          'shadow-sm',
          isLeft
            ? isOpen
              ? '-right-3'
              : 'left-0 ml-1'
            : isOpen
              ? '-left-3'
              : 'right-0 mr-1'
        )}
        aria-label={isOpen ? `Collapse ${side} sidebar` : `Expand ${side} sidebar`}
      >
        {isLeft ? (
          isOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )
        ) : isOpen ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}
