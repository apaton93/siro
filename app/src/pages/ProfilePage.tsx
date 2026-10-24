import { LIMITS, type Me, type MyTeam, type TeamRef } from '@siro/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { TopBar } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StateMessage } from '../components/StateMessage'
import { api, useApi, useDebounced } from '../lib/api'
import { initials, signOutUrl, useAuth } from '../lib/auth'
import { SignInButtons } from './SignInPage'

export function ProfilePage() {
  const { auth, refresh } = useAuth()

  useEffect(() => {
    document.title = 'Your profile – Siro'
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        {auth.status === 'loading' && <div className="skeleton" style={{ height: 160 }} />}
        {auth.status === 'error' && (
          <StateMessage
            title="Couldn't load your profile"
            action={
              <button type="button" className="btn btn-sm" onClick={refresh}>
                Try again
              </button>
            }
          >
            {auth.error.message}
          </StateMessage>
        )}
        {auth.status === 'signed-out' && (
          <>
            <span className="kicker">Your profile</span>
            <h1 className="display" style={{ fontSize: 28 }}>
              Sign in
            </h1>
            <p className="prose">Sign in to pick your teams and tell other fans you’re going.</p>
            <SignInButtons returnTo="/profile" />
          </>
        )}
        {auth.status === 'signed-in' && <Profile me={auth.me} />}
      </main>
    </>
  )
}

function Profile({ me }: { me: Me }) {
  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="avatar avatar-lg" aria-hidden="true">
          {initials(me.displayName)}
        </span>
        <div>
          <h1 className="display" style={{ fontSize: 22 }}>
            {me.displayName}
          </h1>
          <span className="label">Signed in with {me.authProvider === 'github' ? 'GitHub' : 'Microsoft'}</span>
        </div>
      </header>

      <NameForm me={me} />
      <TeamsEditor me={me} />

      <a className="btn" href={signOutUrl()} style={{ alignSelf: 'flex-start' }}>
        Sign out
      </a>
    </>
  )
}

function NameForm({ me }: { me: Me }) {
  const { setMe } = useAuth()
  const [name, setName] = useState(me.displayName)
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'saving' })
    try {
      setMe(await api.updateMe({ displayName: name }))
      setStatus({ kind: 'saved' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save' })
    }
  }

  return (
    <form className="panel" onSubmit={save}>
      <label htmlFor="display-name" className="kicker">
        Display name
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id="display-name"
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setStatus({ kind: 'idle' })
          }}
          minLength={LIMITS.displayNameMin}
          maxLength={LIMITS.displayNameMax}
          required
          aria-describedby="name-help"
        />
        <button className="btn btn-dark" type="submit" disabled={status.kind === 'saving' || name.trim() === me.displayName}>
          Save
        </button>
      </div>
      <p id="name-help" className="cta__note" aria-live="polite">
        {status.kind === 'saved'
          ? 'Saved.'
          : status.kind === 'error'
            ? status.message
            : `Shown to other fans. ${LIMITS.displayNameMin}–${LIMITS.displayNameMax} characters.`}
      </p>
    </form>
  )
}

function TeamsEditor({ me }: { me: Me }) {
  const { setMe } = useAuth()
  const [selected, setSelected] = useState<MyTeam[]>(me.teams)
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 250)
  const { state } = useApi(`teams:${q}`, (signal) => api.teams(q, signal))
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  const dirty = JSON.stringify(selected.map((t) => [t.id, t.isPrimary])) !== JSON.stringify(me.teams.map((t) => [t.id, t.isPrimary]))
  const full = selected.length >= LIMITS.maxTeams

  const add = (team: TeamRef) => {
    setSelected((cur) => [...cur, { ...team, isPrimary: cur.length === 0 }])
    setSearch('')
    setStatus({ kind: 'idle' })
  }
  const remove = (id: string) => {
    setSelected((cur) => {
      const next = cur.filter((t) => t.id !== id)
      // Keep exactly one primary while any teams remain.
      if (next.length > 0 && !next.some((t) => t.isPrimary)) next[0] = { ...next[0], isPrimary: true }
      return next
    })
    setStatus({ kind: 'idle' })
  }
  const makePrimary = (id: string) => {
    setSelected((cur) => cur.map((t) => ({ ...t, isPrimary: t.id === id })))
    setStatus({ kind: 'idle' })
  }

  const save = async () => {
    setStatus({ kind: 'saving' })
    try {
      const updated = await api.setMyTeams({ teams: selected.map((t) => ({ teamId: t.id, isPrimary: t.isPrimary })) })
      setMe(updated)
      setSelected(updated.teams)
      setStatus({ kind: 'saved' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save' })
    }
  }

  const results = state.status === 'success' ? state.data.teams.filter((t) => !selected.some((s) => s.id === t.id)) : []

  return (
    <section className="panel" aria-labelledby="teams-heading">
      <span id="teams-heading" className="kicker">
        My teams
      </span>

      {selected.length === 0 ? (
        <p className="cta__note">Pick up to {LIMITS.maxTeams} teams. Your primary team comes first.</p>
      ) : (
        <ul className="team-list">
          {selected.map((t) => (
            <li key={t.id}>
              <span className="team-chip" style={{ background: t.primaryColour, color: t.onPrimaryColour }}>
                {t.name}
                {t.isPrimary && ' · Primary'}
              </span>
              <span style={{ display: 'flex', gap: 4 }}>
                {!t.isPrimary && (
                  <button type="button" className="btn btn-sm" onClick={() => makePrimary(t.id)}>
                    Make primary
                  </button>
                )}
                <button type="button" className="icon-btn" aria-label={`Remove ${t.name}`} onClick={() => remove(t.id)}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div>
          <label htmlFor="team-search" className="visually-hidden">
            Add a team
          </label>
          <div className="search">
            <Icon name="search" size={18} />
            <input
              id="team-search"
              type="search"
              placeholder="Add a team"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {q && (
            <ul className="rows" aria-label="Matching teams" style={{ marginTop: 8 }}>
              {results.length === 0 && state.status === 'success' && (
                <li>
                  <span className="cta__note">No teams match “{q}”.</span>
                </li>
              )}
              {results.map((t) => (
                <li key={t.id}>
                  <span className="row-main">
                    <strong>{t.name}</strong>
                  </span>
                  <button type="button" className="btn btn-sm" onClick={() => add(t)}>
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" className="btn btn-dark" onClick={save} disabled={!dirty || status.kind === 'saving'}>
          Save teams
        </button>
        <span className="cta__note" aria-live="polite">
          {status.kind === 'saved' ? 'Saved.' : status.kind === 'error' ? status.message : ''}
        </span>
      </div>
    </section>
  )
}
