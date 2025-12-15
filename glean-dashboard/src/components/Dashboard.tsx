'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Tag,
  Clock,
  ChevronRight,
  Bookmark,
  Plus,
} from 'lucide-react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { RightSidebar } from '@/components/sidebar/RightSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchClips, type Clip } from '@/lib/clips-service'
import { fetchCollections } from '@/lib/collections-service'
import { loadSidebarState, saveSidebarState } from '@/lib/sidebar-state'

interface DashboardProps {
  onLogout?: () => void
}

interface SavedSearch {
  id: string
  query: string
  resultCount?: number
  lastRun?: string
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [isLoadingClips, setIsLoadingClips] = useState(true)
  const [collections, setCollections] = useState<any[]>([])
  const initialSidebarState = loadSidebarState()
  const [sidebarState, setSidebarState] = useState(() => initialSidebarState)
  const [layout, setLayout] = useState<number[]>(() => {
    const left = initialSidebarState.leftCollapsed ? 0 : initialSidebarState.leftWidth
    const right = initialSidebarState.rightCollapsed ? 0 : initialSidebarState.rightWidth
    const middle = Math.max(100 - left - right, 10)
    return [left, middle, right]
  })

  // Mock saved searches - will be from real data later
  const [savedSearches] = useState<SavedSearch[]>([
    { id: '1', query: 'product roadmap', resultCount: 24, lastRun: '1 hour ago' },
    { id: '2', query: 'engineering docs', resultCount: 156, lastRun: '3 hours ago' },
    { id: '3', query: 'design system', resultCount: 42, lastRun: '1 day ago' },
  ])

  // Load clips and collections on mount
  useEffect(() => {
    loadClips()
    loadCollections()
  }, [])

  const loadClips = async () => {
    setIsLoadingClips(true)
    try {
      const loadedClips = await fetchClips()
      setClips(loadedClips)
    } catch (error) {
      console.error('Failed to load clips:', error)
      setClips([])
    } finally {
      setIsLoadingClips(false)
    }
  }

  const loadCollections = async () => {
    try {
      const data = await fetchCollections()
      setCollections(data)
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  // Calculate stats
  const stats = {
    totalClips: clips.length,
    syncedCount: clips.filter((c) => c.syncStatus === 'synced').length,
    pendingCount: clips.filter((c) => c.syncStatus === 'pending' || !c.syncStatus).length,
    failedCount: clips.filter((c) => c.syncStatus === 'failed').length,
    collectionsCount: collections.length,
  }

  // Get recent clips (last 6, sorted by date)
  const recentClips = clips
    .sort((a, b) => {
      const dateA = a.timestamp || new Date(a.date).getTime()
      const dateB = b.timestamp || new Date(b.date).getTime()
      return dateB - dateA
    })
    .slice(0, 6)
    .map((clip) => {
      const clipTimestamp = clip.timestamp || new Date(clip.date).getTime()
      return {
        id: String(clip.id),
        title: clip.title || 'Untitled',
        snippet: clip.selectedText || clip.title || 'No content',
        source: clip.source || clip.domain || 'Unknown',
        timestamp: formatTimestamp(clipTimestamp),
        tags: clip.tags || [],
        isFavorite: false, // Will be from real data later
        syncStatus: clip.syncStatus,
      }
    })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      setSearchError(null)
      // Simulate search - will be real Glean search later
      setTimeout(() => {
        setIsSearching(false)
      }, 1000)
    }
  }

  const handleExecuteSavedSearch = (searchId: string) => {
    const search = savedSearches.find((s) => s.id === searchId)
    if (search) {
      setSearchQuery(search.query)
      handleSearchSubmit(new Event('submit') as any)
    }
  }

  const handleNewClip = () => {
    // Will open new clip modal/form later
    console.log('New clip')
  }

  const handleImportData = () => {
    // Will open import modal later
    console.log('Import data')
  }

  const handleLayoutChange = (sizes: number[]) => {
    setLayout(sizes)
    setSidebarState((prev) => {
      const next = { ...prev, leftWidth: sizes[0], rightWidth: sizes[2] }
      saveSidebarState(next)
      return next
    })
  }

