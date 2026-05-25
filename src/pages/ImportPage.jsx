import { useState } from 'react'
import Papa from 'papaparse'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
import { ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export function ImportPage() {
  const { user } = useAuthContext()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleImport = () => {
    // 1. Verificação de segurança adicional para garantir que o usuário existe
    if (!file) return
    if (!user || !user.id) {
      setResult({ success: 0, error: 'Usuário não autenticado.' })
      return
    }

    setLoading(true)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const ticketsToInsert = results.data.map((row) => ({
            title: row.title,
            customer_name: row.customer_name,
            description: row.description || '',
            priority: row.priority || 'MEDIA',
            estado: row.estado || 'A iniciar',
            workflow: row.workflow || 'Engenharia',
            tipo_chamado: row.tipo_chamado || 'Bug',
            aplicacao: row.aplicacao || 'Web',
            tipo_ticket: row.tipo_ticket || 'FEATURE',
            solicitante: row.solicitante || 'Solicitante 1',
            tipo_perfil: row.tipo_perfil || 'Cliente',
            categoria: row.categoria || 'Manutenção',
            // 2. CORREÇÃO AQUI: Opcional chaining (?) garante que o código não quebre
            created_by: user?.id,
          }))

          await ticketService.importTickets(ticketsToInsert)
          setResult({ success: ticketsToInsert.length })
        } catch (err) {
          setResult({ success: 0, error: err.message || 'Erro desconhecido ao importar' })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Importar Chamados em Massa (CSV)</h1>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 border-dashed text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <input 
          type="file" 
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-4 text-xs text-gray-500">
          O CSV deve conter colunas com cabeçalhos exatos como: <code>title</code> e <code>customer_name</code>.
        </p>
      </div>

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        <ArrowUpTrayIcon className="w-5 h-5" />
        {loading ? 'Importando...' : 'Iniciar Importação'}
      </button>

      {result?.success > 0 && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          Sucesso! {result.success} chamados foram importados.
        </div>
      )}
      
      {result?.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Erro na importação: {result.error}
        </div>
      )}
    </div>
  )
}