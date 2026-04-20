# Job Management

Monitor and manage async jobs triggered by bulk operations. Bulk preview and bulk publish run in the background — use these endpoints to track progress and handle failures.

## When to Use

- After triggering a bulk preview or bulk publish
- Checking why a bulk operation is taking longer than expected
- Cancelling a runaway or incorrect bulk job

## Auth

Job management reads from the Admin API — use the admin JWT:
```
authorization: token ${AUTH_TOKEN}
```

---

## List Jobs

Returns all jobs for a given topic (`preview` or `live`).

```bash
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}")
```

Replace `{topic}` with `preview` or `live`.

---

## Get Job Status

Returns the current state of a specific job.

```bash
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/{jobName}")
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
RESPONSE=$(curl -s \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/{jobName}/details")
```

Check `data` array for individual path outcomes. Flag any paths with non-200 status to the user.

**Recommended next actions:**
- If failures exist: `preview {path}` or `publish {path}` on each failed path individually
- If all succeeded and topic was `preview`: `bulk publish` to promote all previewed pages
- If all succeeded and topic was `live`: `purge cache {path}` for any pages still showing stale content

---

## Stop Job

Cancels a running job. Paths already processed are not rolled back.

```bash
RESPONSE=$(curl -s -X DELETE \
  -H "authorization: token ${AUTH_TOKEN}" \
  -o /tmp/admin_api_response.json \
  -w "%{http_code}" \
  "https://admin.hlx.page/job/${ORG}/${SITE}/${REF}/{topic}/{jobName}")
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
