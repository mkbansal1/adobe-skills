# Job Management

Monitor and manage async jobs triggered by bulk operations. Bulk preview, bulk publish, bulk reindex, and code sync run in the background — use these endpoints to track progress and handle failures.

## When to Use

- After triggering any bulk or async operation
- Checking why an operation is taking longer than expected
- Cancelling a runaway or incorrect bulk job

## Auth

Job management reads from the Admin API — use the admin JWT:
```
authorization: token ${AUTH_TOKEN}
```

## URL Namespace — Important

Jobs use **two different URL namespaces** depending on the topic:

| Topics | URL base |
|---|---|
| `preview`, `live`, `status`, `index` | `https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/...` |
| `code` | `https://admin.hlx.page/job/${OWNER}/${REPO}/${REF}/code/...` |

For `code` topic jobs: use the GitHub `OWNER` and `REPO` (e.g. `my-org/my-eds-repo`), not the AEM `ORG`/`SITE`. These are set when the code sync job is triggered.

---

## List Jobs

Returns recent jobs for a given topic.

**Topics:** `preview` · `live` · `status` · `index` · `code`

```bash
# Content topics (preview, live, status, index)
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}")

# Code topic
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${OWNER}/${REPO}/${REF}/code")
```

When user says "list all jobs" — query all relevant topics and display results together.

---

## Get Job Status

Returns the current state of a specific job.

```bash
# Content topics (preview, live, status, index)
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/{jobName}")

# Code topic
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${OWNER}/${REPO}/${REF}/code/{jobName}")
```

**Reading the response:**

| Field | Meaning |
|---|---|
| `state: running` | Job still in progress |
| `state: stopped` | Job completed or was cancelled |
| `progress.processed` | Paths completed so far |
| `progress.total` | Total paths in job |

**Recommended next actions:**
- If `state: running`: `get job status {jobName}` again in a few minutes to check progress
- If `state: stopped`: `get job details {jobName}` to review per-path results and surface failures
- If job is taking unexpectedly long: `stop job {jobName}` to cancel

---

## Get Job Details

Returns per-path results including any failures.

```bash
# Content topics (preview, live, status, index)
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/{jobName}/details")

# Code topic
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${OWNER}/${REPO}/${REF}/code/{jobName}/details")
```

Check `data.resources[]` for individual path outcomes. Flag any paths with non-200 status to the user.

**Recommended next actions:**
- If failures exist: `preview {path}` or `publish {path}` on each failed path individually
- If all succeeded and topic was `preview`: `bulk publish` to promote all previewed pages
- If all succeeded and topic was `live`: `purge cache {path}` for any pages still showing stale content
- If all succeeded and topic was `code`: hard-refresh browser (`Cmd+Shift+R` / `Ctrl+Shift+R`)

---

## Stop Job

Cancels a running job. Paths already processed are not rolled back.

```bash
# Content topics (preview, live, status, index)
RESPONSE=$(curl -s -X DELETE \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/{jobName}")

# Code topic
RESPONSE=$(curl -s -X DELETE \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${OWNER}/${REPO}/${REF}/code/{jobName}")
```

**On success (200 / 204):** Job stopped. Inform user how many paths were processed before cancellation.

**Recommended next actions:**
1. `get job details {jobName}` — see which paths completed before cancellation
2. Re-trigger the bulk operation with a narrower path prefix if the full wildcard was too broad

---

## Success Criteria

- ✅ Job state reported clearly (running / stopped / failed)
- ✅ Progress shown as processed/total
- ✅ Any failed paths surfaced to the user with their error
