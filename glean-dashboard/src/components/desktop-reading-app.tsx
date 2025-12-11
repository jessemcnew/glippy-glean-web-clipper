"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Search,
  Command,
  Tag,
  Archive,
  Star,
  Clock,
  Settings,
  X,
  ChevronRight,
  Type,
  AlignLeft,
  Maximize2,
  Check,
  Grid3x3,
  List,
  Trash2,
  ExternalLink,
  Copy,
  Share2,
  RefreshCw,
} from "lucide-react"
import { fetchClips, deleteClip, type Clip } from "@/lib/clips-service"
import { useAuth } from "@/contexts/AuthContext"

type ReadingTheme = "dark" | "sepia" | "light" | "midnight" | "nord" | "solarized" | "dracula" | "monokai"
type ViewMode = "grid" | "list"

interface Article {
  id: string
  title: string
  source: string
  url: string
  excerpt: string
  readingTime: number
  addedAt: Date
  isRead: boolean
  isStarred: boolean
  isArchived: boolean
  tags: string[]
  progress: number
}

// Convert Clip to Article format
function clipToArticle(clip: Clip): Article {
  const domain = clip.domain || clip.source || 'Unknown'
  const excerpt = clip.selectedText || clip.title || ''
  const readingTime = Math.max(1, Math.ceil(excerpt.length / 1000)) // Rough estimate: 1000 chars = 1 min
  
  return {
    id: String(clip.id),
    title: clip.title || 'Untitled Clip',
    source: domain,
    url: clip.url || '#',
    excerpt: excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : ''),
    readingTime,
    addedAt: clip.timestamp ? new Date(clip.timestamp) : new Date(clip.date || Date.now()),
    isRead: false,
    isStarred: false,
    isArchived: false,
    tags: [],
    progress: 0,
  }
}

