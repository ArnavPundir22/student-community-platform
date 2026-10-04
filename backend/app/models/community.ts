import { CommunitySchema } from '#database/schema'
import { belongsTo, hasMany, computed } from '@adonisjs/lucid/orm'
import type * as Relations from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Channel from './channel.js'
import CommunityMember from './community_member.js'

export default class Community extends CommunitySchema {
  @computed()
  get owner_id() {
    return this.ownerId
  }

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: Relations.BelongsTo<typeof User>

  @hasMany(() => Channel, { foreignKey: 'communityId' })
  declare channels: Relations.HasMany<typeof Channel>

  @hasMany(() => CommunityMember, { foreignKey: 'communityId' })
  declare members: Relations.HasMany<typeof CommunityMember>
}
