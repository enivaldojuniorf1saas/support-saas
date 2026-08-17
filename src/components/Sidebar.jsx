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
  UsersIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  Bars3Icon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline'

// 🛡️ CLEAN CODE & ARQUITETURA SÊNIOR: 
// Estrutura de dados categorizada. Seguro contra quebras de layout ao adicionar novos itens.
const NAV_CATEGORIES = [
  {
    title: 'Registros',
    items: [
      { to: '/chamados',      label: 'Chamados',      icon: TicketIcon,       role: 'all' },
      { to: '/chamados/novo', label: 'Novo Chamado',  icon: PlusCircleIcon,   role: 'all' },
    ]
  },
  {
    title: 'Gerenciador',
    items: [
      { to: '/equipa',        label: 'Equipe',        icon: UsersIcon,        role: 'gestor' },
      { to: '/dashboard',     label: 'Dashboard',     icon: ChartBarIcon,     role: 'gestor' },
    ]
  }
]

export function Sidebar() {
  const { profile, signOut, isGestor } = useAuthContext()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDark = theme === 'dark'

  // 🔒 Filtra as categorias dinamicamente de acordo com a permissão (Role-Based Access Control)
  // Garante que, se um usuário comum não tiver itens em "Gerenciador", o título do setor também desapareça.
  const visibleCategories = NAV_CATEGORIES.map(category => ({
    ...category,
    items: category.items.filter(item => item.role === 'all' || (item.role === 'gestor' && isGestor))
  })).filter(category => category.items.length > 0)

  // Extrai uma lista plana apenas para o menu mobile
  const mobileVisibleItems = visibleCategories.flatMap(category => category.items)

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================= */}
      <aside 
        className={`hidden md:flex sticky top-0 h-screen flex-col z-20 shrink-0 transition-all duration-300 border-r ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        } ${isDark ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-[#F8F9FA] border-gray-200 text-gray-700'}`}
      >
        
        {/* 1. HEADER & BRANDING */}
        <div className={`flex items-center h-[72px] border-b transition-colors ${
          isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-100'
        } ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden cursor-default">
              {/* Logo agora combinando com a paleta Azul de confiança */}
              <div className="w-8 h-8 shrink-0 bg-blue-600 border border-blue-700 rounded flex items-center justify-center shadow-sm">
                <span className="text-white font-extrabold text-lg leading-none">F1</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[14px] font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  F1 SaaS
                </span>
                <span className="text-[11px] font-medium text-gray-500 truncate">
                  Hello Gestor
                </span>
              </div>
            </div>
          )}

          {/* Botão Hambúrguer / Setinha */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-md transition-colors shrink-0 ${
              isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-900'
            }`}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <Bars3Icon className="w-6 h-6" /> : <ArrowLeftIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. CORPO DO MENU (Scrollable) */}
        <div className="flex-1 px-3 py-5 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col">

          {/* Categorias Mapeadas */}
          {visibleCategories.map((category, catIndex) => (
            <div key={category.title} className={`${catIndex > 0 ? 'mt-6' : ''}`}>
              
              {/* Título do Setor (Visível apenas se expandido) */}
              {!isCollapsed && (
                <h4 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {category.title}
                </h4>
              )}
              {isCollapsed && catIndex > 0 && (
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-700 mx-auto mb-2 opacity-50"></div>
              )}

              <nav className="flex flex-col gap-1">
                {category.items.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || (to !== '/chamados' && location.pathname.startsWith(to))
                  
                  // 🎨 UX: Cores Azuis super confortáveis (Contraste Acessível WCAG)
                  let linkClass = ''
                  if (active) {
                    linkClass = isDark 
                      ? 'bg-blue-500/15 text-blue-400 font-semibold' 
                      : 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50'
                  } else {
                    linkClass = isDark 
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium' 
                      : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 font-medium'
                  }

                  return (
                    <Link
                      key={to}
                      to={to}
                      title={isCollapsed ? label : ''}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${linkClass} ${
                        isCollapsed ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span>{label}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}

        </div>
        
        {/* 3. RODAPÉ FIXO (Avatar, Tema e Sair) */}
        <div className={`border-t flex flex-col py-4 px-3 gap-2 transition-colors ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-[#F8F9FA]'
        }`}>
          
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (isDark ? 'Modo Claro' : 'Modo Escuro') : ''}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            {isDark ? (
              <SunIcon className="w-5 h-5 shrink-0 text-amber-500" />
            ) : (
              <MoonIcon className="w-5 h-5 shrink-0" />
            )}
            {!isCollapsed && <span className="font-medium">Tema Visual</span>}
          </button>

          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-2'} mt-2`}>
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
              <UserCircleIcon className={`w-8 h-8 shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-900'}`} />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className={`text-[13px] font-semibold truncate max-w-[100px] leading-tight ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {profile?.full_name || 'Usuário'}
                  </span>
                  <span className={`text-[11px] font-medium capitalize truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {profile?.role || 'Acesso Restrito'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={signOut}
              title="Sair"
              className={`p-1.5 rounded-md transition-colors shrink-0 ${
                isDark ? 'text-gray-500 hover:bg-red-950/40 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION */}
      {/* ========================================================= */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 ${
        isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'
      }`}>
        {mobileVisibleItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/chamados' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active 
                  ? (isDark ? 'text-blue-400' : 'text-blue-600') // Cores azuis aplicadas no Mobile
                  : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600')
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </Link>
          )
        })}

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