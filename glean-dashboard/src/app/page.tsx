'use client'

import { useState, useEffect } from 'react'
import { SearchIcon, BookmarkIcon, ClockIcon, EyeIcon, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import { createGleanAPI } from '@/lib/glean-api'

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

export default function Dashboard() {
  const { isAuth, config, logout } = useAuth()
  
  // Require authentication - show login form if not authenticated
  if (!isAuth) {
    return <LoginForm />
  }
  
  const [activeSearch, setActiveSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
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
    setSavedSearches(prev => 
      prev.map(s => 
        s.id === search.id 
          ? { ...s, lastUsed: new Date() }
          : s
      )
    )
  }

  const getTypeIcon = (type: string) => {
    const iconClass = "w-4 h-4"
    switch(type) {
      case 'document': return <div className={`${iconClass} bg-blue-500 rounded`} aria-hidden="true"></div>
      case 'person': return <div className={`${iconClass} bg-green-500 rounded-full`} aria-hidden="true"></div>
      case 'app': return <div className={`${iconClass} bg-purple-500 rounded`} aria-hidden="true"></div>
      case 'discussion': return <div className={`${iconClass} bg-orange-500 rounded`} aria-hidden="true"></div>
      default: return <div className={`${iconClass} bg-zinc-500 rounded`} aria-hidden="true"></div>
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 shadow-sm border-b border-zinc-800" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Glean Dashboard</h1>
            {config && (
              <p className="text-sm text-zinc-400 mt-1">
                Connected to {config.domain} {config.authMethod === 'oauth' && '(OAuth)'}
              </p>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
            aria-label="Sign out of Glean Dashboard"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8" role="main">
        {/* Search Bar */}
        <div className="mb-8">
          <label htmlFor="search-input" className="sr-only">
            Search your organization's knowledge
          </label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-400" aria-hidden="true" />
              <input
                id="search-input"
                type="search"
                value={activeSearch}
                onChange={(e) => setActiveSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching && activeSearch.trim()) {
                    handleSearch(activeSearch)
                  }
                }}
                placeholder="Search your organization's knowledge..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Search your organization's knowledge"
                disabled={isSearching}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" aria-hidden="true" />
                </div>
              )}
            </div>
            <button
              onClick={() => activeSearch.trim() && !isSearching && handleSearch(activeSearch)}
              disabled={isSearching || !activeSearch.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="Search"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Saved Searches Sidebar */}
          <aside className="lg:col-span-1" aria-label="Saved searches">
            <nav className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800" aria-label="Saved searches navigation">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
                  <BookmarkIcon className="w-5 h-5" aria-hidden="true" />
                  Saved Searches
                </h2>
              </div>
              <div className="p-2" role="list">
                {savedSearches.map((search) => (
                  <button
                    key={search.id}
                    onClick={() => executeSavedSearch(search)}
                    className="w-full text-left p-3 rounded-md hover:bg-zinc-800 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    role="listitem"
                    aria-label={`Execute saved search: ${search.name}`}
                  >
                    <h3 className="font-medium text-zinc-100 group-hover:text-blue-400 mb-1">
                      {search.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-2 truncate">
                      {search.query}
                    </p>
                    <div className="flex justify-between items-center text-xs text-zinc-500">
                      <span className="flex items-center gap-1" aria-label={`${search.resultCount} results`}>
                        <EyeIcon className="w-3 h-3" aria-hidden="true" />
                        {search.resultCount}
                      </span>
                      <span className="flex items-center gap-1" aria-label={`Last used ${search.lastUsed.toLocaleDateString()}`}>
                        <ClockIcon className="w-3 h-3" aria-hidden="true" />
                        {search.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-3" aria-label="Search results">
            {searchError && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg" role="alert">
                <p className="text-sm text-red-300">{searchError}</p>
              </div>
            )}
            {isSearching && searchResults.length === 0 ? (
              <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 p-12 text-center" role="status" aria-live="polite">
                <Loader2 className="w-12 h-12 text-zinc-400 mx-auto mb-4 animate-spin" aria-hidden="true" />
                <h3 className="text-lg font-medium text-zinc-100 mb-2">
                  Searching...
                </h3>
                <p className="text-zinc-400">
                  Finding results for "{activeSearch}"
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800">
                <div className="p-4 border-b border-zinc-800">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Search Results ({searchResults.length})
                  </h2>
                </div>
                <div className="divide-y divide-zinc-800" role="list">
                  {searchResults.map((result) => (
                    <article key={result.id} className="p-6 hover:bg-zinc-800 focus-within:bg-zinc-800" role="listitem">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-4 h-4 flex-shrink-0 mt-1" 
                          role="img" 
                          aria-label={`${result.type} type icon`}
                        >
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-zinc-100 hover:text-blue-400 mb-2">
                            <a 
                              href={result.url} 
                              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded"
                              aria-label={`${result.title}, ${result.type}, ${result.relevanceScore}% match`}
                            >
                              {result.title}
                            </a>
                          </h3>
                          <p className="text-zinc-300 mb-3 leading-relaxed">
                            {result.snippet}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-zinc-400" role="group" aria-label="Result metadata">
                            {result.author && (
                              <span aria-label={`Author: ${result.author}`}>By {result.author}</span>
                            )}
                            {result.date && (
                              <time dateTime={result.date.toISOString()} aria-label={`Date: ${result.date.toLocaleDateString()}`}>
                                {result.date.toLocaleDateString()}
                              </time>
                            )}
                            <span className="capitalize" aria-label={`Type: ${result.type}`}>{result.type}</span>
                            <span className="text-blue-400 font-medium" aria-label={`Relevance: ${result.relevanceScore}% match`}>
                              {result.relevanceScore}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 p-12 text-center" role="status" aria-live="polite">
                <SearchIcon className="w-12 h-12 text-zinc-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-zinc-100 mb-2">
                  Ready to search
                </h3>
                <p className="text-zinc-400 mb-6">
                  Enter a search term above or click on a saved search to get started.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