export default function DesktopReadingApp() {
  const { isAuth } = useAuth()
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandSearch, setCommandSearch] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [filter, setFilter] = useState<"all" | "unread" | "starred" | "archived">("all")

  // Reader settings
  const [theme, setTheme] = useState<ReadingTheme>("dark")
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [contentWidth, setContentWidth] = useState(680)
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif")

  const [loadError, setLoadError] = useState<string | null>(null)

  // Load clips from extension
  useEffect(() => {
    if (!isAuth) return
    
    const loadClips = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const loadedClips = await fetchClips()
        setClips(loadedClips)
        const convertedArticles = loadedClips.map(clipToArticle)
        setArticles(convertedArticles)
        if (convertedArticles.length > 0) {
          setSelectedArticle(convertedArticles[0])
        } else {
          setLoadError(null) // No error, just no clips
        }
      } catch (error) {
        console.error('Failed to load clips:', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to load clips. Make sure the extension is installed and loaded.')
      } finally {
        setLoading(false)
      }
    }
    
    loadClips()
    
    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      loadClips()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isAuth])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      // Navigation
      if (e.key === "j" && !commandPaletteOpen) {
        e.preventDefault()
        navigateNext()
      }
      if (e.key === "k" && !commandPaletteOpen) {
        e.preventDefault()
        navigatePrevious()
      }
      // Actions
      if (e.key === "s" && !commandPaletteOpen) {
        e.preventDefault()
        toggleStar()
      }
      if (e.key === "a" && !commandPaletteOpen) {
        e.preventDefault()
        toggleArchive()
      }
      if (e.key === "r" && !commandPaletteOpen) {
        e.preventDefault()
        toggleRead()
      }
      if (e.key === "o" && !commandPaletteOpen) {
        e.preventDefault()
        openInBrowser()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "," && !commandPaletteOpen) {
        e.preventDefault()
        setSettingsOpen(true)
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false)
        setSettingsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [commandPaletteOpen, selectedArticle])

  const navigateNext = () => {
    if (!selectedArticle) return
    const currentIndex = articles.findIndex((a) => a.id === selectedArticle.id)
    if (currentIndex < articles.length - 1) {
      setSelectedArticle(articles[currentIndex + 1])
    }
  }

  const navigatePrevious = () => {
    if (!selectedArticle) return
    const currentIndex = articles.findIndex((a) => a.id === selectedArticle.id)
    if (currentIndex > 0) {
      setSelectedArticle(articles[currentIndex - 1])
    }
  }

  const toggleStar = () => {
    if (!selectedArticle) return
    setArticles(articles.map((a) => (a.id === selectedArticle.id ? { ...a, isStarred: !a.isStarred } : a)))
    setSelectedArticle({ ...selectedArticle, isStarred: !selectedArticle.isStarred })
  }

  const toggleArchive = () => {
    if (!selectedArticle) return
    setArticles(articles.map((a) => (a.id === selectedArticle.id ? { ...a, isArchived: !a.isArchived } : a)))
    setSelectedArticle({ ...selectedArticle, isArchived: !selectedArticle.isArchived })
  }

  const toggleRead = () => {
    if (!selectedArticle) return
    setArticles(articles.map((a) => (a.id === selectedArticle.id ? { ...a, isRead: !a.isRead } : a)))
    setSelectedArticle({ ...selectedArticle, isRead: !selectedArticle.isRead })
  }

  const openInBrowser = () => {
    if (selectedArticle) {
      window.open(selectedArticle.url, "_blank")
    }
  }

  const copyLink = () => {
    if (selectedArticle) {
      navigator.clipboard.writeText(selectedArticle.url)
    }
  }

  const deleteArticle = async () => {
    if (!selectedArticle) return
    try {
      await deleteClip(selectedArticle.id)
      setArticles(articles.filter((a) => a.id !== selectedArticle.id))
      setClips(clips.filter((c) => String(c.id) !== selectedArticle.id))
      setSelectedArticle(articles.find((a) => a.id !== selectedArticle.id) || articles[0] || null)
    } catch (error) {
      console.error('Failed to delete clip:', error)
    }
  }

  const filteredArticles = articles.filter((article) => {
    if (filter === "unread" && article.isRead) return false
    if (filter === "starred" && !article.isStarred) return false
    if (filter === "archived" && article.isArchived) return false
    if (filter === "all" && article.isArchived) return false
    if (searchQuery) {
      return (
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const themeColors = {
    dark: {
      bg: "bg-zinc-950",
      text: "text-zinc-100",
      secondary: "text-zinc-400",
      name: "Dark",
    },
    sepia: {
      bg: "bg-amber-50",
      text: "text-amber-950",
      secondary: "text-amber-700",
      name: "Sepia",
    },
    light: {
      bg: "bg-white",
      text: "text-gray-900",
      secondary: "text-gray-600",
      name: "Light",
    },
    midnight: {
      bg: "bg-slate-950",
      text: "text-blue-50",
      secondary: "text-blue-300",
      name: "Midnight",
    },
    nord: {
      bg: "bg-[#2E3440]",
      text: "text-[#ECEFF4]",
      secondary: "text-[#D8DEE9]",
      name: "Nord",
    },
    solarized: {
      bg: "bg-[#002b36]",
      text: "text-[#839496]",
      secondary: "text-[#586e75]",
      name: "Solarized",
    },
    dracula: {
      bg: "bg-[#282a36]",
      text: "text-[#f8f8f2]",
      secondary: "text-[#6272a4]",
      name: "Dracula",
    },
    monokai: {
      bg: "bg-[#272822]",
      text: "text-[#F8F8F2]",
      secondary: "text-[#75715E]",
      name: "Monokai",
    },
  }

  const commandActions = [
    {
      category: "Navigation",
      items: [
        { icon: BookOpen, label: "All Clips", kbd: "G then A", action: () => setFilter("all") },
        { icon: Clock, label: "Unread", kbd: "G then U", action: () => setFilter("unread") },
        { icon: Star, label: "Starred", kbd: "G then S", action: () => setFilter("starred") },
        { icon: Archive, label: "Archive", kbd: "G then E", action: () => setFilter("archived") },
      ],
    },
    {
      category: "Quick Actions",
      items: [
        { icon: Star, label: "Toggle Star", kbd: "S", action: toggleStar },
        { icon: Archive, label: "Toggle Archive", kbd: "A", action: toggleArchive },
        { icon: Check, label: "Mark as Read/Unread", kbd: "R", action: toggleRead },
        { icon: ExternalLink, label: "Open in Browser", kbd: "O", action: openInBrowser },
        { icon: Copy, label: "Copy Link", kbd: "C", action: copyLink },
        { icon: Share2, label: "Share", kbd: "Shift+S", action: () => {} },
        { icon: Trash2, label: "Delete", kbd: "Del", action: deleteArticle },
      ],
    },
    {
      category: "View",
      items: [
        { icon: List, label: "List View", kbd: "V then L", action: () => setViewMode("list") },
        { icon: Grid3x3, label: "Grid View", kbd: "V then G", action: () => setViewMode("grid") },
        { icon: Settings, label: "Reader Settings", kbd: "⌘,", action: () => setSettingsOpen(true) },
      ],
    },
    {
      category: "Themes",
      items: Object.entries(themeColors).map(([key, value]) => ({
        icon: Type,
        label: `${value.name} Theme`,
        kbd: "",
        action: () => setTheme(key as ReadingTheme),
      })),
    },
  ]

  const filteredCommands = commandActions
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.label.toLowerCase().includes(commandSearch.toLowerCase())),
    }))
    .filter((category) => category.items.length > 0)

  if (!isAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">Please sign in</h3>
          <p className="text-sm text-zinc-600">Sign in to view your clips</p>
        </div>
      </div>
    )
  }

  // Refresh clips manually
  const refreshClips = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const loadedClips = await fetchClips()
      setClips(loadedClips)
      const convertedArticles = loadedClips.map(clipToArticle)
      setArticles(convertedArticles)
      if (convertedArticles.length > 0 && !selectedArticle) {
        setSelectedArticle(convertedArticles[0])
      }
    } catch (error) {
      console.error('Failed to refresh clips:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load clips')
    } finally {
      setLoading(false)
    }
  }

  if (loading && articles.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-zinc-500">Loading clips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden">
      {/* Custom Title Bar */}
      <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 drag-region">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Glippy - Clips Reader</span>
          </div>
        </div>

        {/* Search in title bar */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clips..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-zinc-500 bg-zinc-800 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-zinc-900 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-200`}
        >
          <div className="p-4 space-y-1">
            <button
              onClick={() => setFilter("all")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "all"
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {!sidebarCollapsed && <span>All Clips</span>}
              {!sidebarCollapsed && (
                <span className="ml-auto text-xs text-zinc-600">{articles.filter((a) => !a.isArchived).length}</span>
              )}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "unread"
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300"
              }`}
            >
              <Clock className="w-4 h-4" />
              {!sidebarCollapsed && <span>Unread</span>}
              {!sidebarCollapsed && (
                <span className="ml-auto text-xs text-zinc-600">
                  {articles.filter((a) => !a.isRead && !a.isArchived).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("starred")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "starred"
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300"
              }`}
            >
              <Star className="w-4 h-4" />
              {!sidebarCollapsed && <span>Starred</span>}
              {!sidebarCollapsed && (
                <span className="ml-auto text-xs text-zinc-600">
                  {articles.filter((a) => a.isStarred && !a.isArchived).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "archived"
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300"
              }`}
            >
              <Archive className="w-4 h-4" />
              {!sidebarCollapsed && <span>Archive</span>}
              {!sidebarCollapsed && (
                <span className="ml-auto text-xs text-zinc-600">{articles.filter((a) => a.isArchived).length}</span>
              )}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="px-4 py-2 border-t border-zinc-800">
                <div className="text-xs font-medium text-zinc-600 mb-2">Tags</div>
                <div className="space-y-1">
                  {Array.from(new Set(articles.flatMap(a => a.tags))).slice(0, 6).map((tag) => (
                    <button
                      key={tag}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300 transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mt-auto p-4 border-t border-zinc-800">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>

        {/* Article List */}
        <div className="w-96 bg-zinc-950 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-300">
                {filter === "all" && "All Clips"}
                {filter === "unread" && "Unread"}
                {filter === "starred" && "Starred"}
                {filter === "archived" && "Archive"}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={refreshClips}
                  disabled={loading}
                  className="p-1.5 rounded text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Refresh clips"
                  title="Refresh clips"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded ${
                    viewMode === "list" ? "bg-zinc-800 text-zinc-300" : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded ${
                    viewMode === "grid" ? "bg-zinc-800 text-zinc-300" : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadError ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <BookOpen className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Failed to load clips</h3>
                <p className="text-xs text-zinc-600 mb-4">{loadError}</p>
                <button
                  onClick={refreshClips}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Retry
                </button>
                <p className="text-xs text-zinc-600 mt-4">
                  Make sure the Glean Clipper extension is installed and loaded in Chrome
                </p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <BookOpen className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-sm font-medium text-zinc-400 mb-2">No clips found</h3>
                <p className="text-xs text-zinc-600 mb-4">
                  {searchQuery ? "Try a different search term" : "Start clipping to see your clips here"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={refreshClips}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
                  >
                    Refresh
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedArticle?.id === article.id ? "bg-zinc-900 border border-zinc-800" : "hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3
                        className={`text-sm font-medium line-clamp-2 ${
                          article.isRead ? "text-zinc-500" : "text-zinc-200"
                        }`}
                      >
                        {article.title}
                      </h3>
                      {article.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span>{article.source}</span>
                      <span>{article.readingTime} min read</span>
                    </div>
                    {article.progress > 0 && article.progress < 100 && (
                      <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-600 transition-all" style={{ width: `${article.progress}%` }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reading Pane */}
        <div className="flex-1 overflow-y-auto">
          {selectedArticle ? (
            <div
              className={`min-h-full transition-colors ${themeColors[theme].bg}`}
              style={{
                fontFamily: fontFamily === "serif" ? "Georgia, serif" : "system-ui, sans-serif",
              }}
            >
              <div className="max-w-4xl mx-auto px-8 py-12">
                {/* Article header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                    <span className={themeColors[theme].secondary}>{selectedArticle.source}</span>
                    <span className={themeColors[theme].secondary}>•</span>
                    <span className={themeColors[theme].secondary}>{selectedArticle.readingTime} min read</span>
                    <span className={themeColors[theme].secondary}>•</span>
                    <span className={themeColors[theme].secondary}>{selectedArticle.addedAt.toLocaleDateString()}</span>
                  </div>
                  <h1
                    className={`font-bold mb-4 ${themeColors[theme].text}`}
                    style={{ fontSize: fontSize * 1.8, lineHeight: 1.2 }}
                  >
                    {selectedArticle.title}
                  </h1>
                  {selectedArticle.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {selectedArticle.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Article content */}
                <div
                  className={themeColors[theme].text}
                  style={{
                    fontSize,
                    lineHeight,
                    maxWidth: contentWidth,
                  }}
                >
                  <p className="mb-6">{selectedArticle.excerpt}</p>
                  {selectedArticle.url && (
                    <div className="mb-6">
                      <a
                        href={selectedArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-blue-400 hover:text-blue-300 underline ${themeColors[theme].text}`}
                      >
                        View original source →
                      </a>
                    </div>
                  )}
                </div>

                {/* Reading progress indicator */}
                <div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-900">
                  <div
                    className="h-full bg-zinc-600 transition-all"
                    style={{ width: `${selectedArticle.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-zinc-950">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-400 mb-2">No clip selected</h3>
                <p className="text-sm text-zinc-600">Select a clip to start reading</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  autoFocus
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              {filteredCommands.map((category) => (
                <div key={category.category} className="mb-4 last:mb-0">
                  <div className="text-xs font-medium text-zinc-600 px-3 py-2">{category.category}</div>
                  {category.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action()
                        setCommandPaletteOpen(false)
                        setCommandSearch("")
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-zinc-500" />
                        <span>{item.label}</span>
                      </div>
                      {item.kbd && (
                        <kbd className="px-2 py-0.5 text-xs text-zinc-500 bg-zinc-800 rounded">{item.kbd}</kbd>
                      )}
                    </button>
                  ))}
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-500">No commands found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-200">Reader Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[600px] overflow-y-auto">
              {/* Theme Selection */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">Theme</label>
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(themeColors) as ReadingTheme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        theme === t
                          ? "border-zinc-500 bg-zinc-800"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-full h-16 rounded mb-2 ${
                          t === "dark"
                            ? "bg-zinc-950"
                            : t === "sepia"
                              ? "bg-amber-50"
                              : t === "light"
                                ? "bg-white"
                                : t === "midnight"
                                  ? "bg-slate-950"
                                  : t === "nord"
                                    ? "bg-[#2E3440]"
                                    : t === "solarized"
                                      ? "bg-[#002b36]"
                                      : t === "dracula"
                                        ? "bg-[#282a36]"
                                        : "bg-[#272822]"
                        }`}
                      />
                      <div className="text-xs font-medium text-zinc-300 capitalize">{themeColors[t].name}</div>
                      {theme === t && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-zinc-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">Font Family</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFontFamily("serif")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      fontFamily === "serif"
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div className="text-2xl mb-2" style={{ fontFamily: "Georgia, serif" }}>
                      Aa
                    </div>
                    <div className="text-xs font-medium text-zinc-300">Serif</div>
                  </button>
                  <button
                    onClick={() => setFontFamily("sans")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      fontFamily === "sans"
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div className="text-2xl mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>
                      Aa
                    </div>
                    <div className="text-xs font-medium text-zinc-300">Sans</div>
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-300">Font Size</label>
                  <span className="text-sm text-zinc-500">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-4">
                  <Type className="w-4 h-4 text-zinc-500" />
                  <input
                    type="range"
                    min="14"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 accent-zinc-500"
                  />
                  <Type className="w-5 h-5 text-zinc-500" />
                </div>
              </div>

              {/* Line Height */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-300">Line Height</label>
                  <span className="text-sm text-zinc-500">{lineHeight.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <AlignLeft className="w-4 h-4 text-zinc-500" />
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="flex-1 accent-zinc-500"
                  />
                  <AlignLeft className="w-5 h-5 text-zinc-500" />
                </div>
              </div>

              {/* Content Width */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-300">Content Width</label>
                  <span className="text-sm text-zinc-500">{contentWidth}px</span>
                </div>
                <div className="flex items-center gap-4">
                  <Maximize2 className="w-4 h-4 text-zinc-500" />
                  <input
                    type="range"
                    min="600"
                    max="900"
                    step="20"
                    value={contentWidth}
                    onChange={(e) => setContentWidth(Number(e.target.value))}
                    className="flex-1 accent-zinc-500"
                  />
                  <Maximize2 className="w-5 h-5 text-zinc-500" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-500">
        Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">⌘K</kbd> for commands
      </div>
    </div>
  )
}
