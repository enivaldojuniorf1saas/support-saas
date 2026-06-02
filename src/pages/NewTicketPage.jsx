import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
import { Bug, Sparkles, Wrench, Headphones } from 'lucide-react'

const schema = z.object({
    title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
    description: z.string().optional(),
    customer_name: z.string().min(2, 'Nome do cliente é obrigatório'),
    customer_email: z.string().optional(),
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
            priority: 'SELECIONAR', 
            tipo_ticket: 'SELECIONAR', 
            estado: 'SELECIONAR', 
            workflow: 'SELECIONAR',
            tipo_chamado: 'SELECIONAR',
            aplicacao: 'SELECIONAR',
            tipo_perfil: 'SELECIONAR',
            categoria: 'SELECIONAR',
            solicitante: 'SELECIONAR' // Atualizado default
        },
    })

    const tipoAtual = watch('tipo_ticket')

    const onSubmit = async (values) => {
        setSubmitError('')
        try {
            if (!user?.id) {
                throw new Error("Sessão expirada ou usuário não autenticado.")
            }
            // Força a garantia de maiúsculo na hora de enviar, caso o onBlur falhe em algum navegador bizarro
            const finalValues = {
                ...values,
                customer_name: values.customer_name.toUpperCase(),
                created_by: user.id
            }
            await ticketService.create(finalValues)
            navigate('/chamados')
        } catch (err) {
            console.error("ERRO NO SUPABASE:", err)
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

                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <strong>Erro de Banco de Dados:</strong> {submitError}
                        <br/>(Dica: se for um erro de coluna não encontrada, crie-a no painel do Supabase).
                    </div>
                )}

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

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

                    <input type="hidden" {...register('tipo_ticket')} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Classificação do Ticket</label>
                        <div className="flex flex-wrap gap-3">
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
                            {/* ADIÇÃO: Suporte técnico na Classificação do Ticket */}
                            <button type="button" onClick={() => setValue('tipo_ticket', 'SUPORTE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${tipoAtual === 'SUPORTE' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <Headphones className="w-4 h-4" /> <span>Suporte técnico</span>
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
                                <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="7serv">7 Serv</option>
                                <option value="7Facilite">7 Facilite</option>
                                <option value="AminBeneficios">Amin Beneficios</option>
                                <option value="Axiscard">Axis Card</option>
                                <option value="BfluxGestao">B-Flux Gestão</option>
                                <option value="Conexoscard">Conexos Card</option>
                                <option value="FrotappSolucoes">Frotapp Soluções</option>
                                <option value="IntechBeneficios">Intech Beneficios</option>
                                <option value="Nexoscard">Nexos Card</option>
                                <option value="Paybeneficios">Pay Beneficios</option>
                                <option value="Syncmax">Syncmax Beneficios</option>
                                <option value="Unybeneficios">Uny Beneficios</option>
                                <option value="Equipe Interna">Equipe Interna</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow</label>
                            <select {...register('workflow')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="Engenharia">Engenharia</option>
                                <option value="Portifolio">Portifólio</option>
                                {/* ADIÇÃO: Equipe Interna no Workflow */}
                                <option value="Equipe Interna">Equipe Interna</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select {...register('estado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="Apriorizar">A priorizar</option>
                                <option value="Apriorizar">Priorizado</option>
                                <option value="Ainiciar">A Iniciar</option>
                                <option value="EmDesenvolvimento">Em Desenvolvimento</option>
                                <option value="Revisao">Em Revisão</option>
                                <option value="Em Validação">Em Validação</option>
                                <option value="Pronto">Pronto</option>
                                
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chamado</label>
                            <select {...register('tipo_chamado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="Bug">Bug</option>
                                <option value="Suportecnico">Suporte Técnico</option>
                                <option value="Aprimoramento">Aprimoramento</option>
                                <option value="Erro Operacional">Erro Operacional</option>
                                <option value="SolicitacaoFuncionalidade">Solicitação de Funcionalidade</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aplicação</label>
                            <select {...register('aplicacao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="Aplicativo Mobile">Aplicativo Mobile</option>
                                <option value="Web">Web</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Perfil</label>
                            <select {...register('tipo_perfil')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                {/* ADIÇÃO: Suporte Interno no Tipo de Perfil */}
                                 <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="Licenciado">Licenciado</option>
                                <option value="Cliente">Cliente</option>
                                <option value="Credenciado">Credenciado</option>
                                <option value="Admorganization">Gestor da Organização</option>
                                <option value="UserOrganization">Usuário da Organização</option>
                                <option value="Beneficiario">Beneficiário</option>
                                <option value="SuporteTecnico">Suporte Técnico</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select {...register('categoria')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                 <option value="SELECIONAR" disabled>- Selecione -</option>
                                <option value="Abastecimento">Abastecimento</option>
                                <option value="Manutencao">Manutenção</option>
                                <option value="Telemetry">Telemetria</option>
                                <option value="Patrimonio">Patrimônio</option>
                                <option value="Beneficios">Beneficios</option>
                                <option value="Educacao">Educação</option>
                                <option value="Saude">Saúde</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                            <select {...register('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                <option value="SELECIONAR" disabled>- Selecione -</option>
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
                    
                    {/* Dados do Cliente */}
                    <div className="border-t border-gray-100 pt-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Dados do Cliente</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Cliente <span className="text-red-500">*</span>
                                </label>
                                {/* ADIÇÃO: O campo input foi mantido, mas com uppercase visual e conversão onChange para forçar uppercase */}
                                <input
                                    {...register('customer_name')}
                                    placeholder="NOME COMPLETO"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 uppercase ${errors.customer_name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    onChange={(e) => {
                                        // Isso converte tudo o que o usuario digita imediatamente em MAIUSCULO no state do ReactHookForm
                                        setValue('customer_name', e.target.value.toUpperCase(), { shouldValidate: true })
                                    }}
                                />
                                {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                <input
                                    {...register('customer_email')}
                                    type="email"
                                    placeholder="cliente@email.com"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <input
                                    {...register('customer_phone')}
                                    placeholder="(85) 99999-9999"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botão de Submit */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                        <Link
                            to="/chamados"
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Chamado'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}