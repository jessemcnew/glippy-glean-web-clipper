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

### 4. Configure Issue Linking

Linear will automatically detect issue references in commit messages:
- Format: `[GLE-XXX]` in commit message
- Example: `feat(extension): Add keyboard shortcuts [GLE-8]`

**Auto-linking works when:**
- Commit message contains `[GLE-XXX]` pattern
- Repository is connected in Linear
- Integration is enabled

### 5. Verify Setup

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

