import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'

const schema = z.object({
    title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
    description: z.string().optional(),
    customer_name: z.string().min(2, 'Nome do cliente é obrigatório'),
    customer_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    customer_phone: z.string().optional(),
    priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
})

export function NewTicketPage() {
    const { user } = useAuthContext()
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { priority: 'MEDIA' },
    })

    const onSubmit = async (values) => {
        await ticketService.create({ ...values, created_by: user.id })
        navigate('/chamados')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <Link to="/chamados" className="text-sm text-blue-500 hover:underline">
                    ← Voltar para chamados
                </Link>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Chamado</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('title')}
                            placeholder="Descreva o problema em uma linha"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            placeholder="Detalhes adicionais sobre o chamado..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Prioridade */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prioridade <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('priority')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="BAIXA">Baixa</option>
                            <option value="MEDIA">Média</option>
                            <option value="ALTA">Alta</option>
                            <option value="CRITICA">Crítica</option>
                        </select>
                    </div>

                    <hr className="border-gray-100" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados do Cliente</p>

                    {/* Nome do cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('customer_name')}
                            placeholder="Nome completo do cliente"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
                    </div>

                    {/* E-mail e telefone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input
                                {...register('customer_email')}
                                type="email"
                                placeholder="cliente@email.com"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                {...register('customer_phone')}
                                placeholder="(85) 99999-9999"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botão */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Criando...' : 'Criar Chamado'}
                    </button>
                </form>
            </div>
        </div>
    )
}