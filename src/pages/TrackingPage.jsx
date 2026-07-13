import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChatWidget } from '../components/ChatWidget'

// Ícones para a interface
import { 
    ArrowLeftIcon, 
    MagnifyingGlassIcon, 
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline'

export function TrackingPage() {
    // Captura o ID da URL se o cliente acessar via link direto (ex: /rastrear/7b680268...)
    const { id } = useParams()
    
    const [ticketCode, setTicketCode] = useState(id || '')
    const [ticketData, setTicketData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // 🚀 FUNÇÃO DE BUSCA HÍBRIDA (Inteligente para UUID e Número Sequencial)
    // 🚀 FUNÇÃO DE BUSCA HÍBRIDA CORRIGIDA (Sem a coluna 'subject')
    const executeSearch = useCallback(async (targetCode) => {
        const cleanCode = targetCode?.trim()
        if (!cleanCode) return

        setIsLoading(true)
        setError('')
        setTicketData(null)

        try {
            // Identifica se é UUID (Link) ou número sequencial (Digitado)
            const isUuid = cleanCode.length > 10 || cleanCode.includes('-');

            // ⚠️ ATENÇÃO: Removido completamente qualquer menção a 'subject' ou 'title' temporariamente
            // Vamos trazer apenas o básico essencial para a tela funcionar e não dar erro de coluna.
            let query = supabase
                .from('tickets')
                .select('id, ticket_number, status, created_at, updated_at'); 

            if (isUuid) {
                query = query.eq('id', cleanCode);
            } else {
                query = query.eq('ticket_number', cleanCode);
            }

            const { data, error: fetchError } = await query.single();

            if (fetchError) throw fetchError
            if (!data) throw new Error('Chamado não encontrado')

            // Como tiramos a coluna do select para não quebrar, injetamos um texto padrão amigável
            // ou você pode destrocar para 'title' se tiver certeza que a coluna se chama 'title'.
            setTicketData({
                ...data,
                title: data.title || `Chamado de Suporte Técnico`
            })

        } catch (err) {
            console.error("Erro ao buscar chamado:", err)
            setError('Não encontramos nenhum chamado com este código. Verifique e tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Dispara a busca automática assim que o ID vindo da URL (Link do WhatsApp) estiver pronto
    useEffect(() => {
        if (id) {
            setTicketCode(id)
            executeSearch(id)
        }
    }, [id, executeSearch])

    // Chamada manual ao preencher o campo e clicar no botão "Buscar"
    const handleFormSubmit = (e) => {
        if (e) e.preventDefault()
        executeSearch(ticketCode)
    }

    // Função auxiliar para renderizar a cor e o ícone do status
    const renderStatusBadge = (status) => {
        const statusMap = {
            'ABERTO': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, label: 'Aguardando Atendimento' },
            'EM_ATENDIMENTO': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ExclamationCircleIcon, label: 'Em Atendimento' }, 
            'RESOLVIDO': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, label: 'Resolvido' },
            'FECHADO': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircleIcon, label: 'Finalizado' },
        }

        const current = statusMap[status?.toUpperCase()] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: status }
        const Icon = current.icon

        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${current.color}`}>
                <Icon className="w-4 h-4 mr-1.5" />
                {current.label}
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 py-12 relative">
            
            <div className="w-full max-w-xl">
                {/* BOTÃO DE VOLTAR */}
                <Link 
                    to="/login" 
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                    Voltar para o Portal
                </Link>

                {/* CABEÇALHO DA PÁGINA */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rastrear Chamado</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Acompanhe o status da sua solicitação em tempo real
                    </p>
                </div>

                {/* CARD DE BUSCA */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <form onSubmit={handleFormSubmit} className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={ticketCode}
                                onChange={(e) => setTicketCode(e.target.value)}
                                placeholder="Digite o número do ticket (Ex: 366) ou insira o código..."
                                className="w-full border border-gray-300 rounded-xl pl-4 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 bg-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !ticketCode.trim()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center cursor-pointer"
                        >
                            {isLoading ? 'Buscando...' : (
                                <>
                                    <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                                    Buscar
                                </>
                            )}
                        </button>
                    </form>
                    
                    {/* MENSAGEM DE ERRO */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium animate-fade-in">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* CARD DE RESULTADO */}
                {ticketData && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-fade-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Chamado #{ticketData.ticket_number || '---'}
                                </p>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {ticketData.title || 'Sem título especificado'}
                                </h3>
                            </div>
                            {renderStatusBadge(ticketData.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Data de Abertura</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {new Date(ticketData.created_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Última Atualização</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {new Date(ticketData.updated_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ChatWidget />
        </div>
    )
}

export default TrackingPage;