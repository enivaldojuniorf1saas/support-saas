import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthContext } from '../context/AuthContext'

export function ProtectedLayout({ children, requireGestor }) {
  const { user, isGestor, loading } = useAuthContext()

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Verificando sessão...</div>
  if (!user) return <Navigate to="/login" replace />
  if (requireGestor && !isGestor) return <Navigate to="/chamados" replace />

  return (
    // O 'flex' aqui é o segredo para a barra e o conteúdo ficarem lado a lado sem sobreposição
    <div className="flex min-h-screen bg-gray-50">
      
      <Sidebar />
      
      {/* O 'min-w-0' garante que as tabelas gigantes possam criar scroll interno sem estourar a tela */}
      <main className="flex-1 w-full min-w-0 pb-16 md:pb-0">
        {children ? children : <Outlet />}
      </main>

    </div>
  )
}