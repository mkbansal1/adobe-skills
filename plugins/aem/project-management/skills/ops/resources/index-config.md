---
name: ops-index-config
description: Search index configuration for Edge Delivery Services - manage helix-index.yaml settings that define indexing rules.
allowed-tools: Read, Write, Edit, Bash
---

# Edge Delivery Services Operations - Index Configuration

Manage search index configuration (helix-index.yaml) that defines indexing rules.

## When to Use

- Adding new metadata fields to the search index (e.g., category, author, date)
- Removing fields that are no longer needed from the index schema
- Troubleshooting missing or incorrect data in search query results
- Onboarding a new content type that requires custom indexing rules
- Reviewing the current index configuration before making schema changes

## API Reference

| Intent | Endpoint | Method |
|--------|----------|--------|
| read index config | `/config/{org}/{site}/helix-index.yaml` | GET |
| update index config | `/config/{org}/{site}/helix-index.yaml` | POST |

## Operations

### Read Index Configuration

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/${SITE}/helix-index.yaml"
```

**▶ Recommended Next Actions:**
1. Update the index configuration if changes are required
   ```
   update index config
   ```
2. Reindex pages to apply the current config
   ```
   reindex {path}
   ```

### Update Index Configuration

**Requires Admin role.**

```bash
curl -s -X POST \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @helix-index.yaml \
  "https://admin.hlx.page/config/${ORG}/${SITE}/helix-index.yaml"
```

**▶ Recommended Next Actions:**
1. Verify the config was saved correctly
   ```
   show index config
   ```
2. Trigger a reindex to apply the new rules
   ```
   reindex {path}
   ```

## Natural Language Patterns

| User Says | Operation |
|-----------|-----------|
| "show index config" | Read index config |
| "update index config" | Update index config |
