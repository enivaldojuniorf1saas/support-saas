import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const NEXT_STATUS = {
    ABERTO: ['EM_ATENDIMENTO'],
    EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'RESOLVIDO'],
    AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'RESOLVIDO'],
    RESOLVIDO: ['FECHADO'], // O próximo passo de resolvido é fechado diretamente
    FECHADO: [],
}

const LABEL_STATUS = {
    EM_ATENDIMENTO: 'Iniciar Atendimento',
    AGUARDANDO_CLIENTE: 'Aguardando Cliente',
    RESOLVIDO: 'Marcar como Resolvido',
    FECHADO: 'Fechar Chamado', // Rótulo do botão de encerramento automático
}

const ESTADOS_DEV = ['A iniciar', 'A priorizar', 'Em Desenvolvimento', 'Em revisão', 'Em validação', 'Priorizado', 'Pronto']

function getEstadoClass(estado) {
  switch (estado) {
    case 'A iniciar': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'A priorizar': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Em Desenvolvimento': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'Em revisão': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Em validação': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'Priorizado': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Pronto': return 'bg-green-50 text-green-700 border-green-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

export function TicketDetailPage() {
    const { id } = useParams()
    const { user, isGestor } = useAuthContext()
    
    const [ticket, setTicket] = useState(null)
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [erro, setErro] = useState('')
    
    const [newComment, setNewComment] = useState('')
    const [selectedAgent, setSelectedAgent] = useState('')

    useEffect(() => {
    if(id) {
        const fetchDetail = () => {
            ticketService.getById(id)
                .then(setTicket)
                .catch(err => setErro(err.message))
                .finally(() => setLoading(false))
        }

        fetchDetail()

        supabase.from('profiles').select('id, full_name')
            .then(({ data }) => { if (data) setAgents(data) })

        // 🚀 MAGIA DO REALTIME: Escuta o ticket atual E o histórico
        const channel = supabase.channel(`ticket_detail_${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, () => {
                fetchDetail() // Atualiza os dados do chamado se alguém mudar algo
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_history', filter: `ticket_id=eq.${id}` }, () => {
                fetchDetail() // Atualiza as mensagens se alguém enviar um comentário noutro ecrã
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }
  }, [id])

    // Fluxo unificado para alteração de Status (incluindo o fechamento direto)
    const handleStatusChange = async (newStatus) => {
        setErro('')
        setActionLoading(true)
        try {
            const updated = await ticketService.updateStatus(id, newStatus)
            const historyRow = await ticketService.addComment(
                id, 
                user.id, 
                `Status geral alterado para: ${LABEL_STATUS[newStatus] || newStatus}`, 
                newStatus
            )
            
            setTicket(prev => prev ? { 
                ...prev, 
                ...updated, 
                history: [...(prev.history || []), historyRow] 
            } : null)
        } catch (e) {
            setErro(e.message || 'Erro ao alterar status.')
        } finally {
            setActionLoading(false)
        }
    }

    const handleEstadoChange = async (e) => {
        const novoEstado = e.target.value
        if (!novoEstado) return
        
        setErro('')
        setActionLoading(true)
        try {
            const updated = await ticketService.updateEstado(id, novoEstado)
            const historyRow = await ticketService.addComment(id, user.id, `Alterou o estado (Engenharia) para: ${novoEstado}`, null)
            
            setTicket(prev => prev ? { 
                ...prev, 
                estado: updated.estado, 
                history: [...(prev.history || []), historyRow] 
            } : null)
        } catch (err) {
            setErro(err.message || 'Erro ao atualizar o Estado de Desenvolvimento.')
        } finally {
            setActionLoading(false)
        }
    }

    const handleAssign = async () => {
        if(!selectedAgent) return
        setErro('')
        try {
            const updated = await ticketService.assignTicket(id, selectedAgent)
            const historyRow = await ticketService.addComment(id, user.id, `Atribuiu o chamado para o responsável: ${updated.assignee?.full_name}`, null)
            
            setTicket(prev => prev ? { 
                ...prev, 
                assignee: updated.assignee, 
                history: [...(prev.history || []), historyRow] 
            } : null)
            setSelectedAgent('')
        } catch (e) {
            setErro(e.message || 'Erro ao atribuir agente.')
        }
    }

    const handleAddComment = async (e) => {
        e.preventDefault()
        if(!newComment.trim() || !user) return
        setActionLoading(true)
        try {
            const historyRow = await ticketService.addComment(id, user.id, newComment, null)
            setTicket(prev => prev ? { ...prev, history: [...(prev.history || []), historyRow] } : null)
            setNewComment('')
        } catch (e) {
            setErro('Erro ao enviar comentário')
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
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                <span className="text-gray-400 mr-2 text-base">#{ticket.ticket_number || id}</span>
                                {ticket.title}
                            </h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                Cliente: <span className="text-gray-600">{ticket.customer_name}</span>
                                <span className="mx-2">•</span>
                                Tipo: <span className="text-gray-600">{ticket.tipo_ticket || 'N/A'}</span>
                            </p>
                        </div>
                        <StatusBadge status={ticket.status} />
                    </div>

                    {ticket.description && (
                        <p className="text-gray-700 text-sm whitespace-pre-wrap mt-3 p-3 bg-gray-50 rounded-lg">
                            {ticket.description}
                        </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Criado por</span>
                            <span className="text-gray-700">{ticket.creator?.full_name ?? '—'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Prioridade</span>
                            <span className="text-gray-700">{ticket.priority}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Aplicação</span>
                            <span className="text-gray-700">{ticket.aplicacao || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Categoria</span>
                            <span className="text-gray-700">{ticket.categoria || '—'}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Estado (Engenharia)</label>
                            <div className="flex items-center gap-3">
                                <select 
                                    value={ticket.estado || ''}
                                    onChange={handleEstadoChange}
                                    disabled={actionLoading}
                                    className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 flex-1"
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {ESTADOS_DEV.map(est => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </select>
                                <span className={`inline-flex shrink-0 items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoClass(ticket.estado)}`}>
                                    {ticket.estado || 'Nenhum'}
                                </span>
                            </div>
                        </div>

                        {isGestor && (
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Atribuir Responsável</label>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={selectedAgent} 
                                        onChange={(e) => setSelectedAgent(e.target.value)}
                                        className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 flex-1"
                                    >
                                        <option value="">{ticket.assignee?.full_name || 'Alterar responsável...'}</option>
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleAssign} disabled={!selectedAgent || actionLoading} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition">
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {erro && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <strong>Falha na Operação:</strong> {erro}
                    </div>
                )}

                {/* BOTÕES DE MUDANÇA DE STATUS GERAL (Agora inclui o botão Fechar Chamado quando o status for RESOLVIDO) */}
                {nextStatuses.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-700 mb-3">Ações de Resolução</h2>
                        <div className="flex gap-2 flex-wrap">
                            {nextStatuses.map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {LABEL_STATUS[s] ?? s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-700 mb-4">Interações e Comentários</h2>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
                        {(!ticket.history || ticket.history.length === 0) ? (
                            <p className="text-sm text-gray-400 italic text-center py-4">Nenhuma interação registrada ainda.</p>
                        ) : (
                            ticket.history.map(h => (
                                <div key={h.id} className={`flex gap-3 p-3 rounded-lg border ${h.agent?.full_name ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-sm text-gray-900">{h.agent?.full_name ?? 'Sistema'}</span>
                                            <span className="text-xs text-gray-400">{format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {h.new_status && <StatusBadge status={h.new_status} />}
                                            {h.note && <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.note}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2">
                        <input 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicione uma nota interna ou mensagem..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="submit" disabled={actionLoading || !newComment.trim()} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                            Enviar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}