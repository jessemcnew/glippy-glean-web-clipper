"use client"

import { useState } from "react"
import { Search, Tag, Calendar, ExternalLink, Trash2, Star } from "lucide-react"
import { Type } from "lucide-react" // Declaring the Type variable

interface TextClip {
  id: string
  text: string
  source: string
  sourceUrl: string
  tags: string[]
  createdAt: string
  starred: boolean
}

// Mock data
const mockClips: TextClip[] = [
  {
    id: "1",
    text: "The best way to predict the future is to invent it. This quote has guided countless innovators and entrepreneurs throughout history.",
    source: "TechCrunch Article",
    sourceUrl: "https://techcrunch.com/article",
    tags: ["inspiration", "innovation"],
    createdAt: "2025-01-15",
    starred: true,
  },
  {
    id: "2",
    text: "Machine learning models are becoming increasingly sophisticated, enabling new applications in healthcare, finance, and creative industries.",
    source: "AI Research Paper",
    sourceUrl: "https://arxiv.org/paper",
    tags: ["AI", "machine learning"],
    createdAt: "2025-01-14",
    starred: false,
  },
  {
    id: "3",
    text: "Design is not just what it looks like and feels like. Design is how it works. User experience should be at the core of every decision.",
    source: "Design Blog",
    sourceUrl: "https://designblog.com/article",
    tags: ["design", "UX"],
    createdAt: "2025-01-13",
    starred: true,
  },
]

export default function TextClipsViewer() {
  const [clips, setClips] = useState<TextClip[]>(mockClips)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(clips.flatMap((clip) => clip.tags)))

  const filteredClips = clips.filter((clip) => {
    const matchesSearch =
      clip.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || clip.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const toggleStar = (id: string) => {
    setClips(clips.map((clip) => (clip.id === id ? { ...clip, starred: !clip.starred } : clip)))
  }

  const deleteClip = (id: string) => {
    setClips(clips.filter((clip) => clip.id !== id))
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Saved Text Clips
            </h1>
            <div className="text-sm text-zinc-400">
              {filteredClips.length} {filteredClips.length === 1 ? "clip" : "clips"}
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search clips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedTag ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTag === tag ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clips grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-zinc-200 leading-relaxed mb-4">{clip.text}</p>

                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <a
                        href={clip.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {clip.source}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStar(clip.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      clip.starred ? "text-yellow-400 hover:text-yellow-300" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Star className={`w-5 h-5 ${clip.starred ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => deleteClip(clip.id)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {clip.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-md flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredClips.length === 0 && (
          <div className="text-center py-12">
            <Type className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No text clips found</p>
          </div>
        )}
      </div>
    </div>
  )
}
