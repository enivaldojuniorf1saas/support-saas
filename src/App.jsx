import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }       from './context/AuthContext'
import { ThemeProvider }      from './context/ThemeContext'
import { ProtectedLayout }    from './components/Layout'
import { LoginPage }          from './pages/LoginPage'
import { TicketListPage }     from './pages/TicketListPage'
import { TicketDetailPage }   from './pages/TicketDetailPage'
import { NewTicketPage }      from './pages/NewTicketPage'
import { DashboardPage }      from './pages/DashboardPage'
import { ImportPage }         from './pages/ImportPage'
import { UsersPage }          from './pages/UsersPage'
import { NpsPage }            from './pages/NpsPage'
import { TrackingPage }       from './pages/TrackingPage'
import { ResetPassword }      from './pages/ResetPassword'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            
            {/* 🟢 ROTAS PÚBLICAS (Sem verificação de Login para o Cliente Final) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ResetPassword" element={<ResetPassword />} /> {/* 🚀 Rota inserida aqui! */}
            <Route path="/avaliar/:id" element={<NpsPage />} />
            
            {/* Nota: Se o seu link de rastrear for genérico, talvez precise de uma rota sem o /:id também */}
            <Route path="/rastrear/:id" element={<TrackingPage />} />
            <Route path="/rastrear" element={<TrackingPage />} />
            
            {/* REDIRECIONAMENTO PADRÃO */}
            <Route path="/" element={<Navigate to="/chamados" replace />} />
            
            {/* 🔴 ROTAS PROTEGIDAS (Acesso apenas para equipe Logada) */}
            <Route path="/chamados" element={<ProtectedLayout><TicketListPage /></ProtectedLayout>} />
            <Route path="/chamados/novo" element={<ProtectedLayout><NewTicketPage /></ProtectedLayout>} />
            <Route path="/chamados/:id" element={<ProtectedLayout><TicketDetailPage /></ProtectedLayout>} />
            <Route path="/chamados/editar/:id" element={<ProtectedLayout><NewTicketPage /></ProtectedLayout>} />

            {/* 🔴 ROTAS PROTEGIDAS E RESTRITAS (Acesso apenas para Gestores) */}
            <Route path="/dashboard" element={<ProtectedLayout requireGestor><DashboardPage /></ProtectedLayout>} />
            <Route path="/importar" element={<ProtectedLayout requireGestor><ImportPage /></ProtectedLayout>} />
            <Route path="/equipa" element={<ProtectedLayout requireGestor><UsersPage /></ProtectedLayout>} />
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}