import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { AdminPage } from './pages/AdminPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { DiscussPage } from './pages/DiscussPage'
import { FixturePage } from './pages/FixturePage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SignInPage } from './pages/SignInPage'
import { ThreadPage } from './pages/ThreadPage'
import { ComingSoonPage, NotFoundPage, StatusPage } from './pages/SimplePages'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="competitions/:code" element={<CompetitionPage />} />
        <Route path="fixtures/:id" element={<FixturePage />} />
        <Route path="fixtures/:id/discuss" element={<DiscussPage />} />
        <Route path="fixtures/:id/discuss/:threadId" element={<ThreadPage />} />
        <Route
          path="map"
          element={<ComingSoonPage title="Fan map">See where fans are staying, recommended pubs and live check-ins.</ComingSoonPage>}
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
