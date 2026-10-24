/**
 * Give a fan admin rights, by display name:
 *   npm run db:make-admin -- "Display Name"
 * Sign in to the site once first so your account exists.
 */
import { eq } from 'drizzle-orm'
import { Pool } from 'pg'
import { databaseUrl } from './env'
import { createDb } from './index'
import { users } from './schema'

async function main() {
  const name = process.argv.slice(2).join(' ').trim()
  if (!name) throw new Error('Usage: npm run db:make-admin -- "Display Name"')

  const pool = new Pool({ connectionString: databaseUrl() })
  try {
    const db = createDb(pool)
    const matches = await db.select({ id: users.id, provider: users.authProvider }).from(users).where(eq(users.displayName, name))
    if (matches.length === 0) throw new Error(`No fan called "${name}". Sign in once, then check your display name on /profile.`)
    if (matches.length > 1) throw new Error(`${matches.length} fans are called "${name}". Rename yours on /profile to something unique first.`)

    await db.update(users).set({ isAdmin: true }).where(eq(users.id, matches[0].id))
    console.log(`"${name}" (${matches[0].provider}) is now an admin. Reload the site to see the Admin link.`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
