import { fixtures, postReports, posts, teams, threads, users } from '@siro/db'
import {
  DISCUSSION_LIMITS,
  type Author,
  type PostInfo,
  type ReportedPost,
  type ThreadCategory,
  type ThreadDetail,
  type ThreadSummary,
} from '@siro/shared'
import { and, asc, count, desc, eq, gt, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Db } from '../db'
import { avatarUrl } from '../users/avatars'

const MAX_THREADS = 100
const MAX_POSTS = 500

const toIso = (value: Date | string) => new Date(value).toISOString()

/** Author columns, with their photo's version (users is never aliased in these queries). */
const authorCols = {
  id: users.id,
  displayName: users.displayName,
  avatarAt: sql<string | null>`(select a.updated_at from user_avatars a where a.user_id = users.id)`,
}
const toAuthor = (a: { id: string; displayName: string; avatarAt: string | Date | null }): Author => ({
  id: a.id,
  displayName: a.displayName,
  avatarUrl: avatarUrl(a.id, a.avatarAt),
})

// Thread stats from its posts. Raw table names: Drizzle leaves columns unqualified in
// single-table selects, which would make "id" ambiguous inside a subquery.
const postCount = sql<number>`(select count(*)::int from posts p where p.thread_id = threads.id)`
const lastPostAt = sql<string>`(select max(p.created_at) from posts p where p.thread_id = threads.id)`

const threadCols = {
  id: threads.id,
  fixtureId: threads.fixtureId,
  category: threads.category,
  title: threads.title,
  createdAt: threads.createdAt,
  author: authorCols,
  postCount,
  lastPostAt,
}

type ThreadRow = {
  createdAt: Date | string
  lastPostAt: Date | string | null
  postCount: number
  author: { id: string; displayName: string; avatarAt: string | Date | null }
} & Omit<ThreadSummary, 'createdAt' | 'lastPostAt' | 'postCount' | 'author'>

const toSummary = (r: ThreadRow): ThreadSummary => ({
  ...r,
  author: toAuthor(r.author),
  createdAt: toIso(r.createdAt),
  lastPostAt: toIso(r.lastPostAt ?? r.createdAt),
  postCount: Number(r.postCount),
})

/** Threads for a fixture, most recently active first. */
export async function listThreads(db: Db, fixtureId: string, category?: ThreadCategory): Promise<ThreadSummary[]> {
  const rows = await db
    .select(threadCols)
    .from(threads)
    .innerJoin(users, eq(threads.userId, users.id))
    .where(and(eq(threads.fixtureId, fixtureId), category ? eq(threads.category, category) : undefined))
    .orderBy(desc(lastPostAt), desc(threads.createdAt))
    .limit(MAX_THREADS)
  return rows.map(toSummary)
}

/** A thread with its posts (oldest first). `viewerId` sets mine / reportedByMe. */
export async function getThread(db: Db, threadId: string, viewerId: string | null): Promise<ThreadDetail | null> {
  const [row] = await db
    .select(threadCols)
    .from(threads)
    .innerJoin(users, eq(threads.userId, users.id))
    .where(eq(threads.id, threadId))
  if (!row) return null

  const home = alias(teams, 'home_team')
  const away = alias(teams, 'away_team')
  const [fixture] = await db
    .select({ id: fixtures.id, homeTeam: home.name, awayTeam: away.name, kickoffUtc: fixtures.kickoffUtc })
    .from(fixtures)
    .innerJoin(home, eq(fixtures.homeTeamId, home.id))
    .innerJoin(away, eq(fixtures.awayTeamId, away.id))
    .where(eq(fixtures.id, row.fixtureId))

  const reportedByMe = viewerId
    ? sql<boolean>`exists (select 1 from post_reports r where r.post_id = posts.id and r.user_id = ${viewerId})`
    : sql<boolean>`false`
  const postRows = await db
    .select({
      id: posts.id,
      body: posts.body,
      hidden: posts.hidden,
      createdAt: posts.createdAt,
      author: authorCols,
      reportedByMe,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.threadId, threadId))
    .orderBy(asc(posts.createdAt))
    .limit(MAX_POSTS)

  const postsOut: PostInfo[] = postRows.map((p) => ({
    id: p.id,
    author: toAuthor(p.author),
    body: p.hidden ? null : p.body,
    hidden: p.hidden,
    createdAt: toIso(p.createdAt),
    mine: viewerId === p.author.id,
    reportedByMe: Boolean(p.reportedByMe),
  }))

  return {
    thread: toSummary(row),
    fixture: { ...fixture, kickoffUtc: toIso(fixture.kickoffUtc) },
    posts: postsOut,
  }
}

