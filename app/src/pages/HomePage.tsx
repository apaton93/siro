import { useEffect, useState } from 'react'
import { TopBar } from '../components/AppShell'
import { FixtureCard } from '../components/FixtureCard'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi, useDebounced } from '../lib/api'

export function HomePage() {
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 300)
  const { state, reload } = useApi(`fixtures:${q}`, (signal) => api.fixtures({ q }, signal))

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

        <div className="section-head">
          <h1 className="display" style={{ fontSize: 22 }}>
            {q ? 'Results' : 'Upcoming away days'}
          </h1>
        </div>

        <div aria-live="polite" aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && (
            <div className="stack" aria-label="Loading fixtures">
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          )}

          {state.status === 'error' && (
            <StateMessage
              title="Couldn't load fixtures"
              action={
                <button type="button" className="btn btn-sm" onClick={reload}>
                  Try again
                </button>
              }
            >
              {state.error.message}
            </StateMessage>
          )}

          {state.status === 'success' &&
            (state.data.fixtures.length === 0 ? (
              <StateMessage title={q ? 'No matches' : 'No upcoming fixtures'}>
                {q ? `Nothing found for “${q}”. Try a team or city name.` : 'Check back soon.'}
              </StateMessage>
            ) : (
              <ul className="stack">
                {state.data.fixtures.map((f) => (
                  <li key={f.id}>
                    <FixtureCard fixture={f} />
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </main>
    </>
  )
}
