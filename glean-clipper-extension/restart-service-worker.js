// Run this in the service worker console to restart manually
console.log('Restarting service worker...');

// Force service worker to restart
self.skipWaiting();

// Re-initialize keepalive
if (typeof startKeepAlive === 'function') {
  startKeepAlive();
  console.log('Keepalive restarted');
} else {
  console.log('Keepalive function not found');
}

console.log('Service worker should be active now');
