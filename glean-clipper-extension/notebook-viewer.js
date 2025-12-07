// Global variables
let allClips = [];
let filteredClips = [];
let currentTheme = 'light';

// Safe messaging wrapper for notebook viewer
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

// DOM elements
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const tagFilter = document.getElementById('tagFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const clipsContainer = document.getElementById('clipsContainer');
const statsSection = document.getElementById('statsSection');
const clipCount = document.getElementById('clipCount');
const lastUpdated = document.getElementById('lastUpdated');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const themeToggle = document.getElementById('themeToggle');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✨ INIT: Starting notebook viewer initialization');

  // Initialize theme (check for saved preference or default to light)
  const savedTheme = localStorage.getItem('notebook-theme') || 'light';
  currentTheme = savedTheme;
  if (currentTheme === 'dark') {
    document.body.classList.add('dark');
  }
  updateThemeIcon();

  loadingIndicator.classList.add('active');
  await loadClips();
  setupEventListeners();
  loadingIndicator.classList.remove('active');

  console.log('✅ INIT: Notebook viewer initialized successfully');
});

// Load clips from Chrome storage
async function loadClips() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['clips']);
      allClips = result.clips || [];
      console.log('📁 CLIPS: Loaded', allClips.length, 'clips from storage');
    } else {
      // Fallback for testing outside extension context
      allClips = generateMockClips();
      console.log('🧪 CLIPS: Using', allClips.length, 'mock clips for testing');
    }

    filteredClips = [...allClips];
    updateTagFilter();
    updateClipCount();
    filterAndRender();
  } catch (error) {
    console.error('❌ CLIPS: Error loading clips:', error);
    // Use mock data if storage fails
    allClips = generateMockClips();
    filteredClips = [...allClips];
    updateTagFilter();
    updateClipCount();
    filterAndRender();
  }
}

// Generate mock clips for demo/testing
function generateMockClips() {
  return [
    {
      id: '1',
      title: 'Advanced React Patterns - Component Composition',
      selectedText:
        'Component composition is a powerful pattern in React that allows you to build complex UIs from simple components...',
      url: 'https://kentcdodds.com/blog/advanced-react-patterns',
      domain: 'kentcdodds.com',
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      tags: ['react', 'frontend', 'patterns'],
      category: 'code',
      synced: true,
      images: ['https://kentcdodds.com/static/og-image.jpg'],
    },
    {
      id: '2',
      title: 'TypeScript Best Practices for Large Applications',
      selectedText:
        'When building large TypeScript applications, following these best practices can save you hours of debugging...',
      url: 'https://typescript-eslint.io/rules/',
      domain: 'typescript-eslint.io',
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      tags: ['typescript', 'best-practices', 'backend'],
      category: 'documentation',
      synced: false,
      syncError: 'Connection timeout',
    },
    {
      id: '3',
      title: 'Design System Guidelines - Building Consistent UIs',
      selectedText:
        'A comprehensive guide to building and maintaining design systems that scale across multiple product teams...',
      url: 'https://design-system.service.gov.uk/components/',
      domain: 'design-system.service.gov.uk',
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      tags: ['design', 'ui', 'design-system'],
      category: 'design',
      synced: true,
    },
  ];
}

// Setup event listeners
function setupEventListeners() {
  if (searchInput) {searchInput.addEventListener('input', handleSearch);}
  if (sortSelect) {sortSelect.addEventListener('change', handleSort);}
  if (tagFilter) {tagFilter.addEventListener('change', handleTagFilter);}
  if (clearFiltersBtn) {clearFiltersBtn.addEventListener('click', clearFilters);}
  if (themeToggle) {themeToggle.addEventListener('click', toggleTheme);}

  // Listen for storage changes
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.clips) {
        allClips = changes.clips.newValue || [];
        filteredClips = [...allClips];
        updateTagFilter();
        updateClipCount();
        filterAndRender();
      }
    });
  }
}

// Search functionality with debouncing
let searchTimeout;
function handleSearch() {
  const query = searchInput?.value?.trim() || '';

  console.log('🔎 SEARCH: User typed:', query);

  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Debounce the search to avoid too many API calls
  searchTimeout = setTimeout(async () => {
    await performSearch(query);
  }, 500); // Increased debounce time
}

