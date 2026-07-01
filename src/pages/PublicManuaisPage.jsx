import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  BookOpenIcon, 
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

// 🚀 AQUI FICA O ASSISTENTE PARA AJUDAR O CLIENTE LENDO OS MANUAIS
import { ChatWidget } from '../components/ChatWidget'

export function PublicManuaisPage() {
  const [manuais, setManuais] = useState([])
  const [loading, setLoading] = useState(true)
  const [manualSelecionado, setManualSelecionado] = useState(null)

  useEffect(() => {
    const fetchManuais = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('manuais')
          .select('id, titulo, conteudo, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        setManuais(data || [])
      } catch (error) {
        console.error('Erro ao buscar manuais:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchManuais()
  }, [])

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto bg-gray-50/50 min-h-screen relative">
      
      {/* Botão Voltar */}
      <div className="mb-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar para o Login
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Central de Ajuda</h1>
        <p className="text-sm text-gray-500 mt-1">Consulte nossos manuais ou tire suas dúvidas com nosso Assistente Inteligente no canto da tela.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-400 font-medium">
          Carregando base de conhecimento...
        </div>
      ) : manuais.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-500 flex flex-col items-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p>Nenhum manual disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manuais.map((manual) => (
            <div key={manual.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600 w-max mb-3">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{manual.titulo}</h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{manual.conteudo}</p>
              
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setManualSelecionado(manual)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <EyeIcon className="w-4 h-4" />
                  Ler manual completo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Leitura */}
      {manualSelecionado && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 pr-4">{manualSelecionado.titulo}</h2>
              <button 
                onClick={() => setManualSelecionado(null)}
                className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {manualSelecionado.conteudo}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 WIDGET PÚBLICO */}
      <ChatWidget />
    </div>
  )
}