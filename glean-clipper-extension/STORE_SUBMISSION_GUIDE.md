# Chrome Web Store Submission Guide

## ✅ Compliance Status: READY

All critical compliance issues have been fixed. The extension is ready for submission.

## Fixed Issues Summary

### 1. ✅ Privacy Policy
- Created comprehensive privacy policy
- Documents all data collection
- Explains third-party integrations
- Clear user rights section

### 2. ✅ Host Permissions
- **Before**: `["http://*/*", "https://*/*"]` (too broad, includes HTTP)
- **After**: `["https://*/*"]` (HTTPS only, required for web clipper)
- **Justification**: Web clipper must access any HTTPS page to read content when user clips

### 3. ✅ OAuth Configuration
- **Before**: `"client_id": "YOUR_GLEAN_OAUTH_CLIENT_ID"` (placeholder)
- **After**: `"client_id": ""` (empty, optional)
- Added graceful fallback to manual token entry
- No errors if OAuth not configured

### 4. ✅ Content Security Policy
- Added CSP to manifest.json
- `script-src 'self'` - Prevents external scripts
- `object-src 'self'` - Prevents plugin injection
- Prevents XSS attacks

### 5. ✅ Code Security
- Verified: No `eval()` usage
- Verified: No external script loading
- Verified: All user content escaped with `escapeHtml()`
- All code bundled in extension

## Pre-Submission Checklist

### Required Files
- [x] `manifest.json` - Updated and compliant
- [x] `PRIVACY_POLICY.md` - Created
- [x] Icons (16px, 48px, 128px) - Present
- [ ] Screenshots - Need to take (1280x800 recommended)

### Store Listing Information

#### Basic Information
- **Name**: Glean Web Clipper
- **Short Description**: Clip web content to your personal Glean knowledge base
- **Detailed Description**: Use content from `STORE_DESCRIPTION.md`
- **Category**: Productivity
- **Language**: English (United States)

#### Privacy & Permissions
- **Privacy Policy URL**: [Host PRIVACY_POLICY.md and add URL here]
- **Single Purpose**: Save web content to Glean knowledge base
- **Permission Justifications**: See `CHROME_STORE_PRIVACY_ANSWERS.md`

#### Images
- **Icon**: icon128.png (already present)
- **Screenshots**: Need to take:
  1. Extension popup showing clips
  2. Library view with articles
  3. Configuration window
  4. Reader view

## Submission Steps

1. **Prepare Privacy Policy**
   - Host `PRIVACY_POLICY.md` on public URL
   - GitHub Pages, company website, or docs site
   - Example: `https://github.com/yourcompany/glean-clipper/blob/main/PRIVACY_POLICY.md`

2. **Take Screenshots**
   - Use Chrome's extension popup
   - Show library, reader, settings
   - Minimum 1280x800 resolution
   - PNG format

3. **Package Extension**
   ```bash
   # Create zip file
   cd glean-clipper-extension
   zip -r ../glean-clipper-v1.0.zip . -x "*.git*" "*.md" "archive/*" "scripts/*"
   ```

4. **Submit to Chrome Web Store**
   - Go to Chrome Web Store Developer Dashboard
   - Click "New Item"
   - Upload zip file
   - Fill out all required fields
   - Add privacy policy URL
   - Upload screenshots
   - Submit for review

## Expected Review Time

- **Initial Review**: 1-3 business days
- **If Issues Found**: 3-7 business days after fixes
- **Re-review**: 1-2 business days

## Common Questions from Reviewers

### Q: Why do you need access to all HTTPS sites?
**A**: This is a web clipper extension. Users need to save content from any website they visit. The extension only accesses page content when the user explicitly clicks the clip button or uses context menu options. This is standard for content-saving extensions.

### Q: What data do you collect?
**A**: We collect only the content users explicitly choose to clip (page title, URL, selected text). This data is stored locally and only sent to the user's configured Glean instance when they sync. See our privacy policy for details.

### Q: Do you use remote code execution?
**A**: No. All JavaScript code is bundled in the extension package. We only make API calls to send data to Glean. No external scripts are loaded, no `eval()` is used.

## Post-Submission

After submission:
1. Monitor email for review status
2. Respond promptly to any reviewer questions
3. Fix any issues immediately
4. Resubmit if needed

## Files Reference

- **Privacy Policy**: `PRIVACY_POLICY.md`
- **Permission Justifications**: `CHROME_STORE_PRIVACY_ANSWERS.md`
- **Store Description**: `STORE_DESCRIPTION.md`
- **Compliance Checklist**: `CHROME_STORE_COMPLIANCE.md`

## Status: ✅ READY

All compliance issues fixed. Ready for submission after completing action items (screenshots, hosting privacy policy).

