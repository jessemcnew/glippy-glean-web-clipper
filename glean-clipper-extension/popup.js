// Popup functionality for Glean Web Clipper

// Import Collections API
import { GleanCollectionsAPI } from './collections-api.js';

// Safe messaging wrapper for popup
async function safeRuntimeSendMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (res) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.debug('runtime.sendMessage no receiver:', err.message);
          return resolve(null);
        }
        resolve(res ?? null);
      });
    } catch (e) {
      console.debug('runtime.sendMessage threw:', e?.message || e);
      resolve(null);
    }
  });
}

let allClips = [];
let filteredClips = [];
let activeFilter = 'all';
let searchQuery = '';
let collections = [];
let collectionsAPI = null;

// DOM elements (will be set after DOM loads)
let searchInput, clipsContainer, emptyState, clipCount;

// Helper to get element safely
// Expected missing elements in new UI: search-input, stats, filters, collections-count
const EXPECTED_MISSING_ELEMENTS = new Set(['search-input', 'stats', 'filters', 'collections-count']);

function getElement(id) {
  const el = document.getElementById(id);
  if (!el && !EXPECTED_MISSING_ELEMENTS.has(id)) {
    console.warn(`Element not found: ${id}`);
  }
  return el;
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements after DOM is loaded
  searchInput = getElement('search-input'); // May not exist in new UI (search removed from clips tab)
  clipsContainer = getElement('clips-container');
  emptyState = getElement('empty-state');
  clipCount = getElement('clip-count');
  // Note: stats, filters, collections-count don't exist in popup-modern.html

  // Warm up service worker with a PING (silently handle errors)
  await new Promise(r => setTimeout(r, 100));
  try {
    await safeRuntimeSendMessage({ type: 'PING' }); // PING uses 'type', handled separately in background.js
  } catch (e) {
    // Ignore PING errors - service worker may not be ready
  }

  await loadSettings();
  await initializeCollections(); // Load collections first so names are available
  await loadClips(); // Load clips after collections so we can look up names
  setupEventListeners();
  setupTabNavigation();
  setupCollectionsUI();
});

// Load clips from storage
async function loadClips() {
  try {
    if (isChromeExtension()) {
      const result = await chrome.storage.local.get(['clips']);
      allClips = result.clips || [];
    } else {
      // In standalone mode, no clips available
      allClips = [];
      console.log('Running in standalone mode - no clips loaded');
    }
    filteredClips = [...allClips];
    updateClipCount();
    renderClips();
  } catch (error) {
    console.error('Failed to load clips:', error);
    allClips = [];
    filteredClips = [];
    updateClipCount();
    renderClips();
  }
}

// Save clips to storage
async function saveClipsToStorage() {
  try {
    if (isChromeExtension()) {
      await chrome.storage.local.set({ clips: allClips });
      console.log('Clips saved to storage');
    }
  } catch (error) {
    console.error('Failed to save clips:', error);
  }
}

// Filter and render clips
function filterAndRender() {
  // Apply filters
  filteredClips = allClips.filter(clip => {
    // Category filter
    if (activeFilter !== 'all' && clip.category !== activeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchableText = [clip.title, clip.selectedText, clip.domain, ...(clip.tags || [])]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(searchQuery)) {
        return false;
      }
    }

    return true;
  });

  renderClips();
}

