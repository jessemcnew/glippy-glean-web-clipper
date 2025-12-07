# Linear Sync Strategy

This project uses **Linear as the Source of Truth (SOT)** for issue tracking and project management.

## Current Setup

### 1. Commit Message Validation (Husky Hook)

- **Location**: `.husky/commit-msg`
- **Purpose**: Warns if commit messages don't include Linear issue references
- **Behavior**: Non-blocking warning (doesn't prevent commits)
- **Format**: Validates `[GLE-XXX]` pattern in commit messages

### 2. GitHub Action (Linear Sync)

- **Location**: `.github/workflows/linear-sync.yml`
- **Purpose**: Extracts Linear issue IDs from commits and can sync to Linear
- **Status**: Placeholder - requires Linear API key or GitHub integration
- **Triggers**: On push to main, feature branches, etc.

### 3. AI Assistant (Cursor/Auto)

- **Current**: I (Auto) update Linear directly via MCP when working on issues
- **Process**: 
  - When implementing features → Update Linear issue status
  - When fixing bugs → Update Linear issue status
  - When creating releases → Create Linear release issue
  - All commits include `[GLE-XXX]` references

## Recommended Workflow

### For AI Assistant (Me)

1. **Before starting work**: Check Linear for issue status
2. **While working**: Update Linear issue as "In Progress"
3. **When committing**: Include `[GLE-XXX]` in commit message
4. **After completing**: Update Linear issue to "Done" with summary

### For Manual Commits

1. **Format commit**: `feat(scope): Description [GLE-XXX]`
2. **Include link**: Add Linear issue link in commit body
3. **Update Linear**: Manually update issue status in Linear if needed

## Full Automation Options

### Option 1: Linear GitHub Integration (Recommended)

Linear has built-in GitHub integration that can:
- Auto-link commits to issues
- Update issue status based on PR merges
- Show commit history in Linear issues

**Setup**: https://linear.app/settings/integrations/github

### Option 2: Linear API + GitHub Actions

1. Create Linear API key
2. Add to GitHub Secrets as `LINEAR_API_KEY`
3. Enhance `.github/workflows/linear-sync.yml` to:
   - Comment on Linear issues when commits reference them
   - Update issue status based on commit messages
   - Link commits to issues automatically

**API Docs**: https://developers.linear.app/docs

### Option 3: Linear Webhooks

Set up Linear webhooks to:
- Create GitHub issues from Linear issues
- Sync status changes bidirectionally
- Auto-update based on events

## Current Status

✅ **Commit validation** - Husky hook warns about missing Linear references  
✅ **Commit convention** - Documented in `.github/COMMIT_CONVENTION.md`  
✅ **CHANGELOG sync** - All changes reference Linear issues  
✅ **AI updates** - I update Linear directly when working  
⏳ **Auto-sync** - Placeholder GitHub Action (needs Linear API key or integration)

## Next Steps

1. **Enable Linear GitHub Integration** (easiest)
   - Go to Linear Settings → Integrations → GitHub
   - Connect repository
   - Enable auto-linking

2. **OR Set up Linear API** (more control)
   - Create API key in Linear
   - Add to GitHub Secrets
   - Enhance workflow to make API calls

3. **Keep current process** (works fine)
   - I continue updating Linear via MCP
   - Commits reference Linear issues
   - Manual updates when needed

## Benefits of Current Setup

- ✅ Linear remains SOT
- ✅ Full traceability (commits → Linear)
- ✅ I handle updates automatically
- ✅ Non-blocking validation (warnings only)
- ✅ Easy to enhance with full automation later

