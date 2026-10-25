import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import {
  AVATAR,
  isTravelBlocked,
  LIMITS,
  STAY_MAX_KM,
  type ApiError,
  type GoingStatus,
  type NextGoingResponse,
  type Me,
  type SetStayRequest,
  type StaysResponse,
} from '@siro/shared'
import { getDb } from '../db'
import { badRequest, isUuid, json, notFound } from '../http'
import { readJson, signedIn } from '../session'
import { attendanceId, deleteStay, setStay, staysFor } from '../stays/queries'
import { deleteAvatar, processAvatar, saveAvatar } from '../users/avatars'
import {
  fixtureFanAccess,
  getGoing,
  nextGoing,
  getMe,
  setDisplayName,
  setGoing,
  setMyTeams,
  validateDisplayName,
  type TeamSelection,
} from '../users/queries'

// ---------- Profile ----------

/** GET /api/me – the signed-in fan, with their teams. */
export const meGet = signedIn('meGet', async (_req, userId) => json<Me>(200, await getMe(getDb(), userId)))

/** PATCH /api/me { displayName } */
export const mePatch = signedIn('mePatch', async (req, userId) => {
  const body = (await readJson(req)) as { displayName?: unknown } | undefined
  const name = validateDisplayName(body?.displayName)
  if ('error' in name) return badRequest(name.error)

  if ((await setDisplayName(getDb(), userId, name.value)) === 'taken') {
    return json<ApiError>(409, { error: 'That name’s taken – try another' })
  }
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

// ---------- Profile photo ----------

/** PUT /api/me/avatar – body: a 256×256 JPEG (made in the browser). */
export const avatarPut = signedIn('avatarPut', async (req, userId) => {
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > AVATAR.maxBytes) return badRequest('That image is too big')
  const result = processAvatar(Buffer.from(await req.arrayBuffer()))
  if ('error' in result) return badRequest(result.error)
  await saveAvatar(getDb(), userId, result.jpeg)
  return json<Me>(200, await getMe(getDb(), userId))
})

/** DELETE /api/me/avatar – back to initials. */
export const avatarDelete = signedIn('avatarDelete', async (_req, userId) => {
  await deleteAvatar(getDb(), userId)
  return json<Me>(200, await getMe(getDb(), userId))
})

// ---------- Where I'm staying (only for fans going) ----------

const NOT_GOING = { error: 'Mark yourself as going to see and share where fans are staying' }

const stayHandler = (name: string, fn: (req: HttpRequest, userId: string, fixtureId: string, attendance: string) => Promise<HttpResponseInit>) =>
  signedIn(name, async (req, userId) => {
    const fixtureId = req.params.fixtureId
    if (!isUuid(fixtureId)) return badRequest('fixtureId must be a valid id')
    const attendance = await attendanceId(getDb(), userId, fixtureId)
    if (!attendance) return json<ApiError>(403, NOT_GOING)
    return fn(req, userId, fixtureId, attendance)
  })

/** GET /api/me/stays/{fixtureId} – my stay and the shaded squares for everyone going. */
export const staysGet = stayHandler('staysGet', async (_req, _userId, fixtureId, attendance) => {
  const result = await staysFor(getDb(), fixtureId, attendance)
  return result ? json<StaysResponse>(200, result) : notFound('Fixture not found')
})

/** PUT /api/me/stays/{fixtureId} { lat, lng, visibility } – rounded to a ~500m square. */
export const stayPut = stayHandler('stayPut', async (req, _userId, fixtureId, attendance) => {
  const body = (await readJson(req)) as Partial<SetStayRequest> | undefined
  const { lat, lng, visibility } = body ?? {}
  if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return badRequest('Tap the map to choose where you’re staying')
  }
  if (visibility !== 'fans_only' && visibility !== 'private') return badRequest('visibility must be fans_only or private')
  if ((await setStay(getDb(), attendance, fixtureId, { lat, lng, visibility })) === 'too-far') {
    return badRequest(`That’s more than ${STAY_MAX_KM} km from the stadium`)
  }
  return json<StaysResponse>(200, (await staysFor(getDb(), fixtureId, attendance))!)
})

/** DELETE /api/me/stays/{fixtureId} */
export const stayDelete = stayHandler('stayDelete', async (_req, _userId, fixtureId, attendance) => {
  await deleteStay(getDb(), attendance)
  return json<StaysResponse>(200, (await staysFor(getDb(), fixtureId, attendance))!)
})

// ---------- "I'm going" ----------

const goingHandler = (going: boolean | null) =>
  signedIn(going === null ? 'goingGet' : going ? 'goingPut' : 'goingDelete', async (req, userId) => {
    const fixtureId = req.params.fixtureId
    if (!isUuid(fixtureId)) return badRequest('fixtureId must be a valid id')
    const access = await fixtureFanAccess(getDb(), fixtureId)
    if (!access) return notFound('Fixture not found')
    // Un-going is always allowed; going isn't when fans can't attend.
    if (going === true && isTravelBlocked(access)) {
      return json<ApiError>(409, { error: "Fans can't attend this match – please don't travel" })
    }

    const status =
      going === null ? await getGoing(getDb(), userId, fixtureId) : await setGoing(getDb(), userId, fixtureId, going)
    return json<GoingStatus>(200, status)
  })

/** GET /api/me/next-going – { fixtureId } of the fan's next fixture they're going to, or null. */
export const nextGoingGet = signedIn('nextGoingGet', async (_req, userId) =>
  json<NextGoingResponse>(200, { fixtureId: await nextGoing(getDb(), userId) }),
)

/** GET /api/me/going/{fixtureId} */
export const goingGet = goingHandler(null)
/** PUT /api/me/going/{fixtureId} – mark as going (idempotent). */
export const goingPut = goingHandler(true)
/** DELETE /api/me/going/{fixtureId} – no longer going (idempotent). */
export const goingDelete = goingHandler(false)

app.http('meGet', { route: 'me', methods: ['GET'], authLevel: 'anonymous', handler: meGet })
app.http('mePatch', { route: 'me', methods: ['PATCH'], authLevel: 'anonymous', handler: mePatch })
app.http('avatarPut', { route: 'me/avatar', methods: ['PUT'], authLevel: 'anonymous', handler: avatarPut })
app.http('avatarDelete', { route: 'me/avatar', methods: ['DELETE'], authLevel: 'anonymous', handler: avatarDelete })
app.http('staysGet', { route: 'me/stays/{fixtureId}', methods: ['GET'], authLevel: 'anonymous', handler: staysGet })
app.http('stayPut', { route: 'me/stays/{fixtureId}', methods: ['PUT'], authLevel: 'anonymous', handler: stayPut })
app.http('stayDelete', { route: 'me/stays/{fixtureId}', methods: ['DELETE'], authLevel: 'anonymous', handler: stayDelete })
app.http('meTeamsPut', { route: 'me/teams', methods: ['PUT'], authLevel: 'anonymous', handler: meTeamsPut })
app.http('nextGoingGet', { route: 'me/next-going', methods: ['GET'], authLevel: 'anonymous', handler: nextGoingGet })
app.http('goingGet', { route: 'me/going/{fixtureId}', methods: ['GET'], authLevel: 'anonymous', handler: goingGet })
app.http('goingPut', { route: 'me/going/{fixtureId}', methods: ['PUT'], authLevel: 'anonymous', handler: goingPut })
app.http('goingDelete', { route: 'me/going/{fixtureId}', methods: ['DELETE'], authLevel: 'anonymous', handler: goingDelete })
