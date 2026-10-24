import { HttpRequest, InvocationContext } from '@azure/functions'
import { fixtures, teams } from '@siro/db'
import type { FixtureDetail, FixturesListResponse } from '@siro/shared'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { setDbForTests } from '../src/db'
import { fixtureDetail, fixturesList } from '../src/functions/fixtures'
import { createTestDb, type TestDb } from './test-db'

let t: TestDb
let fixtureId: string
let dundeeUnitedId: string

const get = (path: string, params: Record<string, string> = {}) =>
  new HttpRequest({ method: 'GET', url: `http://localhost/api/${path}`, params })

const ctx = () => new InvocationContext({ functionName: 'test' })

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)

  // The seed fixture has a fixed date; move it a week ahead so "upcoming" tests never go stale.
  const [f] = await t.db.select({ id: fixtures.id }).from(fixtures)
  fixtureId = f.id
  await t.db
    .update(fixtures)
    .set({ kickoffUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    .where(eq(fixtures.id, fixtureId))

  const [du] = await t.db.select({ id: teams.id }).from(teams).where(eq(teams.shortName, 'DU'))
  dundeeUnitedId = du.id
})

describe('GET /api/fixtures', () => {
  it('lists upcoming fixtures with teams, colours, city and counts', async () => {
    const res = await fixturesList(get('fixtures'), ctx())
    expect(res.status).toBe(200)

    const body = res.jsonBody as FixturesListResponse
    expect(body.fixtures).toHaveLength(1)

    const f = body.fixtures[0]
    expect(f.homeTeam.name).toBe('Barcelona')
    expect(f.awayTeam).toMatchObject({ name: 'Dundee United', primaryColour: '#F47920', onPrimaryColour: '#0B0B0C' })
    expect(f.competition.name).toBe('UEFA Europa League')
    expect(f.stadium.name).toBe('Camp Nou')
    expect(f.city).toMatchObject({ name: 'Barcelona', timezone: 'Europe/Madrid', photoUrl: null })
    expect(f.goingCount).toBe(0)
    expect(new Date(f.kickoffUtc).toISOString()).toBe(f.kickoffUtc)
  })

  it('is publicly cacheable', async () => {
    const res = await fixturesList(get('fixtures'), ctx())
    expect(res.headers).toMatchObject({ 'Cache-Control': 'public, max-age=60' })
  })

  it.each([
    ['team name', 'dundee', 1],
    ['city name', 'barcelona', 1],
    ['no match', 'celtic', 0],
    ['LIKE wildcards are treated literally', '%', 0],
  ])('searches by %s', async (_label, q, expected) => {
    const res = await fixturesList(get(`fixtures?q=${encodeURIComponent(q)}`), ctx())
    expect(res.status).toBe(200)
    expect((res.jsonBody as FixturesListResponse).fixtures).toHaveLength(expected)
  })

  it('filters by team', async () => {
    const res = await fixturesList(get(`fixtures?team=${dundeeUnitedId}`), ctx())
    expect((res.jsonBody as FixturesListResponse).fixtures).toHaveLength(1)

    const other = await fixturesList(get('fixtures?team=00000000-0000-4000-8000-000000000000'), ctx())
    expect((other.jsonBody as FixturesListResponse).fixtures).toHaveLength(0)
  })

  it('does not list past fixtures', async () => {
    await t.db
      .update(fixtures)
      .set({ kickoffUtc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
      .where(eq(fixtures.id, fixtureId))
    try {
      const res = await fixturesList(get('fixtures'), ctx())
      expect((res.jsonBody as FixturesListResponse).fixtures).toHaveLength(0)
    } finally {
      await t.db
        .update(fixtures)
        .set({ kickoffUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
        .where(eq(fixtures.id, fixtureId))
    }
  })

  it.each([
    ['team', 'fixtures?team=not-a-uuid'],
    ['competition', 'fixtures?competition=123'],
    ['q (too long)', `fixtures?q=${'x'.repeat(61)}`],
  ])('rejects an invalid %s with 400', async (_label, path) => {
    const res = await fixturesList(get(path), ctx())
    expect(res.status).toBe(400)
  })
})

describe('GET /api/fixtures/{id}', () => {
  it('returns the full fixture page data', async () => {
    const res = await fixtureDetail(get(`fixtures/${fixtureId}`, { id: fixtureId }), ctx())
    expect(res.status).toBe(200)

    const f = res.jsonBody as FixtureDetail
    expect(f.id).toBe(fixtureId)
    expect(f.stage).toBe('League phase')
    expect(f.city).toMatchObject({ name: 'Barcelona', currency: 'EUR', language: 'Catalan, Spanish' })
    expect(f.stadium.lat).toBeCloseTo(41.3809, 3)
    expect(f.stadium.lng).toBeCloseTo(2.1228, 3)
    expect(f.threadCount).toBe(0)
  })

  it('lists nearby airports nearest first, with distance in km', async () => {
    const res = await fixtureDetail(get(`fixtures/${fixtureId}`, { id: fixtureId }), ctx())
    const { airports } = res.jsonBody as FixtureDetail

    // Dundee airport is ~1,500 km away, so only Barcelona's two airports are listed.
    expect(airports.map((a) => a.iata)).toEqual(['BCN', 'GRO'])
    expect(airports[0].distanceKm).toBeCloseTo(9.8, 0)
    expect(airports[1].distanceKm).toBeCloseTo(78.5, 0)
  })

  it('returns fixture-specific guide sections before the city guide', async () => {
    const res = await fixtureDetail(get(`fixtures/${fixtureId}`, { id: fixtureId }), ctx())
    const { guideSections } = res.jsonBody as FixtureDetail

    expect(guideSections).toHaveLength(4)
    expect(guideSections[0]).toMatchObject({ scope: 'fixture', title: 'Matchday travel' })
    expect(guideSections.slice(1).map((s) => s.scope)).toEqual(['city', 'city', 'city'])
    expect(guideSections.slice(1).map((s) => s.title)).toEqual(['Basics', 'Getting to the stadium', 'Safety'])
  })

  it('returns 404 for an unknown fixture', async () => {
    const id = '00000000-0000-4000-8000-000000000000'
    const res = await fixtureDetail(get(`fixtures/${id}`, { id }), ctx())
    expect(res.status).toBe(404)
  })

  it('returns 400 for an invalid id', async () => {
    const res = await fixtureDetail(get('fixtures/abc', { id: 'abc' }), ctx())
    expect(res.status).toBe(400)
  })
})
