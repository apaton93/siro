import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { databaseUrl } from './env'

export * from './schema'
export { schema }

/** Create a Drizzle client. Pass an existing pg Pool to share connections (e.g. in the API). */
export function createDb(pool: Pool = new Pool({ connectionString: databaseUrl(), max: 5 })) {
  return drizzle(pool, { schema })
}

export type Db = ReturnType<typeof createDb>
