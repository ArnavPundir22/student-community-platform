# Project: Student Community & Collaboration Platform

## Architecture
A full-stack, Discord-like student collaboration platform built with:
- **Backend**: AdonisJS v6 (`@adonisjs/core`, `@adonisjs/lucid`, `better-sqlite3`, `socket.io`, `@adonisjs/auth`) running on port 3333.
- **Frontend**: React 19 + Vite + Tailwind/Custom CSS + Lucide Icons + `socket.io-client` running on port 5173 (or static build).
- **Database**: SQLite embedded database with Lucid ORM migrations and seeders (`database/migrations`, `database/seeders`).
- **Real-time Protocol**: Socket.io duplex communication for room-based channel chat (`join_channel`, `leave_channel`, `new_message`, `typing_start`, `typing_stop`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| R1 | Real-time Discord-like UI & Chat Engine | Multi-channel student chat, Socket.io broadcasting, typing indicators, avatars, domain badges | None | DONE |
| R2 | Student Domain Resources Repository | Resource library tagged by AI/ML, Web Dev, Cyber, Data Science, upvoting, submit modal | R1 | DONE |
| R3 | Community Discovery & Server Creation | Interactive explorer grid, server switching, join server, create custom student hubs | R1, R2 | DONE |
| R4 | Automated Verification & E2E Build Integration | Zero TS/lint errors, static build verification (`npm run build`), automated API test script (`curl`/HTTP) | R1, R2, R3 | DONE |

## Interface Contracts

### Backend REST API (`/api/v1`)
- `GET /api/v1/communities`: Returns list of public student communities with channels and member counts.
- `GET /api/v1/communities/:id`: Detailed community info including channel list and domain.
- `POST /api/v1/communities`: Create a new custom student hub (name, domainTag, description, iconUrl). Automatically creates default channels (e.g. `#general`, `#resources`).
- `POST /api/v1/communities/:id/join`: Join a community.
- `GET /api/v1/channels/:id/messages`: List recent messages for channel with author details (avatar, domain badge, username).
- `POST /api/v1/channels/:id/messages`: Post message; broadcasts `new_message` to Socket.io room `channel:{id}`.
- `GET /api/v1/resources`: Filterable by domain tag (`?domain=...`), returns items with upvote counts and user info.
- `POST /api/v1/resources`: Submit resource link/doc (title, url, description, domainTag).
- `POST /api/v1/resources/:id/upvote`: Increment upvote counter and return updated record.

### Real-Time Socket.io Events
- Client -> Server:
  - `join_channel`: `(channelId: number | string)`
  - `leave_channel`: `(channelId: number | string)`
  - `typing_start`: `({ channelId: number, username: string })`
  - `typing_stop`: `({ channelId: number, username: string })`
- Server -> Client:
  - `new_message`: `(message: MessagePayload)`
  - `user_typing`: `({ channelId: number, username: string, isTyping: boolean })`

## Code Layout
- `backend/`: AdonisJS v6 application
  - `app/controllers/`: API controllers
  - `app/models/`: Lucid models (User, Community, Channel, Message, Resource, CommunityMember)
  - `app/services/ws_service.ts`: Socket.io server instance and event handlers
  - `database/migrations/`: Database schema definitions
  - `database/seeders/`: Default student communities, channels, messages, and resources
  - `start/routes.ts`: API route definitions
  - `tests/`: Automated backend endpoint verification
- `frontend/`: React 19 + Vite frontend
  - `src/App.tsx`: Main Discord-like interface container
  - `src/components/`: Subcomponents (Sidebar, ChannelList, ChatArea, ResourceVault, ServerExplorer, Modals)
  - `src/index.css`: Styling and theme definitions
