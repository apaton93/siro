import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getPool } from '../db'

/** GET /api/health – confirms the API is up and can reach Postgres + PostGIS. */
export async function health(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const started = Date.now()
  try {
    const { rows } = await getPool().query<{ database: string; postgis: string }>(
      "select split_part(version(), ' ', 2) as database, postgis_lib_version() as postgis",
    )
    return { status: 200, jsonBody: { status: 'ok', ...rows[0] } }
  } catch (err) {
    // Full detail goes to logs / Application Insights; the public response stays generic.
    const e = err as { message?: string; code?: string }
    context.error('Health check failed', {
      message: e.message,
      code: e.code,
      elapsedMs: Date.now() - started,
    })
    return { status: 503, jsonBody: { status: 'error', error: 'Database unavailable' } }
  }
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: health,
})
