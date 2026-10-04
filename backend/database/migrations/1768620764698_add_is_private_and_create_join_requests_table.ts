import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('communities', (table) => {
      table.boolean('is_private').notNullable().defaultTo(false)
    })

    this.schema.createTable('community_join_requests', (table) => {
      table.increments('id').notNullable()
      table.integer('community_id').unsigned().references('id').inTable('communities').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('pending')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('community_join_requests')
    this.schema.alterTable('communities', (table) => {
      table.dropColumn('is_private')
    })
  }
}
