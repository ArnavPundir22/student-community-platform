import { test } from '@japa/runner'
import User from '#models/user'

async function getOrCreateTestUser() {
  let user = await User.findBy('email', 'test_hardening@university.edu')
  if (!user) {
    user = await User.create({
      fullName: 'Test Hardening',
      email: 'test_hardening@university.edu',
      username: 'test_hardening',
      password: 'Password123!',
    })
  }
  return user
}

test.group('Defensive Hardening Tests', () => {
  test('GET /channels/:id/messages rejects non-numeric channelId with 400', async ({ client }) => {
    const response = await client.get('/api/v1/channels/abc-not-a-number/messages')
    response.assertStatus(400)
    response.assertBodyContains({ message: 'Invalid channel ID' })
  })

  test('GET /channels/:id/messages rejects non-existent channel with 404', async ({ client }) => {
    const response = await client.get('/api/v1/channels/999999/messages')
    response.assertStatus(404)
    response.assertBodyContains({ message: 'Channel not found' })
  })

  test('POST /channels/:id/messages rejects unauthenticated request with 401', async ({ client }) => {
    const response = await client.post('/api/v1/channels/999999/messages').json({
      content: 'Unauthenticated message probe',
    })
    response.assertStatus(401)
  })

  test('POST /channels/:id/messages rejects non-numeric channelId with 400', async ({ client }) => {
    const user = await getOrCreateTestUser()
    const response = await client.post('/api/v1/channels/invalid-id/messages').loginAs(user).json({
      content: 'This should fail validation',
    })
    response.assertStatus(400)
    response.assertBodyContains({ message: 'Invalid channel ID' })
  })

  test('POST /channels/:id/messages rejects non-existent channel with 404', async ({ client }) => {
    const user = await getOrCreateTestUser()
    const response = await client.post('/api/v1/channels/999999/messages').loginAs(user).json({
      content: 'This should not be saved',
    })
    response.assertStatus(404)
    response.assertBodyContains({ message: 'Channel not found' })
  })

  test('POST /resources rejects javascript: URL scheme with 400', async ({ client }) => {
    const response = await client.post('/api/v1/resources').json({
      title: 'Malicious Resource',
      url: 'javascript:alert(document.cookie)',
      domainTag: 'Web Development',
    })
    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Resource URL must be a valid HTTP or HTTPS web address',
    })
  })

  test('POST /resources accepts valid https:// URL scheme', async ({ client }) => {
    const user = await getOrCreateTestUser()
    const response = await client.post('/api/v1/resources').loginAs(user).json({
      title: 'Valid Resource HTTPS',
      url: 'https://docs.adonisjs.com',
      domainTag: 'Web Development',
    })
    response.assertStatus(201)
  })
})
