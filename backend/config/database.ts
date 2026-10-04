import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const requestedConn = env.get('DB_CONNECTION')
const hasPgAuth = Boolean(env.get('DB_URL') || env.get('DB_PASSWORD'))
const defaultConn = (requestedConn === 'pg' && !hasPgAuth) ? 'sqlite' : (requestedConn || 'sqlite')

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: defaultConn,

  connections: {
    /**
     * SQLite connection.
     */
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
    },

    /**
     * Supabase PostgreSQL connection.
     */
    pg: {
      client: 'pg',
      connection: env.get('DB_URL')
        ? {
            connectionString: env.get('DB_URL'),
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: env.get('DB_HOST') || 'db.leowjdfbufhnbgkttxrg.supabase.co',
            port: env.get('DB_PORT') || 5432,
            user: env.get('DB_USER') || 'postgres',
            password: env.get('DB_PASSWORD') || 'placeholder_password',
            database: env.get('DB_DATABASE') || 'postgres',
            ssl: { rejectUnauthorized: false },
          },
      pool: {
        min: 0,
        max: 20,
        idleTimeoutMillis: 30000,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig
