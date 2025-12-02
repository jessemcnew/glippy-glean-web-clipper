// Service Worker Lifecycle Management
// Handles keepalive, startup, and installation events

// Keepalive guard (add near top of modules/serviceWorker.js)
let keepAliveIntervalId = null;
let keepAliveStarted = false;

let isServiceWorkerActive = true;

export function startKeepAlive() {
  if (keepAliveStarted && keepAliveIntervalId) return; // already running
  keepAliveStarted = true;

  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    keepAliveIntervalId = null;
  }

  // Don't send initial ping immediately - wait for message listeners to be set up
  // Start interval but skip first execution
  let skipFirst = true;
  keepAliveIntervalId = setInterval(() => {
    if (skipFirst) {
      skipFirst = false;
      return; // Skip first execution to let message listeners initialize
    }
    try {
      console.debug('🟢 Service worker keepalive ping - Active:', Boolean(chrome.runtime?.id));
      chrome.runtime?.sendMessage?.({ type: 'PING' }, (response) => {
        if (chrome.runtime.lastError) {
          console.debug('Keepalive ping error (expected if no receiver):', chrome.runtime.lastError.message);
          return;
        }
        // Ping successful
      });
    } catch (_) {
      // Ignore errors
    }
  }, 25_000);
}

export function stopKeepAlive() {
  keepAliveStarted = false;
  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    keepAliveIntervalId = null;
  }
}

// Ensure we start only once regardless of multiple init paths
chrome.runtime.onStartup.addListener(() => startKeepAlive());
chrome.runtime.onInstalled.addListener(() => startKeepAlive());

/**
 * Initializes service worker lifecycle management
 */
export function initializeServiceWorker() {
  // Handle messages for service worker management
  self.addEventListener('message', event => {
    console.log('Service worker received message:', event.data);
  });

  // Start keepalive immediately
  startKeepAlive();
}

/**
 * Gets the current service worker status
 */
export function getServiceWorkerStatus() {
  return {
    isActive: isServiceWorkerActive,
    hasKeepAlive: !!keepAliveIntervalId,
    keepAliveStarted,
  };
}
