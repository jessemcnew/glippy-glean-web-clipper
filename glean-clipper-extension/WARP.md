Glean Web Clipper Extension — WARP Project File (Merged)

Project Status: Active Development — Auth + Hosted Page + Worker Pipeline Last Updated: October 7, 2025 Current Focus: Dual-auth (OAuth + Indexing token), hosted page MVP, index → add-to-collection flow

Snapshot

Thin Chrome extension captures url/selection/screenshot → POST /api/clip → opens hosted /clip/:id
Backend workers index the content (Indexing API, server token), then add to the user’s Collection (Client API OAuth), then generate templates/summaries.
MCPs are build-time only (scaffolding, tests, PRs); not used in runtime flow.

Key environment specifics (preserved)

Extension Domain (instance): linkedin-be.glean.com
Example target Collection ID: 14191 (from collection URL; replace per user)
Client API requirement: per-user OAuth tokens for user-owned actions
Indexing API requirement: server-side Glean-issued token (service account)
Legacy note: CUSTOMWEBCLIPPER and Martechncrm datasources exist with URL constraints; avoid using business datasources for generic web clips

Architecture and auth

Glean Indexing API (server-side only)
Base: https://linkedin-be.glean.com/api/index/v1
Header: Authorization: Bearer GLEAN_INDEXING_TOKEN
Purpose: indexdocument/indexdocuments
Glean Client API (per-user OAuth)
Base: https://linkedin-be.glean.com/rest/api/v1
Headers:
Authorization: Bearer <USER_ACCESS_TOKEN>
X-Glean-Auth-Type: OAUTH
Purpose: addcollectionitems and other user-owned operations

Canonical runtime flow

Extension → POST /api/clip with Idempotency-Key
Backend enqueues index-and-collect job and returns { clipId, hostedUrl }
Worker:
Index to Glean (server token) → persist glean_document_id
Add to collection via OAuth: POST /rest/api/v1/addcollectionitems with gleanDocumentId and collectionId (e.g., 14191)
Generate templates/summaries → status template_ready
Hosted page polls GET /api/clip/:id and shows statuses

Why we don’t lose Collections-only

We keep Collections, but we add items by gleanDocumentId (not bare URLs) to get integrated previews.
If indexing is disabled by feature flag, fallback to link-only add (use with caution; preview may be limited).

Preserved ADR and discoveries

Original approach: Document Indexing (direct) — issues encountered

Datasource permission complexity; URL scoping (e.g., Martechncrm restricts to LinkedIn CRM URLs)
Risk of contaminating business datasources with generic web content

Current approach: Index first, then Collections

Benefits:
Integrated previews in Collections (since the document exists in the index)
Clear ownership: user’s OAuth adds the item to their collection
Simpler permissions model for user-visible actions

Runtime vs build-time rules

Runtime (prod flow)
No MCPs. All Glean calls via backend.
No secrets in the extension. OAuth handled via PKCE; tokens stored server-side (encrypted).
Build-time (dev assist only)
Allowed MCPs: github/git, playwright/puppeteer, browser-tools, filesystem, sequential-thinking, memory, glean (exploration)
Use cases: scaffolds, tests, fixtures, draft PRs. Review diffs before merge.

APIs and payloads (authoritative)

Backend contracts

POST /api/clip
Headers: Idempotency-Key, Authorization (session/cookie)
Body:
url, title?, selection?, screenshotUrl?, collectionId? (default to 14191 if set per-user)
Returns: { clipId, hostedUrl, status }
GET /api/clip/:id
Returns: { status, gleanDocumentId?, collectionItemId?, activity[], error? }

Glean calls

Indexing
POST https://linkedin-be.glean.com/api/index/v1/indexdocument
Header: Authorization: Bearer GLEAN_INDEXING_TOKEN
Body (shape depends on your datasource/config; typical):
document: { datasource, objectType, id, title, body: { mimeType, textContent }, viewURL, permissions }
Collections
POST https://linkedin-be.glean.com/rest/api/v1/addcollectionitems
Headers:
Authorization: Bearer <USER_ACCESS_TOKEN>
X-Glean-Auth-Type: OAUTH
Body (add by gleanDocumentId):
{ collectionId: "14191", items: [{ gleanDocumentId: "", description?: "..." }] }

Config examples (preserved)

Extension settings (local)

{
  "domain": "linkedin-be.glean.com",
  "collectionId": "14191",
  "enabled": true
}


Server env (no secrets in extension)

GLEAN_INDEXING_TOKEN=...
GLEAN_CLIENT_BASE=https://linkedin-be.glean.com
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...   # if applicable (PKCE can avoid storing secret client-side)
OAUTH_REDIRECT_URI=https://yourapp.com/auth/callback


Curl checks (dev only)

Collections (link-only fallback)
curl -X POST "https://linkedin-be.glean.com/rest/api/v1/addcollectionitems" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "X-Glean-Auth-Type: OAUTH" \
  -H "Content-Type: application/json" \
  -d '{"collectionId":"14191","items":[{"url":"https://example.com","title":"Test"}]}'

Collections (preferred, after indexing)
curl -X POST "https://linkedin-be.glean.com/rest/api/v1/addcollectionitems" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "X-Glean-Auth-Type: OAUTH" \
  -H "Content-Type: application/json" \
  -d '{"collectionId":"14191","items":[{"gleanDocumentId":"gdoc_abc"}]}'


Developer routine (start/end)

Start work

Pull main; branch feature/-
Run services; complete OAuth once via /auth/login
Sanity: POST /api/clip with Idempotency-Key; open hosted /clip/:id

Focus order

Auth: PKCE + refresh-once + re-auth UX
Hosted page: statuses, activity log, retry button
Worker: retries, 429 handling, idempotency; feature flag for link-only fallback
Templates: generate and display artifacts

End work

One clip flows end-to-end
Draft PR with test steps and any env/migration notes
Linear updated with next concrete step

Do/Don’t (guardrails)

Do index first, then add to collection by gleanDocumentId for previews.
Do keep Indexing token server-only; redact headers in logs.
Don’t use business datasources for generic web clips.
Don’t embed long-lived secrets in the extension.

If you want, I can also generate incremental diffs to your original WARP.md rather than a full replacement, but this merged file should keep the important domain/collection context intact.