/** Date/time formatting for fixtures. Kickoffs are stored in UTC; show local (host city) time + UK time. */

const UK_TZ = 'Europe/London'

const parts = (iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).format(new Date(iso))

const time = (iso: string, timeZone: string) => parts(iso, timeZone, { hour: '2-digit', minute: '2-digit' })

const zoneName = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'short' })
    .formatToParts(new Date(iso))
    .find((p) => p.type === 'timeZoneName')?.value ?? ''

/** Build "Thu 26 Nov [2026]" from parts – browsers differ on commas, so don't rely on their joining. */
function dateLabel(iso: string, timeZone: string, withYear: boolean): string {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? ''
  return [get('weekday'), get('day'), get('month'), withYear ? get('year') : ''].filter(Boolean).join(' ')
}

/** "Thu 26 Nov" in the host city's timezone. */
export function formatShortDate(iso: string, timeZone: string): string {
  return dateLabel(iso, timeZone, false)
}

/**
 * "Thu 26 Nov 2026 · 20:00 CET (19:00 UK)".
 * If the host city is on UK time, the UK time is not repeated: "Thu 10 Dec 2026 · 20:00 GMT".
 */
export function formatKickoff(iso: string, timeZone: string): string {
  const date = dateLabel(iso, timeZone, true)
  const local = time(iso, timeZone)
  const uk = time(iso, UK_TZ)
  const zone = zoneName(iso, timeZone)
  return local === uk ? `${date} · ${local} ${zone}` : `${date} · ${local} ${zone} (${uk} UK)`
}

/** Whole days from now until kickoff (0 on matchday or after). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const ms = new Date(iso).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

/** "9.8 km" / "78 km" – one decimal place under 10 km. */
export function formatKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`
}

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function formatRelative(iso: string, now = Date.now()): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 7 * 86400) return `${Math.floor(secs / 86400)}d ago`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso))
}
