'use client'

import { useState } from 'react'
import { SearchIcon, BookmarkIcon, ClockIcon, EyeIcon } from 'lucide-react'

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
  const [activeSearch, setActiveSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'Product Roadmap Q4',
      query: 'roadmap Q4 2024 product strategy',
      filters: ['documents', 'presentations'],
      lastUsed: new Date('2024-01-15'),
      resultCount: 23
    },
    {
      id: '2', 
      name: 'Engineering Team Updates',
      query: 'engineering standup updates sprint',
      filters: ['discussions', 'documents'],
      lastUsed: new Date('2024-01-14'),
      resultCount: 45
    },
    {
      id: '3',
      name: 'Customer Feedback Analysis',
      query: 'customer feedback survey NPS',
      filters: ['documents', 'apps'],
      lastUsed: new Date('2024-01-13'),
      resultCount: 67
    }
  ])

  const handleSearch = async (query: string) => {
    // Mock search results for demo
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Q4 Product Strategy Document',
        snippet: 'Comprehensive strategy for Q4 focusing on user experience improvements and feature rollouts...',
        type: 'document',
        url: '#',
        author: 'Sarah Chen',
        date: new Date('2024-01-10'),
        relevanceScore: 95
      },
      {
        id: '2',
        title: 'Engineering Sprint Review - Week 3',
        snippet: 'Sprint review covering completed features, blockers, and next week priorities...',
        type: 'discussion', 
        url: '#',
        author: 'Mike Johnson',
        date: new Date('2024-01-12'),
        relevanceScore: 87
      }
    ]
    setSearchResults(mockResults)
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
      case 'document': return <div className={`${iconClass} bg-blue-500 rounded`}></div>
      case 'person': return <div className={`${iconClass} bg-green-500 rounded-full`}></div>
      case 'app': return <div className={`${iconClass} bg-purple-500 rounded`}></div>
      case 'discussion': return <div className={`${iconClass} bg-orange-500 rounded`}></div>
      default: return <div className={`${iconClass} bg-gray-500 rounded`}></div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Glean Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(activeSearch)}
              placeholder="Search your organization's knowledge..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Saved Searches Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookmarkIcon className="w-5 h-5" />
                  Saved Searches
                </h2>
              </div>
              <div className="p-2">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    onClick={() => executeSavedSearch(search)}
                    className="p-3 rounded-md hover:bg-gray-50 cursor-pointer group"
                  >
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                      {search.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {search.query}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
                        {search.resultCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {search.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {searchResults.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">
                    Search Results ({searchResults.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {searchResults.map((result) => (
                    <div key={result.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer mb-2">
                            {result.title}
                          </h3>
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {result.snippet}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {result.author && (
                              <span>By {result.author}</span>
                            )}
                            {result.date && (
                              <span>{result.date.toLocaleDateString()}</span>
                            )}
                            <span className="capitalize">{result.type}</span>
                            <span className="text-blue-600 font-medium">
                              {result.relevanceScore}% match
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to search
                </h3>
                <p className="text-gray-600 mb-6">
                  Enter a search term above or click on a saved search to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
