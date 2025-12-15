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
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { RightSidebar } from '@/components/sidebar/RightSidebar'
import CommandPalette from '@/components/CommandPalette'
import ThemeToggleFloating from '@/components/ThemeToggleFloating'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchClips, type Clip } from '@/lib/clips-service'
import { fetchCollections } from '@/lib/collections-service'

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
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)

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

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const handlePaletteCommand = (commandId: string) => {
    switch (commandId) {
      case 'recent-clips':
      case 'library':
      case 'prompts':
        setActiveNav(commandId === 'recent-clips' ? 'dashboard' : commandId)
        break
      case 'clip-selection':
      case 'save-url':
      case 'capture-page':
      case 'capture-area':
      case 'capture-visible':
      case 'capture-full-page':
        console.log(`Command executed: ${commandId}`)
        break
      case 'preferences':
      case 'configuration':
        console.log(`Open settings: ${commandId}`)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Theme Toggle - responsive to right sidebar */}
      <ThemeToggleFloating rightSidebarCollapsed={rightSidebarCollapsed} />

      {/* Left Sidebar */}
      <CollapsibleSidebar 
        side="left" 
        expandedWidth="w-80" 
        collapsedWidth="w-20"
        onCollapseChange={setLeftSidebarCollapsed}
      >
        <LeftSidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          onLogout={onLogout || (() => {})}
        />
      </CollapsibleSidebar>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
            {/* Search Bar */}
            <div className="p-6 border-b border-border bg-card">
              <form onSubmit={handleSearchSubmit} className="max-w-3xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search Glean knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-6 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent text-base"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
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
                  <h2 className="text-2xl font-semibold text-foreground">Recent Clips</h2>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {isLoadingClips ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
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
                        className="bg-card border-border hover:border-accent transition-colors cursor-pointer group"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-base text-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                              {clip.title}
                            </CardTitle>
                            {clip.isFavorite && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                            <span>{statusLabel}</span>
                          </div>
                          <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                            {clip.snippet}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
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
                    <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No clips yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start clipping content from Glean to see it here
                    </p>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Clip
                    </Button>
                  </div>
                )}
              </div>
            </div>
      </main>

      {/* Right Sidebar */}
      <CollapsibleSidebar 
        side="right" 
        expandedWidth="w-80" 
        collapsedWidth="w-20"
        onCollapseChange={setRightSidebarCollapsed}
      >
        <RightSidebar onNewClip={handleNewClip} onImportData={handleImportData} />
      </CollapsibleSidebar>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onCommand={handlePaletteCommand}
      />
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
