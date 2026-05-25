import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }       from './context/AuthContext'
import { ProtectedRoute }     from './components/ProtectedRoute'
import { Layout }             from './components/Layout'
import { LoginPage }          from './pages/LoginPage'
import { TicketListPage }     from './pages/TicketListPage'
import { TicketDetailPage }   from './pages/TicketDetailPage'
import { NewTicketPage }      from './pages/NewTicketPage'
import { DashboardPage }      from './pages/DashboardPage'
import { ImportPage }         from './pages/ImportPage'
import { UsersPage }          from './pages/UsersPage'

function ProtectedLayout({ children, requireGestor = false }) {
  return (
    <ProtectedRoute requireGestor={requireGestor}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/chamados" replace />} />
          <Route path="/chamados" element={
            <ProtectedLayout><TicketListPage /></ProtectedLayout>
          } />
          <Route path="/chamados/novo" element={
            <ProtectedLayout><NewTicketPage /></ProtectedLayout>
          } />
          <Route path="/chamados/:id" element={
            <ProtectedLayout><TicketDetailPage /></ProtectedLayout>
          } />
          <Route path="/dashboard" element={
            <ProtectedLayout requireGestor><DashboardPage /></ProtectedLayout>
          } />
          <Route path="/importar" element={
            <ProtectedLayout requireGestor><ImportPage /></ProtectedLayout>
          } />
          <Route path="/equipa" element={
          <ProtectedLayout requireGestor><UsersPage /></ProtectedLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}