import { Pool } from 'pg'

let pool: Pool | undefined

/**
 * One shared connection pool per Functions instance.
 * Connection string comes from DATABASE_URL (local.settings.json locally, app settings in Azure).
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    pool = new Pool({ connectionString, max: 5 })
  }
  return pool
}
