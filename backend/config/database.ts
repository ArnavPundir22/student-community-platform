import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const requestedConn = env.get('DB_CONNECTION')
const hasPgAuth = Boolean(env.get('DB_URL') || env.get('DB_PASSWORD'))
const defaultConn = (requestedConn === 'pg' && !hasPgAuth) ? 'sqlite' : (requestedConn || 'sqlite')

const rawDbUrl = env.get('DB_URL')
const rawDbHost = env.get('DB_HOST')

const sanitizeDbHost = (host: string | undefined): string => {
  if (!host || (host.includes('db.') && host.includes('.supabase.co'))) {
    return 'aws-0-ap-south-1.pooler.supabase.com'
  }
  return host
}

const sanitizeDbUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined
  if (url.includes('db.') && url.includes('.supabase.co')) {
    let cleanUrl = url.replace(/db\.[a-z0-9]+\.supabase\.co/g, 'aws-0-ap-south-1.pooler.supabase.com')
    if (cleanUrl.includes(':5432')) {
      cleanUrl = cleanUrl.replace(':5432', ':6543')
    }
    return cleanUrl
  }
  return url
}

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
      connection: rawDbUrl
        ? {
            connectionString: sanitizeDbUrl(rawDbUrl),
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: sanitizeDbHost(rawDbHost),
            port: (rawDbHost && rawDbHost.includes('db.') && rawDbHost.includes('.supabase.co')) ? 6543 : (env.get('DB_PORT') || 6543),
            user: env.get('DB_USER') || 'postgres.leowjdfbufhnbgkttxrg',
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
