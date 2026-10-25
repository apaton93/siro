import { cities, venues } from '@siro/db'
import { importUcl } from '@siro/db/src/ucl/import'
import { CITIES } from '@siro/db/src/ucl/ucl-2026-27'
import { applyStarterVenues } from '@siro/db/src/venues/apply'
import { STARTER_VENUES } from '@siro/db/src/venues/starter-venues'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createTestDb } from './test-db'

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

describe('starter venues', () => {
  it('are near their city, sourced, and not duplicated', () => {
    for (const v of STARTER_VENUES) {
      expect(km(CITIES[v.city], v), v.name).toBeLessThan(15)
      expect(v.sourceUrl, v.name).toMatch(/^https:\/\//)
    }
    expect(new Set(STARTER_VENUES.map((v) => `${v.city}|${v.name.toLowerCase()}`)).size).toBe(STARTER_VENUES.length)
  })

  it('adds them as approved, keeps existing ones, and is safe to re-run', async () => {
    const t = await createTestDb()
    await importUcl(t.db)
    const [porto] = await t.db.select().from(cities).where(eq(cities.name, 'Porto'))
    await t.db.insert(venues).values({ name: 'BONAPARTE DOWNTOWN', type: 'pub', cityId: porto.id, location: 'SRID=4326;POINT(0 0)', status: 'rejected' })

    const first = await applyStarterVenues(t.db)
    expect(first).toEqual({ added: STARTER_VENUES.length - 1, missingCities: [] })
    expect((await applyStarterVenues(t.db)).added).toBe(0)

    const rows = await t.db.select().from(venues).where(eq(venues.cityId, porto.id))
    expect(rows.find((r) => r.name === 'BONAPARTE DOWNTOWN')?.status).toBe('rejected')
    expect(rows.filter((r) => r.status === 'approved').every((r) => r.sourceUrl)).toBe(true)
  })
})
