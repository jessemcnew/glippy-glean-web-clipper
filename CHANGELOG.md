# Changelog

All notable changes to Glippy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Radial command menu for text selection with 4 actions:
  - Clip Text (scissors icon) - clips highlighted text
  - Clip Page (file-text icon) - clips full page content
  - Clip URL (link icon) - saves URL as bookmark
  - Search Glean (search icon) - opens Glean search with selected text
- Menu features: zinc theme, glass-morphism effects, 48px buttons, 90px radius
- Dismissible tooltip with "Don't show again" option (localStorage)
- Escape key and click-outside to close
- Onboarding walkthrough for new users
- Feedback modal with GitHub issue pre-fill

### Changed
- Dashboard rebuilt with three-panel collapsible layout
- Connection status indicator in popup and dashboard

## [0.1.0] - 2024-12-12

### Added
- Initial Chrome extension with Manifest V3
- Popup UI with modern design (light/dark theme support)
- Dashboard with clips library and reader pane
- Glean Collections API integration
- Command palette (Cmd+K) with keyboard shortcuts
- Content clipping (selection and URL modes)
- Chrome storage for local clip management
- Privacy policy and Chrome Web Store documentation

### Security
- All API calls routed through service worker (CORS handling)
- No remote code execution
- CSP-compliant dashboard bundling
- Token storage in chrome.storage.local only

---

## Version Format

- **MAJOR**: Breaking changes or major feature releases
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Sync with manifest.json

The version in `glean-clipper-extension/manifest.json` must match the latest release version.

Current: `0.1.0`
