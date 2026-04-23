---
name: ops-apikeys
description: API key management for Edge Delivery Services - create, list, and revoke API keys at org and site levels.
allowed-tools: Read, Write, Edit, Bash
---

# Edge Delivery Services Operations - API Key Management

Manage API keys for programmatic access to Edge Delivery Services.

## When to Use

- Generating an API key for a CI/CD pipeline, automation, or external service
- Auditing active API keys at org or site level before a security review
- Revoking a key that was exposed, is unused, or belongs to a decommissioned service
- Rotating API keys as part of periodic credential hygiene
- Investigating API access failures by verifying which keys are currently active and their scopes

## API Reference

### Organization API Keys

| Intent | Endpoint | Method |
|--------|----------|--------|
| list org API keys | `/config/{org}.json` → `apiKeys{}` | GET |
| create org API key | `/config/{org}/apikeys` | POST |
| read org API key | `/config/{org}/apikeys/{keyId}` | GET |
| revoke org API key | `/config/{org}/apikeys/{keyId}` | DELETE |

### Site API Keys

| Intent | Endpoint | Method |
|--------|----------|--------|
| list site API keys | `/config/{org}/{site}/apikeys` | GET |
| create site API key | `/config/{org}/{site}/apikeys` | POST |
| read site API key | `/config/{org}/{site}/apikeys/{keyId}` | GET |
| revoke site API key | `/config/{org}/{site}/apikeys/{keyId}` | DELETE |

## Operations

### List Organization API Keys

**Requires Admin role.**

Org API keys are embedded in the org config under the `apiKeys{}` map. The dedicated `/config/{org}/apikeys` endpoint returns 400 — use the org config endpoint instead.

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}.json"
```

**On success:** Extract `apiKeys{}` map — display each key's `description`, `id`, `roles`, `subject`, and `expiration`. Report total count.

**▶ Recommended Next Actions:**
1. Create a new org-level API key for a service or pipeline
   ```
   create API key for CI/CD
   ```
2. Revoke a key that is no longer needed
   ```
   revoke API key {keyId}
   ```

### Create Organization API Key

**Requires Admin role.**

```bash
curl -s -X POST \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "CI/CD Key", "scopes": ["preview", "live"]}' \
  "https://admin.hlx.page/config/${ORG}/apikeys"
```

**Success:** `Created org API key: {name} (ID: {keyId})`

**Important:** The API key value is only returned once at creation. Store it securely.
**▶ Recommended Next Actions:**
1. List org API keys to confirm the key was created
   ```
   list org API keys
   ```
2. Revoke immediately if the key value was exposed
   ```
   revoke API key {keyId}
   ```

### Read Organization API Key

**Requires Admin role.**

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/apikeys/${KEY_ID}"
```

**▶ Recommended Next Actions:**
1. Revoke this key if it is no longer needed or was exposed
   ```
   revoke API key {keyId}
   ```
2. List all org API keys to audit active credentials
   ```
   list org API keys
   ```

### Revoke Organization API Key

**Requires Admin role.**

**DESTRUCTIVE OPERATION - CONFIRMATION REQUIRED**

Before executing, you MUST:
1. Tell user: "This will revoke API key '{keyId}'. Any CI/CD pipelines or automations using this key will stop working immediately."
2. Ask: "Do you want to proceed? (yes/no)"
3. Only execute if user confirms with "yes"

```bash
curl -s -X DELETE \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/apikeys/${KEY_ID}"
```

**Success:** `Revoked org API key: {keyId}`
**▶ Recommended Next Actions:**
1. List org API keys to confirm the key was removed
   ```
   list org API keys
   ```
2. Create a replacement key for the affected pipeline
   ```
   create API key for CI/CD
   ```

### List Site API Keys

**Requires Admin role.**

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/${SITE}/apikeys"
```

**On success:** Display results in a table with columns **ID**, **Description**, **Roles**, **Subject**, and **Expiration**. Report total count.

**▶ Recommended Next Actions:**
1. Create a new site-level API key for a service or pipeline
   ```
   create API key
   ```
2. Revoke a key that is no longer needed
   ```
   revoke API key {keyId}
   ```

### Create Site API Key

**Requires Admin role.**

```bash
curl -s -X POST \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Site Deploy Key", "scopes": ["preview", "live", "code"]}' \
  "https://admin.hlx.page/config/${ORG}/${SITE}/apikeys"
```

**Success:** `Created site API key: {name} (ID: {keyId})`
**▶ Recommended Next Actions:**
1. List site API keys to confirm the key was created
   ```
   list API keys
   ```
2. Revoke immediately if the key value was exposed
   ```
   revoke API key {keyId}
   ```

### Read Site API Key

**Requires Admin role.**

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/${SITE}/apikeys/${KEY_ID}"
```

**▶ Recommended Next Actions:**
1. Revoke this key if it is no longer needed or was exposed
   ```
   revoke API key {keyId}
   ```
2. List all site API keys to audit active credentials
   ```
   list API keys
   ```

### Revoke Site API Key

**Requires Admin role.**

**DESTRUCTIVE OPERATION - CONFIRMATION REQUIRED**

Before executing, you MUST:
1. Tell user: "This will revoke API key '{keyId}' for site '{site}'. Any CI/CD pipelines or automations using this key will stop working immediately."
2. Ask: "Do you want to proceed? (yes/no)"
3. Only execute if user confirms with "yes"

```bash
curl -s -X DELETE \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/${SITE}/apikeys/${KEY_ID}"
```

**Success:** `Revoked site API key: {keyId}`
**▶ Recommended Next Actions:**
1. List site API keys to confirm the key was removed
   ```
   list API keys
   ```
2. Create a replacement key for the affected pipeline
   ```
   create API key
   ```

## Natural Language Patterns

| User Says | Operation |
|-----------|-----------|
| "list API keys" | List site API keys |
| "list org API keys" | List org API keys |
| "create API key for CI/CD" | Create API key |
| "generate API key" | Create API key |
| "revoke API key X" | Delete API key |
| "delete API key X" | Delete API key |
| "show API keys" | List API keys |

## Success Criteria

- ✅ API key list shows IDs, descriptions, roles, and expiration dates
- ✅ New API key value shown to user once at creation with a clear "store securely" warning
- ✅ Revoke operation confirmed with HTTP 200 and user reminded to update dependent pipelines
- ✅ Destructive operations (revoke key) confirmed with user before executing, with affected services stated
- ✅ Org-level keys read from org config (`/config/{org}.json`) — dedicated endpoint is not used
