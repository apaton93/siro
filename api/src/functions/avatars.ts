import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getDb } from '../db'
import { badRequest, isUuid, notFound, serverError } from '../http'
import { getAvatar } from '../users/avatars'

/**
 * GET /api/avatars/{userId}?v={version} – a fan's profile photo. URLs carry a version, so
 * responses can be cached for a year; a new photo gets a new URL.
 */
export async function avatarGet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.userId
  if (!isUuid(id)) return badRequest('userId must be a valid id')
  try {
    const image = await getAvatar(getDb(), id)
    if (!image) return notFound('No photo')
    return {
      status: 200,
      body: image,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': request.query.get('v') ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  } catch (err) {
    context.error('Loading avatar failed', { id, err })
    return serverError()
  }
}

app.http('avatarGet', { route: 'avatars/{userId}', methods: ['GET'], authLevel: 'anonymous', handler: avatarGet })
