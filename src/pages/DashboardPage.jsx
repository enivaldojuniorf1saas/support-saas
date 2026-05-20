import { useAuthContext } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { profile, signOut } = useAuthContext()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400">
            {profile?.full_name} — {profile?.role}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/chamados"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Voltar para Chamados
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Embed Looker Studio */}
      <div className="w-full h-[calc(100vh-65px)]">
        <iframe
          src="https://datastudio.google.com/embed/reporting/b7449a38-a4bd-4288-97fe-5e079a311e58/page/wjkyF"
          className="w-full h-full border-0"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  )
}