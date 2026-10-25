import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { TopBar } from '../components/AppShell'
import { StateMessage } from '../components/StateMessage'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

/**
 * /map (bottom nav) – opens the map for the fan's next fixture: one they're going to,
 * else their teams' next game, else the next game overall.
 */
export function MapRedirect() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [failed, setFailed] = useState<'none' | 'error' | null>(null)

  useEffect(() => {
    if (auth.status === 'loading') return
    const ctrl = new AbortController()
    const pick = async () => {
      const s = ctrl.signal
      if (auth.status === 'signed-in') {
        const { fixtureId } = await api.nextGoing(s)
        if (fixtureId) return fixtureId
        const teams = auth.me.teams.map((t) => t.id)
        if (teams.length) {
          const mine = await api.fixtures({ teams }, s)
          if (mine.fixtures[0]) return mine.fixtures[0].id
        }
      }
      return (await api.fixtures({}, s)).fixtures[0]?.id ?? null
    }
    pick()
      .then((id) => (id ? navigate(`/fixtures/${id}/map`, { replace: true }) : setFailed('none')))
      .catch(() => !ctrl.signal.aborted && setFailed('error'))
    return () => ctrl.abort()
  }, [auth, navigate])

  return (
    <>
      <TopBar />
      <main className="page">
        {failed === null && <div className="skeleton fixture-map" aria-label="Loading map" />}
        {failed === 'none' && (
          <StateMessage title="No upcoming fixtures">
            The map opens for your next game once fixtures are announced.
          </StateMessage>
        )}
        {failed === 'error' && (
          <StateMessage title="Couldn't open the map" action={<Link to="/" className="btn btn-sm">Back to fixtures</Link>}>
            Something went wrong finding your next fixture.
          </StateMessage>
        )}
      </main>
    </>
  )
}
