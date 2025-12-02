// Debug script - run this in the extension's service worker console
// Go to chrome://extensions/ → Glean Web Clipper → service worker → Console

async function debugStorage() {
  console.log('=== CHECKING STORAGE ===');
  
  // Get current config
  const result = await chrome.storage.local.get(['gleanConfig']);
  console.log('Current gleanConfig:', result.gleanConfig);
  
  // Check each field
  if (result.gleanConfig) {
    console.log('Fields found:');
    console.log('- domain:', result.gleanConfig.domain);
    console.log('- apiToken:', result.gleanConfig.apiToken);
    console.log('- clientToken:', result.gleanConfig.clientToken);
    console.log('- collectionId:', result.gleanConfig.collectionId);
    console.log('- enabled:', result.gleanConfig.enabled);
  }
  
  return result.gleanConfig;
}

async function fixStorage() {
  console.log('=== FIXING STORAGE ===');
  
  // Set correct config with your values
  const config = {
    domain: 'app.glean.com',
    apiToken: 'YOUR_API_TOKEN_HERE', // Replace with your actual token
    collectionId: '14191',
    enabled: true
  };
  
  await chrome.storage.local.set({ gleanConfig: config });
  console.log('Config saved:', config);
  
  // Verify it was saved
  const verify = await chrome.storage.local.get(['gleanConfig']);
  console.log('Verified saved config:', verify.gleanConfig);
  
  // Reinitialize Collections API
  await initializeCollectionsAPI();
  console.log('Collections API reinitialized');
}

// Run debug
debugStorage();

// To fix, uncomment and update the token, then run:
// fixStorage();