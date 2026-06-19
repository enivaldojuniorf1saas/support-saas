import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

// 🚀 1. IMPORTAÇÃO DO ASSISTENTE
import { ChatWidget } from '../components/ChatWidget'

// 1. CORREÇÃO DO SCHEMA: Ordem correta para capturar campo vazio primeiro
const schema = z.object({
    email: z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
    password: z
        .string()
        .min(1, 'Senha é obrigatória')
        .min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export function LoginPage() {
    const { signIn } = useAuthContext()
    const navigate = useNavigate()
    
    const { 
        register, 
        handleSubmit, 
        setError, 
        formState: { errors, isSubmitting } 
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' }
    })

    const onSubmit = async (values) => {
        console.log("Valores que saíram do formulário:", values) 
        try {
            await signIn(values)
            navigate('/chamados')
        } catch (err) {
            console.error(err)
            setError('root', { message: 'E-mail ou senha inválidos. Tente novamente.' })
        }
    }

    return (
        // Adicionada a classe "relative" na div principal para o Widget
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                
                {/* CABEÇALHO */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Portal de Suporte</h1>
                    <p className="text-xs text-gray-500 mt-1">Insira suas credenciais para acessar a plataforma</p>
                </div>

                {/* ALERTA DE ERRO GLOBAL */}
                {errors.root && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium animate-fade-in">
                        ⚠️ {errors.root.message}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* CAMPO: E-MAIL */}
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            E-mail Corporativo
                        </label>
                        <input
                            id="email"
                            type="email"
                            disabled={isSubmitting}
                            {...register('email')}
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                errors.email 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="seu-usuario@f1suporte.com"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">• {errors.email.message}</p>
                        )}
                    </div>

                    {/* CAMPO: SENHA */}
                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Senha de Acesso
                        </label>
                        <input
                            id="password"
                            type="password"
                            disabled={isSubmitting}
                            {...register('password')}
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                errors.password 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">• {errors.password.message}</p>
                        )}
                    </div>

                    {/* CONTAINER DE BOTÕES */}
                    <div className="space-y-3 pt-4 border-t border-gray-100 mt-6">
                        
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                        >
                            {isSubmitting ? 'Autenticando...' : 'Entrar no Sistema'}
                        </button>

                        <div className="relative flex items-center py-1">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ou</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <Link
                            to="/rastrear"
                            className="w-full flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-blue-600 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs"
                        >
                            Rastrear Código de Chamado
                        </Link>

                        <div className="text-center pt-1">
                            <Link
                                to="/ResetPassword"
                                className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                Esqueceu sua senha? Alterar credenciais
                            </Link>
                        </div>
                    </div>
                </form>
            </div>

            {/* 🚀 2. O WIDGET É RENDERIZADO AQUI NO FUNDO */}
            <ChatWidget />
            
        </div>
    )
}

// 4. SEGURANÇA ANTICRASH
export default LoginPage;