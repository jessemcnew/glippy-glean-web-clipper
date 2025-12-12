# Glippy - Glean Personal Knowledge Management Extension

## Project Overview

Glippy transforms Glean from a company-wide search platform into a personal knowledge management system. It's a Chrome extension that lets users clip web content directly into searchable Glean collections, with a modern React dashboard for browsing and managing clips.

## Architecture

```
glippy/
├── glean-clipper-extension/   # Chrome extension (vanilla JS, manifest v3)
│   ├── modules/               # JS modules (gleanApi.js, apiFetch.js, etc.)
│   ├── tests/                 # Playwright E2E tests
│   ├── docs/                  # Extension-specific documentation
│   ├── scripts/               # Build/utility scripts
│   ├── archive/               # Obsolete files (old HTML, unused JS)
│   └── dashboard/             # Bundled Next.js static files (generated)
├── glean-dashboard/           # Next.js 15 React dashboard (static export)
│   └── src/
│       ├── app/               # Next.js app router pages
│       ├── components/        # React components
│       ├── contexts/          # React contexts (Auth, Theme, Toast)
│       └── lib/               # Utilities and services
├── docs/                      # Project documentation
│   ├── guides/                # How-to guides and features
│   ├── setup/                 # Installation and configuration
│   ├── testing/               # Test plans and QA docs
│   └── chrome-store/          # Chrome Web Store submission docs
├── archive/                   # Archived/obsolete projects and files
└── build-extension.sh         # Builds dashboard and bundles into extension
```

### Chrome Extension (`glean-clipper-extension/`)

- **Runtime**: Manifest V3, service worker background
- **Key Files**:
  - `manifest.json` - Extension manifest
  - `popup-modern.html/popup.js` - Extension popup menu (modern UI)
  - `background.js` - Service worker for API calls and command handling
  - `content.js` - Content script for page clipping
  - `command-palette.js` - Command palette UI (⌘K to open)
  - `modules/gleanApi.js` - Glean Collections API integration
  - `modules/apiFetch.js` - Authenticated fetch helpers
  - `dashboard/` - Bundled Next.js static files (generated)
  - `tests/` - Playwright E2E tests

### Dashboard (`glean-dashboard/`)

- **Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Output**: Static export to `out/` directory
- **Key Routes**:
  - `/` - Auth/login page
  - `/clips` - Recent clips view
  - `/library` - Full clip library with search/filters
  - `/prompts` - Saved prompts manager
  - `/desktop` - Desktop-style dashboard view

### Build Process

```bash
./build-extension.sh
# 1. Runs `npm run build` in glean-dashboard
# 2. Copies out/ to glean-clipper-extension/dashboard/
# 3. Fixes asset paths from absolute to relative for chrome-extension:// context
```

## Authentication

- Uses Glean Client API tokens (not user tokens)
- Token stored in `chrome.storage.local` as `gleanConfig.apiToken`
- API calls go through service worker to avoid CORS issues
- Dashboard communicates with extension via `chrome.runtime.sendMessage`

## Glean API Integration

- **Endpoint**: `https://{domain}-be.glean.com/api/v1/`
- **Collections API**: List, create, update collections
- **Client tokens**: Obtained from Glean Admin > Platform > Token Management > Client tab

## Development Workflow

### Extension Development
```bash
# Load unpacked extension from glean-clipper-extension/
# Changes to extension files: reload extension in chrome://extensions
```

### Dashboard Development
```bash
cd glean-dashboard
npm run dev          # Dev server at localhost:3000
# Set isDev=true in popup.js to use dev server
```

### Production Build
```bash
./build-extension.sh  # Bundle dashboard into extension
# Set isDev=false in popup.js for bundled files
# Reload extension in chrome://extensions
```

### Testing
```bash
cd glean-clipper-extension

# Run all Playwright tests (requires extension to be loadable)
npm run test:playwright

# Run specific test file
npx playwright test tests/command-palette.spec.cjs

# Run tests with UI
npx playwright test --ui

# Linting and formatting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format with Prettier
npm run quality       # Run all checks
```

## Keyboard Shortcuts

The extension supports keyboard shortcuts via the command palette:

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌥1` / `Alt+1` | Clip selection |
| `⌥2` / `Alt+2` | Save URL |
| `⌥3` / `Alt+3` | Open recent clips |
| `⌥4` / `Alt+4` | Open library |
| `⌘⌥0` / `Ctrl+Alt+0` | Open preferences |
| `Escape` | Close command palette |
| `↑↓` | Navigate commands |
| `Enter` | Execute selected command |

## Current State

- [x] Chrome extension with clipping functionality
- [x] Glean Collections API integration
- [x] Modern React dashboard with dark/light theme
- [x] Static dashboard bundled into extension (local-only, no server)
- [x] Library and Prompts pages
- [x] Command palette with keyboard shortcuts
- [x] Modern popup UI design
- [x] Playwright E2E test suite
- [x] Theme switching (light/dark/system) with preferences
- [x] Project folder reorganization (docs, archive structure)
- [x] Fixed RSC payload fetch errors (replaced Next.js Link with anchor tags)
- [ ] Connect popup to live extension data (collections, clips)
- [ ] Full preferences modal save/load cycle
- [ ] Search within clips
- [ ] Tag management

## Key Technical Decisions

1. **Local-only deployment**: Dashboard bundled into extension, no external hosting (PII protection)
2. **Static export**: Next.js `output: 'export'` for chrome-extension:// serving
3. **Relative paths**: Post-build script converts `/_next/` to `./_next/` for extension context
4. **CSP compliance**: `fix-csp.js` extracts inline scripts to external files for Chrome extension CSP
5. **Dynamic base paths**: `globalThis.__NEXT_BASE` set per-page for sub-directory HTML files
6. **Service worker API calls**: All Glean API calls through background.js to handle CORS
7. **Command palette injection**: `command-palette.js` injected as content script on all pages

## Content Scripts

The extension injects these scripts on all pages (defined in `manifest.json`):
- `command-palette.js` - Global keyboard shortcuts and command palette UI
- `content.js` - Page clipping functionality and selection handling

## Message Passing

Communication between components uses Chrome's message passing:

```javascript
// Content script → Background
chrome.runtime.sendMessage({ action: 'saveClip', data: clipData });

// Dashboard → Background (for API calls)
chrome.runtime.sendMessage({ action: 'getClips' });

