import type { Me } from '@siro/shared'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, ApiRequestError } from '../lib/api'
import { AuthContext, type AuthState } from '../lib/auth'

/** Loads the signed-in fan once (GET /api/me; 401 = signed out) and shares it app-wide. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api
      .me(controller.signal)
      .then((me) => setAuth({ status: 'signed-in', me }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
          setAuth({ status: 'signed-out' })
        } else {
          setAuth({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
        }
      })
    return () => controller.abort()
  }, [attempt])

  const setMe = useCallback((me: Me) => setAuth({ status: 'signed-in', me }), [])
  const refresh = useCallback(() => setAttempt((n) => n + 1), [])

  return <AuthContext.Provider value={{ auth, setMe, refresh }}>{children}</AuthContext.Provider>
}

