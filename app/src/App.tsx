import { useEffect, useState } from 'react'
import './App.css'

type Health =
  | { state: 'loading' }
  | { state: 'ok'; database: string; postgis: string }
  | { state: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<Health>({ state: 'loading' })

  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
        setHealth({ state: 'ok', database: body.database, postgis: body.postgis })
      })
      .catch((err: unknown) =>
        setHealth({ state: 'error', message: err instanceof Error ? err.message : String(err) }),
      )
  }, [])

  return (
    <main className="shell">
      <h1 className="logo">SIRO</h1>
      <p className="tagline">Plan your away day. Find your fellow fans.</p>

      <section className="status" aria-live="polite">
        <h2>System check</h2>
        {health.state === 'loading' && <p>Checking API…</p>}
        {health.state === 'ok' && (
          <p className="ok">
            API ✓ · Database {health.database} ✓ · PostGIS {health.postgis} ✓
          </p>
        )}
        {health.state === 'error' && <p className="error">API/database not reachable: {health.message}</p>}
      </section>
    </main>
  )
}

export default App
