'use client'

import { useState, useEffect } from 'react'
import { Search, Clock, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import type { Clip } from '@/lib/clips-service'

interface ClipsListProps {
  clips: Clip[]
  selectedClipId: string | number | null
  onSelectClip: (clip: Clip) => void
  isLoading: boolean
  collectionName?: string
}

export function ClipsList({
  clips,
  selectedClipId,
  onSelectClip,
  isLoading,
  collectionName,
}: ClipsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClips, setFilteredClips] = useState<Clip[]>(clips)

  // Filter clips when search query or clips change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClips(clips)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = clips.filter((clip) => {
      const searchableText = [
        clip.title,
        clip.selectedText,
        clip.domain,
        clip.source,
        clip.collectionName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchableText.includes(query)
    })
    setFilteredClips(filtered)
  }, [searchQuery, clips])

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          {collectionName || 'All Clips'}
          <span className="ml-2 text-zinc-400 font-normal">
            ({filteredClips.length})
          </span>
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          />
        </div>
      </div>

      {/* Clips list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : filteredClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery ? 'No clips match your search' : 'No clips yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredClips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => onSelectClip(clip)}
                className={cn(
                  'w-full text-left p-4 transition-colors',
                  selectedClipId === clip.id
                    ? 'bg-zinc-200 dark:bg-zinc-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                )}
              >
                {/* Title */}
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1">
                  {clip.title}
                </h3>

                {/* Excerpt */}
                {clip.selectedText && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
                    {clip.selectedText}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {clip.date}
                  </span>
                  {clip.domain && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <ExternalLink className="h-3 w-3" />
                        {clip.domain}
                      </span>
                    </>
                  )}
                </div>

                {/* Sync status */}
                {clip.syncStatus === 'synced' && clip.collectionName && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {clip.collectionName}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
