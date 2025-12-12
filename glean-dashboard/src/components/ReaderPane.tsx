'use client'

import { useState } from 'react'
import {
  X,
  ExternalLink,
  Star,
  Archive,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Clock,
  Settings2,
  Type,
  AlignLeft,
  Minus,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Clip } from '@/lib/clips-service'

type ReadingTheme = 'dark' | 'sepia' | 'light'

interface ReaderPaneProps {
  clip: Clip
  onClose: () => void
  onNavigateNext?: () => void
  onNavigatePrevious?: () => void
  onDelete?: (clipId: string | number) => void
}

const themeStyles: Record<ReadingTheme, { bg: string; text: string; secondary: string }> = {
  dark: {
    bg: 'bg-zinc-950',
    text: 'text-zinc-100',
    secondary: 'text-zinc-400',
  },
  sepia: {
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    secondary: 'text-amber-700',
  },
  light: {
    bg: 'bg-white',
    text: 'text-zinc-900',
    secondary: 'text-zinc-600',
  },
}

export function ReaderPane({
  clip,
  onClose,
  onNavigateNext,
  onNavigatePrevious,
  onDelete,
}: ReaderPaneProps) {
  const [isStarred, setIsStarred] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [theme, setTheme] = useState<ReadingTheme>('dark')
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.6)

  const handleCopyLink = () => {
    if (clip.url) {
      navigator.clipboard.writeText(clip.url)
    }
  }

  const handleOpenExternal = () => {
    if (clip.url) {
      window.open(clip.url, '_blank')
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this clip?')) {
      onDelete?.(clip.id)
    }
  }

  const currentTheme = themeStyles[theme]

  return (
    <div className={cn('flex flex-col h-full w-96', currentTheme.bg)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsStarred(!isStarred)}
            title="Star"
          >
            <Star
              className={cn('h-4 w-4', isStarred && 'fill-yellow-500 text-yellow-500')}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOpenExternal}
            title="Open in browser"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopyLink}
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNavigatePrevious}
            disabled={!onNavigatePrevious}
            title="Previous (k)"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNavigateNext}
            disabled={!onNavigateNext}
            title="Next (j)"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* Settings toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', showSettings && 'bg-zinc-200 dark:bg-zinc-800')}
            onClick={() => setShowSettings(!showSettings)}
            title="Reader settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          {/* Theme */}
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-2 block">Theme</label>
            <div className="flex gap-2">
              {(['dark', 'sepia', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded capitalize',
                    theme === t
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-500">Font Size</label>
              <span className="text-xs text-zinc-400">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                <div
                  className="h-full bg-zinc-500 rounded-full"
                  style={{ width: `${((fontSize - 12) / 12) * 100}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Line Height */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-500">Line Height</label>
              <span className="text-xs text-zinc-400">{lineHeight.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))}
              >
                <AlignLeft className="h-3 w-3" />
              </Button>
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                <div
                  className="h-full bg-zinc-500 rounded-full"
                  style={{ width: `${((lineHeight - 1.2) / 0.8) * 100}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.1))}
              >
                <Type className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1 overflow-y-auto p-6', currentTheme.bg)}>
        {/* Header */}
        <header className="mb-6">
          <h1
            className={cn('font-bold mb-3', currentTheme.text)}
            style={{ fontSize: fontSize * 1.4, lineHeight: 1.3 }}
          >
            {clip.title}
          </h1>
          <div className={cn('flex items-center gap-3 text-sm', currentTheme.secondary)}>
            {clip.domain && (
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {clip.domain}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {clip.date}
            </span>
          </div>
          {clip.collectionName && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                {clip.collectionName}
              </span>
            </div>
          )}
        </header>

        {/* Body */}
        <div
          className={cn('prose prose-sm max-w-none', currentTheme.text)}
          style={{ fontSize, lineHeight }}
        >
          {clip.selectedText ? (
            <p className="whitespace-pre-wrap">{clip.selectedText}</p>
          ) : (
            <p className={currentTheme.secondary}>
              No text content available.{' '}
              {clip.url && (
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Open original page
                </a>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
