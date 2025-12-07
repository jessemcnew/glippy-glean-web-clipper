# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-XX

### Added
- **Keyboard Shortcuts**: Primary clipping method with `Cmd/Ctrl+K` for selection/page and `Cmd/Ctrl+Shift+K` for full page
- **Quick Clip Button**: One-click page clipping from extension popup
- **Mock API Mode**: Developer mode for offline testing without VPN/API access
- **Token Type Detection**: Proper handling of Glean-issued vs OAuth tokens with `X-Glean-Auth-Type` header
- **Feed-Style Clip Previews**: Modern UI with larger favicons, bold titles, and detailed metadata (domain, time, word count)
- **Toast Notifications**: Visual feedback for keyboard shortcut clips
- **Improved Error Messages**: Network vs authentication error distinction with helpful troubleshooting tips
- **Less Intrusive Floating Button**: Only appears with modifier keys by default

### Changed
- **Clipping Workflow**: Keyboard shortcuts are now the primary method (replacing floating button)
- **Floating Button**: Now requires modifier key (Shift/Alt/Ctrl/Cmd) to appear, making it less intrusive
- **Error Handling**: Network errors now queue clips for retry instead of marking as failed
- **UI Design**: Clip previews redesigned to feed-style layout with better visual hierarchy

### Fixed
- **Token Type Header**: Fixed `X-Glean-Auth-Type: OAUTH` header not being set for OAuth tokens
- **Mock Mode Sync**: Fixed clips failing to sync in mock mode due to missing default `apiToken`
- **Keyboard Shortcut Scope**: Fixed `ReferenceError` when clipping page without selection via keyboard shortcut

### Documentation
- Added `CLIPPING_METHODS.md` - Guide to modern clipping workflow
- Added `PHASE1_IMPLEMENTATION.md` - Detailed implementation summary
- Added `TESTING_GUIDE.md` - Comprehensive testing instructions

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of Glean Web Clipper
- Basic clipping functionality
- Glean Collections API integration
- Extension popup UI
- Local clip storage

[1.1.0]: https://github.com/jessemcnew/glippy-glean-web-clipper/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jessemcnew/glippy-glean-web-clipper/releases/tag/v1.0.0

