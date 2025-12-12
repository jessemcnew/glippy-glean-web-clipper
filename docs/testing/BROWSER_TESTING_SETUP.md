# Browser Testing Setup for Cursor

## Problem
Cursor's browser tool can't launch Chrome due to permission errors (EACCES).

## Solution

### Option 1: Manual Browser Testing (Immediate)

The dashboard dev server is already running on **http://localhost:3000**

Simply open your browser and test manually:
1. Open Chrome/Safari
2. Navigate to `http://localhost:3000`
3. Follow the `TESTING_CHECKLIST.md` for step-by-step tests

### Option 2: Fix Cursor's Browser Permissions

If you want to use Cursor's integrated browser tool:

#### Step 1: Grant Chrome Permissions
```bash
# Make Chrome executable by current user
sudo chmod +x /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome

# Verify permissions
ls -la /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

#### Step 2: Disable Chrome Sandboxing (For Development Only)
Cursor may need Chrome to run without sandbox restrictions. Edit or add to your Cursor settings:

1. Open Cursor Settings: `Cmd + ,`
2. Search for "browser" or "chrome"
3. Add or modify these settings:
   ```json
   {
     "browser.chrome.path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
     "browser.chrome.args": ["--no-sandbox", "--disable-setuid-sandbox"]
   }
   ```

#### Step 3: Reset Cursor's Browser Cache
```bash
# Clear Cursor's browser session data
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*/anysphere.cursor-browser-extension/browser-session

# Or for the specific workspace:
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/411c7e60d7253f76ec8b89f9b1ae51e4/anysphere.cursor-browser-extension/browser-session
```

#### Step 4: Restart Cursor
1. Quit Cursor completely: `Cmd + Q`
2. Reopen Cursor
3. Try the browser tool again

### Option 3: Use Chrome's Remote Debugging

Launch Chrome separately with remote debugging enabled:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:3000
```

Then connect Cursor's browser tool to this instance.

## Current Status

✅ Dashboard dev server is running on `http://localhost:3000`
✅ All code changes are complete and tested for compilation
✅ Testing checklist is ready at `TESTING_CHECKLIST.md`

## Next Steps

1. **Immediate**: Open http://localhost:3000 in your browser and test manually
2. **If you want Cursor's browser**: Try the permission fixes above
3. **Report any issues**: Check console for errors while testing

## Troubleshooting

### "Chrome still won't launch"
- Try opening a new private/incognito window first
- Check System Preferences → Security & Privacy → Privacy → Microphone/Camera
- Verify Chrome app isn't damaged: `spctl -a -v -t open --context context:primary-source /Applications/Google\ Chrome.app`

### "Browser loads but dashboard doesn't"
- Check that `npm run dev` is still running: `lsof -i :3000`
- Check browser console for errors (F12)
- Verify auth config is correct (domain + token)

### "Auth not working"
- Verify you have a valid Glean API token
- Check extension popup for any error messages
- Clear browser cache: `Cmd + Shift + Delete`
