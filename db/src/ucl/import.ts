import { and, eq, gte, lt } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as s from '../schema'
import { point } from '../schema'
import {
  AIRPORTS,
  CITIES,
  COMPETITION,
  FIXTURES,
  SEASON,
  STADIUMS,
  STAGE,
  TEAMS,
  type CityKey,
  type StadiumKey,
  type TeamKey,
} from './ucl-2026-27'

type AnyDb = PgDatabase<PgQueryResultHKT, typeof s>

export interface ImportCounts {
  cities: number
  stadiums: number
  teams: number
  airports: number
  fixtures: number
  exampleFixtureRemoved: boolean
}

/** UEFA kickoff times are Central European wall-clock times; convert to UTC (handles summer time). */
export function cetToUtc(date: string, time: string): Date {
  const guess = new Date(`${date}T${time}:00Z`)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(guess)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  return new Date(guess.getTime() - (wall - guess.getTime()))
}

/**
 * Add the Champions League 2026/27 league phase. Only adds what's missing – existing records
 * (matched by name, IATA code, or competition + teams + season) are left alone, so it's safe to
 * re-run and never overwrites changes made in /admin. Also removes the fictional example fixture.
 */
export async function importUcl(db: AnyDb): Promise<ImportCounts> {
  return db.transaction(async (tx) => {
    const counts: ImportCounts = { cities: 0, stadiums: 0, teams: 0, airports: 0, fixtures: 0, exampleFixtureRemoved: false }

    // Competition
    let [competition] = await tx.select().from(s.competitions).where(eq(s.competitions.name, COMPETITION.name))
    competition ??= (await tx.insert(s.competitions).values(COMPETITION).returning())[0]

    // Cities (by name + country)
    const cityIds = {} as Record<CityKey, string>
    for (const [key, c] of Object.entries(CITIES) as [CityKey, (typeof CITIES)[CityKey]][]) {
      const [found] = await tx
        .select({ id: s.cities.id })
        .from(s.cities)
        .where(and(eq(s.cities.name, c.name), eq(s.cities.countryCode, c.countryCode)))
      if (found) {
        cityIds[key] = found.id
        continue
      }
      const { lat, lng, ...rest } = c
      const [row] = await tx.insert(s.cities).values({ ...rest, centre: point(lng, lat) }).returning({ id: s.cities.id })
      cityIds[key] = row.id
      counts.cities++
    }

    // Stadiums (by name)
    const stadiumIds = {} as Record<StadiumKey, string>
    for (const [key, st] of Object.entries(STADIUMS) as [StadiumKey, (typeof STADIUMS)[StadiumKey]][]) {
      const [found] = await tx.select({ id: s.stadiums.id }).from(s.stadiums).where(eq(s.stadiums.name, st.name))
      if (found) {
        stadiumIds[key] = found.id
        continue
      }
      const [row] = await tx
        .insert(s.stadiums)
        .values({ name: st.name, cityId: cityIds[st.city], capacity: st.capacity, location: point(st.lng, st.lat) })
        .returning({ id: s.stadiums.id })
      stadiumIds[key] = row.id
      counts.stadiums++
    }

    // Teams (by name)
    const teamIds = {} as Record<TeamKey, string>
    for (const [key, t] of Object.entries(TEAMS) as [TeamKey, (typeof TEAMS)[TeamKey]][]) {
      const [found] = await tx.select({ id: s.teams.id }).from(s.teams).where(eq(s.teams.name, t.name))
      if (found) {
        teamIds[key] = found.id
        continue
      }
      const [row] = await tx
        .insert(s.teams)
        .values({
          name: t.name,
          shortName: t.shortName,
          type: 'club',
          countryCode: t.countryCode,
          cityId: cityIds[t.city],
          homeStadiumId: stadiumIds[t.stadium],
          primaryColour: t.primaryColour,
          onPrimaryColour: t.onPrimaryColour,
        })
        .returning({ id: s.teams.id })
      teamIds[key] = row.id
      counts.teams++
    }

    // Airports (by IATA)
    for (const a of AIRPORTS) {
      const inserted = await tx
        .insert(s.airports)
        .values({ iata: a.iata, name: a.name, cityId: cityIds[a.city], location: point(a.lng, a.lat) })
        .onConflictDoNothing({ target: s.airports.iata })
        .returning({ id: s.airports.id })
      counts.airports += inserted.length
    }

    // Fixtures (by competition + home + away within the season)
    for (const [date, time, home, away, result] of FIXTURES) {
      const [found] = await tx
        .select({ id: s.fixtures.id })
        .from(s.fixtures)
        .where(
          and(
            eq(s.fixtures.competitionId, competition.id),
            eq(s.fixtures.homeTeamId, teamIds[home]),
            eq(s.fixtures.awayTeamId, teamIds[away]),
            gte(s.fixtures.kickoffUtc, new Date(SEASON.from)),
            lt(s.fixtures.kickoffUtc, new Date(SEASON.to)),
          ),
        )
      if (found) continue

      const [homeScore, awayScore] = result ? result.split('-').map(Number) : [null, null]
      await tx.insert(s.fixtures).values({
        competitionId: competition.id,
        stage: STAGE,
        homeTeamId: teamIds[home],
        awayTeamId: teamIds[away],
        stadiumId: stadiumIds[TEAMS[home].stadium],
        kickoffUtc: cetToUtc(date, time),
        status: result ? 'finished' : 'scheduled',
        homeScore,
        awayScore,
      })
      counts.fixtures++
    }

    // The fictional example: Barcelona v Dundee United (its guide sections and "going" marks cascade).
    const [dundeeUnited] = await tx.select({ id: s.teams.id }).from(s.teams).where(eq(s.teams.name, 'Dundee United'))
    if (dundeeUnited) {
      const removed = await tx
        .delete(s.fixtures)
        .where(and(eq(s.fixtures.homeTeamId, teamIds.BAR), eq(s.fixtures.awayTeamId, dundeeUnited.id)))
        .returning({ id: s.fixtures.id })
      counts.exampleFixtureRemoved = removed.length > 0
    }

    return counts
  })
}
