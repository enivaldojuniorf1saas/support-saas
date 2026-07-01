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

// 🚀 IMPORTAÇÕES SEPARADAS: Backoffice e Área Pública
import { ManuaisPage }        from './pages/ManuaisPage'
import { PublicManuaisPage }  from './pages/PublicManuaisPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            
            {/* 🟢 ROTAS PÚBLICAS (Sem verificação de Login para o Cliente Final) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/avaliar/:id" element={<NpsPage />} />
            <Route path="/rastrear/:id" element={<TrackingPage />} />
            <Route path="/rastrear" element={<TrackingPage />} />
            
            {/* 🚀 NOVA ROTA PÚBLICA: Leitura dos manuais e IA */}
            <Route path="/ajuda" element={<PublicManuaisPage />} />
            
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
            
            {/* 🚀 ROTA PROTEGIDA: Apenas o gestor pode cadastrar e editar manuais */}
            <Route path="/manuais" element={<ProtectedLayout requireGestor><ManuaisPage /></ProtectedLayout>} />
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}