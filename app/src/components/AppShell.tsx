import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../lib/auth'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

/** Page column + fixed bottom navigation. Pages render their own top bar. */
export function AppShell() {
  const { pathname } = useLocation()
  const onMap = pathname === '/map' || /^\/fixtures\/[^/]+\/map$/.test(pathname)
  return (
    <div className="shell">
      <Outlet />
      <nav className="bottom-nav" aria-label="Main">
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive && !onMap ? 'active' : '')}>
              <Icon name="home" />
              Fixtures
            </NavLink>
          </li>
          <li>
            <NavLink to="/map" className={onMap ? 'active' : undefined} aria-current={onMap ? 'page' : undefined}>
              <Icon name="pin" />
              Map
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile">
              <Icon name="user" />
              Profile
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}

/** Standard top bar: wordmark + sign in (or the fan's initials once signed in). */
export function TopBar() {
  const { auth } = useAuth()
  const location = useLocation()
  const returnTo = encodeURIComponent(location.pathname + location.search)

  return (
    <header className="topbar">
      <Link to="/" className="wordmark" aria-label="Siro home">
        SIRO
      </Link>
      {auth.status === 'signed-in' ? (
        <Link to="/profile" className="avatar-link" aria-label={`Your profile (${auth.me.displayName})`}>
          <Avatar name={auth.me.displayName} url={auth.me.avatarUrl} />
        </Link>
      ) : auth.status === 'loading' ? (
        <span className="avatar avatar-placeholder" aria-hidden="true" />
      ) : (
        <Link to={`/signin?returnTo=${returnTo}`} className="btn btn-sm">
          Sign in
        </Link>
      )}
    </header>
  )
}
