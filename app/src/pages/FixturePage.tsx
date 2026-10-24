import type { FixtureDetail } from '@siro/shared'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { TeamBand } from '../components/TeamBand'
import { api, ApiRequestError, useApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { rgba } from '../lib/colour'
import { daysUntil, formatKickoff, formatKm, formatShortDate } from '../lib/format'

export function FixturePage() {
  const { id = '' } = useParams()
  const { state, reload } = useApi(`fixture:${id}`, (signal) => api.fixture(id, signal))

  if (state.status === 'loading') {
    return (
      <main aria-busy="true" aria-label="Loading fixture">
        <div className="skeleton" style={{ height: 330 }} />
      </main>
    )
  }

  if (state.status === 'error') {
    const missing = state.error instanceof ApiRequestError && (state.error.status === 404 || state.error.status === 400)
    return (
      <main className="page">
        <BackLink />
        {missing ? (
          <StateMessage title="Fixture not found" action={<Link to="/" className="btn btn-sm">All fixtures</Link>}>
            It may have been removed, or the link is wrong.
          </StateMessage>
        ) : (
          <StateMessage
            title="Couldn't load this fixture"
            action={
              <button type="button" className="btn btn-sm" onClick={reload}>
                Try again
              </button>
            }
          >
            {state.error.message}
          </StateMessage>
        )}
      </main>
    )
  }

  return <Fixture fixture={state.data} />
}

function BackLink() {
  return (
    <Link to="/" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>
      <Icon name="back" size={18} /> Fixtures
    </Link>
  )
}

function Fixture({ fixture }: { fixture: FixtureDetail }) {
  const { homeTeam, awayTeam, city, stadium, competition } = fixture
  const band = { colour: awayTeam.primaryColour, text: awayTeam.onPrimaryColour }
  const kickoff = formatKickoff(fixture.kickoffUtc, city.timezone)
  const [showSlimBar, sentinelRef] = useScrolledPast()
  const [goingCount, setGoingCount] = useState(fixture.goingCount)
  const [shareNote, setShareNote] = useState('')

  useEffect(() => {
    document.title = `${homeTeam.name} v ${awayTeam.name} – Siro`
  }, [homeTeam.name, awayTeam.name])

  const share = async () => {
    const url = window.location.href
    const title = `${homeTeam.name} v ${awayTeam.name}`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareNote('Link copied')
      }
    } catch {
      // User cancelled the share sheet – nothing to do.
    }
  }

  const cityGuide = fixture.guideSections

  return (
    <>
      {/* Slim bar that slides in once the hero has scrolled away */}
      <div className={`slim-bar ${showSlimBar ? 'visible' : ''}`} style={{ background: band.colour, color: band.text }} aria-hidden={!showSlimBar}>
        <div className="slim-bar__inner">
          <Link to="/" className="icon-btn" aria-label="Back to fixtures" tabIndex={showSlimBar ? 0 : -1}>
            <Icon name="back" />
          </Link>
          <div className="slim-bar__title">
            <strong>
              {homeTeam.name} v {awayTeam.name}
            </strong>
            <span>{formatShortDate(fixture.kickoffUtc, city.timezone)} · {stadium.name}</span>
          </div>
        </div>
      </div>

      <main>
        <TeamBand
          className="fixture-hero"
          colour={band.colour}
          textColour={band.text}
          photoUrl={city.photoUrl}
          photoCredit={city.photoCredit}
          solidUntil={55}
          watermark
        >
          <div className="fixture-hero__bar">
            <Link to="/" className="icon-btn" aria-label="Back to fixtures">
              <Icon name="back" />
            </Link>
            <button type="button" className="icon-btn" aria-label="Share fixture" onClick={share}>
              <Icon name="share" size={20} />
            </button>
          </div>

          <div className="fixture-hero__row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="fixture-hero__kicker">{competition.name}</span>
              {fixture.stage && <span className="fixture-hero__sub">{fixture.stage}</span>}
            </div>
            <span className="badge" style={{ background: rgba(band.text, 0.14) }}>
              {homeTeam.crestUrl ? <img src={homeTeam.crestUrl} alt={`${homeTeam.name} crest`} /> : homeTeam.shortName}
            </span>
          </div>

          <h1 className="display">{homeTeam.name}</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <time dateTime={fixture.kickoffUtc} style={{ fontSize: 14, fontWeight: 600 }}>
              {kickoff}
            </time>
            <span className="fixture-hero__sub">
              {stadium.name}, {city.name}
            </span>
          </div>
          <span className="visually-hidden" aria-live="polite">
            {shareNote}
          </span>
        </TeamBand>
        <div ref={sentinelRef} aria-hidden="true" />

        <dl className="stats">
          <div>
            <dt className="label">Fans going</dt>
            <dd>{goingCount}</dd>
          </div>
          <div>
            <dt className="label">Threads</dt>
            <dd>{fixture.threadCount}</dd>
          </div>
          <div>
            <dt className="label">Days to go</dt>
            <dd>{daysUntil(fixture.kickoffUtc)}</dd>
          </div>
        </dl>

        <GoingButton fixtureId={fixture.id} onCount={setGoingCount} />

        <nav className="tabs" aria-label="Fixture sections">
          <a href="#overview" className="active" aria-current="true">
            Overview
          </a>
          <a href="#travel">Travel</a>
          <a href="#guide">Guide</a>
          <Link to={`/fixtures/${fixture.id}/discuss`}>Discuss</Link>
          <Link to="/map">Map</Link>
        </nav>

        <div className="sections">
          <section id="overview" aria-labelledby="stadium-heading">
            <span className="kicker">Stadium</span>
            <h2 id="stadium-heading" className="display">
              {stadium.name}
            </h2>
            {stadium.capacity && <p className="prose">Capacity {stadium.capacity.toLocaleString('en-GB')}</p>}
            {stadium.awayEntranceNotes && <p className="prose">{stadium.awayEntranceNotes}</p>}
            <a
              className="btn btn-sm"
              style={{ alignSelf: 'flex-start' }}
              href={`https://www.openstreetmap.org/?mlat=${stadium.lat}&mlon=${stadium.lng}#map=16/${stadium.lat}/${stadium.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in map <Icon name="external" size={16} />
            </a>
          </section>

          <section id="travel" aria-labelledby="travel-heading">
            <span className="kicker">Travel</span>
            <h2 id="travel-heading" className="display">
              Getting there
            </h2>
            {fixture.airports.length > 0 ? (
              <ul className="rows">
                {fixture.airports.map((a) => (
                  <li key={a.id}>
                    <div className="row-main">
                      <strong>
                        {a.iata} · {a.name}
                      </strong>
                      <span>to the stadium</span>
                    </div>
                    <span className="row-value">{formatKm(a.distanceKm)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="prose">No airport details yet.</p>
            )}
            <div className="grid-2">
              <a className="btn btn-dark" href="https://www.skyscanner.net/" target="_blank" rel="noreferrer">
                Flights <Icon name="external" size={16} />
              </a>
              <a
                className="btn"
                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                Hotels <Icon name="external" size={16} />
              </a>
            </div>
          </section>

          <section id="guide" aria-labelledby="guide-heading">
            <span className="kicker">City guide</span>
            <h2 id="guide-heading" className="display">
              {city.name}
            </h2>
            <div className="grid-2">
              <div className="tile">
                <span className="label" style={{ display: 'block' }}>
                  Currency
                </span>
                {city.currency}
              </div>
              <div className="tile">
                <span className="label" style={{ display: 'block' }}>
                  Language
                </span>
                {city.language}
              </div>
            </div>
            {cityGuide.map((s) => (
              <article key={s.id} className="guide-item">
                <span className="kicker">{s.scope === 'fixture' ? 'This fixture' : s.type}</span>
                <h3>{s.title}</h3>
                <p className="prose">{s.content}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </>
  )
}

/** "I'm going" toggle. Signed-out fans are sent to sign in and brought back here. */
function GoingButton({ fixtureId, onCount }: { fixtureId: string; onCount: (n: number) => void }) {
  const { auth } = useAuth()
  const location = useLocation()
  const signedIn = auth.status === 'signed-in'
  const [going, setGoing] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  // Load whether this fan is already going (private, so not part of the cached fixture data).
  useEffect(() => {
    if (!signedIn) return
    const controller = new AbortController()
    api
      .going(fixtureId, controller.signal)
      .then((s) => {
        setGoing(s.going)
        onCount(s.goingCount)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [signedIn, fixtureId, onCount])

  if (!signedIn) {
    const returnTo = encodeURIComponent(location.pathname)
    return (
      <div className="cta">
        <Link className="btn btn-primary btn-block" to={`/signin?returnTo=${returnTo}`}>
          <Icon name="check" size={18} /> I'm going
        </Link>
        <p className="cta__note">Sign in to tell other fans you’re going.</p>
      </div>
    )
  }

  const toggle = async () => {
    const next = !going
    setBusy(true)
    setMessage('')
    try {
      const status = await api.setGoing(fixtureId, next)
      setGoing(status.going)
      onCount(status.goingCount)
      setMessage(status.going ? 'You’re on the list – see you there.' : 'Removed – you’re no longer marked as going.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cta">
      <button
        type="button"
        className={`btn btn-block ${going ? 'btn-going' : 'btn-primary'}`}
        onClick={toggle}
        disabled={busy || going === null}
        aria-pressed={going ?? false}
      >
        <Icon name="check" size={18} /> {going ? 'Going – tap to undo' : "I'm going"}
      </button>
      <p className="cta__note" aria-live="polite">
        {message}
      </p>
    </div>
  )
}

/** True once the sentinel (placed under the hero) has scrolled above the top of the screen. */
function useScrolledPast(): [boolean, (el: HTMLDivElement | null) => void] {
  const [past, setPast] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  const ref = (el: HTMLDivElement | null) => {
    observer.current?.disconnect()
    if (!el) return
    observer.current = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.current.observe(el)
  }

  useEffect(() => () => observer.current?.disconnect(), [])
  return [past, ref]
}
