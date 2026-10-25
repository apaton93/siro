import { initials } from '../lib/auth'

/** A fan's photo, or their initials when they haven't added one. Decorative – label the parent. */
export function Avatar(props: { name: string; url: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const size = props.size ?? 'md'
  const cls = `avatar ${size === 'md' ? '' : `avatar-${size}`}`
  return props.url ? (
    <img className={`${cls} avatar-img`} src={props.url} alt="" loading="lazy" decoding="async" />
  ) : (
    <span className={cls} aria-hidden="true">
      {initials(props.name)}
    </span>
  )
}
