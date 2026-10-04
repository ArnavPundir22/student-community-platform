import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import Channel from '#models/channel'
import CommunityMember from '#models/community_member'
import WsService from '#services/ws_service'

export default class MessagesController {
  async index({ params, response }: HttpContext) {
    const channelId = Number(params.id)
    if (Number.isNaN(channelId) || channelId <= 0) {
      return response.badRequest({ message: 'Invalid channel ID' })
    }
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    const messages = await Message.query()
      .where('channelId', channelId)
      .preload('user')
      .orderBy('createdAt', 'asc')

    return messages
  }

  async store({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const channelId = Number(params.id)
    if (Number.isNaN(channelId) || channelId <= 0) {
      return response.badRequest({ message: 'Invalid channel ID' })
    }
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    await channel.load('community')
    if (channel.community) {
      const isOwner = channel.community.ownerId === user.id
      if (!isOwner) {
        const isMemberRecord = await CommunityMember.query()
          .where('communityId', channel.community.id)
          .where('userId', user.id)
          .first()

        if (!isMemberRecord) {
          return response.forbidden({ message: 'You must join this community server to send messages' })
        }
      }
    }

    const { content, parentId } = request.only(['content', 'parentId'])

    if (!content || !content.trim()) {
      return response.badRequest({ message: 'Message content cannot be empty' })
    }

    const message = await Message.create({
      channelId,
      userId: user.id,
      content,
      parentId: parentId ? Number(parentId) : null,
    })

    await message.load('user')

    // Broadcast message via WebSockets
    WsService.broadcastNewMessage(channelId, message)

    return response.created(message)
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const messageId = Number(params.id)
    if (Number.isNaN(messageId) || messageId <= 0) {
      return response.badRequest({ message: 'Invalid message ID' })
    }

    const message = await Message.find(messageId)
    if (!message) {
      return response.notFound({ message: 'Message not found' })
    }

    await message.load('channel')
    let isStaff = false
    if (message.channel) {
      await message.channel.load('community')
      if (message.channel.community) {
        if (message.channel.community.ownerId === user.id) {
          isStaff = true
        } else {
          const memberRecord = await CommunityMember.query()
            .where('communityId', message.channel.community.id)
            .where('userId', user.id)
            .first()
          if (memberRecord?.role === 'admin') {
            isStaff = true
          }
        }
      }
    }

    if (message.userId !== user.id && !isStaff) {
      return response.forbidden({ message: 'You do not have permission to delete this message' })
    }

    const channelId = message.channelId
    await message.delete()

    if (channelId) {
      WsService.broadcastMessageDeleted(channelId, messageId)
    }

    return response.ok({ message: 'Message deleted successfully', messageId })
  }

  async react({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const messageId = Number(params.id)
    if (Number.isNaN(messageId) || messageId <= 0) {
      return response.badRequest({ message: 'Invalid message ID' })
    }

    const message = await Message.find(messageId)
    if (!message) {
      return response.notFound({ message: 'Message not found' })
    }

    await message.load('channel')
    if (message.channel) {
      await message.channel.load('community')
      if (message.channel.community) {
        const isOwner = message.channel.community.ownerId === user.id
        if (!isOwner) {
          const isMemberRecord = await CommunityMember.query()
            .where('communityId', message.channel.community.id)
            .where('userId', user.id)
            .first()

          if (!isMemberRecord) {
            return response.forbidden({ message: 'You must join this community server to react to messages' })
          }
        }
      }
    }

    const { emoji } = request.only(['emoji'])
    if (!emoji || typeof emoji !== 'string') {
      return response.badRequest({ message: 'Emoji is required' })
    }

    let reactionsMap: Record<string, number[]> = {}
    if (message.reactions) {
      try {
        reactionsMap = JSON.parse(message.reactions)
      } catch {}
    }

    const currentUsers = reactionsMap[emoji] || []
    const userIndex = currentUsers.indexOf(user.id)

    if (userIndex >= 0) {
      currentUsers.splice(userIndex, 1)
      if (currentUsers.length === 0) {
        delete reactionsMap[emoji]
      } else {
        reactionsMap[emoji] = currentUsers
      }
    } else {
      currentUsers.push(user.id)
      reactionsMap[emoji] = currentUsers
    }

    const updatedReactionsStr = Object.keys(reactionsMap).length > 0 ? JSON.stringify(reactionsMap) : null
    message.reactions = updatedReactionsStr
    await message.save()

    if (message.channelId) {
      WsService.broadcastMessageReacted(message.channelId, message.id, updatedReactionsStr)
    }

    return response.ok({ message: 'Reaction updated', reactions: updatedReactionsStr })
  }
}
