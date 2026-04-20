# Admin API Skill

Manage AEM Edge Delivery Services (EDS) content lifecycle — preview, publish, cache, indexing, and code deployments — through natural language commands powered by the AEM Admin API (`https://admin.hlx.page`).

---

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Operations Reference](#operations-reference)
  - [Preview](#1-preview)
  - [Publish](#2-publish)
  - [Unpublish](#3-unpublish)
  - [Status](#4-status)
  - [Cache Purge](#5-cache-purge)
  - [Bulk Preview](#6-bulk-preview)
  - [Bulk Publish](#7-bulk-publish)
  - [Bulk Status](#8-bulk-status)
  - [Job Management](#9-job-management)
  - [Code Sync](#10-code-sync)
  - [Code Status](#11-code-status)
  - [Index Status](#12-index-status)
  - [Reindex](#13-reindex)
  - [Bulk Reindex](#14-bulk-reindex)
  - [Remove from Index](#15-remove-from-index)
- [Common Workflows](#common-workflows)
- [Limitations](#limitations)

---

## Getting Started

This skill is part of the `project-management` plugin. Invoke it by describing what you want to do in natural language — no need to remember API endpoints or curl commands.

The skill automatically resolves your project's `org`, `site`, and `ref` from the git remote. Authentication tokens are loaded from `.claude-plugin/project-config.json`.

### Quick Command Reference

| Operation | Example Commands |
|---|---|
| **Preview** | `preview /en/about` · `push /en/homepage to preview` · `preview the about page` · `refresh preview for /ar/index` |
| **Publish** | `publish /en/about` · `go live with /en/campaign/summer` · `push /ar/about to live` · `publish the homepage` |
| **Unpublish** | `unpublish /en/old-page` · `take down /en/recalled-product` · `remove /ar/sale from live` · `unpublish /en/expired-offer` |
| **Status** | `status /en/about` · `check status of /en/homepage` · `why isn't /en/about updating?` · `is /ar/index live?` |
| **Cache Purge** | `purge cache /en/about` · `clear cache /*` · `purge cache /en/about, /ar/about` · `flush CDN cache for /en/homepage` |
| **Bulk Preview** | `bulk preview /en/` · `preview all pages` · `bulk preview /en/campaign/` · `preview everything under /ar/` |
| **Bulk Publish** | `bulk publish /en/` · `publish all pages` · `go live with /en/campaign/` · `bulk publish /ar/` |
| **Bulk Status** | `bulk status /en/*` · `check status of /en/about, /ar/about` · `which pages are stale?` · `audit publish state for /en/campaign/` |
| **Job Management** | `list jobs` · `get job status job-2026-04-20-03-50-46` · `get job details job-2026-04-20-03-50-46` · `stop job job-2026-04-20-03-50-46` |
| **Code Sync** | `sync code /blocks/hero/hero.js` · `sync code /* on branch dev` · `sync all code` · `my CSS changes aren't showing up` |
| **Code Status** | `code status /blocks/hero/hero.js` · `is /styles/styles.css up to date?` · `code status /scripts/aem.js` · `check code bus for /blocks/header/header.js` |
| **Index Status** | `index status /en/about` · `is /en/homepage indexed?` · `check index for /ar/index` · `show me the index record for /en/products` |
| **Reindex** | `reindex /en/about` · `update search index for /en/products` · `/en/new-page isn't showing in search` · `force reindex /ar/about` |
| **Bulk Reindex** | `bulk reindex /en/*` · `reindex all pages` · `reindex /en/about, /ar/about` · `reindex everything` |
| **Remove from Index** | `remove /en/old-page from index` · `deindex /en/recalled-product` · `take /ar/sale out of search` · `remove from index /en/expired-campaign` |

---

## Authentication

Two tokens are used depending on the operation:

| Token | Purpose | Operations |
|---|---|---|
| `authToken` (Admin JWT) | Read-only checks from content bus cache | Status, Get Preview Status, Get Live Status, List Jobs, Index Status |
| `imsToken` (Adobe IMS Bearer) | Write operations that fetch content from DA | Preview, Publish, Unpublish, Cache Purge, Bulk ops, Reindex, Code Sync |

**Setup:** Run `project-management:auth` to authenticate and save tokens to `.claude-plugin/project-config.json`. If the `imsToken` is not saved, you can obtain it from DevTools → Network tab on any DA page → copy the `authorization: Bearer` value.

---

## Operations Reference

---

### 1. Preview

Fetches the latest content from the authoring system and renders it to the preview CDN.

**Admin API:** `POST /preview/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/preview/operation/previewPost

**Use when:** Author finished editing and wants to validate content before publishing.

**Examples:**

| What you say | What happens |
|---|---|
| `preview /en/about` | Refreshes preview for `/en/about` |
| `preview /en/campaign/summer-sale` | Refreshes preview for the campaign page |
| `push /en/homepage to preview` | Same as preview — keyword triggers the same operation |
| `preview page https://main--site--org.aem.page/en/about` | Extracts path and previews `/en/about` |

**Response:** Preview URL — `https://{ref}--{site}--{org}.aem.page{path}`

**Next steps after preview:**
1. Open the preview URL to review
2. `publish {path}` — when approved
3. `status {path}` — if something looks off

---

### 2. Publish

Promotes the current preview version to the live production CDN.

**Admin API:** `POST /live/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/live/operation/livePost

**Use when:** Content has been previewed and approved, or an urgent fix needs to go live.

> **Important:** Publish promotes whatever is currently in preview. Always preview first if content has changed.

**Examples:**

| What you say | What happens |
|---|---|
| `publish /en/about` | Publishes `/en/about` to live CDN |
| `push /en/products/shoes to live` | Publishes the shoes page |
| `go live with /en/campaign/summer-sale` | Publishes the campaign page |
| `publish the homepage` | Publishes `/en/index` (or asks for path if ambiguous) |

**Response:** Live URL — `https://main--{site}--{org}.aem.live{path}`

**Next steps after publish:**
1. Open the live URL (CDN propagation takes up to 60 seconds)
2. `purge cache {path}` — if live URL still shows old content after 60 seconds
3. `status {path}` — verify `live.lastModified` updated

---

### 3. Unpublish

Removes a page from the live CDN — visitors see 404. Preview layer is unaffected.

**Admin API:** `DELETE /live/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/live/operation/liveDelete

**Use when:** A page needs to come down immediately (legal takedown, recalled product, ended campaign).

**Examples:**

| What you say | What happens |
|---|---|
| `unpublish /en/old-campaign` | Removes the page from live CDN |
| `take down /en/recalled-product` | Same — removes from live |
| `remove /ar/sale from live` | Unpublishes the Arabic sale page |
| `unpublish /en/about` | Returns 404 on live; preview remains available |

**Next steps after unpublish:**
1. `remove from index {path}` — stop the page appearing in search results
2. `delete preview {path}` — if preview also needs to come down
3. `status {path}` — confirm live layer shows 404

---

### 4. Status

Returns the current state of a page across edit / preview / live layers with `lastModified` timestamps. Use to diagnose stale content.

**Admin API:** `GET /status/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/status/operation/statusGet

**Use when:** Diagnosing why a page is stale, confirming an operation succeeded, auditing publish state.

**Examples:**

| What you say | What happens |
|---|---|
| `status /en/about` | Shows preview, live, and edit timestamps for `/en/about` |
| `check status of /en/homepage` | Same |
| `why isn't /en/about updating?` | Runs status and diagnoses the gap between layers |
| `status https://main--site--org.aem.page/en/about` | Extracts path and checks status |

**Response format:**

```
Status of https://{ref}--{site}--{org}.aem.page{path}

| Layer   | Status | Last Modified          |
|---------|--------|------------------------|
| Preview | ✅ 200 | 2026-04-15T06:56:54Z   |
| Live    | ✅ 200 | 2026-04-15T07:01:46Z   |
| Edit    | —      | 2026-04-15T06:55:13Z   |
```

**Diagnosis:**

| Condition | Recommended action |
|---|---|
| Edit newer than preview | `preview {path}` |
| Preview newer than live | `publish {path}` |
| Timestamps match, browser stale | `purge cache {path}` |
| Live = 404 | `publish {path}` |

---

### 5. Cache Purge

Forces the CDN to drop its cached copy. Does not republish — only clears the CDN cache.

**Admin API:** `POST /cache/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/cache/operation/cachePost

**Use when:** Page published but live URL still shows old content after 60 seconds.

**Examples:**

| What you say | What happens |
|---|---|
| `purge cache /en/about` | Clears CDN cache for `/en/about` |
| `clear cache for /en/homepage` | Same |
| `purge cache /*` | Clears CDN cache for the **entire site** |
| `purge cache /en/about, /ar/about, /en/products` | Loops and purges each path individually |

**After purging:** Hard-refresh browser — `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows).

> **Note:** There is no per-path bulk cache purge API. The skill loops over individual paths, or uses `/*` for a full site purge.

---

### 6. Bulk Preview

Triggers preview refresh for all paths under a given prefix. Returns an async job.

**Admin API:** `POST /preview/{org}/{site}/{ref}/*`
**Docs:** https://www.aem.live/docs/admin.html#tag/preview/operation/previewBulkPost

**Use when:** Releasing a campaign, propagating a template change across many pages.

> **Limitation:** Not supported on DA (markup) mountpoints. Works on SharePoint and Google Drive sources only.

**Examples:**

| What you say | What happens |
|---|---|
| `bulk preview /en/` | Previews all pages under `/en/` |
| `bulk preview everything` | Previews all pages (root `/*`) |
| `bulk preview /en/campaign/` | Previews all campaign pages |
| `preview all pages under /ar/` | Previews all Arabic pages |

**Response:** HTTP 202 + `job.name`. Monitor with `get job status {job.name}`.

---

### 7. Bulk Publish

Promotes all previewed pages under a prefix to the live CDN. Unpreviewed pages are skipped.

**Admin API:** `POST /live/{org}/{site}/{ref}/*`
**Docs:** https://www.aem.live/docs/admin.html#tag/live/operation/liveBulkPost

**Use when:** Releasing a campaign, going live with a full section after bulk preview.

**Examples:**

| What you say | What happens |
|---|---|
| `bulk publish /en/` | Publishes all previewed `/en/` pages |
| `publish all pages` | Publishes all previewed pages (root `/*`) |
| `go live with /en/campaign/` | Publishes all campaign pages |
| `bulk publish /ar/` | Publishes all previewed Arabic pages |

**Response:** HTTP 202 + `job.name`. Monitor with `get job status {job.name}`.

---

### 8. Bulk Status

Returns preview and publish state across multiple paths or an entire folder. Works on all mountpoint types including DA.

**Admin API:** `POST /status/{org}/{site}/{ref}/*` with JSON body `{"paths": [...]}`
**Docs:** https://www.aem.live/docs/admin.html#tag/status/operation/statusBulkPost

**Use when:** Auditing publish state before a release, detecting stale pages.

**Path input formats:**

| Input | Behaviour | Response |
|---|---|---|
| Explicit: `/en/about, /ar/about` | Checks those paths only | HTTP 200, synchronous |
| Wildcard: `/en/*` | Checks all pages under `/en/` | HTTP 202, async job |

**Examples:**

| What you say | What happens |
|---|---|
| `bulk status /en/*` | Async audit of all `/en/` pages |
| `check status of /en/about, /ar/about, /en/index` | Synchronous check of 3 paths |
| `which pages are stale under /en/` | Runs bulk status and flags pages where preview > live |
| `audit publish state for /en/campaign/` | Runs bulk status on the campaign folder |

**Interpreting results:**

| Condition | Action |
|---|---|
| Path missing from results | Page not previewed — run `preview {path}` |
| `previewLastModified` > `publishLastModified` | Run `publish {path}` |
| Both timestamps match | Page is in sync |

---

### 9. Job Management

Monitor and manage async jobs started by bulk operations (preview, publish, status, index, code sync).

**Admin API:** `GET /job/{org}/{site}/{ref}/{topic}[/{jobName}[/details]]` · `DELETE /job/.../{jobName}`
**Docs:** https://www.aem.live/docs/admin.html#tag/job

**Topics:** `preview` · `live` · `status` · `index` · `code`

**Examples:**

| What you say | What happens |
|---|---|
| `list jobs` | Lists recent jobs across all topics |
| `list preview jobs` | Lists jobs for topic `preview` |
| `get job status job-2026-04-20-03-50-46-02e9332c` | Returns state, progress (processed/total) |
| `get job details job-2026-04-20-04-26-15-8b231e82` | Returns per-path results and failures |
| `stop job job-2026-04-20-03-50-46-02e9332c` | Cancels the running job |

**Job states:**

| State | Meaning |
|---|---|
| `created` | Job queued, not yet started |
| `running` | Job in progress |
| `stopped` | Job completed or cancelled |

---

### 10. Code Sync

Forces the code bus to fetch the latest commit from GitHub and update the code bus cache.

**Admin API:** `POST /code/{owner}/{repo}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/code/operation/codePost

**Use when:** Code was pushed to GitHub but the site still renders old behaviour.

**Examples:**

| What you say | What happens |
|---|---|
| `sync code /blocks/hero/hero.js` | Syncs a single file from `main` (current branch) |
| `sync code /styles/styles.css on branch dev` | Syncs the stylesheet from the `dev` branch |
| `sync code /* on branch dev` | Syncs all files from the `dev` branch (async job) |
| `sync code /* on branch feature/new-header` | Syncs all files from a slash-containing branch |

### Specifying a branch

By default the skill uses the current git branch. You can override it explicitly:

| Branch type | Example phrase |
|---|---|
| Simple name | `sync code /* on branch dev` |
| With slashes | `sync code /* on branch feature/new-header` |

Branches with slashes (e.g. `feature/new-header`) are passed via the `?branch=` query parameter automatically — no extra steps needed.

> **Limitation:** Wildcard sync (`/*`) only works at root — `/blocks/*` returns 400.

**After sync:** Hard-refresh browser — `Cmd+Shift+R` / `Ctrl+Shift+R`.

---

### 11. Code Status

Returns the current code bus state for a specific file — confirms whether the latest GitHub commit has been picked up.

**Admin API:** `GET /code/{owner}/{repo}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/code/operation/codeGet

**Use when:** Checking if a specific file is up to date on the code bus.

**Examples:**

| What you say | What happens |
|---|---|
| `code status /blocks/hero/hero.js` | Returns `lastModified` vs `sourceLastModified` |
| `code status /scripts/aem.js` | Checks the core script |
| `is /styles/styles.css up to date?` | Compares code bus vs GitHub timestamps |
| `code status /blocks/header/header.js` | Checks the header block |

**Diagnosis:**

| Condition | Action |
|---|---|
| `lastModified` < `sourceLastModified` | `sync code {path}` — code bus is behind |
| Timestamps match, site looks wrong | Hard-refresh browser |
| `code.status` = 404 | File doesn't exist at this path in GitHub |

---

### 12. Index Status

Returns the current search index record for a path across all configured indexes.

**Admin API:** `GET /index/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/index/operation/indexGet

**Use when:** Verifying a page is in the search index, confirming a reindex completed.

**Examples:**

| What you say | What happens |
|---|---|
| `index status /en/about` | Shows index record across all indexes |
| `is /en/homepage indexed?` | Checks if the page appears in the `en` index |
| `index status /ar/index` | Checks the Arabic homepage index record |
| `check index for /en/products/shoes` | Returns index entry with title, description, lastModified |

**Index result messages:**

| Message | Meaning |
|---|---|
| Record present | Page is indexed |
| `requested path returned a 301 or 404` | Page not published — publish first |
| `requested path does not match index configuration` | Path is outside this index's scope |

---

### 13. Reindex

Forces the indexer to re-process a published path and update its search index entry.

**Admin API:** `POST /index/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/index/operation/indexPost

**Use when:** A published page is not appearing in search results, or content changed and the index is stale.

> **Prerequisite:** Project must have a `query-index.json`. Indexing has no effect without it.

**Examples:**

| What you say | What happens |
|---|---|
| `reindex /en/about` | Queues `/en/about` for reindex |
| `update search index for /en/products` | Same |
| `reindex /ar/homepage` | Reindexes the Arabic homepage |
| `/en/new-page isn't showing in search` | Skill runs status → publish if needed → reindex |

**Note:** Index updates are async — allow 2–3 minutes then run `index status {path}` to confirm.

---

### 14. Bulk Reindex

Reindexes multiple paths, an entire folder, or all published pages in a single async job.

**Admin API:** `POST /index/{org}/{site}/{ref}/*` with optional JSON body
**Docs:** https://www.aem.live/docs/admin.html#tag/index/operation/bulkIndex

**Input formats:**

| Input | Behaviour |
|---|---|
| Explicit paths | Reindexes only those paths |
| Wildcard folder (`/en/*`) | Reindexes all pages under `/en/` |
| No paths (omit body) | Reindexes **all published pages** on the site |

**Examples:**

| What you say | What happens |
|---|---|
| `bulk reindex /en/*` | Reindexes all English pages (async job) |
| `reindex all pages` | Reindexes entire site — no body sent |
| `reindex /en/about, /ar/about` | Reindexes 2 explicit paths |
| `reindex everything` | Full site reindex job |

**Response:** HTTP 202 + `job.name` (topic: `index`). Monitor with `get job status {job.name}`.

---

### 15. Remove from Index

Removes a path from the search index. Use after unpublishing a page.

**Admin API:** `DELETE /index/{org}/{site}/{ref}/{path}`
**Docs:** https://www.aem.live/docs/admin.html#tag/index/operation/indexDelete

**Use when:** A page was unpublished and should no longer appear in search results.

**Examples:**

| What you say | What happens |
|---|---|
| `remove /en/old-page from index` | Removes the page from all applicable indexes |
| `deindex /en/recalled-product` | Same |
| `take /ar/sale out of search` | Removes from the `ar` index |
| `remove from index /en/expired-campaign` | Queues removal (async, takes a few minutes) |

**Next steps:**
1. `index status {path}` — confirm record is gone after 2–3 minutes
2. `unpublish {path}` — if the live page also needs to come down

---

## Common Workflows

### New Page Going Live

```
1. preview /en/new-page          → validate at .aem.page URL
2. publish /en/new-page          → live at .aem.live URL
3. purge cache /en/new-page      → if CDN still shows old content after 60s
4. reindex /en/new-page          → add to search index
```

### Diagnose Stale Content

```
1. status /en/page               → read lastModified timestamps
2. edit > preview timestamp      → run: preview /en/page
3. preview > live timestamp      → run: publish /en/page
4. timestamps match, stale       → run: purge cache /en/page
```

### Campaign Release (Bulk)

```
1. bulk preview /en/campaign/    → preview all campaign pages
2. get job status {job.name}     → wait for job to stop
3. bulk status /en/campaign/     → verify all pages are ready
4. bulk publish /en/campaign/    → go live
5. get job status {job.name}     → confirm publish completed
6. get job details {job.name}    → check for any failed paths
```

### Unpublish and Clean Up

```
1. unpublish /en/old-page        → remove from live CDN
2. remove from index /en/old-page → remove from search results
3. delete preview /en/old-page   → remove from preview CDN
4. status /en/old-page           → confirm all layers show 404
```

### Code Not Updating

```
1. code status /blocks/hero/hero.js   → check if code bus is behind
2. sync code /blocks/hero/hero.js     → force update from GitHub
3. hard-refresh browser               → Cmd+Shift+R / Ctrl+Shift+R
4. sync code /*                       → if multiple files need updating
```

---

## Limitations

| Limitation | Detail |
|---|---|
| Bulk preview/publish on DA sites | Wildcard bulk ops not supported on DA (markup) mountpoints — use DA bulk publish UI or AEM Sidekick instead |
| Bulk cache purge | No per-path bulk API — skill loops individually or uses `/*` for full site purge |
| Code sync wildcard | Only root `/*` supported — `/blocks/*` returns 400 |
| Index operations | Only meaningful if project has `query-index.json` |
| Code bus auth | Requires IMS token linked to a GitHub account with repo access — GitHub PATs not accepted |
