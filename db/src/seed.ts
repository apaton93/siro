import { Pool } from 'pg'
import { createDb } from './index'
import { databaseUrl } from './env'
import { seed } from './seed-data'

async function main() {
  const url = databaseUrl()
  const host = new URL(url).hostname
  const isLocal = host === '127.0.0.1' || host === 'localhost'

  // The seed wipes every table – never run it against Azure by accident.
  if (!isLocal && process.env.SEED_ALLOW_REMOTE !== '1') {
    throw new Error(`Refusing to seed non-local database "${host}". Set SEED_ALLOW_REMOTE=1 to override.`)
  }

  const pool = new Pool({ connectionString: url })
  try {
    await seed(createDb(pool))
    console.log(`Seeded ${host}: Barcelona v Dundee United (fictional) + reference data`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
