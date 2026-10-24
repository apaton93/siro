import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { FixturePage } from './pages/FixturePage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SignInPage } from './pages/SignInPage'
import { ComingSoonPage, NotFoundPage, StatusPage } from './pages/SimplePages'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="fixtures/:id" element={<FixturePage />} />
        <Route
          path="fixtures/:id/discuss"
          element={<ComingSoonPage title="Discussion">Fixture threads for flights, hotels, pubs and meetups are on the way.</ComingSoonPage>}
        />
        <Route
          path="map"
          element={<ComingSoonPage title="Fan map">See where fans are staying, recommended pubs and live check-ins.</ComingSoonPage>}
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
