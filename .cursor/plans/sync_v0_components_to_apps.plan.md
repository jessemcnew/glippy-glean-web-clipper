---
name: Sync v0 Components to Apps
overview: Integrate the latest v0 React components into the working dashboard and extension apps. The v0 components have beautiful UI with mock data - they need to be merged with the existing apps that have real data wiring.
todos:

- id: audit-current-state
  content: "Audit: Compare v0 components vs dashboard components, identify gaps"
  status: pending

- id: setup-shadcn-dashboard
  content: "Setup: Ensure shadcn/ui is properly configured in glean-dashboard"
  status: pending

- id: sync-clips-reader
  content: "Sync ClipsReader: Merge v0 UI into dashboard version, keep data integration"
  status: pending

- id: add-reading-library
  content: "Add ReadingLibrary: Port v0 component to dashboard with data service"
  status: pending

- id: sync-extension-popup
  content: "Sync extension-popup: Update popup styling to match v0 design system"
  status: pending

- id: test-dashboard
  content: "Test: Verify dashboard components render and fetch data correctly"
  status: pending

- id: test-extension
  content: "Test: Verify extension popup works with updated styles"
  status: pending

---

# Sync v0 Components to Apps

## Agent Instructions

You are working on Glippy, a Chrome extension and web dashboard for clipping content to Glean. The project has beautiful React components designed in v0 that need to be integrated into the working apps.

### Key Principle
DO NOT convert React to vanilla JS. All target apps support React and Tailwind. The task is to MERGE the v0 UI designs with existing data integration code.

### Codebase Map

```
/Users/jmcnew/glippy/
├── glippy/components/           # SOURCE: v0 React components (beautiful UI, mock data)
│   ├── clips-reader.tsx         # Grid/list view for saved clips
│   ├── reading-library.tsx      # Full reading app with sidebar, article list, reader pane
│   ├── extension-popup.tsx      # Extension popup design
│   ├── desktop-reading-app.tsx  # Electron app wrapper
│   └── ui/                      # shadcn components (button, input)
│
├── glean-dashboard/             # TARGET: Next.js dashboard (has real data)
│   ├── src/components/
│   │   ├── ClipsReader.tsx      # Older UI but wired to real data
│   │   └── LoginForm.tsx        # Auth component
│   ├── src/lib/
│   │   └── clips-service.ts     # Data fetching service
│   └── src/app/                 # Next.js app router pages
│
├── glean-clipper-extension/     # TARGET: Chrome extension (vanilla JS, working)
│   ├── popup.js                 # Extension popup logic
│   ├── popup-modern.css         # Current styling
│   ├── popup-modern.html        # Popup HTML
│   └── modules/                 # Extension modules
│
└── glean-dashboard/             # Also has Electron setup for desktop app
```

### Design System Reference

The v0 components use this consistent design system:

