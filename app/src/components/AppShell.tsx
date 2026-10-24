import { NavLink, Outlet } from 'react-router'
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

/** Standard top bar: wordmark + sign in. */
export function TopBar() {
  return (
    <header className="topbar">
      <NavLink to="/" className="wordmark" aria-label="Siro home">
        SIRO
      </NavLink>
      <NavLink to="/profile" className="btn btn-sm">
        Sign in
      </NavLink>
    </header>
  )
}
