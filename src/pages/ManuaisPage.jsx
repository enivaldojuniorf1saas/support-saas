import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  BookOpenIcon, 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon // 🚀 Ícone de leitura adicionado
} from '@heroicons/react/24/outline'

export function ManuaisPage() {
  const [manuais, setManuais] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Controle de Modais
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [manualSelecionado, setManualSelecionado] = useState(null) // 🚀 Estado para ler o manual
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados do formulário
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')

  // 🔄 Carrega os manuais do banco de dados
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

  useEffect(() => {
    fetchManuais()
  }, [])

  // 💾 Salva um novo manual e gera o Embedding (Vetor) da IA
  const handleSave = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !conteudo.trim()) return

    try {
      setIsSaving(true)
      
      // 1. Salva o texto no banco e já pede para retornar o ID dele (.select().single())
      const { data: novoManual, error } = await supabase
        .from('manuais')
        .insert([{ titulo, conteudo }])
        .select()
        .single()

      if (error) throw error

      // 🚀 2. Chama a nuvem para gerar a Memória da IA!
      await supabase.functions.invoke('generate-embedding', {
        body: { 
          record_id: novoManual.id, 
          texto: `Título: ${titulo}\nConteúdo: ${conteudo}` 
        }
      })

      // Limpa o formulário e atualiza a lista
      setTitulo('')
      setConteudo('')
      setIsModalOpen(false)
      fetchManuais()
    } catch (error) {
      console.error('Erro ao salvar manual:', error)
      alert('Ocorreu um erro ao salvar o manual e gerar o aprendizado da IA.')
    } finally {
      setIsSaving(false)
    }
  }

  // 🗑️ Exclui um manual
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este manual? A IA deixará de ter acesso a esta informação.')) return

    try {
      const { error } = await supabase
        .from('manuais')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchManuais()
    } catch (error) {
      console.error('Erro ao excluir manual:', error)
    }
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto bg-gray-50/50 min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestão de Manuais</h1>
            {!loading && (
              <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold shadow-sm">
                {manuais.length} {manuais.length === 1 ? 'documento' : 'documentos'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Gerencie os manuais e tutoriais que alimentam a Inteligência Artificial do F1SaaS.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
        >
          <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          Novo Manual
        </button>
      </div>

      {/* Lista de Manuais */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-400 font-medium">
          Carregando base de conhecimento...
        </div>
      ) : manuais.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-sm text-gray-500 shadow-xs flex flex-col items-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p>Nenhum manual cadastrado ainda.</p>
          <p className="text-xs mt-1 text-gray-400">Adicione o primeiro documento para a IA começar a aprender.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manuais.map((manual) => (
            <div key={manual.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => handleDelete(manual.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Manual"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{manual.titulo}</h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                {manual.conteudo}
              </p>
              
              {/* 🚀 Botão para abrir o modal de Leitura */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {new Date(manual.created_at).toLocaleDateString('pt-BR')}
                </div>
                <button 
                  onClick={() => setManualSelecionado(manual)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <EyeIcon className="w-4 h-4" />
                  Ler manual
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📖 MODAL DE LEITURA */}
      {manualSelecionado && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 pr-4">{manualSelecionado.titulo}</h2>
              <button 
                onClick={() => setManualSelecionado(null)}
                className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer shrink-0"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {manualSelecionado.conteudo}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setManualSelecionado(null)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL DE NOVO MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Cadastrar Novo Manual</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Título do Manual
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Como redefinir a senha do usuário"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 transition"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Conteúdo (Regras, passos e explicações)
                </label>
                <textarea
                  required
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Descreva detalhadamente as instruções. A Inteligência Artificial lerá este texto para responder aos clientes..."
                  className="w-full flex-1 min-h-[250px] border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 transition resize-none"
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !titulo.trim() || !conteudo.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? 'Salvando...' : 'Salvar Manual'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}