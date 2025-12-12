# Testing Checklist

## Dashboard Testing

### 1. Login Flow
- [ ] Open http://localhost:3000 in your browser
- [ ] Verify dark theme login form appears (zinc-950 background)
- [ ] Enter domain: `app.glean.com` (or your Glean domain)
- [ ] Enter a test API token
- [ ] Select "Manual Token" auth method
- [ ] Click "Sign In"
- [ ] Verify you're redirected to the main dashboard
- [ ] Verify connection status shows in header

### 2. Auth State Persistence
- [ ] After logging in, refresh the page (F5)
- [ ] Verify you remain logged in (not redirected to login)
- [ ] Click "Sign Out" button
- [ ] Verify you're redirected back to login form
- [ ] Refresh page again
- [ ] Verify you stay on login page (auth cleared)

### 3. Protected Routes
- [ ] While logged out, navigate to http://localhost:3000/clips
- [ ] Verify you're redirected to login form
- [ ] After logging in, navigate to /clips
- [ ] Verify ClipsReader component loads

### 4. ClipsReader Component
- [ ] Navigate to http://localhost:3000/clips
- [ ] Verify dark theme (zinc-950 background)
- [ ] Verify loading state appears briefly
- [ ] Verify empty state if no clips (or clips display if you have some)
- [ ] Test search functionality (if clips exist)
- [ ] Test grid/list view toggle
- [ ] Test clip selection (checkboxes)
- [ ] Test bulk delete (if clips selected)
- [ ] Test individual clip delete

## Extension Testing

### 1. Manual Token Entry
- [ ] Open extension popup
- [ ] Click Settings tab
- [ ] Click "Or Enter Token Manually"
- [ ] Enter domain and API token
- [ ] Select a collection (or enter collection ID)
- [ ] Click "Save Settings"
- [ ] Verify success message
- [ ] Click "Test Connection"
- [ ] Verify connection test passes

### 2. OAuth Flow (if configured)
- [ ] Click "Open Glean Token Page" button
- [ ] If OAuth not configured, verify fallback to manual entry
- [ ] If OAuth configured, verify OAuth flow works
- [ ] Verify token is saved with `authMethod: 'oauth'`

### 3. Clip Creation
- [ ] Open any webpage
- [ ] Select some text on the page
- [ ] Click extension icon
- [ ] Click "Clip to Glean" button
- [ ] Verify success message
- [ ] Open extension popup → Clips tab
- [ ] Verify new clip appears in the list
- [ ] Open dashboard → /clips route
- [ ] Verify clip appears in ClipsReader (may need to refresh)

### 4. Extension UI
- [ ] Verify dark theme (zinc-800/900 colors)
- [ ] Verify "Clip to Glean" button is prominent at top
- [ ] Verify all menu items display correctly
- [ ] Test hover states on menu items
- [ ] Verify tabs work (Clips/Settings)

## Cross-Platform Testing

### Auth Consistency
- [ ] Log in to extension with a token
- [ ] Log in to dashboard with the same token
- [ ] Verify both work correctly
- [ ] Verify authMethod flag is preserved correctly

## Error Handling
- [ ] Test with invalid token (should show error)
- [ ] Test with missing domain (should show error)
- [ ] Test connection with wrong token (should fail gracefully)
- [ ] Verify error messages are user-friendly

## Visual Checks
- [ ] Dark theme is consistent across all pages
- [ ] All text is readable (good contrast)
- [ ] Buttons and interactive elements are clearly visible
- [ ] Loading states appear when appropriate
- [ ] Empty states are helpful and clear
