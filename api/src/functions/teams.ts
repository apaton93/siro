import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { TeamsListResponse } from '@siro/shared'
import { getDb } from '../db'
import { badRequest, json, PUBLIC_CACHE, serverError } from '../http'
import { searchTeams } from '../users/queries'

/** GET /api/teams?q={text} – teams for the profile team picker (public). */
export async function teamsList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const q = request.query.get('q')?.trim()
  if (q && q.length > 60) return badRequest('q must be 60 characters or fewer')
  try {
    return json<TeamsListResponse>(200, { teams: await searchTeams(getDb(), q || undefined) }, PUBLIC_CACHE)
  } catch (err) {
    context.error('Listing teams failed', err)
    return serverError()
  }
}

app.http('teamsList', { route: 'teams', methods: ['GET'], authLevel: 'anonymous', handler: teamsList })
