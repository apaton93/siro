import type {
  AdminEntity,
  AdminReference,
  AdminSaveResponse,
  ApiError,
  FixtureDetail,
  FixturesListResponse,
  GoingStatus,
  Me,
  SetMyTeamsRequest,
  TeamsListResponse,
  UpdateMeRequest,
} from '@siro/shared'
import { useEffect, useRef, useState } from 'react'

export class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, opts: { body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(path, {
    method,
    signal: opts.signal,
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  // Platform errors (e.g. Azure "Backend call failure") are HTML, not JSON.
  const body = (await res.json().catch(() => null)) as T | ApiError | null
  if (!res.ok) {
    const message = (body as ApiError | null)?.error ?? `Request failed (HTTP ${res.status})`
    throw new ApiRequestError(message, res.status)
  }
  return body as T
}

const get = <T,>(path: string, signal?: AbortSignal) => request<T>('GET', path, { signal })
const enc = encodeURIComponent

export const api = {
  fixtures: (params: { q?: string } = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    if (params.q) query.set('q', params.q)
    const qs = query.toString()
    return get<FixturesListResponse>(`/api/fixtures${qs ? `?${qs}` : ''}`, signal)
  },
  fixture: (id: string, signal?: AbortSignal) => get<FixtureDetail>(`/api/fixtures/${enc(id)}`, signal),
  teams: (q: string, signal?: AbortSignal) => get<TeamsListResponse>(`/api/teams${q ? `?q=${enc(q)}` : ''}`, signal),

  // Signed-in fan (401 when signed out)
  me: (signal?: AbortSignal) => get<Me>('/api/me', signal),
  updateMe: (body: UpdateMeRequest) => request<Me>('PATCH', '/api/me', { body }),
  setMyTeams: (body: SetMyTeamsRequest) => request<Me>('PUT', '/api/me/teams', { body }),
  going: (fixtureId: string, signal?: AbortSignal) => get<GoingStatus>(`/api/me/going/${enc(fixtureId)}`, signal),
  setGoing: (fixtureId: string, going: boolean) =>
    request<GoingStatus>(going ? 'PUT' : 'DELETE', `/api/me/going/${enc(fixtureId)}`),

  // Admins only (403 otherwise)
  adminReference: (signal?: AbortSignal) => get<AdminReference>('/api/admin/reference', signal),
  adminSave: (entity: AdminEntity, id: string | null, body: unknown) =>
    id
      ? request<AdminSaveResponse>('PUT', `/api/admin/${entity}/${enc(id)}`, { body })
      : request<AdminSaveResponse>('POST', `/api/admin/${entity}`, { body }),
  adminDelete: (entity: AdminEntity, id: string) => request<null>('DELETE', `/api/admin/${entity}/${enc(id)}`),
}

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiRequestError | Error }

/**
 * Run an API call when `key` changes; cancels the previous request.
 * `reload()` re-runs it (e.g. a "Try again" button).
 */
export function useApi<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const loadRef = useRef(load)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; attempt: number; value: Loadable<T> } | null>(null)

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const controller = new AbortController()
    loadRef.current(controller.signal)
      .then((data) => setResult({ key, attempt, value: { status: 'success', data } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const err = error instanceof Error ? error : new Error(String(error))
        setResult({ key, attempt, value: { status: 'error', error: err } })
      })
    return () => controller.abort()
  }, [key, attempt])

  // Anything not yet answered for the current key/attempt is still loading.
  const state: Loadable<T> =
    result && result.key === key && result.attempt === attempt ? result.value : { status: 'loading' }

  return { state, reload: () => setAttempt((n) => n + 1) }
}

/** Value that only updates after `delayMs` without changes – for search-as-you-type. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
