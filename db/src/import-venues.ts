/**
 * Add starter pubs and bars (from away-fan guides) to the map. Insert-only, so it never
 * touches venues edited, approved or rejected in /admin – safe to re-run.
 *   npm run db:import-venues
 */
import { Pool } from 'pg'
import { databaseUrl } from './env'
import { createDb } from './index'
import { applyStarterVenues } from './venues/apply'
import { STARTER_VENUES } from './venues/starter-venues'

async function main() {
  const url = databaseUrl()
  const pool = new Pool({ connectionString: url })
  try {
    const c = await applyStarterVenues(createDb(pool))
    console.log(`Added ${c.added} of ${STARTER_VENUES.length} starter venues on ${new URL(url).hostname}.`)
    if (c.missingCities.length) console.log(`Skipped – city not in the database: ${c.missingCities.join(', ')}`)
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
