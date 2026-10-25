import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { AdminReference, AdminSaveResponse, ApiError, ReportedPostsResponse } from '@siro/shared'
import { getClientPrincipal } from '../auth'
import { getDb } from '../db'
import { badRequest, isUuid, json, notFound, serverError } from '../http'
import { ensureUser } from '../users/queries'
import { createEntity, deleteEntity, ENTITIES, getReference, isAdmin, isEntity, pgCode, updateEntity } from '../admin/queries'
import { firstIssue } from '../admin/schemas'
import { listReportedPosts, setPostHidden } from '../discussion/queries'
import { deleteAvatar } from '../users/avatars'

const PRIVATE = { 'Cache-Control': 'no-store' }

type Handler = (request: HttpRequest) => Promise<HttpResponseInit>

/**
 * Azure only lets signed-in users reach /api/manage* (staticwebapp.config.json);
 * this also checks the fan's is_admin flag, and maps database rule failures to 400/409.
 */
function adminOnly(name: string, handler: Handler) {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const principal = getClientPrincipal(request)
    if (!principal) return json<ApiError>(401, { error: 'Sign in required' }, PRIVATE)
    try {
      const db = getDb()
      const userId = await ensureUser(db, principal)
      if (!(await isAdmin(db, userId))) return json<ApiError>(403, { error: 'Admins only' }, PRIVATE)
      const res = await handler(request)
      return { ...res, headers: { ...PRIVATE, ...(res.headers as Record<string, string>) } }
    } catch (err) {
      const code = pgCode(err)
      if (code === '23503') return json<ApiError>(400, { error: 'A linked record does not exist (or is still in use)' }, PRIVATE)
      if (code === '23514') return json<ApiError>(400, { error: 'That breaks a data rule' }, PRIVATE)
      if (code === '23505') return json<ApiError>(409, { error: 'That already exists' }, PRIVATE)
      context.error(`${name} failed`, err)
      return serverError()
    }
  }
}

async function readJson(request: HttpRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

/** GET /api/manage/reference – every reference record, for the admin screens. */
export const adminReference = adminOnly('adminReference', async () => json<AdminReference>(200, await getReference(getDb())))

/** POST /api/manage/{entity} */
export const adminCreate = adminOnly('adminCreate', async (req) => {
  const entity = req.params.entity
  if (!isEntity(entity)) return notFound('Unknown type')
  const parsed = ENTITIES[entity].schema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest(firstIssue(parsed.error))
  return json<AdminSaveResponse>(201, { id: await createEntity(getDb(), entity, parsed.data) })
})

/** PUT /api/manage/{entity}/{id} – replaces every field. */
export const adminUpdate = adminOnly('adminUpdate', async (req) => {
  const { entity, id } = req.params
  if (!isEntity(entity)) return notFound('Unknown type')
  if (!isUuid(id)) return badRequest('id must be a valid id')
  const parsed = ENTITIES[entity].schema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest(firstIssue(parsed.error))
  if (!(await updateEntity(getDb(), entity, id, parsed.data))) return notFound()
  return json<AdminSaveResponse>(200, { id })
})

/** DELETE /api/manage/{entity}/{id} – fixtures and guide sections only. */
export const adminDelete = adminOnly('adminDelete', async (req) => {
  const { entity, id } = req.params
  if (!isEntity(entity)) return notFound('Unknown type')
  if (!ENTITIES[entity].deletable) return json<ApiError>(405, { error: `${entity} can't be deleted` })
  if (!isUuid(id)) return badRequest('id must be a valid id')
  if (!(await deleteEntity(getDb(), entity, id))) return notFound()
  return { status: 204 }
})

// ---------- Moderation ----------

/** GET /api/manage/reported-posts – posts with reports, or hidden. */
export const reportedPosts = adminOnly('reportedPosts', async () =>
  json<ReportedPostsResponse>(200, { posts: await listReportedPosts(getDb()) }),
)

/** PUT /api/manage/posts/{id}/hidden { hidden: boolean } – restoring clears the post's reports. */
export const postHidden = adminOnly('postHidden', async (req) => {
  const id = req.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')
  const body = (await readJson(req)) as { hidden?: unknown } | undefined
  if (typeof body?.hidden !== 'boolean') return badRequest('hidden must be true or false')
  if (!(await setPostHidden(getDb(), id, body.hidden))) return notFound('Post not found')
  return json(200, { hidden: body.hidden })
})

/** DELETE /api/manage/users/{id}/avatar – remove an unsuitable profile photo. */
export const avatarRemove = adminOnly('avatarRemove', async (req) => {
  const id = req.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')
  if (!(await deleteAvatar(getDb(), id))) return notFound('No photo to remove')
  return { status: 204 }
})

app.http('avatarRemove', { route: 'manage/users/{id}/avatar', methods: ['DELETE'], authLevel: 'anonymous', handler: avatarRemove })
app.http('reportedPosts', { route: 'manage/reported-posts', methods: ['GET'], authLevel: 'anonymous', handler: reportedPosts })
app.http('postHidden', { route: 'manage/posts/{id}/hidden', methods: ['PUT'], authLevel: 'anonymous', handler: postHidden })
app.http('adminReference', { route: 'manage/reference', methods: ['GET'], authLevel: 'anonymous', handler: adminReference })
app.http('adminCreate', { route: 'manage/{entity}', methods: ['POST'], authLevel: 'anonymous', handler: adminCreate })
app.http('adminUpdate', { route: 'manage/{entity}/{id}', methods: ['PUT'], authLevel: 'anonymous', handler: adminUpdate })
app.http('adminDelete', { route: 'manage/{entity}/{id}', methods: ['DELETE'], authLevel: 'anonymous', handler: adminDelete })
