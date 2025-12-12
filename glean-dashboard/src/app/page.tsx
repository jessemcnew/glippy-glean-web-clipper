'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import { createGleanAPI } from '@/lib/glean-api'
import { fetchClips, type Clip } from '@/lib/clips-service'
import { Dashboard } from '@/components/Dashboard'

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: string[]
  lastUsed: Date
  resultCount: number
}

interface SearchResult {
  id: string
  title: string
  snippet: string
  type: 'document' | 'person' | 'app' | 'discussion'
  url: string
  author?: string
  date?: Date
  relevanceScore: number
}

export default function DashboardPage() {
  const { isAuth, config, logout, isLoading: authLoading } = useAuth()

  // All hooks must be called before any conditional returns
  const [activeSearch, setActiveSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [recentClips, setRecentClips] = useState<Clip[]>([])
  const [isLoadingClips, setIsLoadingClips] = useState(true)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'Product Roadmap Q4',
      query: 'roadmap Q4 2025 product strategy',
      filters: ['documents', 'presentations'],
      lastUsed: new Date('2025-01-15'),
      resultCount: 23
    },
    {
      id: '2',
      name: 'Engineering Team Updates',
      query: 'engineering standup updates sprint',
      filters: ['discussions', 'documents'],
      lastUsed: new Date('2025-01-14'),
      resultCount: 45
    },
    {
      id: '3',
      name: 'Customer Feedback Analysis',
      query: 'customer feedback survey NPS',
      filters: ['documents', 'apps'],
      lastUsed: new Date('2025-01-13'),
      resultCount: 67
    }
  ])

  // Load recent clips on mount (only when authenticated)
  useEffect(() => {
    async function loadRecentClips() {
      if (authLoading || !isAuth) return

      setIsLoadingClips(true)
      try {
        const clips = await fetchClips()
        // Sort by timestamp (most recent first) and take top 5
        const sorted = clips.sort((a, b) => {
          const timeA = a.timestamp || new Date(a.date).getTime()
          const timeB = b.timestamp || new Date(b.date).getTime()
          return timeB - timeA
        })
        setRecentClips(sorted.slice(0, 5))
      } catch (error) {
        console.error('Failed to load recent clips:', error)
        setRecentClips([])
      } finally {
        setIsLoadingClips(false)
      }
    }
    loadRecentClips()
  }, [authLoading, isAuth])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Require authentication - show login form if not authenticated
  if (!isAuth) {
    return <LoginForm />
  }

  const handleSearch = async (query: string) => {
    if (!query.trim() || !config) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      // Create Glean API client
      const gleanAPI = createGleanAPI(
        config.domain,
        config.apiToken,
        config.authMethod
      )

      // Perform search
      const response = await gleanAPI.search(query, {
        limit: 20,
        offset: 0
      })

      // Transform Glean results to our SearchResult format
      const results: SearchResult[] = response.results.map((result) => ({
        id: result.id,
        title: result.title || 'Untitled',
        snippet: result.snippet || '',
        type: (result.documentType?.toLowerCase() || 'document') as 'document' | 'person' | 'app' | 'discussion',
        url: result.url || '#',
        author: result.author?.name,
        date: result.createdAt ? new Date(result.createdAt) : undefined,
        relevanceScore: Math.round(result.score * 100) // Convert 0-1 score to percentage
      }))

      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const executeSavedSearch = (search: SavedSearch) => {
    setActiveSearch(search.query)
    handleSearch(search.query)

    // Update last used timestamp
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === search.id ? { ...s, lastUsed: new Date() } : s))
    )
  }

  // Calculate stats from clips
  const stats = {
    totalClips: recentClips.length,
    syncedCount: recentClips.filter((c) => c.syncStatus === "synced").length,
    collectionsCount: new Set(recentClips.filter((c) => c.collectionName).map((c) => c.collectionName)).size,
  }

  if (!config) {
    return <LoginForm />
  }

  return (
    <Dashboard
      searchQuery={activeSearch}
      setSearchQuery={setActiveSearch}
      searchResults={searchResults}
      isSearching={isSearching}
      searchError={searchError}
      recentClips={recentClips}
      isLoadingClips={isLoadingClips}
      savedSearches={savedSearches}
      onSearch={handleSearch}
      onExecuteSavedSearch={executeSavedSearch}
      stats={stats}
      config={config}
      onLogout={logout}
    />
  )
}
