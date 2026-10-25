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
import type { CompetitionInfo, FixtureDetail, FixtureSummary, GuideSectionInfo } from '@siro/shared'
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, ne, or, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Db } from '../db'

const homeTeam = alias(teams, 'home_team')
const awayTeam = alias(teams, 'away_team')

/** Airports within this distance of the stadium are listed on the fixture page. */
const AIRPORT_RADIUS_M = 150_000
const MAX_AIRPORTS = 5
const MAX_FIXTURES = 50
/** A whole competition's upcoming fixtures (UCL league phase is 144). */
const MAX_COMPETITION_FIXTURES = 200
const MAX_RESULTS = 10
/** Games that kicked off within this window still count as upcoming (they may be in progress). */
const IN_PROGRESS_MS = 6 * 60 * 60 * 1000

// ---------- Column sets ----------

const competitionCols = { id: competitions.id, name: competitions.name, code: competitions.code }

const homeTeamCols = {
  id: homeTeam.id,
  name: homeTeam.name,
  shortName: homeTeam.shortName,
  crestUrl: homeTeam.crestUrl,
  primaryColour: homeTeam.primaryColour,
  onPrimaryColour: homeTeam.onPrimaryColour,
}

const awayTeamCols = {
  id: awayTeam.id,
  name: awayTeam.name,
  shortName: awayTeam.shortName,
  crestUrl: awayTeam.crestUrl,
  primaryColour: awayTeam.primaryColour,
  onPrimaryColour: awayTeam.onPrimaryColour,
}

const goingCount = sql<number>`(select count(*)::int from ${attendances} where ${attendances.fixtureId} = ${fixtures.id})`
const threadCount = sql<number>`(select count(*)::int from ${threads} where ${threads.fixtureId} = ${fixtures.id})`

// ---------- List ----------

