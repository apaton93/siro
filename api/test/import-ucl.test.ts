import { competitions, fixtures, teams } from '@siro/db'
import { cetToUtc, importUcl } from '@siro/db/src/ucl/import'
import { AIRPORTS, CITIES, FIXTURES, STADIUMS, TEAMS, type TeamKey } from '@siro/db/src/ucl/ucl-2026-27'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { getFixture } from '../src/fixtures/queries'
import { createTestDb, type TestDb } from './test-db'

/** Great-circle distance in km. */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

describe('Champions League 2026/27 data', () => {
  const keys = Object.keys(TEAMS) as TeamKey[]

  it('has 36 teams and 144 matches, 18 per matchday', () => {
    expect(keys).toHaveLength(36)
    expect(FIXTURES).toHaveLength(144)
  })

  it('has every team playing once per matchday, 4 home and 4 away, no repeat pairings', () => {
    for (let md = 0; md < 8; md++) {
      const teamsPlaying = FIXTURES.slice(md * 18, md * 18 + 18).flatMap(([, , h, a]) => [h, a])
      expect(new Set(teamsPlaying).size, `matchday ${md + 1}`).toBe(36)
    }
    for (const k of keys) {
      expect(FIXTURES.filter((f) => f[2] === k), `${k} home`).toHaveLength(4)
      expect(FIXTURES.filter((f) => f[3] === k), `${k} away`).toHaveLength(4)
    }
    const pairs = FIXTURES.map(([, , h, a]) => [h, a].sort().join('-'))
    expect(new Set(pairs).size).toBe(144)
  })

  it('has results only for matchdays 1–3', () => {
    FIXTURES.forEach((f, i) => expect(!!f[4], `row ${i}`).toBe(i < 54))
  })

  it('puts every stadium near its city and within 150 km of an airport', () => {
    for (const st of Object.values(STADIUMS)) {
      expect(km(st, CITIES[st.city]), st.name).toBeLessThan(15)
      const nearest = Math.min(...AIRPORTS.map((a) => km(st, a)))
      expect(nearest, st.name).toBeLessThan(150)
    }
  })

  it('uses valid colours and unique IATA codes', () => {
    for (const t of Object.values(TEAMS)) {
      expect(t.primaryColour, t.name).toMatch(/^#[0-9A-F]{6}$/)
      expect(t.onPrimaryColour, t.name).toMatch(/^#[0-9A-F]{6}$/)
    }
    expect(new Set(AIRPORTS.map((a) => a.iata)).size).toBe(AIRPORTS.length)
  })

  it('converts UEFA times to UTC across the clock change', () => {
    expect(cetToUtc('2026-09-08', '18:45').toISOString()).toBe('2026-09-08T16:45:00.000Z')
    expect(cetToUtc('2026-11-03', '21:00').toISOString()).toBe('2026-11-03T20:00:00.000Z')
    expect(cetToUtc('2027-01-27', '21:00').toISOString()).toBe('2027-01-27T20:00:00.000Z')
  })
})

describe('importUcl', () => {
  let t: TestDb

  beforeAll(async () => {
    t = await createTestDb()
  })

  it('adds everything, reuses seeded Barcelona and removes the example fixture', async () => {
    const counts = await importUcl(t.db)
    expect(counts).toMatchObject({ fixtures: 144, teams: 35, exampleFixtureRemoved: true })
    expect(await t.db.select().from(teams).where(eq(teams.name, 'Barcelona'))).toHaveLength(1)

    const [ucl] = await t.db.select().from(competitions).where(eq(competitions.name, 'UEFA Champions League'))
    const all = await t.db.select().from(fixtures)
    expect(all).toHaveLength(144)
    expect(all.every((f) => f.competitionId === ucl.id)).toBe(true)
    expect(all.filter((f) => f.status === 'finished')).toHaveLength(54)
  })

  it('is safe to re-run', async () => {
    expect(await importUcl(t.db)).toEqual({
      cities: 0,
      stadiums: 0,
      teams: 0,
      airports: 0,
      fixtures: 0,
      exampleFixtureRemoved: false,
    })
  })

  it('shows Shakhtar home games at Stamford Bridge with London airports', async () => {
    const [shakhtar] = await t.db.select().from(teams).where(eq(teams.name, 'Shakhtar Donetsk'))
    const [home] = await t.db.select().from(fixtures).where(eq(fixtures.homeTeamId, shakhtar.id)).limit(1)
    const detail = (await getFixture(t.db, home.id))!
    expect(detail.stadium.name).toBe('Stamford Bridge')
    expect(detail.city.name).toBe('London')
    expect(detail.airports.map((a) => a.iata)).toContain('LHR')
  })
})
