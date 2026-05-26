import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const schema = z.object({
    email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export function LoginPage() {
    const { signIn } = useAuthContext()
    const navigate = useNavigate()
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (values) => {
    console.log("Valores que saíram do formulário:", values) // 🕵️‍♂️ Adicione isso para inspecionar
    try {
        // Se o seu useAuth espera { email, password }, certifique-se de que o values tem exatamente essas chaves.
        await signIn(values)
        navigate('/chamados')
    } catch {
        setError('root', { message: 'E-mail ou senha inválidos' })
    }
}

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Portal de Suporte</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            E-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            {...register('password')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {errors.root && (
                        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                            {errors.root.message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}