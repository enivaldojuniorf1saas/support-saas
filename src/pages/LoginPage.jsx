import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

import { BookOpenIcon } from '@heroicons/react/24/outline' 
import { ChatWidget } from '../components/ChatWidget'

const schema = z.object({
    email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    password: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export function LoginPage() {
    const { signIn } = useAuthContext()
    const navigate = useNavigate()
    
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' }
    })

    const onSubmit = async (values) => {
        try {
            await signIn(values)
            navigate('/chamados')
        } catch (err) {
            console.error(err)
            setError('root', { message: 'E-mail ou senha inválidos. Tente novamente.' })
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-gray-50 relative">
            
            {/* ========================================================= */}
            {/* LADO ESQUERDO: IMAGEM DE DESTAQUE (Oculto no Mobile) */}
            {/* ========================================================= */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-blue-50">
                <img 
                    src="/login1.png" 
                    alt="Equipe de Suporte Técnico F1" 
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Overlay opcional para garantir que a imagem não fique "crua" e combine com a identidade do sistema */}
                <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply pointer-events-none"></div>
            </div>

            {/* ========================================================= */}
            {/* LADO DIREITO: FORMULÁRIO DE LOGIN */}
            {/* ========================================================= */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 z-10 relative">
                    
                    <div className="text-center mb-8">
                        {/* Box de Logo F1 Fake para dar identidade ao login */}
                        <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center shadow-sm mb-4">
                            <span className="text-white font-extrabold text-2xl leading-none">F1</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Portal de Suporte</h1>
                        <p className="text-sm text-gray-500 mt-1">Insira suas credenciais para acessar a plataforma</p>
                    </div>

                    {errors.root && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium animate-fade-in text-center">
                            ⚠️ {errors.root.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">E-mail Corporativo</label>
                            <input
                                id="email"
                                type="email"
                                disabled={isSubmitting}
                                {...register('email')}
                                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                placeholder="seu-usuario@f1suporte.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">• {errors.email.message}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Senha de Acesso</label>
                                <Link to="/ResetPassword" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                disabled={isSubmitting}
                                {...register('password')}
                                className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium animate-fade-in">• {errors.password.message}</p>}
                        </div>

                        <div className="space-y-4 pt-4 mt-6">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer">
                                {isSubmitting ? 'Autenticando...' : 'Entrar no Sistema'}
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ou</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <Link to="/rastrear" className="w-full flex items-center justify-center bg-gray-50 hover:bg-sky-50 text-gray-700 hover:text-blue-700 border border-gray-200 py-3 rounded-xl font-bold text-sm transition-all shadow-sm">
                                Rastrear Código de Chamado
                            </Link>
                        </div>
                    </form>

                    {/* 🚀 ROTA PÚBLICA DE MANUAIS */}
                    <div className="text-center pt-6 mt-8 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-3 font-medium">Precisa de ajuda com o sistema?</p>
                        <button
                            onClick={() => navigate('/ajuda')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors justify-center cursor-pointer"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            Acessar Manuais do Sistema
                        </button>
                    </div>
                </div>
            </div>

            <ChatWidget />
            
        </div>
    )
}

export default LoginPage;