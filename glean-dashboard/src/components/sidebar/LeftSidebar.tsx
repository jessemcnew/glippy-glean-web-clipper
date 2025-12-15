'use client'

import { useState, useEffect } from 'react'
import {
  Home,
  Bookmark,
  Library,
  FolderOpen,
  Plus,
  Upload,
  Settings,
  LogOut,
  Command,
  ChevronRight,
  Loader2,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { fetchCollections, type Collection } from '@/lib/collections-service'
import { useAuth } from '@/contexts/AuthContext'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator'

interface LeftSidebarProps {
  activeNav: string
  onNavChange: (nav: string) => void
  stats: {
    totalClips: number
    syncedCount: number
    pendingCount: number
    failedCount: number
    collectionsCount: number
  }
  savedSearches: Array<{
    id: string
    query: string
    resultCount?: number
    lastRun?: string
  }>
  onExecuteSavedSearch: (searchId: string) => void
  onNewClip?: () => void
  onImportData?: () => void
  onLogout: () => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
}

export function LeftSidebar({
  activeNav,
  onNavChange,
  stats,
  savedSearches,
  onExecuteSavedSearch,
  onNewClip,
  onImportData,
  onLogout,
  onToggleCollapse,
  isCollapsed,
}: LeftSidebarProps) {
  useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const { state: connectionState, isChecking } = useConnectionStatus()
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [isQuickOpen, setIsQuickOpen] = useState(true)
  const [isStatsOpen, setIsStatsOpen] = useState(true)
  const [isSavedOpen, setIsSavedOpen] = useState(true)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(true)

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
    <div className="flex flex-col h-full w-80 bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3 w-full">
          <svg
            className="w-12 h-12 text-zinc-100 flex-shrink-0"
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
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-none text-zinc-100">
              Glippy
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-sm text-zinc-500 tracking-widest uppercase">A</span>
              <img
                src="./images/gln-logo-wordmark-white.png"
                alt="Glean"
                className="h-3.5 opacity-60"
              />
              <span className="text-sm text-zinc-500 tracking-widest uppercase">Clipper</span>
            </div>
          </div>
          <div className="flex items-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Connection status (under header) */}
        <div className="mb-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <ConnectionStatusIndicator
              state={connectionState}
              isChecking={isChecking}
              label={isChecking ? 'Checking Glean…' : connectionState === 'connected' ? 'Connected to Glean' : 'Not connected'}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-200"
            onClick={() => setIsNavOpen((v) => !v)}
            aria-expanded={isNavOpen}
          >
            <span>Navigation</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isNavOpen ? 'rotate-0' : '-rotate-90')} />
          </button>
          {isNavOpen && (
            <>
              <button
                onClick={() => onNavChange('dashboard')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'dashboard'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                )}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => onNavChange('clips')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'clips'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                )}
              >
                <Bookmark className="h-4 w-4" />
                Clips
              </button>
              <button
                onClick={() => onNavChange('library')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'library'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                )}
              >
                <Library className="h-4 w-4" />
                Library
              </button>
              <button
                onClick={() => onNavChange('collections')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'collections'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Collections
              </button>
            </>
          )}
        </nav>

        {/* Quick Actions */}
        <div className="mb-8">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-200"
            onClick={() => setIsQuickOpen((v) => !v)}
            aria-expanded={isQuickOpen}
          >
            <span>Quick Actions</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isQuickOpen ? 'rotate-0' : '-rotate-90')} />
          </button>
          {isQuickOpen && (
            <div className="space-y-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onNewClip}
                className="w-full justify-start bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Clip
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImportData}
                className="w-full justify-start bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-100"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-200"
            onClick={() => setIsStatsOpen((v) => !v)}
            aria-expanded={isStatsOpen}
          >
            <span>Stats</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isStatsOpen ? 'rotate-0' : '-rotate-90')} />
          </button>
          {isStatsOpen && (
            <div className="space-y-3 mt-1">
              <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Total Clips</span>
                  <span className="text-lg font-semibold text-zinc-100">{stats.totalClips}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Synced
                  </span>
                  <span className="text-lg font-semibold text-zinc-100">{stats.syncedCount}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Pending
                  </span>
                  <span className="text-lg font-semibold text-zinc-100">{stats.pendingCount}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Failed
                  </span>
                  <span className="text-lg font-semibold text-zinc-100">{stats.failedCount}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Collections</span>
                  <span className="text-lg font-semibold text-zinc-100">{stats.collectionsCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Searches */}
        <div className="mb-8">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-200"
            onClick={() => setIsSavedOpen((v) => !v)}
            aria-expanded={isSavedOpen}
          >
            <span>Saved Searches</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isSavedOpen ? 'rotate-0' : '-rotate-90')} />
          </button>
          {isSavedOpen && (
            <div className="space-y-1 mt-1">
              {savedSearches.length > 0 ? (
                savedSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => onExecuteSavedSearch(search.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors group"
                  >
                    <span className="truncate">{search.query}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-zinc-500">No saved searches</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="p-4 border-t border-zinc-800">
        <button
          className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 hover:text-zinc-200"
          onClick={() => setIsShortcutsOpen((v) => !v)}
          aria-expanded={isShortcutsOpen}
        >
          <span>Keyboard Shortcuts</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isShortcutsOpen ? 'rotate-0' : '-rotate-90')} />
        </button>
        {isShortcutsOpen && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Search</span>
              <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                <Command className="h-3 w-3 inline mr-1" />
                K
              </kbd>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>New Clip</span>
              <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                <Command className="h-3 w-3 inline mr-1" />
                N
              </kbd>
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
