# Empirical Challenge Report: Milestone R1

**Target**: Student Community & Collaboration Platform (Milestone R1 Backend API & Real-time Engine)  
**Agent**: Challenger 1 (`challenger_r1_1`)  
**Timestamp**: 2026-09-30T05:12:00Z  
**Overall Risk Assessment**: **MEDIUM-HIGH** (Functional endpoints pass; 2 severe security/stability vulnerabilities identified: Socket.io DoS crash and Stored XSS)

---

## 1. Challenge Summary

Empirical testing confirmed that all Milestone R1 baseline functional flows, worker claims, and verify scripts execute successfully (30 automated tests in `backend/tests/empirical_challenge_suite.mjs` passed). Monotonic counter increments, community channel seeding (including Community 3), and domain filtering behave correctly.

However, adversarial stress testing and edge-case mining uncovered **two High-severity vulnerabilities** and **two Medium-severity data integrity/error handling flaws**:
1. **[HIGH] Unchecked Socket.io Typing Event Payloads Lead to Immediate Process Termination (DoS)**
2. **[HIGH] Stored XSS via Unvalidated Resource URLs in Student Vault**
3. **[MEDIUM] Non-existent Channel ID Triggers Unhandled 500 SqliteError with Stack Leak**
4. **[MEDIUM] Non-numeric Channel ID Creates Orphan Records with `channel_id = null`**
5. **[LOW / ARCHITECTURAL] Invalid Bearer Tokens Silently Degrade to Demo User**

---

## 2. Empirical Challenges & Findings

