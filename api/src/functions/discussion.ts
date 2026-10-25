import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import {
  DISCUSSION_LIMITS,
  THREAD_CATEGORIES,
  type AdminSaveResponse,
  type ApiError,
  type ThreadCategory,
  type ThreadDetail,
  type ThreadsListResponse,
} from '@siro/shared'
import { z } from 'zod'
import { getDb } from '../db'
import {
  addPost,
  cooldownRemaining,
  createThread,
  getThread,
  listThreads,
  reportPost,
  threadExists,
} from '../discussion/queries'
import { badRequest, isUuid, json, notFound, serverError } from '../http'
import { optionalUserId, PRIVATE, readJson, signedIn } from '../session'
import { fixtureFanAccess } from '../users/queries'

const L = DISCUSSION_LIMITS

/** Trim, collapse runs of blank lines, and drop control characters (keeping newlines). */
const cleanBody = (s: string) =>
  s
    .replace(/[^\P{Cc}\n\t]/gu, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const body = z
  .string({ required_error: 'body is required' })
  .transform(cleanBody)
  .pipe(z.string().min(1, 'Write something first').max(L.bodyMax, `Posts can be up to ${L.bodyMax} characters`))

const threadSchema = z.object({
  fixtureId: z.string().uuid('fixtureId must be a valid id'),
  category: z.enum(THREAD_CATEGORIES, { errorMap: () => ({ message: 'Pick a category' }) }),
  title: z
    .string({ required_error: 'title is required' })
    .transform((s) => s.replace(/\s+/g, ' ').trim())
    .pipe(z.string().min(L.titleMin, `Titles need at least ${L.titleMin} characters`).max(L.titleMax, `Titles can be up to ${L.titleMax} characters`)),
  body,
})

const postSchema = z.object({ body })

const slowDown = (seconds: number) =>
  json<ApiError>(429, { error: `Slow down – you can post again in ${seconds}s` }, { ...PRIVATE, 'Retry-After': String(seconds) })

/** Our messages are full sentences, so show them as they are. */
const message = (error: z.ZodError) => {
  const issue = error.issues[0]
  return issue.path.length ? issue.message : 'Send a JSON body'
}

const isCategory = (v: string | null): v is ThreadCategory => !!v && (THREAD_CATEGORIES as readonly string[]).includes(v)

// ---------- Public reads ----------

/** GET /api/fixtures/{id}/threads?category= */
export async function threadsList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const fixtureId = request.params.id
  const raw = request.query.get('category')
  if (!isUuid(fixtureId)) return badRequest('id must be a valid id')
  if (raw && !isCategory(raw)) return badRequest('Unknown category')
  const category = isCategory(raw) ? raw : undefined
  try {
    if (!(await fixtureFanAccess(getDb(), fixtureId))) return notFound('Fixture not found')
    const threads = await listThreads(getDb(), fixtureId, category)
    return json<ThreadsListResponse>(200, { threads }, PRIVATE)
  } catch (err) {
    context.error('Listing threads failed', err)
    return serverError()
  }
}

/** GET /api/threads/{id} – thread and posts. Signed-in fans also get mine / reportedByMe. */
export async function threadDetail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')
  try {
    const detail = await getThread(getDb(), id, await optionalUserId(request))
    if (!detail) return notFound('Thread not found')
    return json<ThreadDetail>(200, detail, PRIVATE)
  } catch (err) {
    context.error('Loading thread failed', { id, err })
    return serverError()
  }
}

// ---------- Signed-in writes (/api/discuss* is locked to signed-in users) ----------

/** POST /api/discuss/threads { fixtureId, category, title, body } */
export const threadCreate = signedIn('threadCreate', async (req, userId) => {
  const parsed = threadSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest(message(parsed.error))
  if (!(await fixtureFanAccess(getDb(), parsed.data.fixtureId))) return notFound('Fixture not found')
  const wait = await cooldownRemaining(getDb(), userId)
  if (wait) return slowDown(wait)
  return json<AdminSaveResponse>(201, { id: await createThread(getDb(), userId, parsed.data) })
})

/** POST /api/discuss/threads/{id}/posts { body } */
export const postCreate = signedIn('postCreate', async (req, userId) => {
  const threadId = req.params.id
  if (!isUuid(threadId)) return badRequest('id must be a valid id')
  const parsed = postSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest(message(parsed.error))
  if (!(await threadExists(getDb(), threadId))) return notFound('Thread not found')
  const wait = await cooldownRemaining(getDb(), userId)
  if (wait) return slowDown(wait)
  return json<AdminSaveResponse>(201, { id: await addPost(getDb(), userId, threadId, parsed.data.body) })
})

/** POST /api/discuss/posts/{id}/report */
export const postReport = signedIn('postReport', async (req, userId) => {
  const postId = req.params.id
  if (!isUuid(postId)) return badRequest('id must be a valid id')
  const result = await reportPost(getDb(), userId, postId)
  if (!result) return notFound('Post not found')
  return json(200, result)
})

app.http('threadsList', { route: 'fixtures/{id}/threads', methods: ['GET'], authLevel: 'anonymous', handler: threadsList })
app.http('threadDetail', { route: 'threads/{id}', methods: ['GET'], authLevel: 'anonymous', handler: threadDetail })
app.http('threadCreate', { route: 'discuss/threads', methods: ['POST'], authLevel: 'anonymous', handler: threadCreate })
app.http('postCreate', { route: 'discuss/threads/{id}/posts', methods: ['POST'], authLevel: 'anonymous', handler: postCreate })
app.http('postReport', { route: 'discuss/posts/{id}/report', methods: ['POST'], authLevel: 'anonymous', handler: postReport })
