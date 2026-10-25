import { HttpRequest, InvocationContext } from '@azure/functions'
import { fixtures, teams, users } from '@siro/db'
import type { GoingStatus, Me, TeamsListResponse } from '@siro/shared'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { encodeClientPrincipal } from '../src/auth'
import { setDbForTests } from '../src/db'
import { goingDelete, goingGet, goingPut, meGet, mePatch, meTeamsPut } from '../src/functions/me'
import { teamsList } from '../src/functions/teams'
import { createTestDb, type TestDb } from './test-db'

let t: TestDb
let fixtureId: string
let barcelonaId: string
let dundeeUnitedId: string

const ctx = () => new InvocationContext({ functionName: 'test' })

type Fan = { provider: 'github' | 'aad'; userId: string; userDetails: string }
const githubFan: Fan = { provider: 'github', userId: 'gh-user-1', userDetails: 'tangerine_terror' }
const microsoftFan: Fan = { provider: 'aad', userId: 'ab12cd34', userDetails: 'someone@example.com' }

function req(method: string, path: string, opts: { fan?: Fan; body?: unknown; params?: Record<string, string> } = {}) {
  const headers: Record<string, string> = {}
  if (opts.fan) headers['x-ms-client-principal'] = encodeClientPrincipal(opts.fan)
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  return new HttpRequest({
    method,
    url: `http://localhost/api/${path}`,
    headers,
    params: opts.params ?? {},
    body: opts.body === undefined ? undefined : { string: JSON.stringify(opts.body) },
  })
}

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  ;[{ id: fixtureId }] = await t.db.select({ id: fixtures.id }).from(fixtures)
  ;[{ id: barcelonaId }] = await t.db.select({ id: teams.id }).from(teams).where(eq(teams.shortName, 'BAR'))
  ;[{ id: dundeeUnitedId }] = await t.db.select({ id: teams.id }).from(teams).where(eq(teams.shortName, 'DU'))
})

describe('sign-in', () => {
  it('rejects requests without a signed-in user', async () => {
    const res = await meGet(req('GET', 'me'), ctx())
    expect(res.status).toBe(401)
  })

  it('rejects a malformed identity header', async () => {
    const bad = new HttpRequest({ method: 'GET', url: 'http://localhost/api/me', headers: { 'x-ms-client-principal': 'not-base64-json' } })
    expect((await meGet(bad, ctx())).status).toBe(401)
  })

  it('creates a fan on first visit and reuses them after', async () => {
    const first = (await meGet(req('GET', 'me', { fan: githubFan }), ctx())).jsonBody as Me
    const again = (await meGet(req('GET', 'me', { fan: githubFan }), ctx())).jsonBody as Me
    expect(again.id).toBe(first.id)
    expect(first).toMatchObject({ displayName: 'tangerine_terror', authProvider: 'github', isAdmin: false, teams: [] })
  })

  it('never stores the email address Microsoft sends', async () => {
    const me = (await meGet(req('GET', 'me', { fan: microsoftFan }), ctx())).jsonBody as Me
    expect(me.displayName).toBe('Fan AB12')

    const rows = await t.db.select().from(users)
    expect(JSON.stringify(rows)).not.toContain('@example.com')
  })

  it('marks personal responses as not cacheable', async () => {
    const res = await meGet(req('GET', 'me', { fan: githubFan }), ctx())
    expect(res.headers).toMatchObject({ 'Cache-Control': 'no-store' })
  })
})

describe('PATCH /api/me', () => {
  it('updates the display name (trimmed, spaces collapsed)', async () => {
    const res = await mePatch(req('PATCH', 'me', { fan: githubFan, body: { displayName: '  Arab   Andy ' } }), ctx())
    expect(res.status).toBe(200)
    expect((res.jsonBody as Me).displayName).toBe('Arab Andy')
  })

  it.each([
    ['too short', 'A'],
    ['too long', 'x'.repeat(31)],
    ['odd characters', '<script>'],
    ['missing', undefined],
  ])('rejects a name that is %s', async (_label, displayName) => {
    const res = await mePatch(req('PATCH', 'me', { fan: githubFan, body: { displayName } }), ctx())
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/me/teams', () => {
  it('sets teams with one primary, primary first', async () => {
    const res = await meTeamsPut(
      req('PUT', 'me/teams', {
        fan: githubFan,
        body: { teams: [{ teamId: barcelonaId, isPrimary: false }, { teamId: dundeeUnitedId, isPrimary: true }] },
      }),
      ctx(),
    )
    expect(res.status).toBe(200)
    const me = res.jsonBody as Me
    expect(me.teams.map((x) => [x.shortName, x.isPrimary])).toEqual([
      ['DU', true],
      ['BAR', false],
    ])
    expect(me.teams[0].primaryColour).toBe('#F47920')
  })

  it('replaces the previous selection', async () => {
    await meTeamsPut(req('PUT', 'me/teams', { fan: githubFan, body: { teams: [{ teamId: barcelonaId, isPrimary: true }] } }), ctx())
    const me = (await meGet(req('GET', 'me', { fan: githubFan }), ctx())).jsonBody as Me
    expect(me.teams.map((x) => x.shortName)).toEqual(['BAR'])
  })

  it('allows clearing all teams', async () => {
    const res = await meTeamsPut(req('PUT', 'me/teams', { fan: githubFan, body: { teams: [] } }), ctx())
    expect((res.jsonBody as Me).teams).toEqual([])
  })

  it.each([
    ['no primary', [{ teamId: 'BAR', isPrimary: false }]],
    ['two primaries', [{ teamId: 'BAR', isPrimary: true }, { teamId: 'DU', isPrimary: true }]],
    ['a duplicate', [{ teamId: 'BAR', isPrimary: true }, { teamId: 'BAR', isPrimary: false }]],
    ['an unknown team', [{ teamId: '00000000-0000-4000-8000-000000000000', isPrimary: true }]],
    ['an invalid id', [{ teamId: 'nope', isPrimary: true }]],
  ])('rejects %s', async (_label, list) => {
    const ids: Record<string, string> = { BAR: barcelonaId, DU: dundeeUnitedId }
    const teamsBody = list.map((x) => ({ ...x, teamId: ids[x.teamId] ?? x.teamId }))
    const res = await meTeamsPut(req('PUT', 'me/teams', { fan: githubFan, body: { teams: teamsBody } }), ctx())
    expect(res.status).toBe(400)
  })

  it('rejects more than 5 teams', async () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ teamId: `00000000-0000-4000-8000-00000000000${i}`, isPrimary: i === 0 }))
    const res = await meTeamsPut(req('PUT', 'me/teams', { fan: githubFan, body: { teams: six } }), ctx())
    expect(res.status).toBe(400)
  })
})