### [HIGH] Challenge 1: Unchecked Socket.io Typing Event Payloads Lead to Immediate Process Termination (DoS)
- **Assumption challenged**: Real-time Socket.io typing listeners assume incoming `data` parameter is always an object with numeric `channelId`.
- **Observation**:
  In `backend/app/services/ws_service.ts` lines 27–41:
  ```ts
  socket.on('typing_start', (data: { channelId: string | number; username: string }) => {
    socket.to(`channel:${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      username: data.username,
      isTyping: true,
    })
  })
  ```
- **Attack scenario**:
  An unauthenticated client connects to the public Socket.io gateway and emits `socket.emit('typing_start', null)` or `socket.emit('typing_stop', null)`.
  In Node.js: `(null).channelId` throws `TypeError: Cannot read properties of null (reading 'channelId')`.
  Because this synchronous event listener lacks a `try/catch` and is outside HTTP middleware, the uncaught exception immediately crashes the entire AdonisJS server process.
- **Blast radius**: Complete server downtime and disruption for all active chat users.
- **Empirical reproduction**:
  Running `node -e "try { const d = null; d.channelId; } catch(e) { console.log(e); }"` confirms deterministic unhandled `TypeError`. A prior test invocation crashed the running server requiring restart.
- **Mitigation**:
  Add defensive validation in `ws_service.ts`:
  ```ts
  socket.on('typing_start', (data) => {
    if (!data || typeof data !== 'object' || !data.channelId) return
    socket.to(`channel:${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      username: data.username || 'Anonymous',
      isTyping: true,
    })
  })
  ```

---

### [HIGH] Challenge 2: Stored Cross-Site Scripting (XSS) via Unvalidated Resource URLs
- **Assumption challenged**: Resource URLs submitted to `POST /api/v1/resources` are assumed to be valid web links (`http://` or `https://`).
- **Observation**:
  In `backend/app/controllers/resources_controller.ts` lines 39–51:
  ```ts
  const { communityId, title, url, description, domainTag } = request.only([...])
  if (!title || !url) {
    return response.badRequest({ message: 'Title and URL are required' })
  }
  ```
  In `frontend/src/App.tsx` lines 654 and 657:
  ```tsx
  <a href={res.url} target="_blank" rel="noreferrer" className="resource-title">
  ```
- **Attack scenario**:
  An attacker posts a resource with:
  `{"title":"XSS Exploit","url":"javascript:alert(document.domain)","domainTag":"Web Development"}`
  The backend accepts the payload without URI scheme validation and returns HTTP 201 Created (empirically confirmed: created Resource ID 14).
  When another student browses the Resource Vault and clicks the resource title or link, the browser executes the JavaScript payload in the victim's session context.
- **Blast radius**: Account takeover, session token exfiltration, CSRF.
- **Empirical reproduction**:
  `curl -s -X POST http://127.0.0.1:3333/api/v1/resources -H "Content-Type: application/json" -d '{"title":"XSS Resource","url":"javascript:alert(1)","domainTag":"Web Development"}'`
  Output: HTTP 201 Created, `{"id":14,"url":"javascript:alert(1)",...}`.
- **Mitigation**:
  Enforce strict URL protocol validation in `resources_controller.ts` using VineJS URL validator or checking `url.startsWith('http://') || url.startsWith('https://')`.

---

### [MEDIUM] Challenge 3: Non-Existent Channel ID Triggers Unhandled 500 SqliteError with Stack Leak
- **Assumption challenged**: Message creation assumes the target channel exists before inserting into SQLite.
- **Observation**:
  In `backend/app/controllers/messages_controller.ts` lines 30–42:
  ```ts
  const channelId = Number(params.id)
  const message = await Message.create({ channelId, userId: user.id, content, ... })
  ```
- **Attack scenario**:
  Sending `POST /api/v1/channels/999999/messages` with valid content fails SQLite foreign key constraint checks.
  Instead of returning HTTP 404 Not Found, AdonisJS throws an unhandled exception returning HTTP 500 Internal Server Error with the full database dialect and file system stack trace.
- **Blast radius**: Information disclosure (stack traces, local paths, table schemas) and unhandled 500 error responses.
- **Empirical reproduction**:
  `curl -s -X POST http://127.0.0.1:3333/api/v1/channels/999999/messages -H "Content-Type: application/json" -d '{"content":"Test"}'`
  Output: `{"message":"insert into messages (...) values (999999, ...) - FOREIGN KEY constraint failed","name":"SqliteError"}` (HTTP 500).
- **Mitigation**:
  Validate channel existence prior to creation:
  ```ts
  const channel = await Channel.find(channelId)
  if (!channel) return response.notFound({ message: 'Channel not found' })
  ```

---

### [MEDIUM] Challenge 4: Non-Numeric Channel ID Creates Orphan Records with `channel_id = null`
- **Assumption challenged**: Channel route parameter `:id` is always numeric.
- **Observation**:
  In `backend/app/controllers/messages_controller.ts` line 30:
  `const channelId = Number(params.id)`
  When `params.id` is `'invalid-channel-abc'`, `Number(...)` returns `NaN`. Lucid converts `NaN` to `null` on SQLite insert.
- **Attack scenario**:
  Sending `POST /api/v1/channels/invalid-channel-abc/messages` bypasses validation and creates a message with `channel_id = null` in the database.
- **Blast radius**: Database corruption, orphaned messages that cannot be displayed in any channel.
- **Empirical reproduction**:
  `curl -s -X POST http://127.0.0.1:3333/api/v1/channels/invalid-channel-abc/messages -H "Content-Type: application/json" -d '{"content":"Test NaN"}'`
  Output: HTTP 201 Created, `{"channelId":null,"userId":1,"content":"Test NaN",...}`.
- **Mitigation**:
  Check `if (isNaN(channelId) || channelId <= 0) return response.badRequest({ message: 'Invalid channel ID' })` or route param constraint `router.where('id', router.matchers.number())`.

---

### [LOW / ARCHITECTURAL] Challenge 5: Invalid Bearer Tokens Silently Degrade to Demo User
- **Assumption challenged**: Providing an invalid Authorization header should reject with 401 Unauthorized.
- **Observation**:
  In `backend/app/controllers/messages_controller.ts` lines 18–25:
  ```ts
  try {
    await auth.check()
  } catch {}
  const user = auth.user || (await User.find(1)) || ...
  ```
- **Attack scenario**:
  A client sending `Authorization: Bearer invalid_or_expired_token` does not receive a 401 to prompt re-login. The action is silently performed and attributed to Alex Rivera (User ID 1).
- **Blast radius**: Misattributed user actions and failure to notify clients of token expiry.
- **Mitigation**:
  Only apply demo user fallback if `!request.header('Authorization')`. If header is present and `!auth.user`, return `response.unauthorized({ message: 'Invalid or expired authentication token' })`.

---

## 3. Stress Test Results Matrix

| # | Test Scenario | Expected Behavior | Actual Behavior | Verdict |
|---|---------------|-------------------|-----------------|---------|
| 1 | `POST /channels/1/messages` without Auth header | 201 Created with demo user Alex Rivera | 201 Created, author=alex_student | **PASS** |
| 2 | `POST /channels/1/messages` with Alex Rivera Bearer token | 201 Created, author=alex_student | 201 Created, author=alex_student | **PASS** |
| 3 | `POST /channels/1/messages` with Bob Tester Bearer token | 201 Created, author=bob_student (userId: 4) | 201 Created, author=bob_student (userId: 4) | **PASS** |
| 4 | `POST /channels/1/messages` with invalid Bearer token | 401 Unauthorized or fallback characterization | 201 Created (silently degrades to Alex Rivera) | **FINDING** |
| 5 | `POST /channels/1/messages` with empty content `""` | 400 Bad Request | 400 Bad Request (`Message content cannot be empty`) | **PASS** |
| 6 | `POST /channels/1/messages` with whitespace content `"   "` | 400 Bad Request (trimmed) | 400 Bad Request (trimmed by Adonis parser) | **PASS** |
| 7 | `POST /channels/999999/messages` non-existent channel | 404 Channel Not Found | 500 SqliteError (foreign key failed) | **FINDING** |
| 8 | `POST /channels/abc/messages` non-numeric channel ID | 400 Bad Request | 201 Created with `channelId: null` | **FINDING** |
| 9 | Sequential 10 upvotes on resource | Strictly monotonic `V0+1 ... V0+10` | Exact monotonic increment `[1..11]` | **PASS** |
| 10 | 50 concurrent upvotes on resource | Atomic counter increments | All 50 increments applied (1 -> 51, 0 lost) | **PASS** |
| 11 | `POST /resources/999999/upvote` non-existent ID | 404 Not Found | 404 Not Found | **PASS** |
| 12 | `GET /communities/1` details & channels | 200 OK with channels & owner | 200 OK, 2 channels, owner Priya Sharma | **PASS** |
| 13 | `GET /communities/2` details & channels | 200 OK with channels & owner | 200 OK, 2 channels, owner David Chen | **PASS** |
| 14 | `GET /communities/3` details & channels | 200 OK with `ctf-challenges`, `security-resources` | 200 OK, 2 channels, owner Alex Rivera | **PASS** |
| 15 | `GET /communities/999999` non-existent ID | 404 Not Found | 404 Not Found | **PASS** |
| 16 | `GET /resources?domain=Cybersecurity` filtering | Returns only Cybersecurity resources | 200 OK, 8/8 resources match Cybersecurity | **PASS** |
| 17 | `GET /resources?domain=Artificial+Intelligence` | Returns only AI resources | 200 OK, 1/1 resources match AI | **PASS** |
| 18 | `GET /resources?domain=NonExistent` | Returns empty array `[]` (HTTP 200) | 200 OK, `[]` (count: 0) | **PASS** |
| 19 | SQL Injection in `domain` query (`' OR '1'='1`) | Parameterized query resilience | 200 OK, `[]` (no syntax error, 0 leaks) | **PASS** |
| 20 | `POST /communities` custom hub creation | Creates hub + auto-creates 2 default channels | 201 Created (`#general-discussion`, `#resources`) | **PASS** |
| 21 | `POST /communities` missing required fields | 400 Bad Request | 400 Bad Request | **PASS** |
| 22 | `POST /communities/:id/join` membership idempotency | Returns 201 first, 200 "Already member" second | 201 first, 200 "Already a member" second | **PASS** |
| 23 | Socket.io cross-channel message isolation | Message in Ch1 NOT received in Ch2 | Confirmed: Ch1 received, Ch2 isolated | **PASS** |
| 24 | Socket.io typing indicator channel scoping | Typing in Ch1 NOT received in Ch2 | Confirmed: Ch1 received, Ch2 isolated | **PASS** |
| 25 | Socket.io `typing_start(null)` payload | Graceful discard without crash | Process crashes with unhandled TypeError | **FINDING** |
| 26 | `POST /resources` with `javascript:alert(1)` URL | 400 Bad Request / URL rejection | 201 Created (Stored DOM XSS risk) | **FINDING** |

---

## 4. Unchallenged Areas

- **Long-term WebSocket connection scale (>1,000 concurrent sockets)**: Single-instance testing conducted with up to 5 concurrent socket clients; multi-worker cluster benchmarking out of scope for Milestone R1.
- **Production SSL / HTTPS termination**: Testing was executed against local HTTP/WebSocket port 3333; TLS proxying is deferred to deployment phases.
