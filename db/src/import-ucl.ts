/**
 * Add the Champions League 2026/27 league phase (36 clubs, 144 matches). Safe to re-run.
 *   npm run db:import-ucl
 * Set DATABASE_URL first to run it against production.
 */
import { Pool } from 'pg'
import { databaseUrl } from './env'
import { createDb } from './index'
import { importUcl } from './ucl/import'

async function main() {
  const url = databaseUrl()
  const pool = new Pool({ connectionString: url })
  try {
    const c = await importUcl(createDb(pool))
    console.log(`Imported into ${new URL(url).hostname}:`)
    console.log(`  added ${c.fixtures} fixtures, ${c.teams} teams, ${c.stadiums} stadiums, ${c.cities} cities, ${c.airports} airports`)
    console.log(c.exampleFixtureRemoved ? '  removed the example Barcelona v Dundee United fixture' : '  example fixture already gone')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  const cause = (err as { cause?: unknown })?.cause
  console.error(err instanceof Error ? err.message : err)
  if (cause) console.error('Cause:', cause instanceof Error ? cause.message : cause)
  process.exit(1)
})
