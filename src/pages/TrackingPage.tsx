import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { ClockIcon, CheckCircleIcon, CodeBracketIcon, WrenchIcon } from '@heroicons/react/24/outline'

export function TrackingPage() {
  const { id } = useParams()
  // Inicializamos de forma que o corretor do editor não reclame (usando undefined/null limpo)
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ticketService.getById(id)
      .then(data => setTicket(data))
      .catch(err => console.error('Erro ao buscar rastreio:', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">Buscando informações de rastreamento...</div>
  }

  if (!ticket) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm font-bold text-red-500">Código de rastreio inválido ou chamado inexistente.</div>
  }

  // 🛡️ CORREÇÃO AQUI: Uso do encadeamento opcional (?.) para evitar o erro "never"
  const estadoAtual = ticket?.estado || ticket?.workflow || 'A iniciar'
  const ticketNumber = ticket?.ticket_number || 'S/N'
  const ticketTitle = ticket?.title || 'Sem título'
  const ticketTipo = ticket?.tipo_chamado || 'Suporte'
  const ticketAbertura = ticket?.created_at ? new Date(ticket.created_at).toLocaleDateString('pt-BR') : ''
  
  const etapas = [
    { nome: 'Registrado', desc: 'Chamado recebido e triado', ativo: true, icone: ClockIcon },
    { nome: 'Em Análise', desc: 'Equipe técnica avaliando a causa', ativo: ['Em Análise', 'Em revisão', 'Em Desenvolvimento', 'Pronto'].includes(estadoAtual), icone: WrenchIcon },
    { nome: 'Em Desenvolvimento', desc: 'Engenharia aplicando a correção', ativo: ['Em Desenvolvimento', 'Pronto'].includes(estadoAtual), icone: CodeBracketIcon },
    { nome: 'Concluído', desc: 'Correção aplicada com sucesso', ativo: ['Pronto', 'Concluído'].includes(estadoAtual) || ticket?.status === 'FECHADO', icone: CheckCircleIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
        
        {/* CABEÇALHO */}
        <div className="bg-gray-900 p-6 text-white text-center">
          <span className="text-xs font-bold bg-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">
            Acompanhamento de Solicitação
          </span>
          <h1 className="text-xl font-bold mt-3">Chamado #{ticketNumber}</h1>
          <p className="text-xs text-gray-400 mt-1">Atualizado em tempo real pela nossa engenharia</p>
        </div>

        {/* RESUMO DO CHAMADO */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assunto registrado</h2>
          <p className="text-base font-bold text-gray-800 mt-1">{ticketTitle}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div>• <span className="font-semibold">Abertura:</span> {ticketAbertura}</div>
            <div>• <span className="font-semibold">Tipo:</span> {ticketTipo}</div>
          </div>
        </div>

        {/* TIMELINE VISUAL (ESTILO ENTREGA) */}
        <div className="p-6 md:p-8 space-y-8 relative">
          
          {/* Linha vertical conectora de fundo */}
          <div className="absolute left-[37px] top-12 bottom-16 w-0.5 bg-gray-200 z-0"></div>

          {etapas.map((etapa, idx) => {
            const Icon = etapa.icone
            return (
              <div key={idx} className="flex items-start gap-4 relative z-10">
                {/* Círculo do Ícone */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-colors ${
                  etapa.ativo 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Textos descritivos */}
                <div className="flex-1 pt-1">
                  <h3 className={`text-sm font-bold ${etapa.ativo ? 'text-gray-900' : 'text-gray-400'}`}>
                    {etapa.nome}
                  </h3>
                  <p className={`text-xs mt-0.5 ${etapa.ativo ? 'text-gray-500' : 'text-gray-400/70'}`}>
                    {etapa.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* RODAPÉ INFORMATIVO */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400 font-medium">
          Caso precise de mais informações, responda diretamente no chat do WhatsApp.
        </div>

      </div>
    </div>
  )
}