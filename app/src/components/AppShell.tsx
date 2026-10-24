import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { initials, useAuth } from '../lib/auth'
import { Icon } from './Icon'

/** Page column + fixed bottom navigation. Pages render their own top bar. */
export function AppShell() {
  return (
    <div className="shell">
      <Outlet />
      <nav className="bottom-nav" aria-label="Main">
        <ul>
          <li>
            <NavLink to="/" end>
              <Icon name="home" />
              Fixtures
            </NavLink>
          </li>
          <li>
            <NavLink to="/map">
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
        <Link to="/profile" className="avatar" aria-label={`Your profile (${auth.me.displayName})`}>
          {initials(auth.me.displayName)}
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
