# Glippy - Glean Web Clipper

A Chrome extension and Next.js dashboard for clipping web content directly to your Glean Collections.

## 🚀 Features

- **Quick Clipping**: Select text on any webpage and save it to Glean
- **Context Menu Integration**: Right-click to clip selected text or entire pages
- **Smart Categorization**: Automatically categorizes content based on URL and content type
- **Tag Extraction**: Automatically identifies relevant tags from clipped content
- **Local Storage**: Works offline with local storage, syncs when connected
- **Glean Collections API**: Direct integration with Glean's Collections API
- **Modern Dashboard**: Next.js-based dashboard for managing your clips

## 📦 Project Structure

```
glippy/
├── glean-clipper-extension/    # Chrome extension
│   ├── manifest.json           # Extension manifest
│   ├── background.js           # Service worker with API logic
│   ├── content.js             # Content script for page interaction
│   ├── popup.html             # Extension popup interface
│   └── modules/               # Modular components
│
└── glean-dashboard/           # Next.js dashboard
    ├── src/
    │   ├── app/               # Next.js app directory
    │   └── lib/               # API utilities
    └── package.json
```

## 🛠️ Installation

### Prerequisites

1. **Glean Account**: You need an active Glean account with access to Collections
2. **API Token**: A Client API token with COLLECTIONS scope (NOT an Indexing API token)
3. **Collection ID**: The numeric ID of the collection you want to clip to
4. **Chrome Browser**: Version 88 or higher for Manifest V3 support

### Chrome Extension Setup

See the detailed installation instructions in [`glean-clipper-extension/README.md`](./glean-clipper-extension/README.md).

Quick start:
1. Get your Glean API token from Settings → API Tokens
2. Find or create a Collection ID
3. Load the extension from `chrome://extensions/` (Developer mode)
4. Configure the extension with your token and collection ID

### Dashboard Setup

```bash
cd glean-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📖 Usage

### Clipping Content

**Method 1: Toolbar Button**
1. Select text on any webpage
2. Click the Glean Clipper extension icon
3. The selected text is automatically clipped

**Method 2: Context Menu**
1. Select text on a webpage
2. Right-click and choose **"Clip to Glean Collection"**

**Method 3: Full Page Clip**
1. Right-click anywhere on a page (without selecting text)
2. Choose **"Clip entire page"**

## 🔧 Development

### Extension Development

```bash
cd glean-clipper-extension
npm install
npm run lint        # Check code quality
npm run lint:fix    # Auto-fix linting issues
npm run format      # Format code
```

### Dashboard Development

```bash
cd glean-dashboard
npm install
npm run dev         # Start development server
npm run build       # Build for production
```

## 📝 Documentation

- [Extension README](./glean-clipper-extension/README.md) - Detailed extension documentation
- [Changelog](./glean-clipper-extension/CHANGELOG.md) - Version history
- [Features](./glean-clipper-extension/FEATURES.md) - Feature documentation
- [Debugging Guide](./glean-clipper-extension/DEBUGGING_GUIDE.md) - Troubleshooting

## 🔐 Security

- API tokens are stored in Chrome's local storage (encrypted at rest on disk)
- Never commit API tokens to version control
- Use environment variables for test scripts
- Tokens are only sent to Glean's API endpoints

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for integration with [Glean](https://www.glean.com)
- Uses Next.js for the dashboard
- Chrome Extension Manifest V3

