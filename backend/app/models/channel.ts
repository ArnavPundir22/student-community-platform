import { ChannelSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type * as Relations from '@adonisjs/lucid/types/relations'
import Community from './community.js'
import Message from './message.js'

export default class Channel extends ChannelSchema {
  @belongsTo(() => Community, { foreignKey: 'communityId' })
  declare community: Relations.BelongsTo<typeof Community>

  @hasMany(() => Message, { foreignKey: 'channelId' })
  declare messages: Relations.HasMany<typeof Message>
}
