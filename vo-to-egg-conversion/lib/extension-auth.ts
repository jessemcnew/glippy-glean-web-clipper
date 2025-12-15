// Extension authentication helper
// Allows dashboard to get OAuth token from Chrome extension

export interface ExtensionAuthResponse {
  success: boolean
  token?: string
  domain?: string
  authMethod?: 'oauth' | 'manual'
  error?: string
  requiresSetup?: boolean
}

/**
 * Check if we're running inside the Chrome extension context
 * (i.e., loaded from chrome-extension:// protocol)
 */
export function isRunningInExtension(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'chrome-extension:'
}

/**
 * Gets the extension ID from localStorage or from the current context
 */
function getExtensionId(): string | undefined {
  if (typeof window === 'undefined') return undefined

  // If running inside extension, get ID from runtime
  if (isRunningInExtension() && typeof chrome !== 'undefined' && chrome.runtime?.id) {
    return chrome.runtime.id
  }

  // Check if extension ID is stored (for external web pages)
  const stored = localStorage.getItem('glean_extension_id')
  if (stored) return stored

  // No extension ID available
  return undefined
}

/**
 * Requests auth config from the Chrome extension
 * Returns the token if extension is installed and has auth configured
 */
export async function getOAuthTokenFromExtension(): Promise<ExtensionAuthResponse> {
  if (typeof window === 'undefined' || typeof chrome === 'undefined' || !chrome.runtime) {
    return {
      success: false,
      error: 'Chrome extension API not available',
    }
  }

  try {
    const runtime = chrome.runtime
    const inExtension = isRunningInExtension()
    const extensionId = getExtensionId()

    // If not in extension and no extension ID, we can't communicate
    if (!inExtension && !extensionId) {
      return {
        success: false,
        error: 'Extension ID not available',
        requiresSetup: true,
      }
    }

    return new Promise((resolve) => {
      const message = { action: 'getOAuthToken' }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: 'Extension communication timeout',
          requiresSetup: false,
        })
      }, 5000)

      const handleResponse = (response: unknown) => {
        clearTimeout(timeout)

        if (runtime.lastError) {
          resolve({
            success: false,
            error: runtime.lastError.message || 'Extension communication error',
            requiresSetup:
              runtime.lastError.message?.includes('not found') ||
              runtime.lastError.message?.includes('Could not establish'),
          })
          return
        }

        const resp = response as Record<string, unknown> | undefined
        if (resp && resp.success) {
          resolve({
            success: true,
            token: resp.token as string,
            domain: resp.domain as string,
            authMethod: (resp.authMethod as 'oauth' | 'manual') || 'manual',
          })
        } else {
          resolve({
            success: false,
            error: (resp?.error as string) || 'Failed to get token from extension',
            requiresSetup: resp?.requiresSetup as boolean,
          })
        }
      }

      // When running inside the extension, don't pass extension ID
      // When running in external page, must pass extension ID
      if (inExtension) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(runtime.sendMessage as any)(message, handleResponse)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(runtime.sendMessage as any)(extensionId!, message, handleResponse)
      }
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Checks if the extension is installed and available
 * Works in two contexts:
 * 1. Inside extension (chrome-extension:// protocol) - always available
 * 2. External web pages - requires extension ID and externally_connectable
 */
export async function checkExtensionAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  // If running inside the extension context, it's always available
  if (isRunningInExtension()) {
    // Verify chrome.runtime is accessible
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return true
    }
    return false
  }

  // For external web pages, we need chrome.runtime and an extension ID
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    return false
  }

  const extensionId = getExtensionId()
  if (!extensionId) {
    return false
  }

  // Try to ping the extension to verify it's responsive
  try {
    const runtime = chrome.runtime!
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(runtime.sendMessage as any)(extensionId, { type: 'PING' }, (response: any) => {
        clearTimeout(timeout)
        if (runtime.lastError) {
          resolve(false)
          return
        }
        resolve(response?.ok === true)
      })
    })
  } catch {
    return false
  }
}

