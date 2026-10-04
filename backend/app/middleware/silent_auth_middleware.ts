import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Silent auth middleware can be used as a global middleware to check
 * if the user is logged-in via Bearer header or HttpOnly auth_token cookie.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const cookieToken = ctx.request.cookie('auth_token')
    if (!ctx.request.header('authorization') && cookieToken) {
      ctx.request.request.headers.authorization = `Bearer ${cookieToken}`
    }

    try {
      await ctx.auth.check()
    } catch {}

    return next()
  }
}
