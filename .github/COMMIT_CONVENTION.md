# Commit Message Convention

This project uses Linear as the source of truth (SOT) for issue tracking. All commits should reference Linear issues when applicable.

## Format

```
<type>(<scope>): <subject> [GLE-XXX]

<body>

<footer>
```

## Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (version bumps, dependencies, etc.)

## Linear Issue References

Always include Linear issue IDs in commit messages:

- **In subject**: `[GLE-XXX]` at the end
- **In body**: Full Linear issue link for context

## Examples

### Feature with Linear reference
```
feat(extension): Add keyboard shortcuts for clipping [GLE-8]

Implements Cmd/Ctrl+K for quick clipping as primary workflow.
Replaces floating button as default method.

Related: https://linear.app/glean-clipper/issue/GLE-8
```

### Bug fix with Linear reference
```
fix(api): Set X-Glean-Auth-Type header for OAuth tokens [GLE-5]

Fixed issue where OAuth tokens weren't properly identified.
Now correctly sets X-Glean-Auth-Type: OAUTH header.

Related: https://linear.app/glean-clipper/issue/GLE-5
```

### Chore with Linear reference
```
chore: Bump version to 1.1.0 and add CHANGELOG [GLE-14]

- Update manifest.json version to 1.1.0
- Update package.json version to 1.1.0
- Add CHANGELOG.md with Phase 1 release notes

Related: https://linear.app/glean-clipper/issue/GLE-14
```

## Multiple Issues

If a commit addresses multiple Linear issues:

```
feat(extension): Modern clipping workflow [GLE-8, GLE-9]

Implements keyboard shortcuts and feed-style UI improvements.

Related:
- https://linear.app/glean-clipper/issue/GLE-8
- https://linear.app/glean-clipper/issue/GLE-9
```

## No Linear Issue

If a commit doesn't relate to a Linear issue (rare):

```
chore: Update dependencies

Update eslint and prettier to latest versions.
```

## Benefits

- **Traceability**: Easy to link commits to Linear issues
- **Context**: Full issue details available from commit
- **History**: Complete project history in both Linear and Git
- **SOT**: Linear remains source of truth, Git references it

