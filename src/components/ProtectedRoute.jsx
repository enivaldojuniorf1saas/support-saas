import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export function ProtectedRoute({ children, requireGestor = false }) {
    const { user, profile, loading } = useAuthContext()

    if (loading) return (
        <div className="flex h-screen items-center justify-center text-gray-400">
            Carregando...
        </div>
    )
    if (!user) return <Navigate to="/login" replace />
    if (requireGestor && profile?.role !== 'gestor') return <Navigate to="/chamados" replace />

    return children
}