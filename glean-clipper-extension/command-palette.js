// Command Palette for Glippy - Chrome Extension
// Inspired by macOS Spotlight, VS Code, and Raycast

let commandPalette = null;
let commandPaletteStylesInjected = false;
let selectedCommandIndex = 0;
let filteredCommands = [];

// Command definitions
const commands = [
  // Quick Actions
  { id: 'clip-selection', label: 'Clip Selection', category: 'Quick Actions', icon: 'zap' },
  { id: 'save-url', label: 'Save URL', category: 'Quick Actions', icon: 'link', shortcut: '⌘⌥0' },
  { id: 'capture-page', label: 'Capture Page', category: 'Quick Actions', icon: 'file-text' },

  // Navigation
  { id: 'recent-clips', label: 'Recent Clips', category: 'Navigation', icon: 'clock', shortcut: '⌥1' },
  { id: 'library', label: 'Library', category: 'Navigation', icon: 'library' },
  { id: 'prompts', label: 'Prompts', category: 'Navigation', icon: 'sparkles' },

  // Capture
  { id: 'capture-area', label: 'Capture Area', category: 'Capture', icon: 'crop', shortcut: '⌥2' },
  { id: 'capture-visible', label: 'Capture Visible', category: 'Capture', icon: 'monitor', shortcut: '⌥3' },
  { id: 'capture-full-page', label: 'Capture Full Page', category: 'Capture', icon: 'maximize', shortcut: '⌥4' },

  // Settings
  { id: 'preferences', label: 'Preferences', category: 'Settings', icon: 'settings' },
  { id: 'configuration', label: 'Configuration', category: 'Settings', icon: 'sliders' },
];

// Icon SVGs (minimal, 16x16)
const iconSVGs = {
  zap: '<path d="M13 2L3 14h6l-1 6 10-12h-6l1-6z" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.08-7.08l-1.75 1.75M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.08 7.08L13.25 18" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  clock: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  sparkles: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14 M2 6h14a2 2 0 0 1 2 2v14" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 21h8 M12 17v4" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  settings: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="10" x2="4" y2="3" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="21" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="3" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="21" x2="20" y2="16" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="12" x2="20" y2="3" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="10" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="20" cy="14" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  search: '<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5"/>'
};

// Inject command palette styles
function injectCommandPaletteStyles() {
  if (commandPaletteStylesInjected) return;

  const style = document.createElement('style');
  style.id = 'glippy-command-palette-styles';
  style.textContent = `
    .glippy-command-palette-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      padding-left: 16px;
      padding-right: 16px;
    }

    .glippy-command-palette-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }

    .glippy-command-palette {
      position: relative;
      width: 100%;
      max-width: 640px;
      background: #0f0f11;
      border: 1px solid #1f2937;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      animation: glippy-palette-enter 0.2s ease-out;
    }

    @keyframes glippy-palette-enter {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .glippy-command-palette-search {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #1f2937;
    }

    .glippy-command-palette-search-icon {
      width: 20px;
      height: 20px;
      color: #6b7280;
      flex-shrink: 0;
    }

    .glippy-command-palette-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 16px;
      color: #e5e7eb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .glippy-command-palette-input::placeholder {
      color: #6b7280;
    }

    .glippy-command-palette-close {
      width: 20px;
      height: 20px;
      color: #6b7280;
      cursor: pointer;
      transition: color 0.15s;
      background: none;
      border: none;
      padding: 0;
    }

    .glippy-command-palette-close:hover {
      color: #9ca3af;
    }

    .glippy-command-palette-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .glippy-command-palette-list::-webkit-scrollbar {
      width: 6px;
    }

    .glippy-command-palette-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .glippy-command-palette-list::-webkit-scrollbar-thumb {
      background: #1f2937;
      border-radius: 3px;
    }

    .glippy-command-palette-category {
      padding: 8px 0;
    }

    .glippy-command-palette-category-header {
      padding: 6px 16px;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .glippy-command-palette-item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s;
      border-left: 2px solid transparent;
      text-align: left;
    }

    .glippy-command-palette-item:hover,
    .glippy-command-palette-item.selected {
      background: rgba(255, 255, 255, 0.05);
      border-left-color: #3b82f6;
    }

    .glippy-command-palette-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .glippy-command-palette-item-icon {
      width: 16px;
      height: 16px;
      color: #6b7280;
      transition: color 0.15s;
    }

    .glippy-command-palette-item.selected .glippy-command-palette-item-icon,
    .glippy-command-palette-item:hover .glippy-command-palette-item-icon {
      color: #3b82f6;
    }

    .glippy-command-palette-item-label {
      font-size: 14px;
      font-weight: 500;
      color: #e5e7eb;
      transition: color 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .glippy-command-palette-item.selected .glippy-command-palette-item-label {
      color: #fff;
    }

    .glippy-command-palette-shortcut {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .glippy-command-palette-shortcut kbd {
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
      background: #1a1a1c;
      border: 1px solid #2a2a2e;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .glippy-command-palette-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-top: 1px solid #1f2937;
      background: #0a0a0c;
    }

    .glippy-command-palette-hints {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 11px;
      color: #6b7280;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .glippy-command-palette-hint {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .glippy-command-palette-hint kbd {
      padding: 2px 6px;
      background: #1a1a1c;
      border: 1px solid #2a2a2e;
      border-radius: 4px;
    }

    .glippy-command-palette-brand {
      font-size: 11px;
      color: #4b5563;
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
    }

    .glippy-command-palette-empty {
      padding: 32px 16px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `;
  document.head.appendChild(style);
  commandPaletteStylesInjected = true;
}

