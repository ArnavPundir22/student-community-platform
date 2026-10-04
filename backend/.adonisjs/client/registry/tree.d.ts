/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  uploads: {
    show: typeof routes['uploads.show']
    store: typeof routes['uploads.store']
  }
  auth: {
    signup: typeof routes['auth.signup']
    login: typeof routes['auth.login']
    oauth: typeof routes['auth.oauth']
    google: typeof routes['auth.google']
    github: typeof routes['auth.github']
    linkedin: typeof routes['auth.linkedin']
    provider: {
      redirect: typeof routes['auth.provider.redirect']
      callback: typeof routes['auth.provider.callback']
    }
    me: typeof routes['auth.me']
    profile: typeof routes['auth.profile'] & {
      update: typeof routes['auth.profile.update']
    }
    logout: typeof routes['auth.logout']
  }
  account: {
    profile: typeof routes['account.profile'] & {
      update: typeof routes['account.profile.update']
    }
    logout: typeof routes['account.logout']
  }
  communities: {
    index: typeof routes['communities.index']
    show: typeof routes['communities.show']
    update: typeof routes['communities.update']
    store: typeof routes['communities.store']
    destroy: typeof routes['communities.destroy']
    join: typeof routes['communities.join']
    joinRequest: {
      create: typeof routes['communities.joinRequest.create']
    }
    joinRequests: {
      index: typeof routes['communities.joinRequests.index']
      respond: typeof routes['communities.joinRequests.respond']
    }
    addMemberByUsername: typeof routes['communities.addMemberByUsername']
    leave: {
      post: typeof routes['communities.leave.post']
      delete: typeof routes['communities.leave.delete']
    }
    members: typeof routes['communities.members']
    kickMember: typeof routes['communities.kickMember']
    updateMemberRole: typeof routes['communities.updateMemberRole']
    updateMemberRoleExplicit: typeof routes['communities.updateMemberRoleExplicit']
  }
  channels: {
    store: typeof routes['channels.store']
    destroy: typeof routes['channels.destroy']
  }
  messages: {
    index: typeof routes['messages.index']
    store: typeof routes['messages.store']
    destroy: typeof routes['messages.destroy']
    react: typeof routes['messages.react']
  }
  resources: {
    index: typeof routes['resources.index']
    store: typeof routes['resources.store']
    update: typeof routes['resources.update']
    destroy: typeof routes['resources.destroy']
    upvote: typeof routes['resources.upvote']
  }
}
