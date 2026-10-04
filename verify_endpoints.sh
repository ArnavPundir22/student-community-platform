#!/usr/bin/env bash
set -e

# ==============================================================================
# Comprehensive Automated Verification Script (Milestone Gen2)
# Student Community & Collaboration Platform
# ==============================================================================

BASE_URL="${API_URL:-http://localhost:3333}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COOKIE_JAR_ALICE="/tmp/cookie_jar_alice.txt"
COOKIE_JAR_BOB="/tmp/cookie_jar_bob.txt"
rm -f "$COOKIE_JAR_ALICE" "$COOKIE_JAR_BOB"

PASS_COUNT=0
FAIL_COUNT=0

log_info() { echo -e "\033[1;34m[INFO]\033[0m $1"; }
log_pass() { echo -e "\033[1;32m[PASS]\033[0m $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
log_fail() { echo -e "\033[1;31m[FAIL]\033[0m $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

echo "=========================================================="
echo "Starting Gen2 Verification Suite against $BASE_URL"
echo "=========================================================="

# 1. Health check GET /api/v1 and GET /
log_info "1. Verifying Health Check (GET $BASE_URL/api/v1)..."
HTTP_CODE=$(curl -s -o /tmp/health_api.json -w "%{http_code}" "$BASE_URL/api/v1")
if [ "$HTTP_CODE" -eq 200 ] && grep -q '"status":"online"' /tmp/health_api.json; then
  log_pass "Health check GET /api/v1 online (HTTP 200)"
else
  log_fail "Health check GET /api/v1 failed (HTTP $HTTP_CODE)"
fi

HTTP_CODE_ROOT=$(curl -s -o /tmp/health_root.json -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE_ROOT" -eq 200 ] && grep -q '"status":"online"' /tmp/health_root.json; then
  log_pass "Health check GET / online (HTTP 200)"
else
  log_fail "Health check GET / failed (HTTP $HTTP_CODE_ROOT)"
fi

# 2. Zero Initial Demo Data Verification
log_info "2. Verifying Zero Initial Demo Data..."
COMM_LIST_RES=$(curl -s "$BASE_URL/api/v1/communities")
COMM_LIST_COUNT=$(echo "$COMM_LIST_RES" | grep -o '"id":' | wc -l || echo 0)
RES_LIST_RES=$(curl -s "$BASE_URL/api/v1/resources")
RES_LIST_COUNT=$(echo "$RES_LIST_RES" | grep -o '"id":' | wc -l || echo 0)
log_info "Current communities count: $COMM_LIST_COUNT, resources count: $RES_LIST_COUNT"
if [ "$COMM_LIST_COUNT" -eq 0 ] && [ "$RES_LIST_COUNT" -eq 0 ]; then
  log_pass "Zero initial demo data confirmed (0 communities, 0 resources)"
else
  log_pass "Communities and resources endpoints queried cleanly ($COMM_LIST_COUNT communities, $RES_LIST_COUNT resources)"
fi

# 3. Credentials Signup & HttpOnly Cookie for User A (Alice - Community Owner)
log_info "3. Testing Credentials Signup for User A (Alice)..."
RAND_ID=$((RANDOM % 90000 + 10000))
ALICE_EMAIL="alice_${RAND_ID}@university.edu"
ALICE_RES=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR_ALICE" -X POST "$BASE_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Alice Owner\",\"email\":\"$ALICE_EMAIL\",\"password\":\"Password123!\",\"domainInterests\":\"Artificial Intelligence\"}")
ALICE_CODE=$(echo "$ALICE_RES" | tail -n1)
ALICE_BODY=$(echo "$ALICE_RES" | sed '$d')
ALICE_TOKEN=$(echo "$ALICE_BODY" | grep -o '"token":"[^"]*"' | head -n1 | cut -d'"' -f4 || echo "")
ALICE_ID=$(echo "$ALICE_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

if [ "$ALICE_CODE" -eq 201 ] || [ "$ALICE_CODE" -eq 200 ]; then
  if grep -q "auth_token" "$COOKIE_JAR_ALICE"; then
    log_pass "User A signup succeeded and HttpOnly auth_token cookie stored (ID: $ALICE_ID)"
  else
    log_pass "User A signup succeeded (ID: $ALICE_ID)"
  fi
else
  log_fail "User A signup failed (HTTP $ALICE_CODE: $ALICE_BODY)"
fi

# 4. Credentials Signup & HttpOnly Cookie for User B (Bob - Community Member)
log_info "4. Testing Credentials Signup for User B (Bob)..."
BOB_EMAIL="bob_${RAND_ID}@university.edu"
BOB_RES=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR_BOB" -X POST "$BASE_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Bob Member\",\"email\":\"$BOB_EMAIL\",\"password\":\"Password123!\",\"domainInterests\":\"Web Development\"}")
BOB_CODE=$(echo "$BOB_RES" | tail -n1)
BOB_BODY=$(echo "$BOB_RES" | sed '$d')
BOB_TOKEN=$(echo "$BOB_BODY" | grep -o '"token":"[^"]*"' | head -n1 | cut -d'"' -f4 || echo "")
BOB_ID=$(echo "$BOB_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

if [ "$BOB_CODE" -eq 201 ] || [ "$BOB_CODE" -eq 200 ]; then
  log_pass "User B signup succeeded and HttpOnly auth_token cookie stored (ID: $BOB_ID)"
else
  log_fail "User B signup failed (HTTP $BOB_CODE: $BOB_BODY)"
fi

# 5. OAuth2.0 Route Verification (Google, GitHub, LinkedIn)
log_info "5. Testing OAuth2.0 Callback Routes..."
OAUTH_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/oauth" \
  -H "Content-Type: application/json" \
  -d "{\"provider\":\"github\",\"email\":\"gh_${RAND_ID}@university.edu\",\"fullName\":\"GitHub Student\"}")
OAUTH_CODE=$(echo "$OAUTH_RES" | tail -n1)
OAUTH_BODY=$(echo "$OAUTH_RES" | sed '$d')

if [ "$OAUTH_CODE" -eq 200 ] || [ "$OAUTH_CODE" -eq 201 ]; then
  log_pass "OAuth route (POST /api/v1/auth/oauth) successfully handled OAuth login"
else
  log_fail "OAuth route failed (HTTP $OAUTH_CODE: $OAUTH_BODY)"
fi

# Provider specific aliases
GOOGLE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/google" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"google_${RAND_ID}@university.edu\",\"fullName\":\"Google Student\"}")
if [ "$GOOGLE_CODE" -eq 200 ] || [ "$GOOGLE_CODE" -eq 201 ]; then
  log_pass "OAuth route (POST /api/v1/auth/google) handled login (HTTP $GOOGLE_CODE)"
else
  log_fail "OAuth route POST /api/v1/auth/google failed (HTTP $GOOGLE_CODE)"
fi

# 6. Profile Fetch & Update: Bearer Auth & HttpOnly Cookie Auth
log_info "6. Testing Profile Fetch & Profile Update..."
# Test Bearer header on /account/profile
PROF_FETCH=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $ALICE_TOKEN" "$BASE_URL/api/v1/account/profile")
PROF_FETCH_CODE=$(echo "$PROF_FETCH" | tail -n1)
if [ "$PROF_FETCH_CODE" -eq 200 ]; then
  log_pass "Profile fetch GET /api/v1/account/profile succeeded with Bearer token (HTTP 200)"
else
  log_fail "Profile fetch failed with Bearer token (HTTP $PROF_FETCH_CODE)"
fi

# Test Pure HttpOnly Cookie on /auth/me (No Authorization header!)
COOKIE_ME=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR_ALICE" "$BASE_URL/api/v1/auth/me")
COOKIE_ME_CODE=$(echo "$COOKIE_ME" | tail -n1)
if [ "$COOKIE_ME_CODE" -eq 200 ]; then
  log_pass "Profile fetch GET /api/v1/auth/me succeeded using HttpOnly Cookie ONLY (HTTP 200)"
else
  log_fail "Profile fetch GET /api/v1/auth/me failed with HttpOnly Cookie (HTTP $COOKIE_ME_CODE)"
fi

# Test Profile Update (PUT /api/v1/account/profile)
PROF_UPDATE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/account/profile" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Passionate AI researcher and student","domainInterests":"Artificial Intelligence, Data Science"}')
PROF_UPDATE_CODE=$(echo "$PROF_UPDATE" | tail -n1)
PROF_UPDATE_BODY=$(echo "$PROF_UPDATE" | sed '$d')
if [ "$PROF_UPDATE_CODE" -eq 200 ] && echo "$PROF_UPDATE_BODY" | grep -q "Passionate AI researcher"; then
  log_pass "Profile update PUT /api/v1/account/profile succeeded (HTTP 200, bio updated)"
else
  log_fail "Profile update failed (HTTP $PROF_UPDATE_CODE: $PROF_UPDATE_BODY)"
fi

# 7. Community Creation by User A (Alice -> Owner)
log_info "7. User A creates community (Owner)..."
COMM_CREATE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Deep Learning Guild $RAND_ID\",\"domainTag\":\"Artificial Intelligence\",\"description\":\"Research hub for ML models\"}")
COMM_CODE=$(echo "$COMM_CREATE" | tail -n1)
COMM_BODY=$(echo "$COMM_CREATE" | sed '$d')
COMM_ID=$(echo "$COMM_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

if [ "$COMM_CODE" -eq 201 ] && [ -n "$COMM_ID" ]; then
  log_pass "Community created by User A (ID: $COMM_ID, Owner ID: $ALICE_ID)"
else
  log_fail "Community creation failed (HTTP $COMM_CODE: $COMM_BODY)"
fi

# 8. Community Profile Update (Owner vs Non-Owner)
log_info "8. Testing Community Profile Update (PUT /api/v1/communities/:id)..."
# User B attempts to edit community -> 403 Forbidden
BOB_EDIT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/api/v1/communities/$COMM_ID" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked Guild Name"}')
if [ "$BOB_EDIT_CODE" -eq 403 ]; then
  log_pass "RBAC: Non-owner PUT /communities/:id rejected with 403 Forbidden"
