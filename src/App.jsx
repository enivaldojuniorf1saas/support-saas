import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }       from './context/AuthContext'
import { ProtectedLayout }    from './components/Layout'
import { LoginPage }          from './pages/LoginPage'
import { TicketListPage }     from './pages/TicketListPage'
import { TicketDetailPage }   from './pages/TicketDetailPage'
import { NewTicketPage }      from './pages/NewTicketPage'
import { DashboardPage }      from './pages/DashboardPage'
import { ImportPage }         from './pages/ImportPage'
import { UsersPage }          from './pages/UsersPage'
import { NpsPage }            from './pages/NpsPage'
import { TrackingPage } from './pages/TrackingPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/chamados" replace />} />
          
          {/* 2. ROTA PÚBLICA DE AVALIAÇÃO (Fora do ProtectedLayout) */}
          <Route path="/avaliar/:id" element={<NpsPage />} />
          
          {/* ROTAS PROTEGIDAS */}
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
          <Route path="/avaliar/:id" element={<NpsPage />} />
<         Route path="/rastrear" element={<TrackingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}