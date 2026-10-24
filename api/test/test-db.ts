/**
 * In-memory Postgres + PostGIS for tests (PGlite – real Postgres compiled to WebAssembly).
 * Applies the same SQL migrations as production, then loads the dev seed.
 */
import { PGlite } from '@electric-sql/pglite'
import { postgis } from '@electric-sql/pglite-postgis'
import { schema } from '@siro/db'
import { seed } from '@siro/db/src/seed-data'
import { drizzle } from 'drizzle-orm/pglite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Db } from '../src/db'

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'db', 'migrations')

export interface TestDb {
  db: Db
  pg: PGlite
}

export async function createTestDb(): Promise<TestDb> {
  const pg = new PGlite({ extensions: { postgis } })

  const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8')) as {
    entries: { tag: string }[]
  }
  for (const { tag } of journal.entries) {
    const migration = readFileSync(join(MIGRATIONS_DIR, `${tag}.sql`), 'utf8')
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) await pg.exec(statement)
    }
  }

  const db = drizzle(pg, { schema }) as unknown as Db
  await seed(db)
  return { db, pg }
}
