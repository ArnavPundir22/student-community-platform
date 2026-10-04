# Empirical Challenge Report: WebSocket & Real-Time Concurrency

**Agent**: Challenger 2 (`challenger_r1_2`)  
**Target Milestone**: R1 (Real-time Discord-like UI & Chat Engine)  
**Execution Date**: 2026-09-30  
**Test Harness**: `scripts/empirical_socket_test.mjs`  
**Target Gateway**: `http://localhost:3333`  

---

## Challenge Summary

**Overall risk assessment**: **MEDIUM** (Functional WebSocket room routing, typing propagation, and unsubscribe logic are robust and 100% verified across 25 assertions. However, an adversarial edge-case vulnerability was empirically confirmed: sending a `null` payload to `typing_start` or `typing_stop` crashes the entire backend process due to unhandled TypeError).

---

## Empirical Verification Matrix

| # | Test Scenario | Expected Outcome | Empirical Result | Status |
|---|---------------|------------------|------------------|:------:|
| 1 | Socket Handshake (3 clients A, B, C) | Successful connection on `http://localhost:3333` | 3 distinct socket IDs connected via WebSocket/polling | **PASS** |
| 2 | Room Subscriptions | A & B join `channel:1`, C joins `channel:2` | Sockets registered in respective rooms | **PASS** |
| 3 | `typing_start` propagation | Client B in `channel:1` receives `user_typing` (`isTyping: true`) | Client B received typing event from Alice_Student | **PASS** |
| 4 | `typing_start` room isolation | Client C in `channel:2` receives 0 typing events | Client C received 0 events | **PASS** |
| 5 | Sender echo exclusion | Client A does not receive its own typing event | Client A received 0 echo events | **PASS** |
| 6 | `typing_stop` propagation | Client B receives `user_typing` (`isTyping: false`) | Client B received isTyping: false | **PASS** |
| 7 | `typing_stop` room isolation | Client C receives 0 typing_stop events | Client C received 0 events | **PASS** |
| 8 | Reverse typing isolation | Client C types in `channel:2`; Clients A & B receive 0 events | Neither Client A nor B received foreign typing events | **PASS** |
| 9 | `new_message` to `channel:1` | Both Client A & Client B receive message | Both A & B received message ID 45 | **PASS** |
| 10 | `new_message` room isolation | Client C in `channel:2` does NOT receive `channel:1` message | Client C received 0 `channel:1` messages | **PASS** |
| 11 | Reverse message broadcast | Client C receives `channel:2` message | Client C received message ID 46 | **PASS** |
| 12 | Reverse message isolation | Clients A & B do not receive `channel:2` message | Clients A & B received 0 `channel:2` messages | **PASS** |
| 13 | `leave_channel` active peer | Client A (still in `channel:1`) receives new message | Client A received post-leave message | **PASS** |
| 14 | `leave_channel` departed peer | Client B (left `channel:1`) does NOT receive message | Client B received 0 messages after leaving | **PASS** |
| 15 | `leave_channel` typing isolation | Client B does NOT receive typing events after leaving | Client B received 0 typing events after leaving | **PASS** |
| 16 | Dynamic Channel Migration | Client B joins `channel:2` and receives `channel:2` broadcasts | Client B received migration message | **PASS** |
| 17 | Multi-Subscriber Channel 2 | Existing Client C also receives `channel:2` broadcast | Client C received migration message | **PASS** |
| 18 | Migration Isolation | Client A remains isolated in `channel:1` | Client A received 0 foreign messages | **PASS** |
| 19 | String vs Number Channel ID | Joining with string `"2"` receives Number 2 broadcast | Interoperable string/number room routing | **PASS** |
| 20 | Large Payload Integrity | 3KB message transmitted without truncation or corruption | Exactly 3017 bytes received intact | **PASS** |
| 21 | High Concurrency Burst (Client A) | Receives 12/12 rapid concurrent burst messages | Received 12/12 in 1409ms | **PASS** |
| 22 | High Concurrency Burst (Client D) | Receives 12/12 concurrent messages | Received 12/12 | **PASS** |
| 23 | High Concurrency Burst (Client E) | Receives 12/12 concurrent messages | Received 12/12 | **PASS** |
| 24 | High Concurrency Isolation (Client F)| Receives 0 channel 1 burst messages | Client F received 0 channel 1 burst messages | **PASS** |
| 25 | Rapid Typing Burst Under Load | 25 rapid typing events across rooms handled smoothly | Gateway maintained 100% responsiveness | **PASS** |

