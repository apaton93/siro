import { createDb, schema } from '@siro/db'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

/** Any Drizzle Postgres database using the Siro schema (node-postgres in Azure, PGlite in tests). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

let pool: Pool | undefined
let db: Db | undefined

/**
 * One shared connection pool per Functions instance.
 * Connection string comes from DATABASE_URL (local.settings.json locally, app settings in Azure).
 *
 * Timeouts are deliberately short: if the database is unreachable (e.g. firewall), requests
 * fail fast with a 503 instead of hanging until Static Web Apps returns "Backend call failure".
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5_000, // give up connecting after 5s
      idleTimeoutMillis: 30_000, // release idle connections between invocations
      query_timeout: 10_000, // client-side cap on any single query
      statement_timeout: 10_000, // server-side cap on any single statement
    })
    // An idle client erroring (e.g. server restart) must not crash the Functions host.
    pool.on('error', (err) => console.error('Postgres pool error', err))
  }
  return pool
}

/** Shared Drizzle client for function handlers. */
export function getDb(): Db {
  if (!db) {
    db = createDb(getPool())
  }
  return db
}

/** Tests only: swap in another database (e.g. in-memory PGlite). */
export function setDbForTests(testDb: Db): void {
  db = testDb
}
