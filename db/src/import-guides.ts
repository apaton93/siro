/**
 * Add city guides (travel, areas, matchday tips, things to do) and stadium notes
 * (getting there, away fans). Only fills gaps – never overwrites /admin edits.
 *   npm run db:import-guides
 */
import { Pool } from 'pg'
import { databaseUrl } from './env'
import { applyGuides } from './guides/apply'
import { createDb } from './index'

async function main() {
  const url = databaseUrl()
  const pool = new Pool({ connectionString: url })
  try {
    const c = await applyGuides(createDb(pool))
    console.log(`Guides on ${new URL(url).hostname}: added ${c.sections} sections, updated ${c.stadiums} stadiums, removed ${c.seedRemoved} old placeholders.`)
    if (c.missingCities.length) console.log(`  cities not found (run db:import-ucl first?): ${c.missingCities.join(', ')}`)
    if (c.missingStadiums.length) console.log(`  stadiums not found: ${c.missingStadiums.join(', ')}`)
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
