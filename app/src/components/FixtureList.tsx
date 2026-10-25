import type { FixtureSummary } from '@siro/shared'
import type { ReactNode } from 'react'
import type { Loadable } from '../lib/api'
import { FixtureCard } from './FixtureCard'
import { StateMessage } from './StateMessage'

/** A list of fixture cards with loading, error and empty states. */
export function FixtureList(props: {
  state: Loadable<{ fixtures: FixtureSummary[] }>
  reload: () => void
  empty: ReactNode
  label: string
}) {
  const { state } = props
  return (
    <div aria-live="polite" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' && (
        <div className="stack" aria-label={`Loading ${props.label}`}>
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}
      {state.status === 'error' && (
        <StateMessage
          title={`Couldn't load ${props.label}`}
          action={
            <button type="button" className="btn btn-sm" onClick={props.reload}>
              Try again
            </button>
          }
        >
          {state.error.message}
        </StateMessage>
      )}
      {state.status === 'success' &&
        (state.data.fixtures.length === 0 ? (
          props.empty
        ) : (
          <ul className="stack" aria-label={props.label}>
            {state.data.fixtures.map((f) => (
              <li key={f.id}>
                <FixtureCard fixture={f} />
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
