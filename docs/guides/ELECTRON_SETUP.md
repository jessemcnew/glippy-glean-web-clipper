# Electron Desktop App Setup 🖥️

## Quick Start

### 1. Install Dependencies
```bash
cd glean-dashboard
npm install
```

### 2. Run Desktop App (Development)
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

### 3. Build Desktop App
```bash
# Build Next.js app and Electron
npm run electron:build
```

## Features

✅ **Custom macOS Title Bar** - Traffic lights, drag region
✅ **Three-Pane Layout** - Sidebar, clip list, reading pane
✅ **Command Palette** - Press ⌘K for quick actions
✅ **Reader Settings** - Themes, font size, line height, content width
✅ **Keyboard Shortcuts** - Full keyboard navigation
✅ **Dark Theme** - Beautiful dark UI matching v0 design
✅ **Clip Integration** - Loads clips from extension

## Keyboard Shortcuts

- `⌘K` - Open command palette
- `J` - Next clip
- `K` - Previous clip
- `S` - Toggle star
- `A` - Toggle archive
- `R` - Mark as read/unread
- `O` - Open in browser
- `C` - Copy link
- `Del` - Delete clip
- `⌘,` - Open settings

## Architecture

- **Next.js Route**: `/desktop` → `app/desktop/page.tsx`
- **Component**: `components/desktop-reading-app.tsx`
- **Electron Main**: `public/electron-main.js`
- **Preload**: `public/preload.js`

## Development

The desktop app runs the Next.js dev server and loads it in Electron. This gives you:
- Hot reload for React components
- DevTools access
- Fast iteration

## Production Build

The build process:
1. Builds Next.js app (`next build`)
2. Packages Electron app with electron-builder
3. Creates distributable app for macOS/Windows/Linux

## Notes

- Desktop app requires authentication (uses same auth as dashboard)
- Clips are loaded from extension via `clips-service.ts`
- Reader settings are stored in component state (can be persisted later)