export interface ListFixturesFilters {
  /** Only fixtures involving this team (home or away). */
  teamId?: string
  /** Only fixtures involving any of these teams. */
  teamIds?: string[]
  competitionId?: string
  /** Competition code, e.g. UCL. */
  competitionCode?: string
  /** `upcoming` (default, soonest first) or `results` (finished games, most recent first). */
  when?: 'upcoming' | 'results'
  /** Free-text search over team names and host city. */
  q?: string
  /** Earliest kickoff to include. Defaults to 6 hours ago, so games in progress still show. */
  from?: Date
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

export async function listFixtures(db: Db, filters: ListFixturesFilters = {}): Promise<FixtureSummary[]> {
  const results = filters.when === 'results'
  const from = filters.from ?? new Date(Date.now() - IN_PROGRESS_MS)
  const where: (SQL | undefined)[] = results
    ? [eq(fixtures.status, 'finished')]
    : [gte(fixtures.kickoffUtc, from), ne(fixtures.status, 'finished')]

  if (filters.teamIds?.length) {
    where.push(or(inArray(fixtures.homeTeamId, filters.teamIds), inArray(fixtures.awayTeamId, filters.teamIds)))
  }
  if (filters.competitionCode) {
    where.push(eq(competitions.code, filters.competitionCode))
  }

  if (filters.teamId) {
    where.push(or(eq(fixtures.homeTeamId, filters.teamId), eq(fixtures.awayTeamId, filters.teamId)))
  }
  if (filters.competitionId) {
    where.push(eq(fixtures.competitionId, filters.competitionId))
  }
  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`
    where.push(or(ilike(homeTeam.name, pattern), ilike(awayTeam.name, pattern), ilike(cities.name, pattern)))
  }

  const rows = await db
    .select({
      id: fixtures.id,
      kickoffUtc: fixtures.kickoffUtc,
      status: fixtures.status,
      stage: fixtures.stage,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      fanAccess: fixtures.fanAccess,
      fanAccessNote: fixtures.fanAccessNote,
      competition: competitionCols,
      homeTeam: homeTeamCols,
      awayTeam: awayTeamCols,
      stadium: { id: stadiums.id, name: stadiums.name },
      city: {
        id: cities.id,
        name: cities.name,
        countryCode: cities.countryCode,
        timezone: cities.timezone,
        photoUrl: cities.photoUrl,
        photoCredit: cities.photoCredit,
      },
      goingCount,
    })
    .from(fixtures)
    .innerJoin(competitions, eq(fixtures.competitionId, competitions.id))
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .innerJoin(stadiums, eq(fixtures.stadiumId, stadiums.id))
    .innerJoin(cities, eq(stadiums.cityId, cities.id))
    .where(and(...where))
    .orderBy(results ? desc(fixtures.kickoffUtc) : asc(fixtures.kickoffUtc))
    .limit(results ? MAX_RESULTS : filters.competitionCode || filters.competitionId ? MAX_COMPETITION_FIXTURES : MAX_FIXTURES)

  return rows.map((row) => ({
    ...row,
    kickoffUtc: toIso(row.kickoffUtc),
    goingCount: Number(row.goingCount),
  }))
}

// ---------- Competitions ----------

/** Competitions that have a code, with how many upcoming fixtures each has. */
export async function listCompetitions(db: Db): Promise<CompetitionInfo[]> {
  const from = new Date(Date.now() - IN_PROGRESS_MS)
  // Explicit table names: with a single-table select Drizzle leaves columns unqualified,
  // so "id" inside the subquery would mean fixtures.id.
  const upcomingCount = sql<number>`(select count(*)::int from fixtures f
    where f.competition_id = competitions.id
      and f.kickoff_utc >= ${from.toISOString()}
      and f.status <> 'finished')`
  const rows = await db
    .select({ ...competitionCols, upcomingCount })
    .from(competitions)
    .where(isNotNull(competitions.code))
    .orderBy(asc(competitions.name))
  return rows.map((r) => ({ ...r, upcomingCount: Number(r.upcomingCount) }))
}

// ---------- Detail ----------

export async function getFixture(db: Db, id: string): Promise<FixtureDetail | null> {
  const [row] = await db
    .select({
      id: fixtures.id,
      kickoffUtc: fixtures.kickoffUtc,
      status: fixtures.status,
      stage: fixtures.stage,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      fanAccess: fixtures.fanAccess,
      fanAccessNote: fixtures.fanAccessNote,
      competition: competitionCols,
      homeTeam: homeTeamCols,
      awayTeam: awayTeamCols,
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
        photoUrl: cities.photoUrl,
        photoCredit: cities.photoCredit,
      },
      goingCount,
      threadCount,
    })
    .from(fixtures)
    .innerJoin(competitions, eq(fixtures.competitionId, competitions.id))
    .innerJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .innerJoin(stadiums, eq(fixtures.stadiumId, stadiums.id))
    .innerJoin(cities, eq(stadiums.cityId, cities.id))
    .where(eq(fixtures.id, id))
    .limit(1)

  if (!row) return null

  const [nearbyAirports, sections] = await Promise.all([
    findAirportsNear(db, row.stadium.id),
    findGuideSections(db, id, row.city.id),
  ])

  return {
    ...row,
    kickoffUtc: toIso(row.kickoffUtc),
    goingCount: Number(row.goingCount),
    threadCount: Number(row.threadCount),
    stadium: { ...row.stadium, lat: Number(row.stadium.lat), lng: Number(row.stadium.lng) },
    airports: nearbyAirports,
    guideSections: sections,
  }
}

/** Airports within AIRPORT_RADIUS_M of the stadium, nearest first, with distance in km. */
async function findAirportsNear(db: Db, stadiumId: string) {
  const stadiumLocation = sql`(select ${stadiums.location} from ${stadiums} where ${stadiums.id} = ${stadiumId})`
  const distanceKm = sql<number>`round((ST_Distance(${airports.location}, ${stadiumLocation}) / 1000)::numeric, 1)::float`

  const rows = await db
    .select({ id: airports.id, name: airports.name, iata: airports.iata, distanceKm })
    .from(airports)
    .where(sql`ST_DWithin(${airports.location}, ${stadiumLocation}, ${AIRPORT_RADIUS_M})`)
    .orderBy(asc(distanceKm))
    .limit(MAX_AIRPORTS)

  return rows.map((a) => ({ ...a, distanceKm: Number(a.distanceKm) }))
}

/** Fixture-specific sections first, then the reusable city guide, each in sort order. */
async function findGuideSections(db: Db, fixtureId: string, cityId: string): Promise<GuideSectionInfo[]> {
  return db
    .select({
      id: guideSections.id,
      scope: sql<'fixture' | 'city'>`case when ${guideSections.fixtureId} is not null then 'fixture' else 'city' end`,
      type: guideSections.type,
      title: guideSections.title,
      content: guideSections.content,
    })
    .from(guideSections)
    .where(or(eq(guideSections.fixtureId, fixtureId), eq(guideSections.cityId, cityId)))
    .orderBy(desc(sql`${guideSections.fixtureId} is not null`), asc(guideSections.sortOrder))
}

/** Drivers return timestamps as Date (node-postgres) or string (PGlite) – normalise to ISO. */
const toIso = (value: Date | string) => new Date(value).toISOString()
