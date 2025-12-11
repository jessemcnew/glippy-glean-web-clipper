# Privacy Policy Hosting Guide

This guide explains how to host the privacy policy for Chrome Web Store submission.

## Option 1: GitHub Pages (Recommended - Free & Easy)

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/jessemcnew/glippy-glean-web-clipper`
2. Click **Settings** → **Pages** (in left sidebar)
3. Under **Source**, select:
   - **Branch**: `main` (or `master`)
   - **Folder**: `/docs`
4. Click **Save**
5. Wait 1-2 minutes for GitHub Pages to build

### Step 2: Get Your Privacy Policy URL

Your privacy policy will be available at:
```
https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html
```

### Step 3: Verify It Works

1. Open the URL in your browser
2. Verify the privacy policy displays correctly
3. Check it's accessible (not behind authentication)

### Step 4: Use in Chrome Web Store

When submitting to Chrome Web Store:
- **Privacy Policy URL**: `https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html`

---

## Option 2: Netlify (Free & Fast)

### Step 1: Create Netlify Account

1. Go to https://www.netlify.com
2. Sign up with GitHub (free)
3. Authorize Netlify to access your repositories

### Step 2: Deploy

1. Click **Add new site** → **Import an existing project**
2. Select your GitHub repository: `glippy-glean-web-clipper`
3. Configure:
   - **Base directory**: `docs`
   - **Publish directory**: `docs`
   - **Build command**: (leave empty)
4. Click **Deploy site**

### Step 3: Get Your URL

Netlify will provide a URL like:
```
https://random-name-123.netlify.app/privacy-policy.html
```

Or set a custom domain:
```
https://glean-clipper-privacy.netlify.app/privacy-policy.html
```

---

## Option 3: Vercel (Free & Fast)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (free)
3. Authorize Vercel to access your repositories

### Step 2: Deploy

1. Click **Add New Project**
2. Select your repository: `glippy-glean-web-clipper`
3. Configure:
   - **Root Directory**: `docs`
   - **Framework Preset**: Other
4. Click **Deploy**

### Step 3: Get Your URL

Vercel will provide a URL like:
```
https://glippy-glean-web-clipper.vercel.app/privacy-policy.html
```

---

## Option 4: Your Own Domain

If you have your own domain:

1. Upload `docs/privacy-policy.html` to your web server
2. Place it at a public URL like:
   - `https://yourdomain.com/privacy-policy.html`
   - `https://yourdomain.com/glean-clipper/privacy-policy.html`
3. Ensure it's accessible without authentication

---

## Option 5: GitHub Raw File (Not Recommended)

While you can use GitHub's raw file URL:
```
https://raw.githubusercontent.com/jessemcnew/glippy-glean-web-clipper/main/docs/privacy-policy.html
```

**This is NOT recommended** because:
- Raw files are plain HTML without styling
- Chrome Web Store prefers properly hosted pages
- May not meet Chrome Web Store requirements

---

## Quick Setup (GitHub Pages)

**Fastest method - just run these commands:**

```bash
# Make sure you're in the project root
cd /Users/jmcnew/glippy

# The privacy-policy.html file is already in docs/
# Just commit and push:
git add docs/privacy-policy.html docs/PRIVACY_POLICY_HOSTING.md
git commit -m "Add privacy policy HTML for Chrome Store hosting"
git push origin main

# Then enable GitHub Pages in repository settings:
# Settings → Pages → Source: main branch, /docs folder
```

After pushing, enable GitHub Pages in the GitHub UI, and your privacy policy will be live at:
```
https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html
```

---

## Verification Checklist

Before submitting to Chrome Web Store, verify:

- [ ] Privacy policy URL is publicly accessible
- [ ] Page loads without errors
- [ ] Content is readable and properly formatted
- [ ] URL uses HTTPS (required by Chrome Web Store)
- [ ] Page doesn't require authentication
- [ ] Mobile-friendly (responsive design)

---

## Chrome Web Store Submission

When submitting your extension:

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item** or edit your extension
3. In the **Privacy** section, enter your privacy policy URL
4. Example: `https://jessemcnew.github.io/glippy-glean-web-clipper/privacy-policy.html`
5. Complete the rest of the submission form
6. Submit for review

---

## Updating the Privacy Policy

If you need to update the privacy policy:

1. Edit `docs/privacy-policy.html`
2. Update the "Last Updated" date
3. Commit and push to GitHub
4. GitHub Pages will automatically update (may take a few minutes)

---

## Troubleshooting

### GitHub Pages not working?
- Check repository is public (or you have GitHub Pro)
- Verify `/docs` folder exists
- Check Pages settings: Source = `main` branch, `/docs` folder
- Wait 2-3 minutes after enabling

### Page shows 404?
- Verify file is at `docs/privacy-policy.html`
- Check file name is exactly `privacy-policy.html` (lowercase, with hyphen)
- Clear browser cache

### Styling not working?
- Check HTML file is valid
- Verify CSS is embedded in `<style>` tag (it is)
- Try opening file directly in browser to test

---

## Recommended: GitHub Pages

**We recommend GitHub Pages** because:
- ✅ Free
- ✅ Automatic HTTPS
- ✅ Easy to update (just push to GitHub)
- ✅ Reliable and fast
- ✅ No additional services needed
- ✅ Works with your existing repository

---

*Last Updated: December 11, 2025*
