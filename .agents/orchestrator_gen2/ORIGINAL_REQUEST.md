# Original User Request

## 2026-09-30T16:00:15Z

You are the Project Orchestrator (orchestrator_gen2) for the project at /home/dell/.gemini/antigravity/scratch/student-community-platform.

Your working directory is:
/home/dell/.gemini/antigravity/scratch/student-community-platform/.agents/orchestrator_gen2

Read the authoritative user request at:
/home/dell/.gemini/antigravity/scratch/student-community-platform/.agents/ORIGINAL_REQUEST.md
(specifically the latest request under ## 2026-09-30T16:00:15Z).

Key Mission Requirements:
1. Production-ready Discord-like student community & collaboration platform built with AdonisJS v6 (backend) and React + Vite (frontend).
2. Connected to Supabase with ZERO initial demo data.
3. R1. Authentication System: Signup, login, logout via credentials and OAuth2.0 (Google, GitHub, LinkedIn). Secure JWT authentication in HttpOnly cookie (auth_token) with fallback Bearer header support. Persistent session, profile fetch, profile data management (full name, avatar URL, bio, domain interests).
4. R2. Role-Based Community Management:
   - Community Owner: Delete community (DELETE /api/v1/communities/:id), Add/Delete text channels (POST /api/v1/communities/:id/channels, DELETE /api/v1/channels/:id), Member roster, promote/demote member roles (Owner 👑, Admin 🛡️, Member 🎓), kick/remove members, edit community server profile (title, domain tag, description, avatar icon).
   - Regular User: Discover & join public communities, leave communities (POST /api/v1/communities/:id/join, DELETE /api/v1/communities/:id/leave), post/read real-time chat with typing indicators, view member roster and badges, submit educational resources with domain tags & upvote community resources. Non-owner administrative actions must receive 403 Forbidden.
5. R3. Real-Time Socket.io Event Engine: Broadcast events for message sending, typing start/stop, channel creation/deletion, community updates, and member join/leave across room subscribers.
6. R4. Automated Verification & End-to-End Build Integration: Clean builds with 0 TypeScript/lint errors in both frontend and backend. Automated tests validating roles, HttpOnly cookies, and CRUD operations.

Manage your team using the standard lifecycle (Explorer -> Worker -> Reviewer -> Challenger -> Auditor). Maintain your BRIEFING.md, plan.md, and progress.md in your working directory.
When all milestones are completed and verified, report victory to Sentinel (conversation ID: a8689af5-2fe1-4c2b-a194-3ba9082b3f80) so the mandatory Victory Audit can be initiated.
