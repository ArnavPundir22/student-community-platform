import type { HttpContext } from '@adonisjs/core/http'
import Community from '#models/community'
import Channel from '#models/channel'
import CommunityMember from '#models/community_member'
import CommunityJoinRequest from '#models/community_join_request'
import User from '#models/user'
import Message from '#models/message'
import WsService from '#services/ws_service'

export default class CommunitiesController {
  async index({ request }: HttpContext) {
    const domainTag = request.input('domain')
    const query = Community.query().preload('owner').preload('members')

    if (domainTag && domainTag !== 'All') {
      query.where('domainTag', domainTag)
    }

    const communities = await query.orderBy('createdAt', 'desc')
    return communities
  }

  async show({ params, response }: HttpContext) {
    const community = await Community.query()
      .where('id', params.id)
      .preload('owner')
      .preload('channels', (cQuery) => cQuery.orderBy('position', 'asc'))
      .preload('members', (mQuery) => mQuery.preload('user'))
      .first()

    if (!community) {
      return response.notFound({ message: 'Community not found' })
    }

    return community
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required to create a community' })
    }
    const data = request.only(['name', 'description', 'domainTag', 'iconUrl', 'isPrivate'])

    if (!data.name || !data.domainTag) {
      return response.badRequest({ message: 'Name and domain tag are required' })
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

    const community = await Community.create({
      name: data.name,
      slug,
      description: data.description || '',
      domainTag: data.domainTag,
      iconUrl: data.iconUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      isPrivate: Boolean(data.isPrivate),
      ownerId: user.id,
    })

    // Auto-create default channels
    await Channel.create({
      communityId: community.id,
      name: 'general-discussion',
      type: 'text',
      topic: 'General chatter and community updates',
      position: 1,
    })

    await Channel.create({
      communityId: community.id,
      name: 'resources',
      type: 'resource',
      topic: 'Share useful domain links and study guides',
      position: 2,
    })

    // Add owner as community member
    await CommunityMember.create({
      communityId: community.id,
      userId: user.id,
      role: 'owner',
    })

    await community.load('channels')
    await community.load('owner')

    return response.created(community)
  }

  async update({ params, request, auth, response }: HttpContext) {
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

    if (community.ownerId !== user.id) {
      return response.forbidden({ message: 'Only the Community Owner can update server details' })
    }

    const data = request.only(['name', 'title', 'description', 'domainTag', 'iconUrl', 'avatarUrl', 'isPrivate'])
    if (data.name) community.name = data.name
    if (data.title) community.name = data.title
    if (data.description !== undefined) community.description = data.description
    if (data.domainTag) community.domainTag = data.domainTag
    if (data.iconUrl !== undefined) community.iconUrl = data.iconUrl
    if (data.avatarUrl !== undefined) community.iconUrl = data.avatarUrl
    if (data.isPrivate !== undefined) community.isPrivate = Boolean(data.isPrivate)

    await community.save()
    await community.load('channels')
    await community.load('owner')

    WsService.broadcastCommunityUpdated(community.id, community)

    return community
  }

  async join({ params, auth, response }: HttpContext) {
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

    const existing = await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', user.id)
      .first()

    if (existing) {
      return { message: 'Already a member of this community' }
    }

    const member = await CommunityMember.create({
      communityId,
      userId: user.id,
      role: 'member',
    })

    await member.load('user')
    WsService.broadcastMemberJoined(communityId, member)

    return response.created(member)
  }

  async leave({ params, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }
    const communityId = Number(params.id)

    const community = await Community.find(communityId)
    if (community && community.ownerId === user.id) {
      return response.badRequest({ message: 'Community owner cannot leave their own community. You may delete it instead.' })
    }

    await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', user.id)
      .delete()

    WsService.broadcastMemberLeft(communityId, user.id)

    return { message: 'Successfully left the community' }
  }

  async destroy({ params, auth, response }: HttpContext) {
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

    if (community.ownerId !== user.id) {
      return response.forbidden({ message: 'Only the Community Owner can delete this server' })
    }

    // Delete associated channels, messages, members
    const channels = await Channel.query().where('communityId', communityId)
    const channelIds = channels.map((c) => c.id)

    if (channelIds.length > 0) {
      await Message.query().whereIn('channelId', channelIds).delete()
    }

    await Channel.query().where('communityId', communityId).delete()
    await CommunityMember.query().where('communityId', communityId).delete()
    await community.delete()

    WsService.broadcastCommunityDeleted(communityId)

    return { message: 'Community server deleted successfully', communityId }
  }

  async members({ params }: HttpContext) {
    const communityId = Number(params.id)
    const members = await CommunityMember.query()
      .where('communityId', communityId)
      .preload('user')
      .orderBy('createdAt', 'asc')

    return members
  }

  async kickMember({ params, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const communityId = Number(params.id)
    const targetUserId = Number(params.userId)

    if (Number.isNaN(targetUserId) || targetUserId <= 0) {
      return response.badRequest({ message: 'Invalid member ID' })
    }

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
      return response.forbidden({ message: 'Only Community Owners and Admins can kick members' })
    }

    if (targetUserId === user.id || targetUserId === community.ownerId) {
      return response.badRequest({ message: 'Cannot kick server owner or yourself' })
    }

    const member = await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', targetUserId)
      .first()

    if (!member) {
      return response.notFound({ message: 'Member not found in community' })
    }

    if (isAdmin && !isOwner && (member.role === 'admin' || member.role === 'owner')) {
      return response.forbidden({ message: 'Admins cannot kick other Admins or the Server Owner' })
    }

    await member.delete()

    WsService.broadcastMemberLeft(communityId, targetUserId)

    return { message: 'Member removed from community' }
  }

