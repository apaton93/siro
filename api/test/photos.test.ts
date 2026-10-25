import { cities } from '@siro/db'
import { applyCityPhotos } from '@siro/db/src/photos/apply'
import { CITY_PHOTOS } from '@siro/db/src/photos/city-photos'
import { importUcl } from '@siro/db/src/ucl/import'
import { CITIES } from '@siro/db/src/ucl/ucl-2026-27'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { photoSchemaCheck } from './photo-check'
import { createTestDb } from './test-db'

describe('city photos', () => {
  it('are Commons images with a full credit, for known cities', () => {
    const known = new Set([...Object.values(CITIES).map((c) => `${c.name}|${c.countryCode}`), 'Dundee|GB'])
    for (const p of CITY_PHOTOS) {
      expect(known.has(`${p.city}|${p.countryCode}`), p.city).toBe(true)
      expect(p.url, p.city).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+\/1280px-[^?]+$/)
      expect(p.credit, p.city).toMatch(/^.+, (CC BY(-SA)? [0-9.]+|CC0), via Wikimedia Commons$/)
      expect(p.source, p.city).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(photoSchemaCheck(p), p.city).toBe(true)
    }
    expect(new Set(CITY_PHOTOS.map((p) => p.city)).size).toBe(CITY_PHOTOS.length)
  })

  it('fills in missing photos only, and is safe to re-run', async () => {
    const t = await createTestDb()
    await importUcl(t.db)
    await t.db.update(cities).set({ photoUrl: 'https://example.com/mine.jpg', photoCredit: 'Me' }).where(eq(cities.name, 'Paris'))

    const first = await applyCityPhotos(t.db)
    expect(first).toBe(CITY_PHOTOS.length - (CITY_PHOTOS.some((p) => p.city === 'Paris') ? 1 : 0))
    expect(await applyCityPhotos(t.db)).toBe(0)

    const [paris] = await t.db.select().from(cities).where(eq(cities.name, 'Paris'))
    expect(paris.photoUrl).toBe('https://example.com/mine.jpg')
  })
})
