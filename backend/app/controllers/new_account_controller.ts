import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, response, serialize }: HttpContext) {
    const data = await request.validateUsing(signupValidator)

    const username =
      data.username ||
      data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]+/g, '_') + '_' + Math.floor(Math.random() * 1000)

    const user = await User.create({
      fullName: data.fullName || username,
      username,
      email: data.email,
      password: data.password,
      domainInterests: data.domainInterests || 'Web Development',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      status: 'online',
    })

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
}

