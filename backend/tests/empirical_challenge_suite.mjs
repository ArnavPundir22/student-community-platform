import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { io } = require('../../frontend/node_modules/socket.io-client');

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:3333';

const results = {
  passed: 0,
  failed: 0,
  findings: [],
  tests: []
};

function recordTest(name, passed, details = {}) {
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name} ${details.extra ? '(' + details.extra + ')' : ''}`);
  if (!passed && details.error) {
    console.error(`       Error: ${details.error}`);
  }
  if (passed) results.passed++;
  else results.failed++;
  results.tests.push({ name, passed, ...details });
}

function recordFinding(title, severity, details) {
  console.log(`\n>>> [FINDING - ${severity.toUpperCase()}] ${title}`);
  console.log(`    ${details}\n`);
  results.findings.push({ title, severity, details });
}

async function run() {
  console.log('================================================================');
  console.log(`Empirical Challenge Suite running against ${BASE_URL}`);
  console.log('================================================================\n');

  // --- SECTION 1: AUTHENTICATION & MESSAGES ---
  console.log('--- SECTION 1: Messages API & Authorization Checks ---');

  // 1.1 Unauthenticated message creation (demo fallback)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Empirical Test: Unauthenticated demo fallback message' })
    });
    const status = res.status;
    const body = await res.json();
    const ok = (status === 201 || status === 200) && body.user && body.user.username === 'alex_student';
    recordTest('1.1 POST /channels/1/messages without Auth header (Demo fallback to Alex Rivera)', ok, {
      status,
      userId: body.user?.id,
      username: body.user?.username,
      extra: `HTTP ${status}, author=${body.user?.username} (ID: ${body.userId})`
    });
  } catch (err) {
    recordTest('1.1 POST /channels/1/messages without Auth header', false, { error: err.message });
  }

  // 1.2 Authenticated message creation with Alex Rivera token
  let alexToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@university.edu', password: 'Password123!' })
    });
    const loginBody = await loginRes.json();
    alexToken = loginBody.data?.token || loginBody.token || '';
    const okLogin = loginRes.status === 200 && !!alexToken;
    recordTest('1.2a Login Alex Rivera to acquire token', okLogin, { extra: `HTTP ${loginRes.status}, tokenPrefix=${alexToken.slice(0, 10)}...` });

    if (alexToken) {
      const msgRes = await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${alexToken}`
        },
        body: JSON.stringify({ content: 'Empirical Test: Authenticated message as Alex' })
      });
      const msgStatus = msgRes.status;
      const msgBody = await msgRes.json();
      const ok = (msgStatus === 201 || msgStatus === 200) && msgBody.user?.username === 'alex_student';
      recordTest('1.2b POST /channels/1/messages WITH Alex Rivera Auth token', ok, {
        extra: `HTTP ${msgStatus}, author=${msgBody.user?.username}`
      });
    }
  } catch (err) {
    recordTest('1.2 POST /channels/1/messages with Auth token', false, { error: err.message });
  }

  // 1.3 Register distinct user & post message under new identity
  let bobToken = '';
  let bobUser = null;
  try {
    const randId = Math.floor(Math.random() * 900000 + 100000);
    const signupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: `Bob Tester ${randId}`,
        username: `bob_${randId}`,
        email: `bob_${randId}@university.edu`,
        password: 'Password123!',
        passwordConfirmation: 'Password123!'
      })
    });
    const signupBody = await signupRes.json();
    bobToken = signupBody.data?.token || signupBody.token || '';
    bobUser = signupBody.data?.user || signupBody.user || null;
    const okSignup = (signupRes.status === 201 || signupRes.status === 200) && !!bobToken;
    recordTest('1.3a Register distinct student Bob Tester and obtain token', okSignup, {
      extra: `HTTP ${signupRes.status}, user=${bobUser?.fullName} (ID: ${bobUser?.id})`
    });

    if (bobToken && bobUser) {
      const bobMsgRes = await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bobToken}`
        },
        body: JSON.stringify({ content: 'Empirical Test: Distinct user message by Bob' })
      });
      const bobMsgStatus = bobMsgRes.status;
      const bobMsgBody = await bobMsgRes.json();
      const okBob = (bobMsgStatus === 201 || bobMsgStatus === 200) && bobMsgBody.userId === bobUser.id;
      recordTest('1.3b POST /channels/1/messages WITH Bob Auth token correctly attributes message to Bob (not demo user)', okBob, {
        extra: `HTTP ${bobMsgStatus}, msg author=${bobMsgBody.user?.fullName} (userId: ${bobMsgBody.userId})`
      });
    }
  } catch (err) {
    recordTest('1.3 Distinct user message check', false, { error: err.message });
  }

  // 1.4 Invalid Bearer token behavior test
  try {
    const invalidAuthRes = await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_bogus_token_xyz999'
      },
      body: JSON.stringify({ content: 'Message with bogus token' })
    });
    const invalidAuthStatus = invalidAuthRes.status;
    const invalidAuthBody = await invalidAuthRes.json();
    const silentlyFellBack = (invalidAuthStatus === 201 || invalidAuthStatus === 200) && invalidAuthBody.user?.username === 'alex_student';
    recordTest('1.4 POST /channels/1/messages with INVALID Bearer token (Characterization)', true, {
      extra: `HTTP ${invalidAuthStatus}, silentFallbackToDemo=${silentlyFellBack}`
    });
    if (silentlyFellBack) {
      recordFinding(
        'Invalid Bearer Token Silently Degrades to Demo User',
        'Low / Medium Architectural Note',
        'When an invalid Bearer token is provided, auth.check() throws internally, which is caught by an empty try/catch in MessagesController, silently attributing the message to the demo user (Alex Rivera) rather than rejecting with 401 Unauthorized.'
      );
    }
  } catch (err) {
    recordTest('1.4 Invalid token check', false, { error: err.message });
  }

  // 1.5 Empty content validation
  try {
    const emptyRes = await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' })
    });
    const emptyStatus = emptyRes.status;
    const ok = emptyStatus === 400;
    recordTest('1.5 POST /channels/1/messages with EMPTY content returns 400 Bad Request', ok, {
      extra: `HTTP ${emptyStatus}`
    });
  } catch (err) {
    recordTest('1.5 Empty content check', false, { error: err.message });
  }

  // 1.6 Whitespace-only content validation
  try {
    const wsRes = await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '   ' })
    });
    const wsStatus = wsRes.status;
    const wsBody = await wsRes.json();
    const rejected = wsStatus === 400;
    recordTest('1.6 POST /channels/1/messages with WHITESPACE-ONLY content ("   ")', true, {
      extra: `HTTP ${wsStatus}, createdMsgId=${wsBody?.id || 'none'}`
    });
    if (!rejected) {
      recordFinding(
        'Whitespace-Only Messages Allowed',
        'Low Cosmetic / Input Sanitization',
        'Posting content with only spaces "   " is accepted because if (!content) checks truthiness rather than content.trim().'
      );
    }
  } catch (err) {
    recordTest('1.6 Whitespace content check', false, { error: err.message });
  }

  // 1.7 Non-existent channel ID
  try {
    const missingChRes = await fetch(`${BASE_URL}/api/v1/channels/999999/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Message to non-existent channel' })
    });
    const chStatus = missingChRes.status;
    recordTest('1.7 POST /channels/999999/messages (Non-existent channel ID)', true, {
      extra: `HTTP ${chStatus}`
    });
    if (chStatus === 500) {
      recordFinding(
        'Non-existent Channel ID in Messages Controller Results in Unhandled 500 Error',
        'Medium Robustness Finding',
        'MessagesController does not verify channel existence before insert. SQLite foreign key constraint triggers an unhandled 500 internal server error instead of a graceful 404 Channel Not Found.'
      );
    }
  } catch (err) {
    recordTest('1.7 Non-existent channel check', false, { error: err.message });
  }

  // 1.8 Non-numeric channel ID
  try {
    const nanChRes = await fetch(`${BASE_URL}/api/v1/channels/invalid-channel-abc/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Message to NaN channel' })
    });
    const nanStatus = nanChRes.status;
    const nanBody = await nanChRes.json();
    recordTest('1.8 POST /channels/invalid-channel-abc/messages (Non-numeric channel ID)', true, {
      extra: `HTTP ${nanStatus}, channelIdInRecord=${nanBody.channelId}`
    });
    if (nanStatus === 201 && nanBody.channelId === null) {
      recordFinding(
        'Non-numeric Channel ID Creates Orphan Message with channelId=null',
        'Medium Data Integrity Finding',
        'Number("invalid-channel-abc") yields NaN, which Lucid translates to null on insert. A message with channel_id = null is created without throwing validation errors.'
      );
    }
  } catch (err) {
    recordTest('1.8 Non-numeric channel check', false, { error: err.message });
  }


  // --- SECTION 2: MONOTONIC UPVOTE INCREMENT ---
  console.log('\n--- SECTION 2: Resource Upvote Counter & Monotonicity ---');

  // Create a dedicated resource for upvote testing
  let testResId = null;
  let initialUpvotes = 1;
  try {
    const createRes = await fetch(`${BASE_URL}/api/v1/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Monotonic Upvote Test Resource ${Date.now()}`,
        url: 'https://test-upvote.org',
        domainTag: 'Web Development',
        description: 'Testing monotonic increment'
      })
    });
    const created = await createRes.json();
    testResId = created.id;
    initialUpvotes = created.upvotes || 1;
    recordTest('2.1a Create dedicated resource for upvote testing', createRes.status === 201, {
      extra: `Resource ID: ${testResId}, initial upvotes: ${initialUpvotes}`
    });
  } catch (err) {
    recordTest('2.1a Create dedicated resource', false, { error: err.message });
  }

  if (testResId) {
    // 2.1 Sequential 10 upvotes
    let monotonicPass = true;
    let currentCount = initialUpvotes;
    const seqHistory = [currentCount];

    for (let i = 1; i <= 10; i++) {
      const upRes = await fetch(`${BASE_URL}/api/v1/resources/${testResId}/upvote`, {
        method: 'POST'
      });
      if (upRes.status !== 200) {
        monotonicPass = false;
        break;
      }
      const upData = await upRes.json();
      if (upData.upvotes !== currentCount + 1) {
        monotonicPass = false;
        seqHistory.push(`Expected ${currentCount + 1} got ${upData.upvotes}`);
        break;
      }
      currentCount = upData.upvotes;
      seqHistory.push(currentCount);
    }

    recordTest('2.1b Sequential 10 upvotes verify strict monotonic counter increment', monotonicPass, {
      extra: `Initial=${initialUpvotes}, Final=${currentCount}, History=[${seqHistory.join(',')}]`
    });

    // 2.2 Concurrent upvoting stress test (10 parallel requests)
    const concurrentCount = 10;
    const startConcurrent = currentCount;
    const promises = Array.from({ length: concurrentCount }, () =>
      fetch(`${BASE_URL}/api/v1/resources/${testResId}/upvote`, { method: 'POST' }).then(r => r.json())
    );
    await Promise.all(promises);
    const freshRes = await fetch(`${BASE_URL}/api/v1/resources`);
    const allRes = await freshRes.json();
    const updatedTestRes = allRes.find(r => r.id === testResId);
    const finalUpvotes = updatedTestRes?.upvotes;
    const expectedFinal = startConcurrent + concurrentCount;
    const loss = expectedFinal - (finalUpvotes || 0);

    recordTest('2.2 Concurrent 10 upvotes execution', true, {
      extra: `Start=${startConcurrent}, Expected=${expectedFinal}, Actual=${finalUpvotes}, LostUpdates=${loss}`
    });

    if (loss > 0) {
      recordFinding(
        'Concurrent Upvotes Suffer From Lost Updates (Race Condition)',
        'Low / Medium Concurrency Finding',
        `Under 10 simultaneous POST /resources/:id/upvote requests, ${loss} updates were lost due to non-atomic read-modify-write (resource.upvotes = upvotes + 1 followed by save). Recommend SQL-level increment: table.increment('upvotes').`
      );
    }
  }

  // 2.3 Upvoting non-existent resource
  try {
    const notFoundRes = await fetch(`${BASE_URL}/api/v1/resources/999999/upvote`, { method: 'POST' });
    const ok = notFoundRes.status === 404;
    recordTest('2.3 POST /resources/999999/upvote returns 404 Not Found', ok, {
      extra: `HTTP ${notFoundRes.status}`
    });
  } catch (err) {
    recordTest('2.3 Non-existent upvote check', false, { error: err.message });
  }

  // 2.4 Upvoting non-numeric resource ID
  try {
    const badIdRes = await fetch(`${BASE_URL}/api/v1/resources/bad-id-xyz/upvote`, { method: 'POST' });
    const ok = badIdRes.status === 404;
    recordTest('2.4 POST /resources/bad-id-xyz/upvote returns 404 Not Found', ok, {
      extra: `HTTP ${badIdRes.status}`
    });
  } catch (err) {
    recordTest('2.4 Bad ID upvote check', false, { error: err.message });
  }


  // --- SECTION 3: COMMUNITIES & CHANNEL SEEDING ---
  console.log('\n--- SECTION 3: Community Details & Channel Seeding Verification ---');

  // 3.1 Community 1
  try {
    const c1Res = await fetch(`${BASE_URL}/api/v1/communities/1`);
    const c1 = await c1Res.json();
    const hasChannels = Array.isArray(c1.channels) && c1.channels.length >= 2;
    const hasOwner = !!c1.owner?.username;
    const ok = c1Res.status === 200 && hasChannels && hasOwner;
    const channelNames = (c1.channels || []).map(c => c.name);
    recordTest('3.1 GET /communities/1 (AI & Machine Learning Innovators)', ok, {
      extra: `HTTP ${c1Res.status}, channels=[${channelNames.join(', ')}], owner=${c1.owner?.fullName}`
    });
  } catch (err) {
    recordTest('3.1 Community 1 check', false, { error: err.message });
  }

  // 3.2 Community 2
  try {
    const c2Res = await fetch(`${BASE_URL}/api/v1/communities/2`);
    const c2 = await c2Res.json();
    const hasChannels = Array.isArray(c2.channels) && c2.channels.length >= 2;
    const channelNames = (c2.channels || []).map(c => c.name);
    const ok = c2Res.status === 200 && hasChannels;
    recordTest('3.2 GET /communities/2 (Full-Stack & Web Dev Guild)', ok, {
      extra: `HTTP ${c2Res.status}, channels=[${channelNames.join(', ')}], owner=${c2.owner?.fullName}`
    });
  } catch (err) {
    recordTest('3.2 Community 2 check', false, { error: err.message });
  }

  // 3.3 Community 3 (Cybersecurity & Ethical Hacking)
  try {
    const c3Res = await fetch(`${BASE_URL}/api/v1/communities/3`);
    const c3 = await c3Res.json();
    const channels = c3.channels || [];
    const channelNames = channels.map(c => c.name);
    const hasCtf = channelNames.includes('ctf-challenges');
    const hasSec = channelNames.includes('security-resources');
    const ok = c3Res.status === 200 && hasCtf && hasSec;
    recordTest('3.3 GET /communities/3 (Cybersecurity) has seeded channels ctf-challenges and security-resources', ok, {
      extra: `HTTP ${c3Res.status}, channels=[${channelNames.join(', ')}]`
    });
  } catch (err) {
    recordTest('3.3 Community 3 check', false, { error: err.message });
  }

  // 3.4 Non-existent community 404
  try {
    const c404Res = await fetch(`${BASE_URL}/api/v1/communities/999999`);
    const ok = c404Res.status === 404;
    recordTest('3.4 GET /communities/999999 returns 404 Not Found', ok, {
      extra: `HTTP ${c404Res.status}`
    });
  } catch (err) {
    recordTest('3.4 Non-existent community check', false, { error: err.message });
  }


  // --- SECTION 4: RESOURCE DOMAIN TAG FILTERING ---
  console.log('\n--- SECTION 4: Resource Domain Tag Filtering Verification ---');

  // 4.1 Filter domain=Cybersecurity
  try {
    const cyberRes = await fetch(`${BASE_URL}/api/v1/resources?domain=Cybersecurity`);
    const cyberList = await cyberRes.json();
    const allCyber = Array.isArray(cyberList) && cyberList.length > 0 && cyberList.every(r => r.domainTag === 'Cybersecurity');
    recordTest('4.1 GET /resources?domain=Cybersecurity strictly filters by domainTag', allCyber, {
      extra: `HTTP ${cyberRes.status}, count=${cyberList?.length}, allMatch=${allCyber}`
    });
  } catch (err) {
    recordTest('4.1 Domain Cybersecurity filter check', false, { error: err.message });
  }

  // 4.2 Filter domain=Artificial Intelligence
  try {
    const aiRes = await fetch(`${BASE_URL}/api/v1/resources?domain=${encodeURIComponent('Artificial Intelligence')}`);
    const aiList = await aiRes.json();
    const allAi = Array.isArray(aiList) && aiList.length > 0 && aiList.every(r => r.domainTag === 'Artificial Intelligence');
    recordTest('4.2 GET /resources?domain=Artificial+Intelligence strictly filters by domainTag', allAi, {
      extra: `HTTP ${aiRes.status}, count=${aiList?.length}, allMatch=${allAi}`
    });
  } catch (err) {
    recordTest('4.2 Domain AI filter check', false, { error: err.message });
  }

  // 4.3 Filter domain=Web Development
  try {
    const webRes = await fetch(`${BASE_URL}/api/v1/resources?domain=${encodeURIComponent('Web Development')}`);
    const webList = await webRes.json();
    const allWeb = Array.isArray(webList) && webList.length > 0 && webList.every(r => r.domainTag === 'Web Development');
    recordTest('4.3 GET /resources?domain=Web+Development strictly filters by domainTag', allWeb, {
      extra: `HTTP ${webRes.status}, count=${webList?.length}, allMatch=${allWeb}`
    });
  } catch (err) {
    recordTest('4.3 Domain Web filter check', false, { error: err.message });
  }

  // 4.4 Filter non-existent domain returns empty array
  try {
    const emptyRes = await fetch(`${BASE_URL}/api/v1/resources?domain=NonExistentDomainXYZ`);
    const emptyList = await emptyRes.json();
    const ok = emptyRes.status === 200 && Array.isArray(emptyList) && emptyList.length === 0;
    recordTest('4.4 GET /resources?domain=NonExistentDomain returns empty array [] with HTTP 200', ok, {
      extra: `HTTP ${emptyRes.status}, count=${emptyList?.length}`
    });
  } catch (err) {
    recordTest('4.4 NonExistent domain check', false, { error: err.message });
  }

  // 4.5 SQL Injection attempt in domain query parameter
  try {
    const sqlInjRes = await fetch(`${BASE_URL}/api/v1/resources?domain=${encodeURIComponent("' OR '1'='1")}`);
    const sqlList = await sqlInjRes.json();
    const ok = sqlInjRes.status === 200 && Array.isArray(sqlList) && sqlList.length === 0;
    recordTest("4.5 SQL Injection resilience in domain query (' OR '1'='1)", ok, {
      extra: `HTTP ${sqlInjRes.status}, count=${sqlList?.length} (parameterized query verified)`
    });
  } catch (err) {
    recordTest('4.5 SQL injection check', false, { error: err.message });
  }


  // --- SECTION 5: COMMUNITY CREATION & JOIN FLOWS ---
  console.log('\n--- SECTION 5: Community Hub Creation, Channels & Membership ---');

  let newCommunityId = null;
  // 5.1 Create custom community
  try {
    const randSuffix = Math.floor(Math.random() * 9000 + 1000);
    const commRes = await fetch(`${BASE_URL}/api/v1/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Robotics Club ${randSuffix}`,
        domainTag: 'Robotics & Embedded',
        description: 'Autonomous systems and hardware hacking'
      })
    });
    const commBody = await commRes.json();
    newCommunityId = commBody.id;
    const hasDefaultChannels = Array.isArray(commBody.channels) &&
      commBody.channels.some(c => c.name === 'general-discussion') &&
      commBody.channels.some(c => c.name === 'resources');
    const ok = commRes.status === 201 && hasDefaultChannels;
    recordTest('5.1 POST /communities creates hub with default channels #general-discussion & #resources', ok, {
      extra: `HTTP ${commRes.status}, ID: ${newCommunityId}, channels=[${commBody.channels?.map(c => c.name).join(', ')}]`
    });
  } catch (err) {
    recordTest('5.1 Community creation check', false, { error: err.message });
  }

  // 5.2 Create community missing required fields
  try {
    const badCommRes = await fetch(`${BASE_URL}/api/v1/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Missing name and domainTag' })
    });
    const ok = badCommRes.status === 400;
    recordTest('5.2 POST /communities with missing required fields returns 400 Bad Request', ok, {
      extra: `HTTP ${badCommRes.status}`
    });
  } catch (err) {
    recordTest('5.2 Bad community creation check', false, { error: err.message });
  }

  // 5.3 Add channel to community
  if (newCommunityId) {
    try {
      const addChRes = await fetch(`${BASE_URL}/api/v1/communities/${newCommunityId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hardware Hacks & Schematics',
          type: 'text',
          topic: 'Circuit diagrams and PCB layout'
        })
      });
      const chData = await addChRes.json();
      const ok = addChRes.status === 201 && (chData.name === 'hardware-hacks---schematics' || chData.name.includes('hardware-hacks'));
      recordTest('5.3 POST /communities/:id/channels adds slugified custom channel', ok, {
        extra: `HTTP ${addChRes.status}, slugifiedName=${chData.name}`
      });
    } catch (err) {
      recordTest('5.3 Add channel check', false, { error: err.message });
    }

    // 5.4 Join community behavior
    try {
      const joinHeaders = bobToken ? { 'Authorization': `Bearer ${bobToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const join1 = await fetch(`${BASE_URL}/api/v1/communities/${newCommunityId}/join`, {
        method: 'POST',
        headers: joinHeaders
      });
      const join1Data = await join1.json();
      const okJoin1 = join1.status === 201 || (join1.status === 200 && join1Data.message?.includes('Already'));

      const join2 = await fetch(`${BASE_URL}/api/v1/communities/${newCommunityId}/join`, {
        method: 'POST',
        headers: joinHeaders
      });
      const join2Data = await join2.json();
      const okJoin2 = join2.status === 200 && join2Data.message === 'Already a member of this community';

      recordTest('5.4 POST /communities/:id/join handles membership idempotency (Already member check)', okJoin2, {
        extra: `Join1 status=${join1.status}, Join2 status=${join2.status}, msg="${join2Data.message}"`
      });
    } catch (err) {
      recordTest('5.4 Join community idempotency check', false, { error: err.message });
    }
  }


  // --- SECTION 6: REAL-TIME SOCKET.IO CHANNEL ISOLATION & TYPING ---
  console.log('\n--- SECTION 6: Real-time Socket.io Channel Isolation & Broadcast Stress ---');

  await new Promise((resolve) => {
    let completed = false;
    const clientCh1 = io(BASE_URL, { timeout: 3000 });
    const clientCh2 = io(BASE_URL, { timeout: 3000 });
    let ch1ReceivedMsg = false;
    let ch2ReceivedMsg = false;
    let typingReceivedOnCh1 = false;
    let typingReceivedOnCh2 = false;

    const cleanup = () => {
      if (!completed) {
        completed = true;
        clientCh1.disconnect();
        clientCh2.disconnect();
        resolve();
      }
    };

    const timeout = setTimeout(() => {
      recordTest('6.1 Socket.io cross-channel isolation check', ch1ReceivedMsg && !ch2ReceivedMsg, {
        extra: `ch1Msg=${ch1ReceivedMsg}, ch2Msg(leakage)=${ch2ReceivedMsg}`
      });
      recordTest('6.2 Socket.io typing indicator channel scoping', typingReceivedOnCh1 && !typingReceivedOnCh2, {
        extra: `ch1Typing=${typingReceivedOnCh1}, ch2Typing(leakage)=${typingReceivedOnCh2}`
      });
      cleanup();
    }, 4000);

    let ch1Ready = false;
    let ch2Ready = false;

    clientCh1.on('connect', () => {
      clientCh1.emit('join_channel', 1);
      ch1Ready = true;
      triggerTestIfReady();
    });

    clientCh2.on('connect', () => {
      clientCh2.emit('join_channel', 2);
      ch2Ready = true;
      triggerTestIfReady();
    });

    clientCh1.on('new_message', (msg) => {
      if (msg.content === 'Isolation Test Message For Channel 1') {
        ch1ReceivedMsg = true;
      }
    });

    clientCh2.on('new_message', (msg) => {
      if (msg.content === 'Isolation Test Message For Channel 1') {
        ch2ReceivedMsg = true;
      }
    });

    clientCh1.on('user_typing', (data) => {
      if (data.channelId == 1) {
        typingReceivedOnCh1 = true;
      }
    });

    clientCh2.on('user_typing', (data) => {
      if (data.channelId == 1) {
        typingReceivedOnCh2 = true;
      }
    });

    async function triggerTestIfReady() {
      if (ch1Ready && ch2Ready) {
        const sender = io(BASE_URL, { timeout: 3000 });
        sender.on('connect', async () => {
          sender.emit('join_channel', 1);
          setTimeout(() => {
            sender.emit('typing_start', { channelId: 1, username: 'SenderUser' });
          }, 300);

          setTimeout(async () => {
            try {
              await fetch(`${BASE_URL}/api/v1/channels/1/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: 'Isolation Test Message For Channel 1' })
              });
            } catch (e) {
              console.error('Error posting isolation test message:', e);
            }
          }, 600);

          setTimeout(() => {
            sender.disconnect();
            clearTimeout(timeout);
            recordTest('6.1 Socket.io cross-channel isolation check', ch1ReceivedMsg && !ch2ReceivedMsg, {
              extra: `ch1Msg=${ch1ReceivedMsg}, ch2Msg(leakage)=${ch2ReceivedMsg}`
            });
            recordTest('6.2 Socket.io typing indicator channel scoping', typingReceivedOnCh1 && !typingReceivedOnCh2, {
              extra: `ch1Typing=${typingReceivedOnCh1}, ch2Typing(leakage)=${typingReceivedOnCh2}`
            });
            cleanup();
          }, 2000);
        });
      }
    }
  });

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`EMPIRICAL CHALLENGE SUITE SUMMARY:`);
  console.log(`Total Tests Run: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Findings Documented: ${results.findings.length}`);
  console.log('================================================================\n');

  return results;
}

run().catch(err => {
  console.error('Fatal error running challenge suite:', err);
  process.exit(1);
});
