import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export function NpsPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [score, setScore] = useState(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    ticketService.getById(id)
      .then(data => {
        setTicket(data)
        // Se o chamado já tiver nota, mostra a tela de sucesso para não votar 2x
        if (data.nps_score !== null && data.nps_score !== undefined) {
          setSuccess(true)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (score === null) return
    setSubmitting(true)
    try {
      await ticketService.closeWithNps(id, {
        nps_score: score,
        nps_comment: comment
      })
      setSuccess(true)
    } catch (error) {
      alert('Houve um erro ao enviar a avaliação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-gray-500">Carregando pesquisa...</div>
  }

  if (!ticket) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-red-500 font-bold">Chamado não encontrado.</div>
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full border border-gray-100">
          <CheckCircleIcon className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Recebida!</h1>
          <p className="text-gray-500 text-sm">Agradecemos o seu feedback. Ele é essencial para melhorarmos nosso atendimento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10 max-w-lg w-full">
        
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4 tracking-wider uppercase">
            Chamado #{ticket.ticket_number || 'S/N'}
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Como foi o seu atendimento?</h1>
          <p className="text-gray-500 text-sm">Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar?</p>
        </div>

        {/* BOTOES NPS 0 a 10 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[0,1,2,3,4,5,6,7,8,9,10].map((num) => (
            <button
              key={num}
              onClick={() => setScore(num)}
              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl text-lg font-bold transition-all transform active:scale-95 ${
                score === num 
                  ? 'bg-blue-600 text-white shadow-md border-blue-600' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {num}
            </button>
          ))}
          <div className="w-full flex justify-between px-1 mt-2 text-[11px] font-semibold text-gray-400 uppercase">
            <span>0 - Pouco provável</span>
            <span>10 - Muito provável</span>
          </div>
        </div>

        {/* CAMPO DE COMENTÁRIO */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">Quer deixar um comentário? (Opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            placeholder="Conte-nos o que achou do atendimento..."
            className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-gray-50/50"
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          disabled={score === null || submitting}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
        >
          {submitting ? 'Enviando resposta...' : 'Enviar Avaliação e Fechar Chamado'}
        </button>

      </div>
    </div>
  )
}