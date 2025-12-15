'use client'

import { useState, useEffect } from 'react'
import {
  Home,
  Bookmark,
  Library,
  FolderOpen,
  Settings,
  LogOut,
  Command,
  ChevronDown,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { fetchCollections, type Collection } from '@/lib/collections-service'
import { useAuth } from '@/contexts/AuthContext'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator'
import { useCollapsibleSidebar } from '@/components/CollapsibleSidebar'

interface LeftSidebarProps {
  activeNav: string
  onNavChange: (nav: string) => void
  onLogout: () => void
}

export function LeftSidebar({
  activeNav,
  onNavChange,
  onLogout,
}: LeftSidebarProps) {
  useAuth()
  const sidebarContext = useCollapsibleSidebar()
  const isCollapsed = sidebarContext?.isCollapsed ?? false
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const { state: connectionState, isChecking } = useConnectionStatus()
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    setIsLoadingCollections(true)
    try {
      const data = await fetchCollections()
      setCollections(data)
    } catch (error) {
      console.error('Failed to load collections:', error)
    } finally {
      setIsLoadingCollections(false)
    }
  }


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className={cn("flex items-center gap-3 w-full", isCollapsed && "justify-center")}>
          <svg
            className="w-12 h-12 text-foreground flex-shrink-0"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Glippy logo"
          >
            <path
              d="M32 14L18 28C16.3431 29.6569 16.3431 32.3431 18 34C19.6569 35.6569 22.3431 35.6569 24 34L36 22C39.3137 18.6863 39.3137 13.3137 36 10C32.6863 6.68629 27.3137 6.68629 24 10L12 22C7.02944 26.9706 7.02944 34.0294 12 39C16.9706 43.9706 24.0294 43.9706 29 39L41 27"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight leading-none text-foreground">
                Glippy
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-sm text-muted-foreground tracking-widest uppercase">A</span>
                <img
                  src="./images/gln-logo-wordmark-black.png"
                  alt="Glean"
                  className="h-3.5 opacity-60 dark:hidden"
                />
                <img
                  src="./images/gln-logo-wordmark-white.png"
                  alt="Glean"
                  className="h-3.5 opacity-60 hidden dark:inline"
                />
                <span className="text-sm text-muted-foreground tracking-widest uppercase">Clipper</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Connection status (under header) */}
        {!isCollapsed && (
          <div className="mb-4">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <ConnectionStatusIndicator
                state={connectionState}
                isChecking={isChecking}
                label={isChecking ? 'Checking Glean…' : connectionState === 'connected' ? 'Connected to Glean' : 'Not connected'}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1 mb-4">
          {!isCollapsed && (
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
              onClick={() => setIsNavOpen((v) => !v)}
              aria-expanded={isNavOpen}
            >
              <span>Navigation</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', isNavOpen ? 'rotate-0' : '-rotate-90')} />
            </button>
          )}
          {isNavOpen && (
            <>
              <button
                onClick={() => onNavChange('dashboard')}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-3 py-2',
                  activeNav === 'dashboard'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Home className="h-4 w-4" />
                {!isCollapsed && <span>Dashboard</span>}
              </button>
              <button
                onClick={() => onNavChange('clips')}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-3 py-2',
                  activeNav === 'clips'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Bookmark className="h-4 w-4" />
                {!isCollapsed && <span>Clips</span>}
              </button>
              <button
                onClick={() => onNavChange('library')}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-3 py-2',
                  activeNav === 'library'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Library className="h-4 w-4" />
                {!isCollapsed && <span>Library</span>}
              </button>
              <button
                onClick={() => onNavChange('collections')}
                className={cn(
                  'w-full flex items-center rounded-lg text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-3 py-2',
                  activeNav === 'collections'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                {!isCollapsed && <span>Collections</span>}
              </button>
            </>
          )}
        </nav>

        {/* MY COLLECTIONS */}
        <div className="mb-6">
          {!isCollapsed && (
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
              onClick={() => setIsCollectionsOpen((v) => !v)}
              aria-expanded={isCollectionsOpen}
            >
              <span>MY COLLECTIONS</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', isCollectionsOpen ? 'rotate-0' : '-rotate-90')} />
            </button>
          )}
          {isCollectionsOpen && (
            <div className="space-y-1 mt-1">
              {isLoadingCollections ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                </div>
              ) : collections.length > 0 ? (
                collections.map((collection) => (
                  <a
                    key={collection.id}
                    href={`/library?collectionId=${collection.id}`}
                    className={cn(
                      "w-full flex items-center rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors group",
                      isCollapsed ? "justify-center py-3 px-2" : "justify-between px-3 py-2"
                    )}
                  >
                    <div className={cn("flex items-center flex-1 min-w-0", isCollapsed ? "justify-center" : "gap-2")}>
                      <FolderOpen className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{collection.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </a>
                ))
              ) : (
                !isCollapsed && <p className="px-3 py-2 text-sm text-muted-foreground">No collections yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Cmd+K Search */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground hover:bg-accent",
            isCollapsed ? "justify-center p-0 h-auto" : "justify-start"
          )}
          onClick={() => {
            // Trigger command palette - this will be handled by Dashboard
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }}
        >
          <Command className="h-4 w-4" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left ml-2">Search</span>
              <kbd className="px-1.5 py-0.5 bg-accent rounded border border-border text-xs">
                ⌘K
              </kbd>
            </>
          )}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground hover:bg-accent",
            isCollapsed ? "justify-center p-0 h-auto" : "justify-start"
          )}
        >
          <Settings className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Settings</span>}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className={cn(
            "w-full text-muted-foreground hover:text-foreground hover:bg-accent",
            isCollapsed ? "justify-center p-0 h-auto" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
