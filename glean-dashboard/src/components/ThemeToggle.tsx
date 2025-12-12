'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-zinc-100 dark:bg-zinc-800',
        'border border-zinc-200 dark:border-zinc-700',
        'text-zinc-700 dark:text-zinc-300',
        'hover:bg-zinc-200 dark:hover:bg-zinc-700',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950'
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'} theme`}
      title={`Current: ${theme === 'system' ? `System (${resolvedTheme})` : theme}`}
    >
      <Sun
        className={cn(
          'h-4 w-4 transition-all duration-200',
          resolvedTheme === 'light' ? 'opacity-100 scale-100' : 'opacity-40 scale-90'
        )}
      />
      <Moon
        className={cn(
          'h-4 w-4 transition-all duration-200',
          resolvedTheme === 'dark' ? 'opacity-100 scale-100' : 'opacity-40 scale-90'
        )}
      />
    </button>
  )
}
