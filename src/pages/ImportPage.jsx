import { useState } from 'react'
import Papa from 'papaparse'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// 1. EXPORTAÇÃO NOMEADA (Atende o import { ImportPage })
export function ImportPage() {
  const { user } = useAuthContext()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleImport = () => {
    if (!file) return
    if (!user || !user.id) {
      setResult({ success: 0, error: 'Usuário não autenticado no sistema.' })
      return
    }

    setLoading(true)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const ticketsToInsert = results.data
            .filter(row => row['Licença'] && row['Descreva a situação.'])
            .map((row) => {
              const tipoTicket = row['Tipo de Ticket'] || 'Chamado'
              const empresaLicenca = row['Licença'] || 'Sem Identificação'

              return {
                title: `${tipoTicket} [${empresaLicenca}]`,
                customer_name: empresaLicenca,
                description: row['Descreva a situação.'] || '',
                aplicacao: row['Aplicação da Situação.'] || 'Web',
                priority: 'MEDIA', 
                estado: row['Estado'] || 'CEARÁ',
                workflow: row['Status'] || 'A iniciar',
                tipo_chamado: tipoTicket,
                tipo_ticket: tipoTicket === 'Bug' ? 'BUG' : 'FEATURE',
                solicitante: row['Persona'] || 'Solicitante Geral',
                tipo_perfil: row['Persona'] || 'Cliente',
                categoria: row['Categoria'] || 'Suporte',
                created_by: user?.id,
              }
            })

          if (ticketsToInsert.length === 0) {
            throw new Error('Nenhum chamado válido foi encontrado no arquivo CSV.')
          }

          await ticketService.importTickets(ticketsToInsert)
          setResult({ success: ticketsToInsert.length })
        } catch (err) {
          console.error('Erro na carga do CSV:', err)
          setResult({ success: 0, error: err.message || 'Erro interno ao processar arquivo.' })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Importar Chamados em Massa (CSV)</h1>
        <p className="text-sm text-gray-500">Faça o upload do relatório para popular o banco de dados instantaneamente.</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl border border-gray-200 border-dashed text-center shadow-sm">
        <DocumentTextIcon className="w-12 h-12 text-blue-500 mx-auto mb-4 bg-blue-50 p-2.5 rounded-xl" />
        <input 
          type="file" 
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer"
        />
        <p className="mt-4 text-xs text-gray-400">
          Suporta o arquivo padrão <code>.csv</code> com codificação UTF-8.
        </p>
      </div>

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-md disabled:opacity-50 cursor-pointer"
      >
        <ArrowUpTrayIcon className="w-5 h-5" />
        {loading ? 'Processando e Inserindo...' : 'Iniciar Importação'}
      </button>

      {result?.success > 0 && (
        <div className="mt-5 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center gap-3 text-sm shadow-sm">
          <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <span className="font-bold">Importação concluída!</span>
            <p className="text-xs text-green-600 mt-0.5">Foram adicionados <span className="font-bold">{result.success}</span> novos chamados.</p>
          </div>
        </div>
      )}
      
      {result?.error && (
        <div className="mt-5 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-3 text-sm shadow-sm">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold">Falha na importação:</span>
            <p className="text-xs text-red-600 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// 2. EXPORTAÇÃO PADRÃO SEGURO (Atende caso o app tente importar sem chaves)
export default ImportPage;