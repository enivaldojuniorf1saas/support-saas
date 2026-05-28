// src/pages/TicketListPage.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ticketService } from '../services/ticketService'

export function TicketListPage() {
  // CONDICÃO 2: Controla o estado diretamente pelos parâmetros da URL (?page=1&search=...)
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Lê os valores da URL. Se não existirem, usa os fallbacks padrões (Página 1, Busca Vazia)
  const currentPage = Number(searchParams.get('page')) || 1
  const searchQuery = searchParams.get('search') || ''

  const [tickets, setTickets] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 10 // Quantidade de chamados por página

  // Dispara a busca sempre que a página ou a busca na URL mudarem
  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true)
        const { data, totalCount } = await ticketService.getTickets({
          page: currentPage,
          pageSize,
          search: searchQuery
        })
        setTickets(data)
        setTotalCount(totalCount)
      } catch (err) {
        console.error('Erro ao carregar lista de chamados:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [currentPage, searchQuery]) // Fica vigiando a URL do navegador

  // Atualiza a URL quando o usuário muda de página
  const handlePageChange = (newPage) => {
    setSearchParams({ search: searchQuery, page: newPage.toString() })
  }

  // Atualiza a URL quando o usuário digita na busca
  const handleSearchChange = (e) => {
    const value = e.target.value
    if (value) {
      // Se tiver busca, volta para a página 1 por segurança
      setSearchParams({ search: value, page: '1' })
    } else {
      // Se limpar a busca, remove o parâmetro da URL
      searchParams.delete('search')
      setSearchParams({ page: '1' })
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Chamados</h1>
          <p className="text-sm text-gray-500">Exibindo do mais recente ao mais antigo</p>
        </div>

        {/* INPUT DE BUSCA VIA URL */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar por título ou cliente..."
          className="w-full sm:w-72 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* RENDERIZAÇÃO DA LISTA */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Carregando chamados ordenados...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 text-sm text-gray-500">
          Nenhum chamado encontrado para esta pesquisa ou página.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Cliente</th>
                <th className="p-4">Título do Chamado</th>
                <th className="p-4">Status</th>
                <th className="p-4">Data de Criação</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-gray-900">{ticket.customer_name}</td>
                  <td className="p-4">{ticket.title}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {ticket.workflow}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')} {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CONTROLES DE PAGINAÇÃO VIA URL */}
          {totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-500 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}