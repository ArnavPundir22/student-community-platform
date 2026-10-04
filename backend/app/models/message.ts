import { MessageSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type * as Relations from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import User from './user.js'

export default class Message extends MessageSchema {
  declare reactions: string | null

  @belongsTo(() => Channel, { foreignKey: 'channelId' })
  declare channel: Relations.BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: Relations.BelongsTo<typeof User>

  @hasMany(() => Message, { foreignKey: 'parentId' })
  declare replies: Relations.HasMany<typeof Message>
}
