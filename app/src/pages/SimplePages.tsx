import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { TopBar } from '../components/AppShell'
import { StateMessage } from '../components/StateMessage'

export function ComingSoonPage({ title, children }: { title: string; children: string }) {
  useEffect(() => {
    document.title = `${title} – Siro`
  }, [title])

  return (
    <>
      <TopBar />
      <main className="page">
        <span className="kicker">Coming soon</span>
        <h1 className="display" style={{ fontSize: 28 }}>
          {title}
        </h1>
        <p className="prose">{children}</p>
        <Link to="/" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}>
          Back to fixtures
        </Link>
      </main>
    </>
  )
}

export function NotFoundPage() {
  return (
    <>
      <TopBar />
      <main className="page">
        <StateMessage title="Page not found" action={<Link to="/" className="btn btn-sm">All fixtures</Link>}>
          That link doesn’t go anywhere.
        </StateMessage>
      </main>
    </>
  )
}

type Health = { status: 'loading' } | { status: 'ok'; database: string; postgis: string } | { status: 'error'; message: string }

/** /status – quick check that the API and database are reachable. */
export function StatusPage() {
  const [health, setHealth] = useState<Health>({ status: 'loading' })

  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status} (non-JSON response)` }))
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
        setHealth({ status: 'ok', database: body.database, postgis: body.postgis })
      })
      .catch((err: unknown) => setHealth({ status: 'error', message: err instanceof Error ? err.message : String(err) }))
  }, [])

  return (
    <>
      <TopBar />
      <main className="page" aria-live="polite">
        <h1 className="display" style={{ fontSize: 22 }}>
          System status
        </h1>
        {health.status === 'loading' && <p className="prose">Checking…</p>}
        {health.status === 'ok' && (
          <p className="prose">
            API ✓ · Database {health.database} ✓ · PostGIS {health.postgis} ✓
          </p>
        )}
        {health.status === 'error' && <p className="prose">API/database not reachable: {health.message}</p>}
      </main>
    </>
  )
}
