import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export function NpsPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [npsScore, setNpsScore] = useState(null)
  const [npsComment, setNpsComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('ticket_number, title, nps_score, status')
          .eq('id', id)
          .single()

        if (error) throw error
        
        // Se já tiver nota, joga direto pra tela de sucesso
        if (data.nps_score !== null) {
          setIsSuccess(true)
        }
        setTicket(data)
      } catch (err) {
        setErro('Chamado não encontrado ou link de avaliação inválido.')
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (npsScore === null) {
      setErro('Por favor, selecione uma nota de 0 a 10 antes de enviar.')
      return
    }
    setIsSubmitting(true)
    setErro('')

    try {
      // Atualiza a nota e o comentário direto no chamado
      const { error } = await supabase
        .from('tickets')
        .update({ 
          nps_score: npsScore, 
          nps_comment: npsComment,
          status: 'FECHADO' // Garante que o chamado está encerrado
        })
        .eq('id', id)

      if (error) throw error
      setIsSuccess(true)
    } catch (err) {
      setErro('Ocorreu um erro ao enviar sua avaliação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Define a cor do botão com base na nota selecionada
  const getButtonClass = (nota) => {
    if (npsScore !== nota) return 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
    if (nota <= 6) return 'bg-red-500 text-white border-red-500' // Detratores
    if (nota <= 8) return 'bg-yellow-500 text-white border-yellow-500' // Neutros
    return 'bg-green-500 text-white border-green-500' // Promotores
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Carregando formulário...</div>
  }

  if (erro && !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-600">{erro}</p>
        </div>
      </div>
    )
  }

  // TELA DE SUCESSO / JÁ AVALIADO
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100 text-center animate-fade-in">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Avaliação Recebida!</h2>
          <p className="text-gray-600 mb-8">
            Agradecemos muito pelo seu feedback no chamado <strong>#{ticket?.ticket_number || id}</strong>. Ele nos ajuda a melhorar nosso atendimento.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500">
            Você já pode fechar esta janela ou aba com segurança.
          </div>
        </div>
      </div>
    )
  }

  // TELA DE FORMULÁRIO (NPS)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-2xl w-full bg-white p-6 sm:p-10 rounded-3xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Como foi o seu atendimento?</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Referente ao chamado <span className="font-semibold text-gray-700">#{ticket.ticket_number || id}</span>: {ticket.title}
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sessão da Nota */}
          <div>
            <label className="block text-center text-lg font-medium text-gray-800 mb-4">
              Em uma escala de 0 a 10, o quanto você recomendaria nosso suporte? *
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNpsScore(i)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl text-base sm:text-lg font-bold border-2 transition-all duration-200 shadow-sm ${getButtonClass(i)}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3 px-2 sm:px-6">
              <span>0 - Nada provável</span>
              <span>10 - Muito provável</span>
            </div>
          </div>

          {/* Sessão do Comentário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              O que motivou a sua nota? (Opcional)
            </label>
            <textarea
              rows="4"
              value={npsComment}
              onChange={(e) => setNpsComment(e.target.value)}
              placeholder="Deixe um elogio, sugestão ou reclamação..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors resize-none"
            ></textarea>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </form>

      </div>
    </div>
  )
}