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
} from "lucide-react"

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

const mockArticles: Article[] = [
  {
    id: "1",
    title: "The Future of Web Development",
    source: "TechCrunch",
    url: "https://techcrunch.com",
    excerpt: "Exploring the latest trends in web development and what they mean for the future of the internet...",
    readingTime: 8,
    addedAt: new Date("2025-01-08"),
    isRead: false,
    isStarred: true,
    isArchived: false,
    tags: ["development", "web"],
    progress: 45,
  },
  {
    id: "2",
    title: "Design Systems at Scale",
    source: "Smashing Magazine",
    url: "https://smashingmagazine.com",
    excerpt: "How large organizations build and maintain design systems that scale across multiple products...",
    readingTime: 12,
    addedAt: new Date("2025-01-07"),
    isRead: true,
    isStarred: false,
    isArchived: false,
    tags: ["design", "systems"],
    progress: 100,
  },
  {
    id: "3",
    title: "React 19 Features Deep Dive",
    source: "React Blog",
    url: "https://react.dev",
    excerpt: "A comprehensive look at all the new features coming in React 19 and how to use them effectively...",
    readingTime: 15,
    addedAt: new Date("2025-01-06"),
    isRead: false,
    isStarred: true,
    isArchived: false,
    tags: ["react", "javascript"],
    progress: 0,
  },
]

export default function DesktopReadingApp() {
  const [articles, setArticles] = useState<Article[]>(mockArticles)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(mockArticles[0])
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

  const deleteArticle = () => {
    if (!selectedArticle) return
    setArticles(articles.filter((a) => a.id !== selectedArticle.id))
    setSelectedArticle(articles[0] || null)
  }

  const filteredArticles = articles.filter((article) => {
    if (filter === "unread" && article.isRead) return false
    if (filter === "starred" && !article.isStarred) return false
    if (filter === "archived" && !article.isArchived) return false
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
            <span className="text-sm font-medium text-zinc-300">Clips Reader</span>
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
              placeholder="Search articles..."
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
                  {["development", "design", "react", "javascript", "systems", "web"].map((tag) => (
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
            {filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <BookOpen className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-sm font-medium text-zinc-400 mb-2">No clips found</h3>
                <p className="text-xs text-zinc-600">
                  {searchQuery ? "Try a different search term" : "Start saving articles to see them here"}
                </p>
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
                  <div className="flex items-center gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
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
                  <p className="mb-6">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat.
                  </p>
                  <p className="mb-6">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                    pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
                    anim id est laborum.
                  </p>
                  <h2 className="font-bold mb-4 mt-8" style={{ fontSize: fontSize * 1.4, lineHeight: 1.3 }}>
                    Key Takeaways
                  </h2>
                  <p className="mb-6">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
                    totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae
                    dicta sunt explicabo.
                  </p>
                  <p className="mb-6">
                    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
                    magni dolores eos qui ratione voluptatem sequi nesciunt.
                  </p>
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
                <h3 className="text-lg font-medium text-zinc-400 mb-2">No article selected</h3>
                <p className="text-sm text-zinc-600">Select an article to start reading</p>
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
