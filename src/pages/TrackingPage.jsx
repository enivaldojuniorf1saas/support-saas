import { useState, useEffect } from 'react'
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
    // Captura o ID da URL se o cliente acessar via link direto (ex: /rastrear/123)
    const { id } = useParams()
    
    const [ticketCode, setTicketCode] = useState(id || '')
    const [ticketData, setTicketData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Se a pessoa entrou pelo link direto com o ID, já faz a busca automaticamente
    useEffect(() => {
        if (id) {
            handleSearch()
        }
    }, [id])

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        if (!ticketCode.trim()) return

        setIsLoading(true)
        setError('')
        setTicketData(null)

        try {
            // 🚀 Faz a busca no Supabase
            // ATENÇÃO: Verifique se a sua tabela se chama 'tickets' ou 'chamados'
            // e se a coluna de identificação se chama 'id'
            const { data, error: fetchError } = await supabase
                .from('tickets') // <-- Ajuste para o nome real da sua tabela
                .select('id, subject, status, created_at, updated_at')
                .eq('id', ticketCode.trim())
                .single()

            if (fetchError) throw fetchError
            if (!data) throw new Error('Chamado não encontrado')

            setTicketData(data)
        } catch (err) {
            console.error("Erro ao buscar chamado:", err)
            setError('Não encontramos nenhum chamado com este código. Verifique e tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    // Função auxiliar para renderizar a cor e o ícone do status
    const renderStatusBadge = (status) => {
        const statusMap = {
            'ABERTO': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, label: 'Aguardando Atendimento' },
            'EM_ANDAMENTO': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ExclamationCircleIcon, label: 'Em Análise' },
            'RESOLVIDO': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, label: 'Resolvido' },
            'FECHADO': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircleIcon, label: 'Finalizado' },
        }

        // Faz um fallback caso o status do banco não esteja mapeado acima
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
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={ticketCode}
                                onChange={(e) => setTicketCode(e.target.value)}
                                placeholder="Digite o código (Ex: 1045)"
                                className="w-full border border-gray-300 rounded-xl pl-4 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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

                {/* CARD DE RESULTADO (Aparece só se achar o chamado) */}
                {ticketData && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-fade-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Chamado #{ticketData.id}
                                </p>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {ticketData.subject || 'Sem assunto especificado'}
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

            {/* O ASSISTENTE PARA QUEM PRECISAR DE AJUDA NA TELA DE RASTREIO */}
            <ChatWidget />
        </div>
    )
}

export default TrackingPage;