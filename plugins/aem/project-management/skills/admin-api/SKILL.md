---
name: admin-api
description: Execute AEM Edge Delivery Services Admin API operations — preview, publish, unpublish, status, cache purge, bulk preview/publish/status, job management, and code sync — for any EDS project. Trigger phrases include "preview this page", "publish to live", "unpublish", "check status", "purge cache", "delete preview", "bulk preview", "bulk publish", "bulk status", "check status of multiple pages", "which pages are stale", "audit publish state", "check job", "stop job", "sync code", "why isn't my page updating?", "can you push my changes?"
license: Apache-2.0
metadata:
  version: "1.0.0"
---

# Admin API

Execute Admin API operations against `https://admin.hlx.page` to manage content across preview and live CDN layers for any AEM Edge Delivery Services project.

## When to Use This Skill

Use this skill when the user wants to:
- ✅ Push authored content to preview or check/delete preview state
- ✅ Publish, unpublish, or check live state of a page
- ✅ Inspect what state a page is in across edit / preview / live layers
- ✅ Force a CDN cache refresh after publishing
- ✅ Bulk preview or publish multiple pages
- ✅ Monitor or stop async bulk jobs
- ✅ Sync code or check code bus status
- ✅ Diagnose "why isn't my page updating?" scenarios

Do NOT use for:
- ❌ Content editing (use DA or SharePoint/Google Drive)
- ❌ Config Service changes — org/site config, users, secrets (use `project-management:admin`)
- ❌ Search index or sitemap management

## Workflow

Track your progress:

- [ ] Step 1: Load auth token
- [ ] Step 2: Resolve project context (org, site, ref)
- [ ] Step 3: Execute operation
- [ ] Step 4: Report result and next steps

---

## Step 1: Load Auth Tokens

Two tokens are required — each serves a different purpose:

| Token | Used for | Header scheme |
|---|---|---|
| `authToken` (admin JWT) | Status checks — reads from content bus cache | `authorization: token` |
| `imsToken` (Adobe IMS Bearer) | Preview, Publish, Unpublish, Cache — fetches live from DA | `authorization: Bearer` + `x-content-source-authorization: Bearer` |

```bash
AUTH_TOKEN=$(grep -o '"authToken"[[:space:]]*:[[:space:]]*"[^"]*"' \
  .claude-plugin/project-config.json 2>/dev/null \
  | sed 's/"authToken"[[:space:]]*:[[:space:]]*"//' \
  | sed 's/"$//')

IMS_TOKEN=$(grep -o '"imsToken"[[:space:]]*:[[:space:]]*"[^"]*"' \
  .claude-plugin/project-config.json 2>/dev/null \
  | sed 's/"imsToken"[[:space:]]*:[[:space:]]*"//' \
  | sed 's/"$//')
```

**If `AUTH_TOKEN` is empty:** Invoke the `project-management:auth` skill now, wait for it to complete, then re-read the token before continuing.

**If `IMS_TOKEN` is empty and the operation requires DA access (Preview, Publish, Unpublish, Cache):** Ask the user to provide their Adobe IMS Bearer token. They can find it by opening DevTools on any DA page → Network tab → copy the `authorization: Bearer` value from any request.

**Success criteria:**
- ✅ `AUTH_TOKEN` non-empty (required for all operations)
- ✅ `IMS_TOKEN` non-empty (required for Preview, Publish, Unpublish, Cache)

**Mark complete when:** Required tokens loaded for the intended operation.

---

## Step 2: Resolve Project Context

Derive `org`, `site`, and `ref` from the git remote. No manual configuration needed.

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null)

