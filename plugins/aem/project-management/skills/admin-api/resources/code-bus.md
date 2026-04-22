# Code Bus

Sync and inspect code deployments via the Admin API code bus. Use after pushing commits to GitHub when the live site hasn't picked up the latest code.

## When to Use

- Code was pushed to GitHub but the site still renders old behaviour
- Forcing a code refresh without waiting for the automatic sync interval
- Checking whether a specific file has been picked up by the code bus
- Syncing all files in the repo at once after a large commit

## Auth

IMS Bearer token only — GitHub PATs and admin JWT (`authorization: token`) are **not** accepted by admin.hlx.page for any code bus operation (GET or POST).
```
authorization: Bearer ${IMS_TOKEN}
```

Code bus uses `OWNER` and `REPO` (the GitHub owner/repo of the EDS project) — **not** the git remote of the current working directory. If not known, ask the user for the GitHub URL (e.g. `https://github.com/{org}/{repo}`).

```bash
# Parse OWNER and REPO from the GitHub URL provided by the user
GITHUB_URL="{user-provided GitHub URL}"
OWNER=$(echo "$GITHUB_URL" | sed -E 's|https://github.com/([^/]+)/.*|\1|')
REPO=$(echo "$GITHUB_URL"  | sed -E 's|https://github.com/[^/]+/([^/.]+).*|\1|')
```

---

## Sync Code — Single File

Forces the code bus to fetch a specific file from GitHub and update the code bus.

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/code/${OWNER}/${REPO}/${REF}${PATH_ARG}")
```

**On success (200):** Show `code.lastModified` from the response to confirm which version was synced.

**Recommended next actions:**
1. Hard-refresh the browser — `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows/Linux)
2. `code status {path}` — verify `lastModified` matches expected time
3. `status {path}` — if a content page still looks wrong, check content layers too

---

## Sync Code — Wildcard (entire repo)

Recursively syncs **all files in the repo** from GitHub. Returns HTTP 202 and starts an async job.

**Limitation:** Wildcard is only supported for the root path (`/*`). Subdirectory wildcards (e.g. `/blocks/*`) return 400 `Recursive updates are only supported for root path`.

### Specifying a branch

By default `REF` is the current git branch. To sync a different branch, set `REF` explicitly from the user's input:

| Branch type | How to pass |
|---|---|
| Simple name (`dev`, `main`) | Use as `REF` directly in the URL path |
| Contains slashes (`feature/new-header`) | Use `?branch=` query parameter (URL-encode `/` as `%2F`) |

```bash
# Simple branch name — set REF from user input
REF="dev"   # or whatever branch the user specifies

# Branch name with slashes — keep REF as "main", pass branch via query param
BRANCH_PARAM="?branch=feature%2Fnew-header"
```

```bash
RESPONSE=$(curl -s -X POST \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/code/${OWNER}/${REPO}/${REF}/*${BRANCH_PARAM:-}")
```

**On success (202):** Returns a job object with `job.name` (topic: `code`).

**Recommended next actions:**
1. `get job status {job.name}` — monitor progress (topic: `code`)
2. `get job details {job.name}` — review per-file results once stopped
3. Hard-refresh the browser after job completes — `Cmd+Shift+R` / `Ctrl+Shift+R`

---

## Get Code Status

Returns the current code bus state for a specific file. **No wildcard support** — single file only.

```bash
RESPONSE=$(curl -s \
  -H "authorization: Bearer ${IMS_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/code/${OWNER}/${REPO}/${REF}${PATH_ARG}")
```

**On success (200):** Display a status table:

| Field | Value |
|---|---|
| `code.lastModified` | When code bus last picked up this file |
| `code.sourceLastModified` | When the file last changed in GitHub |
| `code.contentLength` | File size in bytes |
| `code.sourceLocation` | Raw GitHub URL |

**Diagnosing from result:**

| Condition | Recommended action |
|---|---|
| `lastModified` < `sourceLastModified` | `sync code {path}` — code bus is behind GitHub |
| Timestamps match, site shows old behaviour | Hard-refresh browser (`Cmd+Shift+R`) |
| `code.status` = 404 | File doesn't exist in GitHub at this path |

**Recommended next actions:**
- If behind: `sync code {path}` to force update
- If timestamps match but site looks wrong: `sync code /*` to do a full repo sync
- `status {path}` — if issue persists, check whether content layers are also stale

---

## Success Criteria

- ✅ Single sync: HTTP 200, `code.lastModified` updated
- ✅ Wildcard sync: HTTP 202, job name extracted, directed to job monitoring
- ✅ Status: `lastModified` ≥ `sourceLastModified` — code bus is current
- ✅ User informed to hard-refresh browser after any sync
