import type { HttpContext } from '@adonisjs/core/http'
import Resource from '#models/resource'

export default class ResourcesController {
  async index({ request }: HttpContext) {
    const domainTag = request.input('domain')
    const query = Resource.query().preload('user').preload('community')

    if (domainTag) {
      query.where('domainTag', domainTag)
    }

    const resources = await query.orderBy('upvotes', 'desc')
    return resources
  }

  async store({ request, auth, response }: HttpContext) {
    const { communityId, title, url, description, domainTag } = request.only([
      'communityId',
      'title',
      'url',
      'description',
      'domainTag',
    ])

    if (url && (typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://')))) {
      return response.badRequest({
        message: 'Resource URL must be a valid HTTP or HTTPS web address',
      })
    }

    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    if (!title || !url) {
      return response.badRequest({ message: 'Title and URL are required' })
    }

    const resource = await Resource.create({
      communityId: communityId ? Number(communityId) : null,
      userId: user.id,
      title,
      url,
      description: description || '',
      domainTag: domainTag || 'General',
      upvotes: 1,
    })

    await resource.load('user')
    await resource.load('community')

    return response.created(resource)
  }

  async upvote({ params, response }: HttpContext) {
    const resource = await Resource.find(params.id)
    if (!resource) {
      return response.notFound({ message: 'Resource not found' })
    }

    resource.upvotes = (resource.upvotes || 0) + 1
    await resource.save()

    return resource
  }

  async update({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const resourceId = Number(params.id)
    if (Number.isNaN(resourceId) || resourceId <= 0) {
      return response.badRequest({ message: 'Invalid resource ID' })
    }

    const resource = await Resource.find(resourceId)
    if (!resource) {
      return response.notFound({ message: 'Resource not found' })
    }

    if (resource.userId !== user.id) {
      return response.forbidden({ message: 'Only the creator of this resource can edit it' })
    }

    const { title, url, description, domainTag } = request.only([
      'title',
      'url',
      'description',
      'domainTag',
    ])

    if (url && (typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://')))) {
      return response.badRequest({
        message: 'Resource URL must be a valid HTTP or HTTPS web address',
      })
    }

    if (title) resource.title = title
    if (url) resource.url = url
    if (description !== undefined) resource.description = description
    if (domainTag) resource.domainTag = domainTag

    await resource.save()
    await resource.load('user')
    await resource.load('community')

    return response.ok(resource)
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const resourceId = Number(params.id)
    if (Number.isNaN(resourceId) || resourceId <= 0) {
      return response.badRequest({ message: 'Invalid resource ID' })
    }

    const resource = await Resource.find(resourceId)
    if (!resource) {
      return response.notFound({ message: 'Resource not found' })
    }

    if (resource.userId !== user.id) {
      return response.forbidden({ message: 'Only the creator of this resource can delete it' })
    }

    await resource.delete()

    return response.ok({ message: 'Resource deleted successfully', id: resourceId })
  }
}