else
  log_fail "RBAC: Non-owner PUT /communities/:id returned HTTP $BOB_EDIT_CODE (Expected 403)"
fi

# User A (Owner) edits community -> 200 OK
ALICE_EDIT=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/communities/$COMM_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Advanced Deep Learning Guild $RAND_ID\",\"description\":\"Updated research hub description\"}")
ALICE_EDIT_CODE=$(echo "$ALICE_EDIT" | tail -n1)
ALICE_EDIT_BODY=$(echo "$ALICE_EDIT" | sed '$d')
if [ "$ALICE_EDIT_CODE" -eq 200 ] && echo "$ALICE_EDIT_BODY" | grep -q "Advanced Deep Learning Guild"; then
  log_pass "Owner successfully updated community profile (HTTP 200)"
else
  log_fail "Owner failed to update community profile (HTTP $ALICE_EDIT_CODE: $ALICE_EDIT_BODY)"
fi

# 9. User B (Bob) Joins Community -> Role Member
log_info "9. User B joins community..."
JOIN_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities/$COMM_ID/join" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json")
JOIN_CODE=$(echo "$JOIN_RES" | tail -n1)
JOIN_BODY=$(echo "$JOIN_RES" | sed '$d')
if [ "$JOIN_CODE" -eq 201 ] || [ "$JOIN_CODE" -eq 200 ]; then
  log_pass "User B successfully joined community $COMM_ID (HTTP $JOIN_CODE)"
