import { airports, cities, competitions, fixtures, guideSections, point, stadiums, teams, users } from '@siro/db'
import type { AdminEntity, AdminReference } from '@siro/shared'
import { asc, eq, sql, type SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { z } from 'zod'
import type { Db } from '../db'
import {
  airportSchema,
  citySchema,
  competitionSchema,
  fixtureSchema,
  guideSectionSchema,
  stadiumSchema,
  teamSchema,
} from './schemas'

export async function isAdmin(db: Db, userId: string): Promise<boolean> {
  const [row] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId))
  return !!row?.isAdmin
}

const lngOf = (col: unknown): SQL<number> => sql<number>`ST_X(${col}::geometry)`.mapWith(Number)
const latOf = (col: unknown): SQL<number> => sql<number>`ST_Y(${col}::geometry)`.mapWith(Number)

export async function getReference(db: Db): Promise<AdminReference> {
  const [comps, cityRows, stadiumRows, teamRows, airportRows, fixtureRows, guideRows] = await Promise.all([
    db.select({ id: competitions.id, name: competitions.name, code: competitions.code, type: competitions.type }).from(competitions).orderBy(asc(competitions.name)),
    db
      .select({
        id: cities.id,
        name: cities.name,
        countryCode: cities.countryCode,
        currency: cities.currency,
        language: cities.language,
        timezone: cities.timezone,
        lat: latOf(cities.centre),
        lng: lngOf(cities.centre),
        photoUrl: cities.photoUrl,
        photoCredit: cities.photoCredit,
      })
      .from(cities)
      .orderBy(asc(cities.name)),
    db
      .select({
        id: stadiums.id,
        name: stadiums.name,
        cityId: stadiums.cityId,
        capacity: stadiums.capacity,
        lat: latOf(stadiums.location),
        lng: lngOf(stadiums.location),
        awayEntranceNotes: stadiums.awayEntranceNotes,
      })
      .from(stadiums)
      .orderBy(asc(stadiums.name)),
    db
      .select({
        id: teams.id,
        name: teams.name,
        shortName: teams.shortName,
        type: teams.type,
        countryCode: teams.countryCode,
        cityId: teams.cityId,
        homeStadiumId: teams.homeStadiumId,
        crestUrl: teams.crestUrl,
        primaryColour: teams.primaryColour,
        onPrimaryColour: teams.onPrimaryColour,
      })
      .from(teams)
      .orderBy(asc(teams.name)),
    db
      .select({
        id: airports.id,
        name: airports.name,
        iata: airports.iata,
        cityId: airports.cityId,
        lat: latOf(airports.location),
        lng: lngOf(airports.location),
      })
      .from(airports)
      .orderBy(asc(airports.iata)),
    db
      .select({
        id: fixtures.id,
        competitionId: fixtures.competitionId,
        stage: fixtures.stage,
        homeTeamId: fixtures.homeTeamId,
        awayTeamId: fixtures.awayTeamId,
        stadiumId: fixtures.stadiumId,
        kickoffUtc: fixtures.kickoffUtc,
        status: fixtures.status,
        homeScore: fixtures.homeScore,
        awayScore: fixtures.awayScore,
        scoreNotes: fixtures.scoreNotes,
        fanAccess: fixtures.fanAccess,
        fanAccessNote: fixtures.fanAccessNote,
      })
      .from(fixtures)
      .orderBy(asc(fixtures.kickoffUtc)),
    db
      .select({
        id: guideSections.id,
        cityId: guideSections.cityId,
        fixtureId: guideSections.fixtureId,
        type: guideSections.type,
        title: guideSections.title,
        content: guideSections.content,
        sortOrder: guideSections.sortOrder,
      })
      .from(guideSections)
      .orderBy(asc(guideSections.sortOrder), asc(guideSections.title)),
  ])

  return {
    competitions: comps,
    cities: cityRows,
    stadiums: stadiumRows,
    teams: teamRows,
    airports: airportRows,
    fixtures: fixtureRows.map((f) => ({ ...f, kickoffUtc: f.kickoffUtc.toISOString() })),
    guideSections: guideRows,
  }
}

// ---------- Writes ----------

type EntityDef = {
  table: PgTable & { id: unknown }
  schema: z.ZodTypeAny
  /** Map validated input to table columns. */
  toRow: (input: never) => Record<string, unknown>
  deletable: boolean
}

const withLocation =
  (column: string) =>
  ({ lat, lng, ...rest }: { lat: number; lng: number }) => ({ ...rest, [column]: point(lng, lat) })

export const ENTITIES: Record<AdminEntity, EntityDef> = {
  competitions: { table: competitions, schema: competitionSchema, toRow: (i) => i, deletable: false },
  cities: { table: cities, schema: citySchema, toRow: withLocation('centre'), deletable: false },
  stadiums: { table: stadiums, schema: stadiumSchema, toRow: withLocation('location'), deletable: false },
  teams: { table: teams, schema: teamSchema, toRow: (i) => i, deletable: false },
  airports: { table: airports, schema: airportSchema, toRow: withLocation('location'), deletable: false },
  fixtures: {
    table: fixtures,
    schema: fixtureSchema,
    toRow: (i: z.infer<typeof fixtureSchema>) => ({ ...i, kickoffUtc: new Date(i.kickoffUtc) }),
    deletable: true,
  },
  'guide-sections': { table: guideSections, schema: guideSectionSchema, toRow: (i) => i, deletable: true },
}

export const isEntity = (value: string | undefined): value is AdminEntity => !!value && value in ENTITIES

/* eslint-disable @typescript-eslint/no-explicit-any -- the entity registry is generic over tables */
const idCol = (table: EntityDef['table']) => (table as any).id

export async function createEntity(db: Db, entity: AdminEntity, input: unknown): Promise<string> {
  const def = ENTITIES[entity]
  const [row] = await db
    .insert(def.table)
    .values(def.toRow(input as never) as any)
    .returning({ id: idCol(def.table) })
  return row.id as string
}

export async function updateEntity(db: Db, entity: AdminEntity, id: string, input: unknown): Promise<boolean> {
  const def = ENTITIES[entity]
  const rows = await db
    .update(def.table)
    .set(def.toRow(input as never) as any)
    .where(eq(idCol(def.table), id))
    .returning({ id: idCol(def.table) })
  return rows.length > 0
}

export async function deleteEntity(db: Db, entity: AdminEntity, id: string): Promise<boolean> {
  const def = ENTITIES[entity]
  const rows = await db.delete(def.table).where(eq(idCol(def.table), id)).returning({ id: idCol(def.table) })
  return rows.length > 0
}

/** Postgres error code, whether thrown directly by pg or wrapped by Drizzle. */
export function pgCode(err: unknown): string | undefined {
  const e = err as { code?: unknown; cause?: { code?: unknown } }
  const code = e?.code ?? e?.cause?.code
  return typeof code === 'string' ? code : undefined
}
