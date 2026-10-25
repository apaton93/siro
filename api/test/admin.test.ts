import { HttpRequest, InvocationContext } from '@azure/functions'
import { users } from '@siro/db'
import type { AdminReference, AdminSaveResponse, FixtureDetail, FixturesListResponse } from '@siro/shared'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { encodeClientPrincipal } from '../src/auth'
import { setDbForTests } from '../src/db'
import { adminCreate, adminDelete, adminReference, adminUpdate } from '../src/functions/admin'
import { fixtureDetail, fixturesList } from '../src/functions/fixtures'
import { meGet } from '../src/functions/me'
import { createTestDb, type TestDb } from './test-db'

let t: TestDb
let ref: AdminReference

const ctx = () => new InvocationContext({ functionName: 'test' })
type Fan = { provider: 'github' | 'aad'; userId: string; userDetails: string }
const admin: Fan = { provider: 'github', userId: 'admin-1', userDetails: 'siro_admin' }
const fan: Fan = { provider: 'github', userId: 'fan-1', userDetails: 'just_a_fan' }

function req(method: string, params: Record<string, string>, opts: { as?: Fan; body?: unknown } = {}) {
  const headers: Record<string, string> = {}
  if (opts.as) headers['x-ms-client-principal'] = encodeClientPrincipal(opts.as)
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  return new HttpRequest({
    method,
    url: `http://localhost/api/manage/${Object.values(params).join('/')}`,
    headers,
    params,
    body: opts.body === undefined ? undefined : { string: JSON.stringify(opts.body) },
  })
}

const create = (entity: string, body: unknown, as: Fan = admin) => adminCreate(req('POST', { entity }, { as, body }), ctx())
const createdId = async (entity: string, body: unknown) => {
  const res = await create(entity, body)
  expect(res.status, JSON.stringify(res.jsonBody)).toBe(201)
  return (res.jsonBody as AdminSaveResponse).id
}

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  // Both accounts exist after their first visit; only one is promoted.
  await meGet(req('GET', {}, { as: admin }), ctx())
  await meGet(req('GET', {}, { as: fan }), ctx())
  await t.db.update(users).set({ isAdmin: true }).where(eq(users.authUserId, admin.userId))
  ref = (await adminReference(req('GET', {}, { as: admin }), ctx())).jsonBody as AdminReference
})

describe('access', () => {
  it('needs sign-in', async () => {
    expect((await adminReference(req('GET', {}), ctx())).status).toBe(401)
  })

  it('refuses fans who are not admins', async () => {
    expect((await adminReference(req('GET', {}, { as: fan }), ctx())).status).toBe(403)
    expect((await create('competitions', { name: 'X', type: 'club' }, fan)).status).toBe(403)
  })

  it('is never cached', async () => {
    const res = await adminReference(req('GET', {}, { as: admin }), ctx())
    expect((res.headers as Record<string, string>)['Cache-Control']).toBe('no-store')
  })
})

describe('reference', () => {
  it('returns the seeded data with coordinates', () => {
    expect(ref.competitions).toHaveLength(1)
    expect(ref.fixtures).toHaveLength(1)
    const barcelona = ref.cities.find((c) => c.name === 'Barcelona')!
    expect(barcelona.lat).toBeCloseTo(41.39, 1)
    expect(barcelona.lng).toBeCloseTo(2.17, 1)
    expect(ref.fixtures[0].kickoffUtc).toBe('2026-11-26T19:00:00.000Z')
  })
})