**Total Empirical Verdict: 25 / 25 Passed (100% Pass Rate)**

---

## Adversarial Challenges & Findings

### [High] Challenge 1: Denial of Service (DoS) via Unhandled Null Payload in Socket.io Event Handlers

- **Assumption Challenged**: The WebSocket gateway assumes incoming socket event payloads are always valid objects conforming to `{ channelId, username }`.
- **Attack Scenario**:
  An adversarial or buggy socket client emits `typing_start` or `typing_stop` with a `null` or `undefined` payload:
  ```js
  socket.emit('typing_start', null)
  ```
- **Empirical Execution & Log**:
  In `backend/app/services/ws_service.ts:27-41`:
  ```ts
  socket.on('typing_start', (data: { channelId: string | number; username: string }) => {
    socket.to(`channel:${data.channelId}`).emit('user_typing', { ... })
  })
  ```
  When executed against the running backend server, this triggered:
  ```
  /home/dell/.gemini/antigravity/scratch/student-community-platform/backend/app/services/ws_service.ts:28
          socket.to(`channel:${data.channelId}`).emit('user_typing', {
                                    ^

  TypeError: Cannot read properties of null (reading 'channelId')
      at Socket.<anonymous> (/home/dell/.../backend/app/services/ws_service.ts:28:35)
      at Socket.emit (node:events:514:28)
  Node.js v24.21.0
  ```
- **Blast Radius**:
  The uncaught `TypeError` crashes the Node.js process immediately (`ECONNREFUSED 127.0.0.1:3333`). All connected HTTP clients and WebSocket connections are abruptly terminated, leading to total service disruption.
- **Recommended Mitigation**:
  Add defensive guard clauses or schema validation in `backend/app/services/ws_service.ts`:
  ```ts
  socket.on('typing_start', (data: { channelId: string | number; username: string }) => {
    if (!data || !data.channelId) return
    socket.to(`channel:${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      username: data.username || 'Anonymous',
      isTyping: true,
    })
  })

  socket.on('typing_stop', (data: { channelId: string | number; username: string }) => {
    if (!data || !data.channelId) return
    socket.to(`channel:${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      username: data.username || 'Anonymous',
      isTyping: false,
    })
  })
  ```

---

### [Low] Challenge 2: Client Typing Indicator Debounce Linger on Abrupt Disconnect

- **Assumption Challenged**: When a user closes their browser tab or disconnects while typing, peers will be notified that typing stopped.
- **Attack Scenario**:
  A client emits `typing_start` and immediately disconnects without emitting `typing_stop`.
- **Blast Radius**:
  Peers in the channel display the `user_typing` banner indefinitely or until the frontend component re-renders or switches channels.
- **Recommended Mitigation**:
  In `ws_service.ts`, associate typing sockets with active channels and emit `user_typing: { isTyping: false }` on socket `disconnect`, or rely on client-side 3-second expiration timers.

---

## Stress Test Results

- **Burst Concurrency Scenario**: 3 concurrent subscribers (Clients A, D, E) listening on `channel:1`, 1 isolated subscriber (Client F) in `channel:2`. Blasted 12 HTTP message posts and 50 rapid typing events within 1.4 seconds.
  - **Expected**: 12/12 messages received by A, D, E; 0 messages received by F; 0 dropped packets.
  - **Actual**: 12/12 messages received across all 3 subscribers. 0 received by F. Latency: 1409ms total.
  - **Result**: **PASS**.

- **Large Payload Transmission Scenario**: Message content of 3,017 characters sent via HTTP POST and broadcast through Socket.io.
  - **Expected**: Message payload received intact without buffer truncation.
  - **Actual**: Exactly 3017 characters received by subscriber.
  - **Result**: **PASS**.

- **String vs Number Channel Identifier Scenario**: Client joins channel using string `"2"`, message broadcast using integer `2`.
  - **Expected**: Room key `channel:2` matches and delivers message.
  - **Actual**: Message delivered successfully to string-subscribed socket.
  - **Result**: **PASS**.

---

## Unchallenged Areas

- **WebSocket Authentication / JWT Handshake**: Handshake tokens are not currently verified on socket connection (designed for demo mode accessibility). Out of scope for R1, recommended for future hardening.
- **Cross-Node Clustering / Redis Adapter**: Socket.io is configured as a single in-memory instance (`@adonisjs/core`), which matches single-instance development scope. Multi-node horizontal scaling would require `@socket.io/redis-adapter`.
