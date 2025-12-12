'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
import { fetchClips, type Clip } from '@/lib/clips-service'
// Using regular anchor tags instead of next/link to avoid RSC fetch errors in chrome extension
import { 
  Search, 
  ExternalLink, 
  Calendar,
  Globe,
  BookOpen,
  Home,
  Settings,
  ArrowLeft
} from 'lucide-react'

export default function LibraryPage() {
  const { isAuth, config, logout, isLoading: authLoading } = useAuth()
  const [clips, setClips] = useState<Clip[]>([])
  const [filteredClips, setFilteredClips] = useState<Clip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'synced' | 'local'>('all')

  useEffect(() => {
    async function loadClips() {
      // Don't load clips until auth is determined
      if (authLoading) return
      if (!isAuth) return

      setIsLoading(true)
      try {
        const allClips = await fetchClips()
        const sorted = allClips.sort((a, b) => {
          const timeA = a.timestamp || new Date(a.date).getTime()
          const timeB = b.timestamp || new Date(b.date).getTime()
          return timeB - timeA
        })
        setClips(sorted)
        setFilteredClips(sorted)
      } catch (error) {
        console.error('Failed to load clips:', error)
        setClips([])
        setFilteredClips([])
      } finally {
        setIsLoading(false)
      }
    }
    loadClips()
  }, [authLoading, isAuth])

  useEffect(() => {
    let result = clips

    if (activeFilter === 'synced') {
      result = result.filter(c => c.syncStatus === 'synced')
    } else if (activeFilter === 'local') {
      result = result.filter(c => c.syncStatus !== 'synced')
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.selectedText?.toLowerCase().includes(query) ||
        c.domain?.toLowerCase().includes(query) ||
        c.source?.toLowerCase().includes(query)
      )
    }

    setFilteredClips(result)
  }, [clips, searchQuery, activeFilter])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuth) {
    return <LoginForm />
  }

  const formatDate = (clip: Clip) => {
    const timestamp = clip.timestamp || new Date(clip.date).getTime()
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a
              href="../"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </a>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-500" />
                Library
              </h1>
              <p className="text-zinc-400 text-sm">{clips.length} clips saved</p>
            </div>
          </div>
          <a
            href="../"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </a>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search your clips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-100 placeholder-zinc-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('synced')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'synced' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Synced
            </button>
            <button
              onClick={() => setActiveFilter('local')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'local' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Local Only
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredClips.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">
              {searchQuery || activeFilter !== 'all' 
                ? 'No clips match your search' 
                : 'No clips yet. Start clipping content to build your library.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClips.map((clip) => (
              <div 
                key={clip.id}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <a 
                      href={clip.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium text-zinc-100 hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      {clip.title}
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                    {clip.selectedText && (
                      <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{clip.selectedText}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(clip)}
                      </span>
                      {clip.domain && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {clip.domain}
                        </span>
                      )}
                      {clip.syncStatus === 'synced' && (
                        <span className="text-green-500">Synced</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
