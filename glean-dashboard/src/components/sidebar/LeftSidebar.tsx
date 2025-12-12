'use client'

import { useState, useEffect } from 'react'
import {
  FolderOpen,
  FileText,
  Search,
  Settings,
  Loader2,
  Plus,
  Wifi,
  WifiOff,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { fetchCollections, type Collection } from '@/lib/collections-service'
import { Button } from '@/components/ui/button'
import { FeedbackModal } from '@/components/FeedbackModal'

// Connection status types
type ConnectionState = 'connected' | 'disconnected' | 'checking'

interface LeftSidebarProps {
  selectedCollectionId: string | null
  onSelectCollection: (id: string | null) => void
  totalClipsCount: number
}

// Mock prompts for now - will be moved to a service later
const MOCK_PROMPTS = [
  { id: '1', name: 'Summarize', category: 'analysis' },
  { id: '2', name: 'Extract Key Points', category: 'analysis' },
  { id: '3', name: 'Create Action Items', category: 'productivity' },
]

export function LeftSidebar({
  selectedCollectionId,
  onSelectCollection,
  totalClipsCount,
}: LeftSidebarProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const [prompts] = useState(MOCK_PROMPTS)
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking')
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

  useEffect(() => {
    loadCollections()
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    setConnectionState('checking')
    try {
      // Check if we're in extension context and have config
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(['gleanConfig'])
        const config = result.gleanConfig || {}
        const hasToken = !!(config.apiToken || config.clientToken)
        const isConfigured = config.enabled && config.domain && hasToken

        if (isConfigured) {
          setConnectionState('connected')
        } else {
          setConnectionState('disconnected')
        }
      } else {
        // Not in extension context - show as disconnected
        setConnectionState('disconnected')
      }
    } catch (error) {
      console.error('Failed to check connection status:', error)
      setConnectionState('disconnected')
    }
  }

  const loadCollections = async () => {
    setIsLoadingCollections(true)
    try {
      const data = await fetchCollections()
      setCollections(data)
    } catch (error) {
      console.error('Failed to load collections:', error)
    } finally {
      setIsLoadingCollections(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-72">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Glippy
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Personal Knowledge Manager
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Collections Section */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            My Collections
          </h2>

          {isLoadingCollections ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          ) : (
            <nav className="space-y-1">
              {/* All Clips option */}
              <button
                onClick={() => onSelectCollection(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedCollectionId === null
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="flex-1 text-left">All Clips</span>
                <span className="text-xs text-zinc-400">{totalClipsCount}</span>
              </button>

              {/* Collection items */}
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => onSelectCollection(String(collection.id))}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedCollectionId === String(collection.id)
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="flex-1 text-left truncate">{collection.name}</span>
                  {collection.itemCount !== undefined && (
                    <span className="text-xs text-zinc-400">{collection.itemCount}</span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </section>

        {/* Prompts Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Prompts
            </h2>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <nav className="space-y-1">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span className="flex-1 text-left truncate">{prompt.name}</span>
              </button>
            ))}
          </nav>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        {/* Connection Status */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
            connectionState === 'connected'
              ? 'text-green-600 dark:text-green-400'
              : connectionState === 'checking'
                ? 'text-zinc-400'
                : 'text-zinc-500 dark:text-zinc-400'
          )}
        >
          {connectionState === 'connected' ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : connectionState === 'checking' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          <span>
            {connectionState === 'connected'
              ? 'Connected to Glean'
              : connectionState === 'checking'
                ? 'Checking connection...'
                : 'Not connected'}
          </span>
          {connectionState === 'connected' && (
            <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
          )}
        </div>

        {/* Search shortcut */}
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Theme, Feedback, and Settings row */}
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Send feedback"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  )
}
