# Index Management

Manage the AEM search index for published content. Only relevant for projects using the AEM Query Index feature (`query-index.json`).

## When to Use

- A published page is not appearing in search results
- Removing a deleted or unpublished page from the index
- Forcing a reindex after content changes that didn't trigger automatic indexing
- Reindexing an entire folder or all published pages in bulk

**Do NOT use if the project does not have a `query-index.json` — indexing has no effect without it.**

## Auth

Index operations use IMS Bearer token:
```
authorization: Bearer ${IMS_TOKEN}
x-content-source-authorization: Bearer ${IMS_TOKEN}
```

---

## Reindex a Resource

Forces the indexer to re-process a published path and update its index entry.

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/index/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200):** Path has been queued for reindex. Results may take a few minutes to appear in search.

**Recommended next actions:**
1. Wait 2–3 minutes then `index status {path}` — confirm the index record updated
2. If the path still returns `requested path returned a 301 or 404`: ensure the page is published first via `status {path}`

---

## Remove from Index

Removes a path from the search index. Use after unpublishing a page.

```bash
RESPONSE=$(curl -s -X DELETE \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/index/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200 / 204):** Path removed from search index.

**Recommended next actions:**
1. `index status {path}` — confirm the record is no longer present
2. `unpublish {path}` — if the live page also needs to come down (if not already done)

---

## Get Index Status

Returns the current index state for a path.

```bash
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/index/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200):** Show index entry fields and `lastModified` to confirm index is current.

**Recommended next actions:**
- If `requested path returned a 301 or 404`: `publish {path}` first, then `reindex {path}`
- If `requested path does not match index configuration`: path is outside the index scope — no action needed
- If index record exists and is current: no action needed

---

---

## Bulk Reindex

Reindexes multiple paths or an entire folder in a single async job. Returns HTTP 202 immediately.

**Trigger phrases:** "bulk reindex", "reindex /en/*", "reindex all pages", "reindex everything"

### Path formats supported

| Input | Behaviour |
|---|---|
| Explicit paths: `["/path/one", "/path/two"]` | Reindexes only those paths |
| Wildcard folder: `["/en/*"]` | Recursively reindexes all pages under `/en/` |
| No body | Reindexes **all published pages** on the site |

```bash
# Build PATHS_JSON from paths provided by the user at runtime
# Explicit paths:
PATHS_JSON='{"paths": ["{path1}", "{path2}"]}'

# Wildcard folder:
PATHS_JSON='{"paths": ["{user-provided-folder}/*"]}'

# Reindex entire site — omit body entirely
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/index/${ORG}/${SITE}/${REF}/*")

# With paths body
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PATHS_JSON}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/index/${ORG}/${SITE}/${REF}/*")
```

**On success (202):** Returns a job object with `job.name` (topic: `index`).

**Recommended next actions:**
1. `get job status {job.name}` — monitor progress (topic: `index`)
2. `get job details {job.name}` — review per-path results once stopped
3. `index status {path}` — spot-check a specific path after job completes

---

## Success Criteria

- ✅ Single reindex / remove: HTTP 200 or 204 received
- ✅ Bulk reindex: HTTP 202, job name extracted, directed to job monitoring
- ✅ User informed that index updates are async — search results reflect changes within a few minutes
