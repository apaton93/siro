import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { MAX_TEAM_FILTER, type CompetitionsListResponse, type FixtureDetail, type FixturesListResponse } from '@siro/shared'
import { getDb } from '../db'
import { getFixture, listCompetitions, listFixtures, type ListFixturesFilters } from '../fixtures/queries'
import { badRequest, isUuid, json, notFound, PUBLIC_CACHE, serverError } from '../http'

const MAX_QUERY_LENGTH = 60

const CODE_RE = /^[A-Za-z]{2,6}$/

/**
 * GET /api/fixtures – upcoming fixtures, or `when=results` for recent finished games.
 * Filters: team={uuid}, teams={uuid},{uuid}… (any of), competition={uuid or code, e.g. UCL}, q={text}.
 */
export async function fixturesList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const team = request.query.get('team')
  const teams = request.query.get('teams')
  const competition = request.query.get('competition')
  const when = request.query.get('when') ?? 'upcoming'
  const q = request.query.get('q')?.trim()

  if (team && !isUuid(team)) return badRequest('team must be a valid id')
  const teamIds = teams ? [...new Set(teams.split(','))] : undefined
  if (teamIds && (teamIds.length > MAX_TEAM_FILTER || !teamIds.every(isUuid))) {
    return badRequest(`teams must be up to ${MAX_TEAM_FILTER} valid ids, comma separated`)
  }
  if (competition && !isUuid(competition) && !CODE_RE.test(competition)) {
    return badRequest('competition must be a valid id or code')
  }
  if (when !== 'upcoming' && when !== 'results') return badRequest('when must be upcoming or results')
  if (q && q.length > MAX_QUERY_LENGTH) return badRequest(`q must be ${MAX_QUERY_LENGTH} characters or fewer`)

  const competitionIsId: boolean = isUuid(competition)
  const filters: ListFixturesFilters = {
    teamId: team ?? undefined,
    teamIds,
    competitionId: competitionIsId && competition ? competition : undefined,
    competitionCode: competition && !competitionIsId ? competition.toUpperCase() : undefined,
    when,
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

/** GET /api/competitions – competitions with a code, and how many upcoming fixtures each has. */
export async function competitionsList(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    return json<CompetitionsListResponse>(200, { competitions: await listCompetitions(getDb()) }, PUBLIC_CACHE)
  } catch (err) {
    context.error('Listing competitions failed', err)
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

app.http('competitionsList', {
  route: 'competitions',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: competitionsList,
})

app.http('fixtureDetail', {
  route: 'fixtures/{id}',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: fixtureDetail,
})
