'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface SidebarContextType {
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setLeftSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = 'glean-dashboard-sidebars'

interface SidebarState {
  left: boolean
  right: boolean
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [leftSidebarOpen, setLeftSidebarOpenState] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpenState] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored) {
        const state: SidebarState = JSON.parse(stored)
        setLeftSidebarOpenState(state.left ?? true)
        setRightSidebarOpenState(state.right ?? true)
      }
    } catch {
      // Ignore parse errors, use defaults
    }
    setMounted(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!mounted) return
    const state: SidebarState = {
      left: leftSidebarOpen,
      right: rightSidebarOpen,
    }
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state))
  }, [leftSidebarOpen, rightSidebarOpen, mounted])

  const toggleLeftSidebar = () => {
    setLeftSidebarOpenState((prev) => !prev)
  }

  const toggleRightSidebar = () => {
    setRightSidebarOpenState((prev) => !prev)
  }

  const setLeftSidebarOpen = (open: boolean) => {
    setLeftSidebarOpenState(open)
  }

  const setRightSidebarOpen = (open: boolean) => {
    setRightSidebarOpenState(open)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SidebarContext.Provider
      value={{
        leftSidebarOpen,
        rightSidebarOpen,
        toggleLeftSidebar,
        toggleRightSidebar,
        setLeftSidebarOpen,
        setRightSidebarOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

