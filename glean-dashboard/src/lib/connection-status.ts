'use client'

type ConnectionState = 'connected' | 'disconnected' | 'checking'

interface ConnectionResult {
  state: ConnectionState
  error?: string
}

const CACHE_TTL = 30 * 1000 // 30 seconds
let cachedResult: ConnectionResult | null = null
let cachedAt = 0

function cacheValid() {
  return cachedResult && Date.now() - cachedAt < CACHE_TTL
}

/**
 * Checks connection to Glean via extension messaging if available.
 * Falls back to local heuristic (presence of stored auth config).
 */
export async function checkGleanConnection(): Promise<ConnectionResult> {
  if (cacheValid()) return cachedResult!

  try {
    // Prefer extension ping if available
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime!.sendMessage({ action: 'pingGlean' }, resolve)
      })
      if (response?.success) {
        return cacheResult({ state: 'connected' })
      }
      if (response?.error) {
        return cacheResult({ state: 'disconnected', error: response.error })
      }
    }
  } catch (error) {
    return cacheResult({
      state: 'disconnected',
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // Heuristic fallback: if auth config exists in localStorage, assume connected
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('glean_auth_config') : null
    if (stored) {
      return cacheResult({ state: 'connected' })
    }
  } catch {
    // ignore localStorage errors
  }

  return cacheResult({ state: 'disconnected' })
}

function cacheResult(result: ConnectionResult) {
  cachedResult = result
  cachedAt = Date.now()
  return result
}

