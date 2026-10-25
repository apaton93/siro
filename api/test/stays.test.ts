import { HttpRequest, InvocationContext } from '@azure/functions'
import { fixtures, stays } from '@siro/db'
import { cellBounds, snapToGrid, type StaysResponse } from '@siro/shared'
import { sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { encodeClientPrincipal } from '../src/auth'
import { setDbForTests } from '../src/db'
import { goingDelete, goingPut, stayDelete, staysGet, stayPut } from '../src/functions/me'
import { createTestDb, type TestDb } from './test-db'

type Fan = { provider: 'github'; userId: string; userDetails: string }
const fan = (n: number): Fan => ({ provider: 'github', userId: `stay-${n}`, userDetails: `stay_${n}` })
const [ana, ben, cat, dev] = [1, 2, 3, 4].map(fan)
let t: TestDb
let fixtureId: string
const ctx = () => new InvocationContext({ functionName: 'test' })
const req = (method: string, as: Fan | null, body?: unknown) =>
  new HttpRequest({
    method,
    url: `http://localhost/api/me/stays/${fixtureId}`,
    headers: { ...(as ? { 'x-ms-client-principal': encodeClientPrincipal(as) } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    params: { fixtureId },
    body: body ? { string: JSON.stringify(body) } : undefined,
  })
const going = (as: Fan) => goingPut(req('PUT', as), ctx())
const put = (as: Fan, body: unknown) => stayPut(req('PUT', as, body), ctx())

// Near Plaça de Catalunya, a little off the centre of its grid square.
const centre = snapToGrid(41.3851, 2.1734)
const hotel = { lat: centre.lat + 0.0007, lng: centre.lng - 0.0006 }

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  ;[{ id: fixtureId }] = await t.db.select({ id: fixtures.id }).from(fixtures)
  for (const f of [ana, ben, cat]) await going(f)
})

describe('grid', () => {
  it('snaps nearby points to the same ~500m square, centred in it', () => {
    const a = snapToGrid(hotel.lat, hotel.lng)
    expect(a).toEqual(centre)
    expect(snapToGrid(centre.lat - 0.001, centre.lng + 0.001)).toEqual(a)
    const [[s, w], [n, e]] = cellBounds(a.lat, a.lng)
    expect(hotel.lat).toBeGreaterThan(s)
    expect(hotel.lat).toBeLessThan(n)
    expect(hotel.lng).toBeGreaterThan(w)
    expect(hotel.lng).toBeLessThan(e)
    expect((n - s) * 111_320).toBeCloseTo(500, 0)
  })
})

describe('stays', () => {
  it('needs sign-in and "I’m going"', async () => {
    expect((await staysGet(req('GET', null), ctx())).status).toBe(401)
    const res = await staysGet(req('GET', dev), ctx())
    expect(res.status).toBe(403)
    expect((res.jsonBody as { error: string }).error).toMatch(/going/)
  })

  it('stores only the rounded square, never the exact point', async () => {
    const res = await put(ana, { ...hotel, visibility: 'fans_only' })
    expect(res.status).toBe(200)
    const body = res.jsonBody as StaysResponse
    expect(body.mine).toEqual({ ...snapToGrid(hotel.lat, hotel.lng), visibility: 'fans_only' })
    const [raw] = await t.db
      .select({ lat: sql<number>`ST_Y(${stays.area}::geometry)`.mapWith(Number), lng: sql<number>`ST_X(${stays.area}::geometry)`.mapWith(Number) })
      .from(stays)
    expect(raw.lat).not.toBe(hotel.lat)
    expect(raw.lat).toBeCloseTo(snapToGrid(hotel.lat, hotel.lng).lat, 6)
    expect(body.stadium.name).toBe('Camp Nou')
  })

  it('counts fans per square, leaving out private stays', async () => {
    await put(ben, { lat: centre.lat - 0.0005, lng: centre.lng + 0.0004, visibility: 'fans_only' }) // same square
    await put(cat, { lat: 41.4036, lng: 2.1744, visibility: 'private' }) // Sagrada Família, private
    const body = (await staysGet(req('GET', cat), ctx())).jsonBody as StaysResponse
    expect(body.cells).toEqual([{ ...snapToGrid(hotel.lat, hotel.lng), count: 2 }])
    expect(body.total).toBe(2)
    expect(body.mine?.visibility).toBe('private')
  })

  it('rejects places far from the stadium and bad input', async () => {
    expect(((await put(ana, { lat: 51.5, lng: -0.12, visibility: 'fans_only' })).jsonBody as { error: string }).error).toMatch(/100 km/)
    expect((await put(ana, { lat: 'here', lng: 2, visibility: 'fans_only' })).status).toBe(400)
    expect((await put(ana, { ...hotel, visibility: 'public' })).status).toBe(400)
  })

  it('updates in place, can be removed, and goes when the fan stops going', async () => {
    await put(ana, { lat: 41.3809, lng: 2.1228, visibility: 'fans_only' })
    expect(((await staysGet(req('GET', ana), ctx())).jsonBody as StaysResponse).total).toBe(2)
    const removed = (await stayDelete(req('DELETE', ana), ctx())).jsonBody as StaysResponse
    expect(removed.mine).toBeNull()
    await goingDelete(req('DELETE', ben), ctx())
    expect(((await staysGet(req('GET', cat), ctx())).jsonBody as StaysResponse).total).toBe(0)
  })
})