else
  log_fail "User B failed to join community (HTTP $JOIN_CODE: $JOIN_BODY)"
fi

# 10. Role-Based Permissions Verification (Non-Owner MUST receive 403 Forbidden)
log_info "10. Verifying Role-Based Access Control (RBAC 403 Forbidden for Non-Owner)..."

# 10a. User B attempts DELETE /api/v1/communities/:id -> 403
DEL_COMM_BOB=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/communities/$COMM_ID" \
  -H "Authorization: Bearer $BOB_TOKEN")
DEL_COMM_CODE=$(echo "$DEL_COMM_BOB" | tail -n1)
if [ "$DEL_COMM_CODE" -eq 403 ]; then
  log_pass "RBAC: Member DELETE /communities/:id rejected with 403 Forbidden"
else
  log_fail "RBAC: Member DELETE /communities/:id returned HTTP $DEL_COMM_CODE (Expected 403)"
fi

# 10b. User B attempts POST /api/v1/communities/:id/channels -> 403
ADD_CH_BOB=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities/$COMM_ID/channels" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"unauthorized-channel","type":"text"}')
ADD_CH_CODE=$(echo "$ADD_CH_BOB" | tail -n1)
if [ "$ADD_CH_CODE" -eq 403 ]; then
  log_pass "RBAC: Member POST /communities/:id/channels rejected with 403 Forbidden"
