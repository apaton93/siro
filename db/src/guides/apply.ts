import { and, eq, inArray, isNull, like, or } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as s from '../schema'
import { CITY_GUIDES } from './city-guides'

type AnyDb = PgDatabase<PgQueryResultHKT, typeof s>

/** Text from the original development seed, cleared so real guides can take over. */
const SEED_SECTION_TITLES = ['Basics', 'Getting to the stadium', 'Safety']

export interface GuideCounts {
  sections: number
  stadiums: number
  seedRemoved: number
  missingCities: string[]
  missingStadiums: string[]
}

/**
 * Add city guide sections and stadium notes. Only fills gaps: a city that already has a
 * section of a given type keeps it, and stadium notes are only set when empty (or still a
 * "[placeholder]"), so edits made in /admin are never overwritten. Safe to re-run.
 */
export async function applyGuides(db: AnyDb): Promise<GuideCounts> {
  return db.transaction(async (tx) => {
    const counts: GuideCounts = { sections: 0, stadiums: 0, seedRemoved: 0, missingCities: [], missingStadiums: [] }

    for (const guide of CITY_GUIDES) {
      const [city] = await tx
        .select({ id: s.cities.id })
        .from(s.cities)
        .where(and(eq(s.cities.name, guide.city), eq(s.cities.countryCode, guide.countryCode)))
      if (!city) {
        counts.missingCities.push(guide.city)
        continue
      }

      // Old seed placeholders (Barcelona only), using the old section types.
      const removed = await tx
        .delete(s.guideSections)
        .where(
          and(
            eq(s.guideSections.cityId, city.id),
            inArray(s.guideSections.type, ['general', 'transport', 'safety']),
            inArray(s.guideSections.title, SEED_SECTION_TITLES),
          ),
        )
        .returning({ id: s.guideSections.id })
      counts.seedRemoved += removed.length

      const existing = await tx
        .select({ type: s.guideSections.type })
        .from(s.guideSections)
        .where(eq(s.guideSections.cityId, city.id))
      const have = new Set(existing.map((e) => e.type))

      for (const [i, section] of guide.sections.entries()) {
        if (have.has(section.type)) continue
        await tx.insert(s.guideSections).values({ cityId: city.id, ...section, sortOrder: i * 10 })
        have.add(section.type)
        counts.sections++
      }

      for (const [name, notes] of Object.entries(guide.stadiums)) {
        const [stadium] = await tx
          .select({ id: s.stadiums.id, gettingThere: s.stadiums.gettingThere, away: s.stadiums.awayEntranceNotes })
          .from(s.stadiums)
          .where(eq(s.stadiums.name, name))
        if (!stadium) {
          counts.missingStadiums.push(name)
          continue
        }
        const set: Partial<typeof s.stadiums.$inferInsert> = {}
        if (!stadium.gettingThere) set.gettingThere = notes.gettingThere
        if (!stadium.away || stadium.away.startsWith('[')) set.awayEntranceNotes = notes.awayFans
        if (Object.keys(set).length) {
          await tx.update(s.stadiums).set(set).where(eq(s.stadiums.id, stadium.id))
          counts.stadiums++
        }
      }
    }
    return counts
  })
}

// Exported for tests: rows that still look like placeholders.
export const placeholderStadiums = (db: AnyDb) =>
  db
    .select({ name: s.stadiums.name })
    .from(s.stadiums)
    .where(or(isNull(s.stadiums.awayEntranceNotes), like(s.stadiums.awayEntranceNotes, '[%')))
