import { isTravelBlocked, type FanAccess, type FixtureDetail } from '@siro/shared'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Collapsible } from '../components/Collapsible'
import { FansStaying } from '../components/FansStaying'
import { Icon } from '../components/Icon'
import { useSnackbar } from '../components/Snackbar'
import { StateMessage } from '../components/StateMessage'
import { TeamBand } from '../components/TeamBand'
import { api, ApiRequestError, useApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { rgba } from '../lib/colour'
import { fanAccessInfo } from '../lib/fanAccess'
import { daysUntil, formatKm, formatShortDate, kickoffParts } from '../lib/format'

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
  const { homeTeam, awayTeam, city, stadium } = fixture
  const band = { colour: awayTeam.primaryColour, text: awayTeam.onPrimaryColour }
  const kickoff = kickoffParts(fixture.kickoffUtc, city.timezone)
  const [showSlimBar, sentinelRef] = useScrolledPast()
  const [goingCount, setGoingCount] = useState(fixture.goingCount)
  const snack = useSnackbar()

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
        snack({ message: 'Link copied' })
      }
    } catch (err) {
      // Cancelling the share sheet is not an error.
      if (err instanceof DOMException && err.name === 'AbortError') return
      snack({ message: 'Couldn’t share the link. Copy it from the address bar instead.' })
    }
  }

  // City guide sections by type (see GUIDE_TYPES); fixture-specific notes show under the stadium.
  const citySections = fixture.guideSections.filter((s) => s.scope === 'city')
  const guide = (type: string) => citySections.filter((s) => s.type === type)
  const fixtureNotes = fixture.guideSections.filter((s) => s.scope === 'fixture')
  const otherGuide = citySections.filter((s) => !['to-centre', 'areas', 'things-to-do', 'tips'].includes(s.type))

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
            <span>
              {formatShortDate(fixture.kickoffUtc, city.timezone)} · {city.name}
            </span>
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
          solidUntil={30}
          clearTop={45}
        >
          <div className="fixture-hero__bar">
            <Link to="/" className="icon-btn" aria-label="Back to fixtures">
              <Icon name="back" />
            </Link>
            <button type="button" className="icon-btn" aria-label="Share fixture" onClick={share}>
              <Icon name="share" size={20} />
            </button>
          </div>

          <div className="fixture-hero__row" style={{ justifyContent: 'flex-end' }}>
            <span className="badge" style={{ background: rgba(band.text, 0.14) }}>
              {homeTeam.crestUrl ? <img src={homeTeam.crestUrl} alt={`${homeTeam.name} crest`} /> : homeTeam.shortName}
            </span>
          </div>

          <div className="fixture-hero__bottom">
            <div className="fixture-hero__team">
              <h1 className="display">{homeTeam.name}</h1>
              <span className="fixture-hero__sub">{city.name}</span>
            </div>
            <time className="fixture-hero__time" dateTime={fixture.kickoffUtc}>
              <strong>{kickoff.date}</strong>
              <span>{kickoff.local}</span>
              {kickoff.uk && <span className="fixture-hero__sub">{kickoff.uk}</span>}
              <span className="fixture-hero__countdown">{countdown(fixture.kickoffUtc)}</span>
            </time>
          </div>
        </TeamBand>
        <div ref={sentinelRef} aria-hidden="true" />

        <p className="pulse">
          {goingCount > 0 ? (
            <>
              <strong>{goingCount}</strong> {goingCount === 1 ? 'fan' : 'fans'} going
            </>
          ) : (
            'No one’s said they’re going yet. Be the first.'
          )}
          {fixture.threadCount > 0 && (
            <>
              {' · '}
              <strong>{fixture.threadCount}</strong> {fixture.threadCount === 1 ? 'thread' : 'threads'}
            </>
          )}
        </p>

        <FanAccessBanner access={fixture.fanAccess} note={fixture.fanAccessNote} />
        <GoingButton fixtureId={fixture.id} fanAccess={fixture.fanAccess} onCount={setGoingCount} />

        <SectionTabs fixtureId={fixture.id} />

        <div className="sections">
          <section id="overview" aria-labelledby="stadium-heading">
            <span className="kicker">Stadium</span>
            <h2 id="stadium-heading" className="display">
              {stadium.name}
            </h2>
            {stadium.capacity && <p className="prose">Capacity {stadium.capacity.toLocaleString('en-GB')}</p>}
            {stadium.awayEntranceNotes && (
              <p className="prose">
                <strong>Away fans:</strong> {stadium.awayEntranceNotes}
              </p>
            )}
            {(guide('tips').length > 0 || fixtureNotes.length > 0) && (
              <div className="collapsible-group">
                {fixtureNotes.map((s) => (
                  <Collapsible key={s.id} title={s.title} kicker="This fixture">
                    <p className="prose">{s.content}</p>
                  </Collapsible>
                ))}
                {guide('tips').map((s) => (
                  <Collapsible key={s.id} title={s.title}>
                    <p className="prose">{s.content}</p>
                  </Collapsible>
                ))}
              </div>
            )}
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

          <section id="travel">
            <Collapsible variant="section" kicker="Travel" title="Getting there">
              <div className="collapsible-group">
                <Collapsible title="Flights">
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
                  <a className="btn btn-dark btn-block" href="https://www.skyscanner.net/" target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>
                    Search flights <Icon name="external" size={16} />
                  </a>
                </Collapsible>
                <Collapsible title="To the city centre">
                  {guide('to-centre').length > 0 ? (
                    guide('to-centre').map((s) => (
                      <p key={s.id} className="prose">
                        {s.content}
                      </p>
                    ))
                  ) : (
                    <p className="prose">No details yet.</p>
                  )}
                </Collapsible>
                <Collapsible title="To the stadium">
                  <p className="prose">{stadium.gettingThere ?? 'No details yet.'}</p>
                </Collapsible>
              </div>
            </Collapsible>
          </section>

          <section id="areas">
            <Collapsible variant="section" kicker="Areas" title="Where to stay">
              {guide('areas').map((s) => (
                <p key={s.id} className="prose">
                  {s.content}
                </p>
              ))}
              {guide('areas').length === 0 && <p className="prose">No details yet.</p>}
              <h3 id="stays" className="subhead">Where fans are staying</h3>
              <FansStaying fixtureId={fixture.id} refreshKey={goingCount} />
              <a
                className="btn btn-block"
                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city.name)}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 12 }}
              >
                Search hotels <Icon name="external" size={16} />
              </a>
            </Collapsible>
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
            {guide('things-to-do').map((s) => (
              <div key={s.id} className="guide-item">
                <h3>{s.title}</h3>
                <p className="prose">{s.content}</p>
              </div>
            ))}
            {otherGuide.length > 0 && (
              <div className="collapsible-group">
                {otherGuide.map((s) => (
                  <Collapsible key={s.id} title={s.title}>
                    <p className="prose">{s.content}</p>
                  </Collapsible>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

/** Warning when UEFA has restricted who can attend. */
function FanAccessBanner({ access, note }: { access: FanAccess; note: string | null }) {
  const info = fanAccessInfo(access)
  if (!info) return null
  return (
    <div className={`advisory advisory--${info.severity}`} role="alert">
      <Icon name="alert" size={20} />
      <div>
        <strong>{info.title}</strong>
        <p>{info.body}</p>
        {note && <p className="advisory__note">{note}</p>}
      </div>
    </div>
  )
}

/** "I'm going" toggle. Signed-out fans are sent to sign in and brought back here. */
function GoingButton(props: { fixtureId: string; fanAccess: FanAccess; onCount: Dispatch<SetStateAction<number>> }) {
  const { fixtureId, onCount } = props
  const blocked = isTravelBlocked(props.fanAccess)
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const snack = useSnackbar()
  const signedIn = auth.status === 'signed-in'
  const [going, setGoing] = useState<boolean | null>(null)
  const busy = useRef(false)
  const intentHandled = useRef(false)
  // Set when a signed-out fan tapped "I'm going" and has come back from signing in.
  const wantsGoing = new URLSearchParams(location.search).get('intent') === 'going'

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

  /** Optimistic: the button and count change straight away, then roll back if the save fails. */
  const save = async (next: boolean, { quiet = false } = {}) => {
    if (busy.current) return
    busy.current = true
    setGoing(next)
    onCount((c) => Math.max(0, c + (next ? 1 : -1)))
    try {
      const status = await api.setGoing(fixtureId, next)
      setGoing(status.going)
      onCount(status.goingCount)
      if (!quiet) {
        snack({
          message: status.going ? 'You’re on the list. See you there.' : 'Removed from the list.',
          action: { label: 'Undo', onClick: () => void save(!status.going, { quiet: true }) },
        })
      }
    } catch {
      setGoing(!next)
      onCount((c) => Math.max(0, c + (next ? -1 : 1)))
      snack({
        message: 'Couldn’t update. Check your signal and try again.',
        action: { label: 'Retry', onClick: () => void save(next, { quiet }) },
      })
    } finally {
      busy.current = false
    }
  }

  // Back from sign-in with ?intent=going: finish what they started, then tidy the URL.
  useEffect(() => {
    if (!wantsGoing || !signedIn || going === null || intentHandled.current) return
    intentHandled.current = true
    navigate({ pathname: location.pathname, hash: location.hash }, { replace: true })
    if (going) snack({ message: 'You’re already on the list.' })
    else if (!blocked) void save(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsGoing, signedIn, going])

  // Fans can't attend: no "I'm going" (anyone already marked going can still undo it).
  if (blocked && !going) {
    return (
      <div className="cta">
        <button type="button" className="btn btn-primary btn-block" disabled>
          <Icon name="check" size={18} /> I'm going
        </button>
        <p className="cta__note">Away fans can’t attend this match.</p>
      </div>
    )
  }

  if (!signedIn) {
    const returnTo = encodeURIComponent(`${location.pathname}?intent=going`)
    return (
      <div className="cta">
        <Link className="btn btn-primary btn-block" to={`/signin?returnTo=${returnTo}`}>
          <Icon name="check" size={18} /> I'm going
        </Link>
        <p className="cta__note">Sign in to tell other fans you’re going. We’ll add you straight after.</p>
      </div>
    )
  }

  return (
    <div className="cta">
      <button
        type="button"
        className={`btn btn-block ${going ? 'btn-going' : 'btn-primary'}`}
        onClick={() => void save(!going)}
        disabled={going === null}
        aria-pressed={going ?? false}
      >
        <Icon name="check" size={18} /> {going ? 'Going (tap to undo)' : "I'm going"}
      </button>
      {going && <NextSteps fixtureId={fixtureId} />}
    </div>
  )
}

/** Shown once a fan is going: the two things most worth doing next. */
function NextSteps({ fixtureId }: { fixtureId: string }) {
  const openStays = () => {
    const heading = document.getElementById('stays')
    const details = heading?.closest('details')
    if (details) details.open = true
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    heading?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }
  return (
    <div className="next-steps">
      <button type="button" className="btn btn-sm" onClick={openStays}>
        Add where you’re staying
      </button>
      <Link className="btn btn-sm" to={`/fixtures/${fixtureId}/discuss`}>
        Join the discussion
      </Link>
    </div>
  )
}

const SECTION_TABS = [
  ['overview', 'Overview'],
  ['travel', 'Travel'],
  ['areas', 'Areas'],
  ['guide', 'City'],
] as const

/** Section tabs that follow your scroll position, with a fade while more tabs are off to the right. */
function SectionTabs({ fixtureId }: { fixtureId: string }) {
  const [active, setActive] = useState<string>('overview')
  const [hasMore, setHasMore] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Active tab = the last section whose top has passed under the slim bar + tabs.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      let current: string = SECTION_TABS[0][0]
      for (const [id] of SECTION_TABS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 130) current = id
      }
      setActive(atBottom ? SECTION_TABS[SECTION_TABS.length - 1][0] : current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  // Fade the right edge while there are more tabs to scroll to.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const check = () => setHasMore(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4)
    check()
    nav.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      nav.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  // Keep the active tab in view horizontally (without moving the page).
  useEffect(() => {
    const nav = navRef.current
    const tab = nav?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    if (!nav || !tab) return
    const left = tab.offsetLeft - nav.offsetLeft
    if (left < nav.scrollLeft || left + tab.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: Math.max(0, left - 20) })
    }
  }, [active])

  return (
    <div className={`tabs-wrap tabs--sticky ${hasMore ? 'has-more' : ''}`}>
      <nav ref={navRef} className="tabs" aria-label="Fixture sections">
        {SECTION_TABS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            data-tab={id}
            className={active === id ? 'active' : undefined}
            aria-current={active === id ? 'location' : undefined}
          >
            {label}
          </a>
        ))}
        <Link to={`/fixtures/${fixtureId}/discuss`}>Discuss</Link>
        <Link to={`/fixtures/${fixtureId}/map`}>Map</Link>
      </nav>
    </div>
  )
}

/** Header countdown: "Today", "Tomorrow", "In 3 days"; nothing once kicked off. */
function countdown(kickoffUtc: string): string | null {
  if (new Date(kickoffUtc).getTime() < Date.now()) return null
  const days = daysUntil(kickoffUtc)
  return days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`
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
