import { useState } from 'react'
import Papa from 'papaparse'
import { useNavigate, Link } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { useAuthContext } from '../context/AuthContext'
// CORREÇÃO CRÍTICA: Importando os ícones corretos da biblioteca correta para passar no Vite Build
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline'

export function ImportPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  // CONVERSOR DE DATAS: Garante o acompanhamento mensal perfeito convertendo para timestamp ISO do Postgres
  const parseCSVDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString()
    try {
      const [datePart, timePart] = dateStr.trim().split(' ')
      const [day, month, year] = datePart.split('/')
      const time = timePart || '00:00:00'
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`
    } catch (e) {
      return new Date().toISOString()
    }
  }

  // NORMALIZADORES ESTREITOS: Garantem correspondência exata com o Zod / Enums do Banco de Dados
  const normalizeTipoChamado = (val) => {
    if (!val) return 'Bug'
    const s = val.toString().trim().toLowerCase()
    if (s.includes('bug')) return 'Bug'
    if (s.includes('técnico') || s.includes('tecnico')) return 'Suporte técnico'
    if (s.includes('aprimoramento')) return 'Aprimoramento'
    if (s.includes('operacional')) return 'Erro operacional'
    if (s.includes('funcionalidade')) return 'Solicitação de Funcionalidade'
    return 'Bug'
  }

  const normalizeAplicacao = (val) => {
    if (!val) return 'Web'
    const s = val.toString().trim().toLowerCase()
    if (s.includes('mobile') || s.includes('app') || s.includes('aplicativo')) return 'Aplicativo Mobile'
    return 'Web'
  }

  const normalizeTipoPerfil = (val) => {
    if (!val) return 'Cliente'
    const s = val.toString().trim().toLowerCase()
    if (s.includes('credenciado')) return 'Credenciado'
    if (s.includes('licenciado')) return 'Licenciado'
    if (s.includes('beneficiário') || s.includes('beneficiario')) return 'Beneficiário'
    if (s.includes('operador')) return 'Operador da organização'
    if (s.includes('adm')) return 'Adm organização'
    return 'Cliente'
  }

  const normalizeCategoria = (val) => {
    if (!val) return 'Manutenção'
    const s = val.toString().trim().toLowerCase()
    if (s.includes('abastecimento')) return 'Abastecimento'
    if (s.includes('manutenção') || s.includes('manutencao')) return 'Manutenção'
    if (s.includes('telemetria')) return 'Telemetria'
    if (s.includes('beneficio') || s.includes('benefício')) return 'Beneficios'
    if (s.includes('patrimonio') || s.includes('patrimônio')) return 'Patrimonio'
    if (s.includes('educação') || s.includes('educacao')) return 'Educação'
    if (s.includes('saúde') || s.includes('saude')) return 'Saúde'
    return 'Manutenção'
  }

  const normalizeEstado = (val) => {
    if (!val) return 'A iniciar'
    const s = val.toString().trim().toLowerCase()
    if (s.includes('concluído') || s.includes('concluido') || s.includes('pronto')) return 'Pronto'
    if (s.includes('desenvolvimento')) return 'Em Desenvolvimento'
    if (s.includes('revisão') || s.includes('revisao')) return 'Em revisão'
    if (s.includes('validação') || s.includes('validacao')) return 'Em validação'
    if (s.includes('priorizado')) return 'Priorizado'
    if (s.includes('priorizar')) return 'A priorizar'
    return 'A iniciar'
  }

  const handleImport = () => {
    if (!file) return
    if (!user || !user.id) {
      setResult({ success: 0, error: 'Sessão expirada. Realize o login novamente.' })
      return
    }

    setLoading(true)
    setResult(null)

    Papa.parse(file, {
      header: false,
      delimiter: ';', 
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        try {
          let rawRows = results.data

          if (!rawRows || rawRows.length === 0) {
            throw new Error('O arquivo selecionado está vazio.')
          }

          const rows = rawRows.map(row => {
            if (row.length === 1 && row[0]?.toString().includes(';')) {
              return row[0].toString().split(';')
            }
            return row
          })
          
          const headerRowIndex = rows.findIndex(row => 
            row.some(cell => cell && (
              cell.toString().includes('created_at') || 
              cell.toString().includes('customer_name')
            ))
          )

          if (headerRowIndex === -1) {
            throw new Error('Não foi possível mapear as colunas do arquivo. Certifique-se de usar o modelo padrão.')
          }

          const headers = rows[headerRowIndex].map(h => h ? h.toString().trim() : '')
          const dataRows = rows.slice(headerRowIndex + 1)

          const ticketsToInsert = dataRows
            .map(row => {
              const item = {}
              headers.forEach((header, index) => {
                if (header) item[header] = row[index]
              })
              return item
            })
            .filter(item => item.customer_name && item.customer_name.toString().trim() !== '')
            .map((item) => {
              const cliente = item.customer_name.toString().trim()
              const descricao = item.Description || 'Sem descrição informada.'
              const rawTipo = item.tipo_chamado || 'Bug'
              
              const tituloCortado = descricao.length > 55 ? `${descricao.substring(0, 55)}...` : descricao
              const titleFinal = tituloCortado.length < 5 ? `Chamado [${cliente}]` : tituloCortado

              return {
                title: titleFinal,
                description: descricao,
                customer_name: cliente,
                customer_email: '',
                customer_phone: '',
                priority: 'MEDIA',
                solicitante: item.tipo_perfil || 'Solicitante 1',
                workflow: 'Engenharia',
                
                estado: normalizeEstado(item.workflow_status),
                tipo_chamado: normalizeTipoChamado(rawTipo),
                aplicacao: normalizeAplicacao(item.Aplicacao),
                tipo_perfil: normalizeTipoPerfil(item.tipo_perfil),
                categoria: normalizeCategoria(item.categoria),
                tipo_ticket: normalizeTipoChamado(rawTipo) === 'Bug' ? 'BUG' : 'FEATURE',
                
                created_at: parseCSVDate(item.created_at),
                created_by: user.id
              }
            })

          if (ticketsToInsert.length === 0) {
            throw new Error('Nenhum registro válido em conformidade foi extraído do arquivo.')
          }

          await ticketService.importTickets(ticketsToInsert)
          setResult({ success: ticketsToInsert.length })
        } catch (err) {
          console.error('Erro na esteira de importação:', err)
          setResult({ success: 0, error: err.message || 'Falha técnica ao mapear registros.' })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link to="/chamados" className="text-gray-500 hover:text-gray-700 transition flex items-center gap-1 text-sm font-medium">
          <ArrowLeftIcon className="w-4 h-4" /> Voltar ao Painel
        </Link>
      </div>

      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Carga Histórica de Chamados</h1>
          <p className="text-sm text-gray-500">Esteira inteligente com tratamento cronológico e auto-ajuste de Enums.</p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl border border-gray-200 border-dashed text-center shadow-xs">
          <DocumentTextIcon className="w-12 h-12 text-blue-500 mx-auto mb-4 bg-blue-50 p-2.5 rounded-xl" />
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer"
          />
          <p className="mt-4 text-xs text-gray-400">
            Arraste ou selecione o arquivo <code>.csv</code> com cabeçalhos sanitizados.
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <ArrowUpTrayIcon className="w-5 h-5" />
          {loading ? 'Processando Lote de Registros...' : 'Iniciar Carga de Histórico'}
        </button>

        {result?.success > 0 && (
          <div className="mt-5 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center gap-3 text-sm">
            <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <span className="font-bold">Importação Concluída com Sucesso!</span>
              <p className="text-xs text-green-600 mt-0.5">Foram consolidados <span className="font-bold">{result.success}</span> chamados com suas respectivas linhas do tempo e meses preservados.</p>
            </div>
          </div>
        )}
        
        {result?.error && (
          <div className="mt-5 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-3 text-sm">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Rejeição da Esteira de Dados:</span>
              <p className="text-xs text-red-600 mt-0.5">{result.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportPage;