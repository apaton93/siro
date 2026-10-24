import type { HttpRequest } from '@azure/functions'
import type { AuthProvider } from '@siro/shared'

/**
 * Signed-in user as provided by Azure Static Web Apps built-in auth (ADR-0009).
 *
 * SWA adds the `x-ms-client-principal` header (base64 JSON) to API requests from signed-in users.
 * `/api/me*` routes are restricted to the `authenticated` role in staticwebapp.config.json, so
 * the platform rejects anonymous requests before they reach these functions.
 */
export interface ClientPrincipal {
  provider: AuthProvider
  /** Stable per-app user id from SWA. */
  userId: string
  /** GitHub username, or email address for Microsoft – never stored. */
  userDetails: string
  roles: string[]
}

const PROVIDERS: readonly AuthProvider[] = ['github', 'aad']

export function getClientPrincipal(request: HttpRequest): ClientPrincipal | null {
  const header = request.headers.get('x-ms-client-principal')
  if (!header) return null

  try {
    const raw = JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as {
      identityProvider?: string
      userId?: string
      userDetails?: string
      userRoles?: string[]
    }
    const provider = raw.identityProvider as AuthProvider
    if (!PROVIDERS.includes(provider) || !raw.userId) return null
    const roles = raw.userRoles ?? []
    if (!roles.includes('authenticated')) return null

    return { provider, userId: raw.userId, userDetails: raw.userDetails ?? '', roles }
  } catch {
    return null
  }
}

/** Encode a principal the way SWA does – used by tests and local tooling. */
export function encodeClientPrincipal(p: { provider: AuthProvider; userId: string; userDetails: string }): string {
  return Buffer.from(
    JSON.stringify({
      identityProvider: p.provider,
      userId: p.userId,
      userDetails: p.userDetails,
      userRoles: ['anonymous', 'authenticated'],
    }),
  ).toString('base64')
}
