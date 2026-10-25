import type { FanAccess } from '@siro/shared'

export interface FanAccessInfo {
  /** Short label for fixture cards. */
  badge: string
  /** Banner heading on the fixture page. */
  title: string
  body: string
  /** "Don't travel" (red) vs "check before you go" (amber). */
  severity: 'stop' | 'caution'
}

const INFO: Record<Exclude<FanAccess, 'normal'>, FanAccessInfo> = {
  behind_closed_doors: {
    badge: 'No fans',
    title: 'Don’t travel – behind closed doors',
    body: 'This match will be played without supporters.',
    severity: 'stop',
  },
  no_away_fans: {
    badge: 'No away fans',
    title: 'Don’t travel – no away fans',
    body: 'Away supporters are banned from this match and won’t be admitted.',
    severity: 'stop',
  },
  partial_closure: {
    badge: 'Part closed',
    title: 'Part of the stadium is closed',
    body: 'Check with your club that the away section is open before booking.',
    severity: 'caution',
  },
}

export const fanAccessInfo = (access: FanAccess): FanAccessInfo | null => (access === 'normal' ? null : INFO[access])
