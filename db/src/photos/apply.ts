import { and, eq, isNull } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as s from '../schema'
import { CITY_PHOTOS } from './city-photos'

type AnyDb = PgDatabase<PgQueryResultHKT, typeof s>

/** Give cities without a photo their Commons photo. Never replaces one set in /admin. Returns how many changed. */
export async function applyCityPhotos(db: AnyDb): Promise<number> {
  let updated = 0
  for (const p of CITY_PHOTOS) {
    const rows = await db
      .update(s.cities)
      .set({ photoUrl: p.url, photoCredit: p.credit })
      .where(and(eq(s.cities.name, p.city), eq(s.cities.countryCode, p.countryCode), isNull(s.cities.photoUrl)))
      .returning({ id: s.cities.id })
    updated += rows.length
  }
  return updated
}
