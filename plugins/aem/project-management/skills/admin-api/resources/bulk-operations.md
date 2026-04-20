# Bulk Operations

Trigger preview, publish, or status checks across multiple paths in a single Admin API call. Bulk preview/publish are async — they return a job ID and complete in the background. Bulk status completes synchronously and returns results inline.

## When to Use

- Previewing or publishing an entire folder or section
- Propagating a template or shared component change across many pages
- Releasing a campaign where multiple pages go live together
- Auditing publish state across a set of pages before a release
- Detecting stale pages (preview ahead of live, or edit ahead of preview)

## Limitation — DA (markup) mountpoints

**Wildcard bulk operations are NOT supported on sites using DA (Document Authoring) as the content source.** The API returns `wildcard paths are not supported with a markup mountpoint`.

Check the mountpoint type first:
```bash
curl -s -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/sites/${SITE}.json" | python3 -m json.tool
```

| `content.source.type` | Bulk wildcard supported? |
|---|---|
| `markup` (DA) | ❌ No — use DA bulk publish UI or AEM Sidekick |
| `onedrive` (SharePoint) | ✅ Yes |
| `google` (Google Drive) | ✅ Yes |

## Auth

Bulk preview/publish fetch content from DA — use IMS Bearer token with content-source header:
```
authorization: Bearer ${IMS_TOKEN}
x-content-source-authorization: Bearer ${IMS_TOKEN}
```

Bulk status reads from the content bus cache — same IMS Bearer token works, no DA fetch required.

---

## Bulk Preview

Triggers preview refresh for a set of paths or an entire folder. The JSON body determines scope:

| Body | Behaviour |
|---|---|
| `{"paths": ["/en/help-center/*"]}` | Recursively previews all pages under that folder |
| `{"paths": ["/en/about", "/ar/about"]}` | Previews only those explicit paths |
| No body | Previews **all pages on the site** |

```bash
# Folder prefix (most common — populate from user input)
PATHS_JSON='{"paths": ["{user-provided-folder}/*"]}'

# Explicit paths
PATHS_JSON='{"paths": ["{path1}", "{path2}"]}'

RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PATHS_JSON}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/preview/${ORG}/${SITE}/${REF}/*")

# Full site — omit body entirely
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/preview/${ORG}/${SITE}/${REF}/*")
```

**On success (202):** Returns a job object with `job.name`.

**Recommended next actions:**
1. `get job status {job.name}` — monitor progress (topic: `preview`)
2. `get job details {job.name}` — once stopped, review per-path results for any failures
3. `bulk publish` — after preview completes and content is approved

---

## Bulk Publish

Promotes a list of previewed paths to the live CDN.

**Important:**
- Only paths that have been previewed will be published. Unpreviewed paths are skipped.
- **Wildcard paths (`/en/*`) are NOT supported** — the API returns `bulk-publish does not support publishing of subtrees due to security reasons`. Use explicit paths only.
- To get the list of paths under a folder, run `bulk preview {folder}/*` first and extract paths from the job details.

```bash
# Build PATHS_JSON from explicit paths provided by the user at runtime
PATHS_JSON='{"paths": ["{path1}", "{path2}", "{path3}"]}'

RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PATHS_JSON}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/live/${ORG}/${SITE}/${REF}/*")
```

**On success (202):** Returns a job object with `job.name`.

**Recommended next actions:**
1. `get job status {job.name}` — monitor progress (topic: `publish`)
2. `get job details {job.name}` — once stopped, surface any failed paths
3. `purge cache {path}` — for any pages that still show stale content after publishing

---

---

## Bulk Status

Returns preview and publish state across multiple paths or an entire folder. **Works on DA (markup) mountpoints** — no wildcard URL restriction.

**Trigger phrases:** "bulk status", "check status of multiple pages", "which pages are stale", "audit publish state", "bulk status /en/*"

### Path formats supported

| Input | Behaviour | Response |
|---|---|---|
| Explicit paths: `["/path/one", "/path/two"]` | Synchronous — results inline in response | HTTP 200, results in `job.data.resources[]` |
| Wildcard folder: `["/en/*"]` | Async — recursively processes entire folder | HTTP 202, poll via `get job status {jobName}` |

```bash
# Build PATHS_JSON from paths provided by the user at runtime
# Wildcard example:
PATHS_JSON='{"paths": ["{user-provided-folder}/*"]}'
# Explicit paths example:
PATHS_JSON='{"paths": ["{path1}", "{path2}"]}'

RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PATHS_JSON}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/status/${ORG}/${SITE}/${REF}/*")
```

**On success (200) — explicit paths:** Parse `job.data.resources[]` and display a table:

| Path | Preview Last Modified | Publish Last Modified | Modified By |
|---|---|---|---|
| `{path}` | `{previewLastModified}` | `{publishLastModified}` | `{publishLastModifiedBy}` |

If a path is absent from `resources[]`, it has no preview or publish record (never previewed/published).

**On success (202) — wildcard:** Job started. Extract `job.name` and monitor via `resources/jobs.md`.

**Diagnosing from results:**

| Condition | Recommended action |
|---|---|
| Path missing from results | `preview {path}` — page not previewed yet |
| `previewLastModified` > `publishLastModified` | `publish {path}` — preview is ahead of live |
| Both timestamps match | No action needed — page is in sync |

**Recommended next actions:**
- Wildcard job: `get job status {jobName}` — monitor progress, then `get job details {jobName}` for per-path results
- Explicit results: `preview {path}` or `publish {path}` on any stale pages identified
- `bulk preview` or `bulk publish` — if multiple pages need the same action

---

## Success Criteria

- ✅ Bulk preview/publish: HTTP 202 received, job name extracted, user directed to `resources/jobs.md`
- ✅ Bulk status: HTTP 200 received, per-path table displayed, stale pages flagged