async function performSearch(query) {
  console.log('🔎 SEARCH: Performing search for query:', query);

  // Show loading state
  showSearchStatus('loading', `Searching Glean for "${query}"...`);

  // Always clear any previous search results from Glean first
  const originalClips = allClips.filter(clip => !clip.id.startsWith('search-glean-'));

  // Only search Glean if we have a meaningful query (at least 2 characters)
  if (query && query.length >= 2) {
    try {
      console.log('SEARCH: Searching Glean for:', query);
      const gleanResults = await searchGlean(query);

      if (gleanResults && gleanResults.length > 0) {
        // Add Glean results with unique IDs
        const gleanClips = gleanResults.map(result => ({
          id: `search-glean-${result.id}`,
          title: result.title || 'Untitled',
          selectedText: result.snippet || '',
          url: result.url || '#',
          domain: 'app.glean.com',
          timestamp: result.date ? new Date(result.date).getTime() : Date.now(),
          tags: ['glean-search'],
          category: result.type || 'document',
          isGleanResult: true,
          score: result.score || 0,
        }));

        console.log('🎯 SEARCH: Adding', gleanClips.length, 'Glean results');
        allClips = [...originalClips, ...gleanClips];

        // Show success status
        showSearchStatus('success', `Found ${gleanClips.length} results from Glean`);
      } else {
        console.log('SEARCH: No Glean results found');
        allClips = originalClips;

        // Show no results status
        if (originalClips.length === 0) {
          showSearchStatus('warning', `No results found for "${query}"`);
        } else {
          showSearchStatus(
            'warning',
            `No Glean results for "${query}", showing ${originalClips.length} local clips`
          );
        }
      }
    } catch (error) {
      console.error('❌ SEARCH: Error searching Glean:', error);
      allClips = originalClips;

      // Show error status
      showSearchStatus(
        'warning',
        `Glean search unavailable, showing ${originalClips.length} local clips`
      );
    }
  } else {
    console.log('🧹 SEARCH: Query too short or empty, using original clips only');
    allClips = originalClips;
    hideSearchStatus();
  }

  filterAndRender();
  updateClipCount();
}

// Show search status messages
function showSearchStatus(type, message) {
  // Remove any existing status
  const existingStatus = document.querySelector('.search-status');
  if (existingStatus) {
    existingStatus.remove();
  }

  // Create new status element
  const statusEl = document.createElement('div');
  statusEl.className = `search-status ${type}-status`;

  const iconSvg = getStatusIcon(type);

  statusEl.innerHTML = `
    <div class="status-message">
      ${iconSvg}
      ${message}
    </div>
  `;

  // Insert before clips container
  clipsContainer.parentNode.insertBefore(statusEl, clipsContainer);

  // Auto-hide success/loading messages after 3 seconds
  if (type === 'success' || type === 'loading') {
    setTimeout(() => {
      if (statusEl.parentNode) {
        statusEl.remove();
      }
    }, 3000);
  }
}

// Hide search status
function hideSearchStatus() {
  const existingStatus = document.querySelector('.search-status');
  if (existingStatus) {
    existingStatus.remove();
  }
}

// Get status icon SVG
function getStatusIcon(type) {
  switch (type) {
    case 'loading':
      return '<svg class="status-icon animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="32" stroke-dashoffset="32"><animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/></circle></svg>';
    case 'success':
      return '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    case 'warning':
      return '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>';
    default:
      return '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
  }
}

// Sort functionality
function handleSort() {
  filterAndRender();
}

// Tag filter
function handleTagFilter() {
  filterAndRender();
}

// Clear all filters
function clearFilters() {
  if (searchInput) {searchInput.value = '';}
  if (sortSelect) {sortSelect.value = 'date';}
  if (tagFilter) {tagFilter.value = '';}

  // Clear any search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }

  // Remove any Glean search results
  allClips = allClips.filter(clip => !clip.id.startsWith('search-glean-'));
  console.log('🧹 CLEAR: Cleared all filters and search results');

  filterAndRender();
}

