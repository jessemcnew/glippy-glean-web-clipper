"use client"

import { useState, useEffect } from "react"
import {
  BookMarked,
  Clock,
  Star,
  Tag,
  Search,
  SlidersHorizontal,
  Archive,
  Trash2,
  X,
  ChevronDown,
  Settings2,
  BookOpen,
  Eye,
  EyeOff,
  Minus,
  Plus,
  AlignLeft,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Article = {
  id: number
  title: string
  url: string
  excerpt: string
  author?: string
  date: string
  readTime: string
  tags: string[]
  starred: boolean
  archived: boolean
  read: boolean
}

type ReaderSettings = {
  theme: "dark" | "sepia" | "light" | "midnight"
  fontSize: number
  lineHeight: number
  contentWidth: number
  fontFamily: "serif" | "sans"
}

const mockArticles: Article[] = [
  {
    id: 1,
    title: "The Future of Web Development: Trends to Watch in 2025",
    url: "https://example.com/article-1",
    excerpt:
      "As we move into 2025, the landscape of web development continues to evolve at a rapid pace. From AI-powered tools to revolutionary frameworks, developers are seeing unprecedented changes in how we build for the web...",
    author: "Sarah Chen",
    date: "2024-12-08",
    readTime: "8 min",
    tags: ["web-dev", "trends", "ai"],
    starred: true,
    archived: false,
    read: false,
  },
  {
    id: 2,
    title: "Understanding React Server Components",
    url: "https://example.com/article-2",
    excerpt:
      "React Server Components represent a fundamental shift in how we think about building React applications. By allowing components to render on the server, we can dramatically improve performance and user experience...",
    author: "Alex Martinez",
    date: "2024-12-07",
    readTime: "12 min",
    tags: ["react", "performance"],
    starred: false,
    archived: false,
    read: true,
  },
  {
    id: 3,
    title: "CSS Grid vs Flexbox: When to Use Each",
    url: "https://example.com/article-3",
    excerpt:
      "Both CSS Grid and Flexbox are powerful layout systems, but they excel in different scenarios. Understanding when to use each can dramatically improve your development workflow and the quality of your layouts...",
    author: "Jordan Lee",
    date: "2024-12-06",
    readTime: "6 min",
    tags: ["css", "layout"],
    starred: false,
    archived: false,
    read: false,
  },
  {
    id: 4,
    title: "Building Accessible Web Applications",
    url: "https://example.com/article-4",
    excerpt:
      "Accessibility is not just a nice-to-have feature—it's essential for creating inclusive web experiences. This comprehensive guide covers the fundamental principles of web accessibility and practical implementation strategies...",
    author: "Maya Patel",
    date: "2024-12-05",
    readTime: "15 min",
    tags: ["accessibility", "best-practices"],
    starred: true,
    archived: false,
    read: false,
  },
  {
    id: 5,
    title: "TypeScript Tips for Large-Scale Applications",
    url: "https://example.com/article-5",
    excerpt:
      "Managing TypeScript in large codebases requires careful planning and the right patterns. Learn how to structure your types, avoid common pitfalls, and leverage advanced TypeScript features for better developer experience...",
    author: "David Kim",
    date: "2024-12-04",
    readTime: "10 min",
    tags: ["typescript", "architecture"],
    starred: false,
    archived: false,
    read: true,
  },
]

export default function ReadingLibrary() {
  const [articles, setArticles] = useState<Article[]>(mockArticles)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterView, setFilterView] = useState<"all" | "starred" | "archived">("all")
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "title">("recent")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showReaderSettings, setShowReaderSettings] = useState(false)
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    theme: "dark",
    fontSize: 18,
    lineHeight: 1.7,
    contentWidth: 42,
    fontFamily: "serif",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [readProgress, setReadProgress] = useState(0)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "j") {
        // Next article
        const currentIndex = articles.findIndex((a) => a.id === selectedArticle?.id)
        if (currentIndex < articles.length - 1) {
          setSelectedArticle(articles[currentIndex + 1])
        }
      } else if (e.key === "k") {
        // Previous article
        const currentIndex = articles.findIndex((a) => a.id === selectedArticle?.id)
        if (currentIndex > 0) {
          setSelectedArticle(articles[currentIndex - 1])
        }
      } else if (e.key === "s") {
        // Toggle star
        if (selectedArticle) {
          toggleStar(selectedArticle.id)
        }
      } else if (e.key === "a") {
        // Archive
        if (selectedArticle) {
          toggleArchive(selectedArticle.id)
        }
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [selectedArticle, articles])

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById("article-content")
      if (element) {
        const scrolled = element.scrollTop
        const height = element.scrollHeight - element.clientHeight
        const progress = (scrolled / height) * 100
        setReadProgress(Math.min(100, Math.max(0, progress)))
      }
    }
    const element = document.getElementById("article-content")
    element?.addEventListener("scroll", handleScroll)
    return () => element?.removeEventListener("scroll", handleScroll)
  }, [selectedArticle])

  const toggleStar = (id: number) => {
    setArticles(articles.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)))
  }

  const toggleArchive = (id: number) => {
    setArticles(articles.map((a) => (a.id === id ? { ...a, archived: !a.archived } : a)))
  }

  const toggleRead = (id: number) => {
    setArticles(articles.map((a) => (a.id === id ? { ...a, read: !a.read } : a)))
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filterView === "all"
        ? !article.archived
        : filterView === "starred"
          ? article.starred && !article.archived
          : article.archived
    return matchesSearch && matchesFilter
  })

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === "recent") return b.id - a.id
    if (sortBy === "oldest") return a.id - b.id
    return a.title.localeCompare(b.title)
  })

  const getThemeClasses = () => {
    switch (readerSettings.theme) {
      case "sepia":
        return "bg-amber-50 text-amber-950"
      case "light":
        return "bg-white text-slate-900"
      case "midnight":
        return "bg-black text-zinc-300"
      default:
        return "bg-zinc-950 text-zinc-100"
    }
  }

  const getThemeProseClasses = () => {
    switch (readerSettings.theme) {
      case "sepia":
        return "prose-amber"
      case "light":
        return "prose-slate"
      case "midnight":
        return "prose-invert prose-zinc"
      default:
        return "prose-invert prose-zinc"
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-serif font-semibold mb-6">Library</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search articles..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-4">
          <div className="space-y-1">
            <button
              onClick={() => setFilterView("all")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filterView === "all"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>All Articles</span>
              <span className="ml-auto text-xs text-zinc-500">{articles.filter((a) => !a.archived).length}</span>
            </button>

            <button
              onClick={() => setFilterView("starred")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filterView === "starred"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Starred</span>
              <span className="ml-auto text-xs text-zinc-500">
                {articles.filter((a) => a.starred && !a.archived).length}
              </span>
            </button>

            <button
              onClick={() => setFilterView("archived")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                filterView === "archived"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Archived</span>
              <span className="ml-auto text-xs text-zinc-500">{articles.filter((a) => a.archived).length}</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Tags</h3>
            <div className="space-y-1">
              {["web-dev", "react", "css", "typescript", "accessibility"].map((tag) => (
                <button
                  key={tag}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Shortcuts</h3>
            <div className="space-y-2 px-3 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Next article</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">j</kbd>
              </div>
              <div className="flex justify-between">
                <span>Previous article</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">k</kbd>
              </div>
              <div className="flex justify-between">
                <span>Toggle star</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">s</kbd>
              </div>
              <div className="flex justify-between">
                <span>Archive</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">a</kbd>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Article List */}
      <div className="w-96 border-r border-zinc-800 flex flex-col">
        {/* List Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-400">
            {filterView === "all" ? "All Articles" : filterView === "starred" ? "Starred" : "Archived"}
          </h2>
          <div className="flex items-center gap-2 relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-100 h-8 px-2"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              <span className="text-xs capitalize">{sortBy}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
            {showSortMenu && (
              <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setSortBy("recent")
                    setShowSortMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 text-zinc-300"
                >
                  Recent
                </button>
                <button
                  onClick={() => {
                    setSortBy("oldest")
                    setShowSortMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 text-zinc-300"
                >
                  Oldest
                </button>
                <button
                  onClick={() => {
                    setSortBy("title")
                    setShowSortMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 text-zinc-300"
                >
                  Title
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Article Items */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="divide-y divide-zinc-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-zinc-800 rounded w-full mb-2"></div>
                  <div className="h-3 bg-zinc-800 rounded w-2/3 mb-3"></div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-zinc-800 rounded w-16"></div>
                    <div className="h-5 bg-zinc-800 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 px-6">
              <BookMarked className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-sm font-medium mb-1">No articles found</p>
              <p className="text-xs text-center text-zinc-600">
                {searchQuery ? "Try adjusting your search" : "Your saved articles will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {sortedArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`w-full text-left p-4 hover:bg-zinc-900 transition-colors ${
                    selectedArticle?.id === article.id ? "bg-zinc-900" : ""
                  } ${article.read ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">{article.title}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {article.read && <Eye className="w-3 h-3 text-zinc-600" />}
                      {article.starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{article.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                  {article.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reading Pane */}
      <div className={`flex-1 flex flex-col transition-colors ${getThemeClasses()}`}>
        {selectedArticle ? (
          <>
            <div className="h-1 bg-zinc-800/50">
              <div className="h-full bg-blue-500 transition-all duration-150" style={{ width: `${readProgress}%` }} />
            </div>

            {/* Reader Header */}
            <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${selectedArticle.starred ? "text-amber-500" : readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-100"}`}
                  onClick={() => toggleStar(selectedArticle.id)}
                >
                  <Star className={`w-4 h-4 ${selectedArticle.starred ? "fill-amber-500" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    readerSettings.theme === "light" || readerSettings.theme === "sepia"
                      ? "text-zinc-600 hover:text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-100"
                  }
                  onClick={() => toggleRead(selectedArticle.id)}
                  title={selectedArticle.read ? "Mark as unread" : "Mark as read"}
                >
                  {selectedArticle.read ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    readerSettings.theme === "light" || readerSettings.theme === "sepia"
                      ? "text-zinc-600 hover:text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-100"
                  }
                  onClick={() => toggleArchive(selectedArticle.id)}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    readerSettings.theme === "light" || readerSettings.theme === "sepia"
                      ? "text-zinc-600 hover:text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-100"
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${showReaderSettings ? "bg-zinc-800" : ""} ${readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-100"}`}
                  onClick={() => setShowReaderSettings(!showReaderSettings)}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    readerSettings.theme === "light" || readerSettings.theme === "sepia"
                      ? "text-zinc-600 hover:text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-100"
                  }
                  onClick={() => setSelectedArticle(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showReaderSettings && (
              <div className="border-b border-zinc-800 p-6 space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 block">Theme</label>
                  <div className="flex gap-2">
                    {(["dark", "sepia", "light", "midnight"] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setReaderSettings({ ...readerSettings, theme })}
                        className={`px-4 py-2 text-sm rounded-lg border-2 transition-all capitalize ${
                          readerSettings.theme === theme
                            ? "border-blue-500 bg-blue-500/10 text-blue-500"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 block">
                    Font Family
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReaderSettings({ ...readerSettings, fontFamily: "serif" })}
                      className={`px-4 py-2 text-sm rounded-lg border-2 transition-all font-serif ${
                        readerSettings.fontFamily === "serif"
                          ? "border-blue-500 bg-blue-500/10 text-blue-500"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      Serif
                    </button>
                    <button
                      onClick={() => setReaderSettings({ ...readerSettings, fontFamily: "sans" })}
                      className={`px-4 py-2 text-sm rounded-lg border-2 transition-all font-sans ${
                        readerSettings.fontFamily === "sans"
                          ? "border-blue-500 bg-blue-500/10 text-blue-500"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      Sans-serif
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Font Size</label>
                    <span className="text-xs text-zinc-500">{readerSettings.fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReaderSettings({ ...readerSettings, fontSize: Math.max(14, readerSettings.fontSize - 1) })
                      }
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${((readerSettings.fontSize - 14) / (24 - 14)) * 100}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReaderSettings({ ...readerSettings, fontSize: Math.min(24, readerSettings.fontSize + 1) })
                      }
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Line Height */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Line Spacing</label>
                    <span className="text-xs text-zinc-500">{readerSettings.lineHeight.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReaderSettings({
                          ...readerSettings,
                          lineHeight: Math.max(1.4, readerSettings.lineHeight - 0.1),
                        })
                      }
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${((readerSettings.lineHeight - 1.4) / (2.2 - 1.4)) * 100}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReaderSettings({
                          ...readerSettings,
                          lineHeight: Math.min(2.2, readerSettings.lineHeight + 0.1),
                        })
                      }
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content Width */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Content Width</label>
                    <span className="text-xs text-zinc-500">{readerSettings.contentWidth}rem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReaderSettings({
                          ...readerSettings,
                          contentWidth: Math.max(32, readerSettings.contentWidth - 2),
                        })
                      }
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${((readerSettings.contentWidth - 32) / (56 - 32)) * 100}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReaderSettings({
                          ...readerSettings,
                          contentWidth: Math.min(56, readerSettings.contentWidth + 2),
                        })
                      }
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div id="article-content" className="flex-1 overflow-auto">
              <article
                className="mx-auto px-8 py-12 transition-all"
                style={{
                  maxWidth: `${readerSettings.contentWidth}rem`,
                  fontSize: `${readerSettings.fontSize}px`,
                  lineHeight: readerSettings.lineHeight,
                }}
              >
                <header className="mb-12">
                  <h1
                    className={`text-4xl font-bold mb-6 leading-tight text-balance ${readerSettings.fontFamily === "serif" ? "font-serif" : "font-sans"} ${readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-900" : "text-zinc-100"}`}
                  >
                    {selectedArticle.title}
                  </h1>
                  <div
                    className={`flex items-center gap-4 text-sm ${readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-600" : "text-zinc-500"}`}
                  >
                    {selectedArticle.author && (
                      <>
                        <span
                          className={
                            readerSettings.theme === "light" || readerSettings.theme === "sepia"
                              ? "text-zinc-700"
                              : "text-zinc-400"
                          }
                        >
                          {selectedArticle.author}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <time>{selectedArticle.date}</time>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedArticle.readTime}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-6">
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-3 py-1.5 rounded-full ${readerSettings.theme === "light" ? "bg-zinc-200 text-zinc-700" : readerSettings.theme === "sepia" ? "bg-amber-200 text-amber-900" : "bg-zinc-800 text-zinc-400"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </header>

                <div
                  className={`prose ${getThemeProseClasses()} max-w-none ${readerSettings.fontFamily === "serif" ? "font-serif" : "font-sans"}`}
                >
                  <p
                    className={`text-lg mb-6 ${readerSettings.theme === "light" ? "text-zinc-700" : readerSettings.theme === "sepia" ? "text-amber-900" : "text-zinc-300"}`}
                  >
                    {selectedArticle.excerpt}
                  </p>

                  <p
                    className={`mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat.
                  </p>

                  <h2
                    className={`text-2xl font-bold mt-12 mb-4 ${readerSettings.fontFamily === "serif" ? "font-serif" : "font-sans"} ${readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-900" : "text-zinc-100"}`}
                  >
                    Understanding the Fundamentals
                  </h2>

                  <p
                    className={`mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                    pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
                    anim id est laborum.
                  </p>

                  <p
                    className={`mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
                    totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae
                    dicta sunt explicabo.
                  </p>

                  <h2
                    className={`text-2xl font-bold mt-12 mb-4 ${readerSettings.fontFamily === "serif" ? "font-serif" : "font-sans"} ${readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-900" : "text-zinc-100"}`}
                  >
                    Practical Applications
                  </h2>

                  <p
                    className={`mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
                    magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum
                    quia dolor sit amet.
                  </p>

                  <ul
                    className={`list-disc list-inside space-y-2 mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    <li>First key point to consider in your implementation</li>
                    <li>Second important aspect of the methodology</li>
                    <li>Third critical element for success</li>
                  </ul>

                  <p
                    className={`mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
                    deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non
                    provident.
                  </p>

                  <h2
                    className={`text-2xl font-bold mt-12 mb-4 ${readerSettings.fontFamily === "serif" ? "font-serif" : "font-sans"} ${readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "text-zinc-900" : "text-zinc-100"}`}
                  >
                    Conclusion
                  </h2>

                  <p
                    className={`mb-6 ${readerSettings.theme === "light" ? "text-zinc-600" : readerSettings.theme === "sepia" ? "text-amber-800" : "text-zinc-400"}`}
                  >
                    In summary, understanding these concepts provides a solid foundation for continued growth. By
                    applying these principles thoughtfully, you'll be well-equipped to tackle increasingly complex
                    challenges in your development journey.
                  </p>
                </div>
              </article>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Select an article to read</p>
              <p className="text-sm">Choose from your saved articles to start reading</p>
              <div className="mt-6 text-xs text-zinc-700">
                <p className="mb-1">Keyboard shortcuts:</p>
                <p>
                  <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-500">j</kbd> /{" "}
                  <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-500">k</kbd> to navigate
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
