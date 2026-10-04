# Handoff Report: Milestone R1 Frontend & Chat Engine Investigation

**Investigator**: Explorer 2  
**Role**: Frontend Explorer / Architect  
**Handoff Type**: Hard (Investigation complete)  
**Date**: 2026-09-30  

---

## 1. Observation

### 1.1 Authentication Gap on REST Mutations
- In `backend/start/routes.ts`:
  - Line 40: `router.post('communities', [CommunitiesController, 'store']).use(middleware.auth())`
  - Line 41: `router.post('communities/:id/join', [CommunitiesController, 'join']).use(middleware.auth())`
  - Line 48: `router.post('channels/:id/messages', [MessagesController, 'store']).use(middleware.auth())`
  - Line 52: `router.post('resources', [ResourcesController, 'store']).use(middleware.auth())`
- In `backend/app/controllers/messages_controller.ts:17`:
  ```ts
  const user = auth.getUserOrFail()
  ```
- In `frontend/src/App.tsx`:
  - Lines 74-82: Hardcodes a static `currentUser` state (`alex_student`) without authenticating via `POST /api/v1/auth/login`.
  - Lines 201-206 (`handleSendMessage`):
    ```tsx
    const res = await fetch(`${API_BASE}/channels/${activeChannel.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    ```
  - Line 225 (`handleCreateCommunity`) and Line 252 (`handleShareResource`): Call `fetch` with only `Content-Type: application/json` and no `Authorization` header.

### 1.2 Socket.io Connection & Message Broadcasting
- In `frontend/src/App.tsx`:
  - Line 103: Connects to Socket.io gateway: `socketRef.current = io('http://localhost:3333')`.
  - Lines 109-111:
    ```tsx
    socketRef.current.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })
    ```
  - Lines 208-212 (`handleSendMessage`):
    ```tsx
    if (res.ok) {
      const msg = await res.json()
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      setNewMessageContent('')
    }
    ```
  - In `backend/app/controllers/messages_controller.ts:37`:
    `io.to('channel:${channelId}').emit('new_message', message)` broadcasts to the room.

### 1.3 Channel Switching & Room Management
- In `frontend/src/App.tsx:154-162`:
  ```tsx
  const selectChannel = (channel: Channel) => {
    setActiveChannel(channel)
    setViewMode('chat')
    fetchMessages(channel.id)

    if (socketRef.current) {
      socketRef.current.emit('join_channel', channel.id)
    }
  }
  ```
- In `backend/app/services/ws_service.ts:23-25`:
  ```ts
  socket.on('leave_channel', (channelId: string | number) => {
    socket.leave(`channel:${channelId}`)
  })
  ```
  `frontend/src/App.tsx` contains 0 occurrences of `'leave_channel'`.

### 1.4 Typing Indicators
- In `frontend/src/App.tsx`: 0 occurrences of `typing`, `isTyping`, `typing_start`, `typing_stop`, or `user_typing`.
- In `backend/app/services/ws_service.ts`: 0 occurrences of `typing_start`, `typing_stop`, or `user_typing`.

### 1.5 Avatars, Timestamps, and Domain Badges
- In `frontend/src/App.tsx:406-425`:
  - Displays avatar: `<img src={msg.user?.avatarUrl ...} />`
  - Displays timestamp: `{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  - Displays author: `<span className="author-name">{msg.user?.fullName || 'Student'}</span>`
  - 0 occurrences of `msg.user.domainInterests` in message cards.

### 1.6 Resource Vault & Upvoting
- Lines 466-484: Filters by domain pill tags `'All'`, `'Artificial Intelligence'`, `'Web Development'`, `'Cybersecurity'`, `'Data Science'`.
- Lines 276-286: `handleUpvote` posts to `${API_BASE}/resources/${id}/upvote` and updates `resources` dynamically.

### 1.7 Server Explorer Grid & Join
- Lines 521-550: Renders community cards with an "Enter Server" button calling `fetchCommunityDetails(comm.id)` and `setViewMode('chat')`.
- 0 occurrences of `join` or `POST /api/v1/communities/:id/join` in `frontend/src/App.tsx`.

---

## 2. Logic Chain

1. **Failure of POST requests (BUG-01)**:
   - Observation 1.1 shows backend routes for messages, communities, and resources require authentication via `middleware.auth()`.
   - Observation 1.1 shows frontend fetch calls send no `Authorization` header and never perform login.
   - Therefore, any POST request from the frontend to create a message, community, or resource fails with HTTP 401 Unauthorized.

2. **Message Duplication (BUG-02)**:
   - Observation 1.2 shows that when sending a message, the HTTP POST response handler adds the message to `messages` state.
   - Observation 1.2 shows the backend controller also broadcasts `new_message` to the socket room.
   - Observation 1.2 shows the socket listener directly appends any incoming `new_message` without deduplication (`[...prev, message]`).
   - If the socket message arrives after the HTTP response, the sender's UI renders the identical message twice, throwing React duplicate key warnings.

3. **Cross-Channel Message Bleed (BUG-03 & BUG-04)**:
   - Observation 1.3 shows `selectChannel` emits `join_channel` on the new channel but never emits `leave_channel` on the old channel.
   - Observation 1.2 shows the socket listener appends all `new_message` payloads without checking if `message.channelId === activeChannel.id`.
   - Therefore, as a user navigates between channels, their socket remains in all channel rooms, and any message broadcast in any previously visited channel is rendered into whatever channel is currently active.

4. **Incomplete Milestone Deliverables (BUG-05, BUG-06, BUG-07)**:
   - Observation 1.4 confirms typing indicators are completely unimplemented on both client and server.
   - Observation 1.5 confirms student domain badges are omitted from chat message headers.
   - Observation 1.7 confirms the Explorer grid lacks a community join mechanism (`POST .../join`).

---

## 3. Caveats

- **No Caveats**: The investigation directly examined every relevant line in `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/package.json`, and the corresponding backend routes (`start/routes.ts`), controllers (`messages_controller.ts`, `resources_controller.ts`, `communities_controller.ts`), seeders (`main_seeder.ts`), and services (`ws_service.ts`).

---

## 4. Conclusion

The current frontend layout provides a strong visual foundation for a Discord-like student collaboration interface, but **Milestone R1 cannot be considered functionally complete** until the following core defects are resolved:
1. Provide an authentication bootstrap so that API mutations (messages, communities, resources) execute successfully with a Bearer token.
2. Fix the chat engine socket handling: emit `leave_channel`, filter incoming messages by `activeChannel.id`, and deduplicate messages to prevent duplicate renders.
3. Implement typing indicator socket events (`typing_start`, `typing_stop`, `user_typing`) with an animated UI indicator in the chat view.
4. Render student domain badges (`domainInterests`) in message cards alongside user avatars and timestamps.
5. Add official community joining (`POST /api/v1/communities/:id/join`) in the Server Explorer.

Detailed technical remediations and code designs are documented in `analysis.md`.

---

## 5. Verification Method

### 5.1 Independent Code Inspection
- Inspect `frontend/src/App.tsx` lines 109-111 and 208-212 to confirm missing deduplication and missing `leave_channel`.
- Inspect `frontend/src/App.tsx` lines 201-206, 225-233, and 252-263 to verify missing `Authorization` headers.
- Inspect `frontend/src/App.tsx` lines 416-425 to verify omission of domain badges on chat messages.
- Grep `frontend/src/App.tsx` for `typing` to verify 0 occurrences of typing indicator state.

### 5.2 End-to-End Invalidation Conditions
The defects described in this report are resolved when:
1. `POST /api/v1/channels/:id/messages` responds with HTTP 201 and the message appears exactly once in the message list without duplicate key warnings.
2. Switching from Channel 1 to Channel 2 emits `leave_channel` for Channel 1 and `join_channel` for Channel 2.
3. Typing in the composer triggers `typing_start` and renders a typing indicator banner for other clients in the same channel.
4. Message author headers render their domain badges (e.g. `AI/ML`, `Web Dev`).
5. `POST /api/v1/resources` and `POST /api/v1/communities` successfully save new records with valid author associations.
