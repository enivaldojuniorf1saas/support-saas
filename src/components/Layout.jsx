import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar' 
import { useAuthContext } from '../context/AuthContext' 
import { useTheme } from '../context/ThemeContext' // <-- Importado o contexto do tema

export function ProtectedLayout({ children, requireGestor }) {
  const { user, isGestor, loading } = useAuthContext()
  const { theme } = useTheme() // <-- Consumindo o tema atual global

  const isDark = theme === 'dark'

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#0b0f19] text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
        Verificando sessão...
      </div>
    )
  }
  
  if (!user) return <Navigate to="/login" replace />
  if (requireGestor && !isGestor) return <Navigate to="/chamados" replace />

  return (
    // O contêiner pai agora muda de fundo dinamicamente em todo o sistema
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0b0f19]' : 'bg-gray-50'}`}>
      
      <Sidebar />
      
      {/* O 'main' herda a cor do texto padrão do tema do sistema */}
      <main className={`flex-1 w-full min-w-0 pb-16 md:pb-0 transition-colors duration-300 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        {children ? children : <Outlet />}
      </main>

    </div>
  )
}