"use client"

import { Search, Grid3x3, List, Filter, Download, Trash2, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchClips, deleteClip, downloadClip, type Clip } from "@/lib/clips-service"

export default function ClipsReader() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedClips, setSelectedClips] = useState<(string | number)[]>([])
  const [clips, setClips] = useState<Clip[]>([])
  const [filteredClips, setFilteredClips] = useState<Clip[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Load clips on mount
  useEffect(() => {
    loadClips()
  }, [])

  // Filter clips when search query changes
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

  async function loadClips() {
    setLoading(true)
    try {
      const loadedClips = await fetchClips()
      setClips(loadedClips)
      setFilteredClips(loadedClips)
    } catch (error) {
      console.error('Failed to load clips:', error)
      setClips([])
      setFilteredClips([])
    } finally {
      setLoading(false)
    }
  }

  const toggleClipSelection = (id: string | number) => {
    setSelectedClips((prev) => (prev.includes(id) ? prev.filter((clipId) => clipId !== id) : [...prev, id]))
  }

  const handleDeleteClip = async (clipId: string | number) => {
    if (!confirm('Are you sure you want to delete this clip?')) return

    const success = await deleteClip(clipId)
    if (success) {
      await loadClips()
      setSelectedClips((prev) => prev.filter((id) => id !== clipId))
    } else {
      alert('Failed to delete clip')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedClips.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedClips.length} clip(s)?`)) return

    const deletePromises = selectedClips.map((id) => deleteClip(id))
    await Promise.all(deletePromises)
    await loadClips()
    setSelectedClips([])
  }

  const handleBulkDownload = () => {
    selectedClips.forEach((clipId) => {
      const clip = clips.find((c) => c.id === clipId)
      if (clip) {
        downloadClip(clip)
      }
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">Saved Clips</h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                {loading ? 'Loading...' : `${clips.length} item${clips.length !== 1 ? 's' : ''} saved`}
              </p>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="search"
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-9"
              />
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-9 w-9 ${viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-9 w-9 ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                <List className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-zinc-700 mx-1" />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedClips.length > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
              <span className="text-sm text-zinc-300 flex-1">
                {selectedClips.length} {selectedClips.length === 1 ? "clip" : "clips"} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-zinc-300 hover:text-zinc-100"
                onClick={handleBulkDownload}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-zinc-300 hover:text-red-400"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-400">Loading clips...</div>
          </div>
        ) : filteredClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📄</div>
            <div className="text-zinc-300 text-lg mb-2">
              {searchQuery ? 'No matching clips' : 'No clips yet'}
            </div>
            <div className="text-zinc-500 text-sm">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Select text on any webpage and click the clip button in the extension'}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClips.map((clip) => (
              <div
                key={clip.id}
                className={`group relative bg-zinc-900 rounded-lg overflow-hidden border transition-all ${
                  selectedClips.includes(clip.id)
                    ? "border-zinc-500 ring-2 ring-zinc-500"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Image or Text Preview */}
                <div className="aspect-video relative overflow-hidden bg-zinc-800">
                  {clip.type === 'text' || clip.selectedText ? (
                    <div className="p-3 h-full overflow-y-auto">
                      <p className="text-xs text-zinc-300 line-clamp-6">{clip.selectedText}</p>
                    </div>
                  ) : clip.url ? (
                    <img src={clip.url} alt={clip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">No preview</div>
                  )}
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {clip.url && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => window.open(clip.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
                      onClick={() => downloadClip(clip)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-zinc-800 hover:bg-red-900"
                      onClick={() => handleDeleteClip(clip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedClips.includes(clip.id)}
                    onChange={() => toggleClipSelection(clip.id)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-zinc-100 focus:ring-zinc-500 cursor-pointer"
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-zinc-100 truncate mb-1">{clip.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{clip.date}</span>
                    {clip.source && (
                      <>
                        <span>•</span>
                        <span className="truncate">{clip.source}</span>
                      </>
                    )}
                    {clip.syncStatus === 'synced' && clip.collectionName && (
                      <>
                        <span>•</span>
                        <span className="text-green-500">✓ {clip.collectionName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClips.map((clip) => (
              <div
                key={clip.id}
                className={`flex items-center gap-4 p-3 bg-zinc-900 rounded-lg border transition-all ${
                  selectedClips.includes(clip.id) ? "border-zinc-500" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedClips.includes(clip.id)}
                  onChange={() => toggleClipSelection(clip.id)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-zinc-100 focus:ring-zinc-500 cursor-pointer"
                />

                {/* Thumbnail */}
                <div className="w-24 h-16 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                  {clip.type === 'text' || clip.selectedText ? (
                    <div className="p-2 h-full overflow-hidden">
                      <p className="text-xs text-zinc-300 line-clamp-4">{clip.selectedText}</p>
                    </div>
                  ) : clip.url ? (
                    <img src={clip.url} alt={clip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No preview</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-zinc-100 truncate mb-1">{clip.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{clip.date}</span>
                    {clip.source && (
                      <>
                        <span>•</span>
                        <span className="truncate">{clip.source}</span>
                      </>
                    )}
                    {clip.syncStatus === 'synced' && clip.collectionName && (
                      <>
                        <span>•</span>
                        <span className="text-green-500">✓ {clip.collectionName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {clip.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                      onClick={() => window.open(clip.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    onClick={() => downloadClip(clip)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-zinc-400 hover:text-red-400"
                    onClick={() => handleDeleteClip(clip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
