import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { FixtureList } from '../components/FixtureList'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi, useDebounced } from '../lib/api'
import { useAuth } from '../lib/auth'
import { COMPETITION_CARDS, type CompetitionCardInfo } from '../lib/competitions'
import { SignInButtons } from './SignInPage'

type Tab = 'my-teams' | 'competitions'

export function HomePage() {
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 300)
  const [params] = useSearchParams()
  const tab: Tab = params.get('tab') === 'competitions' ? 'competitions' : 'my-teams'

  useEffect(() => {
    document.title = 'Siro – football away days'
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        <div>
          <label htmlFor="fixture-search" className="label">
            Find a fixture
          </label>
          <div className="search" style={{ marginTop: 6 }}>
            <Icon name="search" size={18} />
            <input
              id="fixture-search"
              type="search"
              placeholder="Team or city"
              autoComplete="off"
              maxLength={60}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {q ? (
          <SearchResults q={q} />
        ) : (
          <>
            <nav className="tabs tabs-flush" aria-label="Home">
              <Link to="?" replace className={tab === 'my-teams' ? 'active' : ''} aria-current={tab === 'my-teams' ? 'page' : undefined}>
                My teams
              </Link>
              <Link
                to="?tab=competitions"
                replace
                className={tab === 'competitions' ? 'active' : ''}
                aria-current={tab === 'competitions' ? 'page' : undefined}
              >
                Competitions
              </Link>
            </nav>
            {tab === 'my-teams' ? <MyTeams /> : <Competitions />}
          </>
        )}
      </main>
    </>
  )
}

function SearchResults({ q }: { q: string }) {
  const { state, reload } = useApi(`fixtures:q:${q}`, (signal) => api.fixtures({ q }, signal))
  return (
    <>
      <h1 className="display" style={{ fontSize: 22 }}>
        Results
      </h1>
      <FixtureList
        state={state}
        reload={reload}
        label="fixtures"
        empty={<StateMessage title="No matches">Nothing found for “{q}”. Try a team or city name.</StateMessage>}
      />
    </>
  )
}

function MyTeams() {
  const { auth } = useAuth()

  if (auth.status === 'loading') return <div className="skeleton" />
  if (auth.status === 'error') return <StateMessage title="Couldn't check your account">{auth.error.message}</StateMessage>
  if (auth.status === 'signed-out') {
    return (
      <section className="panel" aria-labelledby="my-teams-heading">
        <h1 id="my-teams-heading" className="display" style={{ fontSize: 22 }}>
          Follow your teams
        </h1>
        <p className="prose">Sign in and pick your teams to see their away days here.</p>
        <SignInButtons returnTo="/" />
        <Link to="?tab=competitions" className="cta__note">
          Or browse by competition →
        </Link>
      </section>
    )
  }
  if (auth.me.teams.length === 0) {
    return (
      <StateMessage
        title="Pick your teams"
        action={
          <Link className="btn btn-sm btn-dark" to="/profile">
            Choose teams
          </Link>
        }
      >
        Add up to 5 teams on your profile and their fixtures will appear here.
      </StateMessage>
    )
  }
  return <MyTeamsFixtures teamIds={auth.me.teams.map((t) => t.id)} />
}

function MyTeamsFixtures({ teamIds }: { teamIds: string[] }) {
  const key = teamIds.join(',')
  const upcoming = useApi(`fixtures:teams:${key}`, (signal) => api.fixtures({ teams: teamIds }, signal))
  const results = useApi(`results:teams:${key}`, (signal) => api.fixtures({ teams: teamIds, when: 'results' }, signal))

  return (
    <>
      <section className="stack" aria-labelledby="upcoming-heading">
        <h1 id="upcoming-heading" className="display" style={{ fontSize: 22 }}>
          Upcoming
        </h1>
        <FixtureList
          state={upcoming.state}
          reload={upcoming.reload}
          label="upcoming fixtures"
          empty={<StateMessage title="Nothing coming up">No fixtures for your teams yet – check back soon.</StateMessage>}
        />
      </section>
      <section className="stack" aria-labelledby="results-heading">
        <h2 id="results-heading" className="display" style={{ fontSize: 22 }}>
          Recent results
        </h2>
        <FixtureList
          state={results.state}
          reload={results.reload}
          label="recent results"
          empty={<p className="cta__note">No results yet.</p>}
        />
      </section>
    </>
  )
}

function Competitions() {
  const { state } = useApi('competitions', (signal) => api.competitions(signal))
  const counts = state.status === 'success' ? new Map(state.data.competitions.map((c) => [c.code, c.upcomingCount])) : null

  return (
    <ul className="stack" aria-label="Competitions">
      {COMPETITION_CARDS.map((c) => (
        <li key={c.code}>
          <CompetitionCard card={c} upcoming={counts ? (counts.get(c.code) ?? 0) : null} />
        </li>
      ))}
    </ul>
  )
}

/** `upcoming` is null while loading. No upcoming fixtures → "Coming soon". */
function CompetitionCard({ card, upcoming }: { card: CompetitionCardInfo; upcoming: number | null }) {
  const live = upcoming !== null && upcoming > 0
  const body = (
    <>
      <div className="comp-card__band" style={{ background: card.colour, color: card.textColour }}>
        <span className="comp-card__code">{card.code}</span>
        <span className="comp-card__name">{card.name}</span>
      </div>
      <div className="fixture-card__foot">
        <span>{card.tagline}</span>
        <strong>{upcoming === null ? '…' : live ? `${upcoming} fixtures` : 'Coming soon'}</strong>
      </div>
    </>
  )
  return live ? (
    <Link to={`/competitions/${card.code.toLowerCase()}`} className="fixture-card comp-card">
      {body}
    </Link>
  ) : (
    <div className="fixture-card comp-card comp-card--soon" aria-disabled="true">
      {body}
    </div>
  )
}
