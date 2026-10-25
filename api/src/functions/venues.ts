import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { VENUE_LIMITS, type AdminSaveResponse, type ApiError, type VenueDetail, type VenuesResponse } from '@siro/shared'
import { z } from 'zod'
import { getDb } from '../db'
import { badRequest, isUuid, json, notFound, serverError } from '../http'
import { PRIVATE, readJson, signedIn } from '../session'
import {
  addTip,
  pendingCount,
  suggestVenue,
  tipCooldown,
  venueApproved,
  venueDetail,
  venuesForFixture,
} from '../venues/queries'

const L = VENUE_LIMITS
/** Venue data changes rarely; tips are added in-page, so keep caching short. */
const SHORT_CACHE = { 'Cache-Control': 'public, max-age=30' }

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

const suggestSchema = z.object({
  fixtureId: z.string().uuid('fixtureId must be a valid id'),
  name: z
    .string({ required_error: 'Give the place a name' })
    .transform(oneLine)
    .pipe(z.string().min(2, 'Give the place a name').max(L.nameMax, `Names can be up to ${L.nameMax} characters`)),
  type: z.enum(['pub', 'restaurant', 'other'], { errorMap: () => ({ message: 'Pick a type' }) }),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? oneLine(v) : null))
    .pipe(z.string().max(L.notesMax, `Notes can be up to ${L.notesMax} characters`).nullable()),
  lat: z.number({ invalid_type_error: 'Tap the map to place it' }).min(-90).max(90),
  lng: z.number({ invalid_type_error: 'Tap the map to place it' }).min(-180).max(180),
})

const tipSchema = z.object({
  text: z
    .string({ required_error: 'Write a tip first' })
    .transform(oneLine)
    .pipe(z.string().min(2, 'Write a tip first').max(L.tipMax, `Tips can be up to ${L.tipMax} characters`)),
  fixtureId: z.string().uuid().nullable().optional(),
})

const message = (e: z.ZodError) => (e.issues[0].path.length ? e.issues[0].message : 'Send a JSON body')

/** GET /api/fixtures/{id}/venues – approved venues near the stadium. */
export async function fixtureVenues(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')
  try {
    const list = await venuesForFixture(getDb(), id)
    return list ? json<VenuesResponse>(200, { venues: list }, SHORT_CACHE) : notFound('Fixture not found')
  } catch (err) {
    context.error('Listing venues failed', err)
    return serverError()
  }
}

/** GET /api/venues/{id} – a venue and its tips. */
export async function venueGet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')
  try {
    const detail = await venueDetail(getDb(), id)
    return detail ? json<VenueDetail>(200, detail, PRIVATE) : notFound('Venue not found')
  } catch (err) {
    context.error('Loading venue failed', err)
    return serverError()
  }
}

/** POST /api/discuss/venues – suggest a place; it shows once an admin approves it. */
export const venueSuggest = signedIn('venueSuggest', async (req, userId) => {
  const parsed = suggestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest(message(parsed.error))
  if ((await pendingCount(getDb(), userId)) >= L.maxPendingPerFan) {
    return json<ApiError>(429, { error: 'You have several suggestions waiting for approval already – thanks!' })
  }
  const result = await suggestVenue(getDb(), userId, parsed.data)
  if (result === 'no-fixture') return notFound('Fixture not found')
  if (result === 'too-far') return badRequest(`That’s more than ${L.maxKm} km from the stadium`)
  return json<AdminSaveResponse>(201, result)
})

/** POST /api/discuss/venues/{id}/tips { text, fixtureId? } */
export const venueTip = signedIn('venueTip', async (req, userId) => {
  const id = req.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')
  const parsed = tipSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest(message(parsed.error))
  if (!(await venueApproved(getDb(), id))) return notFound('Venue not found')
  const wait = await tipCooldown(getDb(), userId)
  if (wait) return json<ApiError>(429, { error: `Slow down – you can add another tip in ${wait}s` })
  return json<AdminSaveResponse>(201, { id: await addTip(getDb(), userId, id, parsed.data.text, parsed.data.fixtureId ?? null) })
})

app.http('fixtureVenues', { route: 'fixtures/{id}/venues', methods: ['GET'], authLevel: 'anonymous', handler: fixtureVenues })
app.http('venueGet', { route: 'venues/{id}', methods: ['GET'], authLevel: 'anonymous', handler: venueGet })
app.http('venueSuggest', { route: 'discuss/venues', methods: ['POST'], authLevel: 'anonymous', handler: venueSuggest })
app.http('venueTip', { route: 'discuss/venues/{id}/tips', methods: ['POST'], authLevel: 'anonymous', handler: venueTip })
