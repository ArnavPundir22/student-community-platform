# Execution Plan: Student Community Platform (Gen 2)

## Context & Objectives
Upgrade the student community platform to meet full production requirements:
- AdonisJS v6 + React Vite connected to Supabase with ZERO initial demo data.
- R1: Auth System (OAuth2.0 for Google, GitHub, LinkedIn, credentials signup/login/logout, HttpOnly `auth_token` cookie + Bearer fallback, persistent session, profile update: name, avatar URL, bio, domain interests).
- R2: Role-Based Community Management:
  - Owner: Delete community (`DELETE /api/v1/communities/:id`), Add/Delete text channels (`POST /api/v1/communities/:id/channels`, `DELETE /api/v1/channels/:id`), Member roster, promote/demote (Owner 👑, Admin 🛡️, Member 🎓), kick/remove members, edit community server profile (title, domain tag, description, avatar icon).
  - Regular User: Discover & join (`POST /api/v1/communities/:id/join`), leave (`DELETE /api/v1/communities/:id/leave`), real-time chat with typing indicators, view member roster and badges, submit/upvote domain resources. Non-owner admin actions must return 403 Forbidden.
- R3: Real-Time Socket.io Event Engine: Broadcast events for message sending, typing start/stop, channel creation/deletion, community updates, member join/leave across room subscribers.
- R4: Automated Verification & E2E Integration: 0 TS/lint errors in both frontend and backend, automated verification tests validating roles, HttpOnly cookies, and CRUD operations.

## Phase 1: Tri-Explorer Architecture & Gap Analysis
- **Explorer 1 (Backend & Database Architecture)**: Focus on auth endpoints (credentials + OAuth routes), JWT HttpOnly cookie handling, role-based authorization middleware (Owner vs Admin vs Member, 403 Forbidden enforcement), community/channel CRUD, and Supabase zero-demo-data configuration.
- **Explorer 2 (Frontend UI & Real-Time Client)**: Focus on session/auth state management, role-based UI controls (Owner options hidden/disabled for non-owners), profile management modal, Socket.io event handling for chat/typing/channels/roster/community updates.
- **Explorer 3 (Testing & Verification Strategy)**: Focus on automated endpoint verification (`verify_endpoints.sh`), backend Japa tests, role-based permission test cases, HttpOnly cookie assertions, and build typechecks.

## Phase 2: Full-Stack Implementation
- **Worker**: Implement backend migrations/models/controllers/middleware, frontend pages/components/services, Socket.io broadcasts, and verify zero TypeScript/lint compilation errors.

## Phase 3: Review & Adversarial Challenge
- **Reviewer 1 (Backend Review)**: Code quality, security, role enforcement, HttpOnly cookies, typecheck.
- **Reviewer 2 (Frontend Review)**: UI completeness, role visibility gating, real-time UX, build cleanliness.
- **Challenger 1 (API & Security Verification)**: Empirical validation of role permissions, 403 Forbidden enforcement, cookie behavior, zero demo data behavior.
- **Challenger 2 (WebSocket & Concurrency Verification)**: Live testing of real-time Socket.io events across channels and community rooms.

## Phase 4: Forensic Integrity Audit
- **Auditor**: Independent integrity verification confirming authentic logic without mocks, hardcoding, or dummy facades.

## Phase 5: Acceptance & Victory Reporting
- Confirm all acceptance criteria are met, verify clean builds, and send victory message to Sentinel.
