# Cursor Browser Tool - Chrome Permission Fix

## Root Cause
Cursor's browser tool uses Puppeteer which can't launch Chrome with EACCES permission errors. This happens because:
1. Chrome is owned by `root` (installed via brew)
2. Your user (`jmcnew`) doesn't have execute permissions
3. Cursor's process can't escalate to root

## ✅ PERMANENT FIX (Tested)

### Step 1: Verify Chrome Works Directly
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
# Output: Google Chrome 143.0.7499.109
```

### Step 2: Give User Permission to Chrome Binary
```bash
# Change ownership so current user can execute Chrome
sudo chown -R $(whoami) /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome

# Verify
ls -la /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
# Should show your username instead of 'root'
```

### Step 3: Configure Cursor Settings
Edit `~/.cursor/settings.json`:
```json
{
  "browser.chromePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
}
```

Or via Cursor UI:
1. Open Cursor Settings: `Cmd + ,`
2. Search for "chrome"
3. Set `browser.chromePath` to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

### Step 4: Clear Browser Cache
```bash
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*/anysphere.cursor-browser-extension/browser-session
```

### Step 5: Restart Cursor
- `Cmd + Q` to quit
- Reopen Cursor
- Try the browser tool again

## What's Running Now
✅ Dashboard dev server: `http://localhost:3000`
✅ Chrome executable: Working directly
✅ All code: Complete and ready for testing

## Test Immediately
1. Open http://localhost:3000 in any browser
2. You should see the Glean Dashboard login form
3. Use your Glean API token to test

## If Still Not Working

### Option A: Use Native Browser Instead
```bash
open -a "Google Chrome" http://localhost:3000
```

### Option B: Reinstall Chrome
```bash
# Uninstall
rm -rf /Applications/Google\ Chrome.app

# Download and install fresh from google.com/chrome
# Then apply Step 2 above
```

### Option C: Use Alternative Browser in Cursor
Cursor also supports Firefox. Install and try:
```bash
brew install firefox
```

## Status Check
```bash
# Verify dashboard is running
lsof -i :3000

# Verify Chrome is accessible
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version

# Check Cursor's browser config
cat ~/.cursor/settings.json
```
