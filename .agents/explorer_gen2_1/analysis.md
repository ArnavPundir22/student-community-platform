# Backend Architecture & Database Gap Analysis (Gen2)

**Author**: Explorer 1 (Backend Architecture & Database Explorer)  
**Date**: 2026-09-30  
**Target Backend**: `/home/dell/.gemini/antigravity/scratch/student-community-platform/backend`  
**Reference Document**: `.agents/ORIGINAL_REQUEST.md` (## 2026-09-30T16:00:15Z)

---

## 1. Executive Summary

This read-only architectural investigation examines the AdonisJS v6 backend against the authoritative Gen2 requirements. While the basic foundation for a multi-channel student community platform is present (AdonisJS v6, Lucid ORM, Socket.io, auth access tokens), **critical architectural gaps and security vulnerabilities exist** across Authentication, RBAC, Real-Time Events, and Demo Data handling.

Key vulnerabilities and missing capabilities identified:
1. **HttpOnly Cookie Authentication Disconnect**: The backend issues `auth_token` HttpOnly cookies upon login/signup, but `@adonisjs/auth`'s `tokensGuard` **never reads cookies**—it only inspects the `Authorization: Bearer <token>` header. Without an extraction middleware bridging incoming `auth_token` cookies into the authorization header before authentication, pure cookie-based sessions fail with 401 Unauthorized.
2. **Missing Auth Routes & Profile Endpoint**: The platform requires `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, and provider-specific OAuth endpoints (`google`, `github`, `linkedin`). Currently, profile routes are misaligned under `/api/v1/account/*` and provider-specific routes are missing.
3. **Severe Authorization Bypass in Channel Management**: In `ChannelsController`, ownership checks use `if (user && community.ownerId !== user.id)`. When an unauthenticated request arrives (`user` is `undefined`), the condition evaluates to `false` and is skipped—allowing unauthenticated users to create and delete channels!
4. **Missing Community Profile Edit (`PUT /api/v1/communities/:id`)**: Community owners cannot update their community profile (title, description, domain tag, icon/avatar). The route and controller method do not exist.
5. **Incomplete Socket.io Real-Time Broadcasts**: While channel creation/deletion and messages are emitted, member join/leave, member role updates, member kicks, and community updates are **not broadcast** to room subscribers.
6. **Hardcoded Demo User Fallbacks**: Multiple controllers silently fall back to `User.find(1)`, `User.findBy('username', 'alex_student')`, or `User.first()`, directly violating the requirement of **Zero Demo Data**.

---

## 2. Requirement 1: Authentication System Deep-Dive

### 2.1 Credentials Auth & Session Lifecycle
- **Signup (`POST /api/v1/auth/signup`)**:
  - Located in `app/controllers/new_account_controller.ts`.
  - Validates `email`, `password`, optional `fullName`, `username`, and `domainInterests`.
  - Issues token via `User.accessTokens.create(user)` and sets `auth_token` cookie.
- **Login (`POST /api/v1/auth/login`)**:
  - Located in `app/controllers/access_tokens_controller.ts`.
  - Verifies credentials, issues token, sets `auth_token` cookie.
- **Logout (`POST /api/v1/auth/logout`)**:
  - **Gap**: Currently mapped to `POST /api/v1/account/logout`. Must be registered under `/api/v1/auth/logout` as well.
  - Clears `auth_token` cookie and deletes access token record.

### 2.2 The HttpOnly Cookie vs. Bearer Header Gap
- **Code Observation**:
  - In `backend/node_modules/@adonisjs/auth/build/modules/access_tokens_guard/main.js`:
    ```javascript
    const [type, token] = this.#ctx.request.header("authorization", "").split(" ");
    ```
  - `access_tokens_guard` only inspects `ctx.request.header('authorization')`.
  - In `config/auth.ts`:
    ```typescript
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      }),
    })
    ```
- **The Problem**:
  When a browser sends an authenticated request relying solely on the HttpOnly cookie `auth_token` (without a manual `Authorization: Bearer <token>` header), `access_tokens_guard` cannot find the token and rejects the request with `401 Unauthorized`.
- **Architectural Solution**:
  Introduce `app/middleware/auth_cookie_middleware.ts` before `@adonisjs/auth/initialize_auth_middleware` in `start/kernel.ts`:
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
  This cleanly normalizes incoming requests so that:
  - If `Authorization: Bearer <token>` is present, it is respected.
  - If `Authorization` is absent, the HttpOnly `auth_token` cookie is seamlessly elevated to the authorization header.
  - Both cookie-based browser sessions and token-based API test clients work transparently.

### 2.3 OAuth 2.0 Provider Endpoints
- **Current State**:
  - `start/routes.ts` registers only `POST /api/v1/auth/oauth` (`OauthController.callback`).
- **Gen2 Requirement**:
  - "OAuth2.0 endpoints/routes for Google, GitHub, LinkedIn."
- **Gap & Solution**:
  Register dedicated endpoints under `/api/v1/auth/`:
  - `POST /api/v1/auth/google`, `POST /api/v1/auth/github`, `POST /api/v1/auth/linkedin`
  - `GET /api/v1/auth/:provider/redirect` and `GET /api/v1/auth/:provider/callback`
  - Keep `POST /api/v1/auth/oauth` for backward compatibility with the frontend modal buttons.

### 2.4 Profile Fetch & Update
- **Gen2 Requirement**:
  - "Persistent user session, `/api/v1/auth/me`, and profile data update (`PUT /api/v1/auth/profile` supporting full name, avatar URL, bio, domain interests)."
- **Current State**:
  - Profile is registered under `/api/v1/account/profile` only.
- **Gap & Solution**:
  - Register `/api/v1/auth/me` (GET) -> `[ProfileController, 'show']`.
  - Register `/api/v1/auth/profile` (GET, PUT) -> `[ProfileController, 'show']` and `[ProfileController, 'update']`.
  - Keep `/api/v1/account/profile` for frontend backward compatibility.
  - Verify that `ProfileController.update` supports `fullName`, `avatarUrl`, `bio`, and `domainInterests`.

---

## 3. Requirement 2: Role-Based Community Management Deep-Dive

### 3.1 Owner vs. Regular User Capabilities Matrix

| Action | Endpoint | Permitted Role | Current Behavior | Gap / Fix Needed |
|---|---|---|---|---|
| Delete Community | `DELETE /api/v1/communities/:id` | Owner 👑 | Checks `community.ownerId !== user.id` | Works, but remove `User.first()` fallback |
| Create Channel | `POST /api/v1/communities/:id/channels` | Owner 👑 | Checks `if (user && community.ownerId !== user.id)` | **CRITICAL BUG**: Unauthenticated bypass. Return 401 if !user, 403 if not owner |
| Delete Channel | `DELETE /api/v1/channels/:id` | Owner 👑 | Checks `if (user && community && community.ownerId !== user.id)` | **CRITICAL BUG**: Unauthenticated bypass. Return 401 if !user, 403 if not owner |
| Edit Community | `PUT /api/v1/communities/:id` | Owner 👑 | **DOES NOT EXIST** | **MISSING**: Implement controller method & route, verify owner, return 403 if not owner |
| Kick Member | `DELETE /api/v1/communities/:id/members/:userId` | Owner 👑 | Checks `community.ownerId !== user.id` | Works, but add Socket.io broadcast |
| Update Member Role | `PUT /api/v1/communities/:id/members/:userId` | Owner 👑 | Checks `community.ownerId !== user.id`, limits to `['admin', 'member']` | Support `['owner', 'admin', 'member']`, add Socket.io broadcast |
| View Members | `GET /api/v1/communities/:id/members` | Public / Member | Returns member list preloading user | Ensure 404 if community does not exist |
| Join Community | `POST /api/v1/communities/:id/join` | Any Auth User | Adds member; has `User.first()` fallback | Remove fallback; add Socket broadcast |
| Leave Community | `DELETE /api/v1/communities/:id/leave` | Member (Not Owner) | Registered as `POST` only; has `User.first()` fallback | Register `DELETE` (and keep `POST`), remove fallback, add Socket broadcast |

### 3.2 Strict 403 Forbidden Enforcement Architecture
To guarantee that **"Non-owner users attempting administrative operations receive 403 Forbidden responses"**:
1. All administrative endpoints (`DELETE /communities/:id`, `PUT /communities/:id`, `POST /communities/:id/channels`, `DELETE /channels/:id`, `DELETE /communities/:id/members/:userId`, `PUT /communities/:id/members/:userId`) must:
   - Authenticate the caller: if no valid user, return **401 Unauthorized**.
   - Load the community: if community does not exist, return **404 Not Found**.
   - Check owner ID: `if (community.ownerId !== user.id) return response.forbidden({ message: 'Only the Community Owner can perform this action' })` -> **403 Forbidden**.
2. Never let `user` be optional or undefined in administrative routes.

---

## 4. Requirement 3: Real-Time Socket.io Event Engine Deep-Dive

### 4.1 Room Architecture & Subscription Model
- Rooms:
  - `channel:${channelId}` for channel-specific chat messages and typing indicators.
  - `community:${communityId}` for community-scoped events (channel creation/deletion, member join/leave, member role updates, community profile updates).
  - Global broadcast for top-level discovery events (`community_deleted`, `global_channel_created`, `global_channel_deleted`).

### 4.2 Event Inventory & Gap Analysis

| Event Name | Direction | Payload | Current Status | Action Required |
|---|---|---|---|---|
| `join_channel` | Client -> Server | `channelId` | Implemented | None |
| `leave_channel` | Client -> Server | `channelId` | Implemented | None |
| `join_community` | Client -> Server | `communityId` | Implemented | None |
| `leave_community` | Client -> Server | `communityId` | **MISSING** | Add `socket.on('leave_community')` |
| `typing_start` | Client -> Server | `{ channelId, username }` | Implemented | None |
| `typing_stop` | Client -> Server | `{ channelId, username }` | Implemented | None |
| `user_typing` | Server -> Room (`channel:${id}`) | `{ channelId, username, isTyping }` | Implemented | None |
| `new_message` | Server -> Room (`channel:${id}`) | `Message` object with preloaded `user` | Implemented | Use `WsService.broadcastNewMessage` |
| `channel_created` | Server -> Room (`community:${id}`) | `Channel` object | Implemented | None |
| `channel_deleted` | Server -> Room (`community:${id}`) | `{ communityId, channelId }` | Implemented | None |
| `community_updated` | Server -> Room & Global | `Community` object | **MISSING** | Add `broadcastCommunityUpdated` |
| `community_deleted` | Server -> Global | `{ communityId }` | Implemented | None |
| `member_joined` | Server -> Room (`community:${id}`) | `CommunityMember` with user | **MISSING** | Add `broadcastMemberJoined` |
| `member_left` | Server -> Room (`community:${id}`) | `{ communityId, userId }` | **MISSING** | Add `broadcastMemberLeft` |
| `member_role_updated` | Server -> Room (`community:${id}`) | `{ communityId, userId, role }` | **MISSING** | Add `broadcastMemberRoleUpdated` |

---

## 5. Requirement 4: Database Schema & Zero Demo Data Audit

### 5.1 Lucid Models & Database Migrations
All 7 database tables are fully defined with correct foreign keys and cascade deletions:
1. `users`: `id`, `full_name`, `username`, `email`, `password`, `avatar_url`, `domain_interests`, `bio`, `status`, `created_at`, `updated_at`.
2. `communities`: `id`, `name`, `slug`, `description`, `domain_tag`, `icon_url`, `owner_id` (FK -> users, CASCADE).
3. `community_members`: `id`, `community_id` (FK -> communities), `user_id` (FK -> users), `role` (`owner`, `admin`, `member`), unique(`community_id`, `user_id`).
4. `channels`: `id`, `community_id` (FK -> communities), `name`, `type`, `topic`, `position`.
5. `messages`: `id`, `channel_id` (FK -> channels), `user_id` (FK -> users), `content`, `parent_id`.
6. `resources`: `id`, `community_id`, `user_id`, `title`, `url`, `description`, `domain_tag`, `upvotes`.
7. `auth_access_tokens`: `id`, `tokenable_id`, `type`, `name`, `hash`, `abilities`, `created_at`, `updated_at`, `expires_at`.

### 5.2 Zero Demo Data Verification
- **Migrations**: No migration inserts dummy or mock data.
- **Seeders**: `database/seeders/main_seeder.ts` explicitly truncates all tables (`DELETE FROM messages`, `DELETE FROM channels`, etc.) and resets autoincrement sequences.
- **Controller Fallbacks Violation**:
  - `CommunitiesController`: lines 43-44 (`User.find(1) || User.first()`), line 99, line 127.
  - `MessagesController`: lines 31-34 (`User.findBy('username', 'alex_student')`).
  - `ResourcesController`: lines 24-26 (`User.findBy('username', 'alex_student')`).
- **Action**: Completely purge all `alex_student` and `User.first()` fallbacks. When zero demo data is enforced, unauthenticated requests must fail with 401 Unauthorized, never silently synthesize an identity.

### 5.3 Supabase Connection
- In `config/database.ts`, the `pg` connection string is properly configured to use `DB_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` with `ssl: { rejectUnauthorized: false }`.
- `DB_CONNECTION=sqlite` is active in development/test with `better-sqlite3`, while production connects to Supabase PostgreSQL seamlessly.

---

## 6. Implementation Action Plan for Worker

1. **Auth Cookie Middleware**:
   - Create `app/middleware/auth_cookie_middleware.ts` to copy `ctx.request.cookie('auth_token')` to `ctx.request.request.headers['authorization'] = 'Bearer ...'`.
   - Register it in `start/kernel.ts` before `@adonisjs/auth/initialize_auth_middleware`.
2. **Auth Routes & Controllers**:
   - Add routes in `start/routes.ts`:
     - `POST /api/v1/auth/google`, `github`, `linkedin` -> `OauthController.callback`
     - `GET /api/v1/auth/:provider/redirect`, `callback` -> `OauthController.redirect / callback`
     - `GET /api/v1/auth/me` -> `ProfileController.show`
     - `GET /api/v1/auth/profile`, `PUT /api/v1/auth/profile` -> `ProfileController.show / update`
     - `POST /api/v1/auth/logout` -> `AccessTokensController.destroy`
   - Update `OauthController` to handle provider-specific routes and default data.
3. **Role-Based Community Controller & 403 Enforcement**:
   - In `CommunitiesController`:
     - Add `update` method for `PUT /api/v1/communities/:id` (validates owner; returns 403 if not owner; broadcasts `community_updated`).
     - In `store`, `join`, `leave`: remove all `User.first()` and `User.find(1)` fallbacks. Require authentication (`auth.getUserOrFail()`).
     - Register `DELETE /api/v1/communities/:id/leave` (alongside `POST /api/v1/communities/:id/leave`).
     - In `join`, `leave`, `kickMember`, `updateMemberRole`: call `WsService` broadcasts.
     - In `updateMemberRole`: allow `'owner'` (transferring ownership or assigning owner badge), `'admin'`, `'member'`.
4. **Channel Controller Fixes**:
   - In `ChannelsController`:
     - In `store`: require auth user (`if (!user) return response.unauthorized(...)`). Check `if (community.ownerId !== user.id) return response.forbidden(...)`.
     - In `destroy`: require auth user (`if (!user) return response.unauthorized(...)`). Check `if (community.ownerId !== user.id) return response.forbidden(...)`.
5. **Real-Time WsService Expansion**:
   - Add `broadcastCommunityUpdated(communityId, community)`.
   - Add `broadcastMemberJoined(communityId, member)`.
   - Add `broadcastMemberLeft(communityId, userId)`.
   - Add `broadcastMemberRoleUpdated(communityId, member)`.
   - Add socket listener for `leave_community`.
6. **Zero Demo Data Cleanliness**:
   - In `MessagesController`: require auth user; remove `alex_student` fallback. Trim message content.
   - In `ResourcesController`: require auth user; remove `alex_student` fallback.
7. **Typecheck & Verification**:
   - Run `npm run typecheck` in `backend` to guarantee 0 errors.
