import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthContext } from '../context/AuthContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const FILTROS = ['', 'ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO']
const LABEL_FILTRO = {
    '': 'Todos',
    ABERTO: 'Aberto',
    EM_ATENDIMENTO: 'Em Atendimento',
    AGUARDANDO_CLIENTE: 'Aguardando Cliente',
    RESOLVIDO: 'Resolvido',
    FECHADO: 'Fechado',
}

export function TicketListPage() {
    const { isGestor, profile, signOut } = useAuthContext()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        ticketService.list()
            .then(setTickets)
            .finally(() => setLoading(false))
    }, [])

    const filtered = tickets.filter(t => filter ? t.status === filter : true)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Portal de Suporte</h1>
                    <p className="text-xs text-gray-400">
                        {profile?.full_name} — {profile?.role}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isGestor && (
                        <Link
                            to="/dashboard"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Dashboard
                        </Link>
                    )}
                    <button
                        onClick={signOut}
                        className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Ações */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-700">
                        Chamados{' '}
                        <span className="text-gray-400 font-normal text-sm">({filtered.length})</span>
                    </h2>
                    <Link
                        to="/chamados/novo"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        + Novo Chamado
                    </Link>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {FILTROS.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${filter === s
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Prioridade</th>
                                    {isGestor && (
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Agente</th>
                                    )}
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Abertura</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
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
                                        <td className="px-4 py-3 text-gray-400">
                                            {format(new Date(ticket.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}