// Render clips list
function renderClips() {
  if (filteredClips.length === 0) {
    if (clipsContainer) {
      clipsContainer.innerHTML = '';
    }
    if (emptyState) {
      emptyState.style.display = 'flex';
      emptyState.style.flexDirection = 'column';
      emptyState.style.alignItems = 'center';
      emptyState.style.justifyContent = 'center';
      emptyState.style.padding = '48px 24px';
      emptyState.style.textAlign = 'center';
      emptyState.innerHTML = `
        <div class="empty-icon" style="font-size: 48px; margin-bottom: 16px;">📄</div>
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px;">${searchQuery || activeFilter !== 'all' ? 'No matching clips' : 'No clips yet'}</div>
        <div class="empty-hint" style="font-size: 14px; color: #6b7280;">${searchQuery || activeFilter !== 'all' ? 'Try adjusting your search or filter' : 'Select text on any webpage and click the clip button'}</div>
    `;
    }
    // Note: stats element doesn't exist in new UI
    const stats = getElement('stats');
    if (stats) {
    stats.style.display = 'none';
    }
    return;
  }
  
  if (emptyState) {
    emptyState.style.display = 'none';
  }

  const clipsHtml = filteredClips
    .map(
      clip => {
        // Determine sync status
        const isSynced = clip.syncStatus === 'synced' || clip.synced === true;
        const isFailed = clip.syncStatus === 'failed' || clip.syncError;
        const syncStatus = clip.syncStatus || (isSynced ? 'synced' : isFailed ? 'failed' : 'pending');
        
        // Get collection info if synced
        const collectionId = clip.collectionId || clip.gleanCollectionId;
        // Try multiple sources for collection name - prioritize saved name, then lookup
        let collectionName = clip.collectionName || '';
        if (!collectionName && collectionId && collections.length > 0) {
          // Try to find in collections list
          const collection = collections.find(c => String(c.id) === String(collectionId));
          if (collection && collection.name) {
            collectionName = collection.name;
            // Save it to the clip for future renders (async update)
            clip.collectionName = collectionName;
            // Persist to storage
            chrome.storage.local.get(['clips'], (result) => {
              if (!chrome.runtime.lastError) {
                const clips = result.clips || [];
                const clipIndex = clips.findIndex(c => c.id === clip.id);
                if (clipIndex !== -1) {
                  clips[clipIndex].collectionName = collectionName;
                  chrome.storage.local.set({ clips });
                }
              }
            });
          }
        }
        
        // Build sync status indicator
        let syncIndicator = '';
        if (isSynced && collectionId) {
          // Green checkmark with collection name (clickable)
          // Use collection name if available, otherwise show ID
          const displayName = collectionName || `Collection ${collectionId}`;
          
          // Build proper Glean collection URL - validate format
          let collectionUrl = '';
          if (collectionsAPI?.baseUrl) {
            const baseUrl = collectionsAPI.baseUrl.replace('-be.glean.com', '.glean.com');
            if (collectionName) {
              // Create URL-safe slug from collection name
              const collectionNameSlug = collectionName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '+')
                .replace(/^\+|\+$/g, ''); // Remove leading/trailing +
              collectionUrl = `https://${baseUrl}/knowledge/collections/${collectionId}/${encodeURIComponent(collectionNameSlug)}?page=1&source=knowledge`;
            } else {
              // Fallback without name slug
              collectionUrl = `https://${baseUrl}/knowledge/collections/${collectionId}?page=1&source=knowledge`;
            }
          } else {
            // Fallback if no API base URL
            const defaultDomain = 'app.glean.com';
            if (collectionName) {
              const collectionNameSlug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '+');
              collectionUrl = `https://${defaultDomain}/knowledge/collections/${collectionId}/${encodeURIComponent(collectionNameSlug)}?page=1&source=knowledge`;
            } else {
              collectionUrl = `https://${defaultDomain}/knowledge/collections/${collectionId}?page=1&source=knowledge`;
            }
          }
          
          syncIndicator = `
            <div class="clip-sync-status" style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
              <span style="color: #10b981; font-size: 14px;">✓</span>
              <span style="font-size: 12px; color: #6b7280;">Synced to:</span>
              <span style="font-size: 12px; color: #111827; font-weight: 500;">${escapeHtml(displayName)}</span>
            </div>
          `;
        } else if (isFailed || syncStatus === 'failed') {
          // Red X with retry button
          syncIndicator = `
            <div class="clip-sync-status" style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
              <span style="color: #ef4444; font-size: 14px;">✗</span>
              <span style="font-size: 12px; color: #6b7280;">Sync failed</span>
              <button class="retry-sync-btn" data-clip-id="${clip.id}" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                margin-left: 4px;
              ">Retry</button>
            </div>
          `;
        } else {
          // Pending - no indicator needed
        }
        
        // Get favicon URL - handle both saved favicon and fallback
        let faviconUrl = '';
        if (clip.favicon) {
          faviconUrl = clip.favicon;
        } else if (clip.url) {
          try {
            const urlObj = new URL(clip.url);
            faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=48`;
          } catch (e) {
            // Invalid URL, skip favicon
          }
        }
        
        // Get domain name and word count for feed-style display
        const domainName = clip.domain || getDomainName(clip.url);
        const wordCount = estimateWordCount(clip.selectedText || clip.title);
        const timeAgo = formatDate(clip.timestamp);
        
        return `
    <div class="clip-item" data-clip-id="${clip.id}" style="
      display: flex; 
      gap: 16px; 
      align-items: flex-start; 
      padding: 16px 0;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background 0.15s;
    " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
      ${faviconUrl ? `
        <img src="${faviconUrl}" 
             style="width: 48px; height: 48px; border-radius: 8px; flex-shrink: 0; object-fit: cover; border: 1px solid #e5e7eb;" 
             onerror="this.style.display='none'">` : 
        `<div style="width: 48px; height: 48px; border-radius: 8px; background: #f3f4f6; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 20px; font-weight: 600; border: 1px solid #e5e7eb;">${domainName.charAt(0).toUpperCase()}</div>`}
      <div style="flex: 1; min-width: 0;">
        <a href="${clip.url || '#'}" target="_blank" class="clip-title-link" style="text-decoration: none; color: inherit; display: block;" onclick="event.stopPropagation()">
          <div class="clip-title" style="
            font-size: 16px; 
            font-weight: 600; 
            color: #111827; 
            line-height: 1.4;
            margin-bottom: 8px;
            cursor: pointer;
          ">${escapeHtml(clip.title)}</div>
        </a>
        <div class="clip-meta" style="
          display: flex; 
          align-items: center; 
          gap: 8px;
          font-size: 13px; 
          color: #6b7280;
          margin-bottom: 4px;
        ">
          <span style="font-weight: 500;">${escapeHtml(domainName)}</span>
          <span>·</span>
          <span>${timeAgo}</span>
          ${wordCount > 0 ? `<span>·</span><span>${wordCount} words</span>` : ''}
        </div>
        ${syncIndicator}
      </div>
    </div>
  `;
      }
    )
    .join('');

  if (clipsContainer) {
  clipsContainer.innerHTML = clipsHtml;
  }
  // Note: stats element doesn't exist in new UI
  const stats = getElement('stats');
  if (stats) {
    stats.style.display = 'block';
  }
}

// Update clip count
function updateClipCount() {
  const count = allClips.length;
  clipCount.textContent = `${count} clip${count !== 1 ? 's' : ''} saved`;
}

// Format date for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Get domain name from URL for display
function getDomainName(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return 'Unknown';
  }
}

// Estimate word count from text
function estimateWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Check if Chrome APIs are available
function isChromeExtension() {
  return typeof chrome !== 'undefined' && chrome.storage;
}

// Settings functionality
async function loadSettings() {
  try {
    if (isChromeExtension()) {
      const result = await chrome.storage.local.get(['gleanConfig']);
      const config = result.gleanConfig || {
        domain: 'app.glean.com',
        apiToken: '',
        datasource: 'WEBCLIPPER',
        enabled: true,
      };

      console.log('Loaded config from storage:', {
        hasDomain: !!config.domain,
        hasApiToken: !!config.apiToken,
        hasClientToken: !!config.clientToken,
        datasource: config.datasource,
        enabled: config.enabled,
      });

      // Domain is pre-configured, no UI field needed
      // Backend will use config.domain or default to 'app.glean.com'
      
      // Show OAuth status if authenticated via OAuth
      const oauthStatus = getElement('oauth-status');
      const tokenInputGroup = getElement('token-input-group');
      const manualToggleBtn = getElement('manual-token-toggle');
      const tokenInput = getElement('glean-client-token');
      
      if (config.authMethod === 'oauth' && (config.apiToken || config.clientToken)) {
        // OAuth authenticated
        if (tokenInputGroup) tokenInputGroup.style.display = 'none';
        if (oauthStatus) oauthStatus.style.display = 'block';
        if (manualToggleBtn) manualToggleBtn.style.display = 'none';
      } else {
        // Manual token entry - show input if we have a token, otherwise let user toggle
        const hasToken = !!(config.clientToken || config.apiToken);
        if (tokenInput) {
          tokenInput.value = config.clientToken || config.apiToken || '';
        }
        // Always show the input field if we have a token, or show toggle if not
        if (tokenInputGroup) {
          tokenInputGroup.style.display = hasToken ? 'block' : 'none';
        }
        if (oauthStatus) oauthStatus.style.display = 'none';
        if (manualToggleBtn) {
          manualToggleBtn.textContent = hasToken ? 'Hide Token Input' : 'Or Enter Token Manually';
          manualToggleBtn.style.display = 'block';
        }
      }

      // For collection dropdown, set value after collections are loaded
      const collectionSelect = getElement('glean-collection-id');
      if (collectionSelect) {
        // Set value immediately if we have it
        if (config.collectionId) {
        collectionSelect.value = config.collectionId;
          console.log('Set collection ID from config:', config.collectionId);
        }
        // Also set up a listener to update when dropdown changes (only once)
        if (!collectionSelect.hasAttribute('data-listener-added')) {
          collectionSelect.setAttribute('data-listener-added', 'true');
          collectionSelect.addEventListener('change', () => {
            console.log('Collection dropdown changed to:', collectionSelect.value);
          });
        }
      }

      const enabledEl = getElement('glean-enabled');
      if (enabledEl) {
        enabledEl.checked = config.enabled || false;
      }
      
  // Dev mode toggle
  const devModeEl = getElement('dev-mode');
  if (devModeEl) {
    devModeEl.checked = config.devMode || false;
    // Add listener to update status when toggled
    if (!devModeEl.hasAttribute('data-listener-added')) {
      devModeEl.setAttribute('data-listener-added', 'true');
      devModeEl.addEventListener('change', async () => {
        const result = await chrome.storage.local.get(['gleanConfig']);
        const currentConfig = result.gleanConfig || {};
        currentConfig.devMode = devModeEl.checked;
        await chrome.storage.local.set({ gleanConfig: currentConfig });
        updateConnectionStatus(currentConfig);
        console.log('Dev mode toggled:', devModeEl.checked);
      });
    }
  }
  
  updateConnectionStatus(config);
    } else {
      // Default values when not in extension context
      const config = { domain: 'app.glean.com', apiToken: '', collectionId: '', enabled: true };
      const tokenEl = getElement('glean-client-token');
      const collectionSelect = getElement('glean-collection-id');
      const enabledEl = getElement('glean-enabled');
      
      // Domain is pre-configured, no UI field needed
      if (tokenEl) tokenEl.value = config.apiToken;
      if (collectionSelect && config.collectionId) {
        collectionSelect.value = config.collectionId;
      }
      if (enabledEl) enabledEl.checked = config.enabled;
      updateConnectionStatus(config);
      console.log('Running in standalone mode - Chrome APIs not available');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function toggleSettings() {
  // In new UI, settings is a tab, so switch to settings tab
  const settingsTab = document.querySelector('.tab-btn[data-tab="settings"]');
  if (settingsTab) {
    settingsTab.click();
  } else {
    // Fallback for old UI
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsPanel) {
    settingsPanel.classList.toggle('active');
    }
  }
}

async function saveSettings() {
  const tokenEl = getElement('glean-client-token');
  const collectionIdElement = getElement('glean-collection-id');
  
  if (!tokenEl) {
    alert('Settings form elements not found. Please reload the extension.');
    return;
  }
  
  // Get token from input field or from saved storage
  let clientToken = '';
  if (tokenEl) {
    clientToken = tokenEl.value.trim();
  }
  
  // If token input is hidden or empty, try to get from saved storage
  if (!clientToken) {
    try {
      const result = await chrome.storage.local.get(['gleanConfig']);
      if (result.gleanConfig?.clientToken) {
        clientToken = result.gleanConfig.clientToken.trim();
        console.log('Using saved token from storage');
      } else if (result.gleanConfig?.apiToken) {
        clientToken = result.gleanConfig.apiToken.trim();
        console.log('Using saved apiToken from storage');
      }
    } catch (e) {
      console.warn('Could not read from storage:', e);
    }
  }
  
  // Domain is pre-configured - use saved domain or default to 'app.glean.com'
  let domain = 'app.glean.com';
  try {
    const result = await chrome.storage.local.get(['gleanConfig']);
    if (result.gleanConfig?.domain) {
      domain = result.gleanConfig.domain.trim();
    }
  } catch (e) {
    console.warn('Could not read domain from storage, using default:', e);
  }
  
  // Get collection ID - try multiple sources
  let collectionId = '';
  if (collectionIdElement) {
    collectionId = collectionIdElement.value ? collectionIdElement.value.trim() : '';
    console.log('SAVE SETTINGS - Collection ID from select:', {
      element: collectionIdElement,
      value: collectionIdElement.value,
      trimmed: collectionId,
      hasValue: !!collectionId,
    });
    
    // If still empty, try to get from search input's selected item
    if (!collectionId) {
      const searchInput = getElement('collection-search-input');
      if (searchInput && searchInput.value) {
        const matchingCollection = collections.find(c => 
          c.name && c.name.toLowerCase() === searchInput.value.toLowerCase()
        );
        if (matchingCollection) {
          collectionId = String(matchingCollection.id);
          collectionIdElement.value = collectionId;
          console.log('Found collection ID from search input:', collectionId);
        }
      }
    }
  }
  
  console.log('SAVE SETTINGS - Final Collection ID:', collectionId);
  const enabledEl = getElement('glean-enabled');
  const enabled = enabledEl ? enabledEl.checked : false;
  
  const devModeEl = getElement('dev-mode');
  const devMode = devModeEl ? devModeEl.checked : false;

  // Validate required fields (skip if dev mode is enabled)
  if (!clientToken && !devMode) {
    // Show the token input if it's hidden
    const tokenInputGroup = getElement('token-input-group');
    if (tokenInputGroup && tokenInputGroup.style.display === 'none') {
      tokenInputGroup.style.display = 'block';
      const toggleBtn = getElement('manual-token-toggle');
      if (toggleBtn) {
        toggleBtn.textContent = 'Hide Token Input';
      }
    }
    
    alert('Please enter a Client API token.\n\n1. Click "Or Enter Token Manually" above\n2. Paste your token in the field\n3. Click "Save Settings" again\n\nGet your token from:\nGlean → Admin → Platform → Token Management → Client tab');
    return;
  }

  // Validate token length (Glean tokens are typically 40+ characters)
  if (clientToken.length < 30) {
    const confirmContinue = confirm(
      `Warning: Your token is only ${clientToken.length} characters long.\n\n` +
      `Glean Client API tokens are typically 40+ characters.\n\n` +
      `Make sure you:\n` +
      `1. Copied the FULL token (not truncated)\n` +
      `2. Selected a "Client API" token (not Indexing API token)\n` +
      `3. Token is from Admin → Platform → Token Management → Client tab\n\n` +
      `Continue anyway?`
    );
    if (!confirmContinue) {
      return;
    }
  }

  // Save configuration - tokens must come from storage only, never hardcoded
  const config = {
    domain,
    apiToken: clientToken, // Collections API token (from UI)
    clientToken, // Collections API token (from UI) - alias for compatibility
    collectionId: collectionId || '', // Save empty string if not provided (don't use undefined)
    enabled,
    devMode, // Mock API mode for offline development
    tokenType: 'glean-issued', // Default to Glean-issued tokens (can be 'oauth' or 'glean-issued')
    // Preserve authMethod if already set
    authMethod: clientToken ? 'oauth' : undefined,
    // Note: Indexing token should be configured separately if needed
    // indexingToken and indexingEnabled are optional and stored separately
  };

  console.log('Attempting to save config:', {
    hasDomain: !!domain,
    hasApiToken: !!clientToken,
    hasCollectionId: !!collectionId,
    enabled,
    fullDomain: domain,
    collectionIdValue: collectionId,
  });

  try {
    if (isChromeExtension()) {
      await chrome.storage.local.set({ gleanConfig: config });
      console.log('✅ Settings saved to Chrome storage successfully');

      // Verify the save worked
      const verification = await chrome.storage.local.get(['gleanConfig']);
      console.log('Verification - saved config:', verification.gleanConfig);
    } else {
      console.log('Settings would be saved:', config);
    }

    updateConnectionStatus(config);

    // Refresh Collections API with new settings
    if (isChromeExtension()) {
      try {
        await safeRuntimeSendMessage({ action: 'refreshCollections' });
        console.log('Collections API refreshed with new settings');
        await initializeCollections(); // Re-initialize in popup too
        // Ensure collection dropdown is populated with current selection preserved
        populateSettingsCollectionDropdown();
      } catch (error) {
        console.error('Failed to refresh Collections API:', error);
      }
    }

    // Show success feedback
    const saveBtn = getElement('save-settings');
    if (saveBtn) {
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
      saveBtn.style.background = '#000000';

      // Show warning if collection ID is missing
      if (!collectionId) {
        setTimeout(() => {
          alert('⚠️ Warning: No collection selected.\n\nTo select a collection:\n1. Type collection name in search box\n2. Click on a result from the dropdown\n3. Then click "Save Settings"\n\nYou can still test the connection, but sync will fail until you select a collection.');
        }, 500);
      }

    setTimeout(() => {
      saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 2000);
    }
  } catch (error) {
    console.error('❌ Failed to save settings:', error);
    alert('Failed to save settings: ' + error.message);
  }
}

function updateConnectionStatus(config) {
  const statusEl = getElement('connection-status');
  if (!statusEl) return;

  // Check if dev mode is enabled
  if (config.devMode) {
    statusEl.textContent = 'Mock Mode';
    statusEl.className = 'status-badge ready';
    statusEl.title = 'Mock API mode enabled - using simulated responses';
    return;
  }

  // Check if enabled, domain set, and has token
  const hasToken = !!(config.apiToken || config.clientToken);
  if (config.enabled && config.domain && hasToken) {
    statusEl.textContent = 'Ready';
    statusEl.className = 'status-badge ready';
    statusEl.title = '';
  } else {
    statusEl.textContent = 'Disconnected';
    statusEl.className = 'status-badge disconnected';
    statusEl.title = '';
  }
}

// Setup event listeners (updated)
function setupEventListeners() {
  // Search input (may not exist in new UI)
  if (searchInput) {
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase();
    filterAndRender();
  });
  } else {
    // No search input in new UI - that's fine, search is handled elsewhere
  }

  // Filter tags (if filters element exists - not in new UI)
  const filters = getElement('filters');
  if (filters) {
  filters.addEventListener('click', e => {
    if (e.target.classList.contains('filter-tag')) {
      // Update active filter
      filters.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
      });
      e.target.classList.add('active');

      activeFilter = e.target.dataset.filter;
      filterAndRender();
    }
  });
  }

  // Clip clicks - handled by collection-link and clip-title-link handlers above
  // Removed general clip-item click handler since we now have specific link handlers

  // Main CTA button
  const viewNotebookBtn = getElement('view-notebook-btn');
  if (viewNotebookBtn) {
    viewNotebookBtn.addEventListener('click', openNotebook);
  }

  // Quick clip button
  const quickClipBtn = getElement('quick-clip-btn');
  if (quickClipBtn) {
    quickClipBtn.addEventListener('click', handleQuickClip);
  }

  // Settings button
  const settingsBtn = getElement('settings-btn');
  const saveSettingsBtn = getElement('save-settings');
  const testConnectionBtn = getElement('test-connection');
  const testSyncBtn = getElement('test-sync');
  const openDebuggerBtn = getElement('open-debugger');
  const oauthBtn = getElement('oauth-authenticate-btn');
  const manualToggleBtn = getElement('manual-token-toggle');
  const tokenInputGroup = getElement('token-input-group');
  const oauthStatus = getElement('oauth-status');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', toggleSettings);
  }
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', testConnection);
  }
  if (testSyncBtn) {
    testSyncBtn.addEventListener('click', testSync);
  }
  if (openDebuggerBtn) {
    openDebuggerBtn.addEventListener('click', openDebugger);
  }
  if (oauthBtn) {
    oauthBtn.addEventListener('click', handleOAuthLogin);
  }
  if (manualToggleBtn) {
    manualToggleBtn.addEventListener('click', toggleManualToken);
  }

  // Collection search input
  const collectionSearchInput = getElement('collection-search-input');
  if (collectionSearchInput) {
    collectionSearchInput.addEventListener('input', () => {
      updateCollectionSearchResults();
    });
    
    collectionSearchInput.addEventListener('focus', () => {
      if (collectionSearchInput.value) {
        updateCollectionSearchResults();
      }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      const resultsContainer = getElement('collection-results');
      if (resultsContainer && !resultsContainer.contains(e.target) && e.target !== collectionSearchInput) {
        resultsContainer.style.display = 'none';
      }
    });
  }

  // Clear collection button
  const clearCollectionBtn = getElement('clear-collection-btn');
  if (clearCollectionBtn) {
    clearCollectionBtn.addEventListener('click', async () => {
      const collectionSelect = getElement('glean-collection-id');
      const searchInput = getElement('collection-search-input');
      
      if (collectionSelect) collectionSelect.value = '';
      if (searchInput) searchInput.value = '';
      
      // Clear from storage
      try {
        const result = await chrome.storage.local.get(['gleanConfig']);
        const config = result.gleanConfig || {};
        config.collectionId = '';
        await chrome.storage.local.set({ gleanConfig: config });
        console.log('✅ Collection cleared');
      } catch (error) {
        console.error('Failed to clear collection:', error);
      }
      
      clearCollectionBtn.style.display = 'none';
      updateCollectionSearchResults();
    });
  }

  // Retry sync buttons
  if (clipsContainer) {
    clipsContainer.addEventListener('click', async (e) => {
      if (e.target.classList.contains('retry-sync-btn')) {
        const clipId = e.target.dataset.clipId;
        const clip = allClips.find(c => c.id === clipId);
        if (clip) {
          e.target.disabled = true;
          e.target.textContent = 'Retrying...';
          
          try {
            // Get current config
            const result = await chrome.storage.local.get(['gleanConfig']);
            const config = result.gleanConfig || {};
            
            if (config.enabled && config.apiToken && config.collectionId) {
              // Retry sync
              await safeRuntimeSendMessage({
                action: 'retrySync',
                clipId: clipId,
              });
              
              // Reload clips to show updated status
              await loadClips();
            } else {
              alert('Please configure Glean settings first (token and collection)');
            }
          } catch (error) {
            console.error('Retry sync failed:', error);
            alert('Failed to retry sync: ' + error.message);
            e.target.disabled = false;
            e.target.textContent = 'Retry';
          }
        }
      }
      
      // Collection name is no longer clickable - just display
      
      // Clip title link clicks - open article URL
      if (e.target.closest('.clip-title-link')) {
        e.preventDefault();
        const clipItem = e.target.closest('.clip-item');
        if (clipItem) {
          const clipId = clipItem.dataset.clipId;
          const clip = allClips.find(c => c.id === clipId);
          if (clip && clip.url) {
            chrome.tabs.create({ url: clip.url });
          }
        }
      }
    });
  }

  // Clear all synced clips button - removes from extension view only, keeps in Glean
  const clearSyncedBtn = getElement('clear-synced-clips-btn');
  if (clearSyncedBtn) {
    clearSyncedBtn.addEventListener('click', async () => {
      try {
        const result = await chrome.storage.local.get(['clips']);
        const clips = result.clips || [];
        
        console.log('📋 Total clips before clear:', clips.length);
        
        // Debug: Log first clip's full structure to see what properties exist
        if (clips.length > 0) {
          console.log('🔍 First clip full object:', JSON.stringify(clips[0], null, 2));
        }
        
        // Remove all clips that are synced (from extension view only)
        // If a clip has a collectionId, it was successfully synced to Glean
        const updatedClips = clips.filter(clip => {
          const collectionId = clip.collectionId || clip.gleanCollectionId;
          const hasCollectionId = !!collectionId;
          
          // Also check sync status as backup
          const isSynced = clip.syncStatus === 'synced' || clip.synced === true;
          
          // Remove if it has collectionId (primary indicator) OR is explicitly marked as synced
          const shouldRemove = hasCollectionId || isSynced;
          
          if (shouldRemove) {
            console.log(`🗑️ Removing synced clip: "${clip.title?.substring(0, 40)}"`, {
              collectionId: collectionId,
              syncStatus: clip.syncStatus,
              synced: clip.synced,
              hasCollectionId: hasCollectionId,
              isSynced: isSynced
            });
          } else {
            console.log(`✅ Keeping clip: "${clip.title?.substring(0, 40)}"`, {
              collectionId: collectionId,
              syncStatus: clip.syncStatus,
              synced: clip.synced
            });
          }
          
          return !shouldRemove; // Keep only non-synced clips
        });
        
        const syncedCount = clips.length - updatedClips.length;
        console.log(`✅ Removed ${syncedCount} synced clips from extension view (kept ${updatedClips.length} non-synced)`);

        await chrome.storage.local.set({ clips: updatedClips });
        await loadClips();
      } catch (error) {
        console.error('Failed to clear synced clips:', error);
      }
    });
  }
}

// Test connection functionality
async function testConnection() {
  if (!isChromeExtension()) {
    alert('Test connection only works when extension is installed');
    return;
  }

  const testBtn = getElement('test-connection');
  if (!testBtn) return;
  
  // Check if dev mode is enabled - but allow test in mock mode to show mock collections
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig || {};
  if (config.devMode) {
    // In mock mode, proceed with test to show mock collections
    console.log('🎭 Mock API Mode: Testing connection will return mock data');
  }
  
  const originalText = testBtn.textContent;
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timed out after 10 seconds')), 10000);
    });

    const testPromise = safeRuntimeSendMessage({
      action: 'testConnection',
    });

    const response = await Promise.race([testPromise, timeoutPromise]);

    if (response?.success) {
      // Connection successful - now fetch collections automatically
      testBtn.textContent = 'Loading collections...';
      
      try {
        const collectionsResponse = await safeRuntimeSendMessage({
          action: 'fetchCollections',
        });
        
        if (collectionsResponse?.success && collectionsResponse.collections?.length > 0) {
          // Update collections and populate dropdown
          // Note: collectionsResponse.collections should already be filtered by fetchGleanCollections()
          collections = collectionsResponse.collections || [];
          console.log(`✅ Test Connection: Loaded ${collections.length} filtered collections`);
          
          // Collections tab removed - no need to render
          populateSettingsCollectionDropdown();
          
          alert(`✅ Connection successful!\n\nLoaded ${collections.length} collection(s). You can now select one from the dropdown.`);
        } else if (collectionsResponse?.error) {
          alert(`✅ Connection successful, but couldn't load collections:\n${collectionsResponse.error}\n\nYou can still enter a collection ID manually.`);
    } else {
          alert('✅ Connection successful! Collections could not be loaded automatically. You may need to enter a collection ID manually.');
        }
      } catch (collectionsError) {
        console.error('Failed to fetch collections:', collectionsError);
        alert('✅ Connection successful! Collections could not be loaded automatically. You may need to enter a collection ID manually.');
      }
    } else {
      const errorMsg = response?.error || 'Unknown error';
      const details = response?.details ? `\n\nDebug Info:\n${JSON.stringify(response.details, null, 2)}` : '';
      alert('❌ Connection failed:\n\n' + errorMsg + details);
    }
  } catch (error) {
    console.error('Connection test error:', error);
    alert('❌ Connection test failed: ' + error.message);
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

// Test sync functionality
async function testSync() {
  if (!isChromeExtension()) {
    alert('Test sync only works when extension is installed');
    return;
  }

  const testBtn = getElement('test-sync');
  if (!testBtn) return;
  
  // Check if dev mode is enabled
  const result = await chrome.storage.local.get(['gleanConfig']);
  const config = result.gleanConfig || {};
  if (config.devMode) {
    alert('🎭 Mock API Mode is enabled!\n\nThis will simulate a successful sync. Disable Mock API Mode in Developer Options to test real sync.');
  }
  
  const originalText = testBtn.textContent;
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timed out after 10 seconds')), 10000);
    });

    const testPromise = safeRuntimeSendMessage({
      action: 'testSync',
    });

    const response = await Promise.race([testPromise, timeoutPromise]);

    if (response?.success) {
      alert('✅ Collections sync successful! Test clip added to collection.');
    } else {
      const errorMsg = response?.error || 'Unknown error';
      alert('❌ Collections sync failed: ' + errorMsg + '\n\nMake sure:\n- Collection ID is set in settings\n- Your token has permission to add items to the collection\n- The collection exists and is accessible');
    }
  } catch (error) {
    console.error('Sync test error:', error);
    alert('❌ Sync test failed: ' + error.message);
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

// Open datasource debugger
function openDebugger() {
  if (isChromeExtension()) {
    chrome.tabs.create({ url: chrome.runtime.getURL('datasource-checker.html') });
  } else {
    window.open('datasource-checker.html', '_blank');
  }
}

// Listen for storage changes (only in extension context)
if (isChromeExtension()) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.clips) {
      allClips = changes.clips.newValue || [];
      filteredClips = [...allClips];
      updateClipCount();
      filterAndRender();
    }
  });
}

