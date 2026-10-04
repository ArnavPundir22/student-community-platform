# Handoff Report: Backend Architecture & Database Blueprint

**Author**: Explorer 1 (Backend Architecture & Database Explorer)  
**Recipient**: Worker / Implementation Agent  
**Date**: 2026-09-30  
**Target Codebase**: `/home/dell/.gemini/antigravity/scratch/student-community-platform/backend`  
**Handoff Type**: Hard (Investigation Complete & Blueprint Finalized)

---

## 1. Observation

Direct code inspections of the backend revealed the following exact locations, lines of code, and architectural states:

1. **HttpOnly Cookie Authentication Disconnect**:
   - `backend/app/controllers/access_tokens_controller.ts:15-21` sets the cookie on login:
     ```typescript
     response.cookie('auth_token', rawToken, {
       httpOnly: true,
       sameSite: 'lax',
       secure: false,
       path: '/',
       maxAge: '30d',
     })
     ```
   - In `backend/node_modules/@adonisjs/auth/build/modules/access_tokens_guard/main.js:740`, the token extractor explicitly only inspects:
     ```javascript
     const [type, token] = this.#ctx.request.header("authorization", "").split(" ");
     ```
   - `backend/config/auth.ts:16-21` uses `tokensGuard`. `tokensGuard` contains no cookie-reading logic.
   - Neither `backend/app/middleware/auth_middleware.ts` nor `silent_auth_middleware.ts` inspects cookies. Consequently, pure cookie requests from browsers are rejected with `401 Unauthorized`.

2. **Severe Authorization Bypass on Channel Management**:
   - In `backend/app/controllers/channels_controller.ts:20-22`:
     ```typescript
     if (user && community.ownerId !== user.id) {
       return response.forbidden({ message: 'Only the Community Owner can create channels' })
     }
     ```
   - In `backend/app/controllers/channels_controller.ts:56-58`:
     ```typescript
     if (user && community && community.ownerId !== user.id) {
       return response.forbidden({ message: 'Only the Community Owner can delete channels' })
     }
     ```
   - In both cases, if the request is unauthenticated (`user` is `undefined`), `user && ...` evaluates to `false`, allowing unauthenticated clients to create or delete channels.

3. **Missing Community Profile Update (`PUT /api/v1/communities/:id`)**:
   - In `backend/start/routes.ts:44-53`, the registered routes for communities are:
     - `router.get('communities', ...)`
     - `router.get('communities/:id', ...)`
     - `router.post('communities', ...)`
     - `router.delete('communities/:id', ...)`
     - `router.post('communities/:id/join', ...)`
     - `router.post('communities/:id/leave', ...)`
     - `router.get('communities/:id/members', ...)`
     - `router.delete('communities/:id/members/:userId', ...)`
     - `router.put('communities/:id/members/:userId', ...)`
   - Route `PUT communities/:id` and controller method `CommunitiesController.update` are absent.

4. **Missing and Misaligned Auth & Profile Endpoints**:
   - `start/routes.ts:25-42` registers:
     - `auth/signup`, `auth/login`, `auth/oauth`
     - Protected routes are placed under `account/profile` and `account/logout`.
   - Gen2 requirements explicitly specify:
     - `/api/v1/auth/me` (GET)
     - `/api/v1/auth/profile` (GET, PUT)
     - `/api/v1/auth/logout` (POST)
     - Provider-specific OAuth routes for Google, GitHub, LinkedIn (`/api/v1/auth/google`, `/api/v1/auth/github`, `/api/v1/auth/linkedin`, `/api/v1/auth/:provider/redirect`, `/api/v1/auth/:provider/callback`).

5. **Incomplete Real-Time Socket.io Event Engine**:
   - In `backend/app/services/ws_service.ts:57-81`, only the following broadcasts exist:
     - `broadcastNewMessage`
     - `broadcastChannelCreated`
     - `broadcastChannelDeleted`
     - `broadcastCommunityDeleted`
   - Missing broadcasts: `broadcastCommunityUpdated`, `broadcastMemberJoined`, `broadcastMemberLeft`, `broadcastMemberRoleUpdated`.
   - In `ws_service.ts:15-54`, socket listens to `join_channel`, `leave_channel`, `join_community`, `typing_start`, `typing_stop`. Missing: `leave_community`.

6. **Hardcoded Demo User Fallbacks Violating Zero Demo Data**:
   - `backend/app/controllers/communities_controller.ts:43-44`: `auth.user || (await User.find(1)) || (await User.first())`
   - `backend/app/controllers/messages_controller.ts:31-34`: `auth.user || (await User.find(1)) || (await User.findBy('username', 'alex_student')) || (await User.first())`
   - `backend/app/controllers/resources_controller.ts:24-26`: `auth.user || (await User.find(1)) || (await User.findBy('username', 'alex_student')) || (await User.first())`

