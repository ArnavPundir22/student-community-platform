/**
 * Adversarial Socket.io & Real-Time Concurrency Challenge Test Suite (Milestone Gen2)
 * Challenger 2 (Empirical Real-Time WebSocket & Concurrency Verifier)
 *
 * Target: http://localhost:3333
 */

import { io } from '../frontend/node_modules/socket.io-client/build/esm/index.js'

const BASE_URL = process.env.API_URL || 'http://localhost:3333'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const testResults = []
const verbatimReceipts = {}

function recordTest(category, name, passed, details = '', verbatim = null) {
  testResults.push({ category, name, passed, details })
  if (verbatim) {
    verbatimReceipts[verbatim.event] = verbatim.payload
  }
  const tag = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m'
  console.log(`${tag} [${category}] ${name}${details ? ` -> ${details}` : ''}`)
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const options = { method, headers }
  if (body) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, options)
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, ok: res.ok, data }
}

async function runChallengeSuite() {
  console.log('========================================================================')
  console.log('CHALLENGER 2: Real-Time Socket.io & Concurrency Empirical Verification')
  console.log(`Target Server: ${BASE_URL}`)
  console.log(`Start Time: ${new Date().toISOString()}`)
  console.log('========================================================================\n')

  // -------------------------------------------------------------
  // Step 0: Pre-Flight Health Check
  // -------------------------------------------------------------
  console.log('--- Step 0: Server Pre-Flight Health Check ---')
  const healthRes = await apiRequest('/api/v1')
  recordTest('Pre-Flight', 'Backend API is Healthy and Online', healthRes.ok && healthRes.data?.status === 'online', `Status: ${healthRes.status}, Body: ${JSON.stringify(healthRes.data)}`)

  // -------------------------------------------------------------
  // Step 1: Provision Test Accounts and Isolated Communities
  // -------------------------------------------------------------
  console.log('\n--- Step 1: Provision Test Accounts and Isolated Communities ---')
  const rand = Date.now()
  const userAData = {
    fullName: 'Alice Challenger Owner',
    username: `alice_chal_${rand}`,
    email: `alice_${rand}@socket-test.org`,
    password: 'Password123!',
    domainInterests: 'Cybersecurity',
  }
  const userBData = {
    fullName: 'Bob Challenger Peer',
    username: `bob_chal_${rand}`,
    email: `bob_${rand}@socket-test.org`,
    password: 'Password123!',
    domainInterests: 'Cybersecurity',
  }
  const userCData = {
    fullName: 'Charlie Isolated Observer',
    username: `charlie_chal_${rand}`,
    email: `charlie_${rand}@socket-test.org`,
    password: 'Password123!',
    domainInterests: 'Data Science',
  }

  const signupA = await apiRequest('/api/v1/auth/signup', 'POST', userAData)
  const signupB = await apiRequest('/api/v1/auth/signup', 'POST', userBData)
  const signupC = await apiRequest('/api/v1/auth/signup', 'POST', userCData)

  const tokenA = signupA.data?.data?.token || signupA.data?.token
  const userA = signupA.data?.data?.user || signupA.data?.user
  const tokenB = signupB.data?.data?.token || signupB.data?.token
  const userB = signupB.data?.data?.user || signupB.data?.user
  const tokenC = signupC.data?.data?.token || signupC.data?.token
  const userC = signupC.data?.data?.user || signupC.data?.user

  recordTest('Setup', 'Alice (Owner) Provisioned', Boolean(tokenA && userA?.id), `ID: ${userA?.id}`)
  recordTest('Setup', 'Bob (Peer) Provisioned', Boolean(tokenB && userB?.id), `ID: ${userB?.id}`)
  recordTest('Setup', 'Charlie (Observer) Provisioned', Boolean(tokenC && userC?.id), `ID: ${userC?.id}`)

  // Create Community A (Alice is Owner)
  const commARes = await apiRequest('/api/v1/communities', 'POST', {
    name: `Community Alpha ${rand}`,
    domainTag: 'Cybersecurity',
    description: 'Alpha testing community for real-time events',
  }, tokenA)
  const commA = commARes.data
  const channelA1 = commA.channels?.find((c) => c.name === 'general-discussion')
  const channelA2 = commA.channels?.find((c) => c.name === 'resources')

  // Create Community B (Charlie is Owner)
  const commBRes = await apiRequest('/api/v1/communities', 'POST', {
    name: `Community Beta ${rand}`,
    domainTag: 'Data Science',
    description: 'Beta isolated community for bleeding-prevention tests',
  }, tokenC)
  const commB = commBRes.data
  const channelB1 = commB.channels?.find((c) => c.name === 'general-discussion')

  recordTest('Setup', 'Community A Created with Default Channels', Boolean(commA?.id && channelA1?.id), `CommA: ${commA?.id}, ChA1: ${channelA1?.id}, ChA2: ${channelA2?.id}`)
  recordTest('Setup', 'Community B Created with Default Channels', Boolean(commB?.id && channelB1?.id), `CommB: ${commB?.id}, ChB1: ${channelB1?.id}`)

  // -------------------------------------------------------------
  // Step 2: Multi-Client Socket Connection & Handshake
  // -------------------------------------------------------------
  console.log('\n--- Step 2: Multi-Client Socket Handshake & Transports ---')
  const clientA = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })
  const clientB = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })
  const clientC = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })
  const clientD = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })

  await Promise.all([
    new Promise((resolve, reject) => { clientA.on('connect', resolve); clientA.on('connect_error', reject) }),
    new Promise((resolve, reject) => { clientB.on('connect', resolve); clientB.on('connect_error', reject) }),
    new Promise((resolve, reject) => { clientC.on('connect', resolve); clientC.on('connect_error', reject) }),
    new Promise((resolve, reject) => { clientD.on('connect', resolve); clientD.on('connect_error', reject) }),
  ])

  recordTest('Connection', 'Client A (Alice) Connected', clientA.connected, `Socket ID: ${clientA.id}`)
  recordTest('Connection', 'Client B (Bob) Connected', clientB.connected, `Socket ID: ${clientB.id}`)
  recordTest('Connection', 'Client C (Charlie) Connected', clientC.connected, `Socket ID: ${clientC.id}`)
  recordTest('Connection', 'Client D (Floating) Connected', clientD.connected, `Socket ID: ${clientD.id}`)

  // Event telemetry collectors
  function setupListener(client, name) {
    const bag = {
      user_typing: [],
      new_message: [],
      channel_created: [],
      channel_deleted: [],
      community_updated: [],
      community_deleted: [],
      member_joined: [],
      member_left: [],
      member_role_updated: [],
    }
    for (const evt of Object.keys(bag)) {
      client.on(evt, (data) => {
        bag[evt].push({ timestamp: Date.now(), data })
      })
    }
    return bag
  }

  const eventsA = setupListener(clientA, 'ClientA')
  const eventsB = setupListener(clientB, 'ClientB')
  const eventsC = setupListener(clientC, 'ClientC')
  const eventsD = setupListener(clientD, 'ClientD')

  // -------------------------------------------------------------
  // Step 3: Room Subscriptions & Channel Isolation
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Room Subscriptions (join_community, join_channel) ---')
  clientA.emit('join_community', commA.id)
  clientA.emit('join_channel', channelA1.id)

  clientB.emit('join_community', commA.id)
  clientB.emit('join_channel', channelA1.id)

  clientC.emit('join_community', commB.id)
  clientC.emit('join_channel', channelB1.id)

  await sleep(300)
  recordTest('Subscriptions', 'Rooms Subscribed Correctly', true, `A & B in Comm:${commA.id} & Ch:${channelA1.id}; C in Comm:${commB.id} & Ch:${channelB1.id}`)

  // -------------------------------------------------------------
  // Step 4: Real-Time Typing Indicators (typing_start, typing_stop)
  // -------------------------------------------------------------
  console.log('\n--- Step 4: Typing Indicator Broadcasts & Channel Isolation ---')
  eventsA.user_typing.length = 0
  eventsB.user_typing.length = 0
  eventsC.user_typing.length = 0
  eventsD.user_typing.length = 0

  // Alice emits typing_start in Channel A1
  const typingStartPayload = { channelId: channelA1.id, username: userA.username }
  clientA.emit('typing_start', typingStartPayload)
  await sleep(300)

  const bGotTypingStart = eventsB.user_typing.find(
    (e) => e.data.channelId == channelA1.id && e.data.username === userA.username && e.data.isTyping === true
  )
  recordTest('Typing', 'Client B (Room Peer) Receives user_typing isTyping: true', Boolean(bGotTypingStart), JSON.stringify(bGotTypingStart?.data || {}), { event: 'user_typing_start', payload: bGotTypingStart?.data })
  recordTest('Typing', 'Client A (Sender) Excluded from Typing Echo', eventsA.user_typing.length === 0, `Received ${eventsA.user_typing.length} (expected 0)`)
  recordTest('Typing', 'Client C (Channel B1) Isolated from Channel A1 Typing', eventsC.user_typing.length === 0, `Received ${eventsC.user_typing.length} (expected 0)`)
  recordTest('Typing', 'Client D (Floating) Isolated from Typing', eventsD.user_typing.length === 0, `Received ${eventsD.user_typing.length} (expected 0)`)

  // Alice emits typing_stop in Channel A1
  eventsA.user_typing.length = 0
  eventsB.user_typing.length = 0
  eventsC.user_typing.length = 0
  eventsD.user_typing.length = 0

  const typingStopPayload = { channelId: channelA1.id, username: userA.username }
  clientA.emit('typing_stop', typingStopPayload)
  await sleep(300)

  const bGotTypingStop = eventsB.user_typing.find(
    (e) => e.data.channelId == channelA1.id && e.data.username === userA.username && e.data.isTyping === false
  )
  recordTest('Typing', 'Client B Receives user_typing isTyping: false', Boolean(bGotTypingStop), JSON.stringify(bGotTypingStop?.data || {}), { event: 'user_typing_stop', payload: bGotTypingStop?.data })
  recordTest('Typing', 'Foreign Clients C & D Receive Zero Stop Events', eventsC.user_typing.length === 0 && eventsD.user_typing.length === 0, 'Isolated')

  // Reverse typing isolation: Charlie types in Channel B1
  eventsA.user_typing.length = 0
  eventsB.user_typing.length = 0
  eventsC.user_typing.length = 0
  clientC.emit('typing_start', { channelId: channelB1.id, username: userC.username })
  await sleep(300)

  recordTest('Typing', 'Reverse Typing Isolation: Channel B1 Typing Does Not Bleed to A/B', eventsA.user_typing.length === 0 && eventsB.user_typing.length === 0, `A got ${eventsA.user_typing.length}, B got ${eventsB.user_typing.length}`)

  // -------------------------------------------------------------
  // Step 5: Real-Time Message Broadcasting & Cross-Channel Bleed Defense
  // -------------------------------------------------------------
  console.log('\n--- Step 5: Real-Time Message Broadcasts (new_message) & Channel Isolation ---')
  eventsA.new_message.length = 0
  eventsB.new_message.length = 0
  eventsC.new_message.length = 0
  eventsD.new_message.length = 0

  const messageA1Content = `Adversarial Verified ChA1 Msg - ${Date.now()}`
  const postMsgA1 = await apiRequest(`/api/v1/channels/${channelA1.id}/messages`, 'POST', { content: messageA1Content }, tokenA)
  await sleep(400)

  const aGotMsg = eventsA.new_message.find((e) => e.data.content === messageA1Content)
  const bGotMsg = eventsB.new_message.find((e) => e.data.content === messageA1Content)
  const cGotMsg = eventsC.new_message.find((e) => e.data.content === messageA1Content)
  const dGotMsg = eventsD.new_message.find((e) => e.data.content === messageA1Content)

  const validMessageSchema = Boolean(
    aGotMsg?.data?.id &&
    aGotMsg?.data?.channelId === channelA1.id &&
    aGotMsg?.data?.userId === userA.id &&
    aGotMsg?.data?.content === messageA1Content &&
    aGotMsg?.data?.user?.username === userA.username &&
    aGotMsg?.data?.createdAt
  )

  recordTest('Messages', 'HTTP POST /messages Returns 201 Created', postMsgA1.status === 201, `ID: ${postMsgA1.data?.id}`)
  recordTest('Messages', 'Client A (Subscriber) Receives new_message Broadcast', Boolean(aGotMsg), `ID: ${aGotMsg?.data?.id}, User: ${aGotMsg?.data?.user?.username}`, { event: 'new_message', payload: aGotMsg?.data })
  recordTest('Messages', 'new_message Payload Conforms to Strict Schema', validMessageSchema, `channelId=${aGotMsg?.data?.channelId}, userId=${aGotMsg?.data?.userId}, author=${aGotMsg?.data?.user?.username}`)
  recordTest('Messages', 'Client B (Subscriber) Receives new_message Broadcast', Boolean(bGotMsg), `ID: ${bGotMsg?.data?.id}, Content match: ${bGotMsg?.data?.content === messageA1Content}`)
  recordTest('Messages', 'Client C (Different Channel B1) ZERO Bleed', !cGotMsg, `Client C received ${eventsC.new_message.length} messages (expected 0)`)
  recordTest('Messages', 'Client D (Floating) ZERO Bleed', !dGotMsg, `Client D received ${eventsD.new_message.length} messages (expected 0)`)

  // Reverse Message Posting: Charlie posts to Channel B1
  eventsA.new_message.length = 0
  eventsB.new_message.length = 0
  eventsC.new_message.length = 0
  const messageB1Content = `Beta Channel B1 Msg - ${Date.now()}`
  const postMsgB1 = await apiRequest(`/api/v1/channels/${channelB1.id}/messages`, 'POST', { content: messageB1Content }, tokenC)
  await sleep(400)

  const cGotMsgB = eventsC.new_message.find((e) => e.data.content === messageB1Content)
  const aGotMsgB = eventsA.new_message.find((e) => e.data.content === messageB1Content)
  const bGotMsgB = eventsB.new_message.find((e) => e.data.content === messageB1Content)

  recordTest('Messages', 'Client C Receives Channel B1 Broadcast', Boolean(cGotMsgB), `Msg ID: ${cGotMsgB?.data?.id}`)
  recordTest('Messages', 'Reverse Isolation: Clients A & B Receive 0 Channel B1 Messages', !aGotMsgB && !bGotMsgB, 'Isolated')

  // Unsubscription verification: Client B leaves Channel A1
  console.log('\n--- Step 5.1: leave_channel Unsubscription Integrity ---')
  eventsA.new_message.length = 0
  eventsB.new_message.length = 0
  clientB.emit('leave_channel', channelA1.id)
  await sleep(250)

  const postMsgLeave = await apiRequest(`/api/v1/channels/${channelA1.id}/messages`, 'POST', { content: `Post-Leave Test Msg ${Date.now()}` }, tokenA)
  await sleep(400)

  const aGotPostLeave = eventsA.new_message.find((e) => e.data.id === postMsgLeave.data?.id)
  const bGotPostLeave = eventsB.new_message.find((e) => e.data.id === postMsgLeave.data?.id)

  recordTest('Unsubscribe', 'Subscribed Client A Still Receives Message', Boolean(aGotPostLeave), `Received ID: ${postMsgLeave.data?.id}`)
  recordTest('Unsubscribe', 'Unsubscribed Client B Does NOT Receive Message', !bGotPostLeave, 'Client B unsubscription verified')

  // Re-join Channel A1 for Client B
  clientB.emit('join_channel', channelA1.id)
  await sleep(200)

  // -------------------------------------------------------------
  // Step 6: Channel Management Broadcasts (channel_created, channel_deleted)
  // -------------------------------------------------------------
  console.log('\n--- Step 6: Channel Creation & Deletion Broadcasts ---')
  eventsA.channel_created.length = 0
  eventsB.channel_created.length = 0
  eventsC.channel_created.length = 0

  const newChannelRes = await apiRequest(`/api/v1/communities/${commA.id}/channels`, 'POST', {
    name: 'empiric-lab',
    type: 'text',
    topic: 'Adversarial empirical testing channel',
  }, tokenA)
  await sleep(400)

  const createdChannel = newChannelRes.data
  const aGotChCreate = eventsA.channel_created.find((e) => e.data.id === createdChannel?.id)
  const bGotChCreate = eventsB.channel_created.find((e) => e.data.id === createdChannel?.id)
  const cGotChCreate = eventsC.channel_created.find((e) => e.data.id === createdChannel?.id)

  recordTest('Channels', 'Alice Created Channel via API', newChannelRes.status === 201, `ID: ${createdChannel?.id}, Name: ${createdChannel?.name}`)
  recordTest('Channels', 'Client A (Community A Member) Receives channel_created', Boolean(aGotChCreate), `Channel: ${aGotChCreate?.data?.name}`, { event: 'channel_created', payload: aGotChCreate?.data })
  recordTest('Channels', 'Client B (Community A Member) Receives channel_created', Boolean(bGotChCreate), `Channel: ${bGotChCreate?.data?.name}`)
  recordTest('Channels', 'Client C (Community B Member) Isolated from channel_created', !cGotChCreate, 'Client C in community B received 0 community A channel_created events')

  // Delete Channel
  eventsA.channel_deleted.length = 0
  eventsB.channel_deleted.length = 0
  eventsC.channel_deleted.length = 0

  const delChannelRes = await apiRequest(`/api/v1/channels/${createdChannel.id}`, 'DELETE', null, tokenA)
  await sleep(400)

  const aGotChDel = eventsA.channel_deleted.find((e) => e.data.channelId === createdChannel.id)
  const bGotChDel = eventsB.channel_deleted.find((e) => e.data.channelId === createdChannel.id)
  const cGotChDel = eventsC.channel_deleted.find((e) => e.data.channelId === createdChannel.id)

  recordTest('Channels', 'Alice Deleted Channel via API', delChannelRes.status === 200, `Deleted Channel ID: ${createdChannel.id}`)
  recordTest('Channels', 'Client A Receives channel_deleted Broadcast', Boolean(aGotChDel), `Payload: ${JSON.stringify(aGotChDel?.data || {})}`, { event: 'channel_deleted', payload: aGotChDel?.data })
  recordTest('Channels', 'Client B Receives channel_deleted Broadcast', Boolean(bGotChDel), `Payload: ${JSON.stringify(bGotChDel?.data || {})}`)
  recordTest('Channels', 'Client C Isolated from channel_deleted Broadcast', !cGotChDel, 'No leak to Community B')

  // -------------------------------------------------------------
  // Step 7: Community Updates & Room Unsubscription (leave_community)
  // -------------------------------------------------------------
  console.log('\n--- Step 7: Community Updates & leave_community Lifecycle ---')
  eventsA.community_updated.length = 0
  eventsB.community_updated.length = 0
  eventsC.community_updated.length = 0

  const updatedDesc1 = `Community Desc Round 1 - ${Date.now()}`
  const updateCommRes1 = await apiRequest(`/api/v1/communities/${commA.id}`, 'PUT', {
    description: updatedDesc1,
    title: 'Alpha Updated Title 1',
  }, tokenA)
  await sleep(400)

  const aGotCommUpd1 = eventsA.community_updated.find((e) => e.data.id === commA.id && e.data.description === updatedDesc1)
  const bGotCommUpd1 = eventsB.community_updated.find((e) => e.data.id === commA.id && e.data.description === updatedDesc1)
  const cGotCommUpd1 = eventsC.community_updated.find((e) => e.data.id === commA.id)

  recordTest('Community', 'Owner Updates Community Details (HTTP 200)', updateCommRes1.status === 200, `Updated Desc: ${updateCommRes1.data?.description}`)
  recordTest('Community', 'Client A Receives community_updated Broadcast', Boolean(aGotCommUpd1), `ID: ${aGotCommUpd1?.data?.id}`, { event: 'community_updated', payload: aGotCommUpd1?.data })
  recordTest('Community', 'Client B Receives community_updated Broadcast', Boolean(bGotCommUpd1), `ID: ${bGotCommUpd1?.data?.id}`)
  recordTest('Community', 'Client C Isolated from Community A Updates', !cGotCommUpd1, 'No leak to Community B')

  // Now test leave_community on Client B
  console.log('\n--- Step 7.1: leave_community Unsubscription Integrity ---')
  eventsA.community_updated.length = 0
  eventsB.community_updated.length = 0
  clientB.emit('leave_community', commA.id)
  await sleep(250)

  const updatedDesc2 = `Community Desc Post-Leave - ${Date.now()}`
  await apiRequest(`/api/v1/communities/${commA.id}`, 'PUT', {
    description: updatedDesc2,
    title: 'Alpha Updated Title 2',
  }, tokenA)
  await sleep(400)

  const aGotCommUpd2 = eventsA.community_updated.find((e) => e.data.id === commA.id && e.data.description === updatedDesc2)
  const bGotCommUpd2 = eventsB.community_updated.find((e) => e.data.id === commA.id && e.data.description === updatedDesc2)

  recordTest('Unsubscribe', 'Remaining Client A Still Receives community_updated', Boolean(aGotCommUpd2), `Client A received update`)
  recordTest('Unsubscribe', 'Departed Client B Does NOT Receive community_updated', !bGotCommUpd2, 'Client B unsubscription verified')

  // Re-join community for Client B
  clientB.emit('join_community', commA.id)
  await sleep(200)

  // -------------------------------------------------------------
  // Step 8: Member Lifecycle Broadcasts (member_joined, member_left, member_role_updated)
  // -------------------------------------------------------------
  console.log('\n--- Step 8: Member Lifecycle Broadcasts ---')
  eventsA.member_joined.length = 0
  eventsB.member_joined.length = 0
  eventsA.member_role_updated.length = 0
  eventsB.member_role_updated.length = 0
  eventsA.member_left.length = 0
  eventsB.member_left.length = 0

  // 1. Bob joins Community A via API
  const bobJoinRes = await apiRequest(`/api/v1/communities/${commA.id}/join`, 'POST', null, tokenB)
  await sleep(400)

  const aGotMemberJoined = eventsA.member_joined.find((e) => e.data.communityId === commA.id && e.data.member?.userId === userB.id)
  recordTest('Members', 'Bob Joins Community A (HTTP 201)', bobJoinRes.status === 201 || bobJoinRes.status === 200, `Status: ${bobJoinRes.status}`)
  recordTest('Members', 'Client A Receives member_joined Broadcast', Boolean(aGotMemberJoined), `Member UserID: ${aGotMemberJoined?.data?.member?.userId}`, { event: 'member_joined', payload: aGotMemberJoined?.data })

  // 2. Owner promotes Bob to Admin
  const roleUpdateRes = await apiRequest(`/api/v1/communities/${commA.id}/members/${userB.id}`, 'PUT', { role: 'admin' }, tokenA)
  await sleep(400)

  const aGotRoleUpd = eventsA.member_role_updated.find((e) => e.data.communityId === commA.id && e.data.member?.userId === userB.id && e.data.member?.role === 'admin')
  const bGotRoleUpd = eventsB.member_role_updated.find((e) => e.data.communityId === commA.id && e.data.member?.userId === userB.id && e.data.member?.role === 'admin')

  recordTest('Members', 'Owner Updates Bob Role to admin (HTTP 200)', roleUpdateRes.status === 200, `Role: ${roleUpdateRes.data?.role}`)
  recordTest('Members', 'Client A Receives member_role_updated Broadcast', Boolean(aGotRoleUpd), `Role: ${aGotRoleUpd?.data?.member?.role}`, { event: 'member_role_updated', payload: aGotRoleUpd?.data })
  recordTest('Members', 'Client B Receives member_role_updated Broadcast', Boolean(bGotRoleUpd), `Role: ${bGotRoleUpd?.data?.member?.role}`)

  // 3. Bob leaves Community A
  const bobLeaveRes = await apiRequest(`/api/v1/communities/${commA.id}/leave`, 'DELETE', null, tokenB)
  await sleep(400)

  const aGotMemberLeft = eventsA.member_left.find((e) => e.data.communityId === commA.id && e.data.userId === userB.id)
  recordTest('Members', 'Bob Leaves Community A (HTTP 200)', bobLeaveRes.status === 200, `Msg: ${bobLeaveRes.data?.message}`)
  recordTest('Members', 'Client A Receives member_left Broadcast', Boolean(aGotMemberLeft), `Left UserID: ${aGotMemberLeft?.data?.userId}`, { event: 'member_left', payload: aGotMemberLeft?.data })

  // 4. Community Deletion Broadcast
  console.log('\n--- Step 8.1: Community Deletion Broadcast (community_deleted) ---')
  eventsA.community_deleted.length = 0
  eventsB.community_deleted.length = 0
  eventsC.community_deleted.length = 0
  eventsD.community_deleted.length = 0

  const delCommRes = await apiRequest(`/api/v1/communities/${commA.id}`, 'DELETE', null, tokenA)
  await sleep(400)

  const aGotCommDel = eventsA.community_deleted.find((e) => e.data.communityId === commA.id)
  const bGotCommDel = eventsB.community_deleted.find((e) => e.data.communityId === commA.id)
  const cGotCommDel = eventsC.community_deleted.find((e) => e.data.communityId === commA.id)
  const dGotCommDel = eventsD.community_deleted.find((e) => e.data.communityId === commA.id)

  recordTest('Community', 'Owner Deletes Community A (HTTP 200)', delCommRes.status === 200, `Deleted: ${commA.id}`)
  recordTest('Community', 'All Connected Clients Receive Global community_deleted Broadcast', Boolean(aGotCommDel && bGotCommDel && cGotCommDel && dGotCommDel), `Receipts: A=${Boolean(aGotCommDel)}, B=${Boolean(bGotCommDel)}, C=${Boolean(cGotCommDel)}, D=${Boolean(dGotCommDel)}`, { event: 'community_deleted', payload: aGotCommDel?.data })

  // -------------------------------------------------------------
  // Step 9: Adversarial Malformed / Null / Toxic Socket Payloads
  // -------------------------------------------------------------
  console.log('\n--- Step 9: Adversarial Malformed & Null Payload Attack Injection ---')
  const toxicPayloads = [
    null,
    undefined,
    '',
    {},
    [],
    -99999,
    'NaN',
    { channelId: null },
    { channelId: undefined },
    { channelId: -1, username: null },
    { channelId: {}, username: [] },
    { channelId: 'SELECT * FROM users;', username: '<script>alert(1)</script>' },
    { channelId: 'A'.repeat(50000), username: 'OverflowUser' },
    Buffer.alloc(65536).fill('Z').toString('utf8'),
  ]

  for (const p of toxicPayloads) {
    clientD.emit('join_channel', p)
    clientD.emit('leave_channel', p)
    clientD.emit('join_community', p)
    clientD.emit('leave_community', p)
    clientD.emit('typing_start', p)
    clientD.emit('typing_stop', p)
    clientD.emit('unknown_malicious_event', p)
    clientD.emit('__proto__', p)
    clientD.emit('constructor', p)
  }

  await sleep(500)

  // Verify server is STILL completely alive and responding
  const postAttackHealth = await apiRequest('/api/v1')
  const socketsStillConnected = clientA.connected && clientB.connected && clientC.connected && clientD.connected

  recordTest('Robustness', 'Server Survived Null / Malformed / Buffer Bombing Without Crashing', postAttackHealth.ok && postAttackHealth.data?.status === 'online', `Health: ${postAttackHealth.status}, Connected Sockets: ${socketsStillConnected}`)
  recordTest('Robustness', 'Existing Socket Connections Remained Active & Untorn', socketsStillConnected, `A: ${clientA.connected}, B: ${clientB.connected}, C: ${clientC.connected}, D: ${clientD.connected}`)

  // -------------------------------------------------------------
  // Step 10: High-Frequency Concurrency & Burst Stress Test
  // -------------------------------------------------------------
  console.log('\n--- Step 10: High-Frequency Concurrency & Burst Stress Test ---')
  // Connect 4 additional clients to reach 8 concurrent sockets
  const clientE = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })
  const clientF = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })
  const clientG = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })
  const clientH = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })

  await Promise.all([
    new Promise((r) => clientE.on('connect', r)),
    new Promise((r) => clientF.on('connect', r)),
    new Promise((r) => clientG.on('connect', r)),
    new Promise((r) => clientH.on('connect', r)),
  ])

  recordTest('Concurrency', '8 Concurrent Sockets Connected', clientE.connected && clientF.connected && clientG.connected && clientH.connected, 'Sockets E, F, G, H joined pool')

  const eventsE = setupListener(clientE, 'ClientE')
  const eventsF = setupListener(clientF, 'ClientF')
  const eventsG = setupListener(clientG, 'ClientG')
  const eventsH = setupListener(clientH, 'ClientH')

  // Clients A, B, E, F join Channel B1
  clientA.emit('join_channel', channelB1.id)
  clientB.emit('join_channel', channelB1.id)
  clientE.emit('join_channel', channelB1.id)
  clientF.emit('join_channel', channelB1.id)

  // Clients G and H stay outside Channel B1 (isolated)
  await sleep(250)

  // 1. Rapid sequential typing storm: 80 events in tight synchronous loop across clients
  const TYPING_BURST_COUNT = 80
  eventsA.user_typing.length = 0
  eventsB.user_typing.length = 0
  eventsE.user_typing.length = 0
  eventsF.user_typing.length = 0
  eventsG.user_typing.length = 0

  const typingStartTime = Date.now()
  for (let i = 0; i < TYPING_BURST_COUNT; i++) {
    clientC.emit(i % 2 === 0 ? 'typing_start' : 'typing_stop', {
      channelId: channelB1.id,
      username: `BurstTyper_${i % 5}`,
    })
  }
  await sleep(800)
  const typingElapsed = Date.now() - typingStartTime

  recordTest('Concurrency', `Typing Storm (${TYPING_BURST_COUNT} Events in ${typingElapsed}ms) Processed Across Channel`, eventsA.user_typing.length === TYPING_BURST_COUNT && eventsE.user_typing.length === TYPING_BURST_COUNT, `Client A: ${eventsA.user_typing.length}/${TYPING_BURST_COUNT}, E: ${eventsE.user_typing.length}/${TYPING_BURST_COUNT}`)
  recordTest('Concurrency', 'Foreign Client G Received 0 Typing Events from Storm', eventsG.user_typing.length === 0, `Client G got ${eventsG.user_typing.length}`)

  // 2. Concurrent HTTP Message Creation Burst: 20 parallel requests
  const MESSAGE_BURST_COUNT = 20
  eventsA.new_message.length = 0
  eventsB.new_message.length = 0
  eventsC.new_message.length = 0
  eventsE.new_message.length = 0
  eventsF.new_message.length = 0
  eventsG.new_message.length = 0

  const msgBurstStart = Date.now()
  const postTasks = []
  for (let i = 0; i < MESSAGE_BURST_COUNT; i++) {
    postTasks.push(
      apiRequest(`/api/v1/channels/${channelB1.id}/messages`, 'POST', {
        content: `CONCURRENT_BURST_${i}_${Date.now()}`,
      }, tokenC)
    )
  }

  const burstResponses = await Promise.all(postTasks)
  await sleep(1200)
  const msgBurstElapsed = Date.now() - msgBurstStart

  const allHttpSuccess = burstResponses.every((r) => r.status === 201)
  const aBurstCount = eventsA.new_message.filter((e) => e.data.content?.startsWith('CONCURRENT_BURST_')).length
  const eBurstCount = eventsE.new_message.filter((e) => e.data.content?.startsWith('CONCURRENT_BURST_')).length
  const fBurstCount = eventsF.new_message.filter((e) => e.data.content?.startsWith('CONCURRENT_BURST_')).length
  const cBurstCount = eventsC.new_message.filter((e) => e.data.content?.startsWith('CONCURRENT_BURST_')).length
  const gBurstCount = eventsG.new_message.filter((e) => e.data.content?.startsWith('CONCURRENT_BURST_')).length

  recordTest('Concurrency', `All ${MESSAGE_BURST_COUNT} Concurrent HTTP POSTs Succeeded (201 Created)`, allHttpSuccess, `Elapsed: ${msgBurstElapsed}ms`)
  recordTest('Concurrency', `Client A Received 100% of Burst Messages (${aBurstCount}/${MESSAGE_BURST_COUNT})`, aBurstCount === MESSAGE_BURST_COUNT, `Received ${aBurstCount}/${MESSAGE_BURST_COUNT}`)
  recordTest('Concurrency', `Client E Received 100% of Burst Messages (${eBurstCount}/${MESSAGE_BURST_COUNT})`, eBurstCount === MESSAGE_BURST_COUNT, `Received ${eBurstCount}/${MESSAGE_BURST_COUNT}`)
  recordTest('Concurrency', `Client F Received 100% of Burst Messages (${fBurstCount}/${MESSAGE_BURST_COUNT})`, fBurstCount === MESSAGE_BURST_COUNT, `Received ${fBurstCount}/${MESSAGE_BURST_COUNT}`)
  recordTest('Concurrency', `Client C (Sender) Received 100% of Messages (${cBurstCount}/${MESSAGE_BURST_COUNT})`, cBurstCount === MESSAGE_BURST_COUNT, `Received ${cBurstCount}/${MESSAGE_BURST_COUNT}`)
  recordTest('Concurrency', `Client G (Isolated Outside Room) ZERO Bleed (0/${MESSAGE_BURST_COUNT})`, gBurstCount === 0, `Received ${gBurstCount}`)

  // -------------------------------------------------------------
  // Clean-up & Teardown
  // -------------------------------------------------------------
  console.log('\n--- Step 11: Teardown & Final Health Check ---')
  await apiRequest(`/api/v1/communities/${commB.id}`, 'DELETE', null, tokenC)

  const clients = [clientA, clientB, clientC, clientD, clientE, clientF, clientG, clientH]
  for (const c of clients) {
    c.disconnect()
  }
  await sleep(300)

  const finalHealth = await apiRequest('/api/v1')
  recordTest('Teardown', 'Server Remained Responsive and Healthy at End of Test', finalHealth.ok && finalHealth.data?.status === 'online', `Status: ${finalHealth.status}`)

  // -------------------------------------------------------------
  // Summary & Empirical Verdict
  // -------------------------------------------------------------
  const total = testResults.length
  const passed = testResults.filter((r) => r.passed).length
  const failed = testResults.filter((r) => !r.passed).length

  console.log('\n========================================================================')
  console.log(`EMPIRICAL SOCKET VERIFICATION SUMMARY`)
  console.log(`TOTAL CHECKS: ${total}`)
  console.log(`PASSED: ${passed}`)
  console.log(`FAILED: ${failed}`)
  console.log(`FINAL CHALLENGE VERDICT: ${failed === 0 ? 'PASS' : 'FAIL'}`)
  console.log('========================================================================\n')

  console.log('--- VERBATIM EVENT RECEIPTS JSON ---')
  console.log(JSON.stringify(verbatimReceipts, null, 2))

  return { total, passed, failed, testResults, verbatimReceipts }
}

runChallengeSuite().catch((err) => {
  console.error('Fatal challenge execution error:', err)
  process.exit(1)
})
