import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Bug, Sparkles, Wrench, Headphones } from 'lucide-react'

const schema = z.object({
    title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
    description: z.string().optional(),
    customer_name: z.string().min(2, 'Nome do cliente é obrigatório'),
    priority: z.string().min(1, 'Obrigatório'),
    solicitante: z.string().min(1, 'Obrigatório'),
    workflow: z.string().min(1, 'Obrigatório'),
    estado: z.string().min(1, 'Obrigatório'),
    tipo_chamado: z.string().min(1, 'Obrigatório'),
    aplicacao: z.string().min(1, 'Obrigatório'),
    tipo_perfil: z.string().min(1, 'Obrigatório'),
    categoria: z.string().min(1, 'Obrigatório'),
    tipo_ticket: z.string().min(1, 'Obrigatório')
})

export function NewTicketPage() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const { id } = useParams()
    const isEditing = !!id

    const { user } = useAuthContext()
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState('')
    const [isLoadingData, setIsLoadingData] = useState(isEditing)

    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            priority: 'Selecionar',
            tipo_ticket: 'Selecionar',
            estado: 'Selecionar',
            workflow: 'Selecionar',
            tipo_chamado: 'Selecionar',
            aplicacao: 'Selecionar',
            tipo_perfil: 'Selecionar',
            categoria: 'Selecionar',
            solicitante: 'Selecionar',
            customer_name: 'Selecionar'
        },
    })

    const tipoAtual = watch('tipo_ticket')

    useEffect(() => {
        if (isEditing) {
            ticketService.getById(id)
                .then(ticket => {
                    // Blindagem adicionada aqui (ticket?.) para evitar quebra de tela caso a busca falhe
                    const dbCustomer = ticket?.customer_name ? ticket.customer_name.toUpperCase() : ''
                    const dbSolicitante = ticket?.solicitante || ''

                    reset({
                        title: ticket?.title || '',
                        description: ticket?.description || '',
                        customer_name: dbCustomer,
                        priority: ticket?.priority || 'MEDIA',
                        solicitante: dbSolicitante,
                        workflow: ticket?.workflow || 'Engenharia',
                        estado: ticket?.estado || 'A iniciar',
                        tipo_chamado: ticket?.tipo_chamado || 'Bug',
                        aplicacao: ticket?.aplicacao || 'Web',
                        tipo_perfil: ticket?.tipo_perfil || 'Cliente',
                        categoria: ticket?.categoria || 'Manutenção',
                        tipo_ticket: ticket?.tipo_ticket || 'FEATURE'
                    })
                })
                .catch(err => setSubmitError('Erro ao carregar dados do chamado para edição.'))
                .finally(() => setIsLoadingData(false))
        }
    }, [id, reset, isEditing])

    const onSubmit = async (values) => {
        setSubmitError('')
        try {
            if (!user?.id) throw new Error("Sessão expirada ou usuário não autenticado.")

            const finalValues = {
                ...values,
                customer_name: values.customer_name.toUpperCase(),
            }

            if (!isEditing) finalValues.created_by = user.id

            if (isEditing) {
                await ticketService.update(id, finalValues)
            } else {
                await ticketService.create(finalValues)
            }

            navigate('/chamados')
        } catch (err) {
            console.error("ERRO NO SUPABASE:", err)
            setSubmitError(err.message || 'Falha ao salvar no banco. Verifique as colunas da tabela tickets.')
        }
    }

    // 🗑️ NOVA FUNÇÃO: Arquivar/Cancelar chamado
    const handleArchive = async () => {
        const confirmar = window.confirm('Tem certeza que deseja arquivar este chamado? Ele será cancelado e ocultado das métricas ativas.')
        if (!confirmar) return

        setSubmitError('')
        try {
            await ticketService.update(id, { status: 'CANCELADO' })
            navigate('/chamados')
        } catch (err) {
            console.error("ERRO AO ARQUIVAR:", err)
            setSubmitError('Falha ao arquivar o chamado.')
        }
    }

    // Variáveis de estilo ATUALIZADAS (com cursor-pointer adicionado)
    const inputClass = `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer ${
        isDark 
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
            : 'bg-white border-gray-300 text-gray-900'
    }`

    if (isLoadingData) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? 'bg-[#0b0f19] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                Carregando dados do chamado...
            </div>
        )
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0b0f19]' : 'bg-gray-50'}`}>
            <div className={`border-b px-6 py-4 transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <Link to="/chamados" className="text-sm text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                    ← Voltar para chamados
                </Link>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className={`text-2xl font-bold mb-6 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isEditing ? 'Editar Chamado' : 'Novo Chamado'}
                </h1>

                {submitError && (
                    <div className={`mb-6 p-4 border rounded-lg text-sm ${isDark ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <strong>Erro:</strong> {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate className={`rounded-xl border p-6 space-y-6 transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>

                    <input type="hidden" {...register('tipo_ticket')} />

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Classificação do Ticket</label>
                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => setValue('tipo_ticket', 'FEATURE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                    tipoAtual === 'FEATURE' 
                                        ? (isDark ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-purple-50 border-purple-600 text-purple-700') 
                                        : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                                }`}>
                                <Sparkles className="w-4 h-4" /> <span>Feature</span>
                            </button>
                            <button type="button" onClick={() => setValue('tipo_ticket', 'BUG')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                    tipoAtual === 'BUG' 
                                        ? (isDark ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-red-50 border-red-600 text-red-700') 
                                        : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                                }`}>
                                <Bug className="w-4 h-4" /> <span>Bug</span>
                            </button>
                            <button type="button" onClick={() => setValue('tipo_ticket', 'CHORE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                    tipoAtual === 'CHORE' 
                                        ? (isDark ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-100 border-gray-500 text-gray-700') 
                                        : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                                }`}>
                                <Wrench className="w-4 h-4" /> <span>Chore</span>
                            </button>
                            <button type="button" onClick={() => setValue('tipo_ticket', 'SUPORTE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                    tipoAtual === 'SUPORTE' 
                                        ? (isDark ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-blue-50 border-blue-600 text-blue-700') 
                                        : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                                }`}>
                                <Headphones className="w-4 h-4" /> <span>Suporte técnico</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Título *</label>
                        <input {...register('title')} className={`${inputClass} cursor-text ${errors.title ? (isDark ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50') : ''}`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Solicitante</label>
                            <select {...register('solicitante')} className={inputClass}>
                                <option value="Selecionar" disabled>- Selecione -</option>
                                <option value="7 Serv">7 Serv</option>
                                <option value="7 Facilite">7 Facilite</option>
                                <option value="Amin Beneficios">Amin Beneficios</option>
                                <option value="Axis Card">Axis Card</option>
                                <option value="B-Flux Gestão">B-Flux Gestão</option>
                                <option value="Conexos Card">Conexos Card</option>
                                <option value="Frotapp Soluções">Frotapp Soluções</option>
                                <option value="Intech Beneficios">Intech Beneficios</option>
                                <option value="Nexos Card">Nexos Card</option>
                                <option value="Pay Beneficios">Pay Beneficios</option>
                                <option value="Syncmax Beneficios">Syncmax Beneficios</option>
                                <option value="Uny Beneficios">Uny Beneficios</option>
                                <option value="Equipe Interna">Equipe Interna</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Workflow</label>
                            <select {...register('workflow')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="Engenharia">Engenharia</option>
                                <option value="Portifolio">Portifólio</option>
                                <option value="Equipe Interna">Equipe Interna</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Estado</label>
                            <select {...register('estado')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="A Priorizar">A Priorizar</option>
                                <option value="Priorizado">Priorizado</option>
                                <option value="A Iniciar">A Iniciar</option>
                                <option value="Em Desenvolvimento">Em Desenvolvimento</option>
                                <option value="Em Revisão">Em Revisão</option>
                                <option value="Em Validação">Em Validação</option>
                                <option value="Pronto">Pronto</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tipo de Chamado</label>
                            <select {...register('tipo_chamado')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="Bug">Bug</option>
                                <option value="Aprimoramento">Aprimoramento</option>
                                <option value="Erro Operacional">Erro Operacional</option>
                                <option value="Nova Funcionalidade">Nova Funcionalidade</option>
                                 <option value="Demanda Interna">Demanda Interna</option>
                                <option value="Dúvida">Dúvida</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Aplicação</label>
                            <select {...register('aplicacao')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="Aplicativo Mobile">Aplicativo Mobile</option>
                                <option value="Web">Web</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tipo de Perfil</label>
                            <select {...register('tipo_perfil')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="Licenciado">Licenciado</option>
                                <option value="Cliente">Cliente</option>
                                <option value="Credenciado">Credenciado</option>
                                <option value="Admorganizacao">Administrador da Organização</option>
                                <option value="Operadororganization">Operador da Organização</option>
                                <option value="Beneficiario">Beneficiário</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Categoria</label>
                            <select {...register('categoria')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="Abastecimento">Abastecimento</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="Patrimônio">Patrimônio</option>
                                <option value="Telemetria">Telemetria</option>
                                <option value="Beneficios">Beneficios</option>
                                <option value="Suporte Interno">Suporte Interno</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Prioridade</label>
                            <select {...register('priority')} className={inputClass}>
                                <option value="Selecionar">- Selecione - </option>
                                <option value="BAIXA">Baixa</option>
                                <option value="MEDIA">Média</option>
                                <option value="ALTA">Alta</option>
                                <option value="CRITICA">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Descrição</label>
                        <textarea {...register('description')} rows={3} className={`${inputClass} resize-none cursor-text`} />
                    </div>

                    <div className={`border-t pt-6 transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Dados do Cliente</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-1">
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Nome do Cliente <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('customer_name')}
                                    className={`${inputClass} uppercase ${errors.customer_name ? (isDark ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50') : ''}`}
                                >
                                    <option value="Selecionar" disabled>-- SELECIONE O CLIENTE --</option>
                                    <option value="SUPORTE INTERNO">SUPORTE INTERNO</option>
                                    <option value="7SERV">7SERV</option>
                                    <option value="7FACILITE">7 FACILITE</option>
                                    <option value="AMIN_BENEFICIOS">AMIN BENEFICIOS</option>
                                    <option value="AXIS_CARD">AXIS CARD</option>
                                    <option value="B-FLUX GESTÃO">B-FLUX GESTÃO</option>
                                    <option value="CONEXOS_CARD">CONEXOS CARD</option>
                                    <option value="FROTAP_SOLUÇÕES">FROTAPP SOLUÇÕES</option>
                                    <option value="INTECH_BENEFICIOS">INTECH BENEFICIOS</option>
                                    <option value="NEXOS_CARD">NEXOS CARD</option>
                                    <option value="PAY_BENEFICIOS">PAY BENEFICIOS</option>
                                    <option value="SYNCMAX_BENEFICIOS">SYNCMAX BENEFICIOS</option>
                                    <option value="UNY_BENEFICIOS">UNY BENEFICIOS</option>
                                </select>
                                {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center justify-end gap-3 border-t pt-6 transition-colors ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        
                        {/* 🔘 NOVO: Botão de Arquivar (Aparece apenas na Edição) */}
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleArchive}
                                className={`mr-auto px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                    isDark 
                                    ? 'text-red-400 hover:bg-red-900/30' 
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                            >
                                Arquivar Chamado
                            </button>
                        )}

                        <Link
                            to="/chamados"
                            className={`px-4 py-2 text-sm transition-colors cursor-pointer ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Chamado' : 'Salvar Chamado')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}

export default NewTicketPage