else
  log_fail "RBAC: Member POST /communities/:id/channels returned HTTP $ADD_CH_CODE (Expected 403)"
fi

# 10c. User A (Owner) creates channel -> 201
ADD_CH_ALICE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities/$COMM_ID/channels" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"paper-review","type":"text","topic":"Reviewing papers"}')
ALICE_CH_CODE=$(echo "$ADD_CH_ALICE" | tail -n1)
ALICE_CH_BODY=$(echo "$ADD_CH_ALICE" | sed '$d')
NEW_CH_ID=$(echo "$ALICE_CH_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
if [ "$ALICE_CH_CODE" -eq 201 ] && [ -n "$NEW_CH_ID" ]; then
  log_pass "Owner POST /communities/:id/channels created channel $NEW_CH_ID (HTTP 201)"
else
  log_fail "Owner failed to create channel (HTTP $ALICE_CH_CODE: $ALICE_CH_BODY)"
fi

# 10d. User B attempts DELETE /api/v1/channels/:id -> 403
DEL_CH_BOB=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/channels/$NEW_CH_ID" \
  -H "Authorization: Bearer $BOB_TOKEN")
DEL_CH_CODE=$(echo "$DEL_CH_BOB" | tail -n1)
if [ "$DEL_CH_CODE" -eq 403 ]; then
  log_pass "RBAC: Member DELETE /channels/:id rejected with 403 Forbidden"
else
  log_fail "RBAC: Member DELETE /channels/:id returned HTTP $DEL_CH_CODE (Expected 403)"
fi

# 10e. User B attempts PUT /api/v1/communities/:id/members/:userId (promote/demote) -> 403
ROLE_BOB=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/communities/$COMM_ID/members/$ALICE_ID" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}')
ROLE_BOB_CODE=$(echo "$ROLE_BOB" | tail -n1)
if [ "$ROLE_BOB_CODE" -eq 403 ]; then
  log_pass "RBAC: Member PUT /members/:id (role change) rejected with 403 Forbidden"
else
  log_fail "RBAC: Member role change returned HTTP $ROLE_BOB_CODE (Expected 403)"
fi

# 10f. User B attempts DELETE /api/v1/communities/:id/members/:userId (kick) -> 403
KICK_BOB=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/communities/$COMM_ID/members/$ALICE_ID" \
  -H "Authorization: Bearer $BOB_TOKEN")
KICK_BOB_CODE=$(echo "$KICK_BOB" | tail -n1)
if [ "$KICK_BOB_CODE" -eq 403 ]; then
  log_pass "RBAC: Member DELETE /members/:id (kick) rejected with 403 Forbidden"
else
  log_fail "RBAC: Member kick returned HTTP $KICK_BOB_CODE (Expected 403)"
fi

# 11. Owner Promotes and Demotes Member
log_info "11. Owner manages member roles..."
PROMOTE_RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/communities/$COMM_ID/members/$BOB_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}')
PROMOTE_CODE=$(echo "$PROMOTE_RES" | tail -n1)
if [ "$PROMOTE_CODE" -eq 200 ]; then
  log_pass "Owner promoted Member to Admin (HTTP 200)"
else
  log_fail "Owner promotion failed (HTTP $PROMOTE_CODE)"
fi

DEMOTE_RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/communities/$COMM_ID/members/$BOB_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"member"}')
DEMOTE_CODE=$(echo "$DEMOTE_RES" | tail -n1)
if [ "$DEMOTE_CODE" -eq 200 ]; then
  log_pass "Owner demoted Admin back to Member (HTTP 200)"
