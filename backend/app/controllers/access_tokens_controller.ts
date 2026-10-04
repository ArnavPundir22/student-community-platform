import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AccessTokensController {
  async store({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    const rawToken = token.value!.release()

    response.cookie('auth_token', rawToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: '30d',
    })

    return serialize({
      user: UserTransformer.transform(user),
      token: rawToken,
      data: {
        user: UserTransformer.transform(user),
        token: rawToken,
      },
    })
  }

  async destroy({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      if (user.currentAccessToken) {
        await User.accessTokens.delete(user, user.currentAccessToken.identifier)
      }
    } catch {}

    response.clearCookie('auth_token', { path: '/' })

    return {
      message: 'Logged out successfully',
    }
  }
}

