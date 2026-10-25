import { HttpRequest, InvocationContext } from '@azure/functions'
import { fixtures, point, stadiums, users, venues } from '@siro/db'
import type { PendingVenuesResponse, VenueDetail, VenuesResponse } from '@siro/shared'
import { eq, sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { encodeClientPrincipal } from '../src/auth'
import { setDbForTests } from '../src/db'
import { pendingVenues, venueStatus } from '../src/functions/admin'
import { meGet } from '../src/functions/me'
import { fixtureVenues, venueGet, venueSuggest, venueTip } from '../src/functions/venues'
import { createTestDb, type TestDb } from './test-db'

type Fan = { provider: 'github'; userId: string; userDetails: string }
const fan: Fan = { provider: 'github', userId: 'venue-fan', userDetails: 'venue_fan' }
const admin: Fan = { provider: 'github', userId: 'venue-admin', userDetails: 'venue_admin' }
let t: TestDb
let fixtureId: string
const ctx = () => new InvocationContext({ functionName: 'test' })
const req = (method: string, params: Record<string, string>, as: Fan | null, body?: unknown) =>
  new HttpRequest({
    method,
    url: 'http://localhost/api/x',
    headers: { ...(as ? { 'x-ms-client-principal': encodeClientPrincipal(as) } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    params,
    body: body ? { string: JSON.stringify(body) } : undefined,
  })
const list = async () => ((await fixtureVenues(req('GET', { id: fixtureId }, null), ctx())).jsonBody as VenuesResponse).venues
const suggest = (body: Record<string, unknown>, as: Fan = fan) =>
  venueSuggest(req('POST', {}, as, { fixtureId, name: 'The Away End', type: 'pub', notes: 'Big screens', lat: 41.383, lng: 2.124, ...body }), ctx())
const age = () => t.db.execute(sql`update recommendations set created_at = created_at - interval '1 minute'`)

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  ;[{ id: fixtureId }] = await t.db.select({ id: fixtures.id }).from(fixtures)
  await meGet(req('GET', {}, admin), ctx())
  await t.db.update(users).set({ isAdmin: true }).where(eq(users.authUserId, admin.userId))
  await t.db.delete(venues) // the seed's placeholders
  const [{ cityId }] = await t.db.select({ cityId: stadiums.cityId }).from(stadiums).where(eq(stadiums.name, 'Camp Nou'))
  await t.db.insert(venues).values([
    { name: 'Near bar', type: 'pub', cityId, location: point(2.125, 41.381), status: 'approved' },
    { name: 'Away pub', type: 'pub', cityId, location: point(2.17, 41.387), status: 'approved', awayFriendly: true, notes: 'Meeting point' },
    { name: 'Far away', type: 'pub', cityId, location: point(2.9, 41.9), status: 'approved' },
    { name: 'Not yet', type: 'pub', cityId, location: point(2.13, 41.38), status: 'pending' },
  ])
})

describe('venues', () => {
  it('lists approved venues near the stadium, away-friendly first then nearest', async () => {
    const v = await list()
    expect(v.map((x) => x.name)).toEqual(['Away pub', 'Near bar'])
    expect(v[0]).toMatchObject({ awayFriendly: true, notes: 'Meeting point', tipCount: 0 })
    expect(v[1].distanceKm).toBeLessThan(1)
  })

  it('takes fan suggestions as pending until an admin approves them', async () => {
    expect((await venueSuggest(req('POST', {}, null, {}), ctx())).status).toBe(401)
    const res = await suggest({})
    expect(res.status).toBe(201)
    const id = (res.jsonBody as { id: string }).id
    expect((await list()).map((x) => x.name)).not.toContain('The Away End')

    expect((await pendingVenues(req('GET', {}, fan), ctx())).status).toBe(403)
    const queue = (await pendingVenues(req('GET', {}, admin), ctx())).jsonBody as PendingVenuesResponse
    expect(queue.venues.map((x) => x.name)).toEqual(['Not yet', 'The Away End'])
    expect(queue.venues[1]).toMatchObject({ city: 'Barcelona', suggestedBy: expect.objectContaining({ displayName: 'venue_fan' }) })

    expect((await venueStatus(req('PUT', { id }, admin, { status: 'approved', awayFriendly: true }), ctx())).status).toBe(200)
    expect((await list()).find((x) => x.name === 'The Away End')).toMatchObject({ awayFriendly: true })
  })

  it('validates suggestions', async () => {
    expect(((await suggest({ name: ' ' })).jsonBody as { error: string }).error).toMatch(/name/)
    expect(((await suggest({ type: 'club' })).jsonBody as { error: string }).error).toMatch(/type/)
    expect(((await suggest({ lat: 'x' })).jsonBody as { error: string }).error).toMatch(/Tap the map/)
    expect(((await suggest({ lat: 51.5, lng: -0.1 })).jsonBody as { error: string }).error).toMatch(/30 km/)
  })

  it('limits how many suggestions a fan can have waiting', async () => {
    for (let i = 0; i < 5; i++) expect((await suggest({ name: `Pub ${i}` })).status).toBe(201)
    expect((await suggest({ name: 'One too many' })).status).toBe(429)
  })

  it('adds tips to approved venues, newest first, with a cooldown', async () => {
    const [away] = (await list()).filter((x) => x.name === 'Away pub')
    expect((await venueTip(req('POST', { id: away.id }, fan, { text: 'Get there early' }), ctx())).status).toBe(201)
    expect((await venueTip(req('POST', { id: away.id }, fan, { text: 'Too soon' }), ctx())).status).toBe(429)
    await age()
    await venueTip(req('POST', { id: away.id }, fan, { text: 'Cash only at the bar' }), ctx())
    const detail = (await venueGet(req('GET', { id: away.id }, null), ctx())).jsonBody as VenueDetail
    expect(detail.tips.map((x) => x.text)).toEqual(['Cash only at the bar', 'Get there early'])
    expect(detail.venue.tipCount).toBe(2)

    const [pending] = await t.db.select().from(venues).where(eq(venues.name, 'Not yet'))
    expect((await venueTip(req('POST', { id: pending.id }, fan, { text: 'Hi there' }), ctx())).status).toBe(404)
    expect((await venueGet(req('GET', { id: pending.id }, null), ctx())).status).toBe(404)
  })
})
