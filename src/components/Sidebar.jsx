import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import {
  TicketIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowUpTrayIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/chamados',      label: 'Chamados',      icon: TicketIcon,       role: 'all' },
  { to: '/chamados/novo', label: 'Novo Chamado',  icon: PlusCircleIcon,   role: 'all' },
  { to: '/equipa',        label: 'Equipe',        icon: UsersIcon,        role: 'gestor' },
  { to: '/dashboard',     label: 'Dashboard',     icon: ChartBarIcon,     role: 'gestor' },
  { to: '/importar',      label: 'Importar CSV',  icon: ArrowUpTrayIcon,  role: 'gestor' },
]

export function Sidebar() {
  const { profile, signOut, isGestor } = useAuthContext()
  const location = useLocation()
  
  // Estado que controla se a barra está aberta ou fechada
  const [isCollapsed, setIsCollapsed] = useState(false)

  const visibleItems = navItems.filter(
    item => item.role === 'all' || (item.role === 'gestor' && isGestor)
  )

  return (
    <>
      {/* DESKTOP — Agora é 'sticky' em vez de 'fixed', para empurrar o conteúdo! */}
      <aside 
        className={`hidden md:flex sticky top-0 h-screen bg-white border-r border-gray-200 flex-col z-20 shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-60'}`}
      >
        {/* Cabeçalho e Botão de Collapse */}
        <div className={`flex items-center h-16 border-b border-gray-100 py-4 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="text-base font-bold text-gray-900 tracking-tight whitespace-nowrap">
                F1 Suporte
              </span>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{profile?.full_name}</p>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/chamados' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                title={isCollapsed ? label : ''} // Mostra o nome ao passar o mouse se estiver fechado
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Rodapé (Perfil e Sair) */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1 overflow-hidden">
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
              <UserCircleIcon className="w-5 h-5 shrink-0" />
              <span className="capitalize">{profile?.role}</span>
            </div>
          )}
          <button
            onClick={signOut}
            title={isCollapsed ? 'Sair' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE — Continua igual, na parte inferior da tela */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-around px-2 py-2">
        {visibleItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/chamados' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="text-[10px]">Sair</span>
        </button>
      </nav>
    </>
  )
}