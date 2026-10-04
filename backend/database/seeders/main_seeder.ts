import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    // Completely wipe all database tables for a clean zero-data state
    await db.rawQuery('DELETE FROM messages')
    await db.rawQuery('DELETE FROM channels')
    await db.rawQuery('DELETE FROM community_members')
    await db.rawQuery('DELETE FROM resources')
    await db.rawQuery('DELETE FROM communities')
    await db.rawQuery('DELETE FROM users')

    try {
      await db.rawQuery(
        "DELETE FROM sqlite_sequence WHERE name IN ('users', 'communities', 'community_members', 'channels', 'messages', 'resources')"
      )
    } catch {}
  }
}
