import type { AuthProvider as Provider, Me } from '@siro/shared'
import { createContext, useContext } from 'react'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; me: Me }
  | { status: 'error'; error: Error }

export interface AuthContextValue {
  auth: AuthState
  /** Replace the cached profile after a successful update. */
  setMe: (me: Me) => void
  refresh: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/** Only allow same-site paths as a return destination (stops open redirects). */
export function safeReturnTo(path: string | null | undefined): string {
  return path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/.auth') ? path : '/'
}

/** Azure Static Web Apps built-in sign-in (ADR-0009). */
export function signInUrl(provider: Provider, returnTo = '/'): string {
  const target = `${window.location.origin}${safeReturnTo(returnTo)}`
  return `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(target)}`
}

export function signOutUrl(): string {
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(`${window.location.origin}/`)}`
}

/** "Arab Andy" → "AA", "tangerine_terror" → "TA". */
export function initials(name: string): string {
  const words = name.split(/[\s._-]+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)
  return letters.toUpperCase()
}
