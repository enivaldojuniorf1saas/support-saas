import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { 
  MagnifyingGlassIcon, 
  ArrowUpTrayIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  FunnelIcon,
  TagIcon // 🚀 Adicionado para diferenciar o ícone do novo filtro
} from '@heroicons/react/24/outline'

export function TicketListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Resgata os filtros diretamente da URL
  const currentPage = Number(searchParams.get('page')) || 1
  const searchQuery = searchParams.get('search') || ''
  const statusQuery = searchParams.get('status') || ''
  const typeQuery = searchParams.get('type') || '' // 🚀 NOVO FILTRO: Tipo de chamado
  const startDateQuery = searchParams.get('startDate') || ''
  const endDateQuery = searchParams.get('endDate') || ''

  // 🚀 ESTADOS LOCAIS PARA O CALENDÁRIO (Para não disparar a busca antes da hora)
  const [localStartDate, setLocalStartDate] = useState(startDateQuery || '')
  const [localEndDate, setLocalEndDate] = useState(endDateQuery || '')

  const [tickets, setTickets] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [copiedTicketId, setCopiedTicketId] = useState(null)
  const [copiedNpsId, setCopiedNpsId] = useState(null)
  
  const pageSize = 10

  // 🚀 Sincroniza os inputs caso o botão "Limpar Filtros" limpe a URL
  useEffect(() => {
    setLocalStartDate(startDateQuery || '')
    setLocalEndDate(endDateQuery || '')
  }, [startDateQuery, endDateQuery])

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true)
        const { data, count } = await ticketService.list({
          page: currentPage,
          pageSize,
          search: searchQuery,
          status: statusQuery,
          type: typeQuery, // 🚀 NOVO FILTRO: Passado para o service
          startDate: startDateQuery, 
          endDate: endDateQuery      
        })
        setTickets(data || [])
        setTotalCount(count || 0)
      } catch (err) {
        console.error('Erro de sincronização com o painel:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [currentPage, searchQuery, statusQuery, typeQuery, startDateQuery, endDateQuery]) // 🚀 Atualizado array de dependências

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  // Função para os filtros em tempo real (Pesquisa, Status e Tipo)
  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') 
    setSearchParams(params)
  }

  // 🚀 NOVA FUNÇÃO: Aplica a busca por Período apenas no clique do botão
  const handleApplyDateFilter = () => {
    // Validação: Só permite buscar se ambos estiverem preenchidos (ou ambos vazios para limpar)
    if ((localStartDate && !localEndDate) || (!localStartDate && localEndDate)) {
      alert('Por favor, preencha tanto a data inicial quanto a data final para realizar a busca por período.')
      return
    }

    const params = new URLSearchParams(searchParams)
    if (localStartDate && localEndDate) {
      params.set('startDate', localStartDate)
      params.set('endDate', localEndDate)
    } else {
      params.delete('startDate')
      params.delete('endDate')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const copyTicketOpenToWhatsApp = (ticket) => {
    const linkRastreio = `https://support-saas-five.vercel.app/rastrear/${ticket.id}`;
    const text = `Olá! 🚀\n\nO seu chamado *#${ticket.ticket_number || 'S/N'}* foi registrado com sucesso em nosso sistema.\n\n📌 *Resumo:*\n*Cliente:* ${ticket.customer_name}\n*Título:* ${ticket.title}\n\nNossa equipe já está analisando a sua solicitação.\n\n👉 *ACOMPANHE O STATUS DO SEU CHAMADO AQUI:*\n${linkRastreio}\n\nQualquer dúvida, é só nos chamar por aqui!`;
    navigator.clipboard.writeText(text);
    setCopiedTicketId(ticket.id);
    setTimeout(() => setCopiedTicketId(null), 2000);
  }

  const copyNpsRequestToWhatsApp = (ticket) => {
    const linkNps = `https://support-saas-five.vercel.app/avaliar/${ticket.id}`;
    const text = `Olá! ✅\n\nPassando para avisar que o seu chamado *#${ticket.ticket_number || 'S/N'}* ("${ticket.title}") foi concluído!\n\nPara continuarmos melhorando nosso atendimento, gostaríamos muito de saber como foi a sua experiência. É bem rapidinho!\n\n👉 *CLIQUE NO LINK ABAIXO PARA AVALIAR O CHAMADO:*\n${linkNps}\n\nAgradecemos a parceria!`;
    navigator.clipboard.writeText(text);
    setCopiedNpsId(ticket.id);
    setTimeout(() => setCopiedNpsId(null), 2000);
  }

  const getNpsBadgeColor = (score) => {
    if (!score && score !== 0) return 'bg-gray-50 text-gray-400 border-gray-100'
    if (score >= 9) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (score >= 7) return 'bg-amber-50 text-amber-700 border-amber-100'
    return 'bg-red-50 text-red-700 border-red-100'
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="p-4 md:p-8 w-full max-w-full mx-auto bg-gray-50/50 min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Painel de Monitoramento</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão operacional detalhada e controle de indicadores mensais.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/importar"
            className="inline-flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <ArrowUpTrayIcon className="w-4 h-4 text-gray-500" />
            Carga em Massa (CSV)
          </Link>
          <Link
            to="/chamados/novo"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            Novo Chamado
          </Link>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs mb-6 flex flex-col xl:flex-row gap-4 items-center">
        
        {/* Filtro 1: Barra de Pesquisa */}
        <div className="relative w-full xl:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Digite o nº do ticket ou título..."
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 transition"
          />
        </div>

        {/* Filtro 2: Status */}
        <div className="relative w-full xl:w-48 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <FunnelIcon className="w-4 h-4" />
          </div>
          <select
            value={statusQuery}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer transition appearance-none"
          >
            <option value="">Todos os Status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
            <option value="FECHADO">Fechado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        {/* 🚀 Filtro 2.5: Tipo de Chamado (Sincronizado com a NewTicketPage) */}
        <div className="relative w-full xl:w-48 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <TagIcon className="w-4 h-4" />
          </div>
          <select
            value={typeQuery}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer transition appearance-none"
          >
            <option value="">Todos os Tipos</option>
            <option value="Bug">Bug</option>
            <option value="Aprimoramento">Aprimoramento</option>
            <option value="Erro Operacional">Erro Operacional</option>
            <option value="Nova Funcionalidade">Nova Funcionalidade</option>
            <option value="Demanda Interna">Demanda Interna</option>
            <option value="Dúvida">Dúvida</option>
          </select>
        </div>

        {/* 🚀 Filtro 3 e 4: Bloco de Data Inicial e Final (Com Botão) */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto shrink-0 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <div className="relative w-full sm:w-36">
            <input
              type="date"
              title="Data Inicial"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer transition"
            />
          </div>
          <span className="text-gray-400 text-xs font-bold uppercase hidden sm:block">Até</span>
          <div className="relative w-full sm:w-36">
            <input
              type="date"
              title="Data Final"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 cursor-pointer transition"
            />
          </div>
          <button
            onClick={handleApplyDateFilter}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shrink-0"
          >
            Buscar
          </button>
        </div>

        {/* Botão de Limpar Filtros */}
        {(searchQuery || statusQuery || typeQuery || startDateQuery || endDateQuery) && (
          <button
            onClick={() => {
              setSearchParams({ page: '1' })
            }}
            className="w-full xl:w-auto text-xs font-semibold text-gray-500 hover:text-red-500 transition px-2 py-2 shrink-0"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* 🚀 TOTALIZADOR ABAIXO DOS FILTROS (ALINHADO À DIREITA COM DESTAQUE) */}
      {!loading && (
        <div className="mb-4 flex items-center justify-end px-1 animate-fade-in">
          <div className="inline-flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm">

            {totalCount} {totalCount === 1 ? 'registro encontrado' : 'registros encontrados'}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-400 font-medium">
          Sincronizando grade com banco de dados...
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-500 shadow-xs">
          Nenhum registro localizado para os filtros informados.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 w-32">Ticket</th>
                  <th className="p-4 min-w-[140px]">Cliente / Licença</th>
                  <th className="p-4 min-w-[200px]">Título do Chamado</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Estado (Dev)</th>
                  <th className="p-4 min-w-[120px]">Tipo de Chamado</th>
                  <th className="p-4 min-w-[100px]">Abertura</th>
                  <th className="p-4 min-w-[100px]">Atualização</th>
                  <th className="p-4 text-center w-20">Nota NPS</th>
                  <th className="p-4 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100 font-medium">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-md">
                          #{ticket.ticket_number || '---'}
                        </span>
                        <button
                          onClick={() => copyTicketOpenToWhatsApp(ticket)}
                          title="Copiar texto de Abertura para WhatsApp"
                          className={`p-1.5 rounded-lg border transition-all ${
                            copiedTicketId === ticket.id 
                              ? 'bg-green-50 border-green-200 text-green-600' 
                              : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'
                          }`}
                        >
                          {copiedTicketId === ticket.id ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <DocumentDuplicateIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    
                    <td className="p-4 align-middle font-bold text-gray-900 break-words">
                      {ticket.customer_name}
                    </td>
                    
                    <td className="p-4 align-middle text-gray-600 break-words leading-relaxed">
                      <Link 
                        to={`/chamados/${ticket.id}`} 
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-semibold"
                        title="Abrir detalhes do ticket"
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${
                        ticket.status === 'FECHADO' || ticket.status === 'CANCELADO'
                          ? 'bg-gray-100 text-gray-700 border-gray-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {ticket.status || 'ABERTO'}
                      </span>
                    </td>
                    
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                        ticket.workflow === 'Pronto' || ticket.estado === 'Pronto'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {ticket.estado || ticket.workflow || 'A iniciar'}
                      </span>
                    </td>
                    
                    <td className="p-4 align-middle text-xs font-semibold text-gray-500">
                      {ticket.tipo_chamado || 'Suporte técnico'}
                    </td>
                    
                    <td className="p-4 align-middle text-xs font-normal text-gray-500">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : '---'}
                      <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    
                    <td className="p-4 align-middle text-xs font-normal text-gray-500">
                      {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString('pt-BR') : '---'}
                      <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                        {ticket.updated_at ? new Date(ticket.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    
                    <td className="p-4 align-middle text-center">
                      <span className={`inline-block px-3 py-1 rounded-md border text-xs font-bold ${getNpsBadgeColor(ticket.nps_score)}`}>
                        {ticket.nps_score || ticket.nps_score === 0 ? ticket.nps_score : '---'}
                      </span>
                    </td>
                    
                    <td className="p-4 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => copyNpsRequestToWhatsApp(ticket)}
                        title="Copiar Pedido de Avaliação (NPS) para WhatsApp"
                        className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all shadow-xs ${
                          copiedNpsId === ticket.id 
                            ? 'bg-green-50 border-green-200 text-green-600' 
                            : 'bg-white hover:bg-sky-50 text-gray-500 hover:text-sky-600 border-gray-200 hover:border-sky-200'
                        }`}
                      >
                        {copiedNpsId === ticket.id ? (
                          <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                          <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-500 font-semibold tracking-wide">
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition cursor-pointer"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}