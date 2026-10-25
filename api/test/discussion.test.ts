import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions'
import { fixtures, posts, users } from '@siro/db'
import type { ReportedPostsResponse, ThreadDetail, ThreadsListResponse } from '@siro/shared'
import { eq, sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { encodeClientPrincipal } from '../src/auth'
import { setDbForTests } from '../src/db'
import { postHidden, reportedPosts } from '../src/functions/admin'
import { postCreate, postReport, threadCreate, threadDetail, threadsList } from '../src/functions/discussion'
import { meGet } from '../src/functions/me'
import { createTestDb, type TestDb } from './test-db'

type Fan = { provider: 'github' | 'aad'; userId: string; userDetails: string }
const fan = (n: number): Fan => ({ provider: 'github', userId: `fan-${n}`, userDetails: `fan_${n}` })
const [alice, bob, cara, dan] = [1, 2, 3, 4].map(fan)
const admin: Fan = { provider: 'github', userId: 'admin', userDetails: 'the_admin' }

let t: TestDb
let fixtureId: string
const ctx = () => new InvocationContext({ functionName: 'test' })

function req(method: string, params: Record<string, string>, opts: { as?: Fan; body?: unknown; query?: string } = {}) {
  const headers: Record<string, string> = {}
  if (opts.as) headers['x-ms-client-principal'] = encodeClientPrincipal(opts.as)
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  return new HttpRequest({
    method,
    url: `http://localhost/api/x${opts.query ? `?${opts.query}` : ''}`,
    headers,
    params,
    body: opts.body === undefined ? undefined : { string: JSON.stringify(opts.body) },
  })
}
const body = <T,>(res: HttpResponseInit) => res.jsonBody as T
/** Skip the posting cooldown by moving every post a minute into the past. */
const age = () => t.db.execute(sql`update posts set created_at = created_at - interval '1 minute'`)

const startThread = async (as: Fan, extra: Record<string, unknown> = {}) => {
  const res = await threadCreate(
    req('POST', {}, { as, body: { fixtureId, category: 'pubs', title: '  Where   to meet? ', body: 'Any pubs near the ground?', ...extra } }),
    ctx(),
  )
  await age()
  return res
}
const reply = async (as: Fan, threadId: string, text: string) => {
  const res = await postCreate(req('POST', { id: threadId }, { as, body: { body: text } }), ctx())
  await age()
  return res
}
const getThread = async (id: string, as?: Fan) => body<ThreadDetail>(await threadDetail(req('GET', { id }, { as }), ctx()))

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  ;[{ id: fixtureId }] = await t.db.select({ id: fixtures.id }).from(fixtures)
  await meGet(req('GET', {}, { as: admin }), ctx())
  await t.db.update(users).set({ isAdmin: true }).where(eq(users.authUserId, 'admin'))
})

