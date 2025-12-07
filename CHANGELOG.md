# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-XX

### Added
- **Keyboard Shortcuts**: Primary clipping method with `Cmd/Ctrl+K` for selection/page and `Cmd/Ctrl+Shift+K` for full page ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))
- **Quick Clip Button**: One-click page clipping from extension popup ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))
- **Mock API Mode**: Developer mode for offline testing without VPN/API access ([GLE-6](https://linear.app/glean-clipper/issue/GLE-6))
- **Token Type Detection**: Proper handling of Glean-issued vs OAuth tokens with `X-Glean-Auth-Type` header ([GLE-5](https://linear.app/glean-clipper/issue/GLE-5))
- **Feed-Style Clip Previews**: Modern UI with larger favicons, bold titles, and detailed metadata (domain, time, word count) ([GLE-9](https://linear.app/glean-clipper/issue/GLE-9))
- **Toast Notifications**: Visual feedback for keyboard shortcut clips ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))
- **Improved Error Messages**: Network vs authentication error distinction with helpful troubleshooting tips ([GLE-7](https://linear.app/glean-clipper/issue/GLE-7))
- **Less Intrusive Floating Button**: Only appears with modifier keys by default ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))

### Changed
- **Clipping Workflow**: Keyboard shortcuts are now the primary method (replacing floating button) ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))
- **Floating Button**: Now requires modifier key (Shift/Alt/Ctrl/Cmd) to appear, making it less intrusive ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))
- **Error Handling**: Network errors now queue clips for retry instead of marking as failed ([GLE-7](https://linear.app/glean-clipper/issue/GLE-7))
- **UI Design**: Clip previews redesigned to feed-style layout with better visual hierarchy ([GLE-9](https://linear.app/glean-clipper/issue/GLE-9))

### Fixed
- **Token Type Header**: Fixed `X-Glean-Auth-Type: OAUTH` header not being set for OAuth tokens ([GLE-5](https://linear.app/glean-clipper/issue/GLE-5))
- **Mock Mode Sync**: Fixed clips failing to sync in mock mode due to missing default `apiToken` ([GLE-6](https://linear.app/glean-clipper/issue/GLE-6))
- **Keyboard Shortcut Scope**: Fixed `ReferenceError` when clipping page without selection via keyboard shortcut ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))

### Documentation
- Added `CLIPPING_METHODS.md` - Guide to modern clipping workflow ([GLE-8](https://linear.app/glean-clipper/issue/GLE-8))
- Added `PHASE1_IMPLEMENTATION.md` - Detailed implementation summary
- Added `TESTING_GUIDE.md` - Comprehensive testing instructions

### Release
- **v1.1.0 Release**: Phase 1 complete with all features implemented and tested ([GLE-14](https://linear.app/glean-clipper/issue/GLE-14))

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of Glean Web Clipper
- Basic clipping functionality
- Glean Collections API integration
- Extension popup UI
- Local clip storage

[1.1.0]: https://github.com/jessemcnew/glippy-glean-web-clipper/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jessemcnew/glippy-glean-web-clipper/releases/tag/v1.0.0

