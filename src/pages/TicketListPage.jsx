import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthContext } from '../context/AuthContext'
import { MagnifyingGlassIcon, ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../lib/supabase'

// ============================================================
// É AQUI QUE OS TEXTOS SÃO ALTERADOS
// ============================================================
const TEXTO_TICKET = (numero) =>
  `Olá! Seu chamado foi registrado com sucesso em nosso sistema.\n\nNúmero do chamado: *${numero}*\n\nGuarde este número para acompanhar o andamento do seu atendimento. Qualquer dúvida, estamos à disposição!`

const TEXTO_NPS = (numero, link) =>
  `Olá! O chamado *${numero}* foi concluído.\n\nGostaríamos de saber sua opinião sobre o atendimento. Por favor, avalie clicando no link abaixo:\n\n${link}\n\nSua avaliação é muito importante para nós! 🙏`
// ============================================================

const FILTROS = ['', 'ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO']
const LABEL_FILTRO = {
  '': 'Todos',
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado'
}

function getEstadoClass(estado) {
  switch (estado) {
    case 'A iniciar':         return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'A priorizar':       return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Em Desenvolvimento':return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'Em revisão':        return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Em validação':      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'Priorizado':        return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Pronto':            return 'bg-green-50 text-green-700 border-green-200'
    default:                  return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

// Modal de texto pronto para copiar
function ModalCopiar({ texto, onClose }) {
  const [copiado, setCopiado] = useState(false)

  const handleCopiar = () => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Copie o texto e envie para o cliente.
        </h2>
       

        {/* Área do texto editável pelo usuário */}
        <textarea
          readOnly
          rows={8}
          value={texto}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 resize-none focus:outline-none"
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopiar}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copiado
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copiado ? (
              <>
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <ClipboardIcon className="w-4 h-4" />
                Copiar texto
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export function TicketListPage() {
  const { isGestor } = useAuthContext()
  const [tickets, setTickets] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Estado do modal
  const [modalTexto, setModalTexto] = useState(null) // null = fechado

  useEffect(() => {
    setLoading(true)

    const fetchTickets = () => {
      ticketService.list({ status: filter || undefined, page, pageSize })
        .then((res) => {
          setTickets(res.data)
          setTotalCount(res.count)
        })
        .finally(() => setLoading(false))
    }

    fetchTickets()

    const channel = supabase.channel('tickets_list_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [page, filter])

  // Abre modal com texto do número do ticket
  const handleAbrirTextoTicket = (ticket) => {
    const texto = TEXTO_TICKET(ticket.ticket_number ?? ticket.id)
    setModalTexto(texto)
  }

  // Abre modal com texto do link NPS
  const handleAbrirTextoNps = (ticket) => {
    const linkNps = `${window.location.origin}/avaliar/${ticket.id}`
    const texto = TEXTO_NPS(ticket.ticket_number ?? ticket.id, linkNps)
    setModalTexto(texto)
  }

  const filtered = tickets.filter(t => {
    const matchSearch = search
      ? t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.customer_name?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchSearch
  })

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-8">

      {/* Modal */}
      {modalTexto && (
        <ModalCopiar
          texto={modalTexto}
          onClose={() => setModalTexto(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalCount} resultado(s) no total</p>
        </div>
        <Link
          to="/chamados/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Novo Chamado
        </Link>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar nesta página por F1-0001, título ou cliente..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTROS.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {LABEL_FILTRO[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-16">Carregando chamados...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Nenhum chamado encontrado.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estado (Dev)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Abertura</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Finalização</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">T. Atend.</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">NPS</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 w-32">Link NPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(ticket => {
                  const isEligibleForNps = ['RESOLVIDO', 'FECHADO'].includes(ticket.status)

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">

                      {/* ID — clicável, abre modal com texto do ticket */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleAbrirTextoTicket(ticket)}
                          className="text-xs font-mono text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          title="Clique para copiar mensagem do chamado"
                        >
                          {ticket.ticket_number ?? '—'}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          to={`/chamados/${ticket.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {ticket.title}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-gray-600">{ticket.customer_name}</td>

                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoClass(ticket.estado)}`}>
                          {ticket.estado || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {format(new Date(ticket.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(ticket.status === 'FECHADO' || ticket.status === 'RESOLVIDO') && ticket.updated_at
                          ? format(new Date(ticket.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })
                          : '—'}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {ticket.resolution_time_minutes != null
                          ? `${ticket.resolution_time_minutes} min`
                          : '—'}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.nps_score != null ? (
                          <span className={`font-bold text-sm ${
                            ticket.nps_score >= 9 ? 'text-green-600' :
                            ticket.nps_score >= 7 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {ticket.nps_score}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Link NPS — clicável, abre modal com texto NPS */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={!isEligibleForNps}
                          onClick={() => handleAbrirTextoNps(ticket)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 shadow-sm ${
                            !isEligibleForNps
                              ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-blue-600 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                          title={!isEligibleForNps
                            ? 'Disponível apenas para chamados finalizados ou resolvidos'
                            : 'Copiar mensagem NPS para WhatsApp'}
                        >
                          <ClipboardIcon className="w-4 h-4" />
                          <span>Copiar</span>
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
              >
                Próximo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}