# LinkedIn Profile Updater

Tool to update your LinkedIn profile using LinkedIn's official Profile Edit API.

## Prerequisites

1. **LinkedIn Developer Account**: Create an app at https://www.linkedin.com/developers/apps
2. **OAuth 2.0 Credentials**: Get your Client ID and Client Secret
3. **API Permissions**: Request access to Profile Edit API (requires LinkedIn approval)
4. **Access Token**: OAuth token with `w_member_social` and profile edit permissions

## Setup

1. Create a LinkedIn app at https://www.linkedin.com/developers/apps
2. Request access to Profile Edit API (may require approval)
3. Set up OAuth redirect URL (e.g., `http://localhost:3000/callback`)
4. Get your Client ID and Client Secret

## Configuration

Create a `.env` file:

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/callback
LINKEDIN_ACCESS_TOKEN=your_access_token
```

## Getting Started

### 1. Get OAuth Credentials

1. Go to https://www.linkedin.com/developers/apps
2. Create a new app or use an existing one
3. In "Auth" tab, add redirect URL: `http://localhost:3000/callback`
4. Copy your Client ID and Client Secret
5. Request access to Profile Edit API (may require LinkedIn approval)

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env and add your CLIENT_ID and CLIENT_SECRET
```

### 3. Get Access Token

```bash
npm run auth
```

This will:
- Start a local server
- Open LinkedIn authentication in your browser
- Exchange the authorization code for an access token
- Display the token (add it to your .env file)

### 4. Update Profile from Document

```bash
node index.js update path/to/your/document.txt
```

Or feed me a document and I can help parse it and update your profile!

## Usage Examples

```bash
# Get current profile
node index.js profile

# Update from document
node index.js update resume.txt
node index.js update profile-update.md
```

## Supported Profile Sections

The script can update:
- Languages
- Skills
- Positions (work experience)
- Education
- Courses
- Publications
- Projects
- Organizations
- Summary/Headline

## API Documentation

- [LinkedIn Profile Edit API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-edit-api)
- [OAuth 2.0 Authentication](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Profile API Reference](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api)

