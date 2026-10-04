import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'uploads.show': { paramsTuple: [ParamValue]; params: {'fileName': ParamValue} }
    'auth.signup': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.oauth': { paramsTuple?: []; params?: {} }
    'auth.google': { paramsTuple?: []; params?: {} }
    'auth.github': { paramsTuple?: []; params?: {} }
    'auth.linkedin': { paramsTuple?: []; params?: {} }
    'auth.provider.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.provider.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'auth.profile.update': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'communities.index': { paramsTuple?: []; params?: {} }
    'communities.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.store': { paramsTuple?: []; params?: {} }
    'communities.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.join': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequest.create': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequests.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequests.respond': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'requestId': ParamValue} }
    'communities.addMemberByUsername': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.leave.post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.leave.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.kickMember': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'communities.updateMemberRole': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'communities.updateMemberRoleExplicit': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'channels.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.react': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'uploads.store': { paramsTuple?: []; params?: {} }
    'resources.index': { paramsTuple?: []; params?: {} }
    'resources.store': { paramsTuple?: []; params?: {} }
    'resources.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'resources.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'resources.upvote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'uploads.show': { paramsTuple: [ParamValue]; params: {'fileName': ParamValue} }
    'auth.provider.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.provider.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'communities.index': { paramsTuple?: []; params?: {} }
    'communities.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequests.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'resources.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'uploads.show': { paramsTuple: [ParamValue]; params: {'fileName': ParamValue} }
    'auth.provider.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.provider.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.profile': { paramsTuple?: []; params?: {} }
    'account.profile': { paramsTuple?: []; params?: {} }
    'communities.index': { paramsTuple?: []; params?: {} }
    'communities.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequests.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'resources.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.signup': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.oauth': { paramsTuple?: []; params?: {} }
    'auth.google': { paramsTuple?: []; params?: {} }
    'auth.github': { paramsTuple?: []; params?: {} }
    'auth.linkedin': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'account.logout': { paramsTuple?: []; params?: {} }
    'communities.store': { paramsTuple?: []; params?: {} }
    'communities.join': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequest.create': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.joinRequests.respond': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'requestId': ParamValue} }
    'communities.addMemberByUsername': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.leave.post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.react': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'uploads.store': { paramsTuple?: []; params?: {} }
    'resources.store': { paramsTuple?: []; params?: {} }
    'resources.upvote': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'auth.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'communities.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.updateMemberRole': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'communities.updateMemberRoleExplicit': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'resources.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'communities.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.leave.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'communities.kickMember': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'resources.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}