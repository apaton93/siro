import type { PendingVenue } from '@siro/shared'
import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi } from '../lib/api'
import { formatRelative } from '../lib/format'

const TYPE: Record<PendingVenue['type'], string> = { pub: 'Pub or bar', restaurant: 'Food', other: 'Other' }

/** Admin: places fans have suggested, waiting to be approved. */
export function PendingVenues() {
  const { state, reload } = useApi('pending-venues', (signal) => api.pendingVenues(signal))

  if (state.status === 'loading') return <div className="skeleton" style={{ height: 200 }} />
  if (state.status === 'error') {
    return (
      <StateMessage
        title="Couldn't load suggestions"
        action={
          <button type="button" className="btn btn-sm" onClick={reload}>
            Try again
          </button>
        }
      >
        {state.error.message}
      </StateMessage>
    )
  }
  return (
    <section className="panel" aria-labelledby="venues-heading">
      <h1 id="venues-heading" className="display" style={{ fontSize: 22 }}>
        Suggested places <span className="label">({state.data.venues.length})</span>
      </h1>
      <p className="cta__note">Fans’ suggestions only show on the map once approved. Check the pin and name first.</p>
      {state.data.venues.length === 0 ? (
        <p className="cta__note">Nothing waiting. 🎉</p>
      ) : (
        <ul className="pending-venues">
          {state.data.venues.map((v) => (
            <PendingRow key={v.id} venue={v} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PendingRow({ venue: v }: { venue: PendingVenue }) {
  const [awayFriendly, setAwayFriendly] = useState(false)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const decide = async (status: 'approved' | 'rejected') => {
    setBusy(true)
    setError('')
    try {
      await api.setVenueStatus(v.id, status, status === 'approved' ? awayFriendly : undefined)
      setDone(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="pending-venue">
      <div className="venue__main">
        <strong>{v.name}</strong>
        <span>
          {TYPE[v.type]} · {v.city}
        </span>
      </div>
      {v.notes && <p className="prose">{v.notes}</p>}
      <div className="post__meta">
        {v.suggestedBy && <Avatar name={v.suggestedBy.displayName} url={v.suggestedBy.avatarUrl} size="sm" />}
        <span>
          {v.suggestedBy?.displayName ?? 'Deleted account'} · <time dateTime={v.createdAt}>{formatRelative(v.createdAt)}</time>
        </span>
      </div>
      <a
        className="cta__note"
        href={`https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=18/${v.lat}/${v.lng}`}
        target="_blank"
        rel="noreferrer"
      >
        Check the pin on OpenStreetMap <Icon name="external" size={12} />
      </a>
      {done ? (
        <p className="cta__note" role="status">
          {done === 'approved' ? 'Approved – now on the map.' : 'Rejected.'}
        </p>
      ) : (
        <>
          <label className="check">
            <input type="checkbox" checked={awayFriendly} onChange={(e) => setAwayFriendly(e.target.checked)} />
            Mark as away-friendly
          </label>
          <div className="admin-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => decide('approved')} disabled={busy}>
              Approve
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => decide('rejected')} disabled={busy}>
              Reject
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="cta__note" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}
