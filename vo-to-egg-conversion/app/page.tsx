"use client"

import { useState, useEffect } from "react"
import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { CollapsibleRightPanel } from "@/components/collapsible-right-panel"
import { CollectionsFilter } from "@/components/collections-filter"
import { fetchClips, type Clip } from "@/lib/clips-service"
import { fetchCollections, type Collection, type CollectionFilter } from "@/lib/collections-service"
import { useToast } from "@/contexts/ToastContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Bookmark, Clock } from "lucide-react"

export default function Home() {
  const [clips, setClips] = useState<Clip[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingClips, setIsLoadingClips] = useState(true)
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all')
  const { addToast } = useToast()

  useEffect(() => {
    loadClips()
    loadCollections()
  }, [])

  useEffect(() => {
    loadCollections()
  }, [collectionFilter])

  const loadClips = async () => {
    setIsLoadingClips(true)
    try {
      const loadedClips = await fetchClips()
      setClips(loadedClips)
    } catch (error) {
      console.error('Failed to load clips:', error)
      addToast({
        title: 'Failed to load clips',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
      setClips([])
    } finally {
      setIsLoadingClips(false)
    }
  }

  const loadCollections = async () => {
    setIsLoadingCollections(true)
    try {
      const loadedCollections = await fetchCollections(collectionFilter)
      setCollections(loadedCollections)
    } catch (error) {
      console.error('Failed to load collections:', error)
      addToast({
        title: 'Failed to load collections',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
      setCollections([])
    } finally {
      setIsLoadingCollections(false)
    }
  }

  // Get recent clips (last 6, sorted by date)
  const recentClips = clips
    .sort((a, b) => {
      const dateA = a.timestamp || new Date(a.date).getTime()
      const dateB = b.timestamp || new Date(b.date).getTime()
      return dateB - dateA
    })
    .slice(0, 6)

  const formatTimestamp = (timestamp: number): string => {
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

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      <CollapsibleSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          
          {/* Collections Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Collections</h2>
            </div>
            <div className="mb-4">
              <CollectionsFilter filter={collectionFilter} onFilterChange={setCollectionFilter} />
            </div>
            {isLoadingCollections ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
              </div>
            ) : collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collections.map((collection) => (
                  <Card key={collection.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-900 dark:text-zinc-100">{collection.name}</CardTitle>
                      {collection.description && (
                        <CardDescription className="text-zinc-600 dark:text-zinc-400">
                          {collection.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                        <span>{collection.itemCount || 0} items</span>
                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
                          {collection.ownershipType === 'owned' ? 'Owned' : 'Shared'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No collections found</p>
              </div>
            )}
          </div>

          {/* Recent Clips Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Recent Clips</h2>
            </div>
            {isLoadingClips ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
              </div>
            ) : recentClips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentClips.map((clip) => (
                  <Card key={clip.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {clip.title}
                      </CardTitle>
                      {clip.selectedText && (
                        <CardDescription className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {clip.selectedText}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {clip.timestamp ? formatTimestamp(clip.timestamp) : clip.date}
                          </span>
                        </div>
                        {clip.source && (
                          <span className="text-xs">{clip.source}</span>
                        )}
                      </div>
                      {clip.collectionName && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {clip.collectionName}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No clips yet. Start clipping content to see it here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <CollapsibleRightPanel />
    </div>
  )
}
