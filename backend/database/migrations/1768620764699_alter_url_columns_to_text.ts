import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('communities', (table) => {
      table.text('icon_url').nullable().alter()
    })

    this.schema.alterTable('users', (table) => {
      table.text('avatar_url').nullable().alter()
    })

    this.schema.alterTable('resources', (table) => {
      table.text('url').notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable('communities', (table) => {
      table.string('icon_url').nullable().alter()
    })

    this.schema.alterTable('users', (table) => {
      table.string('avatar_url').nullable().alter()
    })

    this.schema.alterTable('resources', (table) => {
      table.string('url').notNullable().alter()
    })
  }
}
