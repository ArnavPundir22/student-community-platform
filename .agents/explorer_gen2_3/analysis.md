# QA & Verification Infrastructure Analysis — Milestone Gen2

**Author**: Explorer Gen2 - 3 (QA & Verification Explorer)  
**Date**: 2026-09-30  
**Target Codebase**: `/home/dell/.gemini/antigravity/scratch/student-community-platform`  
**Network Mode**: CODE_ONLY  

---

## 1. Executive Summary & Build Health

A comprehensive empirical audit of the testing infrastructure, build pipelines, endpoint verification scripts, and security enforcement mechanisms was performed for the Student Community & Collaboration Platform.

### 1.1 Summary Matrix

| Component | Status | Findings / Root Cause |
|---|---|---|
| **Frontend Build** (`npm run build`) | **PASS (0 errors)** | `tsc -b && vite build` completed in 439ms; 1960 modules transformed cleanly. Production assets generated in `frontend/dist/`. |
| **Backend Typecheck** (`npm run typecheck`) | **PASS (0 errors)** | `tsc --noEmit` exited with status 0; full TypeScript AST passes with no type mismatches. |
| **Backend Japa Tests** (`npm run test`) | **FAIL (4/6 failed)** | `tests/functional/hardening.spec.ts` fails 4 tests because unauthenticated POSTs hit controllers where authentication is required, or where zero database state causes unexpected 401s instead of expected 400/404s. |
| **Verification Script** (`verify_endpoints.sh`) | **FAIL (10/12 failed)** | Hardcoded assumptions of Gen1 seeded demo data (Community ID 1, Community ID 3, user `alex@university.edu`, message count > 0) cause cascading failures on a clean zero-data database. |
| **HttpOnly Cookie Authentication** | **DEFICIENT** | Backend `AccessTokensController` emits HttpOnly cookie `auth_token`, but AdonisJS `tokensGuard` and `SilentAuthMiddleware` ONLY inspect `Authorization: Bearer <token>`. Requests sending only cookies (`curl -b cookiejar.txt`) fail with 401 Unauthorized. |
| **Role-Based Access Control (RBAC)** | **CRITICAL VULNERABILITY** | In `channels_controller.ts`, permission checks check `if (user && community.ownerId !== user.id)`. Unauthenticated callers (`user === null`) bypass the check and can create or delete channels! |
| **Route Definitions vs Requirements** | **PATH / METHOD MISMATCH** | 1. Prompt requires `PUT /api/v1/auth/profile`; routes currently use `/api/v1/account/profile`.<br>2. Prompt requires `DELETE /api/v1/communities/:id/leave`; routes only register `POST`. |
| **Server Hot Reloading** | **OPERATIONAL TRAP** | `backend/package.json`'s `hotHook.boundaries` only includes controllers and middleware. Changes to `start/routes.ts` are NOT hot-reloaded and require an explicit server restart. |

---

## 2. In-Depth Technical Findings & Vulnerabilities

### 2.1 HttpOnly Cookie Authentication Gap

#### Observation:
In `backend/app/controllers/access_tokens_controller.ts` (lines 15-21) and `new_account_controller.ts` (lines 27-33):
```typescript
response.cookie('auth_token', rawToken, {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
  path: '/',
  maxAge: '30d',
})
```
However, in `backend/config/auth.ts`:
```typescript
guards: {
  api: tokensGuard({
    provider: tokensUserProvider({
      tokens: 'accessTokens',
      model: () => import('#models/user'),
    }),
  }),
}
```
And in `backend/app/middleware/silent_auth_middleware.ts`:
```typescript
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()
    return next()
  }
}
```

#### Empirical Verification:
1. Signup/Login via curl saves the cookie to `/tmp/cookiejar.txt`:
   `#HttpOnly_localhost FALSE / FALSE 1793377006 auth_token s%3A...`
2. Executing:
   `curl -s -b /tmp/cookiejar.txt http://localhost:3333/api/v1/account/profile`
   returns:
   `{"errors":[{"message":"Unauthorized access"}]}` (HTTP 401).
3. Executing the same request with `Authorization: Bearer <token>` succeeds with HTTP 200.

#### Root Cause:
AdonisJS `@adonisjs/auth/access_tokens` (`tokensGuard`) only checks the `Authorization` header for Bearer tokens. It does not extract tokens from signed cookies.

