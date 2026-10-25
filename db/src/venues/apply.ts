import { and, eq, sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as s from '../schema'
import { CITIES } from '../ucl/ucl-2026-27'
import { STARTER_VENUES } from './starter-venues'

type AnyDb = PgDatabase<PgQueryResultHKT, typeof s>

export interface VenueCounts {
  added: number
  missingCities: string[]
}

/**
 * Add the starter venues as approved. Insert-only: a venue whose name already exists in
 * that city (any status, any case) is skipped, so edits and rejections stick. Safe to re-run.
 */
export async function applyStarterVenues(db: AnyDb): Promise<VenueCounts> {
  return db.transaction(async (tx) => {
    const counts: VenueCounts = { added: 0, missingCities: [] }
    const cityIds = new Map<string, string | null>()

    for (const v of STARTER_VENUES) {
      const c = CITIES[v.city]
      if (!cityIds.has(v.city)) {
        const [row] = await tx
          .select({ id: s.cities.id })
          .from(s.cities)
          .where(and(eq(s.cities.name, c.name), eq(s.cities.countryCode, c.countryCode)))
        cityIds.set(v.city, row?.id ?? null)
        if (!row) counts.missingCities.push(c.name)
      }
      const cityId = cityIds.get(v.city)
      if (!cityId) continue

      const [exists] = await tx
        .select({ id: s.venues.id })
        .from(s.venues)
        .where(and(eq(s.venues.cityId, cityId), sql`lower(${s.venues.name}) = lower(${v.name})`))
      if (exists) continue

      await tx.insert(s.venues).values({
        name: v.name,
        type: v.type,
        cityId,
        location: s.point(v.lng, v.lat),
        awayFriendly: v.awayFriendly,
        notes: v.notes,
        status: 'approved',
        sourceUrl: v.sourceUrl,
      })
      counts.added++
    }
    return counts
  })
}
