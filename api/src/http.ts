import type { HttpResponseInit } from '@azure/functions'
import type { ApiError } from '@siro/shared'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: string | null | undefined): value is string => !!value && UUID_RE.test(value)

export function json<T>(status: number, body: T, headers: Record<string, string> = {}): HttpResponseInit {
  return { status, jsonBody: body, headers }
}

export const badRequest = (error: string) => json<ApiError>(400, { error })
export const notFound = (error = 'Not found') => json<ApiError>(404, { error })
export const serverError = () => json<ApiError>(500, { error: 'Something went wrong' })

/** Public, read-only data can be cached briefly by browsers and the CDN. */
export const PUBLIC_CACHE = { 'Cache-Control': 'public, max-age=60' }