// =============================================================================
// COLLECTIONS FUNCTIONALITY
// =============================================================================

// Initialize Collections API
async function initializeCollections() {
  console.log('Initializing Collections API...');
  try {
    if (isChromeExtension()) {
      const result = await chrome.storage.local.get(['gleanConfig']);
      const config = result.gleanConfig || {};

      console.log('Loaded config for Collections:', {
        enabled: config.enabled,
        hasDomain: !!config.domain,
        hasIndexingToken: !!config.indexingToken,
        hasClientToken: !!config.clientToken,
      });

      if (config.enabled && config.domain && config.clientToken) {
        // Create config for Collections API with clientToken
        const collectionsConfig = {
          enabled: config.enabled,
          domain: config.domain,
          apiToken: config.clientToken, // Collections API uses clientToken
        };
        console.log('🔗 Creating Collections API instance with config');
        collectionsAPI = new GleanCollectionsAPI(collectionsConfig);
        console.log('Collections API created, loading collections...');
        await loadCollections();
      } else {
        console.log('Collections API not configured:', {
          enabled: config.enabled,
          hasDomain: !!config.domain,
          hasClientToken: !!config.clientToken,
        });
      }
    } else {
      console.log('🚫 Not in Chrome extension context');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Collections:', error);
  }
}

// Load collections from Glean
async function loadCollections() {
  console.log('Loading collections from Glean...');

  if (!collectionsAPI) {
    console.log('Collections API not available');
    return;
  }

  try {
    console.log('📞 Calling collectionsAPI.listCollections()...');
    const result = await collectionsAPI.listCollections();
    console.log('📄 Collections API response:', result);

    let allCollections = result.collections || [];
    console.log(`📦 Loaded ${allCollections.length} total collections from API`);

    // Show all collections (user info endpoint not available)
    // The API likely already filters to collections the user can access
    collections = allCollections;
    console.log(`✅ Loaded ${collections.length} collections`);

    // Collections tab removed - only update Settings dropdown
    populateSettingsCollectionDropdown();
  } catch (error) {
    console.error('❌ Failed to load collections:', error);
    // Show offline mode or error state
    // Collections tab removed - only update Settings dropdown
    populateSettingsCollectionDropdown();
  }
}

// Save collection selection to storage
async function saveCollectionSelection(collectionId) {
  try {
    const result = await chrome.storage.local.get(['gleanConfig']);
    const config = result.gleanConfig || {};
    config.collectionId = collectionId || '';
    
    // Also save collection name if available
    if (collectionId) {
      const collection = collections.find(c => String(c.id) === String(collectionId));
      if (collection) {
        config.collectionName = collection.name || '';
      }
    } else {
      config.collectionName = '';
    }
    
    await chrome.storage.local.set({ gleanConfig: config });
    console.log('✅ Collection selection saved:', collectionId, config.collectionName ? `(${config.collectionName})` : '');
  } catch (error) {
    console.error('Failed to save collection selection:', error);
  }
}

// Populate collection selector with searchable list
function populateSettingsCollectionDropdown() {
  const collectionSelect = getElement('glean-collection-id');
  const searchInput = getElement('collection-search-input');
  const resultsContainer = getElement('collection-results');
  
  if (!collectionSelect || !resultsContainer) return;

  // Get current value to preserve selection
  const currentValue = collectionSelect.value;

  // Clear and populate dropdown (for backwards compatibility and ID storage)
  collectionSelect.innerHTML = '<option value="">Select a collection...</option>';
  collections.forEach(collection => {
    const option = document.createElement('option');
    // Ensure ID is a string for consistency
    const idStr = String(collection.id);
    option.value = idStr;
    option.textContent = collection.name || 'Untitled Collection';
    collectionSelect.appendChild(option);
  });

  console.log('Populated select with', collections.length, 'collections');

  // Restore previous selection
  if (currentValue && collections.find(c => c.id === currentValue)) {
    collectionSelect.value = currentValue;
    if (searchInput) {
      const selected = collections.find(c => c.id === currentValue);
      if (selected) searchInput.value = selected.name || '';
    }
  }
  
  // Restore from saved config
  chrome.storage.local.get(['gleanConfig'], (result) => {
    if (chrome.runtime.lastError) {
      console.debug('storage.local.get error:', chrome.runtime.lastError.message);
      return;
    }
    const savedCollectionId = result?.gleanConfig?.collectionId;
    if (savedCollectionId) {
      const matchingCollection = collections.find(c => String(c.id) === String(savedCollectionId));
      if (matchingCollection) {
        collectionSelect.value = savedCollectionId;
        if (searchInput) {
          searchInput.value = matchingCollection.name || '';
        }
        // Show clear button
        const clearBtn = getElement('clear-collection-btn');
        if (clearBtn) clearBtn.style.display = 'block';
      } else {
        // Collection ID saved but not in current list - still show it
        collectionSelect.value = savedCollectionId;
        if (searchInput) {
          searchInput.value = `Collection ID: ${savedCollectionId}`;
        }
        const clearBtn = getElement('clear-collection-btn');
        if (clearBtn) clearBtn.style.display = 'block';
      }
    } else {
      // No saved collection - hide clear button
      const clearBtn = getElement('clear-collection-btn');
      if (clearBtn) clearBtn.style.display = 'none';
    }
  });

  // Update search results
  updateCollectionSearchResults();
}

function updateCollectionSearchResults() {
  const searchInput = getElement('collection-search-input');
  const resultsContainer = getElement('collection-results');
  const collectionSelect = getElement('glean-collection-id');
  
  if (!searchInput || !resultsContainer) return;

  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) {
    resultsContainer.style.display = 'none';
    // If search is cleared, also clear selection
    if (collectionSelect) {
      collectionSelect.value = '';
    }
    return;
  }

  // Filter collections by search query
  const filtered = collections.filter(col => {
    const name = (col.name || '').toLowerCase();
    const desc = (col.description || '').toLowerCase();
    return name.includes(query) || desc.includes(query);
  }).slice(0, 20); // Limit to 20 results

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: #6b7280; font-size: 13px;">No collections found</div>';
    resultsContainer.style.display = 'block';
    return;
  }

  // Render results
  resultsContainer.innerHTML = filtered.map(col => {
    const colIdStr = String(col.id);
    const isSelected = collectionSelect?.value === colIdStr;
    return `
      <div class="collection-result-item" data-id="${colIdStr}" style="
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        background: ${isSelected ? '#f9fafb' : 'white'};
        transition: background 0.15s;
      ">
        <div style="font-weight: 500; font-size: 13px; color: #111827; margin-bottom: 2px;">
          ${escapeHtml(col.name || 'Untitled Collection')}
          ${isSelected ? ' <span style="color: #000;">✓</span>' : ''}
        </div>
        ${col.description ? `<div style="font-size: 11px; color: #6b7280;">${escapeHtml(col.description.substring(0, 80))}${col.description.length > 80 ? '...' : ''}</div>` : ''}
      </div>
    `;
  }).join('');

  // Add click handlers
  resultsContainer.querySelectorAll('.collection-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      console.log('Collection clicked:', { id, type: typeof id });
      
      // Ensure ID is a string (some APIs return numbers) - define outside if block
      const idStr = String(id);
      
      if (collectionSelect) {
        collectionSelect.value = idStr;
        console.log('Set collectionSelect.value to:', idStr, 'Actual value:', collectionSelect.value);
        
        const selected = collections.find(c => String(c.id) === idStr);
        if (selected && searchInput) {
          searchInput.value = selected.name || '';
          console.log('Set searchInput.value to:', selected.name);
        }
        
        // Show clear button
        const clearBtn = getElement('clear-collection-btn');
        if (clearBtn) clearBtn.style.display = 'block';
        
        // Verify it was set
        if (collectionSelect.value !== idStr) {
          console.error('Failed to set collection ID! Expected:', idStr, 'Got:', collectionSelect.value);
        }
      }
      resultsContainer.style.display = 'none';
      
      // Auto-save collection selection
      saveCollectionSelection(idStr);
      
      console.log('✅ Collection selected:', idStr);
    });
    
    item.addEventListener('mouseenter', () => {
      item.style.background = '#f9fafb';
    });
    
    item.addEventListener('mouseleave', () => {
      const isSelected = collectionSelect && String(collectionSelect.value) === String(item.dataset.id);
      item.style.background = isSelected ? '#f9fafb' : 'white';
    });
  });

  resultsContainer.style.display = 'block';
}

