import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { StatusBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const NEXT_STATUS = {
    ABERTO: ['EM_ATENDIMENTO'],
    EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'RESOLVIDO'],
    AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'RESOLVIDO'],
    RESOLVIDO: ['FECHADO'],
    FECHADO: [],
}

const LABEL_STATUS = {
    EM_ATENDIMENTO: 'Iniciar Atendimento',
    AGUARDANDO_CLIENTE: 'Aguardando Cliente',
    RESOLVIDO: 'Marcar como Resolvido',
    FECHADO: 'Fechar Chamado',
}

export function TicketDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [npsScore, setNpsScore] = useState('')
    const [npsComment, setNpsComment] = useState('')
    const [erro, setErro] = useState('')

    useEffect(() => {
        ticketService.getById(id)
            .then(setTicket)
            .finally(() => setLoading(false))
    }, [id])

    const handleStatusChange = async (newStatus) => {
        setErro('')
        setActionLoading(true)
        try {
            const updated = await ticketService.updateStatus(id, newStatus)
            setTicket(prev => ({ ...prev, ...updated }))
        } catch (e) {
            setErro(e.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleClose = async () => {
        if (npsScore === '') { setErro('Informe a nota NPS antes de fechar.'); return }
        setErro('')
        setActionLoading(true)
        try {
            const updated = await ticketService.closeWithNps(id, {
                nps_score: parseInt(npsScore),
                nps_comment: npsComment,
            })
            setTicket(prev => ({ ...prev, ...updated }))
        } catch (e) {
            setErro(e.message)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <p className="text-center py-16 text-gray-400">Carregando...</p>
    if (!ticket) return <p className="text-center py-16 text-gray-400">Chamado não encontrado.</p>

    const nextStatuses = NEXT_STATUS[ticket.status] ?? []

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <Link to="/chamados" className="text-sm text-blue-500 hover:underline">
                    ← Voltar para chamados
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

                {/* Card principal */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                Cliente: <span className="text-gray-600">{ticket.customer_name}</span>
                                {ticket.customer_email && ` · ${ticket.customer_email}`}
                                {ticket.customer_phone && ` · ${ticket.customer_phone}`}
                            </p>
                        </div>
                        <StatusBadge status={ticket.status} />
                    </div>

                    {ticket.description && (
                        <p className="text-gray-700 text-sm whitespace-pre-wrap mt-3 p-3 bg-gray-50 rounded-lg">
                            {ticket.description}
                        </p>
                    )}

                    <div className="mt-4 text-xs text-gray-400 flex gap-4">
                        <span>Criado por: {ticket.creator?.full_name ?? '—'}</span>
                        <span>Responsável: {ticket.assignee?.full_name ?? 'Não atribuído'}</span>
                        <span>Prioridade: {ticket.priority}</span>
                    </div>
                </div>

                {/* KPIs de SLA */}
                {(ticket.response_time_minutes != null || ticket.resolution_time_minutes != null || ticket.nps_score != null) && (
                    <div className="grid grid-cols-3 gap-4">
                        {ticket.response_time_minutes != null && (
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-500 font-medium">Tempo de Resposta</p>
                                <p className="text-2xl font-bold text-blue-700">{ticket.response_time_minutes}<span className="text-sm font-normal"> min</span></p>
                            </div>
                        )}
                        {ticket.resolution_time_minutes != null && (
                            <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-xs text-green-500 font-medium">Tempo de Resolução</p>
                                <p className="text-2xl font-bold text-green-700">{ticket.resolution_time_minutes}<span className="text-sm font-normal"> min</span></p>
                            </div>
                        )}
                        {ticket.nps_score != null && (
                            <div className="bg-purple-50 rounded-xl p-4">
                                <p className="text-xs text-purple-500 font-medium">NPS</p>
                                <p className="text-2xl font-bold text-purple-700">{ticket.nps_score}<span className="text-sm font-normal">/10</span></p>
                            </div>
                        )}
                    </div>
                )}

                {/* Erro */}
                {erro && (
                    <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                        {erro}
                    </p>
                )}

                {/* Ações de status */}
                {nextStatuses.filter(s => s !== 'FECHADO').length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-700 mb-3">Ações</h2>
                        <div className="flex gap-2 flex-wrap">
                            {nextStatuses.filter(s => s !== 'FECHADO').map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {LABEL_STATUS[s] ?? s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Encerramento com NPS */}
                {ticket.status === 'RESOLVIDO' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-700 mb-4">Registrar NPS e Fechar Chamado</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Nota NPS do cliente (0 a 10) <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: 11 }, (_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setNpsScore(String(i))}
                                            className={`w-10 h-10 rounded-lg text-sm font-bold border transition-colors ${npsScore === String(i)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Comentário do cliente (opcional)
                                </label>
                                <textarea
                                    value={npsComment}
                                    onChange={e => setNpsComment(e.target.value)}
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="O que o cliente disse..."
                                />
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={actionLoading}
                                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? 'Fechando...' : 'Fechar Chamado'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Histórico */}
                {ticket.history?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-700 mb-3">Histórico</h2>
                        <ul className="space-y-2">
                            {ticket.history.map(h => (
                                <li key={h.id} className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-400 text-xs w-28 shrink-0">
                                        {format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                    </span>
                                    <span className="text-gray-600">{h.agent?.full_name ?? '—'}</span>
                                    <span className="text-gray-300">→</span>
                                    <StatusBadge status={h.new_status} />
                                    {h.note && <span className="text-gray-400 italic text-xs">"{h.note}"</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    )
}