const RENDER_BACKEND = 'https://student-community-backend-27ro.onrender.com/api/v1'

async function run() {
  console.log('1. Trying to signup/login test user on live Render backend...')

  const email = `testuser_${Date.now()}@example.com`
  const password = 'Password123!'
  let token = ''

  const signupRes = await fetch(`${RENDER_BACKEND}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      username: `testuser_${Date.now()}`,
      fullName: 'Test User',
    }),
  })

  const signupData = await signupRes.json()
  console.log('Signup status:', signupRes.status, signupData)

  if (signupData.token || signupData.bearerToken?.token || signupData.data?.token) {
    token = signupData.token || signupData.bearerToken?.token || signupData.data?.token
  }

  console.log('Got Auth Token:', token ? token.substring(0, 20) + '...' : 'NONE')

  console.log('2. Sending POST /upload to live Render backend...')
  const form = new FormData()
  const fileContent = Buffer.from('Live test content for Supabase upload')
  form.append('file', new Blob([fileContent], { type: 'text/plain' }), 'test_live.txt')

  const uploadRes = await fetch(`${RENDER_BACKEND}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  const uploadText = await uploadRes.text()
  console.log('Upload HTTP Status:', uploadRes.status)
  console.log('Upload Response Body:', uploadText)
}

run()
