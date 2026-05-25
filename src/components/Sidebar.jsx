import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import {
  TicketIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/chamados',      label: 'Chamados',      icon: TicketIcon,       role: 'all' },
  { to: '/chamados/novo', label: 'Novo Chamado',  icon: PlusCircleIcon,   role: 'all' },
  { to: '/dashboard',     label: 'Dashboard',     icon: ChartBarIcon,     role: 'gestor' },
  { to: '/importar',      label: 'Importar CSV',  icon: ArrowUpTrayIcon,  role: 'gestor' },
]

export function Sidebar() {
  const { profile, signOut, isGestor } = useAuthContext()
  const location = useLocation()

  const visibleItems = navItems.filter(
    item => item.role === 'all' || (item.role === 'gestor' && isGestor)
  )

  return (
    <>
      {/* DESKTOP — sidebar fixa */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 flex-col z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900 tracking-tight">
            F1 Suporte
          </span>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{profile?.full_name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to ||
              (to !== '/chamados' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-400">
            <UserCircleIcon className="w-4 h-4" />
            <span className="capitalize">{profile?.role}</span>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* MOBILE — bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 flex items-center justify-around px-2 py-2">
        {visibleItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to ||
            (to !== '/chamados' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="text-xs">Sair</span>
        </button>
      </nav>
    </>
  )
}