import { useState, useEffect, useMemo } from 'react'
import { ticketService } from '../services/ticketService'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { 
  ChartBarIcon, PresentationChartLineIcon, 
  ClockIcon, FaceSmileIcon, CheckBadgeIcon, BoltIcon,
  UsersIcon, UserGroupIcon, CalendarDaysIcon,
  FunnelIcon, TagIcon, BriefcaseIcon // <-- Ícone BriefcaseIcon adicionado aqui
} from '@heroicons/react/24/outline'
import { subDays, isAfter, format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

export function DashboardPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState('30') // '7', '30' ou 'all'

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setErro('')
      try {
        const res = await ticketService.list({ page: 1, pageSize: 1000 })
        setTickets(res?.data || []) 
      } catch (err) {
        console.error("Erro ao carregar Dashboard:", err)
        setErro(err.message || 'Falha ao buscar os dados do Supabase.')
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  // 1. Lógica de Filtragem de Tempo
  const ticketsFiltrados = useMemo(() => {
    if (!Array.isArray(tickets)) return []
    if (periodo === 'all') return tickets
    
    const dataLimite = subDays(new Date(), parseInt(periodo))
    
    return tickets.filter(t => {
      if (!t.created_at) return false
      try {
        return isAfter(new Date(t.created_at), dataLimite)
      } catch (e) {
        return false
      }
    })
  }, [tickets, periodo])

  // Função auxiliar para calcular médias de tempo
  const calcularMediaTempo = (campo) => {
    const validos = ticketsFiltrados.filter(t => t[campo] != null && t[campo] > 0)
    if (validos.length === 0) return '-'
    
    const soma = validos.reduce((acc, t) => acc + Number(t[campo]), 0)
    const mediaMinutos = Math.round(soma / validos.length)
    
    if (mediaMinutos < 60) return `${mediaMinutos}m`
    const horas = Math.floor(mediaMinutos / 60)
    const minutosRestantes = mediaMinutos % 60
    return `${horas}h ${minutosRestantes}m`
  }

  // 2. Cálculo dos Indicadores (KPIs)
  const stats = useMemo(() => {
    const total = ticketsFiltrados.length
    const abertos = ticketsFiltrados.filter(t => !['RESOLVIDO', 'FECHADO'].includes(t?.status)).length
    const finalizados = ticketsFiltrados.filter(t => ['RESOLVIDO', 'FECHADO'].includes(t?.status)).length
    
    const ticketsComNps = ticketsFiltrados.filter(t => t?.nps_score !== null && t?.nps_score !== undefined)
    const npsMedio = ticketsComNps.length > 0
      ? (ticketsComNps.reduce((acc, curr) => acc + Number(curr.nps_score), 0) / ticketsComNps.length).toFixed(1) 
      : '-'

    const tma = calcularMediaTempo('resolution_time_minutes')
    const tmr = calcularMediaTempo('response_time_minutes')

    return { total, abertos, finalizados, npsMedio, tma, tmr }
  }, [ticketsFiltrados])

  // ==========================================
  // GRÁFICO: EVOLUÇÃO TEMPORAL (MÊS/ANO)
  // ==========================================
  const dadosTemporais = useMemo(() => {
    if (!Array.isArray(tickets)) return []

    const contagemMesaAno = tickets.reduce((acc, t) => {
      if (!t.created_at) return acc
      try {
        const dataObj = new Date(t.created_at)
        const chaveMesAno = format(dataObj, 'MM/yyyy') 
        acc[chaveMesAno] = (acc[chaveMesAno] || 0) + 1
      } catch (e) {
      }
      return acc
    }, {})

    return Object.keys(contagemMesaAno)
      .map(chave => ({
        mesAno: chave,
        'Chamados Abertos': contagemMesaAno[chave]
      }))
      .sort((a, b) => {
        const dataA = parse(a.mesAno, 'MM/yyyy', new Date())
        const dataB = parse(b.mesAno, 'MM/yyyy', new Date())
        return dataA - dataB
      })
  }, [tickets])

  // 3. Preparação de Dados para os demais Gráficos
  const dadosStatus = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const status = t?.status || 'Sem Status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem).map(key => ({ name: key, value: contagem[key] }))
  }, [ticketsFiltrados])

  const dadosEstadoDev = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const estado = t?.estado || 'Sem estado'
      acc[estado] = (acc[estado] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, chamados: contagem[key] }))
      .sort((a, b) => b.chamados - a.chamados)
  }, [ticketsFiltrados])

  const dadosAplicacao = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const app = t?.aplicacao || 'Não informada'
      acc[app] = (acc[app] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem).map(key => ({ name: key, total: contagem[key] }))
  }, [ticketsFiltrados])

  const dadosTipoPerfil = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      // Aqui nós apontamos para a coluna correta no banco: tipo_perfil
      const perfil = t?.tipo_perfil || 'Não informado'
      acc[perfil] = (acc[perfil] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) // Pega os 5 maiores
  }, [ticketsFiltrados])

  const dadosAgentes = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const agente = t?.creator?.full_name || 'Sistema/Desconhecido'
      acc[agente] = (acc[agente] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [ticketsFiltrados])

  const dadosWorkflow = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const wf = t?.workflow || 'Não informado'
      acc[wf] = (acc[wf] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total)
  }, [ticketsFiltrados])

  const dadosCategoria = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const cat = t?.categoria || 'Sem categoria'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total)
  }, [ticketsFiltrados])

  // ==========================================
  // 🔥 NOVO: Preparação dos dados por CLIENTE
  // ==========================================
  const dadosClientes = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const cliente = t?.customer_name || 'Não informado'
      acc[cliente] = (acc[cliente] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total) // Ordena do cliente com mais chamados para o menor
      .slice(0, 5) // Exibe os 5 principais clientes com maior volume
  }, [ticketsFiltrados])

  if (loading) return <div className="p-16 text-center text-gray-500 font-medium">Analisando dados do sistema...</div>
  
  if (erro) return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
        <h2 className="text-lg font-bold mb-2">Erro de Carregamento</h2>
        <p>{erro}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Atendimento</h1>
          <p className="text-sm text-gray-500">Visão geral dos seus indicadores de suporte.</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
          <button onClick={() => setPeriodo('7')} className={`px-4 py-1.5 text-sm rounded-md transition ${periodo === '7' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>7 dias</button>
          <button onClick={() => setPeriodo('30')} className={`px-4 py-1.5 text-sm rounded-md transition ${periodo === '30' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>30 dias</button>
          <button onClick={() => setPeriodo('all')} className={`px-4 py-1.5 text-sm rounded-md transition ${periodo === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Tudo</button>
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PresentationChartLineIcon className="w-5 h-5" /></div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Abertos</p></div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ClockIcon className="w-5 h-5" /></div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendentes</p></div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.abertos}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckBadgeIcon className="w-5 h-5" /></div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Finalizados</p></div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.finalizados}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BoltIcon className="w-5 h-5" /></div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Média Resposta</p></div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.tmr}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ClockIcon className="w-5 h-5" /></div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Média Atendimento</p></div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.tma}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><FaceSmileIcon className="w-5 h-5" /></div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Média NPS</p></div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.npsMedio} <span className="text-sm text-gray-400 font-normal">/ 10</span></h3>
        </div>
      </div>

      {/* SEÇÃO DO GRÁFICO TEMPORAL PRINCIPAL */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center gap-2 mb-6">
          <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Evolução Mensal de Aberturas</h3>
            <p className="text-xs text-gray-400 font-normal normal-case">Histórico contínuo de chamados abertos agrupados por mês e ano.</p>
          </div>
        </div>
        <div className="flex-1 w-full min-h-[250px]">
          {dadosTemporais.length === 0 ? (
            <p className="text-center py-16 text-gray-400 italic">Sem histórico temporal para exibir.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosTemporais} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="corChamados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mesAno" tick={{fontSize: 12, fill: '#64748b'}} stroke="#cbd5e1" />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} stroke="#cbd5e1" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="Chamados Abertos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#corChamados)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid Secundário de Gráficos Operacionais */}
      {ticketsFiltrados.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-gray-500">
          Nenhum chamado encontrado para os filtros operacionais deste período.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><ChartBarIcon className="w-4 h-4 text-gray-400" /> Distribuição de Status</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosStatus} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {dadosStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
                  </Pie>
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><ChartBarIcon className="w-4 h-4 text-gray-400" /> Gargalos de Engenharia</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEstadoDev} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="chamados" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><ChartBarIcon className="w-4 h-4 text-gray-400" /> Chamados por Aplicação</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAplicacao} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><FunnelIcon className="w-4 h-4 text-gray-400" /> Distribuição por Workflow</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosWorkflow} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><TagIcon className="w-4 h-4 text-gray-400" /> Volume por Categoria</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosCategoria} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 🔥 NOVO GRÁFICO: Top 5 Clientes por Volume */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <BriefcaseIcon className="w-4 h-4 text-gray-400" /> Top 5 Clientes (Volume)
            </h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosClientes} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px] lg:col-span-1 xl:col-span-2">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <UserGroupIcon className="w-4 h-4 text-gray-400" /> Tipos de Perfil (Volume)
            </h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTipoPerfil} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  {/* Mantive a sua cor rosa original do gráfico */}
                  <Bar dataKey="total" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide"><UsersIcon className="w-4 h-4 text-gray-400" /> Top 5 Agentes (Abertura)</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAgentes} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}