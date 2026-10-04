import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('username').nullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('avatar_url').nullable()
      table.string('domain_interests').nullable()
      table.string('bio').nullable()
      table.string('status').defaultTo('online')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
