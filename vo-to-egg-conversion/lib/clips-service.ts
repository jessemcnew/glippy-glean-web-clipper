// Clips service for fetching and managing clips
// This service fetches clips from Chrome extension storage via message passing

import { sendExtensionMessage, isExtensionAvailable } from './extension-messaging'

export interface Clip {
  id: string | number
  type: 'text' | 'image' | 'screenshot'
  url?: string
  title: string
  date: string
  source?: string
  selectedText?: string
  domain?: string
  timestamp?: number
  syncStatus?: 'synced' | 'pending' | 'failed'
  collectionId?: string
  collectionName?: string
  tags?: string[]
}

/**
 * Fetches clips from Chrome extension storage via message passing
 * Falls back to mock data for development (localhost) or when extension unavailable
 */
export async function fetchClips(): Promise<Clip[]> {
  try {
    // Try to fetch from extension first
    if (isExtensionAvailable()) {
      const response = await sendExtensionMessage<{ success: boolean; clips?: any[] }>({
        action: 'getClips',
      })

      if (response?.success && response.clips) {
        return normalizeClips(response.clips)
      }
    }

    // Fallback: check if we're in development mode (localhost)
    const isDev = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    
    if (isDev) {
      // In development, return mock data
      return getMockClips()
    }

    // Production fallback: empty array
    return []
  } catch (error) {
    console.error('Failed to fetch clips:', error)
    return []
  }
}

/**
 * Returns mock clips for development/demo purposes
 */
function getMockClips(): Clip[] {
  return [
    {
      id: 'mock-1',
      type: 'text',
      url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering',
      title: 'Prompt Engineering Guide - Anthropic',
      date: '2024-12-10',
      source: 'docs.anthropic.com',
      selectedText: 'Claude performs best with clear, specific instructions. Break complex tasks into steps and provide examples of desired output format.',
      domain: 'docs.anthropic.com',
      timestamp: Date.now() - 86400000,
      syncStatus: 'synced',
      collectionName: 'AI Resources'
    },
    {
      id: 'mock-2',
      type: 'text',
      url: 'https://react.dev/learn/thinking-in-react',
      title: 'Thinking in React',
      date: '2024-12-09',
      source: 'react.dev',
      selectedText: 'React changes how you think about designs and apps. When you build a UI with React, you first break it apart into pieces called components.',
      domain: 'react.dev',
      timestamp: Date.now() - 172800000,
      syncStatus: 'synced',
      collectionName: 'Dev Docs'
    },
    {
      id: 'mock-3',
      type: 'text',
      url: 'https://www.glean.com/blog/enterprise-search',
      title: 'The Future of Enterprise Search',
      date: '2024-12-08',
      source: 'glean.com',
      selectedText: 'Enterprise search has evolved beyond keyword matching. Modern solutions use AI to understand context, user intent, and organizational knowledge graphs.',
      domain: 'glean.com',
      timestamp: Date.now() - 259200000,
      syncStatus: 'pending',
      collectionName: undefined
    },
    {
      id: 'mock-4',
      type: 'text',
      url: 'https://tailwindcss.com/docs/customizing-colors',
      title: 'Customizing Colors - Tailwind CSS',
      date: '2024-12-07',
      source: 'tailwindcss.com',
      selectedText: 'Tailwind includes an expertly-crafted default color palette out-of-the-box that is a great starting point.',
      domain: 'tailwindcss.com',
      timestamp: Date.now() - 345600000,
      syncStatus: 'synced',
      collectionName: 'CSS'
    },
    {
      id: 'mock-5',
      type: 'text',
      url: 'https://developer.chrome.com/docs/extensions',
      title: 'Chrome Extensions Documentation',
      date: '2024-12-06',
      source: 'developer.chrome.com',
      selectedText: 'Extensions are small software programs that customize the browsing experience. They let users tailor Chrome functionality to individual needs.',
      domain: 'developer.chrome.com',
      timestamp: Date.now() - 432000000,
      syncStatus: 'synced',
      collectionName: 'Extension Dev'
    }
  ]
}

/**
 * Normalizes clip data from various sources to a consistent format
 */
function normalizeClips(clips: any[]): Clip[] {
  return clips.map((clip) => ({
    id: clip.id || Date.now() + Math.random(),
    type: clip.type || (clip.selectedText ? 'text' : 'image'),
    url: clip.url || '',
    title: clip.title || 'Untitled Clip',
    date: formatDate(clip.timestamp || clip.date || Date.now()),
    source: clip.domain || clip.source || '',
    selectedText: clip.selectedText,
    domain: clip.domain,
    timestamp: clip.timestamp || new Date(clip.date || Date.now()).getTime(),
    syncStatus: clip.syncStatus || (clip.synced ? 'synced' : 'pending'),
    collectionId: clip.collectionId || clip.gleanCollectionId,
    collectionName: clip.collectionName,
  }))
}

/**
 * Formats timestamp to date string
 */
function formatDate(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp)
  return date.toISOString().split('T')[0]
}

/**
 * Deletes a clip by ID via Chrome extension message passing
 */
export async function deleteClip(clipId: string | number): Promise<boolean> {
  try {
    if (isExtensionAvailable()) {
      const response = await sendExtensionMessage<{ success: boolean }>({
        action: 'deleteClip',
        clipId: String(clipId),
      })
      return response?.success === true
    }
    return false
  } catch (error) {
    console.error('Failed to delete clip:', error)
    return false
  }
}

/**
 * Downloads a clip (opens in new tab or downloads)
 */
export function downloadClip(clip: Clip): void {
  if (clip.url) {
    window.open(clip.url, '_blank')
  } else if (clip.selectedText) {
    // Create a text file and download it
    const blob = new Blob([clip.selectedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${clip.title || 'clip'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