// Filter and render clips
function filterAndRender() {
  const searchQuery = searchInput?.value?.toLowerCase() || '';
  const selectedTag = tagFilter?.value || '';

  console.log('📂 FILTER: Filtering with query:', searchQuery, 'tag:', selectedTag);

  // If search is empty, clear any search-based clips from Glean
  if (!searchQuery) {
    allClips = allClips.filter(clip => !clip.id.startsWith('search-glean-'));
    console.log('🧹 FILTER: Cleared search results, now have', allClips.length, 'clips');
  }

  // Filter clips
  filteredClips = allClips.filter(clip => {
    const matchesSearch =
      !searchQuery ||
      (clip.title && clip.title.toLowerCase().includes(searchQuery)) ||
      (clip.selectedText && clip.selectedText.toLowerCase().includes(searchQuery)) ||
      (clip.domain && clip.domain.toLowerCase().includes(searchQuery)) ||
      (clip.tags && clip.tags.some(tag => tag && tag.toLowerCase().includes(searchQuery)));

    const matchesTag = !selectedTag || (clip.tags && clip.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  console.log('🎯 FILTER: Filtered to', filteredClips.length, 'clips');

  // Sort clips
  const sortBy = sortSelect?.value || 'date';
  filteredClips.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const aTime = typeof a.timestamp === 'number' ? a.timestamp : Date.now();
        const bTime = typeof b.timestamp === 'number' ? b.timestamp : Date.now();
        return bTime - aTime; // Newest first
      case 'date-asc':
        const aTimeAsc = typeof a.timestamp === 'number' ? a.timestamp : Date.now();
        const bTimeAsc = typeof b.timestamp === 'number' ? b.timestamp : Date.now();
        return aTimeAsc - bTimeAsc; // Oldest first
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'domain':
        return (a.domain || '').localeCompare(b.domain || '');
      case 'relevance':
      default:
        // Simple relevance based on search query match
        if (!searchQuery) {
          const aTimeDefault = typeof a.timestamp === 'number' ? a.timestamp : Date.now();
          const bTimeDefault = typeof b.timestamp === 'number' ? b.timestamp : Date.now();
          return bTimeDefault - aTimeDefault;
        }
        const aRelevance = getRelevanceScore(a, searchQuery);
        const bRelevance = getRelevanceScore(b, searchQuery);
        return bRelevance - aRelevance;
    }
  });

  renderClips();
  updateClipCount();
}

// Render clips to DOM with enhanced Glean search results display
function renderClips() {
  const query = searchInput?.value?.trim() || '';
  const localClips = filteredClips.filter(clip => !clip.id.startsWith('search-glean-'));
  const gleanClips = filteredClips.filter(clip => clip.id.startsWith('search-glean-'));

  if (filteredClips.length === 0) {
    clipsContainer.style.display = 'none';
    emptyState.style.display = 'block';
    statsSection.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  clipsContainer.style.display = 'block';

  // Create sections for different types of results
  let sectionsHtml = '';

  // Show Glean results first if we have a search query
  if (query && gleanClips.length > 0) {
    sectionsHtml += `
      <div class="results-section glean-results">
        <div class="section-header">
          <div class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" style="fill: #4F46E5;">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h2>Global Glean Results</h2>
            <span class="result-count">${gleanClips.length} found</span>
          </div>
          <div class="section-description">Results from your organization's knowledge base</div>
        </div>
        <div class="clips-grid">
          ${renderClipCards(gleanClips, true)}
        </div>
      </div>
    `;
  }

  // Show local clips
  if (localClips.length > 0) {
    sectionsHtml += `
      <div class="results-section local-results">
        <div class="section-header">
          <div class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" style="fill: #059669;">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h2>${query ? 'Your Clipped Content' : 'Your Clips'}</h2>
            <span class="result-count">${localClips.length} ${query ? 'matching' : 'total'}</span>
          </div>
          <div class="section-description">${query ? 'From your saved clips and notes' : "Content you've clipped and saved"}</div>
        </div>
        <div class="clips-grid">
          ${renderClipCards(localClips, false)}
        </div>
      </div>
    `;
  }

  // Show no results message if searching but no Glean results
  if (query && gleanClips.length === 0 && localClips.length === 0) {
    sectionsHtml = `
      <div class="no-results">
        <svg class="no-results-icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
        <h3>No results found for "${escapeHtml(query)}"</h3>
        <p>Try a different search term or check your Glean connection.</p>
      </div>
    `;
  } else if (query && gleanClips.length === 0 && localClips.length > 0) {
    // Show message about no Glean results but local results found
    sectionsHtml = `
      <div class="search-status">
        <div class="status-message">
          <svg class="status-icon" viewBox="0 0 24 24" style="fill: #F59E0B;">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12" y2="17"></line>
          </svg>
          No Glean results found for "${escapeHtml(query)}", but found matches in your clips
        </div>
      </div>
      ${sectionsHtml}
    `;
  }

  clipsContainer.innerHTML = sectionsHtml;
  statsSection.style.display = 'flex';

  // Add click event listeners to clip cards
  clipsContainer.querySelectorAll('.clip-card').forEach(card => {
    card.addEventListener('click', () => {
      const url = card.dataset.clipUrl;
      openClip(url);
    });
  });
}

// Helper function to render clip cards
function renderClipCards(clips, isGleanResult = false) {
  return clips
    .map(clip => {
      const escapedUrl = escapeHtml(clip.url);
      const escapedTitle = escapeHtml(clip.title);
      const escapedDomain = escapeHtml(clip.domain);
      const escapedText = escapeHtml(clip.selectedText);
      const cardClass = isGleanResult ? 'clip-card glean-card' : 'clip-card local-card';

      return `
      <div class="${cardClass}" data-clip-id="${clip.id}" data-clip-url="${escapedUrl}">
        <div class="clip-header">
          <div class="clip-favicon"></div>
          <div class="clip-title-section">
            <div class="clip-title">${escapedTitle}</div>
            <div class="clip-domain">${escapedDomain}${isGleanResult && clip.score ? ` • ${Math.round(clip.score * 100)}% match` : ''}</div>
          </div>
        </div>
        
        <div class="clip-text">${escapedText}</div>
        
        ${
          clip.images && clip.images.length > 0
            ? `
          <div class="clip-images">
            ${clip.images
              .slice(0, 3)
              .map(img => `<img src="${escapeHtml(img)}" class="clip-image" loading="lazy" />`)
              .join('')}
            ${clip.images.length > 3 ? `<div class="clip-image-count">+${clip.images.length - 3}</div>` : ''}
          </div>
        `
            : ''
        }
        
        <div class="clip-meta">
          <div class="clip-tags">
            ${(clip.tags || []).map(tag => `<span class="clip-tag${isGleanResult ? ' glean-tag' : ''}">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <div class="clip-date">
            <svg class="icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            ${formatDate(clip.timestamp)}
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// Update tag filter options
function updateTagFilter() {
  const allTags = [...new Set(allClips.flatMap(clip => clip.tags || []))];
  allTags.sort();

  const currentValue = tagFilter.value;
  tagFilter.innerHTML = '<option value="">All tags</option>';

  allTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    if (tag === currentValue) {option.selected = true;}
    tagFilter.appendChild(option);
  });
}

// Calculate relevance score for sorting
function getRelevanceScore(clip, query) {
  if (!query) {return 0;}

  let score = 0;
  const lowerQuery = query.toLowerCase();
  const lowerTitle = (clip.title || '').toLowerCase();
  const lowerContent = (clip.selectedText || '').toLowerCase();
  const lowerDomain = (clip.domain || '').toLowerCase();

  // Title matches get highest score
  if (lowerTitle.includes(lowerQuery)) {
    score += 10;
    if (lowerTitle.startsWith(lowerQuery)) {score += 5;}
  }

  // Content matches
  if (lowerContent.includes(lowerQuery)) {
    score += 5;
  }

  // Domain matches
  if (lowerDomain.includes(lowerQuery)) {
    score += 3;
  }

  // Tag matches
  if (clip.tags && Array.isArray(clip.tags)) {
    clip.tags.forEach(tag => {
      if ((tag || '').toLowerCase().includes(lowerQuery)) {
        score += 7;
      }
    });
  }

  // Glean results with explicit scores
  if (clip.isGleanResult && clip.score) {
    score += clip.score * 2; // Boost Glean relevance
  }

  return score;
}

// Update clip count display
function updateClipCount() {
  const count = allClips.length;
  const filteredCount = filteredClips.length;

  if (filteredCount === count) {
    clipCount.textContent = `${count} clip${count !== 1 ? 's' : ''} saved`;
  } else {
    clipCount.textContent = `${filteredCount} of ${count} clips`;
  }

  // Update last updated
  if (allClips.length > 0) {
    const latestClip = allClips.reduce((latest, clip) =>
      clip.timestamp > latest.timestamp ? clip : latest
    );
    lastUpdated.textContent = formatDate(latestClip.timestamp);
  } else {
    lastUpdated.textContent = 'Never';
  }
}

// Open clip URL
function openClip(url) {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      // Force open in new tab/window for standalone testing
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // Fallback if popup blocked
        location.href = url;
      }
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
    // Ultimate fallback
    location.href = url;
  }
}

