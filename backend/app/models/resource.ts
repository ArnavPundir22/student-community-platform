import { ResourceSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type * as Relations from '@adonisjs/lucid/types/relations'
import Community from './community.js'
import User from './user.js'

export default class Resource extends ResourceSchema {
  @belongsTo(() => Community, { foreignKey: 'communityId' })
  declare community: Relations.BelongsTo<typeof Community>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: Relations.BelongsTo<typeof User>
}
