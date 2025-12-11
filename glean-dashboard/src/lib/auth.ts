// Authentication utilities for Glean Dashboard
// Handles token storage and OAuth token detection

export interface AuthConfig {
  apiToken: string
  domain: string
  authMethod?: 'oauth' | 'manual'
}

const AUTH_STORAGE_KEY = 'glean_auth_config'

/**
 * Saves authentication configuration to localStorage
 */
export function saveAuthConfig(config: AuthConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(config))
}

/**
 * Gets authentication configuration from localStorage
 */
export function getAuthConfig(): AuthConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as AuthConfig
  } catch (error) {
    console.error('Failed to parse auth config:', error)
    return null
  }
}

/**
 * Clears authentication configuration
 */
export function clearAuthConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

/**
 * Checks if user is authenticated
 */
export function isAuthenticated(): boolean {
  const config = getAuthConfig()
  return !!(config?.apiToken && config?.domain)
}

/**
 * Gets OAuth headers for API requests
 * Adds X-Glean-Auth-Type: OAUTH header if token is from OAuth flow
 */
export function getAuthHeaders(token: string, authMethod?: 'oauth' | 'manual'): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  // Add OAuth header if token is from OAuth flow
  if (authMethod === 'oauth') {
    headers['X-Glean-Auth-Type'] = 'OAUTH'
  }

  return headers
}