#### Recommended Implementation Fix:
Update `backend/app/middleware/silent_auth_middleware.ts` to inspect the cookie when the header is absent:
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const cookieToken = ctx.request.cookie('auth_token')
    if (cookieToken && !ctx.request.header('authorization')) {
      ctx.request.request.headers['authorization'] = `Bearer ${cookieToken}`
    }
    await ctx.auth.check()
    return next()
  }
}
```

---

### 2.2 Critical Vulnerability: Unauthenticated Channel Creation/Deletion RBAC Bypass

#### Observation:
In `backend/app/controllers/channels_controller.ts`:
Line 20 (`store`):
```typescript
if (user && community.ownerId !== user.id) {
  return response.forbidden({ message: 'Only the Community Owner can create channels' })
}
```
Line 56 (`destroy`):
```typescript
if (user && community && community.ownerId !== user.id) {
  return response.forbidden({ message: 'Only the Community Owner can delete channels' })
}
```

#### Vulnerability Analysis:
If an unauthenticated request is sent (no Bearer token, no cookie):
- `user` is `undefined`.
- The expression `user && community.ownerId !== user.id` evaluates to `false`!
- The code proceeds to line 30 / line 60 and creates or deletes channels without any authentication or authorization!

#### Recommended Implementation Fix:
Enforce authentication before role evaluation:
```typescript
if (!user) {
  return response.unauthorized({ message: 'Authentication required' })
}
if (community.ownerId !== user.id) {
  return response.forbidden({ message: 'Only the Community Owner can manage channels' })
}
```

---

### 2.3 Route Mismatches (Path & Method)

1. **Profile Endpoint**:
   - User Requirement: `Profile fetch & profile update (PUT /api/v1/auth/profile)`
   - Backend Implementation: Registered under `/api/v1/account/profile` (`routes.ts` line 40).
   - Solution: Support both `/api/v1/auth/profile` and `/api/v1/account/profile`.

2. **Leave Community Endpoint**:
   - User Requirement: `DELETE /api/v1/communities/:id/leave`
   - Backend Implementation: `POST /api/v1/communities/:id/leave` (`routes.ts` line 49).
   - Solution: Support both `POST` and `DELETE` on `communities/:id/leave`.

---

### 2.4 Server Hot-Reload Limitations

In `backend/package.json`:
```json
"hotHook": {
  "boundaries": [
    "./app/controllers/**/*.ts",
    "./app/middleware/*.ts"
  ]
}
```
`start/routes.ts` is NOT in the hotHook boundary. If an engineer edits `routes.ts`, the running server does NOT reload the routes. In testing, `node ace list:routes` reflects the disk file, but the active process listening on `:3333` continues serving old routes until manually killed and restarted.

---

### 2.5 Zero Demo Data vs Legacy Fallback Hacks

#### Observation:
When started with a clean database:
- `GET /api/v1/communities` returns `[]`.
- `GET /api/v1/resources` returns `[]`.

However, in `MessagesController.ts` (lines 30-34) and `ResourcesController.ts` (lines 22-26):
```typescript
const user =
  auth.user ||
  (await User.find(1)) ||
  (await User.findBy('username', 'alex_student')) ||
  (await User.first())
