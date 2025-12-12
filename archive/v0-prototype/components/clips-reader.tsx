"use client"

import { Search, Grid3x3, List, Filter, Download, Trash2, ExternalLink } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Mock data for clips
const mockClips = [
  {
    id: 1,
    type: "image",
    url: "/dashboard-ui-design.jpg",
    title: "Dashboard Design Concept",
    date: "2024-01-15",
    source: "dribbble.com",
  },
  {
    id: 2,
    type: "image",
    url: "/mobile-app-interface.png",
    title: "Mobile App Interface",
    date: "2024-01-14",
    source: "behance.net",
  },
  {
    id: 3,
    type: "screenshot",
    url: "/code-editor-theme.jpg",
    title: "Code Editor Theme",
    date: "2024-01-13",
    source: "github.com",
  },
  {
    id: 4,
    type: "image",
    url: "/modern-landing-page.png",
    title: "Landing Page Inspiration",
    date: "2024-01-12",
    source: "awwwards.com",
  },
  {
    id: 5,
    type: "screenshot",
    url: "/color-palette.png",
    title: "Color Palette Reference",
    date: "2024-01-11",
    source: "coolors.co",
  },
  {
    id: 6,
    type: "image",
    url: "/typography-examples.jpg",
    title: "Typography Examples",
    date: "2024-01-10",
    source: "fonts.google.com",
  },
]

export default function ClipsReader() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedClips, setSelectedClips] = useState<number[]>([])

  const toggleClipSelection = (id: number) => {
    setSelectedClips((prev) => (prev.includes(id) ? prev.filter((clipId) => clipId !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">Saved Clips</h1>
              <p className="text-sm text-zinc-400 mt-0.5">{mockClips.length} items saved</p>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="search"
                placeholder="Search clips..."
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
              <Button variant="ghost" size="sm" className="h-8 text-zinc-300 hover:text-zinc-100">
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-zinc-300 hover:text-red-400">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockClips.map((clip) => (
              <div
                key={clip.id}
                className={`group relative bg-zinc-900 rounded-lg overflow-hidden border transition-all ${
                  selectedClips.includes(clip.id)
                    ? "border-zinc-500 ring-2 ring-zinc-500"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Image */}
                <div className="aspect-video relative overflow-hidden bg-zinc-800">
                  <img src={clip.url || "/placeholder.svg"} alt={clip.title} className="w-full h-full object-cover" />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-zinc-800 hover:bg-red-900">
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
                    <span>•</span>
                    <span className="truncate">{clip.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {mockClips.map((clip) => (
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
                  <img src={clip.url || "/placeholder.svg"} alt={clip.title} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-zinc-100 truncate mb-1">{clip.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{clip.date}</span>
                    <span>•</span>
                    <span className="truncate">{clip.source}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-400">
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