// Render collections list
function renderCollections() {
  const collectionsList = getElement('collections-list');
  const emptyState = getElement('collections-empty-state');

  if (!collectionsList) return;

  if (collections.length === 0) {
    collectionsList.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div class="empty-icon">📚</div>
        <div>No collections yet</div>
        <div class="empty-hint">Create collections to organize your clips</div>
    `;
    }
    return;
  }

  if (emptyState) {
    emptyState.style.display = 'none';
  }

  const collectionsHtml = collections
    .map(
      collection => `
    <div class="collection-item" data-collection-id="${collection.id}">
      <div class="collection-name">${escapeHtml(collection.name || 'Untitled Collection')}</div>
      ${collection.description ? `<div class="collection-description">${escapeHtml(collection.description)}</div>` : ''}
      <div class="collection-stats">
        <span>📄 ${collection.itemCount || collection.count || 0} items</span>
        ${collection.isPublic !== undefined ? `<span>${collection.isPublic ? '🌐 Public' : '🔒 Private'}</span>` : ''}
        ${collection.createdAt ? `<span>📅 ${formatDate(collection.createdAt)}</span>` : ''}
      </div>
    </div>
  `
    )
    .join('');

  collectionsList.innerHTML = collectionsHtml;
  
  // Add click handlers for collection items
  collectionsList.querySelectorAll('.collection-item').forEach(item => {
    item.addEventListener('click', () => {
      const collectionId = item.dataset.collectionId;
      openCollectionInGlean(collectionId);
    });
  });
}

// Update collections count
function updateCollectionsCount() {
  const count = collections.length;
  const collectionsCount = getElement('collections-count');
  if (collectionsCount) {
    collectionsCount.textContent = `${count} collection${count !== 1 ? 's' : ''}`;
  }
  // Note: collections-count doesn't exist in popup-modern.html, so this is safe no-op
}

// Setup tab navigation
function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const tabIndicator = document.querySelector('.tab-indicator');

  tabBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update tab buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update tab indicator
      if (tabIndicator) {
        tabIndicator.style.transform = `translateX(${index * 100}%)`;
      }

      // Update tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
      });

      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      // Collections tab removed - no longer needed
    });
  });
}

// Setup Collections UI event listeners
function setupCollectionsUI() {
  // Create collection button
  const createBtn = document.getElementById('create-collection-btn');
  const modal = document.getElementById('collection-modal');
  const cancelBtn = document.getElementById('cancel-collection');
  const saveBtn = document.getElementById('save-collection');

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      showCollectionModal();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideCollectionModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      createCollection();
    });
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        hideCollectionModal();
      }
    });
  }

  // Collection item clicks
  document.addEventListener('click', e => {
    const collectionItem = e.target.closest('.collection-item');
    if (collectionItem) {
      const collectionId = collectionItem.dataset.collectionId;
      openCollectionInGlean(collectionId);
    }
  });
}

// Show create collection modal
function showCollectionModal() {
  const modal = document.getElementById('collection-modal');
  const nameInput = document.getElementById('collection-name');
  const descInput = document.getElementById('collection-description');
  const publicCheckbox = document.getElementById('collection-public');

  // Reset form
  nameInput.value = '';
  descInput.value = '';
  publicCheckbox.checked = true;

  modal.classList.add('active');
  nameInput.focus();
}

// Hide create collection modal
function hideCollectionModal() {
  const modal = document.getElementById('collection-modal');
  modal.classList.remove('active');
}

// Create new collection
async function createCollection() {
  console.log('Starting collection creation...');

  const nameInput = document.getElementById('collection-name');
  const descInput = document.getElementById('collection-description');
  const publicCheckbox = document.getElementById('collection-public');

  const name = nameInput.value.trim();
  console.log('Collection name:', name);

  if (!name) {
    console.log('❌ No collection name provided');
    alert('Please enter a collection name');
    nameInput.focus();
    return;
  }

  if (!collectionsAPI) {
    console.log('❌ Collections API not available');
    alert('Collections API not available. Please check your Glean connection.');
    return;
  }

  console.log('Collections API available:', !!collectionsAPI);
  console.log('Collections API config:', {
    enabled: collectionsAPI.config?.enabled,
    domain: collectionsAPI.config?.domain,
    hasToken: !!collectionsAPI.config?.apiToken,
  });

  try {
    const saveBtn = document.getElementById('save-collection');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Creating...';

    const collectionData = {
      name: name,
      description: descInput.value.trim(),
      isPublic: publicCheckbox.checked,
    };

    console.log('📦 Creating collection with data:', collectionData);

    const newCollection = await collectionsAPI.createCollection(collectionData);
    console.log('✅ Collection created successfully:', newCollection);

    // Add to local collections array
    collections.push(newCollection);

    // Collections tab removed - no need to render
    // Collections are still available in Settings dropdown

    // Hide modal
    hideCollectionModal();

    // Show success message
    showTemporaryMessage('Collection created successfully!');
  } catch (error) {
    console.error('❌ Failed to create collection:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    alert('Failed to create collection: ' + error.message);
  } finally {
    const saveBtn = document.getElementById('save-collection');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Create Collection';
  }
}

// Open collection in Glean
function openCollectionInGlean(collectionId) {
  if (!collectionsAPI) {return;}

  const collection = collections.find(c => c.id === collectionId);
  if (!collection) {return;}

  // Construct Glean collection URL
  const baseUrl = collectionsAPI.baseUrl.replace('-be.glean.com', '.glean.com');
  const collectionUrl = `${baseUrl}/collections/${collectionId}`;

  if (isChromeExtension()) {
    chrome.tabs.create({ url: collectionUrl });
    window.close();
  } else {
    window.open(collectionUrl, '_blank');
  }
}

// Show temporary message
function showTemporaryMessage(message) {
  // Create a temporary toast message
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Helper: Add clip to collection (via background script)
async function addClipToCollection(collectionId, clip) {
  if (!isChromeExtension()) {
    console.log('Collections not available in standalone mode');
    return;
  }

  try {
    const response = await safeRuntimeSendMessage({
      action: 'addToCollection',
      collectionId: collectionId,
      clip: clip,
    });

    if (response && response.success) {
      showTemporaryMessage('Clip added to collection!');
    } else {
      throw new Error(response?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Failed to add clip to collection:', error);
    showTemporaryMessage('Failed to add clip to collection');
  }
}

// Open notebook viewer
function openNotebook() {
  if (isChromeExtension()) {
    // In extension context, open notebook in new tab
    if (chrome.tabs && chrome.tabs.create) {
      const notebookUrl = chrome.runtime.getURL('notebook-viewer.html');
      chrome.tabs.create({ url: notebookUrl });
      window.close(); // Close popup after opening notebook
    } else {
      console.error('Chrome tabs API not available');
      alert('Could not open notebook - Chrome tabs API not available');
    }
  } else {
    // In standalone mode, open in new window/tab
    const notebookUrl = 'notebook-viewer.html';
    window.open(notebookUrl, '_blank');
  }
}

// OAuth Authentication
async function handleOAuthLogin() {
  if (!isChromeExtension()) {
    alert('OAuth authentication only works when extension is installed');
    return;
  }

  try {
    // Get domain from config
    const result = await chrome.storage.local.get(['gleanConfig']);
    const domain = result.gleanConfig?.domain || 'app.glean.com';
    
    // Clean domain (remove protocol and -be suffix if present)
    let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (cleanDomain.includes('-be.')) {
      cleanDomain = cleanDomain.replace('-be.', '.');
    }
    
    // Open Glean's token management page
    const tokenPageUrl = `https://${cleanDomain}/admin/platform/tokenManagement?tab=client`;
    
    chrome.tabs.create({ url: tokenPageUrl });
    
    // Show manual token input and instructions
    const tokenInputGroup = getElement('token-input-group');
    const tokenInput = getElement('glean-client-token');
    
    if (tokenInputGroup) {
      tokenInputGroup.style.display = 'block';
    }
    if (tokenInput) {
      tokenInput.focus();
    }
    
    // Show helpful message
    alert(`📋 Opened Glean token management page!\n\nSteps:\n1. Create a new Client API token\n2. Copy the token\n3. Paste it in the field below\n4. Click "Save Settings"`);
  } catch (error) {
    console.error('Failed to open OAuth page:', error);
    alert('Failed to open token page. Please navigate manually to: Glean Admin → API Tokens → Client API tokens');
  }
}

