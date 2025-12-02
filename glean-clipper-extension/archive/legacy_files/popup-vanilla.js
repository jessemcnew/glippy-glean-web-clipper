// v0-inspired popup UI using vanilla JavaScript (CSP-compliant)
// Mimics the v0 design system without external dependencies

(function () {
  // Simple state management
  let state = {
    activeTab: 'clip',
    isClipping: false,
    isClipped: false,
    searchQuery: '',
    selectedCollection: null,
    clips: [],
    page: { url: '', title: '' },
    config: {},
    darkMode: true // Default to dark mode
  };

  // Real collections from Glean API
  let userCollections = [];

  // Utility functions
  function getDomain(url) {
    try { 
      return new URL(url).hostname.replace('www.', ''); 
    } catch { 
      return url; 
    }
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  function setState(updates) {
    state = { ...state, ...updates };
    render();
  }

  function getFilteredCollections() {
    return userCollections.filter(c => 
      c.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    );
  }

  // Fetch real collections from Glean API via background script
  async function fetchGleanCollections() {
    if (!state.config.enabled || !state.config.apiToken || !state.config.domain) {
      console.log('Glean not configured, using empty collections');
      return [];
    }

    try {
      const result = await chrome.runtime.sendMessage({ action: 'fetchCollections' });
      if (result.success && result.result.collections) {
        console.log('Fetched collections from background:', result.result.collections);
        return result.result.collections;
      } else {
        console.error('Failed to fetch collections:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  // Chrome extension helpers
  async function loadData() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    
    try {
      const result = await chrome.storage.local.get(['clips', 'gleanConfig']);
      let config = result.gleanConfig || {};
      
      // Prefill test data for jmcnew if no config exists
      if (!config.domain && !config.apiToken) {
        config = {
          domain: 'app.glean.com',
          apiToken: '[REDACTED]', // Working Collections API token
          collectionId: '14191', // Your hello-world collection
          enabled: true
        };
        // Save the prefilled config
        await chrome.storage.local.set({ gleanConfig: config });
        console.log('🔧 Prefilled test configuration for jmcnew with working API token');
      }
      
      setState({
        clips: result.clips || [],
        config: config
      });
      
      // Load collections if Glean is configured
      if (config.enabled && config.apiToken && config.domain) {
        userCollections = await fetchGleanCollections();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }

    // Get current tab info
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      setState({
        page: { 
          url: tab?.url || '', 
          title: tab?.title || 'Current page' 
        }
      });
    } catch (error) {
      console.error('Failed to get tab info:', error);
    }
  }

  async function handleClip() {
    if (!state.selectedCollection) return;
    
    setState({ isClipping: true });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || '',
      });
      const selectedText = result[0]?.result || '';

      await chrome.runtime.sendMessage({
        action: 'saveClip',
        data: {
          url: state.page.url,
          title: state.page.title,
          selectedText,
          domain: getDomain(state.page.url),
          timestamp: Date.now(),
        },
      });

      setState({ isClipping: false, isClipped: true });
      setTimeout(() => window.close(), 1200);
    } catch (error) {
      console.error('Failed to clip:', error);
      setState({ isClipping: false });
    }
  }

  // Render functions
  function renderHeader(title, icon) {
    return `
      <div class="flex items-center justify-between p-4 border-b border-border bg-primary" style="color: white;">
          <div class="flex items-center gap-2">
            <div style="font-size: 18px;">${icon}</div>
            <div>
              <h2 class="font-medium collection-link" style="cursor: pointer; text-decoration: underline;" title="Open Glean Collections">${title}</h2>
              ${state.activeTab === 'clips' ? `<div style="font-size: 12px; opacity: 0.8;">${state.clips.length} clips saved</div>` : ''}
            </div>
          </div>
        <div class="flex items-center gap-1">
          ${state.activeTab !== 'clip' ? '<button class="btn-ghost btn-sm tab-btn" data-tab="clip" style="color: white; font-size: 12px;">Clip</button>' : ''}
          ${state.activeTab !== 'clips' ? '<button class="btn-ghost btn-sm tab-btn" data-tab="clips" style="color: white; font-size: 12px;">Clips</button>' : ''}
          ${state.activeTab !== 'settings' ? '<button class="btn-ghost btn-sm tab-btn" data-tab="settings" style="color: white; font-size: 12px;">Settings</button>' : ''}
          <button class="btn-ghost btn-sm close-btn" style="color: white;">X</button>
        </div>
      </div>
    `;
  }

  function renderClipTab() {
    const filteredCollections = getFilteredCollections();
    
    return `
      <div style="width: 400px; min-height: 500px;">
        ${renderHeader('Glean Clipper', 'G')}
        
        <!-- Current page info -->
        <div class="p-4 border-b border-border bg-muted/20">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0 mt-0.5">
              <div class="w-4 h-4 rounded" style="background: #3b82f6; opacity: 0.2;"></div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium text-foreground line-clamp-2 leading-tight">${state.page.title}</h3>
              <p class="text-xs text-muted-foreground mt-1 truncate">${getDomain(state.page.url)}</p>
            </div>
          </div>
        </div>

        <!-- Collections selection -->
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground">Select Collection</label>
            <button class="btn-ghost btn-sm h-6 text-xs">+ New</button>
          </div>
          
          <div class="relative mb-3">
            <input 
              id="search-collections"
              class="input h-8 text-sm pl-9" 
              placeholder="Search collections..." 
              value="${state.searchQuery}"
            >
            <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 14px;">Search</div>
          </div>
          
          <div class="space-y-2" style="max-height: 180px; overflow-y: auto;">
            ${filteredCollections.length === 0 ? `
              <div class="text-center py-8">
                <div class="text-sm text-muted-foreground mb-4">
                  <div>No collections available</div>
                  <div class="text-xs mt-1">Use your configured collection ID: ${state.config.collectionId || '14191'}</div>
                </div>
                <div class="p-3 rounded-lg border border-dashed border-border">
                  <p class="text-xs text-muted-foreground mb-2">To add more collections:</p>
                  <p class="text-xs text-muted-foreground">1. Go to Glean and find your collection URL</p>
                  <p class="text-xs text-muted-foreground">2. Copy the collection ID from the URL</p>
                  <p class="text-xs text-muted-foreground">3. Add it in Settings tab</p>
                </div>
                ${state.config.collectionId ? `
                  <button 
                    class="btn-primary btn-sm mt-3 use-default-collection-btn"
                    data-collection-id="${state.config.collectionId}"
                  >
                    Use Collection ${state.config.collectionId}
                  </button>
                ` : ''}
              </div>
            ` : filteredCollections.map(c => `
              <div 
                class="p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${state.selectedCollection === c.id ? 'border-primary bg-primary/5' : 'border-border'}"
                data-collection-id="${c.id}"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div style="width: 12px; height: 12px; border-radius: 9999px; background: ${c.color};"></div>
                    <div>
                      <p class="text-sm font-medium text-foreground">${c.name}</p>
                      <p class="text-xs text-muted-foreground">${c.count} links</p>
                    </div>
                  </div>
                  ${state.selectedCollection === c.id ? '<span class="text-primary">Selected</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-border bg-muted/10">
          <div class="flex gap-2">
            <button 
              id="cancel-btn"
              class="btn-outline btn-sm flex-1 h-9" 
              ${state.isClipping ? 'disabled' : ''}
            >
              Cancel
            </button>
            <button 
              id="clip-btn"
              class="btn-primary btn-sm flex-1 h-9" 
              ${!state.selectedCollection || state.isClipping ? 'disabled' : ''}
            >
              ${state.isClipping ? 
                '<div class="flex items-center gap-2"><div class="spinner"></div>Clipping...</div>' : 
                state.isClipped ? 
                '<div class="flex items-center gap-2">Clipped!</div>' : 
                'Clip Link'
              }
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderClipsTab() {
    return `
      <div style="width: 400px; height: 500px;">
        ${renderHeader('Your Clips', 'C')}
        
        <!-- Search and Actions -->
        <div class="p-3 bg-white border-b border-border">
          <div class="flex gap-2 mb-2">
            <input class="input h-8 text-sm flex-1" placeholder="Search your clips..." />
            <button class="btn-outline btn-sm clear-all-clips-btn" title="Clear all clips">Clear All</button>
            <button class="btn-primary btn-sm view-notebook-btn" title="Open full notebook viewer">View Notebook</button>
          </div>
          ${state.clips.some(clip => clip.syncError) ? `
            <button class="btn-primary btn-sm w-full retry-failed-clips-btn">Retry Failed Syncs</button>
          ` : ''}
        </div>
        
        <!-- Clips list -->
        <div style="height: 400px; overflow-y: auto;">
          ${state.clips.length === 0 ? `
            <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
              <div style="font-size: 24px; margin-bottom: 16px; font-weight: bold;">No Clips</div>
              <div style="font-weight: 500;">No clips yet</div>
              <div style="font-size: 12px; margin-top: 4px;">Select text on any webpage and click the clip button</div>
            </div>
          ` : 
            state.clips.map(clip => `
              <div 
                class="p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-all clip-item"
                data-clip-url="${clip.url}"
              >
                <div class="flex justify-between items-start mb-2">
                  <div class="text-sm font-medium text-foreground line-clamp-1" style="flex: 1;">${clip.title}</div>
                  <div class="text-xs px-2 py-1 bg-muted rounded" style="white-space: nowrap; margin-left: 8px;">${getDomain(clip.url)}</div>
                </div>
                <div class="text-sm text-muted-foreground line-clamp-2 mb-2">${clip.selectedText}</div>
                ${clip.images && clip.images.length > 0 ? `
                  <div class="flex gap-2 mb-2 overflow-x-auto">
                    ${clip.images.slice(0, 3).map(img => `
                      <img src="${img}" class="w-12 h-12 object-cover rounded border" 
                           onerror="this.style.display='none'" loading="lazy" />
                    `).join('')}
                    ${clip.images.length > 3 ? `<div class="text-xs text-muted-foreground flex items-center">+${clip.images.length - 3}</div>` : ''}
                  </div>
                ` : ''}
                <div class="flex justify-between items-center">
                  <div class="flex gap-2">
                    ${clip.synced ? '<span class="status-synced">Synced</span>' : ''}
                    ${clip.syncError ? '<span class="status-failed">Failed</span>' : ''}
                  </div>
                  <div class="text-xs text-muted-foreground">${formatDate(clip.timestamp)}</div>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }

  function renderSettingsTab() {
    return `
      <div style="width: 400px; height: 500px;">
        ${renderHeader('Settings', 'S')}
        
        <!-- Settings content -->
        <div class="p-4" style="height: 456px; overflow-y: auto;">
          <div class="text-sm text-muted-foreground mb-4">Configure your Glean integration</div>
          
          <div style="margin-bottom: 16px;">
            <label class="text-sm font-medium text-foreground" style="display: block; margin-bottom: 4px;">Glean Domain</label>
            <input class="input h-9 domain-input" placeholder="app.glean.com" value="${state.config.domain || 'app.glean.com'}" />
            <div class="text-xs text-muted-foreground" style="margin-top: 4px;">Your Glean instance domain (will auto-convert to backend domain)</div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label class="text-sm font-medium text-foreground" style="display: block; margin-bottom: 4px;">API Token</label>
            <input class="input h-9 token-input" type="password" placeholder="Paste your Glean API token here" value="${state.config.apiToken || ''}" />
            <div class="text-xs text-muted-foreground" style="margin-top: 4px;">Get this from Glean Admin → API Tokens</div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label class="text-sm font-medium text-foreground" style="display: block; margin-bottom: 4px;">Collection ID (hello-world)</label>
            <input class="input h-9 collection-input" placeholder="14191" value="${state.config.collectionId || '14191'}" />
            <div class="text-xs text-muted-foreground" style="margin-top: 4px;">Your hello-world collection ID</div>
          </div>
          
          <div class="flex items-center gap-2" style="margin-bottom: 16px;">
            <input type="checkbox" id="sync-enabled" ${state.config.enabled ? 'checked' : ''} />
            <label for="sync-enabled" class="text-sm">Sync clips to Glean</label>
          </div>
          
          <div class="flex gap-2">
            <button class="btn-primary btn-sm flex-1 save-settings-btn">Save Settings</button>
            <button class="btn-outline btn-sm test-connection-btn">Test Connection</button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const root = document.getElementById('root');
    if (!root) return;

    let content = '';
    
    switch (state.activeTab) {
      case 'clip':
        content = renderClipTab();
        break;
      case 'clips':
        content = renderClipsTab();
        break;
      case 'settings':
        content = renderSettingsTab();
        break;
      default:
        content = renderClipTab();
    }

    root.innerHTML = content;
    
    // Hide loading indicator
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }

  // Event delegation handler
  function setupEventDelegation() {
    document.addEventListener('click', (e) => {
      // Handle tab buttons
      if (e.target.classList.contains('tab-btn')) {
        const tab = e.target.dataset.tab;
        setState({ activeTab: tab });
      }
      
      // Handle close button
      if (e.target.classList.contains('close-btn')) {
        window.close();
      }
      
      // Handle collection selection
      if (e.target.closest('[data-collection-id]')) {
        const id = parseInt(e.target.closest('[data-collection-id]').dataset.collectionId);
        setState({ selectedCollection: id });
      }
      
      // Handle use default collection button
      if (e.target.classList.contains('use-default-collection-btn')) {
        const id = parseInt(e.target.dataset.collectionId);
        setState({ selectedCollection: id });
      }
      
      // Handle clear all clips button
      if (e.target.classList.contains('clear-all-clips-btn')) {
        clearAllClips();
      }
      
      // Handle retry failed clips button
      if (e.target.classList.contains('retry-failed-clips-btn')) {
        retryFailedClips();
      }
      
      // Handle view notebook button
      if (e.target.classList.contains('view-notebook-btn')) {
        openNotebookViewer();
      }
      
      // Handle clip button
      if (e.target.id === 'clip-btn') {
        handleClip();
      }
      
      // Handle cancel button
      if (e.target.id === 'cancel-btn') {
        window.close();
      }
      
      // Handle test connection button
      if (e.target.classList.contains('test-connection-btn')) {
        testConnection();
      }
      
      // Handle save settings button  
      if (e.target.classList.contains('save-settings-btn')) {
        saveSettings();
      }
      
      // Handle clip item clicks
      if (e.target.closest('.clip-item')) {
        const url = e.target.closest('.clip-item').dataset.clipUrl;
        if (url && chrome.tabs) {
          chrome.tabs.create({ url });
        }
      }
      
      // Handle collection page redirect
      if (e.target.classList.contains('collection-link')) {
        // Link directly to your hello-world collection
        const collectionsUrl = 'https://app.glean.com/knowledge/collections/14191/hello+world+test?page=1&source=knowledge';
        if (chrome.tabs) {
          chrome.tabs.create({ url: collectionsUrl });
        }
      }
    });
    
    // Handle search input
    document.addEventListener('input', (e) => {
      if (e.target.id === 'search-collections') {
        setState({ searchQuery: e.target.value });
      }
    });
  }

  // Test connection to Glean API
  async function testConnection() {
    const config = state.config;
    if (!config.domain || !config.apiToken) {
      alert('Please configure domain and API token first');
      return;
    }

    try {
      const result = await chrome.runtime.sendMessage({ 
        action: 'testConnection' 
      });
      
      if (result.success) {
        const message = result.result?.message || 'Connection successful!';
        alert(message);
        // Reload collections (will be empty but that's expected)
        userCollections = await fetchGleanCollections();
        render();
      } else {
        alert('Connection failed: ' + result.error);
      }
    } catch (error) {
      alert('Test failed: ' + error.message);
    }
  }

  // Clear all clips
  async function clearAllClips() {
    if (!confirm('Clear all clips? This cannot be undone.')) return;
    
    try {
      await chrome.storage.local.set({ clips: [] });
      setState({ clips: [] });
      alert('All clips cleared!');
    } catch (error) {
      alert('Failed to clear clips: ' + error.message);
    }
  }
  
  // Retry failed clips
  async function retryFailedClips() {
    const failedClips = state.clips.filter(clip => clip.syncError);
    if (failedClips.length === 0) return;
    
    if (!confirm(`Retry syncing ${failedClips.length} failed clips?`)) return;
    
    try {
      for (const clip of failedClips) {
        await chrome.runtime.sendMessage({
          action: 'retrySync',
          data: { clipId: clip.id }
        });
      }
      
      // Reload clips to show updated sync status
      const result = await chrome.storage.local.get(['clips']);
      setState({ clips: result.clips || [] });
      
      alert('Retrying failed syncs...');
    } catch (error) {
      alert('Retry failed: ' + error.message);
    }
  }
  
  // Open notebook viewer
  async function openNotebookViewer() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const notebookUrl = chrome.runtime.getURL('notebook-viewer.html');
        await chrome.tabs.create({ url: notebookUrl });
        window.close(); // Close popup after opening notebook
      } else {
        // Fallback for testing outside extension context
        window.open('notebook-viewer.html', '_blank');
      }
    } catch (error) {
      console.error('Failed to open notebook viewer:', error);
      alert('Failed to open notebook viewer');
    }
  }
  
  // Save settings
  async function saveSettings() {
    const domain = document.querySelector('.domain-input')?.value || '';
    const apiToken = document.querySelector('.token-input')?.value || '';
    const collectionId = document.querySelector('.collection-input')?.value || '';
    const enabled = document.querySelector('#sync-enabled')?.checked || false;

    const config = { domain, apiToken, collectionId, enabled };
    
    try {
      await chrome.storage.local.set({ gleanConfig: config });
      setState({ config });
      
      // Reload collections if enabled
      if (enabled && domain && apiToken) {
        userCollections = await fetchGleanCollections();
      }
      
      alert('Settings saved!');
      render();
    } catch (error) {
      alert('Save failed: ' + error.message);
    }
  }

  // Initialize app
  document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventDelegation();
    render();
  });

})();