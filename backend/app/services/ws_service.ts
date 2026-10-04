import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'node:http'
import env from '#start/env'

class WsService {
  io: SocketIOServer | null = null

  boot(server: HTTPServer) {
    const corsOrigin = env.get('CORS_ORIGIN')
      ? env.get('CORS_ORIGIN') === '*'
        ? '*'
        : env.get('CORS_ORIGIN')!.split(',').map((o) => o.trim())
      : true

    this.io = new SocketIOServer(server, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST', 'DELETE', 'PUT'],
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 25000,
    })

    const redisHost = env.get('REDIS_HOST')
    if (redisHost) {
      this.initRedisAdapter(redisHost)
    }

    this.io.on('connection', (socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`)

      socket.on('join_channel', (channelId: string | number) => {
        if (!channelId) return
        socket.join(`channel:${channelId}`)
      })

      socket.on('leave_channel', (channelId: string | number) => {
        if (!channelId) return
        socket.leave(`channel:${channelId}`)
      })

      socket.on('join_community', (communityId: string | number) => {
        if (!communityId) return
        socket.join(`community:${communityId}`)
      })

      socket.on('leave_community', (communityId: string | number) => {
        if (!communityId) return
        socket.leave(`community:${communityId}`)
      })

      socket.on('typing_start', (data: { channelId?: string | number; username?: string }) => {
        if (!data || typeof data !== 'object' || !data.channelId) return
        socket.to(`channel:${data.channelId}`).emit('user_typing', {
          channelId: data.channelId,
          username: data.username || 'Student',
          isTyping: true,
        })
      })

      socket.on('typing_stop', (data: { channelId?: string | number; username?: string }) => {
        if (!data || typeof data !== 'object' || !data.channelId) return
        socket.to(`channel:${data.channelId}`).emit('user_typing', {
          channelId: data.channelId,
          username: data.username || 'Student',
          isTyping: false,
        })
      })

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`)
      })
    })
  }

  broadcastNewMessage(channelId: string | number, message: any) {
    if (this.io) {
      this.io.to(`channel:${channelId}`).emit('new_message', message)
    }
  }

  broadcastMessageDeleted(channelId: string | number, messageId: string | number) {
    if (this.io) {
      this.io.to(`channel:${channelId}`).emit('message_deleted', { channelId, messageId })
    }
  }

  broadcastMessageReacted(channelId: string | number, messageId: string | number, reactions: string | null) {
    if (this.io) {
      this.io.to(`channel:${channelId}`).emit('message_reacted', { channelId, messageId, reactions })
    }
  }

  broadcastChannelCreated(communityId: string | number, channel: any) {
    if (this.io) {
      this.io.to(`community:${communityId}`).emit('channel_created', channel)
      this.io.emit('global_channel_created', { communityId, channel })
    }
  }

  broadcastChannelDeleted(communityId: string | number, channelId: string | number) {
    if (this.io) {
      this.io.to(`community:${communityId}`).emit('channel_deleted', { communityId, channelId })
      this.io.emit('global_channel_deleted', { communityId, channelId })
    }
  }

  broadcastCommunityDeleted(communityId: string | number) {
    if (this.io) {
      this.io.emit('community_deleted', { communityId })
    }
  }

  broadcastCommunityUpdated(communityId: string | number, community: any) {
    if (this.io) {
      this.io.to(`community:${communityId}`).emit('community_updated', community)
      this.io.emit('global_community_updated', { communityId, community })
    }
  }

  broadcastMemberJoined(communityId: string | number, member: any) {
    if (this.io) {
      this.io.to(`community:${communityId}`).emit('member_joined', { communityId, member })
    }
  }

  broadcastMemberLeft(communityId: string | number, userId: string | number) {
    if (this.io) {
      this.io.to(`community:${communityId}`).emit('member_left', { communityId, userId })
    }
  }

  broadcastMemberRoleUpdated(communityId: string | number, member: any) {
    if (this.io) {
      this.io.to(`community:${communityId}`).emit('member_role_updated', { communityId, member })
    }
  }

  private async initRedisAdapter(redisHost: string) {
    try {
      const redisAdapterModule: any = await (new Function('return import("@socket.io/redis-adapter")')())
      const ioRedisModule: any = await (new Function('return import("ioredis")')())
      const createAdapter = redisAdapterModule.createAdapter
      const Redis = ioRedisModule.Redis || ioRedisModule.default
      const pubClient = new Redis({
        host: redisHost,
        port: env.get('REDIS_PORT') || 6379,
        password: env.get('REDIS_PASSWORD') || undefined,
      })
      const subClient = pubClient.duplicate()
      if (this.io) {
        this.io.adapter(createAdapter(pubClient, subClient))
        console.log(`[Socket.io] Redis Adapter connected to ${redisHost}`)
      }
    } catch (err) {
      console.warn('[Socket.io] Redis Adapter optional setup skipped:', err)
    }
  }
}

export default new WsService()
