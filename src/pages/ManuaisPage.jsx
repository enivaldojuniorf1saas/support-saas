import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { 
  MagnifyingGlassIcon, BookOpenIcon, ChevronDownIcon, 
  ChevronRightIcon, Bars3Icon, XMarkIcon, DocumentTextIcon,
  WrenchIcon, GiftIcon, BuildingOfficeIcon, SignalIcon, TruckIcon
} from '@heroicons/react/24/outline'
import { Fuel } from 'lucide-react'

// 🗂️ MOCK: Estrutura que virá do Supabase futuramente
const MENU_ESTRUTURA = [
  {
    modulo: 'Abastecimento',
    icone: Fuel,
    categorias: [
      {
        nome: 'Cliente',
        artigos: [
          { id: 'abs-cli-1', titulo: 'Como cadastrar frotas e veículos' },
          { id: 'abs-cli-2', titulo: 'Definindo limites de crédito' }
        ]
      },
      {
        nome: 'Credenciado',
        artigos: [
          { id: 'abs-cred-1', titulo: 'Operando o painel do posto' },
          { id: 'abs-cred-2', titulo: 'Baixa de transações offline' }
        ]
      },
      {
        nome: 'Apps',
        artigos: [
          { id: 'abs-app-1', titulo: 'Guia do App Motorista' },
          { id: 'abs-app-2', titulo: 'Guia do App Gestor' }
        ]
      }
    ]
  },
  {
    modulo: 'Manutenção',
    icone: WrenchIcon,
    categorias: [
      {
        nome: 'Geral',
        artigos: [
          { id: 'man-1', titulo: 'Abertura de O.S. de Manutenção' },
          { id: 'man-2', titulo: 'Tabela de peças e serviços' }
        ]
      }
    ]
  },
  { modulo: 'Benefícios', icone: GiftIcon, categorias: [] },
  { modulo: 'Patrimônio', icone: BuildingOfficeIcon, categorias: [] },
  { modulo: 'Telemetria', icone: SignalIcon, categorias: [] },
]

