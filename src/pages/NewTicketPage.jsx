import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
import { Bug, Sparkles, Wrench } from 'lucide-react'

const schema = z.object({
    title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
    description: z.string().optional(),
    customer_name: z.string().min(2, 'Nome do cliente é obrigatório'),
    customer_email: z.string().optional(), // Relaxamos a validação de e-mail para não bloquear o envio à toa
    customer_phone: z.string().optional(),
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
    const { user } = useAuthContext()
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState('')

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { 
            priority: 'MEDIA', 
            tipo_ticket: 'FEATURE', 
            estado: 'A iniciar', 
            workflow: 'Engenharia',
            tipo_chamado: 'Bug',
            aplicacao: 'Web',
            tipo_perfil: 'Cliente',
            categoria: 'Manutenção',
            solicitante: 'Solicitante 1'
        },
    })

    const tipoAtual = watch('tipo_ticket')

    const onSubmit = async (values) => {
        console.log("1. Botão clicado! Valores capturados:", values)
        setSubmitError('')
        
        try {
            if (!user?.id) {
                throw new Error("Sessão expirada ou usuário não autenticado.")
            }
            
            console.log("2. Enviando para o Supabase...")
            const resposta = await ticketService.create({ ...values, created_by: user.id })
            
            console.log("3. Sucesso! Supabase retornou:", resposta)
            navigate('/chamados')
        } catch (err) {
            console.error("ERRO NO SUPABASE:", err)
            // Esta mensagem ficará vermelha na tela se o Supabase não aceitar os dados!
            setSubmitError(err.message || 'Falha ao salvar no banco. Verifique as colunas da tabela tickets.')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <Link to="/chamados" className="text-sm text-blue-500 hover:underline">← Voltar para chamados</Link>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Chamado</h1>

                {/* DEBUG: Mostra o erro do Supabase */}
                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <strong>Erro de Banco de Dados:</strong> {submitError}
                        <br/>(Dica: se for um erro de coluna não encontrada, crie-a no painel do Supabase).
                    </div>
                )}

                {/* DEBUG: Mostra exatamente o que o formulário acha que falta */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                        <strong>O formulário foi bloqueado devido a:</strong>
                        <ul className="list-disc ml-5 mt-1">
                            {Object.entries(errors).map(([campo, erro]) => (
                                <li key={campo}><b>{campo}</b>: {erro.message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* O noValidate impede que o navegador bloqueie silenciosamente */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

                    {/* CAMPO OCULTO (Necessário para o Zod entender os botões abaixo) */}
                    <input type="hidden" {...register('tipo_ticket')} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Classificação do Ticket</label>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setValue('tipo_ticket', 'FEATURE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${tipoAtual === 'FEATURE' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <Sparkles className="w-4 h-4" /> <span>Feature</span>
                            </button>
                            <button type="button" onClick={() => setValue('tipo_ticket', 'BUG')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${tipoAtual === 'BUG' ? 'bg-red-50 border-red-600 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <Bug className="w-4 h-4" /> <span>Bug</span>
                            </button>
                            <button type="button" onClick={() => setValue('tipo_ticket', 'CHORE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${tipoAtual === 'CHORE' ? 'bg-gray-100 border-gray-500 text-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <Wrench className="w-4 h-4" /> <span>Chore</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <input {...register('title')} className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                            <select {...register('solicitante')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                {Array.from({ length: 8 }, (_, i) => (
                                    <option key={i} value={`Solicitante ${i + 1}`}>Solicitante {i + 1}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow</label>
                            <select {...register('workflow')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="Engenharia">Engenharia</option>
                                <option value="Portifolio">Portifólio</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select {...register('estado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                {['A iniciar', 'A priorizar', 'Em Desenvolvimento', 'Em revisão', 'Em validação', 'Priorizado', 'Pronto'].map(est => (
                                    <option key={est} value={est}>{est}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chamado</label>
                            <select {...register('tipo_chamado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                {['Bug', 'Suporte técnico', 'Aprimoramento', 'Erro operacional', 'Solicitação de Funcionalidade'].map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aplicação</label>
                            <select {...register('aplicacao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="Aplicativo Mobile">Aplicativo Mobile</option>
                                <option value="Web">Web</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Perfil</label>
                            <select {...register('tipo_perfil')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                {['Licenciado', 'Cliente', 'Credenciado', 'Adm organização', 'Operador da organização', 'Beneficiário'].map(perfil => (
                                    <option key={perfil} value={perfil}>{perfil}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select {...register('categoria')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                {['Abastecimento', 'Manutenção', 'Telemetria', 'Beneficios', 'Patrimonio', 'Educação', 'Saúde'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                            <select {...register('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="BAIXA">Baixa</option>
                                <option value="MEDIA">Média</option>
                                <option value="ALTA">Alta</option>
                                <option value="CRITICA">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea {...register('description')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <hr className="border-gray-100" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados do Cliente</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                            <input {...register('customer_name')} className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.customer_name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input {...register('customer_email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input {...register('customer_phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {isSubmitting ? 'Criando...' : 'Criar Chamado'}
                    </button>
                </form>
            </div>
        </div>
    )
}