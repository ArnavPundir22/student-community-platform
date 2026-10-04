import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthCookieMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.request.header('authorization')) {
      const token = ctx.request.cookie('auth_token') || ctx.request.plainCookie('auth_token')
      if (token) {
        ctx.request.request.headers['authorization'] = `Bearer ${token}`
      }
    }
    return next()
  }
}
