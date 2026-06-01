import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MagnifyingGlassIcon, TicketIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { StatusBadge } from '../components/StatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { href, Link } from 'react-router-dom'

export function TrackingPage() {
  const [ticketNumber, setTicketNumber] = useState('')
  const [clientId, setClientId] = useState('')
  
  // Tipagem 'any' para evitar erros do TypeScript
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Tipagem 'React.FormEvent' para o formulário
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ticketNumber?.trim() || !clientId?.trim()) {
      setErro('Preencha os dois campos para buscar.')
      return
    }

    setLoading(true)
    setErro('')
    setTicket(null)

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          history:ticket_history(*, agent:profiles!changed_by(full_name))
        `)
        .ilike('ticket_number', `%${ticketNumber.trim()}%`)
        .ilike('cliente_id', clientId.trim())
        .single()

      if (error || !data) throw new Error('Credenciais inválidas.')
      
      setTicket(data)
    } catch (err) {
      setErro('Chamado não encontrado. Verifique o Número e sua Credencial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Adicionado 'flex flex-col justify-center' para centralizar perfeitamente no eixo Y (vertical)
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-3xl mx-auto text-center mb-10 mt-[-5vh]">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Rastreamento de Chamado</h1>
        <p className="mt-2 text-gray-500">Acompanhe o status e as interações da sua solicitação de suporte.</p>
      </div>

      {!ticket && (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <form onSubmit={handleSearch} className="space-y-6">
            
            {erro && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 text-center">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do Chamado</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="Digite o número do chamado"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="digite sua credencial"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Rastrear Chamado'}
            </button>

            <br />

            
          </form>
              <Link 
              to="/login"
              className='className="w-full flex items-center justify-center gap-2 text-blue-600 py-3 rounded-xl font-bold transition disabled:opacity-50"'
              >
                Voltar para login
              </Link>
        </div>
      )}

      {ticket && (
        <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
          
          <button onClick={() => setTicket(null)} className="text-sm text-blue-600 hover:underline font-medium">
            &larr; Fazer nova busca
          </button>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <span className="text-gray-400 font-mono text-sm">#{ticket.ticket_number}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{ticket.title}</h2>
              </div>
              <StatusBadge status={ticket.status} />
            </div>
            
            <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Linha do Tempo</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {(!ticket.history || ticket.history.length === 0) ? (
                <p className="text-center text-gray-500 italic py-4">Nenhuma interação registrada ainda.</p>
              ) : (
                // Adicionada tipagem 'h: any, i: number' para o TypeScript aprovar
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