---

## 2. Logic Chain

1. **HttpOnly Cookie Bridge**:
   - Because `access_tokens_guard` strictly expects an `Authorization: Bearer <token>` header (Obs 1), any request relying on cookies fails authentication.
   - By creating `app/middleware/auth_cookie_middleware.ts` and placing it in `start/kernel.ts` immediately before `@adonisjs/auth/initialize_auth_middleware`, every incoming request with an `auth_token` cookie will have its `headers['authorization']` populated if none is already present.
   - This simultaneously guarantees cookie support and bearer header fallback without modifying third-party packages.

2. **Strict RBAC & 403 Forbidden**:
   - Unauthenticated bypasses in `channels_controller.ts` (Obs 2) occur because `if (user && ...)` guards only execute when `user` is truthy.
   - Rewriting the guard to:
     ```typescript
     try { await auth.check() } catch {}
     const user = auth.user
     if (!user) return response.unauthorized({ message: 'Authentication required' })
     if (community.ownerId !== user.id) return response.forbidden({ message: 'Only the Community Owner can perform this action' })
     ```
     strictly ensures that unauthenticated attempts yield 401 Unauthorized and non-owner authenticated users receive 403 Forbidden.

3. **Community Profile Editing**:
   - To satisfy R2 (Obs 3), `CommunitiesController.update` must be implemented to accept `title`/`name`, `domainTag`, `description`, `iconUrl`/`avatarUrl`, verify owner authorization (returning 403 if `community.ownerId !== user.id`), persist updates, and emit `community_updated` via `WsService`.

4. **Auth Endpoints & Profile Synchronization**:
   - To satisfy R1 (Obs 4), registering `/api/v1/auth/me`, `/api/v1/auth/profile`, `/api/v1/auth/logout`, and provider-specific OAuth endpoints under `/api/v1/auth/` ensures complete compatibility with both the Gen2 specifications and any test suite. Maintaining `/api/v1/account/*` routes prevents any regressions in the existing React UI.

5. **Real-Time Coverage**:
   - Adding `broadcastCommunityUpdated`, `broadcastMemberJoined`, `broadcastMemberLeft`, and `broadcastMemberRoleUpdated` to `WsService` (Obs 5) and hooking them into the corresponding controller actions (`CommunitiesController.join`, `leave`, `kickMember`, `updateMemberRole`, `update`) fulfills R3. Adding `leave_community` ensures socket room cleanliness.

6. **Zero Demo Data Compliance**:
   - Removing all fallback references to `alex_student`, `User.find(1)`, and `User.first()` (Obs 6) ensures that in a blank Supabase database, no synthetic users or demo states can be forged.

---

## 3. Caveats

- **External OAuth Secrets**: Production OAuth flows with Google, GitHub, and LinkedIn require client credentials and redirect URIs registered with the external providers. For testing and development, `OauthController` supports direct JSON credential exchange (as used by the frontend) as well as provider callback routing.
- **SQLite vs Supabase PostgreSQL**: In `.env`, `DB_CONNECTION=sqlite` is active for local testing (`tmp/db.sqlite3`). When switching to production Supabase, `DB_CONNECTION=pg` connects via the already-configured PostgreSQL credentials in `config/database.ts`. Both drivers use identical Lucid models and migrations.
- No other caveats.

---

## 4. Conclusion & Concrete Implementation Blueprint

The Worker should apply the following precise changes:

