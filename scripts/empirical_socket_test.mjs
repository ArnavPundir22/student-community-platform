/**
 * Comprehensive Empirical Socket.io & Real-Time Concurrency Verification Suite
 * Milestone R1 Challenger 2
 *
 * Verifies:
 * - Duplex Socket.io connectivity to http://localhost:3333
 * - Client A & Client B in channel:1, Client C in channel:2
 * - typing_start / typing_stop propagation to room members & room isolation from foreign channels
 * - Sender exclusion (no echo of own typing event)
 * - new_message broadcast to room members & isolation from foreign channels
 * - Reverse room isolation (channel:2 messages/typing do not leak into channel:1)
 * - leave_channel unsubscription (stops message and typing delivery)
 * - Dynamic rejoin and channel migration
 * - String vs Number channel identifier interoperability
 * - High-concurrency message bursts and rapid typing events across concurrent clients
 * - Large payload transmission integrity
 */

import { io } from '../frontend/node_modules/socket.io-client/build/esm/index.js'

const BASE_URL = process.env.API_URL || 'http://localhost:3333'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function postMessage(channelId, content) {
  const res = await fetch(`${BASE_URL}/api/v1/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Failed to post message to channel ${channelId}: ${res.status} ${errText}`)
  }
  return res.json()
}

const testResults = []
function recordTest(category, name, passed, details = '') {
  testResults.push({ category, name, passed, details })
  const tag = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m'
  console.log(`${tag} [${category}] ${name}${details ? ` -> ${details}` : ''}`)
}

