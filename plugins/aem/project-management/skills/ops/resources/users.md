---
name: ops-users
description: User management operations for Edge Delivery Services - add/remove admins and authors, list access, check current user profile.
allowed-tools: Read, Write, Edit, Bash
---

# Edge Delivery Services Operations - User Management

Manage user access for Edge Delivery Services sites.

## When to Use

- Granting a new team member admin or author access to a site
- Revoking access for a user who has left the team or changed role
- Auditing who currently has access before a security review
- Checking your own profile and permissions (`who am i`)
- Managing users at the org level when the site uses a centralized (repoless) access model

## API Reference

### Site-Level Access
| Intent | Endpoint | Method |
|--------|----------|--------|
| list site users | `/config/{org}/sites/{site}/access.json` | GET |
| add admin | `/config/{org}/sites/{site}/access/admin.json` | POST |
| add author | `/config/{org}/sites/{site}/access/author.json` | POST |
| remove user | `/config/{org}/sites/{site}/access/{role}/{email}.json` | DELETE |

### Org-Level Users
| Intent | Endpoint | Method |
|--------|----------|--------|
| list org users | `/config/{org}.json` → `users[]` | GET |
| add org user | `/config/{org}/users` | POST |
| get org user | `/config/{org}/users/{userId}` | GET |
| remove org user | `/config/{org}/users/{userId}` | DELETE |

### Profile
| Intent | Endpoint | Method |
|--------|----------|--------|
| who am i | `/profile` | GET |

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - preview, publish, unpublish, user management, code sync |
| **Author** | Content operations - preview, publish (no unpublish, no user management) |

## Operations

### List Users

Try the site-level access endpoint first. If it returns 404, the org manages users centrally in the org config.

```bash
# Primary: site-level access
HTTP=$(curl -s -w "%{http_code}" -o /tmp/access.json \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/sites/${SITE}/access.json")

if [ "$HTTP" = "200" ]; then
  cat /tmp/access.json
else
  # Fallback: users embedded in org config
  echo "Site-level access.json returned $HTTP — reading from org config..."
  curl -s \
    -H "x-auth-token: ${AUTH_TOKEN}" \
    "https://admin.hlx.page/config/${ORG}.json"
fi

# On success: extract users[] array — group by role (admin / author) and display email list.
```

**Note:** Orgs that manage access via org config (common in repoless setups) return 404 on the site access endpoint. The fallback reads `users[]` from `GET /config/{org}.json`.

Returns:
```json
{
  "admin": ["admin1@example.com", "admin2@example.com"],
  "author": ["author1@example.com", "author2@example.com"]
}
```

**▶ Recommended Next Actions:**
1. Grant admin access to a user
   ```
   add {email} as admin
   ```
2. Grant author access to a user
   ```
   add {email} as author
   ```
3. Remove a user's access
   ```
   remove {role} {email}
   ```

### Add Admin

**Requires Admin role.**

```bash
curl -s -X POST \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"users": ["user@example.com"]}' \
  "https://admin.hlx.page/config/${ORG}/sites/${SITE}/access/admin.json"
```

**Success:** `Added {email} as admin`
**▶ Recommended Next Actions:**
1. Verify the user appears in the access list
   ```
   list users
   ```
2. Confirm the user can perform admin operations
   ```
   who am i
   ```

### Add Author

**Requires Admin role.**

```bash
curl -s -X POST \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"users": ["user@example.com"]}' \
  "https://admin.hlx.page/config/${ORG}/sites/${SITE}/access/author.json"
```

**Success:** `Added {email} as author`
**▶ Recommended Next Actions:**
1. Verify the user appears in the access list
   ```
   list users
   ```
2. Review all roles currently granted on this site
   ```
   show permissions
   ```

### Remove User

**Requires Admin role.**

**DESTRUCTIVE OPERATION - CONFIRMATION REQUIRED**

Before executing, you MUST:
1. Tell user: "This will revoke {role} access for {email}. They will no longer be able to perform {role} operations on this site."
2. Ask: "Do you want to proceed? (yes/no)"
3. Only execute if user confirms with "yes"

```bash
curl -s -X DELETE \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/sites/${SITE}/access/${ROLE}/${EMAIL}.json"
```

**Success:** `Removed {email} from {role}`
**▶ Recommended Next Actions:**
1. Confirm the user has been removed from the access list
   ```
   list users
   ```
2. If the user also needs to be removed from the org
   ```
   remove user from org
   ```

### Get Current User Profile

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/profile"
```

**Success:** `Logged in as {email} ({name})`
**▶ Recommended Next Actions:**
1. Check all users who have access to this site
   ```
   list users
   ```
2. View site configuration to see your permissions scope
   ```
   show site config
   ```

### List Org Users

Org-level users are embedded in the org config under the `users[]` array. The dedicated `/config/{org}/users` endpoint returns 400 — use the org config endpoint instead.

```bash
curl -s \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}.json"
```

**On success:** Extract `users[]` array — display each user's `email` and `roles`. Report total count.

**▶ Recommended Next Actions:**
1. Add a new user to the organization
   ```
   add user to org
   ```
2. Remove a user from the organization
   ```
   remove user from org
   ```

### Add Org User

**Requires Admin role.**

```bash
curl -s -X POST \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}' \
  "https://admin.hlx.page/config/${ORG}/users"
```

**▶ Recommended Next Actions:**
1. Confirm the user was added to the org
   ```
   list org users
   ```
2. Grant site-level access to the new org user
   ```
   add {email} as author
   ```

### Remove Org User

**Requires Admin role.**

**DESTRUCTIVE OPERATION - CONFIRMATION REQUIRED**

Confirm: "This will remove {userId} from the organization. Proceed? (yes/no)"

```bash
curl -s -X DELETE \
  -H "x-auth-token: ${AUTH_TOKEN}" \
  "https://admin.hlx.page/config/${ORG}/users/${USER_ID}"
```

**▶ Recommended Next Actions:**
1. Confirm the user has been removed from the org
   ```
   list org users
   ```
2. Also remove site-level access if not already done
   ```
   remove {role} {email}
   ```

## Natural Language Patterns

| User Says | Operation |
|-----------|-----------|
| "add john@acme.com as author" | Add author |
| "add jane@acme.com as admin" | Add admin |
| "remove admin user@example.com" | Remove from admin |
| "remove author user@example.com" | Remove from author |
| "who has access" | List users |
| "list users" | List users |
| "who am i" | Get profile |
| "what's my email" | Get profile |
| "show permissions" | List users |
| "list org users" | List org users |
| "add user to org" | Add org user |
| "remove user from org" | Remove org user |

## Success Criteria

- ✅ User list shows current admins and authors with their email addresses
- ✅ Add operation confirmed with HTTP 200 and the updated access list shown to user
- ✅ Destructive operations (remove user) confirmed with user before executing, with role and impact stated clearly
- ✅ Org-level fallback used automatically when site-level `access.json` returns 404
- ✅ Profile check reports the authenticated user's email and display name
