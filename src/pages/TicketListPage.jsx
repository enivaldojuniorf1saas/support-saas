import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthContext } from '../context/AuthContext'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const FILTROS = ['', 'ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO']
const LABEL_FILTRO = {
  '':                 'Todos',
  ABERTO:             'Aberto',
  EM_ATENDIMENTO:     'Em Atendimento',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  RESOLVIDO:          'Resolvido',
  FECHADO:            'Fechado',
}

export function TicketListPage() {
  const { isGestor } = useAuthContext()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')  // ← NOVO: estado de busca

  useEffect(() => {
    ticketService.list()
      .then(setTickets)
      .finally(() => setLoading(false))
  }, [])

  // ← NOVO: filtro combinado (status + busca por número/título/cliente)
  const filtered = tickets.filter(t => {
    const matchStatus = filter ? t.status === filter : true
    const matchSearch = search
      ? t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.customer_name?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchStatus && matchSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} resultado(s)</p>
        </div>
        <Link
          to="/chamados/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Novo Chamado
        </Link>
      </div>

      {/* ← NOVO: Campo de busca */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por F1-0001, título ou cliente..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTROS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
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

      {/* Tabela */}
      {loading ? (
        <p className="text-center text-gray-400 py-16">Carregando chamados...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Nenhum chamado encontrado.</p>
      ) : (
        // ← overflow-x-auto para scroll horizontal + min-w para não comprimir
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* ← NOVO: coluna ID */}
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-24">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Prioridade</th>
                {isGestor && (
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Agente</th>
                )}
                {/* ← NOVO: colunas SLA */}
                <th className="text-left px-4 py-3 font-medium text-gray-500">T. Resposta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">T. Resolução</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">NPS</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Abertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">

                  {/* ← NOVO: célula do ticket_number */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {ticket.ticket_number ?? '—'}
                    </span>
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
                  <td className="px-4 py-3 text-gray-600">{ticket.priority}</td>
                  {isGestor && (
                    <td className="px-4 py-3 text-gray-500">
                      {ticket.assignee?.full_name ?? '—'}
                    </td>
                  )}

                  {/* ← NOVO: células SLA */}
                  <td className="px-4 py-3 text-gray-600">
                    {ticket.response_time_minutes != null
                      ? `${ticket.response_time_minutes}min`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ticket.resolution_time_minutes != null
                      ? `${ticket.resolution_time_minutes}min`
                      : '—'}
                  </td>

                  {/* ← NOVO: célula NPS com cor por categoria */}
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

                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {format(new Date(ticket.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}