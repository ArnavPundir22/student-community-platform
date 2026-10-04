import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    return serialize({
      ...UserTransformer.transform(user),
      user: UserTransformer.transform(user),
      data: UserTransformer.transform(user),
    })
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { fullName, username, bio, avatarUrl, domainInterests, status } = request.only([
      'fullName',
      'username',
      'bio',
      'avatarUrl',
      'domainInterests',
      'status',
    ])

    if (fullName) user.fullName = fullName
    if (username) user.username = username
    if (bio !== undefined) user.bio = bio
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
    if (domainInterests !== undefined) user.domainInterests = domainInterests
    if (status) user.status = status

    await user.save()

    return serialize({
      ...UserTransformer.transform(user),
      user: UserTransformer.transform(user),
      data: UserTransformer.transform(user),
    })
  }
}

