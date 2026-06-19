import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'

// Ícone de seta para o botão de voltar
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

// 1. Schema de validação (Apenas E-mail é necessário aqui)
const schema = z.object({
    email: z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('Digite um e-mail válido'),
})

export function ResetPassword() {
    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting, isSubmitSuccessful } 
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: '' }
    })

    const onSubmit = async (values) => {
        console.log("Solicitação de reset para o e-mail:", values.email)
        
        try {
            // Aqui entrará a função do seu AuthContext para recuperar senha
            // Exemplo: await resetPassword(values.email)
            
            // Simulando o tempo de requisição
            await new Promise(resolve => setTimeout(resolve, 1500))
            
        } catch (err) {
            console.error("Erro ao solicitar recuperação:", err)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 relative">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                
                {/* BOTÃO DE VOLTAR (Posicionado no topo à esquerda) */}
                <Link 
                    to="/login" 
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                    Voltar para o Login
                </Link>

                {/* CABEÇALHO */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recuperar Senha</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Digite seu e-mail corporativo. Enviaremos um link seguro para você redefinir sua senha.
                    </p>
                </div>

                {/* MENSAGEM DE SUCESSO */}
                {isSubmitSuccessful ? (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-center animate-fade-in">
                        <p className="text-sm font-medium">E-mail enviado com sucesso!</p>
                        <p className="text-xs mt-1">Verifique sua caixa de entrada e a pasta de spam.</p>
                    </div>
                ) : (
                    /* FORMULÁRIO */
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                        <div className="pt-4 mt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                            >
                                {isSubmitting ? 'Enviando link...' : 'Enviar link de recuperação'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default ResetPassword;