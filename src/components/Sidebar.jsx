import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  TicketIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowUpTrayIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  BookOpenIcon // 🚀 Ícone de Manuais importado aqui junto com os outros!
} from '@heroicons/react/24/outline'

// 🚀 ITEM NOVO ADICIONADO AQUI:
const navItems = [
  { to: '/chamados',      label: 'Chamados',      icon: TicketIcon,       role: 'all' },
  { to: '/chamados/novo', label: 'Novo Chamado',  icon: PlusCircleIcon,   role: 'all' },
  { to: '/equipa',        label: 'Equipe',        icon: UsersIcon,        role: 'gestor' },
  { to: '/dashboard',     label: 'Dashboard',     icon: ChartBarIcon,     role: 'gestor' },
  { to: '/importar',      label: 'Importar CSV',  icon: ArrowUpTrayIcon,  role: 'gestor' },
  { to: '/manuais',       label: 'Manuais',       icon: BookOpenIcon,     role: 'gestor' }, // 🚀 Apenas Gestores verão!
]

export function Sidebar() {
  const { profile, signOut, isGestor } = useAuthContext()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  
  const [isCollapsed, setIsCollapsed] = useState(false)

  const visibleItems = navItems.filter(
    item => item.role === 'all' || (item.role === 'gestor' && isGestor)
  )

  // Variável que define se o modo escuro está ativo no Javascript
  const isDark = theme === 'dark'

  return (
    <>
      {/* DESKTOP */}
      <aside 
        className={`hidden md:flex sticky top-0 h-screen flex-col z-20 shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-60'
        } ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-600'}`}
      >
        {/* Cabeçalho e Botão de Collapse */}
        <div className={`flex items-center h-16 py-4 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className={`text-base font-bold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                F1 Suporte
              </span>
              <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{profile?.full_name}</p>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/chamados' && location.pathname.startsWith(to))
            
            // Definição de cores dos links baseados no tema ativo
            let linkClass = ''
            if (active) {
              linkClass = isDark ? 'bg-blue-950 text-blue-400 font-medium' : 'bg-blue-50 text-blue-700 font-medium'
            } else {
              linkClass = isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }

            return (
              <Link
                key={to}
                to={to}
                title={isCollapsed ? label : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${linkClass} ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>
        
        {/* Rodapé (Perfil, Alternador de Tema e Sair) */}
        <div className="px-3 py-4 space-y-1 overflow-hidden">
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
              <UserCircleIcon className="w-5 h-5 shrink-0" />
              <span className="capitalize">{profile?.role}</span>
            </div>
          )}

          {/* 🌓 BOTÃO DE ALTERNAR TEMA — DESKTOP */}
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (isDark ? 'Modo Claro' : 'Modo Escuro') : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
              isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            {isDark ? (
              <>
                <SunIcon className="w-5 h-5 shrink-0 text-amber-500" />
                {!isCollapsed && <span>Modo Claro</span>}
              </>
            ) : (
              <>
                <MoonIcon className="w-5 h-5 shrink-0 text-gray-500" />
                {!isCollapsed && <span>Modo Escuro</span>}
              </>
            )}
          </button>

          <button
            onClick={signOut}
            title={isCollapsed ? 'Sair' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
              isDark ? 'text-gray-400 hover:bg-red-950/40 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 ${
        isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'
      }`}>
        {visibleItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/chamados' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active 
                  ? (isDark ? 'text-blue-400' : 'text-blue-600') 
                  : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600')
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </Link>
          )
        })}

        {/* 🌓 BOTÃO DE ALTERNAR TEMA — MOBILE */}
        <button
          onClick={toggleTheme}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {isDark ? <SunIcon className="w-5 h-5 text-amber-500" /> : <MoonIcon className="w-5 h-5" />}
          <span className="text-[10px]">Tema</span>
        </button>

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