# Privacy Policy for Glean Web Clipper

**Last Updated: December 2024**

## Overview

Glean Web Clipper ("the Extension") is a browser extension that allows users to save web content to their Glean knowledge base. This privacy policy explains how we handle user data.

## Data Collection and Use

### Data Stored Locally

The Extension stores the following data **locally on your device** using Chrome's storage API:

- **Clips**: Web page URLs, titles, selected text, and metadata you choose to save
- **Configuration**: Your Glean API tokens, domain settings, and collection preferences
- **Saved Prompts**: Prompts you create and save for future use
- **Auto Collections Rules**: Rules you configure for automatically organizing clips

**This data is stored only on your device and is never transmitted to us or any third party except Glean when you explicitly sync clips.**

### Data Transmitted to Glean

When you choose to sync clips to Glean:
- Clip content (title, text, URL) is sent to your Glean instance
- Your Glean API token is used for authentication
- Data is sent only to the Glean domain you configure

**We do not have access to your Glean data or API tokens.**

### Data Transmitted to Slack (Optional)

If you choose to use the Slack integration:
- Clip content you select to share is sent to Slack
- Your Slack OAuth token is stored locally
- Data is sent only to Slack channels you select

**We do not have access to your Slack data or tokens.**

## Third-Party Services

### Glean

The Extension integrates with Glean, a knowledge management platform. When you sync clips:
- Data is sent directly to your Glean instance
- Authentication uses your Glean API credentials
- We do not intercept or store this data

### Slack (Optional)

The Extension can share clips to Slack if you connect your Slack workspace:
- Uses Slack OAuth for authentication
- Only shares content you explicitly choose to share
- We do not access your Slack data

## Permissions Usage

The Extension requests the following permissions:

- **activeTab**: To access the current tab's URL and title when clipping
- **storage**: To save clips and settings locally on your device
- **contextMenus**: To add right-click menu options for clipping
- **scripting**: To inject content scripts for text selection
- **identity**: For OAuth authentication with Glean (optional)
- **host_permissions**: To access web pages for clipping content

**All permissions are used solely for the Extension's core functionality.**

## Data Security

- All data is stored locally on your device
- API tokens are stored using Chrome's secure storage API
- Data transmitted to Glean/Slack uses HTTPS encryption
- We do not collect, store, or transmit any data to our servers

## User Rights

You have full control over your data:
- All clips are stored locally and can be deleted at any time
- You can disconnect Glean/Slack integrations at any time
- You can clear all extension data through Chrome's extension settings
- No data is collected without your explicit action

## Children's Privacy

The Extension is not intended for users under 13 years of age. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy. Changes will be posted with an updated "Last Updated" date.

## Contact

For questions about this privacy policy, please contact your Glean administrator or visit [Glean Support](https://developers.glean.com).

## Data Deletion

To delete all Extension data:
1. Open Chrome Settings → Extensions
2. Find "Glean Web Clipper"
3. Click "Remove" or use "Clear storage" option

All locally stored data will be permanently deleted.

---

**Note**: This Extension is a tool for saving content to your Glean knowledge base. All data remains under your control and is stored locally or sent only to services you explicitly configure.