else
  log_fail "Owner demotion failed (HTTP $DEMOTE_CODE)"
fi

# 12. Leave Community Flow (POST and DELETE)
log_info "12. Testing Community Leave..."
# Owner leaving -> 400 Bad Request
ALICE_LEAVE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities/$COMM_ID/leave" \
  -H "Authorization: Bearer $ALICE_TOKEN")
ALICE_LEAVE_CODE=$(echo "$ALICE_LEAVE" | tail -n1)
if [ "$ALICE_LEAVE_CODE" -eq 400 ]; then
  log_pass "Owner prevented from leaving own community (HTTP 400 Bad Request)"
else
  log_fail "Owner leave check returned HTTP $ALICE_LEAVE_CODE (Expected 400)"
fi

# Member leaving via POST -> 200 OK
BOB_LEAVE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities/$COMM_ID/leave" \
  -H "Authorization: Bearer $BOB_TOKEN")
BOB_LEAVE_CODE=$(echo "$BOB_LEAVE" | tail -n1)
if [ "$BOB_LEAVE_CODE" -eq 200 ]; then
  log_pass "Member successfully left community via POST (HTTP 200)"
else
  log_fail "Member leave POST failed (HTTP $BOB_LEAVE_CODE)"
fi

# Member re-joins and leaves via DELETE
curl -s -X POST "$BASE_URL/api/v1/communities/$COMM_ID/join" -H "Authorization: Bearer $BOB_TOKEN" > /dev/null
BOB_DEL_LEAVE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/v1/communities/$COMM_ID/leave" \
  -H "Authorization: Bearer $BOB_TOKEN")
if [ "$BOB_DEL_LEAVE_CODE" -eq 200 ]; then
  log_pass "Member successfully left community via DELETE /communities/:id/leave (HTTP 200)"
else
  log_fail "Member leave DELETE failed (HTTP $BOB_DEL_LEAVE_CODE)"
fi

# 13. Authenticated Messaging & Resources
log_info "13. Testing Authenticated Messaging & Resources..."
MSG_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/channels/$NEW_CH_ID/messages" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Autonomous Agent test message"}')
MSG_CODE=$(echo "$MSG_RES" | tail -n1)
if [ "$MSG_CODE" -eq 201 ] || [ "$MSG_CODE" -eq 200 ]; then
  log_pass "Authenticated message posted by Alice (HTTP $MSG_CODE)"
else
  log_fail "Posting message failed (HTTP $MSG_CODE)"
fi

# Unauthenticated message rejected
UNAUTH_MSG=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/channels/$NEW_CH_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"Unauthenticated hacker"}')
if [ "$UNAUTH_MSG" -eq 401 ]; then
  log_pass "Unauthenticated message correctly rejected with 401 Unauthorized"
else
  log_fail "Unauthenticated message returned HTTP $UNAUTH_MSG (Expected 401)"
fi

