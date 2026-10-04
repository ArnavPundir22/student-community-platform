# Execution Plan: Student Community Platform (Gen 3)

## Context & Objectives
Finalize production readiness for the Discord-like student community platform, resolving defects uncovered by Challenger Gen2 and meeting all latest requirements from ## 2026-09-30T18:12:46Z:
1. **Authentication & OAuth Security Audit**:
   - Google OAuth is the sole active social provider (GitHub & LinkedIn buttons removed).
   - Google OAuth token exchange correctly sets `app_token` and `app_user` in `localStorage` and supports `auth_token` HttpOnly cookies without logged-out state flashes.
   - Logout cleanly revokes session in Supabase and clears backend auth tokens.
2. **Core Domain Functionality & Role-Based Access Control**:
   - Clean start state: zero initial demo communities (`GET /api/v1/communities` returns `[]`).
   - Server Owners can delete communities, create/delete channels, edit server profiles, and kick members.
   - Regular members can join/leave servers, post real-time chat messages, send typing indicators, submit educational resources, and upvote items.
   - Administrative endpoints return 403 Forbidden when invoked by non-owners.
   - Self-kick by owner must return 400 Bad Request.
   - Role promotion/demotion routes must exist and function properly.
   - Unauthenticated `POST /api/v1/channels/:id/messages` must check auth BEFORE channel existence (return 401 instead of 404).
   - Pure Bearer header authentication handling must be supported seamlessly alongside HttpOnly cookies.
   - Profile update persistence for `fullName`, `bio`, `avatarUrl`, and domain interests must be accurately saved and returned.
3. **Real-Time Engine & Data Persistence**:
   - Socket.io room subscriptions cleanly handle channel switching, live typing indicators, and message broadcasts.
   - All CRUD operations persist to Supabase / SQLite backend without silent failures.
4. **Production Build & Static Type Integrity**:
   - Both AdonisJS backend and React frontend pass TypeScript checks with 0 errors (`npm run typecheck` / `npx tsc --noEmit`).
   - Production build succeeds cleanly without compilation warnings (`npm run build` in frontend).

---

## Phases & Execution Loop

### Phase 1: Tri-Explorer Architecture & Defect Investigation
- **Explorer 1 (Backend & Auth Middleware Specialist)**:
  - Deep-dive into backend routes, `auth` middleware, token resolution (Bearer header vs HttpOnly cookie), channel message auth order (ensuring 401 before 404), profile update persistence (`fullName`, `bio`), role promote/demote endpoint routing, and self-kick validation.
- **Explorer 2 (Frontend & OAuth UI Specialist)**:
  - Verify removal of GitHub & LinkedIn OAuth buttons across all login/signup screens.
  - Audit Google OAuth flow: token exchange, setting `app_token` & `app_user` in `localStorage`, seamless session restoration without flash of unauthenticated state, clean logout revoking Supabase session and clearing tokens.
  - Verify role-based UI controls for Owners vs Members.
- **Explorer 3 (Verification & Test Suite Specialist)**:
  - Review `verify_endpoints.sh`, Challenger 1's `test_results.json`, and existing test scripts.
  - Formulate precise verification commands and test cases to validate that all 12 failed tests from Challenger 1 are resolved.

### Phase 2: Worker Full-Stack Remediation
- **Worker 1**:
  - Implement fixes in backend:
    - Auth middleware pure Bearer header support.
    - Channel message controller auth check before channel existence check.
    - Profile update logic to ensure `fullName` and `bio` are properly persisted in DB and returned in user serialization.
    - Role promotion/demotion routes (`PUT /api/v1/communities/:id/members/:userId/role` or equivalent).
    - Validation preventing owners from kicking themselves (400 Bad Request).
  - Implement fixes in frontend:
    - Remove GitHub and LinkedIn OAuth buttons; leave only Google OAuth and credentials.
    - Polish Google OAuth callback and session hydration.
  - Run `npm run typecheck` in backend and `npm run build` in frontend.
  - Ensure zero TypeScript errors and clean production builds.

### Phase 3: Dual Independent Review
- **Reviewer 1 (Backend Security & RBAC Reviewer)**:
  - Review backend changes, auth middleware, role enforcement, 401/403/400 status codes, and typecheck.
- **Reviewer 2 (Frontend & OAuth UX Reviewer)**:
  - Review frontend changes, Google OAuth single-provider adherence, state persistence, clean build.

### Phase 4: Dual Empirical Challenge
- **Challenger 1 (API & Security Verifier)**:
  - Run comprehensive API test suite verifying all 86 test cases pass (including the 12 previously failing cases).
- **Challenger 2 (Socket.io Real-Time & Concurrency Verifier)**:
  - Empirically verify real-time room broadcasts, channel switching, typing indicators, and message persistence.

### Phase 5: Forensic Integrity Audit
- **Auditor**:
  - Perform static analysis, runtime verification, and authenticity checks to ensure zero mocks/cheats/facades.

### Phase 6: Final Verification & Victory Reporting
- Confirm 100% acceptance criteria met and notify Sentinel via `send_message`.