```
If an unauthenticated request is sent after users exist, `User.first()` resolves to whichever user was created first (User 1)! The unauthenticated request is silently attributed to User 1.
In zero-data mode when 0 users exist, `user` evaluates to null, triggering `response.unauthorized()`. This caused `hardening.spec.ts` to receive 401 instead of 400 for malformed channel IDs.

#### Recommendation:
Remove all `(await User.find(1)) || (await User.first())` fallback hacks from controllers. Authenticated actions must strictly require `auth.user`.

---

## 3. Test Coverage Matrix & Deficiencies

| Feature / Requirement | Current Japa Coverage | Current Shell Script Coverage | Status | Action Needed |
|---|---|---|---|---|
| Zero initial demo data check | None | Fails (expects >=3 communities) | ❌ Missing | Add test asserting `GET /communities` is `[]` on fresh DB |
| Credentials Signup (`POST /auth/signup`) | None | None | ❌ Missing | Add Japa & Shell tests for signup + cookie check |
| Credentials Login (`POST /auth/login`) | None | Optional single call (ignored) | ❌ Missing | Add Japa & Shell tests for login + cookie check |
| HttpOnly Cookie `auth_token` verification | None | None | ❌ Missing | Add cookie jar verification (`curl -b cookiejar.txt`) |
| OAuth2.0 callback route (`POST /auth/oauth`) | None | None | ❌ Missing | Test Google, GitHub, LinkedIn provider payloads |
| Profile fetch (`GET /account/profile` & `/auth/profile`) | None | None | ❌ Missing | Test authenticated fetch via cookie & Bearer |
| Profile update (`PUT /auth/profile`) | None | None | ❌ Missing | Test updating bio, fullName, domainInterests |
| Community Creation by User A (Owner) | None | None | ❌ Missing | Test ownerId assignment and default channel creation |
| Community Join by User B (Member) | None | None | ❌ Missing | Test membership creation and role='member' |
| Join Idempotency | None | In empirical suite | ⚠️ Partial | Integrate into Japa & automated test script |
| Non-Owner DELETE community -> 403 Forbidden | None | None | ❌ Missing | Crucial security check |
| Non-Owner POST community channels -> 403 Forbidden | None | None | ❌ Missing | Crucial security check |
| Non-Owner DELETE channels -> 403 Forbidden | None | None | ❌ Missing | Crucial security check |
| Non-Owner Update member role -> 403 Forbidden | None | None | ❌ Missing | Crucial security check |
| Non-Owner Kick member -> 403 Forbidden | None | None | ❌ Missing | Crucial security check |
| Owner administrative operations -> 200 OK | None | None | ❌ Missing | Test channel creation, deletion, role promotion/demotion |
| Member leave community -> 200 OK | None | None | ❌ Missing | Test `POST/DELETE /communities/:id/leave` |
| Owner leave community -> 400 Bad Request | None | None | ❌ Missing | Test owner cannot leave without deleting |
| Message posting & room broadcast | None | Fails (expects demo fallback) | ❌ Broken | Update test to use authenticated token |
| Resource creation & domain filtering | Fails (unauth) | Fails (expects demo data) | ❌ Broken | Update test to use authenticated token |
| Monotonic resource upvotes | None | In empirical suite | ⚠️ Partial | Add to main verification suite |
| WebSocket channel & community events | Channel typing/msg only | Partial (timed out on zero-data) | ⚠️ Incomplete | Add community broadcast events (`channel_created`, etc.) |

---

## 4. Automated Verification Script Blueprint (`verify_e2e_gen2.sh`)

A comprehensive verification script was designed to replace `verify_endpoints.sh`. It executes cleanly against a zero-data or running database without relying on fake pre-seeded data.

### Script Architecture:
1. **Zero Data Verification**:
   - `GET /api/v1/communities` -> verifies 200 OK and response is `[]` or valid array.
   - `GET /api/v1/resources` -> verifies 200 OK.
2. **User Registration & Cookie Validation**:
   - Registers **User A (Alice)** via `POST /api/v1/auth/signup` saving cookies to `/tmp/alice_cookies.txt`.
   - Asserts HttpOnly `auth_token` cookie is present in `/tmp/alice_cookies.txt`.
   - Registers **User B (Bob)** via `POST /api/v1/auth/signup` saving cookies to `/tmp/bob_cookies.txt`.
   - Asserts HttpOnly `auth_token` cookie is present in `/tmp/bob_cookies.txt`.
3. **OAuth2.0 Route Verification**:
   - `POST /api/v1/auth/oauth` with `{ provider: 'github', email: 'gh_student@university.edu', fullName: 'GitHub Student' }`.
   - Asserts 200 OK and token issuance.
4. **Cookie Authentication & Profile Update**:
   - `GET /api/v1/account/profile` using ONLY `-b /tmp/alice_cookies.txt` (no Authorization header).
   - `PUT /api/v1/auth/profile` and `PUT /api/v1/account/profile` updating bio to `"AI Researcher"` using cookie.
   - Asserts 200 OK and bio updated.
5. **Community Lifecycle & RBAC Verification**:
   - User A creates community `"Autonomous AI Agents"` -> 201 Created, ownerId = User A ID.
   - Asserts default channels `#general-discussion` and `#resources` are auto-created.
   - User B joins community -> 201 Created, role = `"member"`.
   - User B attempts `DELETE /api/v1/communities/:id` -> **403 Forbidden**.
   - User B attempts `POST /api/v1/communities/:id/channels` -> **403 Forbidden**.
   - User B attempts `DELETE /api/v1/channels/:id` -> **403 Forbidden**.
   - User B attempts `PUT /api/v1/communities/:id/members/:userId` -> **403 Forbidden**.
   - User B attempts `DELETE /api/v1/communities/:id/members/:userId` -> **403 Forbidden**.
   - Unauthenticated attempt `POST /api/v1/communities/:id/channels` -> **401 Unauthorized**.
6. **Owner Administrative Operations**:
   - User A creates custom channel `#paper-discussions` -> 201 Created.
   - User A updates User B role to `"admin"` -> 200 OK.
   - User A demotes User B role to `"member"` -> 200 OK.
7. **Leave Community**:
   - User B leaves community (`POST /api/v1/communities/:id/leave` and `DELETE /api/v1/communities/:id/leave`) -> 200 OK.
   - User A attempts to leave community -> 400 Bad Request ("Owner cannot leave...").
