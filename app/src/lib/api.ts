import type {
  AdminEntity,
  AdminReference,
  AdminSaveResponse,
  ApiError,
  CreatePostRequest,
  CreateThreadRequest,
  ReportedPostsResponse,
  ThreadCategory,
  ThreadDetail,
  ThreadsListResponse,
  CompetitionsListResponse,
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

export interface FixtureFilters {
  q?: string
  /** Any of these team ids. */
  teams?: string[]
  /** Competition code, e.g. UCL. */
  competition?: string
  when?: 'upcoming' | 'results'
  /** With teams: only games where one of them is the away side. */
  awayOnly?: boolean
}

const get = <T,>(path: string, signal?: AbortSignal) => request<T>('GET', path, { signal })
const enc = encodeURIComponent

export const api = {
  fixtures: (params: FixtureFilters = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    if (params.q) query.set('q', params.q)
    if (params.teams?.length) query.set('teams', params.teams.join(','))
    if (params.competition) query.set('competition', params.competition)
    if (params.when) query.set('when', params.when)
    if (params.awayOnly) query.set('side', 'away')
    const qs = query.toString()
    return get<FixturesListResponse>(`/api/fixtures${qs ? `?${qs}` : ''}`, signal)
  },
  competitions: (signal?: AbortSignal) => get<CompetitionsListResponse>('/api/competitions', signal),
  fixture: (id: string, signal?: AbortSignal) => get<FixtureDetail>(`/api/fixtures/${enc(id)}`, signal),
  teams: (q: string, signal?: AbortSignal) => get<TeamsListResponse>(`/api/teams${q ? `?q=${enc(q)}` : ''}`, signal),

  // Signed-in fan (401 when signed out)
  me: (signal?: AbortSignal) => get<Me>('/api/me', signal),
  updateMe: (body: UpdateMeRequest) => request<Me>('PATCH', '/api/me', { body }),
  setMyTeams: (body: SetMyTeamsRequest) => request<Me>('PUT', '/api/me/teams', { body }),
  /** Upload a square JPEG made by makeAvatar(). */
  uploadAvatar: async (image: Blob) => {
    const res = await fetch('/api/me/avatar', { method: 'PUT', headers: { 'Content-Type': 'image/jpeg', Accept: 'application/json' }, body: image })
    const body = (await res.json().catch(() => null)) as Me | ApiError | null
    if (!res.ok) throw new ApiRequestError((body as ApiError | null)?.error ?? `Upload failed (HTTP ${res.status})`, res.status)
    return body as Me
  },
  removeAvatar: () => request<Me>('DELETE', '/api/me/avatar'),
  going: (fixtureId: string, signal?: AbortSignal) => get<GoingStatus>(`/api/me/going/${enc(fixtureId)}`, signal),
  setGoing: (fixtureId: string, going: boolean) =>
    request<GoingStatus>(going ? 'PUT' : 'DELETE', `/api/me/going/${enc(fixtureId)}`),

  // Admins only (403 otherwise)
  adminReference: (signal?: AbortSignal) => get<AdminReference>('/api/manage/reference', signal),
  adminSave: (entity: AdminEntity, id: string | null, body: unknown) =>
    id
      ? request<AdminSaveResponse>('PUT', `/api/manage/${entity}/${enc(id)}`, { body })
      : request<AdminSaveResponse>('POST', `/api/manage/${entity}`, { body }),
  adminDelete: (entity: AdminEntity, id: string) => request<null>('DELETE', `/api/manage/${entity}/${enc(id)}`),
  adminRemoveAvatar: (userId: string) => request<null>('DELETE', `/api/manage/users/${enc(userId)}/avatar`),
  reportedPosts: (signal?: AbortSignal) => get<ReportedPostsResponse>('/api/manage/reported-posts', signal),
  setPostHidden: (postId: string, hidden: boolean) =>
    request<{ hidden: boolean }>('PUT', `/api/manage/posts/${enc(postId)}/hidden`, { body: { hidden } }),

  // Discussion – reads are public; writes need sign-in (/api/discuss*)
  threads: (fixtureId: string, category: ThreadCategory | null, signal?: AbortSignal) =>
    get<ThreadsListResponse>(`/api/fixtures/${enc(fixtureId)}/threads${category ? `?category=${category}` : ''}`, signal),
  thread: (id: string, signal?: AbortSignal) => get<ThreadDetail>(`/api/threads/${enc(id)}`, signal),
  createThread: (body: CreateThreadRequest) => request<AdminSaveResponse>('POST', '/api/discuss/threads', { body }),
  createPost: (threadId: string, body: CreatePostRequest) =>
    request<AdminSaveResponse>('POST', `/api/discuss/threads/${enc(threadId)}/posts`, { body }),
  reportPost: (postId: string) => request<{ hidden: boolean }>('POST', `/api/discuss/posts/${enc(postId)}/report`),
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
