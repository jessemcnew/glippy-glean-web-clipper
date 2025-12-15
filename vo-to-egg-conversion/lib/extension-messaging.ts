// Extension messaging utility for type-safe Chrome extension communication
// Provides a unified interface for sending messages to the background service worker

/**
 * Checks if Chrome extension runtime is available
 */
export function isExtensionAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage
}

/**
 * Sends a message to the Chrome extension background service worker
 * @param message - The message object with action (or type) and optional data
 * @returns Promise resolving to the response or null if extension unavailable
 */
export async function sendExtensionMessage<T = any>(
  message: { action?: string; type?: string; [key: string]: any }
): Promise<T | null> {
  if (!isExtensionAvailable()) {
    console.debug('Chrome extension not available, message not sent:', message.action)
    return null
  }

  try {
    if (!chrome?.runtime) {
      return null
    }
    const runtime = chrome.runtime
    return new Promise<T | null>((resolve) => {
      runtime.sendMessage(message, (response) => {
        const err = runtime.lastError
        if (err) {
          console.debug('Extension message error:', err.message)
          return resolve(null)
        }
        resolve(response ?? null)
      })
    })
  } catch (error) {
    console.error('Failed to send extension message:', error)
    return null
  }
}

/**
 * Checks if the extension is available and responding
 */
export async function pingExtension(): Promise<boolean> {
  const response = await sendExtensionMessage<{ ok?: boolean }>({ type: 'PING' })
  return response?.ok === true
}