8. **Chat & Resources**:
   - User A posts message to `#general-discussion` with auth -> 201 Created.
   - User A posts resource `"Attention Is All You Need"` -> 201 Created.
   - User B upvotes resource -> 200 OK, counter = 2.
9. **Deletion & Cleanup**:
   - User A deletes custom channel -> 200 OK.
   - User A deletes community -> 200 OK.
10. **WebSocket Real-time Suite**:
    - Executes node script validating typing indicators, message broadcasting, channel creation, and community deletion events.

---

## 5. Japa Test Suite Blueprint

The current `backend/tests/` layout should be augmented with discrete, isolated functional test specifications:

```
backend/tests/functional/
├── 01_zero_data.spec.ts         # Verifies fresh DB starts clean
├── 02_auth.spec.ts              # Signup, login, logout, cookie, OAuth
├── 03_profile.spec.ts           # Profile get/update under /auth and /account
├── 04_rbac_communities.spec.ts # Owner vs Member permission matrix (403 vs 200)
├── 05_channels.spec.ts          # Channel creation/deletion and permissions
├── 06_messages_resources.spec.ts# Authenticated messages, resources, upvoting
└── 07_hardening.spec.ts         # Defensive input validation & XSS protection
```

### Key Spec Designs:

#### `01_zero_data.spec.ts`
```typescript
import { test } from '@japa/runner'

test.group('Zero Initial Demo Data', () => {
  test('GET /api/v1/communities starts empty', async ({ client }) => {
    const res = await client.get('/api/v1/communities')
    res.assertStatus(200)
    res.assertBody([])
  })

  test('GET /api/v1/resources starts empty', async ({ client }) => {
    const res = await client.get('/api/v1/resources')
    res.assertStatus(200)
    res.assertBody([])
  })
})
```

#### `04_rbac_communities.spec.ts`
```typescript
import { test } from '@japa/runner'
import User from '#models/user'

test.group('RBAC Community Security Matrix', () => {
  test('Member cannot delete community (403 Forbidden)', async ({ client }) => {
    const owner = await User.create({ email: 'owner@test.edu', password: 'Password123!' })
    const member = await User.create({ email: 'member@test.edu', password: 'Password123!' })
    
    const ownerToken = (await User.accessTokens.create(owner)).value!.release()
    const memberToken = (await User.accessTokens.create(member)).value!.release()

    const commRes = await client.post('/api/v1/communities')
      .bearerToken(ownerToken)
      .json({ name: 'Robotics', domainTag: 'Robotics' })
    const commId = commRes.body().id

    // Member attempts deletion
    const delRes = await client.delete(`/api/v1/communities/${commId}`)
      .bearerToken(memberToken)
    delRes.assertStatus(403)

    // Member attempts adding channel
    const chRes = await client.post(`/api/v1/communities/${commId}/channels`)
      .bearerToken(memberToken)
      .json({ name: 'illegal-channel' })
    chRes.assertStatus(403)

    // Owner succeeds
    const ownerDelRes = await client.delete(`/api/v1/communities/${commId}`)
      .bearerToken(ownerToken)
    ownerDelRes.assertStatus(200)
  })
})
```

---

## 6. Actionable Recommendations for Worker & Challengers

1. **Fix SilentAuthMiddleware & Cookie Authentication**:
   - In `backend/app/middleware/silent_auth_middleware.ts`, extract `request.cookie('auth_token')` and map to `Authorization: Bearer <token>` when header is missing.
2. **Patch Channel RBAC Security Bypass**:
   - In `backend/app/controllers/channels_controller.ts`, add explicit `if (!user) return response.unauthorized(...)` in `store` and `destroy` to prevent unauthenticated access.
3. **Register Route Aliases**:
   - In `backend/start/routes.ts`:
     - Add `router.get('profile', [ProfileController, 'show'])` and `router.put('profile', [ProfileController, 'update'])` to `/api/v1/auth/` as well as `/api/v1/account/`.
     - Add `router.delete('communities/:id/leave', [CommunitiesController, 'leave'])` alongside `POST`.
4. **Remove Controller Fallbacks**:
   - In `MessagesController` and `ResourcesController`, remove `(await User.find(1)) || (await User.first())` fallbacks.
5. **Update Verification Script**:
   - Replace or update `verify_endpoints.sh` with the Gen2 self-contained verification suite that signs up dynamic users and verifies 403 Forbidden RBAC enforcement.
6. **Restart Backend Server**:
   - Ensure the AdonisJS server is restarted so updated `start/routes.ts` routes are loaded by the active process.