describe('adding a real fixture end to end', () => {
  let fixtureId: string

  it('creates city, stadium, teams, airport and fixture, and it shows on the public list', async () => {
    const competitionId = await createdId('competitions', { name: 'UEFA Conference League', type: 'club' })
    const cityId = await createdId('cities', {
      name: 'Liverpool',
      countryCode: 'gb',
      currency: 'gbp',
      language: 'English',
      timezone: 'Europe/London',
      lat: 53.4084,
      lng: -2.9916,
      photoUrl: '',
      photoCredit: '',
    })
    const stadiumId = await createdId('stadiums', { name: 'Goodison Park', cityId, capacity: 39414, lat: 53.4388, lng: -2.9663 })
    const evertonId = await createdId('teams', {
      name: 'Everton',
      shortName: 'EVE',
      type: 'club',
      countryCode: 'GB',
      cityId,
      homeStadiumId: stadiumId,
      primaryColour: '#003399',
      onPrimaryColour: '#ffffff',
    })
    await createdId('airports', { name: 'Liverpool John Lennon', iata: 'lpl', cityId, lat: 53.3336, lng: -2.8497 })
    const dundeeUnited = ref.teams.find((x) => x.shortName === 'DU')!

    fixtureId = await createdId('fixtures', {
      competitionId,
      stage: 'Round of 16',
      homeTeamId: evertonId,
      awayTeamId: dundeeUnited.id,
      stadiumId,
      kickoffUtc: '2027-03-11T20:00:00Z',
    })

    const list = (await fixturesList(new HttpRequest({ method: 'GET', url: 'http://localhost/api/fixtures' }), ctx()))
      .jsonBody as FixturesListResponse
    const added = list.fixtures.find((f) => f.id === fixtureId)!
    expect(added).toMatchObject({ stage: 'Round of 16', status: 'scheduled', homeTeam: { name: 'Everton', primaryColour: '#003399' } })
    expect(added.homeTeam.onPrimaryColour).toBe('#FFFFFF')

    const detail = (
      await fixtureDetail(new HttpRequest({ method: 'GET', url: 'http://localhost/api/fixtures/x', params: { id: fixtureId } }), ctx())
    ).jsonBody as FixtureDetail
    expect(detail.airports.map((a) => a.iata)).toContain('LPL')
  })

  it('updates the score after the game', async () => {
    const current = ((await adminReference(req('GET', {}, { as: admin }), ctx())).jsonBody as AdminReference).fixtures.find(
      (f) => f.id === fixtureId,
    )!
    const { id: _id, ...fields } = current
    const res = await adminUpdate(
      req('PUT', { entity: 'fixtures', id: fixtureId }, { as: admin, body: { ...fields, status: 'finished', homeScore: 1, awayScore: 2 } }),
      ctx(),
    )
    expect(res.status).toBe(200)
    const after = ((await adminReference(req('GET', {}, { as: admin }), ctx())).jsonBody as AdminReference).fixtures.find(
      (f) => f.id === fixtureId,
    )!
    expect(after).toMatchObject({ status: 'finished', homeScore: 1, awayScore: 2 })
  })

  it('adds and deletes a guide section, then deletes the fixture', async () => {
    const sectionId = await createdId('guide-sections', { fixtureId, type: 'transport', title: 'Getting there', content: 'Bus 19.' })
    expect((await adminDelete(req('DELETE', { entity: 'guide-sections', id: sectionId }, { as: admin }), ctx())).status).toBe(204)
    expect((await adminDelete(req('DELETE', { entity: 'fixtures', id: fixtureId }, { as: admin }), ctx())).status).toBe(204)
    expect((await adminDelete(req('DELETE', { entity: 'fixtures', id: fixtureId }, { as: admin }), ctx())).status).toBe(404)
  })
})

describe('validation', () => {
  const base = () => {
    const f = ref.fixtures[0]
    const { id: _id, ...fields } = f
    return fields
  }

  it.each([
    ['same teams', () => ({ ...base(), awayTeamId: base().homeTeamId }), /different/],
    ['one score only', () => ({ ...base(), homeScore: 1 }), /both scores/],
    ['bad kickoff', () => ({ ...base(), kickoffUtc: 'next Tuesday' }), /kickoffUtc/],
    ['missing stadium', () => ({ ...base(), stadiumId: undefined }), /stadiumId is required/],
  ])('rejects a fixture with %s', async (_label, body, message) => {
    const res = await create('fixtures', body())
    expect(res.status).toBe(400)
    expect((res.jsonBody as { error: string }).error).toMatch(message)
  })

  it('rejects bad colours, timezones and photo urls', async () => {
    const team = { ...ref.teams[0], primaryColour: 'orange' }
    expect((await create('teams', team)).status).toBe(400)
    const city = { ...ref.cities[0], timezone: 'Mars/Olympus' }
    expect((await create('cities', city)).status).toBe(400)
    const insecure = { ...ref.cities[0], photoUrl: 'http://example.com/a.jpg' }
    expect(((await create('cities', insecure)).jsonBody as { error: string }).error).toMatch(/https/)
  })

  it('needs a city or fixture for guide sections', async () => {
    const res = await create('guide-sections', { type: 'general', title: 'T', content: 'C' })
    expect((res.jsonBody as { error: string }).error).toMatch(/city or a fixture/)
  })

  it('reports unknown links as 400 and duplicate airports as 409', async () => {
    const missing = await create('stadiums', { name: 'Nowhere', cityId: '00000000-0000-4000-8000-000000000000', lat: 0, lng: 0 })
    expect(missing.status).toBe(400)
    const bcn = ref.airports.find((a) => a.iata === 'BCN')!
    const { id: _id, ...dupe } = bcn
    expect((await create('airports', dupe)).status).toBe(409)
  })

  it('refuses to delete reference data and unknown types', async () => {
    const cityId = ref.cities[0].id
    expect((await adminDelete(req('DELETE', { entity: 'cities', id: cityId }, { as: admin }), ctx())).status).toBe(405)
    expect((await create('wizards', {})).status).toBe(404)
  })

  it('returns 404 when updating something that does not exist', async () => {
    const res = await adminUpdate(
      req('PUT', { entity: 'competitions', id: '00000000-0000-4000-8000-000000000000' }, { as: admin, body: { name: 'X', type: 'club' } }),
      ctx(),
    )
    expect(res.status).toBe(404)
  })
})
