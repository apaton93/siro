import type { ReactNode } from 'react'

/** Tap-to-expand block for longer text (native <details>, so it works without JavaScript too). */
export function Collapsible(props: {
  title: string
  kicker?: string
  children: ReactNode
  defaultOpen?: boolean
  /** `section` = a whole page section (big display heading). */
  variant?: 'item' | 'section'
}) {
  return (
    <details className={`collapsible ${props.variant === 'section' ? 'collapsible--section' : ''}`} open={props.defaultOpen}>
      <summary>
        <span className="collapsible__head">
          {props.kicker && <span className="kicker">{props.kicker}</span>}
          {props.variant === 'section' ? (
            <h2 className="display collapsible__title">{props.title}</h2>
          ) : (
            <span className="collapsible__title">{props.title}</span>
          )}
        </span>
        <span className="collapsible__chevron" aria-hidden="true" />
      </summary>
      <div className="collapsible__body">{props.children}</div>
    </details>
  )
}