// Update theme icon based on current theme
function updateThemeIcon() {
  const icon = themeToggle?.querySelector('.icon');
  if (icon) {
    if (currentTheme === 'dark') {
      // Show sun icon (clicking will switch to light mode)
      icon.innerHTML = '<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    } else {
      // Show moon icon (clicking will switch to dark mode)
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>';
    }
  }
}

// Toggle theme
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark', currentTheme === 'dark');
  
  // Save theme preference
  localStorage.setItem('notebook-theme', currentTheme);
  
  // Update icon
  updateThemeIcon();
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

// Search Glean API using the correct Client API
// Reference: https://developers.glean.com/api-info/client/authentication/oauth
async function searchGlean(query, config) {
  if (!query || query.trim() === '') {
    // Don't search Glean with empty queries
    return [];
  }

  try {
    // Get config from storage if not provided
    let gleanConfig = config;
    if (!gleanConfig) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['gleanConfig']);
        gleanConfig = result.gleanConfig || {};
      } else {
        console.warn('GLEAN SEARCH: No config available and Chrome storage not accessible');
        return [];
      }
    }

    if (!gleanConfig.enabled || !gleanConfig.domain || !gleanConfig.clientToken) {
      console.warn('GLEAN SEARCH: Config incomplete', {
        enabled: gleanConfig.enabled,
        hasDomain: !!gleanConfig.domain,
        hasToken: !!gleanConfig.clientToken,
      });
      return [];
    }

    console.log('GLEAN SEARCH: Searching for:', query);

    // Import fetch helpers dynamically (since this is a standalone file)
    // For now, we'll use inline fetch with proper headers
    const { normalizeDomain, createCollectionsAPIHeaders, fetchJSON } = await import('../modules/apiFetch.js');

    // Normalize domain and construct search URL
    const baseUrl = normalizeDomain(gleanConfig.domain);
    const searchUrl = `${baseUrl}/rest/api/v1/search`;

    const requestBody = {
      query: query.trim(),
      pageSize: 10,
      maxSnippetSize: 200,
    };

    console.log('GLEAN SEARCH: Making request to:', searchUrl);
    console.log('📦 GLEAN SEARCH: Request body:', requestBody);

    // Create headers with OAuth auth type
    const tokenType = gleanConfig.tokenType || 'glean-issued';
    const headers = createCollectionsAPIHeaders(gleanConfig.clientToken, {}, tokenType);

    const data = await fetchJSON(
      searchUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        mode: 'cors',
        credentials: 'omit',
      },
      { gleanConfig }
    );

    console.log('✅ GLEAN SEARCH: Received response with', data.results?.length || 0, 'results');

    // Handle the response structure from Glean Client API
    if (data.results && Array.isArray(data.results)) {
      const mappedResults = data.results
        .filter(result => result.url && result.title) // Only include results with valid URLs and titles
        .map(result => ({
          id:
            result.document?.id || result.id || `glean-${Math.random().toString(36).substr(2, 9)}`,
          title: result.title || result.document?.title || 'Untitled Document',
          snippet:
            result.snippets?.[0]?.snippet || result.document?.summary || result.snippet || '',
          url: result.url || result.document?.url,
          type: result.document?.documentType || result.type || 'document',
          date: result.document?.updatedAt || result.document?.createdAt,
          score: result.score || 0,
        }));

      console.log('🎯 GLEAN SEARCH: Mapped', mappedResults.length, 'results');
      return mappedResults;
    } else {
      console.warn('GLEAN SEARCH: No results in response');
      return [];
    }
  } catch (error) {
    console.error('❌ GLEAN SEARCH: Error searching Glean:', error);
    return [];
  }
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
