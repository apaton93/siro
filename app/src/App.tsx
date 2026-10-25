import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { AdminPage } from './pages/AdminPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { DiscussPage } from './pages/DiscussPage'
import { FixtureMapPage } from './pages/FixtureMapPage'
import { FixturePage } from './pages/FixturePage'
import { HomePage } from './pages/HomePage'
import { MapRedirect } from './pages/MapRedirect'
import { ProfilePage } from './pages/ProfilePage'
import { SignInPage } from './pages/SignInPage'
import { ThreadPage } from './pages/ThreadPage'
import { NotFoundPage, StatusPage } from './pages/SimplePages'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="competitions/:code" element={<CompetitionPage />} />
        <Route path="fixtures/:id" element={<FixturePage />} />
        <Route path="fixtures/:id/map" element={<FixtureMapPage />} />
        <Route path="fixtures/:id/discuss" element={<DiscussPage />} />
        <Route path="fixtures/:id/discuss/:threadId" element={<ThreadPage />} />
        <Route path="map" element={<MapRedirect />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
