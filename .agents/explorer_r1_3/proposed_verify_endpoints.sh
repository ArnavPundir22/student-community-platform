#!/usr/bin/env bash
set -e

# ==============================================================================
# Automated API & WebSocket Verification Script
# Student Community & Collaboration Platform
# ==============================================================================

BASE_URL="${API_URL:-http://localhost:3333}"
PASS_COUNT=0
FAIL_COUNT=0

log_info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}

log_pass() {
  echo -e "\033[1;32m[PASS]\033[0m $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
  echo -e "\033[1;31m[FAIL]\033[0m $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_status() {
  local actual="$1"
  local expected="$2"
  local test_name="$3"

  if [ "$actual" -eq "$expected" ]; then
    log_pass "$test_name (HTTP $actual)"
  else
    log_fail "$test_name (Expected HTTP $expected, got $actual)"
  fi
}

echo "=========================================================="
echo "Starting Verification against $BASE_URL"
echo "=========================================================="

# 1. Health check
log_info "1. Verifying Gateway Health Endpoint (GET /)..."
HTTP_CODE=$(curl -s -o /tmp/health.json -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_CODE" -eq 200 ] && grep -q '"status":"online"' /tmp/health.json; then
  log_pass "Gateway health check online"
else
  log_fail "Gateway health check failed (HTTP $HTTP_CODE)"
fi

# 2. Authentication Login
log_info "2. Authenticating user (POST /api/v1/auth/login)..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@university.edu","password":"Password123!"}')

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
AUTH_BODY=$(echo "$AUTH_RESPONSE" | sed '$d')

TOKEN=$(echo "$AUTH_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_CODE" -eq 200 ] && [ -n "$TOKEN" ]; then
  log_pass "Authentication succeeded, token acquired"
else
  log_fail "Authentication failed (HTTP $HTTP_CODE)"
fi

# 3. Protected Profile Endpoint
log_info "3. Verifying Protected Profile (GET /api/v1/account/profile)..."
HTTP_CODE=$(curl -s -o /tmp/profile.json -w "%{http_code}" "$BASE_URL/api/v1/account/profile" \
  -H "Authorization: Bearer $TOKEN")
assert_status "$HTTP_CODE" 200 "GET /api/v1/account/profile"

# 4. List Communities
log_info "4. Verifying Communities List (GET /api/v1/communities)..."
HTTP_CODE=$(curl -s -o /tmp/communities.json -w "%{http_code}" "$BASE_URL/api/v1/communities")
COMMUNITY_COUNT=$(grep -o '"id":' /tmp/communities.json | wc -l)
if [ "$HTTP_CODE" -eq 200 ] && [ "$COMMUNITY_COUNT" -gt 0 ]; then
  log_pass "GET /api/v1/communities returned $COMMUNITY_COUNT communities"
else
  log_fail "GET /api/v1/communities failed or returned 0 communities"
fi

FIRST_COMM_ID=$(grep -o '"id":[0-9]*' /tmp/communities.json | head -n1 | cut -d: -f2)

# 5. Community Details by ID
log_info "5. Verifying Community Details (GET /api/v1/communities/$FIRST_COMM_ID)..."
HTTP_CODE=$(curl -s -o /tmp/community_detail.json -w "%{http_code}" "$BASE_URL/api/v1/communities/$FIRST_COMM_ID")
if [ "$HTTP_CODE" -eq 200 ] && grep -q '"channels":' /tmp/community_detail.json; then
  log_pass "GET /api/v1/communities/$FIRST_COMM_ID returned valid community with channels"
else
  log_fail "GET /api/v1/communities/$FIRST_COMM_ID failed"
fi

# 6. Create Community Hub
log_info "6. Creating Custom Community Hub (POST /api/v1/communities)..."
RAND_ID=$((RANDOM % 9000 + 1000))
NEW_COMM_NAME="Verification Student Hub $RAND_ID"
CREATE_COMM_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/communities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NEW_COMM_NAME\",\"domainTag\":\"Data Science\",\"description\":\"Automated test hub\"}")

HTTP_CODE=$(echo "$CREATE_COMM_RES" | tail -n1)
BODY=$(echo "$CREATE_COMM_RES" | sed '$d')
NEW_COMM_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ "$HTTP_CODE" -eq 201 ] && [ -n "$NEW_COMM_ID" ]; then
  log_pass "POST /api/v1/communities created hub id $NEW_COMM_ID"
else
  log_fail "POST /api/v1/communities failed (HTTP $HTTP_CODE)"
fi

# 7. Join Community
log_info "7. Testing Community Join (POST /api/v1/communities/$FIRST_COMM_ID/join)..."
JOIN_CODE=$(curl -s -o /tmp/join.json -w "%{http_code}" -X POST "$BASE_URL/api/v1/communities/$FIRST_COMM_ID/join" \
  -H "Authorization: Bearer $TOKEN")
if [ "$JOIN_CODE" -eq 200 ] || [ "$JOIN_CODE" -eq 201 ]; then
  log_pass "POST /api/v1/communities/$FIRST_COMM_ID/join responded with HTTP $JOIN_CODE"
else
  log_fail "POST /api/v1/communities/$FIRST_COMM_ID/join failed (HTTP $JOIN_CODE)"
fi

# 8. Channel Messages List
# Find first channel ID
FIRST_CHAN_ID=$(grep -o '"channels":\[{"id":[0-9]*' /tmp/community_detail.json | grep -o '[0-9]*$' || echo "5")
log_info "8. Verifying Channel Messages (GET /api/v1/channels/$FIRST_CHAN_ID/messages)..."
HTTP_CODE=$(curl -s -o /tmp/messages.json -w "%{http_code}" "$BASE_URL/api/v1/channels/$FIRST_CHAN_ID/messages")
assert_status "$HTTP_CODE" 200 "GET /api/v1/channels/$FIRST_CHAN_ID/messages"

