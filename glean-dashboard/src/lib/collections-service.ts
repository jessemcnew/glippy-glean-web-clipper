// Collections service for fetching and managing user's Glean collections
// Collections are fetched via Chrome extension messaging to the Glean API

import type { Clip } from './clips-service'

export interface Collection {
  id: string | number
  name: string
  description?: string
  itemCount?: number
  permissions?: {
    write?: boolean
  }
}

// Cache for collections with TTL
let collectionsCache: Collection[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches collections from the Chrome extension (which calls Glean API)
 * Falls back to mock data for development
 */
export async function fetchCollections(): Promise<Collection[]> {
  // Check cache first
  if (collectionsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return collectionsCache
  }

  try {
    // Try to fetch from extension
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime!.sendMessage({ action: 'fetchCollections' }, resolve)
      })
      if (response?.success && response?.collections) {
        const collections = normalizeCollections(response.collections)
        collectionsCache = collections
        cacheTimestamp = Date.now()
        return collections
      }
    }
  } catch (error) {
    console.error('Failed to fetch collections from extension:', error)
  }

  // Fall back to mock data
  return getMockCollections()
}

/**
 * Fetches clips for a specific collection
 */
export async function fetchCollectionClips(collectionId: string | number): Promise<Clip[]> {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime!.sendMessage(
          { action: 'fetchClipsFromGlean', collectionId: String(collectionId) },
          resolve
        )
      })
      if (response?.success && response?.clips) {
        return response.clips
      }
    }
  } catch (error) {
    console.error('Failed to fetch collection clips:', error)
  }

  // Fall back to filtering from localStorage
  return getClipsForCollection(collectionId)
}

/**
 * Gets clips for a collection from localStorage
 */
function getClipsForCollection(collectionId: string | number): Clip[] {
  try {
    const stored = localStorage.getItem('glean_clips')
    if (!stored) return []
    const clips = JSON.parse(stored)
    return clips.filter(
      (clip: Clip) =>
        clip.collectionId === String(collectionId) || clip.collectionName === String(collectionId)
    )
  } catch {
    return []
  }
}

/**
 * Normalizes collection data from API response
 */
function normalizeCollections(collections: any[]): Collection[] {
  return collections.map((col) => ({
    id: col.id || col.collectionId,
    name: col.name || col.title || 'Untitled Collection',
    description: col.description,
    itemCount: col.itemCount || col.items?.length || 0,
    permissions: col.permissions,
  }))
}

/**
 * Returns mock collections for development
 */
function getMockCollections(): Collection[] {
  return [
    {
      id: 'col-1',
      name: 'AI Resources',
      description: 'Articles and documentation about AI',
      itemCount: 12,
      permissions: { write: true },
    },
    {
      id: 'col-2',
      name: 'Dev Docs',
      description: 'Developer documentation and tutorials',
      itemCount: 8,
      permissions: { write: true },
    },
    {
      id: 'col-3',
      name: 'CSS',
      description: 'CSS styling references',
      itemCount: 5,
      permissions: { write: true },
    },
    {
      id: 'col-4',
      name: 'Extension Dev',
      description: 'Chrome extension development resources',
      itemCount: 3,
      permissions: { write: true },
    },
  ]
}

/**
 * Clears the collections cache (useful after creating/deleting collections)
 */
export function clearCollectionsCache(): void {
  collectionsCache = null
  cacheTimestamp = 0
}