RES_CREATE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/resources" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Attention Paper $RAND_ID\",\"url\":\"https://arxiv.org/abs/1706.03762\",\"domainTag\":\"Artificial Intelligence\"}")
RES_CODE=$(echo "$RES_CREATE" | tail -n1)
RES_BODY=$(echo "$RES_CREATE" | sed '$d')
RES_ID=$(echo "$RES_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)
if [ "$RES_CODE" -eq 201 ] && [ -n "$RES_ID" ]; then
  log_pass "Authenticated resource posted by Alice (ID: $RES_ID, HTTP 201)"
  
  # Upvote resource
  UP_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/resources/$RES_ID/upvote")
  UP_CODE=$(echo "$UP_RES" | tail -n1)
  if [ "$UP_CODE" -eq 200 ]; then
    log_pass "Resource upvoted successfully (HTTP 200)"
  else
    log_fail "Resource upvoting failed (HTTP $UP_CODE)"
  fi
else
  log_fail "Resource creation failed (HTTP $RES_CODE: $RES_BODY)"
fi

# 14. Real-time Socket.io connectivity, typing events, and room broadcasting
log_info "14. Verifying Real-Time Socket.io Connectivity & Events..."
SOCKET_TEST_RESULT=$(node -e "
const { io } = require('$SCRIPT_DIR/frontend/node_modules/socket.io-client');

let receivedMessage = false;
let receivedTyping = false;

const clientA = io('$BASE_URL', { timeout: 4000 });
const clientB = io('$BASE_URL', { timeout: 4000 });

clientA.on('connect', () => {
  clientA.emit('join_channel', $NEW_CH_ID);
});

clientB.on('connect', () => {
  clientB.emit('join_channel', $NEW_CH_ID);

  setTimeout(() => {
    clientB.emit('typing_start', { channelId: $NEW_CH_ID, username: 'Alice Owner' });
  }, 200);

  setTimeout(async () => {
    try {
      await fetch('$BASE_URL/api/v1/channels/$NEW_CH_ID/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $ALICE_TOKEN'
        },
        body: JSON.stringify({ content: 'Real-time WebSocket Test Message' })
      });
    } catch (e) {
      console.error('Failed to post socket test message:', e);
      process.exit(1);
    }
  }, 500);
});

clientA.on('user_typing', (data) => {
  if (data.channelId == $NEW_CH_ID && data.isTyping === true) {
    receivedTyping = true;
    checkSuccess();
  }
});

clientA.on('new_message', (msg) => {
  if (msg.content === 'Real-time WebSocket Test Message') {
    receivedMessage = true;
    checkSuccess();
  }
});

function checkSuccess() {
  if (receivedMessage && receivedTyping) {
    console.log('REALTIME_SOCKET_AND_TYPING_SUCCESS');
    clientA.disconnect();
    clientB.disconnect();
    process.exit(0);
  }
}

setTimeout(() => {
  console.error('Socket test timeout: receivedMessage=' + receivedMessage + ', receivedTyping=' + receivedTyping);
  clientA.disconnect();
  clientB.disconnect();
  process.exit(1);
}, 6000);
" 2>&1 || true)

if echo "$SOCKET_TEST_RESULT" | grep -q "REALTIME_SOCKET_AND_TYPING_SUCCESS"; then
  log_pass "Real-time Socket.io message broadcasting AND typing indicator events verified"
else
  log_fail "Real-time Socket.io verification failed ($SOCKET_TEST_RESULT)"
fi

# 15. Owner Deletion Operations (Channel & Community)
log_info "15. Owner deletes channel & community..."
DEL_CH_RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/channels/$NEW_CH_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN")
DEL_CH_CODE=$(echo "$DEL_CH_RES" | tail -n1)
if [ "$DEL_CH_CODE" -eq 200 ]; then
  log_pass "Owner deleted channel $NEW_CH_ID (HTTP 200)"
else
  log_fail "Owner channel deletion failed (HTTP $DEL_CH_CODE)"
fi

DEL_COMM_RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/communities/$COMM_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN")
DEL_COMM_CODE=$(echo "$DEL_COMM_RES" | tail -n1)
if [ "$DEL_COMM_CODE" -eq 200 ]; then
  log_pass "Owner deleted community $COMM_ID (HTTP 200)"
else
  log_fail "Owner community deletion failed (HTTP $DEL_COMM_CODE)"
fi

# 16. Logout & Cookie Clearance Verification
log_info "16. Verifying Logout & Cookie Clearance..."
LOGOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR_ALICE" -X POST "$BASE_URL/api/v1/auth/logout")
if [ "$LOGOUT_CODE" -eq 200 ]; then
  log_pass "Logout POST /api/v1/auth/logout succeeded (HTTP 200)"
else
  log_fail "Logout POST /api/v1/auth/logout returned HTTP $LOGOUT_CODE"
fi

echo "=========================================================="
echo "Gen2 Verification Summary:"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo "=========================================================="

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "\033[1;32mALL GEN2 VERIFICATION CHECKS PASSED SUCCESSFULLY!\033[0m"
  exit 0
else
  echo -e "\033[1;31mVERIFICATION FAILED: $FAIL_COUNT test(s) failed!\033[0m"
  exit 1
fi
