# Linear GitHub Integration Setup Guide

This guide walks you through enabling Linear's built-in GitHub integration for automatic commit linking and issue sync.

## Benefits

Once enabled, Linear will automatically:
- ✅ Link commits to Linear issues when you include `[GLE-XXX]` in commit messages
- ✅ Show commit history in Linear issues
- ✅ Update issue status based on PR merges (optional)
- ✅ Display GitHub PRs in Linear issues
- ✅ Sync bidirectionally between Linear and GitHub

## Setup Steps

### 1. Open Linear Settings

1. Go to [Linear](https://linear.app)
2. Click your profile icon (top right)
3. Select **Settings**
4. Navigate to **Integrations** in the left sidebar
5. Find **GitHub** in the integrations list

### 2. Connect GitHub Account

1. Click **Connect** or **Configure** next to GitHub
2. Authorize Linear to access your GitHub account
3. Grant necessary permissions:
   - ✅ Read access to repositories
   - ✅ Write access to issues (optional, for bidirectional sync)

### 3. Connect Repository

1. In the GitHub integration settings, click **Add Repository**
2. Search for: `jessemcnew/glippy-glean-web-clipper`
3. Select the repository
4. Choose sync options:
   - ✅ **Link commits to issues** (when commit messages include `[GLE-XXX]`)
   - ✅ **Show PRs in Linear** (optional)
   - ✅ **Update issue status on PR merge** (optional)

### 4. Enable Commit Linking (Magic Words)

**On the GitHub integration settings page you're viewing:**

1. Scroll down to the section **"Link commits to issues with magic words"**
2. **Toggle the switch ON** (it should turn blue when enabled)
3. This enables automatic commit linking

**Important Note on Magic Words Format:**

Linear's default magic words are:
- `Fixes ID-123` or `Part of ID-123` (where `ID-123` is the issue identifier)

However, we use bracket notation: `[GLE-XXX]`

**You have two options:**

**Option A: Use Linear's default format** (recommended for auto-linking)
- Change commit format to: `feat(extension): Add keyboard shortcuts Fixes GLE-8`
- Or: `feat(extension): Add keyboard shortcuts Part of GLE-8`

**Option B: Keep bracket format** (may require manual linking)
- Keep using: `feat(extension): Add keyboard shortcuts [GLE-8]`
- Commits may not auto-link, but you can manually link them
- The Git hook and GitHub Action will still extract `[GLE-XXX]` references

**Recommendation:** Try Option A first to see if Linear recognizes `Fixes GLE-8` or `Part of GLE-8` format. If it works, we can update our commit convention.

### 5. Set Up GitHub Webhook

**Linear will show a modal with webhook setup instructions. Follow these steps:**

1. **Copy the webhook details** from the Linear modal:
   - Payload URL (starts with `https://client-api.linear.app/connect/github...`)
   - Secret (a long hexadecimal string)

2. **Open GitHub in a new tab**:
   - Go to: `https://github.com/jessemcnew/glippy-glean-web-clipper/settings/hooks`
   - Or: Repository → Settings → Webhooks

3. **Add the webhook**:
   - Click **"Add webhook"** button (top right)
   - Paste the **Payload URL** from Linear
   - Set **Content type** to: `application/json`
   - Paste the **Secret** from Linear
   - **Leave all other settings as default** (don't change events, SSL verification, etc.)
   - Click **"Add webhook"**

4. **Verify webhook is active**:
   - You should see a green checkmark next to the webhook
   - Linear will receive commit/PR events from GitHub

**Note:** If you plan to link multiple repositories, set up the webhook at the **organization level** instead:
- Go to: `https://github.com/organizations/jessemcnew/settings/hooks`
- Follow the same steps above

### 6. Verify Setup

1. Make a test commit with Linear reference:
   ```bash
   git commit -m "test: Verify Linear integration [GLE-15]"
   ```

2. Push to GitHub:
   ```bash
   git push origin phase-1-implementation
   ```

3. Check Linear issue GLE-15:
   - Should show the commit in the issue's activity
   - Commit should be linked automatically

## Repository URL

**GitHub Repository**: `https://github.com/jessemcnew/glippy-glean-web-clipper`

**Linear Workspace**: `glean-clipper` (or your workspace name)

## Current Commit Format

Our commits already follow the format Linear expects:
```
<type>(<scope>): <subject> [GLE-XXX]
```

Examples:
- `feat(extension): Add keyboard shortcuts [GLE-8]`
- `fix(api): Set OAuth header [GLE-5]`
- `chore: Bump version [GLE-14]`

## Troubleshooting

### Commits Not Linking

1. **Check integration is enabled**: Linear Settings → Integrations → GitHub
2. **Verify repository is connected**: Should show `glippy-glean-web-clipper` in connected repos
3. **Check commit format**: Must include `[GLE-XXX]` pattern
4. **Wait a few minutes**: Linear syncs periodically, not instantly

### Integration Not Available

- Ensure you have admin/owner permissions in Linear workspace
- Check if GitHub integration is enabled for your Linear plan
- Contact Linear support if integration option is missing

## Alternative: Manual Linking

If integration isn't available, you can manually link:
1. Open Linear issue
2. Click "Add link" or "Connect"
3. Paste GitHub commit URL or PR URL
4. Linear will show the connection

## Next Steps After Setup

1. ✅ Test with a commit: `git commit -m "test: Linear integration [GLE-15]"`
2. ✅ Push and verify commit appears in Linear issue
3. ✅ Create a PR and see it appear in Linear (if PR sync enabled)
4. ✅ Enjoy automatic linking going forward!

## Resources

- **Linear Integration Docs**: https://linear.app/docs/integrations/github
- **Linear Settings**: https://linear.app/settings/integrations/github
- **Our Commit Convention**: `.github/COMMIT_CONVENTION.md`