describe('threads', () => {
  let threadId: string

  it('starts a thread with its opening post and lists it', async () => {
    const res = await startThread(alice)
    expect(res.status).toBe(201)
    threadId = body<{ id: string }>(res).id

    const list = body<ThreadsListResponse>(await threadsList(req('GET', { id: fixtureId }), ctx()))
    expect(list.threads).toEqual([
      expect.objectContaining({ id: threadId, title: 'Where to meet?', category: 'pubs', postCount: 1, author: expect.objectContaining({ displayName: 'fan_1' }) }),
    ])
    const flights = body<ThreadsListResponse>(await threadsList(req('GET', { id: fixtureId }, { query: 'category=flights' }), ctx()))
    expect(flights.threads).toEqual([])
  })

  it('adds replies in order and marks the viewer’s own posts', async () => {
    await reply(bob, threadId, 'The Bar Velódromo is good.\n\n\n\nSee you there')
    const detail = await getThread(threadId, bob)
    expect(detail.fixture.homeTeam).toBe('Barcelona')
    expect(detail.posts.map((p) => [p.author.displayName, p.body, p.mine])).toEqual([
      ['fan_1', 'Any pubs near the ground?', false],
      ['fan_2', 'The Bar Velódromo is good.\n\nSee you there', true],
    ])
    expect(detail.thread.postCount).toBe(2)
  })

  it('shows threads to signed-out visitors without personal flags', async () => {
    const detail = await getThread(threadId)
    expect(detail.posts.every((p) => !p.mine && !p.reportedByMe)).toBe(true)
  })

  it('makes fans wait between posts', async () => {
    const first = await postCreate(req('POST', { id: threadId }, { as: cara, body: { body: 'One' } }), ctx())
    expect(first.status).toBe(201)
    const second = await postCreate(req('POST', { id: threadId }, { as: cara, body: { body: 'Two' } }), ctx())
    expect(second.status).toBe(429)
    expect(body<{ error: string }>(second).error).toMatch(/Slow down/)
    await age()
  })

  it.each([
    ['no title', { title: ' ' }, /at least 3/],
    ['a long title', { title: 'x'.repeat(101) }, /up to 100/],
    ['an empty post', { body: '   ' }, /Write something/],
    ['a long post', { body: 'x'.repeat(2001) }, /up to 2000/],
    ['an unknown category', { category: 'gossip' }, /category/],
  ])('rejects a thread with %s', async (_l, extra, message) => {
    const res = await startThread(dan, extra)
    expect(res.status).toBe(400)
    expect(body<{ error: string }>(res).error).toMatch(message)
  })

  it('needs sign-in to post and 404s for unknown things', async () => {
    expect((await threadCreate(req('POST', {}, { body: {} }), ctx())).status).toBe(401)
    expect((await reply(dan, '00000000-0000-4000-8000-000000000000', 'hi')).status).toBe(404)
    expect((await threadDetail(req('GET', { id: '00000000-0000-4000-8000-000000000000' }), ctx())).status).toBe(404)
    expect((await startThread(dan, { fixtureId: '00000000-0000-4000-8000-000000000000' })).status).toBe(404)
  })
})

describe('reporting and moderation', () => {
  let threadId: string
  let postId: string

  beforeAll(async () => {
    threadId = body<{ id: string }>(await startThread(alice, { title: 'Tickets?' })).id
    postId = body<{ id: string }>(await reply(bob, threadId, 'Selling tickets, DM me')).id
  })

  const report = (as: Fan) => postReport(req('POST', { id: postId }, { as }), ctx())

  it('counts one report per fan and hides the post at 3', async () => {
    expect(body(await report(alice))).toEqual({ hidden: false })
    expect(body(await report(alice))).toEqual({ hidden: false }) // repeat ignored
    expect(body(await report(cara))).toEqual({ hidden: false })
    expect((await getThread(threadId, alice)).posts[1]).toMatchObject({ reportedByMe: true, hidden: false })
    expect(body(await report(dan))).toEqual({ hidden: true })

    const hidden = (await getThread(threadId)).posts[1]
    expect(hidden).toMatchObject({ hidden: true, body: null })
  })

  it('ignores fans reporting their own post', async () => {
    const own = body<{ id: string }>(await reply(dan, threadId, 'My post')).id
    await postReport(req('POST', { id: own }, { as: dan }), ctx())
    const [p] = await t.db.select().from(posts).where(eq(posts.id, own))
    expect(p.reportedCount).toBe(0)
  })

  it('lists reported posts for admins only, who can restore them', async () => {
    expect((await reportedPosts(req('GET', {}, { as: alice }), ctx())).status).toBe(403)
    const queue = body<ReportedPostsResponse>(await reportedPosts(req('GET', {}, { as: admin }), ctx()))
    expect(queue.posts[0]).toMatchObject({ id: postId, hidden: true, reportedCount: 3, body: 'Selling tickets, DM me' })

    const restore = await postHidden(req('PUT', { id: postId }, { as: admin, body: { hidden: false } }), ctx())
    expect(restore.status).toBe(200)
    expect((await getThread(threadId)).posts[1]).toMatchObject({ hidden: false, body: 'Selling tickets, DM me' })
    // Reports were cleared, so one new report doesn't re-hide it.
    expect(body(await report(alice))).toEqual({ hidden: false })

    await postHidden(req('PUT', { id: postId }, { as: admin, body: { hidden: true } }), ctx())
    expect((await getThread(threadId)).posts[1].hidden).toBe(true)
    expect((await postHidden(req('PUT', { id: postId }, { as: admin, body: { hidden: 'yes' } }), ctx())).status).toBe(400)
  })
})
