import type { StaysResponse } from '@siro/shared'
import { lazy, Suspense, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { api, ApiRequestError, useApi } from '../lib/api'
import { useAuth } from '../lib/auth'

const StayMap = lazy(() => import('./StayMap'))

/** "Where fans are staying" – shaded ~500m squares, and the fan's own stay (going fans only). */
export function FansStaying({ fixtureId, refreshKey }: { fixtureId: string; refreshKey: number }) {
  const { auth } = useAuth()
  const location = useLocation()
  const signedIn = auth.status === 'signed-in'
  const { state, reload } = useApi(`stays:${fixtureId}:${signedIn}:${refreshKey}`, (signal) =>
    signedIn ? api.stays(fixtureId, signal) : Promise.reject(new ApiRequestError('signed out', 401)),
  )
  const [data, setData] = useState<StaysResponse | null>(null)
  const [picking, setPicking] = useState(false)

  if (!signedIn) {
    return (
      <p className="prose">
        <Link to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}>Sign in</Link> and mark yourself as going to see where
        other fans are staying.
      </p>
    )
  }
  if (state.status === 'loading') return <div className="skeleton" style={{ height: 220 }} />
  if (state.status === 'error') {
    const notGoing = state.error instanceof ApiRequestError && state.error.status === 403
    return notGoing ? (
      <p className="prose">Mark yourself as going to see where other fans are staying – and share yours.</p>
    ) : (
      <p className="prose">
        Couldn’t load where fans are staying.{' '}
        <button type="button" className="link-btn" onClick={reload}>
          Try again
        </button>
      </p>
    )
  }

  const stays = data ?? state.data
  return picking ? (
    <StayPicker fixtureId={fixtureId} stays={stays} onDone={(next) => (setPicking(false), next && setData(next))} />
  ) : (
    <div className="stack" style={{ gap: 10 }}>
      <p className="prose">
        {stays.total === 0
          ? 'No one has shared where they’re staying yet.'
          : `${stays.total} ${stays.total === 1 ? 'fan has' : 'fans have'} shared roughly where they’re staying.`}
      </p>
      <Suspense fallback={<div className="skeleton" style={{ height: 260 }} />}>
        <StayMap stadium={stays.stadium} cells={stays.cells} mine={stays.mine} label="Map of where fans are staying" />
      </Suspense>
      <p className="cta__note">
        Squares are about 500m across – exact locations are never stored.
        {stays.mine?.visibility === 'private' && ' Your stay is private and not counted.'}
      </p>
      <button type="button" className="btn btn-dark" onClick={() => setPicking(true)} style={{ alignSelf: 'flex-start' }}>
        {stays.mine ? 'Change where I’m staying' : 'Add where I’m staying'}
      </button>
    </div>
  )
}

function StayPicker(props: { fixtureId: string; stays: StaysResponse; onDone: (next: StaysResponse | null) => void }) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [isPrivate, setPrivate] = useState(props.stays.mine?.visibility === 'private')
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  const run = async (action: () => Promise<StaysResponse>) => {
    setStatus({ kind: 'saving' })
    try {
      props.onDone(await action())
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save' })
    }
  }

  const point = picked ?? props.stays.mine
  return (
    <div className="stack" style={{ gap: 10 }}>
      <p className="prose">
        <strong>Tap roughly where you’re staying.</strong> We only keep the ~500m square, never your exact hotel.
      </p>
      <Suspense fallback={<div className="skeleton" style={{ height: 300 }} />}>
        <StayMap
          stadium={props.stays.stadium}
          cells={props.stays.cells}
          mine={props.stays.mine}
          picked={picked}
          onPick={(lat, lng) => setPicked({ lat, lng })}
          label="Map – tap to choose where you’re staying"
        />
      </Suspense>
      <label className="check">
        <input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} />
        Keep it private (only you see it)
      </label>
      {status.kind === 'error' && (
        <p className="cta__note" role="alert">
          {status.message}
        </p>
      )}
      <div className="admin-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!point || status.kind === 'saving'}
          onClick={() =>
            point && run(() => api.setStay(props.fixtureId, { lat: point.lat, lng: point.lng, visibility: isPrivate ? 'private' : 'fans_only' }))
          }
        >
          Save
        </button>
        <button type="button" className="btn" onClick={() => props.onDone(null)} disabled={status.kind === 'saving'}>
          Cancel
        </button>
        {props.stays.mine && (
          <button type="button" className="btn btn-danger" onClick={() => run(() => api.removeStay(props.fixtureId))} disabled={status.kind === 'saving'}>
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