async function runEmpiricalSuite() {
  console.log('========================================================================')
  console.log('Milestone R1 Empirical WebSocket & Concurrency Verification Test Suite')
  console.log(`Target Gateway: ${BASE_URL}`)
  console.log(`Execution Time: ${new Date().toISOString()}`)
  console.log('========================================================================\n')

  // -------------------------------------------------------------
  // Test Section 1: Socket Handshake and Multi-Client Room Setup
  // -------------------------------------------------------------
  console.log('--- Section 1: Multi-Client Connection and Handshake ---')
  const clientA = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })
  const clientB = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })
  const clientC = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket', 'polling'] })

  await Promise.all([
    new Promise((resolve, reject) => {
      clientA.on('connect', resolve)
      clientA.on('connect_error', reject)
    }),
    new Promise((resolve, reject) => {
      clientB.on('connect', resolve)
      clientB.on('connect_error', reject)
    }),
    new Promise((resolve, reject) => {
      clientC.on('connect', resolve)
      clientC.on('connect_error', reject)
    }),
  ])

  recordTest('Connection', '3 Sockets Connected Successfully', true, `A: ${clientA.id}, B: ${clientB.id}, C: ${clientC.id}`)

  const eventsA = { user_typing: [], new_message: [] }
  const eventsB = { user_typing: [], new_message: [] }
  const eventsC = { user_typing: [], new_message: [] }

  clientA.on('user_typing', (data) => eventsA.user_typing.push(data))
  clientA.on('new_message', (data) => eventsA.new_message.push(data))

  clientB.on('user_typing', (data) => eventsB.user_typing.push(data))
  clientB.on('new_message', (data) => eventsB.new_message.push(data))

  clientC.on('user_typing', (data) => eventsC.user_typing.push(data))
  clientC.on('new_message', (data) => eventsC.new_message.push(data))

  // Room subscriptions
  clientA.emit('join_channel', 1)
  clientB.emit('join_channel', 1)
  clientC.emit('join_channel', 2)
  await sleep(250)

  recordTest('Rooms', 'Channel Subscription Setup', true, 'A in channel:1, B in channel:1, C in channel:2')

  // -------------------------------------------------------------
  // Test Section 2: Typing Event Delivery and Room Isolation
  // -------------------------------------------------------------
  console.log('\n--- Section 2: Typing Indicator Delivery and Isolation ---')
  eventsA.user_typing = []
  eventsB.user_typing = []
  eventsC.user_typing = []

  clientA.emit('typing_start', { channelId: 1, username: 'Alice_Student' })
  await sleep(300)

  const bTypingStart = eventsB.user_typing.find(
    (e) => e.channelId == 1 && e.username === 'Alice_Student' && e.isTyping === true
  )
  recordTest('Typing', 'Room Peer Receives typing_start', Boolean(bTypingStart), 'Client B received isTyping: true')
  recordTest('Typing', 'Foreign Room Isolated from typing_start', eventsC.user_typing.length === 0, `Client C received ${eventsC.user_typing.length} events (expected 0)`)
  recordTest('Typing', 'Sender Excluded from typing Echo', eventsA.user_typing.length === 0, `Client A received ${eventsA.user_typing.length} echo events (expected 0)`)

  // Typing stop
  eventsA.user_typing = []
  eventsB.user_typing = []
  eventsC.user_typing = []

  clientA.emit('typing_stop', { channelId: 1, username: 'Alice_Student' })
  await sleep(300)

  const bTypingStop = eventsB.user_typing.find(
    (e) => e.channelId == 1 && e.username === 'Alice_Student' && e.isTyping === false
  )
  recordTest('Typing', 'Room Peer Receives typing_stop', Boolean(bTypingStop), 'Client B received isTyping: false')
  recordTest('Typing', 'Foreign Room Isolated from typing_stop', eventsC.user_typing.length === 0, `Client C received 0 events`)

  // Reverse typing isolation: Client C types in channel 2
  eventsA.user_typing = []
  eventsB.user_typing = []
  eventsC.user_typing = []

  clientC.emit('typing_start', { channelId: 2, username: 'Charlie_Cyber' })
  await sleep(300)
  const aGotC = eventsA.user_typing.length > 0
  const bGotC = eventsB.user_typing.length > 0
  recordTest('Typing', 'Reverse Typing Isolation (Channel 2 -> Channel 1)', !aGotC && !bGotC, 'Clients A and B received 0 events from Channel 2')

  // -------------------------------------------------------------
  // Test Section 3: Real-Time Message Broadcast and Room Isolation
  // -------------------------------------------------------------
  console.log('\n--- Section 3: Message Broadcast and Room Isolation ---')
  eventsA.new_message = []
  eventsB.new_message = []
  eventsC.new_message = []

  const testContent1 = `Empirical Verification Msg Ch1 - ${Date.now()}`
  const posted1 = await postMessage(1, testContent1)
  await sleep(400)

  const aGotMsg1 = eventsA.new_message.find((m) => m.content === testContent1)
  const bGotMsg1 = eventsB.new_message.find((m) => m.content === testContent1)
  const cGotMsg1 = eventsC.new_message.find((m) => m.content === testContent1)

  recordTest('Messages', 'Client A Receives Channel 1 Message', Boolean(aGotMsg1), `Msg ID: ${posted1.id}`)
  recordTest('Messages', 'Client B Receives Channel 1 Message', Boolean(bGotMsg1), `Msg ID: ${posted1.id}`)
  recordTest('Messages', 'Client C Isolated from Channel 1 Message', !cGotMsg1, 'Client C in channel 2 received 0 channel 1 messages')

  // Reverse message: Post to channel 2
  eventsA.new_message = []
  eventsB.new_message = []
  eventsC.new_message = []

  const testContent2 = `Empirical Verification Msg Ch2 - ${Date.now()}`
  const posted2 = await postMessage(2, testContent2)
  await sleep(400)

  const aGotMsg2 = eventsA.new_message.find((m) => m.content === testContent2)
  const bGotMsg2 = eventsB.new_message.find((m) => m.content === testContent2)
  const cGotMsg2 = eventsC.new_message.find((m) => m.content === testContent2)

  recordTest('Messages', 'Client C Receives Channel 2 Message', Boolean(cGotMsg2), `Msg ID: ${posted2.id}`)
  recordTest('Messages', 'Clients A and B Isolated from Channel 2 Message', !aGotMsg2 && !bGotMsg2, 'Clients A & B received 0 channel 2 messages')

  // -------------------------------------------------------------
  // Test Section 4: leave_channel Unsubscription Verification
  // -------------------------------------------------------------
  console.log('\n--- Section 4: leave_channel Unsubscription Verification ---')
  eventsA.new_message = []
  eventsB.new_message = []
  eventsC.new_message = []
  eventsA.user_typing = []
  eventsB.user_typing = []

  console.log('Client B unsubscribing via leave_channel(1)...')
  clientB.emit('leave_channel', 1)
  await sleep(250)

  const postLeaveContent = `Post-Leave Channel 1 Msg - ${Date.now()}`
  await postMessage(1, postLeaveContent)
  await sleep(400)

  const aGotPostLeave = eventsA.new_message.find((m) => m.content === postLeaveContent)
  const bGotPostLeave = eventsB.new_message.find((m) => m.content === postLeaveContent)

  recordTest('Unsubscribe', 'Remaining Client A Still Receives Message', Boolean(aGotPostLeave), 'Client A received post-leave message')
  recordTest('Unsubscribe', 'Departed Client B Does NOT Receive Message', !bGotPostLeave, 'Client B was successfully unsubscribed')

  // Verify typing is also blocked for departed client
  clientA.emit('typing_start', { channelId: 1, username: 'Alice_Student' })
  await sleep(300)
  recordTest('Unsubscribe', 'Departed Client B Does NOT Receive Typing', eventsB.user_typing.length === 0, 'Client B received 0 typing events')

  // -------------------------------------------------------------
  // Test Section 5: Channel Migration / Dynamic Rejoin
  // -------------------------------------------------------------
  console.log('\n--- Section 5: Channel Migration (Client B joins channel 2) ---')
  clientB.emit('join_channel', 2)
  await sleep(250)

  eventsA.new_message = []
  eventsB.new_message = []
  eventsC.new_message = []

  const ch2MigrateContent = `Channel 2 Migration Broadcast - ${Date.now()}`
  await postMessage(2, ch2MigrateContent)
  await sleep(400)

  const bGotMigrate = eventsB.new_message.find((m) => m.content === ch2MigrateContent)
  const cGotMigrate = eventsC.new_message.find((m) => m.content === ch2MigrateContent)
  const aGotMigrate = eventsA.new_message.find((m) => m.content === ch2MigrateContent)

  recordTest('Migration', 'Migrated Client B Receives Channel 2 Broadcast', Boolean(bGotMigrate), 'Client B received message')
  recordTest('Migration', 'Existing Client C Receives Channel 2 Broadcast', Boolean(cGotMigrate), 'Client C received message')
  recordTest('Migration', 'Client A Remains Isolated in Channel 1', !aGotMigrate, 'Client A received 0 channel 2 messages')

  // -------------------------------------------------------------
  // Test Section 6: String vs Number Channel ID Interoperability
  // -------------------------------------------------------------
  console.log('\n--- Section 6: Type Agnostic Channel Identifiers (String "2" vs Number 2) ---')
  eventsA.new_message = []
  clientA.emit('leave_channel', 1)
  clientA.emit('join_channel', '2') // pass as string
  await sleep(250)

  const typeTestContent = `Type Agnostic Channel Msg - ${Date.now()}`
  await postMessage(2, typeTestContent)
  await sleep(400)

  const aGotTypeTest = eventsA.new_message.find((m) => m.content === typeTestContent)
  recordTest('Type Interop', 'String channelId "2" Receives Number 2 Broadcast', Boolean(aGotTypeTest), 'Joined with "2", successfully received broadcast')

  // Reset Client A back to channel 1
  clientA.emit('leave_channel', '2')
  clientA.emit('join_channel', 1)
  await sleep(200)

  // -------------------------------------------------------------
  // Test Section 7: Large Payload Integrity
  // -------------------------------------------------------------
  console.log('\n--- Section 7: Large Message Payload Transmission Integrity ---')
  eventsA.new_message = []
  const largeContent = 'X'.repeat(3000) + ' END_OF_LARGE_MSG'
  await postMessage(1, largeContent)
  await sleep(400)

  const aGotLarge = eventsA.new_message.find((m) => m.content === largeContent)
  recordTest(
    'Payload Integrity',
    '3KB Message Delivered Intact Without Truncation',
    Boolean(aGotLarge && aGotLarge.content.length === largeContent.length),
    `Received exact length: ${aGotLarge ? aGotLarge.content.length : 0} bytes`
  )

  // -------------------------------------------------------------
  // Test Section 8: High Concurrency & Burst Stress Test
  // -------------------------------------------------------------
  console.log('\n--- Section 8: Concurrency & High-Frequency Burst Stress Test ---')
  const clientD = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })
  const clientE = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })
  const clientF = io(BASE_URL, { timeout: 5000, reconnection: false, transports: ['websocket'] })

  await Promise.all([
    new Promise((r) => clientD.on('connect', r)),
    new Promise((r) => clientE.on('connect', r)),
    new Promise((r) => clientF.on('connect', r)),
  ])

  // D, E join channel 1; F joins channel 2
  clientD.emit('join_channel', 1)
  clientE.emit('join_channel', 1)
  clientF.emit('join_channel', 2)
  await sleep(250)

  const burstReceivedA = []
  const burstReceivedD = []
  const burstReceivedE = []
  const burstReceivedF = []

  const burstHandlerA = (m) => { if (m.content.startsWith('CONCURRENT_BURST_')) burstReceivedA.push(m) }
  const burstHandlerD = (m) => { if (m.content.startsWith('CONCURRENT_BURST_')) burstReceivedD.push(m) }
  const burstHandlerE = (m) => { if (m.content.startsWith('CONCURRENT_BURST_')) burstReceivedE.push(m) }
  const burstHandlerF = (m) => { if (m.content.startsWith('CONCURRENT_BURST_')) burstReceivedF.push(m) }

  clientA.on('new_message', burstHandlerA)
  clientD.on('new_message', burstHandlerD)
  clientE.on('new_message', burstHandlerE)
  clientF.on('new_message', burstHandlerF)

  // Fire rapid burst of 25 typing events across channels
  for (let i = 0; i < 25; i++) {
    clientD.emit('typing_start', { channelId: 1, username: `BurstUser_${i % 4}` })
    clientF.emit('typing_start', { channelId: 2, username: `BurstUser_Ch2_${i % 4}` })
  }

  // Fire 12 concurrent HTTP message posts to channel 1
  const BURST_COUNT = 12
  const startBurst = Date.now()
  const postTasks = []
  for (let i = 0; i < BURST_COUNT; i++) {
    postTasks.push(postMessage(1, `CONCURRENT_BURST_${i}_${Date.now()}`))
  }
  await Promise.all(postTasks)
  await sleep(1200)
  const elapsed = Date.now() - startBurst

  recordTest('Concurrency', `Client A Received All ${BURST_COUNT} Burst Messages`, burstReceivedA.length === BURST_COUNT, `Got ${burstReceivedA.length}/${BURST_COUNT} in ${elapsed}ms`)
  recordTest('Concurrency', `Client D Received All ${BURST_COUNT} Burst Messages`, burstReceivedD.length === BURST_COUNT, `Got ${burstReceivedD.length}/${BURST_COUNT}`)
  recordTest('Concurrency', `Client E Received All ${BURST_COUNT} Burst Messages`, burstReceivedE.length === BURST_COUNT, `Got ${burstReceivedE.length}/${BURST_COUNT}`)
  recordTest('Concurrency', 'Zero Cross-Room Leakage During High Load (Client F)', burstReceivedF.length === 0, `Client F received ${burstReceivedF.length} channel 1 burst messages (expected 0)`)

  // Teardown all sockets cleanly
  clientA.disconnect()
  clientB.disconnect()
  clientC.disconnect()
  clientD.disconnect()
  clientE.disconnect()
  clientF.disconnect()

  // -------------------------------------------------------------
  // Test Summary & Verdict
  // -------------------------------------------------------------
  const total = testResults.length
  const passed = testResults.filter((r) => r.passed).length
  const failed = testResults.filter((r) => !r.passed).length

  console.log('\n========================================================================')
  console.log(`EMPIRICAL TEST VERDICT: ${passed}/${total} PASSED (${failed} FAILED)`)
  console.log('========================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runEmpiricalSuite().catch((err) => {
  console.error('Test execution fatal error:', err)
  process.exit(1)
})
