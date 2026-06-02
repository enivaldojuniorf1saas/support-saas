import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function TrackingPage() {
  const { id } = useParams() // Pega o código secreto (UUID) direto da URL
  
  // Tipagem 'any' para evitar erros do TypeScript
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  // Efeito que roda sozinho assim que o cliente abre a página
  useEffect(() => {
    if (!id) {
      setErro('Nenhum código de rastreio foi fornecido no link.')
      setLoading(false)
      return
    }

    const fetchTicket = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            history:ticket_history(*, agent:profiles!changed_by(full_name))
          `)
          .eq('id', id) // Busca exatamente pelo ID único e blindado
          .single()

        if (error || !data) throw new Error('Credenciais inválidas.')
        
        // Ordena o histórico para mostrar do mais antigo para o mais novo na linha do tempo
        if (data.history) {
          data.history.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        }

        setTicket(data)
      } catch (err) {
        setErro('Chamado não encontrado ou link de rastreio expirado.')
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Buscando informações do chamado...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-3xl mx-auto text-center mb-10 mt-4 sm:mt-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Rastreamento de Chamado</h1>
        <p className="mt-2 text-gray-500">Acompanhe o status e as interações da sua solicitação.</p>
      </div>

      {erro && !ticket && (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-gray-500 text-sm mb-6">{erro}</p>
          <Link 
            to="/login"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
          >
            Acessar Sistema
          </Link>
        </div>
      )}

      {ticket && (
        <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
          
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <span className="text-gray-400 font-mono text-sm">#{ticket.ticket_number || 'S/N'}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{ticket.title}</h2>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
            
            <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
              {ticket.description || <span className="italic text-gray-400">Nenhuma descrição detalhada.</span>}
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Linha do Tempo</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {(!ticket.history || ticket.history.length === 0) ? (
                <div className="relative flex items-center justify-center">
                  <p className="text-center text-gray-500 italic py-4 bg-white px-4 relative z-10">O seu chamado está na fila para atendimento.</p>
                </div>
              ) : (
                ticket.history.map((h: any, i: number) => (
                  <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{h.agent?.full_name || 'Sistema'}</span>
                        <span className="text-xs text-gray-400 font-medium">{format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {h.new_status && <div className="mb-2"><StatusBadge status={h.new_status} /></div>}
                        {h.note && <p>{h.note}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}