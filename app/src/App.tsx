import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { FixturePage } from './pages/FixturePage'
import { HomePage } from './pages/HomePage'
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
        <Route
          path="profile"
          element={<ComingSoonPage title="Your profile">Sign in, pick your teams and plan your away days.</ComingSoonPage>}
        />
        <Route path="status" element={<StatusPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
