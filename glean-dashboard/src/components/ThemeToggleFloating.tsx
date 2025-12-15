'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

const ToggleTheme = dynamic(() => import('@/components/ui/toggle-theme').then((m) => m.ToggleTheme), {
  ssr: false,
})

interface ThemeToggleFloatingProps {
  rightSidebarCollapsed?: boolean
}

export default function ThemeToggleFloating({ rightSidebarCollapsed = false }: ThemeToggleFloatingProps) {
  // Calculate right position based on sidebar state
  // Expanded: 320px (w-80), Collapsed: 80px (w-20)
  const rightPosition = rightSidebarCollapsed 
    ? 'calc(80px + 1rem)' // 80px sidebar + 1rem padding
    : 'calc(320px + 1rem)' // 320px sidebar + 1rem padding

  return (
    <div 
      className="fixed top-4 z-50 transition-all duration-300 ease-in-out"
      style={{ right: rightPosition }}
    >
      <ToggleTheme />
    </div>
  )
}

