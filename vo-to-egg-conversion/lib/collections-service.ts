// Collections service for fetching and managing user's Glean collections
// Collections are fetched via Chrome extension messaging to the Glean API

import { sendExtensionMessage, isExtensionAvailable } from './extension-messaging'
import type { Clip } from './clips-service'

export interface Collection {
  id: string | number
  name: string
  description?: string
  itemCount?: number
  permissions?: {
    write?: boolean
  }
  ownershipType?: 'owned' | 'shared'
  owner?: string
  creator?: string
}

export type CollectionFilter = 'all' | 'owned' | 'shared'

// Cache for collections with TTL
let collectionsCache: Collection[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches collections from the Chrome extension (which calls Glean API)
 * Falls back to mock data for development
 * @param filter - Optional filter to show 'all', 'owned', or 'shared' collections
 */
export async function fetchCollections(filter: CollectionFilter = 'all'): Promise<Collection[]> {
  // Check cache first
  if (collectionsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return applyFilter(collectionsCache, filter)
  }

  try {
    // Try to fetch from extension
    if (isExtensionAvailable()) {
      const response = await sendExtensionMessage<{ success: boolean; collections?: any[] }>({
        action: 'fetchCollections',
      })
      if (response?.success && response?.collections) {
        const collections = normalizeCollections(response.collections)
        collectionsCache = collections
        cacheTimestamp = Date.now()
        return applyFilter(collections, filter)
      }
    }
  } catch (error) {
    console.error('Failed to fetch collections from extension:', error)
  }

  // Fall back to mock data
  return applyFilter(getMockCollections(), filter)
}

/**
 * Applies ownership filter to collections
 */
function applyFilter(collections: Collection[], filter: CollectionFilter): Collection[] {
  if (filter === 'all') {
    return collections
  }
  
  return collections.filter((col) => {
    if (filter === 'owned') {
      return col.ownershipType === 'owned'
    }
    if (filter === 'shared') {
      return col.ownershipType === 'shared'
    }
    return true
  })
}

/**
 * Fetches clips for a specific collection
 */
export async function fetchCollectionClips(collectionId: string | number): Promise<Clip[]> {
  try {
    if (isExtensionAvailable()) {
      const response = await sendExtensionMessage<{ success: boolean; clips?: Clip[] }>({
        action: 'fetchClipsFromGlean',
        collectionId: String(collectionId),
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
    ownershipType: col.ownershipType || (col.owner || col.creator ? 'owned' : 'shared'),
    owner: col.owner,
    creator: col.creator,
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
      ownershipType: 'owned',
    },
    {
      id: 'col-2',
      name: 'Dev Docs',
      description: 'Developer documentation and tutorials',
      itemCount: 8,
      permissions: { write: true },
      ownershipType: 'owned',
    },
    {
      id: 'col-3',
      name: 'CSS',
      description: 'CSS styling references',
      itemCount: 5,
      permissions: { write: true },
      ownershipType: 'shared',
    },
    {
      id: 'col-4',
      name: 'Extension Dev',
      description: 'Chrome extension development resources',
      itemCount: 3,
      permissions: { write: true },
      ownershipType: 'shared',
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