# 9. Post Channel Message
log_info "9. Posting Channel Message (POST /api/v1/channels/$FIRST_CHAN_ID/messages)..."
MSG_CONTENT="Automated verification test $(date +%s)"
POST_MSG_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/channels/$FIRST_CHAN_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"$MSG_CONTENT\"}")

HTTP_CODE=$(echo "$POST_MSG_RES" | tail -n1)
POST_MSG_BODY=$(echo "$POST_MSG_RES" | sed '$d')
NEW_MSG_ID=$(echo "$POST_MSG_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

if [ "$HTTP_CODE" -eq 201 ] && [ -n "$NEW_MSG_ID" ]; then
  log_pass "POST /api/v1/channels/$FIRST_CHAN_ID/messages created message id $NEW_MSG_ID"
else
  log_fail "POST /api/v1/channels/$FIRST_CHAN_ID/messages failed (HTTP $HTTP_CODE)"
fi

# 10. List Resources & Domain Filter
log_info "10. Verifying Resources List (GET /api/v1/resources)..."
HTTP_CODE=$(curl -s -o /tmp/resources.json -w "%{http_code}" "$BASE_URL/api/v1/resources")
assert_status "$HTTP_CODE" 200 "GET /api/v1/resources"

log_info "10b. Verifying Domain Filter (GET /api/v1/resources?domain=Artificial%20Intelligence)..."
HTTP_CODE=$(curl -s -o /tmp/resources_filtered.json -w "%{http_code}" "$BASE_URL/api/v1/resources?domain=Artificial%20Intelligence")
assert_status "$HTTP_CODE" 200 "GET /api/v1/resources?domain=Artificial%20Intelligence"

# 11. Submit Resource
log_info "11. Submitting Resource (POST /api/v1/resources)..."
RES_TITLE="Verification Resource $RAND_ID"
POST_RES_OUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$RES_TITLE\",\"url\":\"https://example.com/test\",\"domainTag\":\"Data Science\",\"description\":\"Test description\"}")

HTTP_CODE=$(echo "$POST_RES_OUT" | tail -n1)
POST_RES_BODY=$(echo "$POST_RES_OUT" | sed '$d')
NEW_RES_ID=$(echo "$POST_RES_BODY" | grep -o '"id":[0-9]*' | head -n1 | cut -d: -f2)

if [ "$HTTP_CODE" -eq 201 ] && [ -n "$NEW_RES_ID" ]; then
  log_pass "POST /api/v1/resources created resource id $NEW_RES_ID"
else
  log_fail "POST /api/v1/resources failed (HTTP $HTTP_CODE)"
fi

# 12. Upvote Resource
log_info "12. Upvoting Resource (POST /api/v1/resources/$NEW_RES_ID/upvote)..."
UPVOTE_OUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/resources/$NEW_RES_ID/upvote")
HTTP_CODE=$(echo "$UPVOTE_OUT" | tail -n1)
UPVOTE_BODY=$(echo "$UPVOTE_OUT" | sed '$d')
NEW_UPVOTES=$(echo "$UPVOTE_BODY" | grep -o '"upvotes":[0-9]*' | cut -d: -f2)

if [ "$HTTP_CODE" -eq 200 ] && [ "$NEW_UPVOTES" -gt 1 ]; then
  log_pass "POST /api/v1/resources/$NEW_RES_ID/upvote incremented count to $NEW_UPVOTES"
else
  log_fail "POST /api/v1/resources/$NEW_RES_ID/upvote failed (HTTP $HTTP_CODE, upvotes: $NEW_UPVOTES)"
fi

# 13. Real-Time Socket.io Duplex Verification
log_info "13. Verifying Real-Time Socket.io Event Broadcasting..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SOCKET_RESULT=$(node -e "
const { io } = require('$PROJECT_ROOT/frontend/node_modules/socket.io-client');
const socket = io('$BASE_URL', { timeout: 4000 });

socket.on('connect', () => {
  socket.emit('join_channel', $FIRST_CHAN_ID);

  setTimeout(async () => {
    try {
      const res = await fetch('$BASE_URL/api/v1/channels/$FIRST_CHAN_ID/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $TOKEN'
        },
        body: JSON.stringify({ content: 'E2E Socket Verification Broadcast' })
      });
      if (!res.ok) {
        console.error('Failed to post message:', res.status);
        process.exit(1);
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }, 400);
});

socket.on('new_message', (msg) => {
  if (msg.content === 'E2E Socket Verification Broadcast') {
    console.log('SOCKET_BROADCAST_SUCCESS');
    socket.disconnect();
    process.exit(0);
  }
});

setTimeout(() => {
  console.error('SOCKET_TIMEOUT');
  process.exit(1);
}, 5000);
" 2>&1 || true)

if echo "$SOCKET_RESULT" | grep -q "SOCKET_BROADCAST_SUCCESS"; then
  log_pass "Socket.io real-time broadcast received successfully"
else
  log_fail "Socket.io real-time broadcast failed or timed out ($SOCKET_RESULT)"
fi

echo "=========================================================="
echo "Verification Summary:"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo "=========================================================="

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "\033[1;32mALL VERIFICATION CHECKS PASSED!\033[0m"
  exit 0
else
  echo -e "\033[1;31mSOME VERIFICATION CHECKS FAILED!\033[0m"
  exit 1
fi