/** Seconds the fan must still wait before posting again (0 = can post now). */
export async function cooldownRemaining(db: Db, userId: string): Promise<number> {
  const since = new Date(Date.now() - DISCUSSION_LIMITS.cooldownSeconds * 1000)
  const [last] = await db
    .select({ createdAt: posts.createdAt })
    .from(posts)
    .where(and(eq(posts.userId, userId), gt(posts.createdAt, since)))
    .orderBy(desc(posts.createdAt))
    .limit(1)
  if (!last) return 0
  const elapsed = (Date.now() - new Date(last.createdAt).getTime()) / 1000
  return Math.max(1, Math.ceil(DISCUSSION_LIMITS.cooldownSeconds - elapsed))
}

/** Start a thread with its opening post. Returns the thread id. */
export async function createThread(
  db: Db,
  userId: string,
  input: { fixtureId: string; category: ThreadCategory; title: string; body: string },
): Promise<string> {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .insert(threads)
      .values({ fixtureId: input.fixtureId, userId, category: input.category, title: input.title })
      .returning({ id: threads.id })
    await tx.insert(posts).values({ threadId: thread.id, userId, body: input.body })
    return thread.id
  })
}

export async function threadExists(db: Db, threadId: string): Promise<boolean> {
  const [row] = await db.select({ id: threads.id }).from(threads).where(eq(threads.id, threadId))
  return !!row
}

export async function addPost(db: Db, userId: string, threadId: string, body: string): Promise<string> {
  const [row] = await db.insert(posts).values({ threadId, userId, body }).returning({ id: posts.id })
  return row.id
}

/**
 * Report a post (once per fan; reporting your own post does nothing). Hides it once
 * DISCUSSION_LIMITS.reportsToHide different fans have reported it. Returns null if no such post.
 */
export async function reportPost(db: Db, userId: string, postId: string): Promise<{ hidden: boolean } | null> {
  return db.transaction(async (tx) => {
    const [post] = await tx.select({ userId: posts.userId, hidden: posts.hidden }).from(posts).where(eq(posts.id, postId))
    if (!post) return null
    if (post.userId === userId) return { hidden: post.hidden }

    await tx.insert(postReports).values({ postId, userId }).onConflictDoNothing()
    const [{ n }] = await tx.select({ n: count() }).from(postReports).where(eq(postReports.postId, postId))
    const reports = Number(n)
    const hidden = post.hidden || reports >= DISCUSSION_LIMITS.reportsToHide
    await tx.update(posts).set({ reportedCount: reports, hidden }).where(eq(posts.id, postId))
    return { hidden }
  })
}

// ---------- Admin moderation ----------

/** Posts that have been reported or hidden, most reported first. */
export async function listReportedPosts(db: Db): Promise<ReportedPost[]> {
  const rows = await db
    .select({
      id: posts.id,
      body: posts.body,
      hidden: posts.hidden,
      reportedCount: posts.reportedCount,
      createdAt: posts.createdAt,
      author: authorCols,
      thread: { id: threads.id, title: threads.title, fixtureId: threads.fixtureId },
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .innerJoin(threads, eq(posts.threadId, threads.id))
    .where(or(gt(posts.reportedCount, 0), eq(posts.hidden, true)))
    .orderBy(desc(posts.hidden), desc(posts.reportedCount), desc(posts.createdAt))
    .limit(200)
  return rows.map((r) => ({ ...r, author: toAuthor(r.author), createdAt: toIso(r.createdAt) }))
}

/**
 * Hide or restore a post. Restoring also clears its reports, so it isn't hidden again
 * straight away by the same reports.
 */
export async function setPostHidden(db: Db, postId: string, hidden: boolean): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(posts)
      .set(hidden ? { hidden } : { hidden, reportedCount: 0 })
      .where(eq(posts.id, postId))
      .returning({ id: posts.id })
    if (rows.length && !hidden) await tx.delete(postReports).where(eq(postReports.postId, postId))
    return rows.length > 0
  })
}
