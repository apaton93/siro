import {
  airports,
  attendances,
  cities,
  competitions,
  fixtures,
  guideSections,
  stadiums,
  teams,
  threads,
} from '@siro/db'
import type { FixtureDetail, FixtureSummary } from '@siro/shared'
import { and, asc, desc, eq, gte, ilike, or, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Db } from '../db'

const homeTeam = alias(teams, 'home_team')
const awayTeam = alias(teams, 'away_team')

/** Airports within this distance of the stadium are listed on the fixture page. */
const AIRPORT_RADIUS_M = 150_000
const MAX_AIRPORTS = 5
const MAX_FIXTURES = 50

const teamColumns = (t: typeof homeTeam) => ({
  id: t.id,
  name: t.name,
  shortName: t.shortName,
  crestUrl: t.crestUrl,
})

const goingCount = sql<number>`(select count(*)::int from ${attendances} where ${attendances.fixtureId} = ${fixtures.id})`

/** Columns shared by the list and detail queries. */
const summaryColumns = {
  id: fixtures.id,
  kickoffUtc: fixtures.kickoffUtc,
  status: fixtures.status,
  stage: fixtures.stage,
  homeScore: fixtures.homeScore,
  awayScore: fixtures.awayScore,
  competition: { id: competitions.id, name: competitions.name },
  homeTeam: teamColumns(homeTeam),
  awayTeam: teamColumns(awayTeam),
  goingCount,
}

const baseFrom = (db: Db, columns: Record<string, unknown>) =>
  db
    .select(columns as typeof summaryColumns)
    .from(fixtures)
    .innerJoin(competitions, eq(fixtures.competitionId, competitions.id))
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .innerJoin(stadiums, eq(fixtures.stadiumId, stadiums.id))
    .innerJoin(cities, eq(stadiums.cityId, cities.id))

export interface ListFixturesFilters {
  /** Only fixtures involving this team (home or away). */
  teamId?: string
  competitionId?: string
  /** Free-text search over team names and host city. */
  q?: string
  /** Earliest kickoff to include. Defaults to 6 hours ago, so games in progress still show. */
  from?: Date
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

export async function listFixtures(db: Db, filters: ListFixturesFilters = {}): Promise<FixtureSummary[]> {
  const from = filters.from ?? new Date(Date.now() - 6 * 60 * 60 * 1000)
  const where: SQL[] = [gte(fixtures.kickoffUtc, from)]

  if (filters.teamId) {
    where.push(or(eq(fixtures.homeTeamId, filters.teamId), eq(fixtures.awayTeamId, filters.teamId))!)
  }
  if (filters.competitionId) {
    where.push(eq(fixtures.competitionId, filters.competitionId))
  }
  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`
    where.push(or(ilike(homeTeam.name, pattern), ilike(awayTeam.name, pattern), ilike(cities.name, pattern))!)
  }

  const rows = await baseFrom(db, {
    ...summaryColumns,
    stadium: { id: stadiums.id, name: stadiums.name },
    city: { id: cities.id, name: cities.name, countryCode: cities.countryCode, timezone: cities.timezone },
  })
    .where(and(...where))
    .orderBy(asc(fixtures.kickoffUtc))
    .limit(MAX_FIXTURES)

  return rows.map(toSummary)
}

export async function getFixture(db: Db, id: string): Promise<FixtureDetail | null> {
  const [row] = await baseFrom(db, {
    ...summaryColumns,
    stadium: {
      id: stadiums.id,
      name: stadiums.name,
      capacity: stadiums.capacity,
      awayEntranceNotes: stadiums.awayEntranceNotes,
      lat: sql<number>`ST_Y(${stadiums.location}::geometry)`,
      lng: sql<number>`ST_X(${stadiums.location}::geometry)`,
    },
    city: {
      id: cities.id,
      name: cities.name,
      countryCode: cities.countryCode,
      timezone: cities.timezone,
      currency: cities.currency,
      language: cities.language,
    },
    threadCount: sql<number>`(select count(*)::int from ${threads} where ${threads.fixtureId} = ${fixtures.id})`,
  })
    .where(eq(fixtures.id, id))
    .limit(1)

  if (!row) return null
  const fixture = row as unknown as FixtureDetail & { kickoffUtc: Date | string }

  const distance = sql<number>`round((ST_Distance(${airports.location}, (select ${stadiums.location} from ${stadiums} where ${stadiums.id} = ${fixture.stadium.id})) / 1000)::numeric, 1)::float`

  const [nearbyAirports, sections] = await Promise.all([
    db
      .select({ id: airports.id, name: airports.name, iata: airports.iata, distanceKm: distance })
      .from(airports)
      .where(
        sql`ST_DWithin(${airports.location}, (select ${stadiums.location} from ${stadiums} where ${stadiums.id} = ${fixture.stadium.id}), ${AIRPORT_RADIUS_M})`,
      )
      .orderBy(asc(distance))
      .limit(MAX_AIRPORTS),
    db
      .select({
        id: guideSections.id,
        scope: sql<'fixture' | 'city'>`case when ${guideSections.fixtureId} is not null then 'fixture' else 'city' end`,
        type: guideSections.type,
        title: guideSections.title,
        content: guideSections.content,
      })
      .from(guideSections)
      .where(or(eq(guideSections.fixtureId, id), eq(guideSections.cityId, fixture.city.id)))
      // Fixture-specific sections first, then the city guide, each in sort order.
      .orderBy(desc(sql`${guideSections.fixtureId} is not null`), asc(guideSections.sortOrder)),
  ])

  return {
    ...toSummary(fixture),
    stadium: { ...fixture.stadium, lat: Number(fixture.stadium.lat), lng: Number(fixture.stadium.lng) },
    city: fixture.city,
    threadCount: Number(fixture.threadCount),
    airports: nearbyAirports.map((a) => ({ ...a, distanceKm: Number(a.distanceKm) })),
    guideSections: sections,
  }
}

/** Normalise driver differences (Date vs string, numeric strings) into the JSON contract. */
function toSummary<T extends { kickoffUtc: Date | string; goingCount: number | string }>(
  row: T,
): T & { kickoffUtc: string; goingCount: number } {
  return {
    ...row,
    kickoffUtc: new Date(row.kickoffUtc).toISOString(),
    goingCount: Number(row.goingCount),
  }
}
