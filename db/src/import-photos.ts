/**
 * Add Wikimedia Commons photos to cities that don't have one yet. Never replaces a photo
 * chosen in /admin, so it's safe to re-run.
 *   npm run db:import-photos
 */
import { Pool } from 'pg'
import { databaseUrl } from './env'
import { createDb } from './index'
import { applyCityPhotos } from './photos/apply'
import { CITY_PHOTOS } from './photos/city-photos'

async function main() {
  const url = databaseUrl()
  const pool = new Pool({ connectionString: url })
  try {
    const updated = await applyCityPhotos(createDb(pool))
    console.log(`Added photos to ${updated} cities on ${new URL(url).hostname} (${CITY_PHOTOS.length} available).`)
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