// Create icon element
function createIcon(iconName) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('class', 'glippy-command-palette-item-icon');
  svg.innerHTML = iconSVGs[iconName] || '';
  return svg;
}

// Fuzzy search filter
function filterCommands(query) {
  if (!query.trim()) return [...commands];

  const searchLower = query.toLowerCase().replace(/\s+/g, '');

  return commands.filter(cmd => {
    const labelLower = cmd.label.toLowerCase().replace(/\s+/g, '');
    const categoryLower = cmd.category.toLowerCase().replace(/\s+/g, '');

    // Simple fuzzy matching
    let searchIndex = 0;
    for (let i = 0; i < labelLower.length && searchIndex < searchLower.length; i++) {
      if (labelLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }

    return searchIndex === searchLower.length ||
           categoryLower.includes(searchLower) ||
           labelLower.includes(searchLower);
  });
}

// Group commands by category
function groupCommands(cmds) {
  const groups = {};
  cmds.forEach(cmd => {
    if (!groups[cmd.category]) {
      groups[cmd.category] = [];
    }
    groups[cmd.category].push(cmd);
  });
  return groups;
}

// Render command list
function renderCommandList(container) {
  container.innerHTML = '';

  const grouped = groupCommands(filteredCommands);

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = '<div class="glippy-command-palette-empty">No commands found</div>';
    return;
  }

  let globalIndex = 0;

  Object.entries(grouped).forEach(([category, cmds]) => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'glippy-command-palette-category';

    const header = document.createElement('div');
    header.className = 'glippy-command-palette-category-header';
    header.textContent = category;
    categoryDiv.appendChild(header);

    cmds.forEach(cmd => {
      const item = document.createElement('button');
      item.className = 'glippy-command-palette-item';
      item.dataset.index = globalIndex;
      item.dataset.commandId = cmd.id;

      if (globalIndex === selectedCommandIndex) {
        item.classList.add('selected');
      }

      const left = document.createElement('div');
      left.className = 'glippy-command-palette-item-left';
      left.appendChild(createIcon(cmd.icon));

      const label = document.createElement('span');
      label.className = 'glippy-command-palette-item-label';
      label.textContent = cmd.label;
      left.appendChild(label);

      item.appendChild(left);

      if (cmd.shortcut) {
        const shortcutDiv = document.createElement('div');
        shortcutDiv.className = 'glippy-command-palette-shortcut';
        cmd.shortcut.split('').forEach(key => {
          const kbd = document.createElement('kbd');
          kbd.textContent = key;
          shortcutDiv.appendChild(kbd);
        });
        item.appendChild(shortcutDiv);
      }

      item.addEventListener('click', () => executeCommand(cmd.id));
      item.addEventListener('mouseenter', () => {
        selectedCommandIndex = parseInt(item.dataset.index);
        updateSelection(container);
      });

      categoryDiv.appendChild(item);
      globalIndex++;
    });

    container.appendChild(categoryDiv);
  });
}

// Update selection highlight
function updateSelection(container) {
  container.querySelectorAll('.glippy-command-palette-item').forEach(item => {
    if (parseInt(item.dataset.index) === selectedCommandIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// Execute a command
function executeCommand(commandId) {
  hideCommandPalette();

  // Send message to background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'executeCommand', commandId }, (response) => {
      if (chrome.runtime.lastError) {
        console.debug('Command palette message error:', chrome.runtime.lastError.message);
      }
    });
  }

  // Also handle locally for some commands
  switch (commandId) {
    case 'clip-selection':
      handleClip();
      break;
    case 'save-url':
      handleSaveUrl();
      break;
    case 'recent-clips':
    case 'library':
    case 'prompts':
    case 'preferences':
    case 'configuration':
      // These are handled by popup/background
      break;
    case 'capture-area':
    case 'capture-visible':
    case 'capture-full-page':
      showToast('Capture actions coming soon');
      break;
  }
}

// Handle clip selection
function handleClip() {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    // Trigger the existing clip functionality
    const event = new CustomEvent('glippy-clip', { detail: { text: selection.toString() } });
    document.dispatchEvent(event);
  } else {
    showToast('Please select some text first');
  }
}

// Handle save URL
function handleSaveUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'saveClip',
      data: {
        url: window.location.href,
        title: document.title || '',
        selectedText: '',
        domain: window.location.hostname,
        timestamp: Date.now(),
      }
    }, () => {
      if (chrome.runtime.lastError) {
        showToast('Failed to save URL');
      } else {
        showToast('URL saved!');
      }
    });
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000000;
    background: #10B981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: glippy-toast-enter 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'glippy-toast-exit 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Create command palette
