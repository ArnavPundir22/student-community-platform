import env from '#start/env'

const parseCorsOrigin = () => {
  const customOrigin = env.get('CORS_ORIGIN')
  if (customOrigin) {
    if (customOrigin === '*') return true
    return customOrigin.split(',').map((o) => o.trim())
  }
  return true
}

const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * Allow dynamic origins based on CORS_ORIGIN environment variable.
   */
  origin: parseCorsOrigin(),

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
