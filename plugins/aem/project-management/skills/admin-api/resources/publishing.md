# Publishing Operations

Manage content across the preview and live CDN layers for a single path, and inspect page state across all layers.

## When to Use

- Pushing authored content to the preview CDN
- Promoting a previewed page to the live CDN
- Taking a page down from live (unpublish)
- Checking or deleting preview/live state of a specific path
- Diagnosing stale content — comparing edit / preview / live timestamps

## Auth

| Operation | Headers required |
|---|---|
| Preview (trigger/delete) | `authorization: Bearer ${IMS_TOKEN}` + `x-content-source-authorization: Bearer ${IMS_TOKEN}` |
| Publish / Unpublish | `authorization: Bearer ${IMS_TOKEN}` + `x-content-source-authorization: Bearer ${IMS_TOKEN}` |
| Get preview status | `authorization: token ${AUTH_TOKEN}` |
| Get live status | `authorization: token ${AUTH_TOKEN}` |

---

## Preview

Triggers the AEM backend to fetch the latest content from the authoring system and render it to the preview CDN.

**When:** Author finished editing, developer wants to validate content, preview URL is stale.

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/preview/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200 / 201):**
```
Preview URL: https://{ref}--{site}--{org}.aem.page{path}
```

**Recommended next actions:**
1. Open the preview URL to review content
2. `publish {path}` — when approved, promote to live
3. `status {path}` — verify timestamps if something looks off

---

## Get Preview Status

Returns the current state of a path on the preview CDN without triggering a refresh.

**When:** Checking whether a preview already exists before pushing, confirming a preview completed.

```bash
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/preview/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200):** Show `preview.url`, `preview.lastModified`, and `preview.status` from the response.

**Recommended next actions:**
- If preview exists and looks good: `publish {path}`
- If preview is stale (edit newer than preview): `preview {path}` to refresh
- If 404: `preview {path}` — no preview has been triggered yet

---

## Delete Preview

Removes a path from the preview CDN. Does not affect the live CDN or the authoring source.

**When:** Cleaning up a stale or incorrect preview, removing a page that should not be visible on preview.

```bash
RESPONSE=$(curl -s -X DELETE \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/preview/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200 / 204):**
```
Preview deleted. Path returns 404 on preview CDN.
Live CDN is unaffected.
```

**Recommended next actions:**
1. `status {path}` — confirm preview layer shows 404
2. `unpublish {path}` — if live CDN also needs to come down

---

## Publish

Promotes the current preview version to the production CDN.

**When:** Content previewed and approved, urgent fix must go out.

**Important:** Publish promotes whatever is in preview. If preview is stale, run Preview first.

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/live/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200 / 201):**
```
Live URL: https://main--{site}--{org}.aem.live{path}
```

**Recommended next actions:**
1. Open the live URL to confirm — CDN propagation takes up to 60 seconds
2. `purge cache {path}` — if live URL still shows old content after 60 seconds
3. `status {path}` — verify `live.lastModified` updated correctly

---

## Unpublish

Removes a page from the production CDN (visitors see 404). Preview layer is unaffected.

**When:** Page must come down immediately (legal, recalled product, ended campaign).

```bash
RESPONSE=$(curl -s -X DELETE \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/live/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200 / 204):**
```
{path} now returns 404 on live CDN.
Preview still available at: https://{ref}--{site}--{org}.aem.page{path}
```

**Recommended next actions:**
1. `remove from index {path}` — remove from search index so it stops appearing in results
2. `delete preview {path}` — if preview also needs to be removed
3. `status {path}` — confirm live layer shows 404

---

## Get Live Status

Returns the current publish state of a path without triggering a publish.

**When:** Confirming whether a page is live, checking publish timestamp in isolation.

```bash
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/live/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200):** Show `live.url`, `live.lastModified`, and `live.status` from the response.

**Recommended next actions:**
- If live is behind preview: `publish {path}` to promote latest preview
- If browser shows stale content: `purge cache {path}`
- If 404: `publish {path}` — page has not been published yet

---

---

## Status

Returns the current state of a page across edit / preview / live layers with `lastModified` timestamps.

**When:** Diagnosing stale content, auditing publish state, confirming an operation succeeded.

```bash
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/status/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200):** Display a status summary using the full URLs from the response (`preview.url` and `live.url`). Use `preview.url` as the heading — not the short path.

```
Status of https://{ref}--{site}--{org}.aem.page{path}

| Layer   | Status | Last Modified          |
|---------|--------|------------------------|
| Preview | ✅ 200 | {preview.lastModified} |
| Live    | ✅ 200 | {live.lastModified}    |
| Edit    | —      | {edit.lastModified or "No data"} |
```

Then diagnose and recommend the specific command to run:

| Condition | Recommended action |
|---|---|
| `edit.lastModified` > `preview.lastModified` | `preview {path}` — content changed since last preview |
| `preview.lastModified` > `live.lastModified` | `publish {path}` — preview is ahead of live |
| Timestamps match but browser shows old content | `purge cache {path}` |
| `live.status` = 404 | `publish {path}` — page is not live yet |
| All in sync | No action needed — page is up to date |

**Recommended next actions:**
- `preview {path}` — if edit is ahead of preview
- `publish {path}` — if preview is ahead of live
- `purge cache {path}` — if timestamps match but browser shows stale content

---

## Success Criteria

- ✅ HTTP 200, 201, or 204 received
- ✅ Result URL shown to user (preview or live)
- ✅ Recommended next actions communicated
