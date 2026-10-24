import type { AuthProvider } from '@siro/shared'
import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { TopBar } from '../components/AppShell'
import { safeReturnTo, signInUrl, useAuth } from '../lib/auth'

const PROVIDERS: { id: AuthProvider; label: string }[] = [
  { id: 'github', label: 'Continue with GitHub' },
  { id: 'aad', label: 'Continue with Microsoft' },
]

export function SignInButtons({ returnTo }: { returnTo: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {PROVIDERS.map((p) => (
        <a key={p.id} className={`btn btn-block ${p.id === 'github' ? 'btn-dark' : ''}`} href={signInUrl(p.id, returnTo)}>
          {p.label}
        </a>
      ))}
    </div>
  )
}

/** /signin?returnTo=/fixtures/… */
export function SignInPage() {
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const { auth } = useAuth()

  useEffect(() => {
    document.title = 'Sign in – Siro'
  }, [])

  if (auth.status === 'signed-in') return <Navigate to={returnTo} replace />

  return (
    <>
      <TopBar />
      <main className="page">
        <span className="kicker">Sign in</span>
        <h1 className="display" style={{ fontSize: 28 }}>
          Join the away end
        </h1>
        <p className="prose">
          Sign in to say you’re going, pick your teams and, soon, chat with other fans travelling to the same game.
        </p>
        <SignInButtons returnTo={returnTo} />
        <p className="cta__note">
          We only keep a display name you choose and the teams you pick – never your email address.
        </p>
      </main>
    </>
  )
}
