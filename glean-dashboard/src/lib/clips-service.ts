// Clips service for fetching and managing clips
// This service can fetch clips from various sources:
// 1. Extension storage (via Chrome extension messaging if available)
// 2. Glean API (if clips are synced to Glean)
// 3. Local storage (for development/testing)

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
}

/**
 * Fetches clips from the extension via messaging API
 * Falls back to localStorage for development/testing
 */
/**
 * Gets the extension ID from the manifest or environment
 * The dashboard needs to know the extension ID to communicate with it
 */
function getExtensionId(): string | undefined {
  // In a real scenario, you'd configure this or get it from environment
  // For now, we'll try to detect it or use a fallback
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // If we're in an extension context, use the current extension ID
    if (chrome.runtime.id) {
      return chrome.runtime.id
    }
  }
  // Could also check localStorage for a configured extension ID
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('glean_extension_id')
    if (stored) return stored
  }
  return undefined
}

/**
 * Fetches clips from the extension via messaging API
 * Falls back to localStorage for development/testing
 */
export async function fetchClips(): Promise<Clip[]> {
  try {
    // Try to communicate with extension via chrome.runtime.sendMessage
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const extensionId = getExtensionId()
        
        return new Promise((resolve) => {
          // Try to get clips from extension
          // If extensionId is undefined, chrome will try to message the extension that loaded this page
          chrome.runtime.sendMessage(
            extensionId,
            { action: 'getClips' },
            (response) => {
              if (chrome.runtime.lastError) {
                // Extension not available or not installed
                console.warn('Extension not available, using localStorage fallback:', chrome.runtime.lastError.message)
                resolve(getClipsFromLocalStorage())
                return
              }
              if (response && response.success && response.clips) {
                resolve(normalizeClips(response.clips))
              } else {
                // No clips or error response
                resolve(getClipsFromLocalStorage())
              }
            }
          )
        })
      } catch (error) {
        console.warn('Failed to communicate with extension:', error)
        return getClipsFromLocalStorage()
      }
    }

    // Fallback to localStorage for development
    return getClipsFromLocalStorage()
  } catch (error) {
    console.error('Failed to fetch clips:', error)
    return []
  }
}

/**
 * Gets clips from localStorage (development fallback)
 */
function getClipsFromLocalStorage(): Clip[] {
  try {
    const stored = localStorage.getItem('glean_clips')
    if (!stored) return []
    const clips = JSON.parse(stored)
    return normalizeClips(clips)
  } catch (error) {
    console.error('Failed to parse clips from localStorage:', error)
    return []
  }
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
 * Deletes a clip by ID
 */
export async function deleteClip(clipId: string | number): Promise<boolean> {
  try {
    // Try to communicate with extension via chrome.runtime.sendMessage
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const extensionId = getExtensionId()
        
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            extensionId,
            { action: 'deleteClip', clipId },
            (response) => {
              if (chrome.runtime.lastError) {
                console.warn('Extension not available, using localStorage fallback:', chrome.runtime.lastError.message)
                resolve(deleteClipFromLocalStorage(clipId))
                return
              }
              if (response && response.success !== undefined) {
                resolve(response.success)
              } else {
                resolve(deleteClipFromLocalStorage(clipId))
              }
            }
          )
        })
      } catch (error) {
        console.warn('Failed to communicate with extension:', error)
        return deleteClipFromLocalStorage(clipId)
      }
    }

    // Fallback to localStorage
    return deleteClipFromLocalStorage(clipId)
  } catch (error) {
    console.error('Failed to delete clip:', error)
    return false
  }
}

/**
 * Deletes clip from localStorage
 */
function deleteClipFromLocalStorage(clipId: string | number): boolean {
  try {
    const stored = localStorage.getItem('glean_clips')
    if (!stored) return false
    const clips = JSON.parse(stored)
    const filtered = clips.filter((c: any) => String(c.id) !== String(clipId))
    localStorage.setItem('glean_clips', JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Failed to delete clip from localStorage:', error)
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
