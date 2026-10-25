import { cities, fixtures, point, recommendations, stadiums, users, venues } from '@siro/db'
import { VENUE_LIMITS, type PendingVenue, type VenueDetail, type VenueInfo, type VenueType } from '@siro/shared'
import { and, asc, count, desc, eq, gt, sql } from 'drizzle-orm'
import type { Db } from '../db'
import { avatarUrl } from '../users/avatars'

const latOf = (col: unknown) => sql<number>`ST_Y(${col}::geometry)`.mapWith(Number)
const lngOf = (col: unknown) => sql<number>`ST_X(${col}::geometry)`.mapWith(Number)
const toIso = (v: Date | string) => new Date(v).toISOString()
// Raw table names in subqueries – see the note in fixtures/queries.ts.
const tipCount = sql<number>`(select count(*)::int from recommendations r where r.venue_id = venues.id)`.mapWith(Number)

/** The fixture's stadium location and city, or null if there's no such fixture. */
export async function fixturePlace(db: Db, fixtureId: string) {
  const [row] = await db
    .select({ cityId: stadiums.cityId })
    .from(fixtures)
    .innerJoin(stadiums, eq(fixtures.stadiumId, stadiums.id))
    .where(eq(fixtures.id, fixtureId))
  return row ?? null
}

/** Approved venues near a fixture's stadium: away-friendly first, then nearest. */
export async function venuesForFixture(db: Db, fixtureId: string): Promise<VenueInfo[] | null> {
  const place = await fixturePlace(db, fixtureId)
  if (!place) return null
  const stadiumLoc = sql`(select s.location from stadiums s join fixtures f on f.stadium_id = s.id where f.id = ${fixtureId})`
  const distanceKm = sql<number>`round((ST_Distance(${venues.location}, ${stadiumLoc}) / 1000)::numeric, 1)::float`.mapWith(Number)

  return db
    .select({
      id: venues.id,
      name: venues.name,
      type: venues.type,
      awayFriendly: venues.awayFriendly,
      notes: venues.notes,
      lat: latOf(venues.location),
      lng: lngOf(venues.location),
      distanceKm,
      tipCount,
    })
    .from(venues)
    .where(and(eq(venues.status, 'approved'), sql`ST_DWithin(${venues.location}, ${stadiumLoc}, ${VENUE_LIMITS.maxKm * 1000})`))
    .orderBy(desc(venues.awayFriendly), asc(distanceKm))
    .limit(100)
}

export async function venueDetail(db: Db, id: string): Promise<VenueDetail | null> {
  const [venue] = await db
    .select({
      id: venues.id,
      name: venues.name,
      type: venues.type,
      awayFriendly: venues.awayFriendly,
      notes: venues.notes,
      lat: latOf(venues.location),
      lng: lngOf(venues.location),
      tipCount,
      sourceUrl: venues.sourceUrl,
    })
    .from(venues)
    .where(and(eq(venues.id, id), eq(venues.status, 'approved')))
  if (!venue) return null

  const tips = await db
    .select({
      id: recommendations.id,
      text: recommendations.text,
      createdAt: recommendations.createdAt,
      authorId: users.id,
      displayName: users.displayName,
      avatarAt: sql<string | null>`(select a.updated_at from user_avatars a where a.user_id = users.id)`,
    })
    .from(recommendations)
    .innerJoin(users, eq(recommendations.userId, users.id))
    .where(eq(recommendations.venueId, id))
    .orderBy(desc(recommendations.createdAt))
    .limit(100)

  return {
    venue,
    tips: tips.map((t) => ({
      id: t.id,
      text: t.text,
      createdAt: toIso(t.createdAt),
      author: { id: t.authorId, displayName: t.displayName, avatarUrl: avatarUrl(t.authorId, t.avatarAt) },
    })),
  }
}

// ---------- Fan suggestions ----------

export async function pendingCount(db: Db, userId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(venues)
    .where(and(eq(venues.suggestedBy, userId), eq(venues.status, 'pending')))
  return Number(n)
}

/** Suggest a venue near a fixture's stadium (starts pending). Returns 'too-far' beyond VENUE_LIMITS.maxKm. */
export async function suggestVenue(
  db: Db,
  userId: string,
  input: { fixtureId: string; name: string; type: VenueType; notes: string | null; lat: number; lng: number },
): Promise<{ id: string } | 'no-fixture' | 'too-far'> {
  const place = await fixturePlace(db, input.fixtureId)
  if (!place) return 'no-fixture'
  const [{ near }] = await db
    .select({ near: sql<boolean>`ST_DWithin(s.location, ${point(input.lng, input.lat)}::geography, ${VENUE_LIMITS.maxKm * 1000})` })
    .from(sql`fixtures f join stadiums s on s.id = f.stadium_id`)
    .where(sql`f.id = ${input.fixtureId}`)
  if (!near) return 'too-far'
  const [row] = await db
    .insert(venues)
    .values({
      name: input.name,
      type: input.type,
      notes: input.notes,
      cityId: place.cityId,
      location: point(input.lng, input.lat),
      status: 'pending',
      suggestedBy: userId,
    })
    .returning({ id: venues.id })
  return row
}

export async function venueApproved(db: Db, id: string): Promise<boolean> {
  const [row] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, id), eq(venues.status, 'approved')))
  return !!row
}

/** Seconds until the fan can add another tip (simple flood control). */
export async function tipCooldown(db: Db, userId: string, seconds = 20): Promise<number> {
  const [last] = await db
    .select({ at: recommendations.createdAt })
    .from(recommendations)
    .where(and(eq(recommendations.userId, userId), gt(recommendations.createdAt, new Date(Date.now() - seconds * 1000))))
    .orderBy(desc(recommendations.createdAt))
    .limit(1)
  return last ? Math.max(1, Math.ceil(seconds - (Date.now() - new Date(last.at).getTime()) / 1000)) : 0
}

export async function addTip(db: Db, userId: string, venueId: string, text: string, fixtureId: string | null): Promise<string> {
  const [row] = await db.insert(recommendations).values({ venueId, userId, text, fixtureId }).returning({ id: recommendations.id })
  return row.id
}

// ---------- Admin ----------

export async function listPendingVenues(db: Db): Promise<PendingVenue[]> {
  const rows = await db
    .select({
      id: venues.id,
      name: venues.name,
      type: venues.type,
      notes: venues.notes,
      lat: latOf(venues.location),
      lng: lngOf(venues.location),
      city: cities.name,
      createdAt: venues.createdAt,
      userId: users.id,
      displayName: users.displayName,
    })
    .from(venues)
    .innerJoin(cities, eq(venues.cityId, cities.id))
    .leftJoin(users, eq(venues.suggestedBy, users.id))
    .where(eq(venues.status, 'pending'))
    .orderBy(asc(venues.createdAt))
  return rows.map(({ userId, displayName, ...r }) => ({
    ...r,
    createdAt: toIso(r.createdAt),
    suggestedBy: userId && displayName ? { id: userId, displayName, avatarUrl: null } : null,
  }))
}

export async function setVenueStatus(
  db: Db,
  id: string,
  status: 'approved' | 'rejected',
  awayFriendly?: boolean,
): Promise<boolean> {
  const rows = await db
    .update(venues)
    .set(awayFriendly === undefined ? { status } : { status, awayFriendly })
    .where(eq(venues.id, id))
    .returning({ id: venues.id })
  return rows.length > 0
}