// Toggle manual token input
let manualTokenVisible = false;
function toggleManualToken() {
  const toggleBtn = getElement('manual-token-toggle');
  const tokenGroup = getElement('token-input-group');
  const oauthStatus = getElement('oauth-status');
  
  if (!toggleBtn || !tokenGroup) return;
  
  manualTokenVisible = !manualTokenVisible;
  
  if (manualTokenVisible) {
    tokenGroup.style.display = 'block';
    if (oauthStatus) oauthStatus.style.display = 'none';
    toggleBtn.textContent = 'Hide';
  } else {
    tokenGroup.style.display = 'none';
    toggleBtn.textContent = 'Manual';
  }
}

// Handle quick clip button click
async function handleQuickClip() {
  if (!isChromeExtension()) {
    alert('Quick clip only works when extension is installed');
    return;
  }

  const quickClipBtn = getElement('quick-clip-btn');
  if (!quickClipBtn) return;

  const originalText = quickClipBtn.textContent;
  quickClipBtn.disabled = true;
  quickClipBtn.textContent = 'Clipping...';

  try {
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }

    const tab = tabs[0];

    // Inject script to clip the page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: clipCurrentPageForQuickClip,
    });

    // Show success feedback
    quickClipBtn.textContent = '✓ Clipped!';
    quickClipBtn.style.background = '#10b981';
    
    // Reload clips to show the new one
    setTimeout(async () => {
      await loadClips();
      quickClipBtn.textContent = originalText;
      quickClipBtn.style.background = '';
      quickClipBtn.disabled = false;
    }, 1000);
  } catch (error) {
    console.error('Quick clip failed:', error);
    quickClipBtn.textContent = 'Failed';
    quickClipBtn.style.background = '#ef4444';
    setTimeout(() => {
      quickClipBtn.textContent = originalText;
      quickClipBtn.style.background = '';
      quickClipBtn.disabled = false;
    }, 2000);
  }
}

