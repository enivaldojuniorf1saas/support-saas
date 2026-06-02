import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  ClockIcon, 
  TagIcon, 
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon // <-- Ícone do botão de edição adicionado aqui
} from '@heroicons/react/24/outline'

const NEXT_STATUS = {
    ABERTO: ['EM_ATENDIMENTO'],
    EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'RESOLVIDO'],
    AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'RESOLVIDO'],
    RESOLVIDO: ['FECHADO'], 
    FECHADO: [],
}

const LABEL_STATUS = {
    EM_ATENDIMENTO: 'Iniciar Atendimento',
    AGUARDANDO_CLIENTE: 'Aguardar Cliente',
    RESOLVIDO: 'Marcar como Resolvido',
    FECHADO: 'Encerrar Chamado', 
}

const ESTADOS_DEV = ['A iniciar', 'A priorizar', 'Em Desenvolvimento', 'Em revisão', 'Em validação', 'Priorizado', 'Pronto']

function getEstadoClass(estado) {
  switch (estado) {
    case 'A iniciar': return 'bg-gray-50 text-gray-600 border-gray-200'
    case 'A priorizar': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Em Desenvolvimento': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Em revisão': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Em validação': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'Priorizado': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'Pronto': return 'bg-green-50 text-green-700 border-green-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

function StatusBadgeInline({ status }) {
  const getStyle = (s) => {
    switch(s) {
      case 'FECHADO': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'RESOLVIDO': return 'bg-green-100 text-green-800 border-green-200'
      case 'EM_ATENDIMENTO': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'AGUARDANDO_CLIENTE': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-blue-50 text-blue-700 border-blue-100' 
    }
  }
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStyle(status)}`}>
      {status || 'ABERTO'}
    </span>
  )
}

// 1. EXPORTAÇÃO NOMEADA (Atende o import { TicketDetailPage })
export function TicketDetailPage() {
    const { id } = useParams()
    const { user, isGestor } = useAuthContext()
    const navigate = useNavigate()
    
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

            const channel = supabase.channel(`ticket_detail_${id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${id}` }, () => {
                    fetchDetail()
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_history', filter: `ticket_id=eq.${id}` }, () => {
                    fetchDetail()
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
    }, [id])

    const handleStatusChange = async (newStatus) => {
        setErro('')
        setActionLoading(true)
        try {
            const updated = await ticketService.updateStatus(id, newStatus)
            const historyRow = await ticketService.addComment(
                id, 
                user.id, 
                `Alterou o Status Operacional para: ${newStatus}`, 
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
            const historyRow = await ticketService.addComment(id, user.id, `Moveu no Kanban de Engenharia para: ${novoEstado}`, null)
            
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
        setActionLoading(true)
        try {
            const updated = await ticketService.assignTicket(id, selectedAgent)
            const historyRow = await ticketService.addComment(id, user.id, `Atribuiu o chamado para o agente: ${updated.assignee?.full_name}`, null)
            
            setTicket(prev => prev ? { 
                ...prev, 
                assignee: updated.assignee, 
                history: [...(prev.history || []), historyRow] 
            } : null)
            setSelectedAgent('')
        } catch (e) {
            setErro(e.message || 'Erro ao atribuir agente.')
        } finally {
            setActionLoading(false)
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

    if (loading) return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Carregando detalhes do chamado...</p>
      </div>
    )
    
    if (!ticket) return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Chamado não localizado na base de dados.</p>
      </div>
    )

    const nextStatuses = NEXT_STATUS[ticket.status] ?? []

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
                <Link to="/chamados" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Voltar ao Painel
                </Link>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
                
                {erro && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow-xs">
                        <strong>Falha Operacional:</strong> {erro}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                        
                        {/* LADO ESQUERDO: Identificação do Chamado */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded text-sm">#{ticket.ticket_number || 'S/N'}</span>
                                <StatusBadgeInline status={ticket.status} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                {ticket.title}
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4" /> Cliente / Licença: <span className="text-gray-900">{ticket.customer_name}</span>
                            </p>
                        </div>

                        {/* 🔥 LADO DIREITO: Botão de Edição Adicionado Aqui */}
                        <div className="flex items-center shrink-0 mt-2 sm:mt-0">
                            <Link 
                                to={`/chamados/editar/${ticket.id}`} 
                                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                                Editar Dados
                            </Link>
                        </div>

                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-5 mb-6 border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Relato do Problema / Solicitação</h3>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {ticket.description || <span className="italic text-gray-400">Nenhuma descrição foi fornecida na abertura.</span>}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
                        <div>
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mb-1"><UserCircleIcon className="w-4 h-4"/> Criado por</span>
                            <span className="text-sm text-gray-900 font-medium">{ticket.creator?.full_name ?? 'Sistema'}</span>
                        </div>
                        <div>
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mb-1"><ClockIcon className="w-4 h-4"/> Abertura</span>
                            <span className="text-sm text-gray-900 font-medium">
                            {ticket.created_at ? format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm") : '---'}
                            </span>
                        </div>
                        <div>
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mb-1"><TagIcon className="w-4 h-4"/> Categoria</span>
                            <span className="text-sm text-gray-900 font-medium">{ticket.categoria || 'Não definida'}</span>
                        </div>
                        <div>
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mb-1">Prioridade</span>
                            <span className={`text-sm font-bold ${ticket.priority === 'ALTA' || ticket.priority === 'CRITICA' ? 'text-red-600' : 'text-gray-900'}`}>
                                {ticket.priority}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Controles Operacionais</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Esteira de Desenvolvimento</label>
                            <div className="flex flex-col gap-3">
                                <span className={`inline-flex self-start px-3 py-1 rounded-lg text-xs font-bold border ${getEstadoClass(ticket.estado)}`}>
                                    Atual: {ticket.estado || 'A iniciar'}
                                </span>
                                <select 
                                    value={ticket.estado || ''}
                                    onChange={handleEstadoChange}
                                    disabled={actionLoading}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow disabled:opacity-50 font-medium cursor-pointer"
                                >
                                    <option value="" disabled>Mover chamado para...</option>
                                    {ESTADOS_DEV.map(est => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {isGestor && (
                            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Atribuição de Agente</label>
                                <div className="flex flex-col gap-3">
                                    <span className="text-sm font-medium text-gray-700">
                                      Responsável atual: <strong className="text-gray-900">{ticket.assignee?.full_name || 'Ninguém'}</strong>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={selectedAgent} 
                                            onChange={(e) => setSelectedAgent(e.target.value)}
                                            disabled={actionLoading}
                                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                                        >
                                            <option value="">Selecionar da equipe...</option>
                                            {agents.map(agent => (
                                                <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                            ))}
                                        </select>
                                        <button 
                                          onClick={handleAssign} 
                                          disabled={!selectedAgent || actionLoading} 
                                          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 cursor-pointer"
                                        >
                                            Atribuir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {nextStatuses.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Avançar Fluxo de Atendimento</label>
                            <div className="flex flex-wrap gap-3">
                                {nextStatuses.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        disabled={actionLoading}
                                        className={`px-5 py-2.5 rounded-lg text-sm font-bold shadow-xs transition-all cursor-pointer ${
                                          s === 'FECHADO' 
                                            ? 'bg-gray-800 text-white hover:bg-gray-900' 
                                            : s === 'RESOLVIDO'
                                              ? 'bg-green-600 text-white hover:bg-green-700'
                                              : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } disabled:opacity-50`}
                                    >
                                        {LABEL_STATUS[s] ?? s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" /> Histórico e Comunicação
                    </h2>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                        {(!ticket.history || ticket.history.length === 0) ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <p className="text-sm text-gray-400 font-medium">Nenhuma nota interna registrada ainda.</p>
                            </div>
                        ) : (
                            ticket.history.map(h => (
                                <div key={h.id} className={`flex flex-col gap-1 p-4 rounded-xl border ${h.agent?.full_name ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-gray-900">{h.agent?.full_name ?? 'Ação do Sistema'}</span>
                                        <span className="text-[11px] font-semibold text-gray-400">{format(new Date(h.created_at), "dd/MM/yyyy • HH:mm")}</span>
                                    </div>
                                    <div className="mt-1">
                                        {h.new_status && <span className="inline-block mb-2"><StatusBadgeInline status={h.new_status} /></span>}
                                        {h.note && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{h.note}</p>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicione uma nota interna para a equipe..."
                            rows="2"
                            className="flex-1 bg-transparent border-0 px-3 py-2 text-sm focus:ring-0 resize-none"
                        />
                        <button 
                          type="submit" 
                          disabled={actionLoading || !newComment.trim()} 
                          className="self-end bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-40 cursor-pointer"
                        >
                            Gravar Nota
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

// 2. EXPORTAÇÃO PADRÃO (Atende caso o App.jsx importe sem chaves)
export default TicketDetailPage;