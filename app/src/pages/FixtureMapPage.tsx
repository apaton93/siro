import { VENUE_LIMITS, type VenueInfo, type VenueType } from '@siro/shared'
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, ApiRequestError, useApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatRelative } from '../lib/format'

const FixtureMap = lazy(() => import('../components/FixtureMap'))

const TYPE_LABELS: Record<VenueType, string> = { pub: 'Pub', restaurant: 'Food', other: 'Other' }

/** /fixtures/:id/map – stadium, recommended places, and where fans are staying. */
export function FixtureMapPage() {
  const { id = '' } = useParams()
  const { auth } = useAuth()
  const signedIn = auth.status === 'signed-in'
  const fixture = useApi(`fixture:${id}`, (signal) => api.fixture(id, signal))
  const venues = useApi(`venues:${id}`, (signal) => api.venues(id, signal))
  // Only going fans can see stays; anyone else just gets no squares.
  const stays = useApi(`stays:${id}:${signedIn}`, (signal) =>
    signedIn ? api.stays(id, signal) : Promise.reject(new ApiRequestError('signed out', 401)),
  )
  const [selected, setSelected] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [thanks, setThanks] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)

  const f = fixture.state.status === 'success' ? fixture.state.data : null
  useEffect(() => {
    document.title = f ? `Map: ${f.homeTeam.name} v ${f.awayTeam.name} – Siro` : 'Map – Siro'
  }, [f])

  const select = (vid: string) => {
    setSelected((cur) => (cur === vid ? null : vid))
    listRef.current?.querySelector(`[data-id="${vid}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const list: VenueInfo[] = venues.state.status === 'success' ? venues.state.data.venues : []
  const cells = stays.state.status === 'success' ? stays.state.data.cells : []

  return (
    <>
      <TopBar />
      <main className="page">
        <Link to={`/fixtures/${id}`} className="back-link">
          <Icon name="back" size={16} /> Back to fixture
        </Link>
        {fixture.state.status === 'error' ? (
          <StateMessage title="Couldn't load the fixture">{fixture.state.error.message}</StateMessage>
        ) : (
          <>
            <div>
              <span className="kicker">Map · {f?.city.name ?? ''}</span>
              <h1 className="display" style={{ fontSize: 24 }}>
                {f ? `${f.homeTeam.name} v ${f.awayTeam.name}` : ' '}
              </h1>
            </div>

            {f ? (
              <Suspense fallback={<div className="skeleton fixture-map" />}>
                <FixtureMap
                  stadium={f.stadium}
                  venues={suggesting ? [] : list}
                  cells={suggesting ? [] : cells}
                  selectedId={selected}
                  onSelect={select}
                  onPick={suggesting ? (lat, lng) => setPicked({ lat, lng }) : undefined}
                  picked={picked}
                />
              </Suspense>
            ) : (
              <div className="skeleton fixture-map" />
            )}

            {!suggesting && (
              <ul className="map-legend" aria-label="Key">
                <li>
                  <span className="map-pin map-pin--stadium map-pin--key" /> Stadium
                </li>
                <li>
                  <span className="map-pin map-pin--away map-pin--key" /> Away-friendly
                </li>
                <li>
                  <span className="map-pin map-pin--key" /> Other places
                </li>
                {cells.length > 0 && (
                  <li>
                    <span className="map-legend__square" /> Fans staying
                  </li>
                )}
              </ul>
            )}

            {suggesting ? (
              <SuggestForm
                fixtureId={id}
                picked={picked}
                onDone={(sent) => {
                  setSuggesting(false)
                  setPicked(null)
                  setThanks(sent)
                }}
              />
            ) : (
              <SuggestButton onStart={() => (setSuggesting(true), setThanks(false), setSelected(null))} thanks={thanks} />
            )}

            {!suggesting && (
              <section aria-labelledby="places-heading" className="stack" style={{ gap: 8 }}>
                <h2 id="places-heading" className="display" style={{ fontSize: 20 }}>
                  Places near the ground
                </h2>
                {venues.state.status === 'loading' && <div className="skeleton" style={{ height: 160 }} />}
                {venues.state.status === 'error' && (
                  <StateMessage
                    title="Couldn't load places"
                    action={
                      <button type="button" className="btn btn-sm" onClick={venues.reload}>
                        Try again
                      </button>
                    }
                  >
                    {venues.state.error.message}
                  </StateMessage>
                )}
                {venues.state.status === 'success' && list.length === 0 && (
                  <StateMessage title="No places yet">Know a good pub for away fans? Suggest it above.</StateMessage>
                )}
                {list.length > 0 && (
                  <ol className="venues" ref={listRef}>
                    {list.map((v, i) => (
                      <VenueRow key={v.id} venue={v} n={i + 1} open={selected === v.id} onToggle={() => select(v.id)} onTipped={venues.reload} />
                    ))}
                  </ol>
                )}
                <p className="cta__note">
                  {cells.length > 0
                    ? 'Shaded squares show roughly where going fans are staying.'
                    : signedIn
                      ? 'Mark yourself as going on the fixture page to see where other fans are staying.'
                      : 'Sign in and mark yourself as going to see where other fans are staying.'}
                </p>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}

function SuggestButton({ onStart, thanks }: { onStart: () => void; thanks: boolean }) {
  const { auth } = useAuth()
  const location = useLocation()
  if (auth.status === 'signed-out') {
    return (
      <p className="prose">
        <Link to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}>Sign in</Link> to suggest a pub or place for away fans.
      </p>
    )
  }
  if (auth.status !== 'signed-in') return null
  return (
    <div className="stack" style={{ gap: 6 }}>
      {thanks && (
        <p className="notice" role="status">
          Thanks – your suggestion will show once it’s been checked.
        </p>
      )}
      <button type="button" className="btn btn-dark" style={{ alignSelf: 'flex-start' }} onClick={onStart}>
        <Icon name="pin" size={16} /> Suggest a place
      </button>
    </div>
  )
}

function SuggestForm(props: { fixtureId: string; picked: { lat: number; lng: number } | null; onDone: (sent: boolean) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<VenueType>('pub')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!props.picked) return
    setStatus({ kind: 'saving' })
    try {
      await api.suggestVenue({ fixtureId: props.fixtureId, name, type, notes, ...props.picked })
      props.onDone(true)
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not send' })
    }
  }

  return (
    <form className="panel composer" onSubmit={submit} aria-label="Suggest a place">
      <p className="prose">
        <strong>{props.picked ? 'Pin dropped.' : 'Tap the map where the place is.'}</strong> We’ll check it before it shows to other fans.
      </p>
      <label htmlFor="venue-name" className="label">
        Name
      </label>
      <input id="venue-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={VENUE_LIMITS.nameMax} required />
      <label htmlFor="venue-type" className="label">
        Type
      </label>
      <select id="venue-type" className="input" value={type} onChange={(e) => setType(e.target.value as VenueType)}>
        <option value="pub">Pub or bar</option>
        <option value="restaurant">Food</option>
        <option value="other">Something else</option>
      </select>
      <label htmlFor="venue-notes" className="label">
        Why go? (optional)
      </label>
      <textarea
        id="venue-notes"
        className="input input-area"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={VENUE_LIMITS.notesMax}
        placeholder="e.g. Away fans meet here before the game"
      />
      {status.kind === 'error' && (
        <p className="cta__note" role="alert">
          {status.message}
        </p>
      )}
      <div className="admin-actions">
        <button type="submit" className="btn btn-primary" disabled={!props.picked || !name.trim() || status.kind === 'saving'}>
          Send suggestion
        </button>
        <button type="button" className="btn" onClick={() => props.onDone(false)} disabled={status.kind === 'saving'}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function VenueRow(props: { venue: VenueInfo; n: number; open: boolean; onToggle: () => void; onTipped: () => void }) {
  const v = props.venue
  return (
    <li className={`venue ${props.open ? 'venue--open' : ''}`} data-id={v.id}>
      <button type="button" className="venue__head" onClick={props.onToggle} aria-expanded={props.open}>
        <span className={`map-pin ${v.awayFriendly ? 'map-pin--away' : ''}`} aria-hidden="true">
          {props.n}
        </span>
        <span className="venue__main">
          <strong>{v.name}</strong>
          <span>
            {TYPE_LABELS[v.type]} · {v.distanceKm} km from the ground
            {v.tipCount > 0 && ` · ${v.tipCount} ${v.tipCount === 1 ? 'tip' : 'tips'}`}
          </span>
        </span>
        {v.awayFriendly && <span className="access-badge access-badge--caution">Away fans</span>}
      </button>
      {v.notes && <p className="prose venue__notes">{v.notes}</p>}
      {props.open && <VenueTips id={v.id} onTipped={props.onTipped} />}
    </li>
  )
}

function VenueTips({ id, onTipped }: { id: string; onTipped: () => void }) {
  const { auth } = useAuth()
  const { state, reload } = useApi(`venue:${id}`, (signal) => api.venue(id, signal))
  const [text, setText] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'saving' })
    try {
      await api.addVenueTip(id, text)
      setText('')
      setStatus({ kind: 'idle' })
      reload()
      onTipped()
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not add tip' })
    }
  }

  return (
    <div className="venue__tips">
      {state.status === 'loading' && <div className="skeleton" style={{ height: 60 }} />}
      {state.status === 'success' && (
        <>
          {state.data.tips.length === 0 ? (
            <p className="cta__note">No tips yet.</p>
          ) : (
            <ul className="tips">
              {state.data.tips.map((t) => (
                <li key={t.id}>
                  <Avatar name={t.author.displayName} url={t.author.avatarUrl} size="sm" />
                  <div>
                    <div className="post__meta">
                      <strong>{t.author.displayName}</strong>
                      <time dateTime={t.createdAt}>{formatRelative(t.createdAt)}</time>
                    </div>
                    <p className="post__body">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {state.data.venue.sourceUrl && (
            <a className="cta__note" href={state.data.venue.sourceUrl} target="_blank" rel="noreferrer">
              Source <Icon name="external" size={12} />
            </a>
          )}
        </>
      )}
      {auth.status === 'signed-in' && (
        <form className="tip-form" onSubmit={submit}>
          <label htmlFor={`tip-${id}`} className="visually-hidden">
            Add a tip
          </label>
          <input
            id={`tip-${id}`}
            className="input"
            placeholder="Add a tip – prices, atmosphere, opening times…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={VENUE_LIMITS.tipMax}
          />
          <button type="submit" className="btn btn-sm btn-primary" disabled={!text.trim() || status.kind === 'saving'}>
            Add
          </button>
        </form>
      )}
      {status.kind === 'error' && (
        <p className="cta__note" role="alert">
          {status.message}
        </p>
      )}
    </div>
  )
}
