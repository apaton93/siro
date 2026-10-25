import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getClientPrincipal } from './auth'
import { getDb } from './db'
import { json, serverError } from './http'
import { ensureUser } from './users/queries'

/** Personal data – never cache. */
export const PRIVATE = { 'Cache-Control': 'no-store' }

type Handler = (request: HttpRequest, userId: string) => Promise<HttpResponseInit>

/** Require a signed-in fan (creating their record on first visit) and handle unexpected errors. */
export function signedIn(name: string, handler: Handler) {
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

export async function readJson(request: HttpRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}


/** The signed-in fan's id if there is one (for optional personalisation on public routes). */
export async function optionalUserId(request: HttpRequest): Promise<string | null> {
  const principal = getClientPrincipal(request)
  return principal ? ensureUser(getDb(), principal) : null
}
