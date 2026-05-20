import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { TicketListPage } from './pages/TicketListPage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { NewTicketPage } from './pages/NewTicketPage'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/chamados" replace />} />
          <Route path="/chamados" element={
            <ProtectedRoute><TicketListPage /></ProtectedRoute>
          } />
          <Route path="/chamados/novo" element={
            <ProtectedRoute><NewTicketPage /></ProtectedRoute>
          } />
          <Route path="/chamados/:id" element={
            <ProtectedRoute><TicketDetailPage /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute requireGestor><DashboardPage /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}