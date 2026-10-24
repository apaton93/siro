import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { LIMITS, type GoingStatus, type Me } from '@siro/shared'
import { getClientPrincipal } from '../auth'
import { getDb } from '../db'
import { badRequest, isUuid, json, notFound, serverError } from '../http'
import {
  ensureUser,
  fixtureExists,
  getGoing,
  getMe,
  setDisplayName,
  setGoing,
  setMyTeams,
  validateDisplayName,
  type TeamSelection,
} from '../users/queries'

/** Personal data – never cache. */
const PRIVATE = { 'Cache-Control': 'no-store' }

type Handler = (request: HttpRequest, userId: string) => Promise<HttpResponseInit>

/** Require a signed-in fan (creating their record on first visit) and handle unexpected errors. */
function signedIn(name: string, handler: Handler) {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const principal = getClientPrincipal(request)
    if (!principal) return json(401, { error: 'Sign in required' }, PRIVATE)
    try {
      const userId = await ensureUser(getDb(), principal)
      const res = await handler(request, userId)
      return { ...res, headers: { ...PRIVATE, ...(res.headers as Record<string, string>) } }
    } catch (err) {
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

// ---------- Profile ----------

/** GET /api/me – the signed-in fan, with their teams. */
export const meGet = signedIn('meGet', async (_req, userId) => json<Me>(200, await getMe(getDb(), userId)))

/** PATCH /api/me { displayName } */
export const mePatch = signedIn('mePatch', async (req, userId) => {
  const body = (await readJson(req)) as { displayName?: unknown } | undefined
  const name = validateDisplayName(body?.displayName)
  if ('error' in name) return badRequest(name.error)

  await setDisplayName(getDb(), userId, name.value)
  return json<Me>(200, await getMe(getDb(), userId))
})

/** PUT /api/me/teams { teams: [{ teamId, isPrimary }] } – replaces the fan's teams. */
export const meTeamsPut = signedIn('meTeamsPut', async (req, userId) => {
  const body = (await readJson(req)) as { teams?: unknown } | undefined
  const list = body?.teams
  if (!Array.isArray(list)) return badRequest('teams must be a list')
  if (list.length > LIMITS.maxTeams) return badRequest(`You can pick up to ${LIMITS.maxTeams} teams`)

  const selection: TeamSelection = []
  for (const item of list as { teamId?: unknown; isPrimary?: unknown }[]) {
    if (typeof item?.teamId !== 'string' || !isUuid(item.teamId)) return badRequest('Each team needs a valid teamId')
    selection.push({ teamId: item.teamId, isPrimary: item.isPrimary === true })
  }
  if (new Set(selection.map((s) => s.teamId)).size !== selection.length) return badRequest('Each team can only be picked once')
  const primaries = selection.filter((s) => s.isPrimary).length
  if (selection.length > 0 && primaries !== 1) return badRequest('Pick exactly one primary team')

  const result = await setMyTeams(getDb(), userId, selection)
  if (result === 'unknown-team') return badRequest('One or more teams were not found')
  return json<Me>(200, await getMe(getDb(), userId))
})

// ---------- "I'm going" ----------

const goingHandler = (going: boolean | null) =>
  signedIn(going === null ? 'goingGet' : going ? 'goingPut' : 'goingDelete', async (req, userId) => {
    const fixtureId = req.params.fixtureId
    if (!isUuid(fixtureId)) return badRequest('fixtureId must be a valid id')
    if (!(await fixtureExists(getDb(), fixtureId))) return notFound('Fixture not found')

    const status =
      going === null ? await getGoing(getDb(), userId, fixtureId) : await setGoing(getDb(), userId, fixtureId, going)
    return json<GoingStatus>(200, status)
  })

/** GET /api/me/going/{fixtureId} */
export const goingGet = goingHandler(null)
/** PUT /api/me/going/{fixtureId} – mark as going (idempotent). */
export const goingPut = goingHandler(true)
/** DELETE /api/me/going/{fixtureId} – no longer going (idempotent). */
export const goingDelete = goingHandler(false)

app.http('meGet', { route: 'me', methods: ['GET'], authLevel: 'anonymous', handler: meGet })
app.http('mePatch', { route: 'me', methods: ['PATCH'], authLevel: 'anonymous', handler: mePatch })
app.http('meTeamsPut', { route: 'me/teams', methods: ['PUT'], authLevel: 'anonymous', handler: meTeamsPut })
app.http('goingGet', { route: 'me/going/{fixtureId}', methods: ['GET'], authLevel: 'anonymous', handler: goingGet })
app.http('goingPut', { route: 'me/going/{fixtureId}', methods: ['PUT'], authLevel: 'anonymous', handler: goingPut })
app.http('goingDelete', { route: 'me/going/{fixtureId}', methods: ['DELETE'], authLevel: 'anonymous', handler: goingDelete })
