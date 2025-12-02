// Script to activate the service worker
// Run this in any webpage console after loading the extension

console.log('🔋 Activating Glean Clipper service worker...');

// Send a message to wake up the service worker
chrome.runtime.sendMessage(
  {
    action: 'ping',
  },
  response => {
    if (chrome.runtime.lastError) {
      console.debug('runtime.sendMessage error:', chrome.runtime.lastError.message);
      return;
    }
    console.log('📡 Service worker response:', response);
  }
);

// Try clipping a test item
setTimeout(() => {
  console.log('🧪 Testing clip functionality...');
  chrome.runtime.sendMessage(
    {
      action: 'saveClip',
      data: {
        url: window.location.href,
        title: 'Service Worker Test',
        selectedText: 'This is a test to activate the service worker.',
        context: 'Testing context',
        timestamp: new Date().toISOString(),
        domain: window.location.hostname,
      },
    },
    response => {
      if (chrome.runtime.lastError) {
        console.debug('runtime.sendMessage error:', chrome.runtime.lastError.message);
        return;
      }
      console.log('✅ Test clip result:', response);

      if (response?.success) {
        console.log('🎉 Service worker is active and working!');
      } else {
        console.error('❌ Service worker test failed:', response?.error);
      }
    }
  );
}, 1000);