  const toggleLeft = () => {
    setSidebarState((prev) => {
      const collapsing = !prev.leftCollapsed
      if (collapsing) {
        const newLayout: number[] = [0, Math.max(100 - layout[2], 10), layout[2]]
        setLayout(newLayout)
        saveSidebarState({ ...prev, leftCollapsed: true })
        return { ...prev, leftCollapsed: true }
      } else {
        const leftWidth = prev.leftWidth > 2 ? prev.leftWidth : 20
        const right = layout[2]
        const middle = Math.max(100 - leftWidth - right, 10)
        const newLayout: number[] = [leftWidth, middle, right]
        setLayout(newLayout)
        saveSidebarState({ ...prev, leftCollapsed: false, leftWidth })
        return { ...prev, leftCollapsed: false, leftWidth }
      }
    })
  }

  const toggleRight = () => {
    setSidebarState((prev) => {
      const collapsing = !prev.rightCollapsed
      if (collapsing) {
        const newLayout: number[] = [layout[0], Math.max(100 - layout[0], 10), 0]
        setLayout(newLayout)
        saveSidebarState({ ...prev, rightCollapsed: true })
        return { ...prev, rightCollapsed: true }
      } else {
        const rightWidth = prev.rightWidth > 2 ? prev.rightWidth : 22
        const left = layout[0]
        const middle = Math.max(100 - left - rightWidth, 10)
        const newLayout: number[] = [left, middle, rightWidth]
        setLayout(newLayout)
        saveSidebarState({ ...prev, rightCollapsed: false, rightWidth })
        return { ...prev, rightCollapsed: false, rightWidth }
      }
    })
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <PanelGroup direction="horizontal" onLayout={handleLayoutChange} layout={layout} className="flex-1">
        <Panel defaultSize={layout[0]} minSize={10} collapsible collapsedSize={0}>
          <LeftSidebar
            activeNav={activeNav}
            onNavChange={setActiveNav}
            stats={stats}
            savedSearches={savedSearches}
            onExecuteSavedSearch={handleExecuteSavedSearch}
            onNewClip={handleNewClip}
            onImportData={handleImportData}
            onLogout={onLogout || (() => {})}
            onToggleCollapse={toggleLeft}
            isCollapsed={sidebarState.leftCollapsed}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors" />

        <Panel defaultSize={layout[1]} minSize={30}>
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900">
              <form onSubmit={handleSearchSubmit} className="max-w-3xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Search Glean knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-6 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-600 focus:border-transparent text-base"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 animate-spin" />
                  )}
                </div>
                {searchError && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {searchError}
                  </div>
                )}
              </form>
            </div>

            {/* Recent Clips Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-zinc-100">Recent Clips</h2>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {isLoadingClips ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
                  </div>
                ) : recentClips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentClips.map((clip) => {
                      const status = (clip as any).syncStatus ?? 'pending'
                      const statusColor =
                        status === 'synced'
                          ? 'bg-green-500'
                          : status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-amber-400'
                      const statusLabel =
                        status === 'synced' ? 'Synced' : status === 'failed' ? 'Failed' : 'Pending'
                      return (
                      <Card
                        key={clip.id}
                        className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-base text-zinc-100 line-clamp-2 group-hover:text-white transition-colors">
                              {clip.title}
                            </CardTitle>
                            {clip.isFavorite && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                            <span>{statusLabel}</span>
                          </div>
                          <CardDescription className="text-sm text-zinc-400 line-clamp-2">
                            {clip.snippet}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{clip.timestamp}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span>{clip.source}</span>
                            </div>
                          </div>
                          {clip.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {clip.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bookmark className="h-12 w-12 text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-300 mb-2">No clips yet</h3>
                    <p className="text-sm text-zinc-500 mb-4">
                      Start clipping content from Glean to see it here
                    </p>
                    <Button className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Clip
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </Panel>

        <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-700 transition-colors" />

        <Panel defaultSize={layout[2]} minSize={12} collapsible collapsedSize={0}>
          <RightSidebar onToggleCollapse={toggleRight} isCollapsed={sidebarState.rightCollapsed} />
        </Panel>
      </PanelGroup>
    </div>
  )
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
  if (isNaN(timestamp)) {
    return 'Unknown'
  }
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else {
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }
}
