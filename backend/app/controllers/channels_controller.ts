import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import Community from '#models/community'
import CommunityMember from '#models/community_member'
import Message from '#models/message'
import WsService from '#services/ws_service'

export default class ChannelsController {
  async store({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const communityId = Number(params.id)
    const community = await Community.find(communityId)

    if (!community) {
      return response.notFound({ message: 'Community not found' })
    }

    const isOwner = community.ownerId === user.id
    const requesterMember = await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', user.id)
      .first()
    const isAdmin = requesterMember?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.forbidden({ message: 'Only Community Owners and Admins can create channels' })
    }

    const { name, type, topic } = request.only(['name', 'type', 'topic'])

    if (!name) {
      return response.badRequest({ message: 'Channel name is required' })
    }

    const channel = await Channel.create({
      communityId,
      name: name.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      type: type || 'text',
      topic: topic || '',
      position: 10,
    })

    WsService.broadcastChannelCreated(communityId, channel)

    return response.created(channel)
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const channelId = Number(params.id)
    const channel = await Channel.find(channelId)

    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    const community = await Community.find(channel.communityId)
    if (!community) {
      return response.notFound({ message: 'Community not found' })
    }

    const isOwner = community.ownerId === user.id
    const requesterMember = await CommunityMember.query()
      .where('communityId', community.id)
      .where('userId', user.id)
      .first()
    const isAdmin = requesterMember?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.forbidden({ message: 'Only Community Owners and Admins can delete channels' })
    }

    await Message.query().where('channelId', channelId).delete()
    await channel.delete()

    WsService.broadcastChannelDeleted(community.id, channelId)

    return { message: 'Channel deleted successfully', channelId }
  }
}
