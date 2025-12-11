# Chrome Web Store Submission - Final Steps

## ✅ Completed
- [x] Privacy policy created and hosted
- [x] Extension code compliant
- [x] All security checks passed

## 📋 Next Steps

### Step 1: Verify Privacy Policy URL

1. Open: https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html
2. Verify it loads correctly
3. Check it's publicly accessible
4. **Copy this URL** - you'll need it for submission:
   ```
   https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html
   ```

---

### Step 2: Take Screenshots

You need at least **1 screenshot** (1280x800 recommended, PNG format).

#### Screenshot 1: Extension Popup (Main View)
1. Load extension in Chrome
2. Click extension icon
3. Make sure "Clips" tab is visible
4. Take screenshot showing:
   - Extension popup with clips list
   - Modern dark theme
   - Clip count
   - Menu items

#### Screenshot 2: Library View (Optional but Recommended)
1. Click "Library" in extension popup
2. Show the notebook/library interface
3. Take screenshot showing:
   - Grid/list view of clips
   - Search functionality
   - Filters

#### Screenshot 3: Settings/Configuration (Optional)
1. Click "Configuration" in extension popup
2. Show settings panel
3. Take screenshot showing:
   - Token configuration
   - Collection selection
   - Connection status

**How to Take Screenshots:**
- **Mac**: `⌘ + Shift + 4`, then drag to select area
- **Windows**: `Win + Shift + S` (Snipping Tool)
- **Chrome DevTools**: Right-click extension popup → Inspect → Screenshot

**Save as:**
- `screenshot-1-popup.png` (1280x800 or larger)
- `screenshot-2-library.png` (optional)
- `screenshot-3-settings.png` (optional)

---

### Step 3: Package Extension

Run this command to create the zip file:

```bash
cd /Users/jmcnew/glippy/glean-clipper-extension
zip -r ../glean-clipper-v1.0.zip . \
  -x "*.git*" \
  -x "*.md" \
  -x "archive/*" \
  -x "scripts/*" \
  -x "test*" \
  -x "*.sh" \
  -x "*.py" \
  -x "node_modules/*" \
  -x ".cursor/*" \
  -x ".playwright-mcp/*"
```

This creates: `/Users/jmcnew/glippy/glean-clipper-v1.0.zip`

**Verify the zip contains:**
- ✅ `manifest.json`
- ✅ `background.js`
- ✅ `content.js`
- ✅ `popup-modern.html`
- ✅ `popup.js`
- ✅ `modules/` folder
- ✅ Icons (icon16.png, icon48.png, icon128.png)
- ❌ No `.md` files
- ❌ No test files
- ❌ No scripts folder

---

### Step 4: Prepare Store Listing Information

#### Basic Information
- **Name**: `Glean Web Clipper`
- **Short Description**: `Clip web content to your personal Glean knowledge base`
- **Category**: `Productivity`
- **Language**: `English (United States)`

#### Detailed Description
Use content from `glean-clipper-extension/STORE_DESCRIPTION.md` or write your own:

```
Glean Web Clipper allows you to save web content directly to your Glean Collections. 

Features:
• Quick clipping: Select text and save to Glean
• Context menu integration: Right-click to clip
• Offline support: Works offline, syncs when connected
• Library view: Browse and organize your clips
• Reader view: Clean reading experience
• Smart categorization: Auto-organize your clips

Perfect for knowledge workers who use Glean to build their personal knowledge base.
```

#### Privacy Policy URL
```
https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html
```

#### Permission Justifications
See `glean-clipper-extension/CHROME_STORE_PRIVACY_ANSWERS.md` for detailed answers.

**Quick answers:**
- **activeTab**: To access current page URL and title when clipping
- **storage**: To save clips and settings locally
- **contextMenus**: To add right-click menu options
- **scripting**: To inject content scripts for text selection
- **identity**: For OAuth authentication (optional)
- **host_permissions (https://*/*)**: Web clipper must access any HTTPS page when user clips content

---

### Step 5: Submit to Chrome Web Store

1. **Go to Developer Dashboard**
   - Visit: https://chrome.google.com/webstore/devconsole
   - Sign in with Google account
   - Pay one-time $5 registration fee (if first time)

2. **Create New Item**
   - Click **"New Item"** button
   - Click **"Upload"** and select `glean-clipper-v1.0.zip`
   - Wait for upload to complete

3. **Fill Out Store Listing**
   - **Name**: Glean Web Clipper
   - **Short Description**: Clip web content to your personal Glean knowledge base
   - **Detailed Description**: (paste from Step 4)
   - **Category**: Productivity
   - **Language**: English (United States)
   - **Privacy Policy URL**: `https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html`

4. **Upload Images**
   - **Icon**: Upload `icon128.png` (already in zip)
   - **Screenshots**: Upload at least 1 screenshot (from Step 2)
   - **Promotional Images**: (Optional)

5. **Privacy & Permissions**
   - Answer permission justification questions
   - Reference `CHROME_STORE_PRIVACY_ANSWERS.md` for detailed answers

6. **Distribution**
   - Choose: **Public** (or Unlisted for testing)
   - Select regions (usually "All regions")

7. **Submit for Review**
   - Review all information
   - Click **"Submit for Review"**
   - Wait for review (1-3 business days)

---

## Review Timeline

- **Initial Review**: 1-3 business days
- **If Issues Found**: 3-7 business days after fixes
- **Re-review**: 1-2 business days

You'll receive email notifications about:
- Submission received
- Review in progress
- Approval or rejection (with reasons)

---

## Common Rejection Reasons (All Avoided ✅)

- ✅ No external code execution
- ✅ No eval() usage
- ✅ Privacy policy provided
- ✅ Permissions justified
- ✅ No misleading claims
- ✅ Code is readable
- ✅ HTTPS only
- ✅ CSP implemented
- ✅ OAuth handled properly
- ✅ User data properly escaped

---

## After Approval

1. **Monitor Reviews**: Check user reviews and ratings
2. **Update Extension**: Use "Update" button to publish new versions
3. **Respond to Issues**: Address user feedback promptly
4. **Analytics**: Check Chrome Web Store analytics for usage stats

---

## Quick Command Reference

```bash
# Package extension
cd glean-clipper-extension
zip -r ../glean-clipper-v1.0.zip . -x "*.git*" "*.md" "archive/*" "scripts/*" "test*" "*.sh" "*.py"

# Verify zip contents
unzip -l ../glean-clipper-v1.0.zip | head -20
```

---

## Checklist Before Submission

- [ ] Privacy policy URL verified and accessible
- [ ] At least 1 screenshot taken (1280x800)
- [ ] Extension packaged (zip file created)
- [ ] Store description written
- [ ] Permission justifications prepared
- [ ] Extension tested on clean Chrome profile
- [ ] All features working
- [ ] No console errors
- [ ] Ready to submit!

---

**You're almost there!** 🚀

Just take screenshots, package the extension, and submit!
