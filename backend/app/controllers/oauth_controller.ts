import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class OauthController {
  async callback({ request, response, serialize }: HttpContext) {
    const { email, fullName, avatarUrl, provider } = request.only([
      'email',
      'fullName',
      'avatarUrl',
      'provider',
    ])

    if (!email) {
      return response.badRequest({ message: 'Email is required for OAuth login' })
    }

    let user = await User.findBy('email', email)

    if (!user) {
      const username =
        email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]+/g, '_') +
        '_' +
        Math.floor(Math.random() * 1000)

      user = await User.create({
        email,
        fullName: fullName || username,
        username,
        password: Math.random().toString(36).slice(-12) + '!OAuth123',
        avatarUrl:
          avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        domainInterests: 'Artificial Intelligence, Web Development',
        status: 'online',
      })
    }

    const token = await User.accessTokens.create(user)
    const rawToken = token.value!.release()

    const isSecure = Boolean(request.secure || process.env.NODE_ENV === 'production')
    response.cookie('auth_token', rawToken, {
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      path: '/',
      maxAge: '30d',
    })

    return serialize({
      provider: provider || 'oauth',
      user: UserTransformer.transform(user),
      token: rawToken,
    })
  }
}
