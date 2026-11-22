import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * One brief, non-blocking message at the bottom of the screen (above the bottom nav).
 * One at a time: a new message replaces the current one. Optional single action (Undo / Retry).
 */
export interface SnackOptions {
  message: string
  action?: { label: string; onClick: () => void }
  /** ms before it hides. Defaults: 4s, or 6s when there's an action. */
  duration?: number
}

interface Snack extends SnackOptions {
  id: number
}

const SnackbarContext = createContext<(options: SnackOptions) => void>(() => {})

export function useSnackbar() {
  return useContext(SnackbarContext)
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<Snack | null>(null)
  const nextId = useRef(0)

  const show = useCallback((options: SnackOptions) => {
    nextId.current += 1
    setSnack({ ...options, id: nextId.current })
  }, [])

  useEffect(() => {
    if (!snack) return
    const ms = snack.duration ?? (snack.action ? 6000 : 4000)
    const timer = window.setTimeout(() => setSnack((s) => (s?.id === snack.id ? null : s)), ms)
    return () => window.clearTimeout(timer)
  }, [snack])

  return (
    <SnackbarContext.Provider value={show}>
      {children}
      {/* Always rendered so screen readers pick up each new message. */}
      <div className="snackbar-region" role="status" aria-live="polite">
        {snack && (
          <div key={snack.id} className="snackbar">
            <span className="snackbar__message">{snack.message}</span>
            {snack.action && (
              <button
                type="button"
                className="snackbar__action"
                onClick={() => {
                  snack.action!.onClick()
                  setSnack(null)
                }}
              >
                {snack.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </SnackbarContext.Provider>
  )
}
