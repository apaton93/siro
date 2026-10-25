import { attendances, fixtures, point, stadiums, stays } from '@siro/db'
import { snapToGrid, STAY_MAX_KM, type MyStay, type StaysResponse, type StayVisibility } from '@siro/shared'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { Db } from '../db'

export async function attendanceId(db: Db, userId: string, fixtureId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: attendances.id })
    .from(attendances)
    .where(and(eq(attendances.userId, userId), eq(attendances.fixtureId, fixtureId)))
  return row?.id ?? null
}

async function stadiumFor(db: Db, fixtureId: string) {
  const [row] = await db
    .select({
      name: stadiums.name,
      lat: sql<number>`ST_Y(${stadiums.location}::geometry)`.mapWith(Number),
      lng: sql<number>`ST_X(${stadiums.location}::geometry)`.mapWith(Number),
    })
    .from(fixtures)
    .innerJoin(stadiums, eq(fixtures.stadiumId, stadiums.id))
    .where(eq(fixtures.id, fixtureId))
  return row ?? null
}

/** Distance in km between two points (great circle) – plenty accurate for a 100km check. */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/**
 * Save where a fan is staying, rounded to the grid square (the exact point is never stored).
 * Returns 'too-far' for anywhere more than STAY_MAX_KM from the stadium.
 */
export async function setStay(
  db: Db,
  attendance: string,
  fixtureId: string,
  input: { lat: number; lng: number; visibility: StayVisibility },
): Promise<'ok' | 'too-far'> {
  const stadium = await stadiumFor(db, fixtureId)
  if (!stadium || km(stadium, input) > STAY_MAX_KM) return 'too-far'
  const cell = snapToGrid(input.lat, input.lng)
  const area = point(cell.lng, cell.lat)
  await db
    .insert(stays)
    .values({ attendanceId: attendance, area, visibility: input.visibility })
    .onConflictDoUpdate({ target: stays.attendanceId, set: { area, visibility: input.visibility } })
  return 'ok'
}

export async function deleteStay(db: Db, attendance: string): Promise<void> {
  await db.delete(stays).where(eq(stays.attendanceId, attendance))
}

/** The fan's own stay, plus the shaded squares for everyone else going (private stays left out). */
export async function staysFor(db: Db, fixtureId: string, attendance: string): Promise<StaysResponse | null> {
  const stadium = await stadiumFor(db, fixtureId)
  if (!stadium) return null

  const lat = sql<number>`ST_Y(${stays.area}::geometry)`.mapWith(Number)
  const lng = sql<number>`ST_X(${stays.area}::geometry)`.mapWith(Number)

  const [mineRow] = await db
    .select({ lat, lng, visibility: stays.visibility })
    .from(stays)
    .where(eq(stays.attendanceId, attendance))

  const cells = await db
    .select({ lat, lng, count: sql<number>`count(*)::int`.mapWith(Number) })
    .from(stays)
    .innerJoin(attendances, eq(stays.attendanceId, attendances.id))
    .where(and(eq(attendances.fixtureId, fixtureId), ne(stays.visibility, 'private')))
    .groupBy(stays.area)

  const mine: MyStay | null = mineRow
    ? { lat: mineRow.lat, lng: mineRow.lng, visibility: mineRow.visibility === 'private' ? 'private' : 'fans_only' }
    : null
  return { mine, cells, total: cells.reduce((n, c) => n + c.count, 0), stadium }
}
