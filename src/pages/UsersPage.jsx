import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import { UserPlusIcon, UsersIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, KeyIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function UsersPage() {
  const { isGestor } = useAuthContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState('')
  
  const [editingUser, setEditingUser] = useState(null)

  // Estados do painel de senha inline
  const [passwordUser, setPasswordUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showFormPassword, setShowFormPassword] = useState(false) // Toggle de visualização no form principal
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      role: 'agente',
      password: 'suporte@123' // Valor padrão visível e intuitivo para o UX
    }
  })

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

  const onSubmit = async (values) => {
    setSubmitError('')
    try {
      if (editingUser) {
        // Modo Edição (UPDATE)
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            role: values.role, // O banco aplicará o cast se a RPC ou trigger tratar, ou direto se mapeado
            email: values.email
          })
          .eq('id', editingUser.id)

        if (error) throw error
        setEditingUser(null)
      } else {
        // MODO CADASTRO (CREATE VIA RPC COM SENHA TRANSPARENTE)
        const { error } = await supabase.rpc('admin_create_user', {
          p_email: values.email,
          p_password: values.password || 'suporte@123',
          p_full_name: values.full_name,
          p_role: values.role
        })

        if (error) throw error
      }

      // Mantém o padrão limpo do formulário após envio bem-sucedido
      reset({
        full_name: '',
        email: '',
        role: 'agente',
        password: 'suporte@123'
      })
      fetchUsers()
    } catch (err) {
      console.error(err)
      setSubmitError(err.message || 'Erro ao salvar os dados do usuário.')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('A senha deve conter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.rpc('admin_update_user_password', {
        user_id: passwordUser.id,
        new_password: newPassword
      })

      if (error) throw error

      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      setPasswordError(err.message || 'Erro ao atualizar senha.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const startEdit = (user) => {
    setPasswordUser(null)
    setEditingUser(user)
    setValue('full_name', user.full_name)
    setValue('role', user.role || 'agente')
    setValue('email', user.email || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startPasswordEdit = (user) => {
    setEditingUser(null)
    setPasswordUser(user)
    setPasswordError('')
    setPasswordSuccess(false)
    setNewPassword('')
    setConfirmPassword('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    reset({
      full_name: '',
      email: '',
      role: 'agente',
      password: 'suporte@123'
    })
  }

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
      fetchUsers()
    } catch (err) {
      setSubmitError(err.message || 'Erro ao tentar excluir o usuário.')
    }
  }

  if (!isGestor) return <div className="p-8 text-center text-red-500 font-medium">Acesso não autorizado.</div>

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      
      {/* HEADER DA TELA */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-gray-900 text-white rounded-xl shadow-sm">
          <UsersIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-gray-500">Controle o acesso e permissões da equipe interna do sistema</p>
        </div>
      </div>

      {/* COMPONENTE DE NOTIFICAÇÃO DE ERRO */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm shadow-sm animate-fade-in">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Não foi possível processar a requisição:</span>
            <p className="text-xs text-red-600 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* FORMULÁRIO PRINCIPAL COM EXCELENTE EXPERIÊNCIA DE USUÁRIO (UI/UX) */}
      {!passwordUser && (
        <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm mb-8 ${editingUser ? 'bg-orange-50/40 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {editingUser ? `Editar Perfil: ${editingUser.full_name}` : 'Cadastrar Novo Usuário'}
            </h2>
            <p className="text-xs text-gray-400">Preencha os dados e configure as credenciais iniciais da conta</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nome Completo *</label>
              <input required {...register('full_name')} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition shadow-sm" placeholder="Ex: Enivaldo Junior" />
            </div>
            
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">E-mail de Acesso *</label>
              <input type="email" required {...register('email')} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition shadow-sm" placeholder="nome@f1suporte.com.br" />
            </div>
            
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Perfil de Acesso</label>
              <select {...register('role')} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition shadow-sm">
                <option value="agente">Agente (Operação)</option>
                <option value="gestor">Gestor (Administrador)</option>
              </select>
            </div>

            {/* SEÇÃO DA SENHA VISÍVEL: REMOVE A INSEGURANÇA DO GESTOR */}
            <div className="w-full relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                {editingUser ? 'Senha (Mudar abaixo)' : 'Senha Provisória *'}
              </label>
              <input 
                type={showFormPassword ? 'text' : 'password'} 
                disabled={!!editingUser}
                {...register('password')} 
                className="w-full border border-gray-300 rounded-xl pl-3 pr-10 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition shadow-sm" 
              />
              {!editingUser && (
                <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition">
                  {showFormPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* BOTÕES ALINHADOS */}
            <div className="md:col-span-4 flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
              {editingUser && (
                <button type="button" onClick={cancelEdit} className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl font-semibold text-sm transition shadow-sm">
                  <XMarkIcon className="w-4 h-4"/> Cancelar
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className={`flex items-center gap-2 text-white px-6 py-2 rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-50 ${editingUser ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingUser ? <CheckIcon className="w-4 h-4"/> : <UserPlusIcon className="w-4 h-4" />}
                {editingUser ? 'Salvar Alterações' : 'Concluir Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PAINEL DE ALTERAÇÃO DE SENHA INLINE */}
      {passwordUser && (
        <div className="p-6 rounded-2xl border border-green-200 bg-green-50/30 shadow-sm mb-8 relative animate-fade-in">
          <button onClick={() => setPasswordUser(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition">
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <KeyIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Redefinir Credencial: <span className="text-green-700">{passwordUser.full_name}</span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">Insira e confirme uma nova chave de segurança para este colaborador</p>

          {passwordSuccess ? (
            <div className="flex items-center gap-3 p-4 bg-white border border-green-200 rounded-xl max-w-md shadow-sm">
              <CheckCircleIcon className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">Alteração Confirmada!</p>
                <p className="text-xs text-gray-500">O colaborador já pode utilizar a nova senha provisória.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col md:flex-row gap-4 items-end max-w-3xl">
              {passwordError && (
                <div className="w-full md:w-auto p-2 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                  {passwordError}
                </div>
              )}

              <div className="flex-1 w-full relative">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Nova Senha</label>
                <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-3 pr-10 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Confirmar Senha</label>
                <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" placeholder="Repita a senha" />
              </div>

              <div className="w-full md:w-auto">
                <button type="submit" disabled={passwordLoading} className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-50">
                  {passwordLoading ? 'Salvando...' : 'Confirmar Nova Senha'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TABELA DE LISTAGEM MINIMALISTA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">Carregando membros da equipe...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400 italic text-sm">Nenhum usuário cadastrado no painel.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/75 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-gray-400">Nome</th>
                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-gray-400">E-mail</th>
                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-gray-400">Perfil</th>
                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{u.full_name || 'Sem nome'}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{u.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${u.role === 'gestor' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {u.role || 'agente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <button onClick={() => startPasswordEdit(u)} className={`p-1.5 rounded-xl transition-all border ${passwordUser?.id === u.id ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white text-gray-400 border-gray-200 hover:text-green-600 hover:bg-green-50 hover:border-green-100'}`} title="Alterar Senha">
                      <KeyIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => startEdit(u)} className="p-1.5 bg-white text-gray-400 border border-gray-200 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 rounded-xl transition-all" title="Editar Usuário">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id, u.full_name)} className="p-1.5 bg-white text-gray-400 border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all" title="Excluir Usuário">
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