### A. Create `backend/app/middleware/auth_cookie_middleware.ts`
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthCookieMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.request.header('authorization')) {
      const token = ctx.request.cookie('auth_token') || ctx.request.plainCookie('auth_token')
      if (token) {
        ctx.request.request.headers['authorization'] = `Bearer ${token}`
      }
    }
    return next()
  }
}
```
Register it in `backend/start/kernel.ts` inside `router.use` before `@adonisjs/auth/initialize_auth_middleware`.

### B. Update `backend/start/routes.ts`
1. Under `auth` prefix:
   - `POST 'signup'`, `POST 'login'`, `POST 'oauth'`
   - `POST 'google'`, `POST 'github'`, `POST 'linkedin'` -> `[OauthController, 'callback']`
   - `GET ':provider/redirect'`, `GET ':provider/callback'` -> `[OauthController, 'callback']`
2. Under `auth` prefix with `middleware.auth()`:
   - `GET 'me'` -> `[ProfileController, 'show']`
   - `GET 'profile'` -> `[ProfileController, 'show']`
   - `PUT 'profile'` -> `[ProfileController, 'update']`
   - `POST 'logout'` -> `[AccessTokensController, 'destroy']`
3. Under `account` prefix with `middleware.auth()`:
   - Maintain `profile` (GET, PUT) and `logout` (POST) for frontend backward compatibility.
4. Under communities:
   - Add `router.put('communities/:id', [CommunitiesController, 'update'])`
   - Add `router.delete('communities/:id/leave', [CommunitiesController, 'leave'])` (in addition to `POST`)

### C. Update `backend/app/controllers/communities_controller.ts`
1. Add `update({ params, request, auth, response }: HttpContext)`:
   - Check `auth.user` (return 401 if missing).
   - Find community (return 404 if not found).
   - Check `community.ownerId !== user.id` (return 403 Forbidden).
   - Update `name`/`title`, `domainTag`, `description`, `iconUrl`/`avatarUrl`.
   - Save and call `WsService.broadcastCommunityUpdated(community.id, community)`.
   - Return updated community.
2. In `store`, `join`, `leave`:
   - Remove `auth.user || (await User.first())`. Require `auth.user` (return 401 if null).
   - In `join`: call `WsService.broadcastMemberJoined(communityId, member)`.
   - In `leave`: call `WsService.broadcastMemberLeft(communityId, user.id)`.
3. In `kickMember`:
   - Enforce 403 for non-owners.
   - Call `WsService.broadcastMemberLeft(communityId, targetUserId)` or `broadcastMemberKicked`.
4. In `updateMemberRole`:
   - Allow roles: `['owner', 'admin', 'member']`.
   - If role is `'owner'`, optionally transfer `community.ownerId = targetUserId`.
   - Call `WsService.broadcastMemberRoleUpdated(communityId, member)`.

### D. Update `backend/app/controllers/channels_controller.ts`
1. In `store`:
   - Require `auth.user` (401).
   - Verify `community.ownerId === user.id` (return 403 Forbidden if not owner).
2. In `destroy`:
   - Require `auth.user` (401).
   - Verify `community.ownerId === user.id` (return 403 Forbidden if not owner).

### E. Update `backend/app/services/ws_service.ts`
1. Add listeners in `boot()`:
   - `socket.on('leave_community', (communityId) => socket.leave('community:' + communityId))`
2. Add broadcast methods:
   - `broadcastCommunityUpdated(communityId, community)`: emits `community_updated` to `community:${communityId}` and global.
   - `broadcastMemberJoined(communityId, member)`: emits `member_joined` to `community:${communityId}`.
   - `broadcastMemberLeft(communityId, userId)`: emits `member_left` to `community:${communityId}`.
   - `broadcastMemberRoleUpdated(communityId, member)`: emits `member_role_updated` to `community:${communityId}`.

### F. Update `backend/app/controllers/messages_controller.ts` & `resources_controller.ts`
1. Remove all `alex_student` and `User.first()` fallbacks. Require `auth.user` (return 401 if missing).
2. In `messages_controller.ts`: validate non-empty trimmed content (`if (!content || !content.trim()) return response.badRequest(...)`).
3. Call `WsService.broadcastNewMessage(channelId, message)`.

---

## 5. Verification Method

1. **Compilation & Typecheck**:
   ```bash
   cd /home/dell/.gemini/antigravity/scratch/student-community-platform/backend
   npm run typecheck
   ```
   Must pass with 0 errors.

2. **Automated Endpoint Testing via HTTP**:
   - **Signup/Login**: Send `POST /api/v1/auth/login` and verify response headers include `set-cookie: auth_token=...; HttpOnly`.
   - **Cookie Auth**: Send `GET /api/v1/auth/me` with `Cookie: auth_token=<token>` (without `Authorization` header). Verify 200 OK with user profile payload.
   - **Bearer Auth Fallback**: Send `PUT /api/v1/auth/profile` with `Authorization: Bearer <token>` and `{ "bio": "Updated bio" }`. Verify 200 OK.
   - **Strict 403 Forbidden (RBAC)**:
     - As User B (non-owner), attempt:
       - `DELETE /api/v1/communities/:ownerCommunityId` -> 403 Forbidden
       - `PUT /api/v1/communities/:ownerCommunityId` -> 403 Forbidden
       - `POST /api/v1/communities/:ownerCommunityId/channels` -> 403 Forbidden
       - `DELETE /api/v1/channels/:ownerChannelId` -> 403 Forbidden
       - `DELETE /api/v1/communities/:ownerCommunityId/members/:userId` -> 403 Forbidden
       - `PUT /api/v1/communities/:ownerCommunityId/members/:userId` -> 403 Forbidden
   - **Unauthenticated Protection**:
     - Attempt any administrative route without credentials -> 401 Unauthorized or 403 Forbidden (never 200/201).
   - **Real-Time WebSockets**:
     - Connect Socket.io client to backend; subscribe to `community:<id>`.
     - Trigger channel creation, community update, member join, member leave, role update, and chat messages. Verify events fire promptly on room subscribers.