// Function to inject for quick clip (runs in page context)
function clipCurrentPageForQuickClip() {
  function showClipFeedback(message, type = 'success') {
    // Remove any existing feedback
    const existing = document.getElementById('glean-clip-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'glean-clip-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: ${type === 'error' ? '#EF4444' : '#10B981'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: gleanSlideIn 0.3s ease;
      pointer-events: none;
    `;

    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Add animation styles if not already present
    if (!document.getElementById('glean-clip-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'glean-clip-feedback-styles';
      style.textContent = `
        @keyframes gleanSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes gleanSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      feedback.style.animation = 'gleanSlideOut 0.3s ease forwards';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }

  const mainContent = document.querySelector('main, article, .content, #content') || document.body;
  const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  let favicon = '';
  if (faviconLink && faviconLink.href) {
    if (faviconLink.href.startsWith('/')) {
      favicon = window.location.origin + faviconLink.href;
    } else if (!faviconLink.href.startsWith('http')) {
      favicon = window.location.origin + '/' + faviconLink.href;
    } else {
      favicon = faviconLink.href;
    }
  } else {
    favicon = `https://www.google.com/s2/favicons?domain=${window.location.hostname}&sz=16`;
  }
  
  const heading = document.querySelector('h1, h2, .headline, .title, article h1')?.textContent?.trim() || document.title;
  const firstParagraph = document.querySelector('article p, .content p, main p')?.textContent?.trim() || '';
  
  let cleanedText = '';
  if (heading && firstParagraph) {
    cleanedText = `${heading}\n\n${firstParagraph.substring(0, 500)}`;
  } else {
    cleanedText = mainContent.textContent?.trim().substring(0, 1000) || '';
  }
  
  chrome.runtime.sendMessage({
    action: 'saveClip',
    data: {
      url: window.location.href,
      title: document.title,
      selectedText: cleanedText,
      context: 'Full page clip',
      timestamp: new Date().toISOString(),
      domain: window.location.hostname,
      favicon: favicon,
    },
  }, (response) => {
    if (chrome.runtime.lastError) {
      showClipFeedback('Failed to clip: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    if (response && response.success) {
      showClipFeedback('✓ Clipped to Glean!');
    } else if (response && response.error) {
      showClipFeedback('Failed: ' + response.error, 'error');
    } else {
      showClipFeedback('✓ Clipped to Glean!');
    }
  });
}