# Works for both SSH (git@github.com:org/site.git) and HTTPS remotes
ORG=$(echo "$REMOTE_URL"  | sed -E 's|.*[:/]([^/]+)/[^/]+\.git.*|\1|')
SITE=$(echo "$REMOTE_URL" | sed -E 's|.*[:/][^/]+/([^/]+)\.git.*|\1|')
REF=$(git branch --show-current)
```

**If auto-detection fails** (non-GitHub remote or no remote set):

```bash
if [ -z "$ORG" ] || [ -z "$SITE" ]; then
  # Ask the user for the values using AskUserQuestion
  echo "Could not detect org/site from git remote. Please provide:"
  echo "  ORG  = GitHub organisation name"
  echo "  SITE = GitHub repository name"
fi
```

**Success criteria:**
- ✅ `ORG`, `SITE`, and `REF` are non-empty

**Mark complete when:** All three context values resolved.

---

## Step 3: Execute Operation

Choose the operation that matches the user's intent.

All operations use this base URL pattern:
```
https://admin.hlx.page/{operation}/{org}/{site}/{ref}/{path}
```

The `{path}` must start with `/` and match the page's URL path in the authoring system exactly.

**If preview, publish, unpublish, status, or get preview/live state (single path):** Read `resources/publishing.md` and follow the workflow there.
**If cache purge:** Read `resources/cache.md` and follow the workflow there.
**If bulk operation (multiple paths, wildcard, or bulk status audit):** Read `resources/bulk-operations.md` and follow the workflow there.
**If job management (check job, list jobs, stop job):** Read `resources/jobs.md` and follow the workflow there.
**If code sync (single file or full repo wildcard) or code status:** Read `resources/code-bus.md` and follow the workflow there.
**If index operation (reindex, bulk reindex, remove from index, index status):** Read `resources/index.md` and follow the workflow there.

---

## Step 4: Report Result

After every operation, handle the HTTP status code and report clearly:

```bash
BODY=$(cat /tmp/admin_api_response.json 2>/dev/null)

case "$RESPONSE" in
  200|201|204)
    # Success — show operation-specific output from Step 3
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    ;;
  401)
    echo "Unauthorized (401). Auth token expired."
    # Invoke the project-management:auth skill now to refresh the token, then retry the operation.
    ;;
  404)
    echo "Not found (404). Check the path exists in the authoring system."
    echo "For publish: ensure the page has been previewed first."
    ;;
  5*)
    echo "Server error (${RESPONSE}). Check https://www.aemstatus.net"
    echo "Response: $BODY"
    ;;
  *)
    echo "Unexpected response: HTTP ${RESPONSE}"
    echo "$BODY"
    ;;
esac
```

**Success criteria:**
- ✅ HTTP 200, 201, or 204 received
- ✅ Result URL shown to user
- ✅ Next steps communicated

**Mark complete when:** Operation result reported and user knows what to do next.

---

## Quick Reference

| Operation | Resource |
|---|---|
| Preview, get/delete preview status | `resources/publishing.md` |
| Publish, unpublish, get live status | `resources/publishing.md` |
| Status (all layers) | `resources/publishing.md` |
| Cache purge | `resources/cache.md` |
| Bulk preview / publish / status | `resources/bulk-operations.md` |
| Job management | `resources/jobs.md` |
| Code sync / code status | `resources/code-bus.md` |
| Index management | `resources/index.md` |

**Authorization headers:**

| Operation | Headers required |
|---|---|
| Status | `authorization: token <authToken>` |
| Preview, Publish, Unpublish, Cache | `authorization: Bearer <imsToken>` + `x-content-source-authorization: Bearer <imsToken>` |

The `imsToken` is an Adobe IMS OAuth Bearer token. Obtain it from DevTools → Network tab on any DA page → copy the `authorization: Bearer` value.

**Common workflow — new page going live:**
1. `preview /path` → verify at `.aem.page` URL
2. `publish /path` → live at `.aem.live` URL
3. If CDN stale: `purge-cache /path`

**Common workflow — diagnose stale content:**
1. `status /path` → read `lastModified` timestamps
2. edit > preview → run preview
3. preview > live → run publish
4. timestamps match, browser stale → run cache purge
