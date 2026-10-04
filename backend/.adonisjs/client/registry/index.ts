/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'uploads.show': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/:fileName',
    tokens: [{"old":"/uploads/:fileName","type":0,"val":"uploads","end":""},{"old":"/uploads/:fileName","type":1,"val":"fileName","end":""}],
    types: placeholder as Registry['uploads.show']['types'],
  },
  'auth.signup': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.signup']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.oauth': {
    methods: ["POST"],
    pattern: '/api/v1/auth/oauth',
    tokens: [{"old":"/api/v1/auth/oauth","type":0,"val":"api","end":""},{"old":"/api/v1/auth/oauth","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/oauth","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/oauth","type":0,"val":"oauth","end":""}],
    types: placeholder as Registry['auth.oauth']['types'],
  },
  'auth.google': {
    methods: ["POST"],
    pattern: '/api/v1/auth/google',
    tokens: [{"old":"/api/v1/auth/google","type":0,"val":"api","end":""},{"old":"/api/v1/auth/google","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/google","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/google","type":0,"val":"google","end":""}],
    types: placeholder as Registry['auth.google']['types'],
  },
  'auth.github': {
    methods: ["POST"],
    pattern: '/api/v1/auth/github',
    tokens: [{"old":"/api/v1/auth/github","type":0,"val":"api","end":""},{"old":"/api/v1/auth/github","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/github","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/github","type":0,"val":"github","end":""}],
    types: placeholder as Registry['auth.github']['types'],
  },
  'auth.linkedin': {
    methods: ["POST"],
    pattern: '/api/v1/auth/linkedin',
    tokens: [{"old":"/api/v1/auth/linkedin","type":0,"val":"api","end":""},{"old":"/api/v1/auth/linkedin","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/linkedin","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/linkedin","type":0,"val":"linkedin","end":""}],
    types: placeholder as Registry['auth.linkedin']['types'],
  },
  'auth.provider.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/auth/:provider/redirect',
    tokens: [{"old":"/api/v1/auth/:provider/redirect","type":0,"val":"api","end":""},{"old":"/api/v1/auth/:provider/redirect","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/:provider/redirect","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/:provider/redirect","type":1,"val":"provider","end":""},{"old":"/api/v1/auth/:provider/redirect","type":0,"val":"redirect","end":""}],
    types: placeholder as Registry['auth.provider.redirect']['types'],
  },
  'auth.provider.callback': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/auth/:provider/callback',
    tokens: [{"old":"/api/v1/auth/:provider/callback","type":0,"val":"api","end":""},{"old":"/api/v1/auth/:provider/callback","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/:provider/callback","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/:provider/callback","type":1,"val":"provider","end":""},{"old":"/api/v1/auth/:provider/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['auth.provider.callback']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/auth/me',
    tokens: [{"old":"/api/v1/auth/me","type":0,"val":"api","end":""},{"old":"/api/v1/auth/me","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/me","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'auth.profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/auth/profile',
    tokens: [{"old":"/api/v1/auth/profile","type":0,"val":"api","end":""},{"old":"/api/v1/auth/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/profile","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['auth.profile']['types'],
  },
  'auth.profile.update': {
    methods: ["PUT"],
    pattern: '/api/v1/auth/profile',
    tokens: [{"old":"/api/v1/auth/profile","type":0,"val":"api","end":""},{"old":"/api/v1/auth/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/profile","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['auth.profile.update']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/v1/auth/logout',
    tokens: [{"old":"/api/v1/auth/logout","type":0,"val":"api","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'account.profile': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['account.profile']['types'],
  },
  'account.profile.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['account.profile.update']['types'],
  },
  'account.logout': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['account.logout']['types'],
  },
  'communities.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/communities',
    tokens: [{"old":"/api/v1/communities","type":0,"val":"api","end":""},{"old":"/api/v1/communities","type":0,"val":"v1","end":""},{"old":"/api/v1/communities","type":0,"val":"communities","end":""}],
    types: placeholder as Registry['communities.index']['types'],
  },
  'communities.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/communities/:id',
    tokens: [{"old":"/api/v1/communities/:id","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['communities.show']['types'],
  },
  'communities.update': {
    methods: ["PUT"],
    pattern: '/api/v1/communities/:id',
    tokens: [{"old":"/api/v1/communities/:id","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['communities.update']['types'],
  },
  'communities.store': {
    methods: ["POST"],
    pattern: '/api/v1/communities',
    tokens: [{"old":"/api/v1/communities","type":0,"val":"api","end":""},{"old":"/api/v1/communities","type":0,"val":"v1","end":""},{"old":"/api/v1/communities","type":0,"val":"communities","end":""}],
    types: placeholder as Registry['communities.store']['types'],
  },
  'communities.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/communities/:id',
    tokens: [{"old":"/api/v1/communities/:id","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['communities.destroy']['types'],
  },
  'communities.join': {
    methods: ["POST"],
    pattern: '/api/v1/communities/:id/join',
    tokens: [{"old":"/api/v1/communities/:id/join","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/join","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/join","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/join","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/join","type":0,"val":"join","end":""}],
    types: placeholder as Registry['communities.join']['types'],
  },
  'communities.joinRequest.create': {
    methods: ["POST"],
    pattern: '/api/v1/communities/:id/join-request',
    tokens: [{"old":"/api/v1/communities/:id/join-request","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/join-request","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/join-request","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/join-request","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/join-request","type":0,"val":"join-request","end":""}],
    types: placeholder as Registry['communities.joinRequest.create']['types'],
  },
  'communities.joinRequests.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/communities/:id/join-requests',
    tokens: [{"old":"/api/v1/communities/:id/join-requests","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/join-requests","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/join-requests","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/join-requests","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/join-requests","type":0,"val":"join-requests","end":""}],
    types: placeholder as Registry['communities.joinRequests.index']['types'],
  },
  'communities.joinRequests.respond': {
    methods: ["POST"],
    pattern: '/api/v1/communities/:id/join-requests/:requestId/respond',
    tokens: [{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":0,"val":"join-requests","end":""},{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":1,"val":"requestId","end":""},{"old":"/api/v1/communities/:id/join-requests/:requestId/respond","type":0,"val":"respond","end":""}],
    types: placeholder as Registry['communities.joinRequests.respond']['types'],
  },
  'communities.addMemberByUsername': {
    methods: ["POST"],
    pattern: '/api/v1/communities/:id/add-member',
    tokens: [{"old":"/api/v1/communities/:id/add-member","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/add-member","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/add-member","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/add-member","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/add-member","type":0,"val":"add-member","end":""}],
    types: placeholder as Registry['communities.addMemberByUsername']['types'],
  },
  'communities.leave.post': {
    methods: ["POST"],
    pattern: '/api/v1/communities/:id/leave',
    tokens: [{"old":"/api/v1/communities/:id/leave","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/leave","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/leave","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/leave","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/leave","type":0,"val":"leave","end":""}],
    types: placeholder as Registry['communities.leave.post']['types'],
  },
  'communities.leave.delete': {
    methods: ["DELETE"],
    pattern: '/api/v1/communities/:id/leave',
    tokens: [{"old":"/api/v1/communities/:id/leave","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/leave","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/leave","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/leave","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/leave","type":0,"val":"leave","end":""}],
    types: placeholder as Registry['communities.leave.delete']['types'],
  },
  'communities.members': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/communities/:id/members',
    tokens: [{"old":"/api/v1/communities/:id/members","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/members","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/members","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/members","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['communities.members']['types'],
  },
  'communities.kickMember': {
    methods: ["DELETE"],
    pattern: '/api/v1/communities/:id/members/:userId',
    tokens: [{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"members","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":1,"val":"userId","end":""}],
    types: placeholder as Registry['communities.kickMember']['types'],
  },
  'communities.updateMemberRole': {
    methods: ["PUT"],
    pattern: '/api/v1/communities/:id/members/:userId',
    tokens: [{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":0,"val":"members","end":""},{"old":"/api/v1/communities/:id/members/:userId","type":1,"val":"userId","end":""}],
    types: placeholder as Registry['communities.updateMemberRole']['types'],
  },
  'communities.updateMemberRoleExplicit': {
    methods: ["PUT"],
    pattern: '/api/v1/communities/:id/members/:userId/role',
    tokens: [{"old":"/api/v1/communities/:id/members/:userId/role","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/members/:userId/role","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/members/:userId/role","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/members/:userId/role","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/members/:userId/role","type":0,"val":"members","end":""},{"old":"/api/v1/communities/:id/members/:userId/role","type":1,"val":"userId","end":""},{"old":"/api/v1/communities/:id/members/:userId/role","type":0,"val":"role","end":""}],
    types: placeholder as Registry['communities.updateMemberRoleExplicit']['types'],
  },
  'channels.store': {
    methods: ["POST"],
    pattern: '/api/v1/communities/:id/channels',
    tokens: [{"old":"/api/v1/communities/:id/channels","type":0,"val":"api","end":""},{"old":"/api/v1/communities/:id/channels","type":0,"val":"v1","end":""},{"old":"/api/v1/communities/:id/channels","type":0,"val":"communities","end":""},{"old":"/api/v1/communities/:id/channels","type":1,"val":"id","end":""},{"old":"/api/v1/communities/:id/channels","type":0,"val":"channels","end":""}],
    types: placeholder as Registry['channels.store']['types'],
  },
  'channels.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/channels/:id',
    tokens: [{"old":"/api/v1/channels/:id","type":0,"val":"api","end":""},{"old":"/api/v1/channels/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/:id","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['channels.destroy']['types'],
  },
  'messages.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels/:id/messages',
    tokens: [{"old":"/api/v1/channels/:id/messages","type":0,"val":"api","end":""},{"old":"/api/v1/channels/:id/messages","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/:id/messages","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/:id/messages","type":1,"val":"id","end":""},{"old":"/api/v1/channels/:id/messages","type":0,"val":"messages","end":""}],
    types: placeholder as Registry['messages.index']['types'],
  },
  'messages.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/messages',
    tokens: [{"old":"/api/v1/channels/:id/messages","type":0,"val":"api","end":""},{"old":"/api/v1/channels/:id/messages","type":0,"val":"v1","end":""},{"old":"/api/v1/channels/:id/messages","type":0,"val":"channels","end":""},{"old":"/api/v1/channels/:id/messages","type":1,"val":"id","end":""},{"old":"/api/v1/channels/:id/messages","type":0,"val":"messages","end":""}],
    types: placeholder as Registry['messages.store']['types'],
  },
  'messages.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/messages/:id',
    tokens: [{"old":"/api/v1/messages/:id","type":0,"val":"api","end":""},{"old":"/api/v1/messages/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/messages/:id","type":0,"val":"messages","end":""},{"old":"/api/v1/messages/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['messages.destroy']['types'],
  },
  'messages.react': {
    methods: ["POST"],
    pattern: '/api/v1/messages/:id/reactions',
    tokens: [{"old":"/api/v1/messages/:id/reactions","type":0,"val":"api","end":""},{"old":"/api/v1/messages/:id/reactions","type":0,"val":"v1","end":""},{"old":"/api/v1/messages/:id/reactions","type":0,"val":"messages","end":""},{"old":"/api/v1/messages/:id/reactions","type":1,"val":"id","end":""},{"old":"/api/v1/messages/:id/reactions","type":0,"val":"reactions","end":""}],
    types: placeholder as Registry['messages.react']['types'],
  },
  'uploads.store': {
    methods: ["POST"],
    pattern: '/api/v1/upload',
    tokens: [{"old":"/api/v1/upload","type":0,"val":"api","end":""},{"old":"/api/v1/upload","type":0,"val":"v1","end":""},{"old":"/api/v1/upload","type":0,"val":"upload","end":""}],
    types: placeholder as Registry['uploads.store']['types'],
  },
  'resources.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/resources',
    tokens: [{"old":"/api/v1/resources","type":0,"val":"api","end":""},{"old":"/api/v1/resources","type":0,"val":"v1","end":""},{"old":"/api/v1/resources","type":0,"val":"resources","end":""}],
    types: placeholder as Registry['resources.index']['types'],
  },
  'resources.store': {
    methods: ["POST"],
    pattern: '/api/v1/resources',
    tokens: [{"old":"/api/v1/resources","type":0,"val":"api","end":""},{"old":"/api/v1/resources","type":0,"val":"v1","end":""},{"old":"/api/v1/resources","type":0,"val":"resources","end":""}],
    types: placeholder as Registry['resources.store']['types'],
  },
  'resources.update': {
    methods: ["PUT"],
    pattern: '/api/v1/resources/:id',
    tokens: [{"old":"/api/v1/resources/:id","type":0,"val":"api","end":""},{"old":"/api/v1/resources/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/resources/:id","type":0,"val":"resources","end":""},{"old":"/api/v1/resources/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['resources.update']['types'],
  },
  'resources.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/resources/:id',
    tokens: [{"old":"/api/v1/resources/:id","type":0,"val":"api","end":""},{"old":"/api/v1/resources/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/resources/:id","type":0,"val":"resources","end":""},{"old":"/api/v1/resources/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['resources.destroy']['types'],
  },
  'resources.upvote': {
    methods: ["POST"],
    pattern: '/api/v1/resources/:id/upvote',
    tokens: [{"old":"/api/v1/resources/:id/upvote","type":0,"val":"api","end":""},{"old":"/api/v1/resources/:id/upvote","type":0,"val":"v1","end":""},{"old":"/api/v1/resources/:id/upvote","type":0,"val":"resources","end":""},{"old":"/api/v1/resources/:id/upvote","type":1,"val":"id","end":""},{"old":"/api/v1/resources/:id/upvote","type":0,"val":"upvote","end":""}],
    types: placeholder as Registry['resources.upvote']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
