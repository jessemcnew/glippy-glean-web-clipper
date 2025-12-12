# Pre-Submission Checklist - Chrome Web Store

Use this checklist before submitting your extension to the Chrome Web Store.

## ✅ Code & Security

- [x] No `eval()` or `Function()` constructors
- [x] No external script loading
- [x] All user input escaped
- [x] Content Security Policy added
- [x] Code is readable and well-structured
- [x] HTTPS only (no HTTP permissions)
- [x] OAuth handled gracefully (empty client_id is fine)

## ✅ Privacy & Permissions

- [x] Privacy policy created
- [x] Privacy policy hosted at public URL
- [x] Privacy policy URL verified and accessible
- [x] Data collection disclosed
- [x] Permissions justified
- [x] Single purpose clearly stated

## ✅ Files & Assets

- [x] `manifest.json` - Valid and compliant
- [x] Icons present (16px, 48px, 128px)
- [ ] **Screenshots taken** (at least 1, 1280x800 recommended)
- [ ] **Extension packaged** (zip file created)

## ✅ Store Listing Information

- [ ] **Name**: Glean Web Clipper
- [ ] **Short Description**: "Clip web content to your personal Glean knowledge base"
- [ ] **Detailed Description**: Written (see `STORE_DESCRIPTION.md`)
- [ ] **Category**: Productivity
- [ ] **Language**: English (United States)
- [ ] **Privacy Policy URL**: `https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html`
- [ ] **Permission Justifications**: Prepared (see `CHROME_STORE_PRIVACY_ANSWERS.md`)

## ✅ Testing

- [ ] Extension tested on clean Chrome profile
- [ ] All features work correctly
- [ ] No console errors
- [ ] OAuth fallback works (if OAuth not configured)
- [ ] Manual token entry works
- [ ] Clip creation works
- [ ] Sync to Glean works
- [ ] Extension popup displays correctly
- [ ] Library/notebook viewer works

## ✅ Final Steps

- [ ] Screenshots taken and saved
- [ ] Extension packaged using `package-extension.sh`
- [ ] Zip file verified (contains all required files)
- [ ] Chrome Web Store Developer account ready ($5 fee paid if first time)
- [ ] All store listing information prepared
- [ ] Ready to submit!

---

## Quick Commands

### Package Extension
```bash
cd glean-clipper-extension
./package-extension.sh
```

Or manually:
```bash
cd glean-clipper-extension
zip -r ../glean-clipper-v1.0.zip . -x "*.git*" "*.md" "archive/*" "scripts/*" "test*" "*.sh" "*.py"
```

### Verify Zip Contents
```bash
unzip -l glean-clipper-v1.0.zip | head -30
```

---

## Submission URL

**Chrome Web Store Developer Dashboard:**
https://chrome.google.com/webstore/devconsole

---

## Current Status

- ✅ **Code**: Compliant and ready
- ✅ **Privacy Policy**: Hosted and accessible
- ⏳ **Screenshots**: Need to take
- ⏳ **Packaging**: Script ready, need to run
- ⏳ **Submission**: Ready after screenshots and packaging

---

*Last Updated: December 11, 2025*
