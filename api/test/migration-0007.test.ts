import { PGlite } from '@electric-sql/pglite'
import { postgis } from '@electric-sql/pglite-postgis'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const DIR = join(__dirname, '..', '..', 'db', 'migrations')
const run = async (pg: PGlite, tag: string) => {
  for (const statement of readFileSync(join(DIR, `${tag}.sql`), 'utf8').split('--> statement-breakpoint')) {
    if (statement.trim()) await pg.exec(statement)
  }
}

it('0007 numbers existing duplicate names (ignoring case) before making names unique', async () => {
  const pg = new PGlite({ extensions: { postgis } })
  const { entries } = JSON.parse(readFileSync(join(DIR, 'meta', '_journal.json'), 'utf8')) as { entries: { tag: string }[] }
  const before = entries.filter((e) => e.tag < '0007')
  for (const { tag } of before) await run(pg, tag)

  await pg.exec(`
    INSERT INTO users (auth_provider, auth_user_id, display_name, created_at) VALUES
      ('github', 'a', 'Andy', '2026-01-01'), ('aad', 'b', 'andy', '2026-02-01'),
      ('github', 'c', 'ANDY', '2026-03-01'), ('github', 'd', 'Solo', '2026-01-01')`)
  await run(pg, entries.find((e) => e.tag.startsWith('0007'))!.tag)

  const { rows } = await pg.query<{ auth_user_id: string; display_name: string }>(
    'SELECT auth_user_id, display_name FROM users ORDER BY auth_user_id',
  )
  expect(rows.map((r) => r.display_name)).toEqual(['Andy', 'andy 2', 'ANDY 3', 'Solo'])
  await expect(pg.exec(`INSERT INTO users (auth_provider, auth_user_id, display_name) VALUES ('github', 'e', 'SOLO')`)).rejects.toThrow(
    /users_display_name_uq/,
  )
})
