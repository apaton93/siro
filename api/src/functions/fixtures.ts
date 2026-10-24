import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { FixtureDetail, FixturesListResponse } from '@siro/shared'
import { getDb } from '../db'
import { getFixture, listFixtures, type ListFixturesFilters } from '../fixtures/queries'
import { badRequest, isUuid, json, notFound, PUBLIC_CACHE, serverError } from '../http'

const MAX_QUERY_LENGTH = 60

/** GET /api/fixtures?team={uuid}&competition={uuid}&q={text} – upcoming fixtures. */
export async function fixturesList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const team = request.query.get('team')
  const competition = request.query.get('competition')
  const q = request.query.get('q')?.trim()

  if (team && !isUuid(team)) return badRequest('team must be a valid id')
  if (competition && !isUuid(competition)) return badRequest('competition must be a valid id')
  if (q && q.length > MAX_QUERY_LENGTH) return badRequest(`q must be ${MAX_QUERY_LENGTH} characters or fewer`)

  const filters: ListFixturesFilters = {
    teamId: team ?? undefined,
    competitionId: competition ?? undefined,
    q: q || undefined,
  }

  try {
    const fixtures = await listFixtures(getDb(), filters)
    return json<FixturesListResponse>(200, { fixtures }, PUBLIC_CACHE)
  } catch (err) {
    context.error('Listing fixtures failed', err)
    return serverError()
  }
}

/** GET /api/fixtures/{id} – everything the fixture page needs. */
export async function fixtureDetail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id
  if (!isUuid(id)) return badRequest('id must be a valid id')

  try {
    const fixture = await getFixture(getDb(), id)
    if (!fixture) return notFound('Fixture not found')
    return json<FixtureDetail>(200, fixture, PUBLIC_CACHE)
  } catch (err) {
    context.error('Loading fixture failed', { id, err })
    return serverError()
  }
}

app.http('fixturesList', {
  route: 'fixtures',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: fixturesList,
})

app.http('fixtureDetail', {
  route: 'fixtures/{id}',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: fixtureDetail,
})
