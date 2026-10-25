import { HttpRequest, InvocationContext } from '@azure/functions'
import { competitions, fixtures, teams } from '@siro/db'
import { importUcl } from '@siro/db/src/ucl/import'
import type { CompetitionsListResponse, FixturesListResponse } from '@siro/shared'
import { eq, inArray, sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { setDbForTests } from '../src/db'
import { competitionsList, fixturesList } from '../src/functions/fixtures'
import { createTestDb, type TestDb } from './test-db'

let t: TestDb
const ids: Record<string, string> = {}

const ctx = () => new InvocationContext({ functionName: 'test' })
const list = async (query: string) => {
  const res = await fixturesList(new HttpRequest({ method: 'GET', url: `http://localhost/api/fixtures?${query}` }), ctx())
  return { status: res.status, fixtures: (res.jsonBody as FixturesListResponse).fixtures }
}

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  await importUcl(t.db)
  // Keep "upcoming" tests from going stale: move unplayed games into the future, in order.
  await t.db.execute(sql`update fixtures set kickoff_utc = kickoff_utc + (now() - timestamptz '2026-10-25') where status = 'scheduled'`)
  for (const name of ['Liverpool', 'Aston Villa', 'Barcelona']) {
    ;[{ id: ids[name] }] = await t.db.select({ id: teams.id }).from(teams).where(eq(teams.name, name))
  }
})

describe('GET /api/competitions', () => {
  it('lists coded competitions with upcoming counts', async () => {
    const res = await competitionsList(new HttpRequest({ method: 'GET', url: 'http://localhost/api/competitions' }), ctx())
    const body = res.jsonBody as CompetitionsListResponse
    expect(body.competitions).toEqual([
      expect.objectContaining({ code: 'UCL', name: 'UEFA Champions League', upcomingCount: 90 }),
      expect.objectContaining({ code: 'UEL', upcomingCount: 0 }),
    ])
  })
})

describe('GET /api/fixtures filters', () => {
  it('lists a whole competition by code, soonest first', async () => {
    const { fixtures: all } = await list('competition=ucl')
    expect(all).toHaveLength(90)
    expect(all.every((f) => f.competition.code === 'UCL' && f.status === 'scheduled')).toBe(true)
    const times = all.map((f) => f.kickoffUtc)
    expect(times).toEqual([...times].sort())
  })

  it('filters by several teams', async () => {
    const { fixtures: mine } = await list(`teams=${ids.Liverpool},${ids['Aston Villa']}`)
    expect(mine).toHaveLength(10) // 5 unplayed each, none against each other
    expect(mine.every((f) => [f.homeTeam.id, f.awayTeam.id].some((id) => id === ids.Liverpool || id === ids['Aston Villa']))).toBe(true)
  })

  it('returns recent results, most recent first', async () => {
    const { fixtures: results } = await list(`teams=${ids.Barcelona}&when=results`)
    expect(results.map((f) => [f.homeTeam.name, f.awayTeam.name, f.homeScore, f.awayScore])).toEqual([
      ['Paris Saint-Germain', 'Barcelona', 4, 2],
      ['Galatasaray', 'Barcelona', 1, 4],
      ['Barcelona', 'Feyenoord', 5, 1],
    ])
  })

  it('caps results at 10', async () => {
    expect((await list('when=results')).fixtures).toHaveLength(10)
  })

  it('rejects bad filters', async () => {
    expect((await list('teams=abc')).status).toBe(400)
    expect((await list(`teams=${Array(6).fill(ids.Liverpool).map((_, i) => ids.Liverpool.slice(0, -1) + i).join(',')}`)).status).toBe(400)
    expect((await list('competition=12345678')).status).toBe(400)
    expect((await list('when=soon')).status).toBe(400)
  })

  it('uses competition codes from the database', async () => {
    const [uel] = await t.db.select().from(competitions).where(eq(competitions.code, 'UEL'))
    expect(uel.name).toBe('UEFA Europa League')
    const finished = await t.db.select().from(fixtures).where(inArray(fixtures.status, ['finished']))
    expect(finished).toHaveLength(54)
  })
})
