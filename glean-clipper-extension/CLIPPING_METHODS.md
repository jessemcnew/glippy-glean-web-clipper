# Clipping Methods - Modern Workflow

## Overview

The extension now supports multiple modern clipping methods, with keyboard shortcuts as the primary workflow.

## Clipping Methods

### 1. Keyboard Shortcuts (Recommended) ⭐

**Primary Method** - Fast, modern, non-intrusive

- **`Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)**: 
  - If text is selected → Clips the selected text
  - If no text selected → Clips the entire page
- **`Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows/Linux)**: 
  - Always clips the entire page

**Why it's better:**
- No UI interruption
- Works from anywhere on the page
- Fast and efficient
- Standard workflow (similar to Notion, Obsidian, etc.)

### 2. Quick Clip Button in Popup

**Secondary Method** - Visual, accessible

- Click extension icon → Opens popup
- Click "Clip Current Page" button at top of Clips tab
- Instantly clips the current page

**Why it's useful:**
- Visual feedback
- Good for users who prefer clicking
- Shows keyboard shortcut hint

### 3. Context Menu (Right-Click)

**Tertiary Method** - Traditional, always available

- Right-click on selected text → "Clip to Glean Collection"
- Right-click anywhere on page → "Clip entire page"

**Why it's useful:**
- Familiar workflow
- Always accessible
- Works when keyboard shortcuts might conflict

### 4. Floating Button (Optional/Less Intrusive)

**Legacy Method** - Now optional and less intrusive

- Only appears when:
  - User holds a modifier key (Shift, Alt, Ctrl/Cmd) while selecting text, OR
  - Enabled in settings (future enhancement)
- Default: **Disabled** (less intrusive)

**Why it's optional:**
- Can interfere with normal text selection
- Positioning can be janky
- Keyboard shortcuts are more modern

## Recommended Workflow

1. **Primary**: Use `Cmd/Ctrl+K` for quick clipping
2. **Secondary**: Use popup "Clip Current Page" button for visual feedback
3. **Fallback**: Use context menu if keyboard shortcuts conflict

## Settings

Future enhancement: Add toggle in settings to enable/disable floating button for users who prefer it.

## Keyboard Shortcut Customization

Users can customize keyboard shortcuts in Chrome:
1. Go to `chrome://extensions/shortcuts`
2. Find "Glean Web Clipper"
3. Customize the shortcuts as desired

## Technical Details

- Keyboard shortcuts use Chrome's `commands` API
- Functions are injected into page context for security
- All methods use the same clip saving logic
- Clips are automatically synced to Glean (if configured)
