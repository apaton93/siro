import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { TopBar } from '../components/AppShell'
import { StateMessage } from '../components/StateMessage'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { SignInButtons } from './SignInPage'

/** /map (bottom nav) – opens the map for the next fixture the fan is going to. */
export function MapRedirect() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState<'none' | 'error' | null>(null)

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    const ctrl = new AbortController()
    api
      .nextGoing(ctrl.signal)
      .then(({ fixtureId }) => (fixtureId ? navigate(`/fixtures/${fixtureId}/map`, { replace: true }) : setResult('none')))
      .catch(() => !ctrl.signal.aborted && setResult('error'))
    return () => ctrl.abort()
  }, [auth, navigate])

  const browse = (
    <Link to="/" className="btn btn-sm">
      Find a fixture
    </Link>
  )

  return (
    <>
      <TopBar />
      <main className="page">
        {(auth.status === 'loading' || (auth.status === 'signed-in' && result === null)) && (
          <div className="skeleton fixture-map" aria-label="Loading map" />
        )}
        {auth.status === 'signed-out' && (
          <>
            <StateMessage title="Your away day map">Sign in and mark yourself as going to a game to see its map here.</StateMessage>
            <SignInButtons returnTo="/map" />
          </>
        )}
        {auth.status === 'error' && <StateMessage title="Couldn't check your account">{auth.error.message}</StateMessage>}
        {result === 'none' && (
          <StateMessage title="No upcoming games" action={browse}>
            You’re not attending any upcoming games. Mark yourself as going on a fixture and its map will show here.
          </StateMessage>
        )}
        {result === 'error' && (
          <StateMessage title="Couldn't open the map" action={browse}>
            Something went wrong finding your next game.
          </StateMessage>
        )}
      </main>
    </>
  )
}
