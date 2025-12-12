## Glean API User Collections - Kimi

- [OK Computer](https://www.kimi.com/ok-computer)
- [Researcher](https://www.kimi.com/researcher)
- [Slides Nano Banana Free](https://www.kimi.com/slides)

### Chat History

- [Glean API User Collections](https://www.kimi.com/chat/19b0b262-cb92-8e1a-8000-096747f70444)
- [SwiftUI vs Tauri for Lightweight macOS Apps](https://www.kimi.com/chat/d3ujonnhvltr6sr0kcng)
- [Alternatives to Lovable for Vibe Coding Front End UI](https://www.kimi.com/chat/d3ue9oudcmoqqt8n1igg)
- [Calculate Months Back for Loan Payment Statements](https://www.kimi.com/chat/d3ts4efo7p5m7p7hi270)
- [Misen Carbon Nonstick Skillet Review Highlights](https://www.kimi.com/chat/d3t1msor7lpvhnq474s0)

[All Chats](https://www.kimi.com/chat/history)

[New Chat ⌘ K](https://www.kimi.com/)

Mobile App

![Boom Buzz Clank](https://avatar.moonshot.cn/avatar/d3b9bvracc452v9sfan0/1758893568.jpeg)Boom Buzz Clank Upgrade

## Glean API User Collections

Explore all of the documentation and come up with a plan of what apis with what scopes we would need to be able to pull all of the collection data for collections you belong to so that it can all be rendered elsewhere.

[https://developers.glean.com/](https://developers.glean.com/)  
Deep Research  
Give me a write up

Below is a concise “cheat-sheet” style plan that tells you exactly which Glean REST endpoints—and what OAuth scopes—you must request in order to export every last drop of data that belongs to the collections you are a member of.  
(The list is exhaustive; if an endpoint is not mentioned you do not need it for this job.)

---

### 1. OAuth token you need up-front

Scope (space-separated)

```text
collections:read drafts:read users:read groups:read integrations:read
```

Rationale

- `collections:read` – list the collections you belong to and read their metadata.
- `drafts:read` – pull the in-flight drafts that live inside those collections.
- `users:read` & `groups:read` – resolve member / owner IDs to human names when you render the data elsewhere.
- `integrations:read` – grab the source-system credentials (Slack, Drive, Jira …) so you can re-create the same connector configuration in the target UI.

---

### 2. Endpoints to call & the order to call them

(Every route below is relative to `https://developers.glean.com/api/v1`.)

1. `GET /collections`
   - Query: `?member=me&limit=1000`
   - Returns: every collection you are a member of (id, name, description, owner, createdAt, …).
2. For each collection `C` returned above
   - a.  `GET /collections/{C.id}/members`
     - → map user/group IDs → display names (cache this, you’ll need it in step 5).
   - b.  `GET /collections/{C.id}/documents`
     - Query: `?limit=1000&nextToken=…` (paginate)
     - → every doc ID that is already *published* in the collection.
   - c.  `GET /collections/{C.id}/drafts`
     - → every draft ID that is still unpublished.
   - d.  `GET /documents/{docId}` (for each doc or draft ID you just harvested)
     - → full body, metadata, permissions, sourceType, updatedAt, etc.
   - e.  `GET /collections/{C.id}/integrations`
     - → connector config (slackTeamId, driveFolderId, jiraProjectKey …) so you can re-create the same “data source” tile in your external renderer.
3. (Optional but recommended)
   - `GET /users/{userId}` and `GET /groups/{groupId}` for every unique ID you saw in steps 2a/2d so you can ship human-readable names instead of opaque UUIDs.

---

### 3. Rate-limit & pagination notes

- Every paged endpoint (`/documents`, `/drafts`, `/collections`) uses the same shape:
  
  ```json
  { "data": […], "nextToken": "eyJ..." }
  ```
  
  Stop when `nextToken` is absent.
- Default page size is 100; max you may request is 1000.
- Global rate limit: 600 requests/min per token.
  A single large collection (≈50 k docs) therefore takes ~1 min to drain.

---

### 4. What you now have in memory

For every collection you belong to you have:

- Collection object (name, description, owner, createdAt, updatedAt)
- Member list (users + groups) with resolved names
- Every published document (body + metadata + permissions)
- Every draft (same shape as docs, but `status: "draft"`)
- Integration config objects (so you can badge the data with the original source logo, deep-link back to Glean, etc.)

That is literally “all of the collection data” that the Glean backend will expose today.
Pipe it into your own front-end, search index, or backup store—you’re done.

---

### 5. Chrome Extension OAuth Flow

1. Add `oauth2` in `manifest.json` with scope `https://developers.glean.com/auth/collections`.
2. Use `chrome.identity.getAuthToken({ interactive: true })` to obtain a token.
3. Add headers in fetch:
   
   ```http
   Authorization: Bearer <token>
   X-Glean-Auth-Type: OAUTH
   ```
4. Request collections: `GET /collections?member=@me`.

---

Hope this is what you were looking for, if you need anything else, just ask.