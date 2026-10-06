import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const CommunitiesController = () => import('#controllers/communities_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const MessagesController = () => import('#controllers/messages_controller')
const ResourcesController = () => import('#controllers/resources_controller')
const AccessTokensController = () => import('#controllers/access_tokens_controller')
const NewAccountController = () => import('#controllers/new_account_controller')
const ProfileController = () => import('#controllers/profile_controller')
const OauthController = () => import('#controllers/oauth_controller')
const UploadsController = () => import('#controllers/uploads_controller')

router.get('/', () => {
  return { status: 'online', platform: 'Student Community Network API', version: 'v1.4-supabase-s3' }
})

router.get('/uploads/:fileName', [UploadsController, 'show'])

router
  .group(() => {
    // Health check endpoint
    router.get('/', () => {
      return { status: 'online', platform: 'Student Community Network API', version: 'v1.4-supabase-s3' }
    })

    // Auth Public Routes
    router
      .group(() => {
        router.post('signup', [NewAccountController, 'store']).as('auth.signup')
        router.post('login', [AccessTokensController, 'store']).as('auth.login')
        router.post('oauth', [OauthController, 'callback']).as('auth.oauth')
        router.post('google', [OauthController, 'callback']).as('auth.google')
        router.post('github', [OauthController, 'callback']).as('auth.github')
        router.post('linkedin', [OauthController, 'callback']).as('auth.linkedin')
        router.get(':provider/redirect', [OauthController, 'callback']).as('auth.provider.redirect')
        router.get(':provider/callback', [OauthController, 'callback']).as('auth.provider.callback')
      })
      .prefix('auth')

    // Auth Protected Routes
    router
      .group(() => {
        router.get('me', [ProfileController, 'show']).as('auth.me')
        router.get('profile', [ProfileController, 'show']).as('auth.profile')
        router.put('profile', [ProfileController, 'update']).as('auth.profile.update')
        router.post('logout', [AccessTokensController, 'destroy']).as('auth.logout')
      })
      .prefix('auth')
      .use(middleware.auth())

    // Account Routes (Protected - Backward Compatibility)
    router
      .group(() => {
        router.get('profile', [ProfileController, 'show']).as('account.profile')
        router.put('profile', [ProfileController, 'update']).as('account.profile.update')
        router.post('logout', [AccessTokensController, 'destroy']).as('account.logout')
      })
      .prefix('account')
      .use(middleware.auth())

    // Communities Routes
    router.get('communities', [CommunitiesController, 'index']).as('communities.index')
    router.get('communities/:id', [CommunitiesController, 'show']).as('communities.show')
    router.put('communities/:id', [CommunitiesController, 'update']).as('communities.update')
    router.post('communities', [CommunitiesController, 'store']).as('communities.store')
    router.delete('communities/:id', [CommunitiesController, 'destroy']).as('communities.destroy')
    router.post('communities/:id/join', [CommunitiesController, 'join']).as('communities.join')
    router.post('communities/:id/join-request', [CommunitiesController, 'createJoinRequest']).as('communities.joinRequest.create')
    router.get('communities/:id/join-requests', [CommunitiesController, 'getJoinRequests']).as('communities.joinRequests.index')
    router.post('communities/:id/join-requests/:requestId/respond', [CommunitiesController, 'respondJoinRequest']).as('communities.joinRequests.respond')
    router.post('communities/:id/add-member', [CommunitiesController, 'addMemberByUsername']).as('communities.addMemberByUsername')
    router.post('communities/:id/leave', [CommunitiesController, 'leave']).as('communities.leave.post')
    router.delete('communities/:id/leave', [CommunitiesController, 'leave']).as('communities.leave.delete')
    router.get('communities/:id/members', [CommunitiesController, 'members']).as('communities.members')
    router.delete('communities/:id/members/:userId', [CommunitiesController, 'kickMember']).as('communities.kickMember')
    router.put('communities/:id/members/:userId', [CommunitiesController, 'updateMemberRole']).as('communities.updateMemberRole')
    router.put('communities/:id/members/:userId/role', [CommunitiesController, 'updateMemberRole']).as('communities.updateMemberRoleExplicit')

    // Channels Routes
    router.post('communities/:id/channels', [ChannelsController, 'store'])
    router.delete('channels/:id', [ChannelsController, 'destroy'])

    // Messages Routes
    router.get('channels/:id/messages', [MessagesController, 'index'])
    router.post('channels/:id/messages', [MessagesController, 'store']).use(middleware.auth())
    router.delete('messages/:id', [MessagesController, 'destroy']).use(middleware.auth())
    router.post('messages/:id/reactions', [MessagesController, 'react']).use(middleware.auth())

    // Uploads Routes
    router.post('upload', [UploadsController, 'store']).use(middleware.auth())

    // Resources Routes
    router.get('resources', [ResourcesController, 'index'])
    router.post('resources', [ResourcesController, 'store'])
    router.put('resources/:id', [ResourcesController, 'update']).use(middleware.auth())
    router.delete('resources/:id', [ResourcesController, 'destroy']).use(middleware.auth())
    router.post('resources/:id/upvote', [ResourcesController, 'upvote'])
  })
  .prefix('/api/v1')
