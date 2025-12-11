---
name: Final Testing and Polish Plan
overview: Consolidated plan reflecting current progress: auth system and UI components are integrated, ClipsReader is connected to real data. Focus on testing auth flows, end-to-end testing, and final polish.
todos:

- id: test-extension-auth
content: "Test extension auth: manual token entry, OAuth flow, verify headers and storage"
status: pending
- id: test-dashboard-auth
content: "Test dashboard auth: login form, state persistence, protected routes, logout"
status: pending
- id: test-clip-creation-flow
content: "Test end-to-end: select text, clip to Glean, verify appears in popup and dashboard"
status: pending
- id: check-typescript-errors
content: "Check for TypeScript errors, fix imports, verify types"
status: pending
- id: cleanup-and-polish
content: "Remove console.logs, improve errors, add loading states, verify dark theme"
status: pending
---

# Final Testing and Polish Plan

## Current Status Summary

### ✅ Completed

- Auth system implemented (OAuth support, headers, context)
- UI components integrated (ClipsReader, LoginForm with dark theme)
- Data integration done (clips-service.ts created, ClipsReader uses real data)
- Extension popup updated (Clip to Glean button, dark theme)
- Delete and download functionality implemented

### 🔄 Remaining Work

- Auth testing (manual tokens, OAuth flow)
- End-to-end flow testing
- TypeScript/error checking
- Final polish and cleanup

## Phase 1: Auth Testing (Priority)

### 1.1 Extension Auth

- Test manual token entry in popup settings
- Verify token saves to chrome.storage.local
- Test API calls work with manual token
- Test connection validation
- Test OAuth button (verify fallback if not configured)
- Verify X-Glean-Auth-Type header for OAuth tokens

### 1.2 Dashboard Auth

- Test login form submission
- Verify config saves to localStorage
- Test auth state persists on reload
- Test protected routes redirect correctly
- Test logout functionality

## Phase 2: End-to-End Testing

### 2.1 Clip Creation Flow

1. Select text on webpage
2. Click extension icon → "Clip to Glean" button
3. Verify clip saves to extension storage
4. Verify clip appears in extension popup
5. Open dashboard → /clips route
6. Verify clip appears in ClipsReader

### 2.2 Auth Consistency

- Test same token works in both extension and dashboard
- Verify auth state syncs correctly
- Test error handling for invalid tokens

## Phase 3: Code Quality & Polish

### 3.1 TypeScript & Errors

- Check for TypeScript errors
- Verify all imports resolve
- Fix any type issues
- Check for missing dependencies

### 3.2 Cleanup

- Remove console.logs
- Improve error messages
- Add missing loading states
- Verify dark theme consistency

### 3.3 Final Checks

- No console errors
- All components render correctly
- Responsive layout works
- Accessibility basics (keyboard nav, focus states)

## Key Files to Test/Modify

### Extension

- `glean-clipper-extension/popup.js` - Test Clip to Glean button
- `glean-clipper-extension/modules/oauth.js` - Test OAuth flow
- `glean-clipper-extension/manifest.json` - OAuth client ID (if needed)

### Dashboard

- `glean-dashboard/src/components/ClipsReader.tsx` - Test with real data
- `glean-dashboard/src/components/LoginForm.tsx` - Test auth flow
- `glean-dashboard/src/lib/clips-service.ts` - Verify data fetching

## Testing Checklist

- [ ] Extension manual token entry works
- [ ] Extension OAuth flow works (or falls back gracefully)
- [ ] Dashboard login works
- [ ] Auth state persists correctly
- [ ] Clip creation works end-to-end
- [ ] Clips appear in both extension and dashboard
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Dark theme is consistent
- [ ] All functionality works as expected