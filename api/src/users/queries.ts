import { attendances, fixtures, teams, userTeams, users } from '@siro/db'
import { LIMITS, type FanAccess, type GoingStatus, type Me, type TeamRef } from '@siro/shared'
import { and, asc, count, desc, eq, ilike, inArray } from 'drizzle-orm'
import type { ClientPrincipal } from '../auth'
import type { Db } from '../db'

const teamCols = {
  id: teams.id,
  name: teams.name,
  shortName: teams.shortName,
  crestUrl: teams.crestUrl,
  primaryColour: teams.primaryColour,
  onPrimaryColour: teams.onPrimaryColour,
}

const NAME_RE = /^[\p{L}\p{N} ._'-]+$/u

/** Normalise and check a display name; returns an error message if invalid. */
export function validateDisplayName(input: unknown): { value: string } | { error: string } {
  if (typeof input !== 'string') return { error: 'displayName is required' }
  const value = input.trim().replace(/\s+/g, ' ')
  if (value.length < LIMITS.displayNameMin || value.length > LIMITS.displayNameMax) {
    return { error: `Display name must be ${LIMITS.displayNameMin}–${LIMITS.displayNameMax} characters` }
  }
  if (!NAME_RE.test(value)) return { error: 'Display name can only use letters, numbers, spaces and . _ \' -' }
  return { value }
}

/**
 * First display name for a new fan. GitHub gives a username we can use; Microsoft gives an
 * email address, which we never store – so those fans start as "Fan XXXX" and can rename.
 */
export function defaultDisplayName(p: ClientPrincipal): string {
  if (p.provider === 'github') {
    const result = validateDisplayName(p.userDetails)
    if ('value' in result) return result.value
  }
  return `Fan ${p.userId.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() || 'NEW'}`
}

/** Find the fan for this sign-in, creating them on first visit. Returns the user id. */
export async function ensureUser(db: Db, p: ClientPrincipal): Promise<string> {
  await db
    .insert(users)
    .values({ authProvider: p.provider, authUserId: p.userId, displayName: defaultDisplayName(p) })
    .onConflictDoNothing({ target: [users.authProvider, users.authUserId] })

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.authProvider, p.provider), eq(users.authUserId, p.userId)))
  return row.id
}

export async function getMe(db: Db, userId: string): Promise<Me> {
  const [user] = await db
    .select({ id: users.id, displayName: users.displayName, authProvider: users.authProvider, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))

  const myTeams = await db
    .select({ ...teamCols, isPrimary: userTeams.isPrimary })
    .from(userTeams)
    .innerJoin(teams, eq(userTeams.teamId, teams.id))
    .where(eq(userTeams.userId, userId))
    .orderBy(desc(userTeams.isPrimary), asc(teams.name))

  return { ...user, teams: myTeams }
}

export async function setDisplayName(db: Db, userId: string, displayName: string): Promise<void> {
  await db.update(users).set({ displayName }).where(eq(users.id, userId))
}

export type TeamSelection = { teamId: string; isPrimary: boolean }[]

/** Replace the fan's teams. Caller validates shape; this checks the teams exist. */
export async function setMyTeams(db: Db, userId: string, selection: TeamSelection): Promise<'ok' | 'unknown-team'> {
  const ids = selection.map((s) => s.teamId)
  if (ids.length > 0) {
    const [{ n }] = await db.select({ n: count() }).from(teams).where(inArray(teams.id, ids))
    if (Number(n) !== ids.length) return 'unknown-team'
  }

  await db.transaction(async (tx) => {
    await tx.delete(userTeams).where(eq(userTeams.userId, userId))
    if (selection.length > 0) {
      await tx.insert(userTeams).values(selection.map((s) => ({ userId, teamId: s.teamId, isPrimary: s.isPrimary })))
    }
  })
  return 'ok'
}

// ---------- "I'm going" ----------

/** The fixture's fan access, or null if there's no such fixture. */
export async function fixtureFanAccess(db: Db, fixtureId: string): Promise<FanAccess | null> {
  const [row] = await db.select({ fanAccess: fixtures.fanAccess }).from(fixtures).where(eq(fixtures.id, fixtureId))
  return row?.fanAccess ?? null
}

export async function getGoing(db: Db, userId: string, fixtureId: string): Promise<GoingStatus> {
  const [[mine], [{ n }]] = await Promise.all([
    db
      .select({ id: attendances.id })
      .from(attendances)
      .where(and(eq(attendances.userId, userId), eq(attendances.fixtureId, fixtureId))),
    db.select({ n: count() }).from(attendances).where(eq(attendances.fixtureId, fixtureId)),
  ])
  return { going: !!mine, goingCount: Number(n) }
}

export async function setGoing(db: Db, userId: string, fixtureId: string, going: boolean): Promise<GoingStatus> {
  if (going) {
    await db
      .insert(attendances)
      .values({ userId, fixtureId })
      .onConflictDoNothing({ target: [attendances.userId, attendances.fixtureId] })
  } else {
    await db.delete(attendances).where(and(eq(attendances.userId, userId), eq(attendances.fixtureId, fixtureId)))
  }
  return getGoing(db, userId, fixtureId)
}

// ---------- Team search (public) ----------

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

export async function searchTeams(db: Db, q?: string): Promise<TeamRef[]> {
  return db
    .select(teamCols)
    .from(teams)
    .where(q ? ilike(teams.name, `%${escapeLike(q)}%`) : undefined)
    .orderBy(asc(teams.name))
    .limit(50)
}
