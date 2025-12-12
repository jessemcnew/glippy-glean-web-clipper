"use client"

import type React from "react"
import { useState } from "react"
import {
  Search,
  Home,
  Bookmark,
  Library,
  FolderOpen,
  Plus,
  Upload,
  Settings,
  LogOut,
  Loader2,
  Clock,
  Star,
  Tag,
  ChevronRight,
  Command,
  AlertCircle,
  CheckCircle2,
  Scissors,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Clip } from "@/lib/clips-service"
// Using regular anchor tags instead of next/link to avoid RSC fetch errors in chrome extension
import { ThemeToggle } from "@/components/ThemeToggle"

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
  type: "document" | "person" | "app" | "discussion"
  url: string
  author?: string
  date?: Date
  relevanceScore: number
}

interface Stats {
  totalClips: number
  syncedCount: number
  collectionsCount: number
}

interface Config {
  domain: string
  authMethod?: string
}

interface DashboardProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: SearchResult[]
  isSearching: boolean
  searchError: string | null
  recentClips: Clip[]
  isLoadingClips: boolean
  savedSearches: SavedSearch[]
  onSearch: (query: string) => void
  onExecuteSavedSearch: (search: SavedSearch) => void
  stats: Stats
  config: Config
  onLogout: () => void
}

export function Dashboard({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  searchError,
  recentClips,
  isLoadingClips,
  savedSearches,
  onSearch,
  onExecuteSavedSearch,
  stats,
  config,
  onLogout,
}: DashboardProps) {
  const [activeNav, setActiveNav] = useState("dashboard")

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery)
    }
  }

  const getTypeIcon = (type: string) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case "document":
        return <div className={`${iconClass} bg-blue-500 rounded`} aria-hidden="true"></div>
      case "person":
        return <div className={`${iconClass} bg-green-500 rounded-full`} aria-hidden="true"></div>
      case "app":
        return <div className={`${iconClass} bg-purple-500 rounded`} aria-hidden="true"></div>
      case "discussion":
        return <div className={`${iconClass} bg-orange-500 rounded`} aria-hidden="true"></div>
      default:
        return <div className={`${iconClass} bg-zinc-500 rounded`} aria-hidden="true"></div>
    }
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Left Sidebar */}
      <aside className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Glean Dashboard</h1>
            <ThemeToggle />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {config.domain} {config.authMethod === "oauth" && "(OAuth)"}
          </p>
        </div>

        <div className="flex-1 overflow-auto px-4 py-6">
          {/* Navigation */}
          <nav className="space-y-1 mb-8">
            <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3 px-3">Navigation</h2>
            <button
              onClick={() => setActiveNav("dashboard")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeNav === "dashboard"
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>
            <a
              href="./clips/"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <Bookmark className="h-4 w-4" />
              Clips
            </a>
            <a
              href="./library/"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <Library className="h-4 w-4" />
              Library
            </a>
            <button
              onClick={() => setActiveNav("collections")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeNav === "collections"
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              Collections
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3 px-3">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Clip
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3 px-3">Stats</h2>
            <div className="space-y-3">
              <div className="px-3 py-2 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Clips</span>
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stats.totalClips}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Synced</span>
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stats.syncedCount}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Collections</span>
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stats.collectionsCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Searches */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3 px-3">Saved Searches</h2>
            <div className="space-y-1">
              {savedSearches.length > 0 ? (
                savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-500 opacity-50 cursor-not-allowed"
                    title="Glean API key required"
                  >
                    <span className="truncate">{search.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0" />
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-500">No saved searches</p>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>Search</span>
              <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                <Command className="h-3 w-3 inline mr-1" />
                K
              </kbd>
            </div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span>New Clip</span>
              <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                <Command className="h-3 w-3 inline mr-1" />
                N
              </kbd>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Center Column - Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <Input
                type="text"
                placeholder="Search Glean knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-transparent text-base"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 dark:text-zinc-400 animate-spin" />
              )}
            </div>
            {searchError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {searchError}
              </div>
            )}
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Show search results if searching or results exist */}
          {isSearching && searchResults.length === 0 ? (
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 text-center" role="status" aria-live="polite">
              <Loader2 className="w-12 h-12 text-zinc-500 dark:text-zinc-400 mx-auto mb-4 animate-spin" aria-hidden="true" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Searching...</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Finding results for "{searchQuery}"</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Search Results ({searchResults.length})</h2>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list">
                {searchResults.map((result) => (
                  <article key={result.id} className="p-6 hover:bg-zinc-200 dark:hover:bg-zinc-800 focus-within:bg-zinc-200 dark:focus-within:bg-zinc-800" role="listitem">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 flex-shrink-0 mt-1" role="img" aria-label={`${result.type} type icon`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 mb-2">
                          <a
                            href={result.url}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-900 rounded"
                            aria-label={`${result.title}, ${result.type}, ${result.relevanceScore}% match`}
                          >
                            {result.title}
                          </a>
                        </h3>
                        <p className="text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">{result.snippet}</p>
                        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400" role="group" aria-label="Result metadata">
                          {result.author && <span aria-label={`Author: ${result.author}`}>By {result.author}</span>}
                          {result.date && (
                            <time dateTime={result.date.toISOString()} aria-label={`Date: ${result.date.toLocaleDateString()}`}>
                              {result.date.toLocaleDateString()}
                            </time>
                          )}
                          <span className="capitalize" aria-label={`Type: ${result.type}`}>
                            {result.type}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium" aria-label={`Relevance: ${result.relevanceScore}% match`}>
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
            /* Recent Clips Grid */
            <div className="max-w-7xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Scissors className="w-5 h-5" aria-hidden="true" />
                  Recent Clips
                </h2>
                <a
                  href="./library/"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 rounded flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {isLoadingClips ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-zinc-500 dark:text-zinc-400 animate-spin" />
                </div>
              ) : recentClips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentClips.map((clip) => (
                    <Card
                      key={clip.id}
                      className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors flex-1">
                            {clip.title}
                          </CardTitle>
                          {clip.url && (
                            <a
                              href={clip.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0 ml-2"
                              aria-label={`Open ${clip.title} in new tab`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {clip.selectedText && (
                          <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{clip.selectedText}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-500 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{clip.date}</span>
                          </div>
                          {clip.source && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" />
                              <span className="truncate">{clip.source}</span>
                            </div>
                          )}
                        </div>
                        {clip.syncStatus === "synced" && clip.collectionName && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{clip.collectionName}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Scissors className="h-12 w-12 text-zinc-400 dark:text-zinc-700 mb-4" />
                  <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">No clips yet</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-500 mb-4">Start clipping content from Glean to see it here</p>
                  <Button className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Clip
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Preview Panel */}
      <aside className="w-96 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <Card className="bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300">New clip added</p>
                      <p className="text-zinc-600 dark:text-zinc-500 text-xs">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300">Collection updated</p>
                      <p className="text-zinc-600 dark:text-zinc-500 text-xs">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-yellow-600 dark:bg-yellow-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300">Sync completed</p>
                      <p className="text-zinc-600 dark:text-zinc-500 text-xs">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Product Roadmap", "Engineering Standards", "Design System", "API Documentation"].map((topic, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{topic}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{Math.floor(Math.random() * 50) + 10} mentions</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </aside>
    </div>
  )
}