// Background handles these actions in background.js switch statement
```

Key message actions:
- `saveClip` - Save a clip to storage and sync to Glean
- `getClips` - Retrieve all clips from storage
- `fetchCollections` - Get Glean collections list
- `executeCommand` - Handle command palette actions
- `getAuthConfig` - Get auth token for dashboard API calls

## Common Issues

### "Invalid Secret Not allowed" error
Token has invisible characters from copy/paste. Clear storage and re-enter:
```javascript
// In service worker console
chrome.storage.local.get(['gleanConfig'], r => {
  const config = r.gleanConfig || {};
  delete config.apiToken;
  chrome.storage.local.set({ gleanConfig: config });
});
```

### Dashboard shows broken layout
Asset paths wrong. Rebuild with `./build-extension.sh` and reload extension.

### ISO-8859-1 encoding error
Same as token issue - bad characters in stored values.

### CSP errors in dashboard pages
Inline scripts not allowed. Run `./build-extension.sh` which calls `fix-csp.js` to extract inline scripts.

### Sub-directory pages (library, prompts) 404 on assets
The `fix-csp.js` script sets `globalThis.__NEXT_BASE` correctly for each HTML file's depth.

### Playwright tests fail to find extension
Ensure the extension path is correct and Chrome is installed. Tests use `chromium.launchPersistentContext` with extension flags.

## Design System

**IMPORTANT**: See `.cursorrules` for complete design guidelines.

### Core Principles
1. **NO EMOJIS** - Never use emojis in code, documentation, UI, or commit messages
2. **All new UI designs MUST be created in v0.app first**
3. **All icons MUST use lucide-react** - no mixing icon libraries
4. **All components MUST support light and dark themes**

### Color Palette (Zinc-based)
```
Background:  bg-white dark:bg-zinc-950
Surface:     bg-zinc-50 dark:bg-zinc-900
Border:      border-zinc-200 dark:border-zinc-800
Text:        text-zinc-900 dark:text-zinc-100
Muted:       text-zinc-500 dark:text-zinc-400
```

### Icon Standards
- Library: lucide-react ONLY
- Sizes: h-4 w-4 (inline), h-5 w-5 (buttons), h-3.5 w-3.5 (small)
- Colors: Match theme (text-zinc-400, text-zinc-600, etc.)

### v0.app Integration

UI designs are created using v0.app MCP integration. Key v0 chats for reference:
- Command palette design: `h0pN3O1OOxs`
- Feedback modal: (created Dec 2024)
- Dashboard layout: (created Dec 2024)

To create new UI designs:
```javascript
// Use the v0 MCP tools
mcp__v0__createChat({ message: "Create a..." })
mcp__v0__findChats()  // Find existing designs
```

### Design Checklist for New Components
- [ ] Created in v0.app first
- [ ] Uses lucide-react icons only
- [ ] Supports light/dark theme
- [ ] Uses zinc color palette
- [ ] Uses shadcn/ui base components where applicable

## Security Rules

### API Keys & Secrets
- **NEVER commit API keys, tokens, or secrets to git**
- Use `.env.local` or `.env.test.local` for local development
- All `.env*` files (except templates) are gitignored
- Chrome storage (`chrome.storage.local`) for runtime token storage only
- Review diffs before committing for accidental secrets

### Protected Patterns in .gitignore
```
.env*
.env.local
.env.test.local
*.pem
*_context.txt
```

---

## Session Handoff

This section helps new Claude Code sessions pick up where the last one left off.

### Recent Work (Dec 2024)

**Completed:**
1. **RSC Payload Fix**: Replaced Next.js `Link` components with regular `<a>` tags in Dashboard.tsx, library/page.tsx, and prompts/page.tsx to fix "Failed to fetch RSC payload" errors in chrome-extension:// context
2. **Theme System**: Added light/dark/system theme switching with `applyTheme()` function in popup.js and light theme CSS overrides in popup-modern.css
3. **Project Reorganization**:
   - Moved 15+ root markdown files to `docs/` subdirectories (guides, setup, testing, chrome-store)
   - Archived obsolete projects to `archive/` (linkedin-profile-updater, obsidian-project-vault)
   - Organized extension folder: docs to `docs/`, scripts to `scripts/`, old HTML to `archive/old-html/`
   - Updated manifest.json to remove references to archived files

**Pending Tasks:**
1. **Connect popup to live extension data**: The popup currently uses mock data. Need to wire up `chrome.runtime.sendMessage` calls to fetch real collections and clips from storage
2. **Preferences modal**: The modal opens but save/load cycle needs testing and potential fixes
3. **Dashboard data connection**: Dashboard pages (library, prompts) use mock data; need to connect to extension storage via message passing

### Key Files to Know

| File | Purpose |
|------|---------|
| `popup.js` | Main popup logic, handles UI interactions and extension messaging |
| `popup-modern.css` | Popup styling including light theme overrides (search `body.light-theme`) |
| `background.js` | Service worker handling API calls and message routing |
| `Dashboard.tsx` | Main dashboard component, uses regular anchor tags for navigation |
| `clips-service.ts` | Clips data fetching for dashboard |

### Known Issues

1. **AddCollectionItems API 400 Error**: Glean API rejects some test URLs. This is a backend validation issue, not a code bug
2. **Preferences not persisting**: Theme preference saves to `chrome.storage.local` but may not apply on popup reopen
3. **Mock data in dashboard**: Library and Prompts pages show mock data, not real clips

### Quick Start for New Session

```bash
# Build and test the extension
./build-extension.sh

# Run Playwright tests
cd glean-clipper-extension && npm run test:playwright

# Check for lint errors
cd glean-dashboard && npm run lint
```

### Architecture Quick Reference

- **Popup** (popup.js) → sends messages → **Background** (background.js) → calls → **Glean API**
- **Dashboard** (Next.js) → sends messages → **Background** → reads/writes → **chrome.storage.local**
- **Content scripts** (content.js, command-palette.js) → injected on all pages → send messages → **Background**
- please use subagents whenver possible if it makes sense to