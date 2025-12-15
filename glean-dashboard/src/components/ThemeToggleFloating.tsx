'use client'

import dynamic from 'next/dynamic'

const ToggleTheme = dynamic(() => import('@/components/ui/toggle-theme').then((m) => m.ToggleTheme), {
  ssr: false,
})

export default function ThemeToggleFloating() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <ToggleTheme />
    </div>
  )
}

