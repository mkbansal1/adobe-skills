# Cache Management

Force the CDN to drop its cached copy of a page so the next request fetches fresh content from origin.

## When to Use

- Page published but live URL still shows old content after 60 seconds
- Emergency fix must reach users immediately after publish
- CDN is serving a stale version despite a successful publish

**Note:** Cache purge does NOT republish — it only clears what the CDN has cached. If the page content is wrong, run Publish first, then purge.

## Auth

Cache operations fetch from DA — use IMS Bearer token:
```
authorization: Bearer ${IMS_TOKEN}
x-content-source-authorization: Bearer ${IMS_TOKEN}
```

---

## Cache Purge — Single Path

Forces the CDN to drop its cached copy of a specific path.

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/cache/${ORG}/${SITE}/${REF}${PATH_ARG}")
```

**On success (200):** Cache purged. Empty response body is expected.

**Recommended next actions:**
1. Hard-refresh the browser — `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows/Linux)
2. Wait 5–10 seconds, then open the live URL to confirm content is fresh
3. `status {path}` — if content still appears stale, check whether publish actually ran

---

## Cache Purge — Bulk (entire site)

Purges the CDN cache for the entire site using a wildcard surrogate key purge. Use after a bulk publish or when multiple pages need to be refreshed at once.

**Note:** The Admin API does not support a JSON paths array for cache — there is no per-path bulk variant. The wildcard `/*` triggers a full site CDN cache purge.

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/cache/${ORG}/${SITE}/${REF}/*")
```

**On success (200):** Entire site CDN cache purged. Empty response body is expected.

**Recommended next actions:**
1. Hard-refresh the browser — `Cmd+Shift+R` / `Ctrl+Shift+R`
2. Wait 10–15 seconds before checking multiple pages (full site purge takes slightly longer to propagate)
3. Spot-check a few key pages to confirm fresh content is being served

---

## Purging Multiple Specific Paths

When you need to purge a defined list of paths (not the entire site), loop over them individually — there is no batch endpoint.

Build `PATHS` from whatever paths the user provides. Each path must start with `/`.

```bash
# PATHS is populated from user input at runtime
PATHS=("${USER_PATHS[@]}")

for PATH_ARG in "${PATHS[@]}"; do
  HTTP=$(curl -s -X POST \
    -H "authorization: Bearer ${IMS_TOKEN}" \
    -H "x-content-source-authorization: Bearer ${IMS_TOKEN}" \
    -w "%{http_code}" -o /dev/null \
    "https://admin.hlx.page/cache/${ORG}/${SITE}/${REF}${PATH_ARG}")
  echo "${PATH_ARG}: HTTP ${HTTP}"
done
```

**Recommended next actions:**
1. Hard-refresh the browser after all paths are purged
2. `status {path}` — verify any path that still appears stale

---

## Success Criteria

- ✅ HTTP 200 received for each purged path
- ✅ User instructed to hard-refresh browser after purge
- ✅ For full site purge: user informed to wait 10–15 seconds before checking