function createCommandPalette() {
  if (commandPalette) return commandPalette;

  injectCommandPaletteStyles();

  // Add toast animations
  if (!document.getElementById('glippy-toast-styles')) {
    const toastStyles = document.createElement('style');
    toastStyles.id = 'glippy-toast-styles';
    toastStyles.textContent = `
      @keyframes glippy-toast-enter {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes glippy-toast-exit {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(toastStyles);
  }

  commandPalette = document.createElement('div');
  commandPalette.className = 'glippy-command-palette-overlay';
  commandPalette.style.display = 'none';

  commandPalette.innerHTML = `
    <div class="glippy-command-palette-backdrop"></div>
    <div class="glippy-command-palette">
      <div class="glippy-command-palette-search">
        <svg class="glippy-command-palette-search-icon" viewBox="0 0 24 24" fill="none">
          ${iconSVGs.search}
        </svg>
        <input type="text" class="glippy-command-palette-input" placeholder="Search commands..." autocomplete="off" />
        <button class="glippy-command-palette-close">
          <svg viewBox="0 0 24 24" fill="none">${iconSVGs.x}</svg>
        </button>
      </div>
      <div class="glippy-command-palette-list"></div>
      <div class="glippy-command-palette-footer">
        <div class="glippy-command-palette-hints">
          <span class="glippy-command-palette-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span class="glippy-command-palette-hint"><kbd>↵</kbd> select</span>
          <span class="glippy-command-palette-hint"><kbd>esc</kbd> close</span>
        </div>
        <span class="glippy-command-palette-brand">Glippy</span>
      </div>
    </div>
  `;

  document.body.appendChild(commandPalette);

  // Event listeners
  const backdrop = commandPalette.querySelector('.glippy-command-palette-backdrop');
  const closeBtn = commandPalette.querySelector('.glippy-command-palette-close');
  const input = commandPalette.querySelector('.glippy-command-palette-input');
  const list = commandPalette.querySelector('.glippy-command-palette-list');

  backdrop.addEventListener('click', hideCommandPalette);
  closeBtn.addEventListener('click', hideCommandPalette);

  input.addEventListener('input', () => {
    filteredCommands = filterCommands(input.value);
    selectedCommandIndex = 0;
    renderCommandList(list);
  });

  return commandPalette;
}

// Show command palette
function showCommandPalette() {
  const palette = createCommandPalette();
  const input = palette.querySelector('.glippy-command-palette-input');
  const list = palette.querySelector('.glippy-command-palette-list');

  // Reset state
  input.value = '';
  filteredCommands = [...commands];
  selectedCommandIndex = 0;

  // Render and show
  renderCommandList(list);
  palette.style.display = 'flex';

  // Focus input
  setTimeout(() => input.focus(), 50);
}

// Hide command palette
function hideCommandPalette() {
  if (commandPalette) {
    commandPalette.style.display = 'none';
  }
}

// Toggle command palette
function toggleCommandPalette() {
  if (commandPalette && commandPalette.style.display === 'flex') {
    hideCommandPalette();
  } else {
    showCommandPalette();
  }
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd+K or Ctrl+K to toggle command palette
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    toggleCommandPalette();
    return;
  }

  // If command palette is open, handle navigation
  if (commandPalette && commandPalette.style.display === 'flex') {
    const list = commandPalette.querySelector('.glippy-command-palette-list');

    if (e.key === 'Escape') {
      e.preventDefault();
      hideCommandPalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedCommandIndex = Math.min(selectedCommandIndex + 1, filteredCommands.length - 1);
      updateSelection(list);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
      updateSelection(list);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedCommandIndex]) {
        executeCommand(filteredCommands[selectedCommandIndex].id);
      }
    }
    return;
  }

  // Quick shortcuts (only when command palette is closed)
  // ⌘⌥0 or Ctrl+Alt+0 - Save URL
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === '0') {
    e.preventDefault();
    handleSaveUrl();
    return;
  }

  // ⌥1 or Alt+1 - Recent Clips
  if (e.altKey && !e.metaKey && !e.ctrlKey && e.key === '1') {
    e.preventDefault();
    executeCommand('recent-clips');
    return;
  }

  // ⌥2 or Alt+2 - Capture Area
  if (e.altKey && !e.metaKey && !e.ctrlKey && e.key === '2') {
    e.preventDefault();
    executeCommand('capture-area');
    return;
  }

  // ⌥3 or Alt+3 - Capture Visible
  if (e.altKey && !e.metaKey && !e.ctrlKey && e.key === '3') {
    e.preventDefault();
    executeCommand('capture-visible');
    return;
  }

  // ⌥4 or Alt+4 - Capture Full Page
  if (e.altKey && !e.metaKey && !e.ctrlKey && e.key === '4') {
    e.preventDefault();
    executeCommand('capture-full-page');
    return;
  }
});

// Export for use in content.js
if (typeof window !== 'undefined') {
  window.GlippyCommandPalette = {
    show: showCommandPalette,
    hide: hideCommandPalette,
    toggle: toggleCommandPalette
  };
}