  async updateMemberRole({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const communityId = Number(params.id)
    const targetUserId = Number(params.userId)

    if (Number.isNaN(targetUserId) || targetUserId <= 0) {
      return response.badRequest({ message: 'Invalid member ID' })
    }

    const { role } = request.only(['role'])

    if (!['owner', 'admin', 'member'].includes(role)) {
      return response.badRequest({ message: 'Invalid role. Choose owner, admin or member' })
    }

    const community = await Community.find(communityId)
    if (!community) {
      return response.notFound({ message: 'Community not found' })
    }

    if (community.ownerId !== user.id) {
      return response.forbidden({ message: 'Only the Community Owner can manage roles' })
    }

    const member = await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', targetUserId)
      .first()

    if (!member) {
      return response.notFound({ message: 'Member not found in community' })
    }

    member.role = role
    await member.save()
    await member.load('user')

    if (role === 'owner') {
      community.ownerId = targetUserId
      await community.save()
    }

    WsService.broadcastMemberRoleUpdated(communityId, member)

    return member
  }

  async createJoinRequest({ params, auth, response }: HttpContext) {
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

    const existingMember = await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', user.id)
      .first()

    if (existingMember) {
      return response.badRequest({ message: 'You are already a member of this community' })
    }

    if (!community.isPrivate) {
      const member = await CommunityMember.create({
        communityId,
        userId: user.id,
        role: 'member',
      })
      await member.load('user')
      WsService.broadcastMemberJoined(communityId, member)
      return response.ok({ message: 'Joined community successfully', status: 'joined', member })
    }

    const existingReq = await CommunityJoinRequest.query()
      .where('communityId', communityId)
      .where('userId', user.id)
      .where('status', 'pending')
      .first()

    if (existingReq) {
      return response.ok({ message: 'Join request is already pending approval', status: 'pending', request: existingReq })
    }

    const joinReq = await CommunityJoinRequest.create({
      communityId,
      userId: user.id,
      status: 'pending',
    })

    await joinReq.load('user')
    return response.created({ message: 'Join request sent! An Owner or Admin will review your request.', status: 'pending', request: joinReq })
  }

  async getJoinRequests({ params, auth, response }: HttpContext) {
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
      return response.forbidden({ message: 'Only Community Owners and Admins can view join requests' })
    }

    const requests = await CommunityJoinRequest.query()
      .where('communityId', communityId)
      .where('status', 'pending')
      .preload('user')
      .orderBy('createdAt', 'desc')

    return requests
  }

  async respondJoinRequest({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const communityId = Number(params.id)
    const requestId = Number(params.requestId)
    const { action } = request.only(['action'])

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
      return response.forbidden({ message: 'Only Community Owners and Admins can respond to join requests' })
    }

    const joinReq = await CommunityJoinRequest.find(requestId)
    if (!joinReq) {
      return response.notFound({ message: 'Join request not found' })
    }

    if (action === 'approve') {
      joinReq.status = 'approved'
      await joinReq.save()

      if (joinReq.userId) {
        const existingMember = await CommunityMember.query()
          .where('communityId', communityId)
          .where('userId', joinReq.userId)
          .first()

        if (!existingMember) {
          const member = await CommunityMember.create({
            communityId,
            userId: joinReq.userId,
            role: 'member',
          })
          await member.load('user')
          WsService.broadcastMemberJoined(communityId, member)
        }
      }

      return response.ok({ message: 'Join request approved! Member added to community.', status: 'approved' })
    } else {
      joinReq.status = 'rejected'
      await joinReq.save()
      return response.ok({ message: 'Join request rejected.', status: 'rejected' })
    }
  }

  async addMemberByUsername({ params, request, auth, response }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const communityId = Number(params.id)
    const { username } = request.only(['username'])

    if (!username || !username.trim()) {
      return response.badRequest({ message: 'Username is required' })
    }

    const cleanUsername = username.trim().replace(/^@/, '')

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
      return response.forbidden({ message: 'Only Community Owners and Admins can directly add members' })
    }

    const targetUser = await User.query()
      .whereRaw('LOWER(username) = ?', [cleanUsername.toLowerCase()])
      .orWhereRaw('LOWER(email) = ?', [cleanUsername.toLowerCase()])
      .first()

    if (!targetUser) {
      return response.notFound({ message: `User "@${cleanUsername}" was not found` })
    }

    const existingMember = await CommunityMember.query()
      .where('communityId', communityId)
      .where('userId', targetUser.id)
      .first()

    if (existingMember) {
      return response.badRequest({ message: `@${targetUser.username} is already a member of this community` })
    }

    const member = await CommunityMember.create({
      communityId,
      userId: targetUser.id,
      role: 'member',
    })

    await member.load('user')
    WsService.broadcastMemberJoined(communityId, member)

    return response.created({ message: `Successfully added @${targetUser.username} to community!`, member })
  }
}