**Colors (zinc palette dark theme):**
- Background: bg-zinc-950 (#09090b)
- Surface: bg-zinc-900 (#18181b)
- Border: border-zinc-800 (#27272a)
- Muted text: text-zinc-400 (#a1a1aa)
- Primary text: text-zinc-100 (#f4f4f5)

**Patterns:**
- Cards: bg-zinc-900 rounded-lg border border-zinc-800
- Hover states: hover:border-zinc-700, hover:bg-zinc-800
- Selected states: border-zinc-500 ring-2 ring-zinc-500
- Buttons: variant="ghost" with zinc color scheme

---

## Phase 1: Audit and Setup

### Task 1.1: Audit Current State

Compare the component pairs:
- `glippy/components/clips-reader.tsx` vs `glean-dashboard/src/components/ClipsReader.tsx`
- Check if `reading-library.tsx` exists in dashboard (it likely doesn't)
- Check shadcn/ui setup in dashboard

**Agent command:**
```
Read and compare these files:
@glippy/components/clips-reader.tsx
@glean-dashboard/src/components/ClipsReader.tsx
@glean-dashboard/src/lib/clips-service.ts

Identify:
1. UI differences (what's better in v0)
2. Data integration (what dashboard has that v0 lacks)
3. Missing shadcn components
```

### Task 1.2: Setup shadcn/ui in Dashboard

Ensure the dashboard has the required shadcn components:
- button
- input
- (any others used by v0 components)

Check `glean-dashboard/components.json` and `glean-dashboard/src/components/ui/`

---

## Phase 2: Sync ClipsReader

### Task 2.1: Merge ClipsReader

The dashboard ClipsReader already has:
- Real data fetching via clips-service.ts
- Delete and download functionality
- Search and filtering
- Loading and empty states

The v0 ClipsReader has:
- Cleaner visual design
- Better component structure

**Strategy:** Take the dashboard version as base, update the JSX/styling to match v0 design. Keep all the data integration, handlers, and state management.

**Agent command:**
```
Update @glean-dashboard/src/components/ClipsReader.tsx:

1. Keep all imports from clips-service.ts
2. Keep all state management and useEffect hooks
3. Keep all handler functions (loadClips, handleDeleteClip, etc)
4. Update the JSX structure and Tailwind classes to match @glippy/components/clips-reader.tsx
5. Ensure the design system colors match (zinc-950, zinc-900, zinc-800, etc)
```

---

## Phase 3: Add ReadingLibrary

### Task 3.1: Create Data Service

Create a new service for articles/reading list:
- `glean-dashboard/src/lib/reading-service.ts`
- Similar pattern to clips-service.ts
- Fetches from Glean API or local storage

**Agent command:**
```
Create @glean-dashboard/src/lib/reading-service.ts

Model it after @glean-dashboard/src/lib/clips-service.ts but for articles:
- fetchArticles(): Article[]
- toggleStar(id): void
- toggleArchive(id): void
- toggleRead(id): void

Use the Article type from @glippy/components/reading-library.tsx
```

### Task 3.2: Port ReadingLibrary Component

Copy the v0 ReadingLibrary to dashboard and wire it to the data service.

**Agent command:**
```
Copy @glippy/components/reading-library.tsx to @glean-dashboard/src/components/ReadingLibrary.tsx

Modifications:
1. Replace mockArticles with data from reading-service.ts
2. Add useEffect to load articles on mount
3. Wire toggle functions to service calls
4. Add loading and error states
5. Keep all the beautiful UI exactly as designed
```

### Task 3.3: Add Route

Add a route for the reading library in the dashboard app.

**Agent command:**
```
Create @glean-dashboard/src/app/library/page.tsx

Simple page that renders the ReadingLibrary component.
Add navigation link from the main dashboard.
```

---

## Phase 4: Extension Popup Sync

### Task 4.1: Evaluate Extension Approach

The extension is currently vanilla JS. Options:
1. Keep vanilla JS, just update CSS to match design system
2. Convert to Plasmo (React-based extension framework)

For now, sync the CSS to match the v0 design system.

**Agent command:**
```
Update @glean-clipper-extension/popup-modern.css

Ensure these CSS variables/values match the v0 design system:
- --bg-primary: #09090b (zinc-950)
- --bg-surface: #18181b (zinc-900)
- --border-color: #27272a (zinc-800)
- --text-muted: #a1a1aa (zinc-400)
- --text-primary: #f4f4f5 (zinc-100)

Update any hardcoded colors in the CSS to use these values.
```

---

## Phase 5: Testing and Verification

### Task 5.1: Test Dashboard

```bash
cd /Users/jmcnew/glippy/glean-dashboard
npm run dev
```

Verify:
- ClipsReader loads and displays clips
- Grid/list view toggle works
- Search filters clips
- Delete and download work
- ReadingLibrary page loads
- Article selection and reading pane work

### Task 5.2: Test Extension

Load the extension in Chrome:
1. Go to chrome://extensions
2. Enable Developer mode
3. Load unpacked from /Users/jmcnew/glippy/glean-clipper-extension

Verify:
- Popup opens with correct styling
- Clip functionality works
- Colors match the design system

---

## Parallel Agent Strategy

For faster execution, run two agents simultaneously:

**Agent 1: Dashboard Components**
```
Focus on glean-dashboard only:
1. Sync ClipsReader UI
2. Add ReadingLibrary component
3. Create reading-service.ts
4. Add /library route
```

**Agent 2: Extension and Polish**
```
Focus on glean-clipper-extension:
1. Update popup-modern.css colors
2. Verify popup-modern.html structure
3. Test extension loads correctly
```

---

## Files Reference

### Source (v0 components - copy UI from here)
- `/Users/jmcnew/glippy/glippy/components/clips-reader.tsx`
- `/Users/jmcnew/glippy/glippy/components/reading-library.tsx`
- `/Users/jmcnew/glippy/glippy/components/extension-popup.tsx`
- `/Users/jmcnew/glippy/glippy/components/ui/button.tsx`
- `/Users/jmcnew/glippy/glippy/components/ui/input.tsx`

### Target (apps to update)
- `/Users/jmcnew/glippy/glean-dashboard/src/components/ClipsReader.tsx`
- `/Users/jmcnew/glippy/glean-dashboard/src/lib/clips-service.ts`
- `/Users/jmcnew/glippy/glean-clipper-extension/popup-modern.css`
- `/Users/jmcnew/glippy/glean-clipper-extension/popup-modern.html`

### Create New
- `/Users/jmcnew/glippy/glean-dashboard/src/components/ReadingLibrary.tsx`
- `/Users/jmcnew/glippy/glean-dashboard/src/lib/reading-service.ts`
- `/Users/jmcnew/glippy/glean-dashboard/src/app/library/page.tsx`
