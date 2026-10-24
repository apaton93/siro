import type { ReactNode } from 'react'

/** Empty / error states with an optional action. */
export function StateMessage({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state" role="status">
      <p className="display">{title}</p>
      {children && <p style={{ margin: 0 }}>{children}</p>}
      {action}
    </div>
  )
}