export function ManuaisPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Estados de controle da interface
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [moduloExpandido, setModuloExpandido] = useState('Abastecimento') // Qual módulo está aberto
  const [artigoAtivo, setArtigoAtivo] = useState('abs-cli-1') // Qual artigo está a ser lido

  // Cores dinâmicas baseadas no tema
  const bgPrincipal = isDark ? 'bg-[#0b0f19]' : 'bg-gray-50'
  const bgSidebar = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const textPrincipal = isDark ? 'text-white' : 'text-gray-900'
  const textSecundario = isDark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${bgPrincipal}`}>
      
      {/* 📱 Botão Mobile para abrir o menu lateral */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b ${bgSidebar}`}>
        <div className="flex items-center gap-2">
          <BookOpenIcon className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`font-bold ${textPrincipal}`}>Central de Ajuda</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-800 transition">
          {mobileMenuOpen ? <XMarkIcon className={`w-6 h-6 ${textPrincipal}`} /> : <Bars3Icon className={`w-6 h-6 ${textPrincipal}`} />}
        </button>
      </div>

      {/* 🧭 SIDEBAR DE NAVEGAÇÃO */}
      <aside className={`
        ${mobileMenuOpen ? 'block' : 'hidden'} md:block 
        w-full md:w-80 border-r flex-shrink-0 z-10 transition-colors duration-300
        ${bgSidebar} overflow-y-auto h-[calc(100vh-73px)] md:h-screen sticky top-0
      `}>
        <div className="p-6">
          <div className="hidden md:flex items-center gap-2 mb-8">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <BookOpenIcon className="w-6 h-6" />
            </div>
            <h1 className={`text-xl font-bold ${textPrincipal}`}>Portal de Manuais</h1>
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative mb-8">
            <MagnifyingGlassIcon className={`absolute left-3 top-2.5 w-5 h-5 ${textSecundario}`} />
            <input 
              type="text" 
              placeholder="Buscar nos manuais..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border outline-none transition-colors
                ${isDark ? 'bg-gray-950 border-gray-700 text-gray-200 focus:border-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'}
              `}
            />
          </div>

          {/* Renderização Dinâmica dos Módulos */}
          <nav className="space-y-2">
            {MENU_ESTRUTURA.map((modulo) => (
              <div key={modulo.modulo} className="flex flex-col">
                <button 
                  onClick={() => setModuloExpandido(moduloExpandido === modulo.modulo ? '' : modulo.modulo)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg text-sm font-semibold transition
                    ${moduloExpandido === modulo.modulo ? (isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900') : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${textSecundario}`}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <modulo.icone className="w-5 h-5" />
                    {modulo.modulo}
                  </div>
                  {moduloExpandido === modulo.modulo ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>

                {/* Subcategorias e Artigos */}
                {moduloExpandido === modulo.modulo && modulo.categorias.length > 0 && (
                  <div className="ml-4 mt-2 space-y-4 border-l-2 border-gray-200 dark:border-gray-800 pl-4 py-2">
                    {modulo.categorias.map(cat => (
                      <div key={cat.nome}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{cat.nome}</h4>
                        <ul className="space-y-1">
                          {cat.artigos.map(artigo => (
                            <li key={artigo.id}>
                              <button 
                                onClick={() => { setArtigoAtivo(artigo.id); setMobileMenuOpen(false); }}
                                className={`flex items-center gap-2 w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors
                                  ${artigoAtivo === artigo.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : `${textSecundario} hover:bg-gray-100 dark:hover:bg-gray-800`}
                                `}
                              >
                                <DocumentTextIcon className="w-4 h-4 opacity-70" />
                                <span className="truncate">{artigo.titulo}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {moduloExpandido === modulo.modulo && modulo.categorias.length === 0 && (
                  <p className={`text-xs ml-9 mt-2 italic ${textSecundario}`}>Em breve...</p>
                )}
              </div>
            ))}
          </nav>

        </div>
      </aside>

      {/* 📖 ÁREA PRINCIPAL (LEITURA DO MANUAL) */}
      <main className="flex-1 overflow-y-auto h-screen p-6 md:p-12 lg:px-24">
        <div className="max-w-4xl mx-auto">
          
          {/* Breadcrumbs (Caminho do pão) */}
          <div className={`flex items-center gap-2 text-sm mb-8 ${textSecundario}`}>
            <span>Abastecimento</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span>Cliente</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Como cadastrar frotas e veículos</span>
          </div>

          {/* Cabeçalho do Artigo */}
          <header className="mb-10">
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${textPrincipal}`}>Como cadastrar frotas e veículos</h1>
            <p className={`text-base ${textSecundario}`}>
              Aprenda a estruturar a frota do cliente no sistema, adicionando placas, motoristas vinculados e restrições de regras de negócio.
            </p>
            <div className={`flex items-center gap-4 mt-6 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-1"><BookOpenIcon className="w-4 h-4" /> Leitura de 4 min</div>
              <span>•</span>
              <div>Atualizado há 2 dias por Suporte N2</div>
            </div>
          </header>

          <hr className={`my-8 border ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />

          {/* SIMULAÇÃO DE RENDERIZAÇÃO MARKDOWN */}
          <article className={`space-y-6 text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            
            <p>O cadastro de frotas é o coração do módulo de abastecimento. É através dele que o sistema valida no momento de passar o cartão no posto de gasolina se aquele veículo está autorizado a abastecer o tipo de combustível selecionado.</p>

            <h2 className={`text-2xl font-bold mt-10 mb-4 ${textPrincipal}`}>1. Acessando o painel</h2>
            <p>Para iniciar o cadastro, você precisará ter perfil de <strong>Gestor de Frota</strong> ou superior.</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>No menu principal lateral esquerdo, clique em <span className={`px-2 py-0.5 rounded text-sm ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>Abastecimento</span>.</li>
              <li>Navegue até a aba <span className={`px-2 py-0.5 rounded text-sm ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>Gerenciamento de Frotas</span>.</li>
              <li>Clique no botão azul <strong>+ Novo Veículo</strong> no canto superior direito da tela.</li>
            </ul>

            <div className={`p-4 rounded-xl border mt-8 ${isDark ? 'bg-blue-900/20 border-blue-900/50' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex gap-3">
                <DocumentTextIcon className={`w-6 h-6 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h4 className={`font-bold text-sm ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Dica de Ouro</h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-blue-900/80'}`}>Se você tiver mais de 50 veículos para cadastrar, não faça isso manualmente. Utilize o nosso importador de planilhas CSV na tela de configurações em lote.</p>
                </div>
              </div>
            </div>

            <h2 className={`text-2xl font-bold mt-10 mb-4 ${textPrincipal}`}>2. Configurando Regras de Restrição</h2>
            <p>Após preencher os dados básicos (Placa, Renavam e Marca/Modelo), o sistema exigirá que você determine as regras de segurança:</p>
            
            <div className="overflow-x-auto mt-4 rounded-lg border dark:border-gray-800">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <tr>
                    <th className="px-6 py-3">Tipo de Regra</th>
                    <th className="px-6 py-3">Comportamento do Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  <tr className={isDark ? 'bg-gray-900' : 'bg-white'}>
                    <td className="px-6 py-4 font-medium text-principal">Combustível Específico</td>
                    <td className="px-6 py-4">Bloqueia a bomba se o produto for diferente do parametrizado (ex: Bloqueia Gasolina para caminhões a Diesel).</td>
                  </tr>
                  <tr className={isDark ? 'bg-gray-900' : 'bg-white'}>
                    <td className="px-6 py-4 font-medium text-principal">Cota Mensal (L)</td>
                    <td className="px-6 py-4">Trava a autorização ao atingir o limite estipulado em litros no mês vigente.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-8">Após revisar todas as informações, clique em <strong>Salvar Veículo</strong>. Ele estará apto para transacionar na rede credenciada em no máximo 5 minutos.</p>
          </article>
          
          {/* Rodapé de Feedback do Artigo */}
          <div className={`mt-16 py-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Este manual foi útil para resolver sua dúvida?</p>
            <div className="flex gap-2">
              <button className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>👍 Sim, ajudou muito</button>
              <button className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>👎 Ainda tenho dúvidas</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}