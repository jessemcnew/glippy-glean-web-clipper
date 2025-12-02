# How to See the New UI

## Quick Steps (No Reinstall Needed!)

1. **Go to Chrome Extensions**: `chrome://extensions/`
2. **Find "Glean Web Clipper"** extension
3. **Click the Reload button** (🔄) on the extension card
4. **Close and reopen the popup** - Click the extension icon again

That's it! The new UI should appear.

## What Changed

- **New UI File**: `popup-modern.html` with modern design
- **New CSS**: `popup-modern.css` with updated styling
- **Manifest Updated**: Now points to `popup-modern.html`

## Visual Changes

- **Dark header** (black instead of purple gradient)
- **Clean tabs** (Clips, Collections, Settings)
- **Light gray cards** for clips (instead of white)
- **Better spacing** and typography
- **Matches the design** you showed

## If It Still Shows Old UI

1. **Hard reload**: Right-click the extension icon → "Inspect popup" → Right-click refresh button → "Empty Cache and Hard Reload"
2. **Or**: Close Chrome completely and reopen it
3. **Check**: Make sure `manifest.json` shows `"default_popup": "popup-modern.html"`

## Troubleshooting

If you see errors:
- Check browser console: Right-click extension icon → "Inspect popup"
- Look for missing CSS file errors
- Verify `popup-modern.css` exists in the extension folder