describe("I'm going", () => {
  const going = (fn: typeof goingGet, method: string, fan: Fan = githubFan, id = fixtureId) =>
    fn(req(method, `me/going/${id}`, { fan, params: { fixtureId: id } }), ctx())

  it('starts as not going', async () => {
    expect((await going(goingGet, 'GET')).jsonBody).toEqual({ going: false, goingCount: 0 })
  })

  it('marks going and counts each fan once', async () => {
    await going(goingPut, 'PUT')
    const twice = (await going(goingPut, 'PUT')).jsonBody as GoingStatus
    expect(twice).toEqual({ going: true, goingCount: 1 })

    const other = (await going(goingPut, 'PUT', microsoftFan)).jsonBody as GoingStatus
    expect(other).toEqual({ going: true, goingCount: 2 })
  })

  it('un-marks going', async () => {
    const res = (await going(goingDelete, 'DELETE')).jsonBody as GoingStatus
    expect(res).toEqual({ going: false, goingCount: 1 })
    expect(((await going(goingDelete, 'DELETE')).jsonBody as GoingStatus).goingCount).toBe(1)
  })

  it('returns 404 for an unknown fixture and 400 for a bad id', async () => {
    expect((await going(goingPut, 'PUT', githubFan, '00000000-0000-4000-8000-000000000000')).status).toBe(404)
    expect((await going(goingPut, 'PUT', githubFan, 'abc')).status).toBe(400)
  })

  it('requires sign-in', async () => {
    const res = await goingPut(req('PUT', `me/going/${fixtureId}`, { params: { fixtureId } }), ctx())
    expect(res.status).toBe(401)
  })
  it.each(['behind_closed_doors', 'no_away_fans'] as const)('refuses going when %s, but still allows undo', async (access) => {
    // microsoftFan is still marked going from earlier.
    await t.db.update(fixtures).set({ fanAccess: access }).where(eq(fixtures.id, fixtureId))
    try {
      const res = await going(goingPut, 'PUT')
      expect(res.status).toBe(409)
      expect((res.jsonBody as { error: string }).error).toMatch(/don't travel/)
      expect(((await going(goingGet, 'GET')).jsonBody as GoingStatus).going).toBe(false)
      expect((await going(goingDelete, 'DELETE', microsoftFan)).status).toBe(200)
      await going(goingPut, 'PUT', microsoftFan) // 409, so stays un-going
      expect(((await going(goingGet, 'GET', microsoftFan)).jsonBody as GoingStatus).going).toBe(false)
    } finally {
      await t.db.update(fixtures).set({ fanAccess: 'normal' }).where(eq(fixtures.id, fixtureId))
      await going(goingPut, 'PUT', microsoftFan)
    }
  })

  it('still allows going with a partial closure', async () => {
    await t.db.update(fixtures).set({ fanAccess: 'partial_closure' }).where(eq(fixtures.id, fixtureId))
    try {
      expect((await going(goingPut, 'PUT')).status).toBe(200)
      await going(goingDelete, 'DELETE')
    } finally {
      await t.db.update(fixtures).set({ fanAccess: 'normal' }).where(eq(fixtures.id, fixtureId))
    }
  })
})

describe('GET /api/teams', () => {
  it('lists and searches teams', async () => {
    const all = (await teamsList(req('GET', 'teams'), ctx())).jsonBody as TeamsListResponse
    expect(all.teams.map((x) => x.name)).toEqual(['Barcelona', 'Dundee United'])

    const found = (await teamsList(req('GET', 'teams?q=dun'), ctx())).jsonBody as TeamsListResponse
    expect(found.teams.map((x) => x.name)).toEqual(['Dundee United'])
  })
})
