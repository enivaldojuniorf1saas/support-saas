import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import { UserPlusIcon, UsersIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

export function UsersPage() {
  const { isGestor } = useAuthContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState('')
  
  // Estado para controlar se estamos editando um usuário existente
  const [editingUser, setEditingUser] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()

  // 1. READ — Buscar usuários do banco
  const fetchUsers = async () => {
    setLoading(true)
    setSubmitError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error
      if (data) setUsers(data)
    } catch (err) {
      setSubmitError(err.message || 'Erro ao carregar a lista de usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 2. CREATE ou UPDATE — Salvar os dados do formulário
  const onSubmit = async (values) => {
    setSubmitError('')
    try {
      if (editingUser) {
        // Modo Edição (UPDATE)
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            role: values.role,
            email: values.email // Caso sua tabela tenha a coluna email
          })
          .eq('id', editingUser.id)

        if (error) throw error
        setEditingUser(null)
      } else {
        // Modo Cadastro (CREATE)
        const { error } = await supabase
          .from('profiles')
          .insert([{
            full_name: values.full_name,
            role: values.role,
            email: values.email
          }])

        if (error) throw error
      }

      reset()
      fetchUsers() // Recarrega a tabela com os dados atualizados
    } catch (err) {
      setSubmitError(err.message || 'Erro ao salvar os dados do usuário.')
    }
  }

  // Ativar o modo de edição e carregar os dados no formulário
  const startEdit = (user) => {
    setEditingUser(user)
    setValue('full_name', user.full_name)
    setValue('role', user.role || 'agente')
    setValue('email', user.email || '')
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Sobe a tela até o formulário
  }

  // Cancelar a edição atual
  const cancelEdit = () => {
    setEditingUser(null)
    reset()
  }

  // 3. DELETE — Excluir um usuário do sistema
  const handleDelete = async (userId, userName) => {
    const confirmar = window.confirm(`Tem certeza que deseja remover o usuário "${userName}" do sistema?`)
    if (!confirmar) return

    setSubmitError('')
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      fetchUsers() // Atualiza a lista após deletar
    } catch (err) {
      setSubmitError(err.message || 'Erro ao tentar excluir o usuário.')
    }
  }

  if (!isGestor) return <div className="p-8 text-center text-red-500 font-medium">Acesso não autorizado. Apenas gestores podem gerenciar a equipe.</div>

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <UsersIcon className="w-8 h-8 text-gray-900" />
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
      </div>

      {/* Caixa de Erro */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Erro na operação:</strong> {submitError}
        </div>
      )}

      {/* FORMULÁRIO (Criação ou Edição Dinâmica) */}
      <div className={`p-6 rounded-xl border transition-all duration-300 shadow-sm mb-8 ${editingUser ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-gray-200'}`}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingUser ? `Editar Usuário: ${editingUser.full_name}` : 'Cadastrar Novo Usuário'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input 
              required 
              {...register('full_name')} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Ex: Carlos Eduardo" 
            />
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              {...register('email')} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="carlos@empresa.com" 
            />
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
            <select 
              {...register('role')} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="agente">Agente</option>
              <option value="gestor">Gestor</option>
            </select>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 ${editingUser ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {editingUser ? <CheckIcon className="w-4 h-4"/> : <UserPlusIcon className="w-4 h-4" />}
              {editingUser ? 'Atualizar' : 'Cadastrar'}
            </button>

            {editingUser && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="flex items-center justify-center gap-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium transition"
              >
                <XMarkIcon className="w-4 h-4"/>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABELA DE LISTAGEM */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Carregando membros da equipe...</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-gray-400 italic">Nenhum usuário cadastrado no sistema.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Nome</th>
                <th className="px-6 py-3 font-medium text-gray-500">E-mail</th>
                <th className="px-6 py-3 font-medium text-gray-500">Perfil</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{u.full_name || 'Sem nome'}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.role === 'gestor' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {u.role || 'agente'}
                    </span>
                  </td>
                  {/* Botões de Ação na Tabela */}
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => startEdit(u)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar Usuário"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id, u.full_name)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir Usuário"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}