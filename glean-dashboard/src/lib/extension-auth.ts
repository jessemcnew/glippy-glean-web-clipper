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
 * Gets the extension ID from localStorage or tries to detect it
 */
function getExtensionId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  
  // Check if extension ID is stored
  const stored = localStorage.getItem('glean_extension_id')
  if (stored) return stored
  
  // Try to detect extension by attempting to send a message
  // Chrome will use the extension that can receive messages
  return undefined // Let chrome.runtime.sendMessage handle it
}

/**
 * Requests OAuth token from the Chrome extension
 * Returns the token if extension is installed and has OAuth configured
 */
export async function getOAuthTokenFromExtension(): Promise<ExtensionAuthResponse> {
  if (typeof window === 'undefined' || typeof chrome === 'undefined' || !chrome.runtime) {
    return {
      success: false,
      error: 'Chrome extension API not available',
    }
  }

  try {
    const extensionId = getExtensionId()
    
    return new Promise((resolve) => {
      // chrome.runtime.sendMessage requires extensionId to be a string or omitted
      // If undefined, Chrome will try to message extensions that can receive messages
      const messageOptions: any = { action: 'getOAuthToken' }
      
      if (extensionId) {
        chrome.runtime.sendMessage(extensionId, messageOptions, (response) => {
          handleResponse(response, resolve)
        })
      } else {
        // Try without extensionId - Chrome will message any extension that can receive it
        chrome.runtime.sendMessage(messageOptions, (response) => {
          handleResponse(response, resolve)
        })
      }
      
      function handleResponse(response: any, resolveFn: (value: ExtensionAuthResponse) => void) {
        if (chrome.runtime?.lastError) {
          resolveFn({
            success: false,
            error: chrome.runtime.lastError.message,
            requiresSetup: chrome.runtime.lastError.message.includes('not found') || 
                           chrome.runtime.lastError.message.includes('Could not establish'),
          })
          return
        }
        
        if (response && response.success) {
          resolveFn({
            success: true,
            token: response.token,
            domain: response.domain,
            authMethod: response.authMethod || 'oauth',
          })
        } else {
          resolveFn({
            success: false,
            error: response?.error || 'Failed to get OAuth token from extension',
            requiresSetup: response?.requiresSetup,
          })
        }
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
 * Note: Web pages need the extension ID to communicate with extensions
 * For now, we'll return false and let users use manual entry or web OAuth
 */
export async function checkExtensionAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof chrome === 'undefined' || !chrome.runtime) {
    return false
  }

  // For web pages to message extensions, we need the extension ID
  // Since we don't have it configured, return false quickly
  // Extension integration can be added later when extension ID is known
  return false
  
  // Future: If extension ID is configured, use this:
  /*
  try {
    const extensionId = getExtensionId()
    if (!extensionId) return false
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000)
      
      chrome.runtime.sendMessage(extensionId, { action: 'PING' }, (response) => {
        clearTimeout(timeout)
        resolve(!chrome.runtime?.lastError && !!response)
      })
    })
  } catch {
    return false
  }
  */
}
