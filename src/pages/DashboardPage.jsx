import { useState, useEffect, useMemo } from 'react'
import { ticketService } from '../services/ticketService'
import { useTheme } from '../context/ThemeContext'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { 
  ChartBarIcon, PresentationChartLineIcon, 
  ClockIcon, FaceSmileIcon, CheckBadgeIcon, BoltIcon,
  UsersIcon, UserGroupIcon, CalendarDaysIcon,
  FunnelIcon, TagIcon, BriefcaseIcon, QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { subDays, isAfter, format, parse } from 'date-fns'

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

export function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState('30') 

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

  // ==========================================
  // 🚀 NOVA LÓGICA: DATA DE CORTE E SLA
  // ==========================================
  const DATA_CORTE_SLA = new Date('2023-01-01T00:00:00') 

  const calcularSLA = (campo) => {
    const ticketsValidosParaSla = ticketsFiltrados.filter(t => {
      if (!t.created_at) return false
      return isAfter(new Date(t.created_at), DATA_CORTE_SLA)
    })

    const validos = ticketsValidosParaSla.filter(t => t[campo] != null && t[campo] > 0)
    
    if (validos.length === 0) return { texto: '-', raw: 0 }
    
    const soma = validos.reduce((acc, t) => acc + Number(t[campo]), 0)
    const mediaMinutos = Math.round(soma / validos.length)
    
    if (mediaMinutos < 60) return { texto: `${mediaMinutos}m`, raw: mediaMinutos }
    const horas = Math.floor(mediaMinutos / 60)
    const minutosRestantes = mediaMinutos % 60
    return { texto: `${horas}h ${minutosRestantes}m`, raw: mediaMinutos }
  }

  const stats = useMemo(() => {
    const total = ticketsFiltrados.length
    const abertos = ticketsFiltrados.filter(t => !['RESOLVIDO', 'FECHADO'].includes(t?.status)).length
    const finalizados = ticketsFiltrados.filter(t => ['RESOLVIDO', 'FECHADO'].includes(t?.status)).length
    
    const ticketsComNps = ticketsFiltrados.filter(t => t?.nps_score !== null && t?.nps_score !== undefined)
    const npsMedio = ticketsComNps.length > 0
      ? Number((ticketsComNps.reduce((acc, curr) => acc + Number(curr.nps_score), 0) / ticketsComNps.length).toFixed(1))
      : 0

    const tma = calcularSLA('resolution_time_minutes')
    const tmr = calcularSLA('response_time_minutes')

    return { total, abertos, finalizados, npsMedio, tma, tmr }
  }, [ticketsFiltrados])


  const getCorTmr = (minutos) => {
    if (!minutos || minutos === 0) return isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    if (minutos <= 30) return isDark ? 'bg-green-950/40 border-green-900/50' : 'bg-green-50 border-green-200'
    if (minutos <= 45) return isDark ? 'bg-yellow-950/40 border-yellow-900/50' : 'bg-yellow-50 border-yellow-200'
    return isDark ? 'bg-red-950/40 border-red-900/50' : 'bg-red-50 border-red-200'
  }

  const getCorTma = (minutos) => {
    if (!minutos || minutos === 0) return isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    if (minutos <= 120) return isDark ? 'bg-green-950/40 border-green-900/50' : 'bg-green-50 border-green-200' 
    if (minutos <= 180) return isDark ? 'bg-yellow-950/40 border-yellow-900/50' : 'bg-yellow-50 border-yellow-200' 
    return isDark ? 'bg-red-950/40 border-red-900/50' : 'bg-red-50 border-red-200'
  }

  const getCorNps = (nps) => {
    // Se não tiver avaliação ainda, fica neutro
    if (!nps || nps === 0) return isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    
    // Notas 9 e 10: Promotores (Verde)
    if (nps >= 9) return isDark ? 'bg-green-950/40 border-green-900/50' : 'bg-green-50 border-green-200'
    
    // Notas 7 e 8: Neutros (Amarelo)
    if (nps >= 7) return isDark ? 'bg-yellow-950/40 border-yellow-900/50' : 'bg-yellow-50 border-yellow-200'
    
    // Notas 0 a 6: Detratores (Vermelho)
    return isDark ? 'bg-red-950/40 border-red-900/50' : 'bg-red-50 border-red-200'
  }

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

  const dadosStatus = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const status = t?.status || 'Sem Status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem).map(key => ({ name: key, value: contagem[key] }))
  }, [ticketsFiltrados])

  const dadosTipoChamado = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      let tipo = t?.tipo_chamado || 'Não especificado'
      tipo = tipo.trim()

      const tipoLower = tipo.toLowerCase()
      if (tipoLower === 'errooperacional' || tipoLower === 'erro_operacional' || tipoLower === 'erro operacional') {
        tipo = 'Erro Operacional'
      } else if (tipoLower === 'bug') {
        tipo = 'Bug'
      } else if (tipoLower === 'aprimoramento') {
        tipo = 'Aprimoramento'
      } else if (tipoLower === 'nova funcionalidade') {
        tipo = 'Nova Funcionalidade'
      } else if (tipoLower === 'dúvida' || tipoLower === 'duvida') {
        tipo = 'Dúvida'
      } else {
        tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()
      }

      acc[tipo] = (acc[tipo] || 0) + 1
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
      const perfil = t?.tipo_perfil || 'Não informado'
      acc[perfil] = (acc[perfil] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) 
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
      let cat = t?.categoria || 'Sem categoria'
      cat = cat.trim()

      const catLower = cat.toLowerCase()
      if (catLower === 'abastecimento') {
        cat = 'Abastecimento'
      } else if (catLower === 'manutenção' || catLower === 'manutencao') {
        cat = 'Manutenção'
      } else if (catLower === 'patrimônio' || catLower === 'patrimonio') {
        cat = 'Patrimônio'
      } else if (catLower === 'telemetria') {
        cat = 'Telemetria'
      } else if (catLower === 'beneficios' || catLower === 'benefícios') {
        cat = 'Beneficios'
      } else if (catLower === 'suporte interno') {
        cat = 'Suporte Interno'
      } else {
        cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
      }

      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total)
  }, [ticketsFiltrados])

  const dadosClientes = useMemo(() => {
    const contagem = ticketsFiltrados.reduce((acc, t) => {
      const cliente = t?.customer_name || 'Não informado'
      acc[cliente] = (acc[cliente] || 0) + 1
      return acc
    }, {})
    return Object.keys(contagem)
      .map(key => ({ name: key, total: contagem[key] }))
      .sort((a, b) => b.total - a.total) 
      .slice(0, 5) 
  }, [ticketsFiltrados])

  const corTextoEixo = isDark ? '#9ca3af' : '#64748b'
  const corLinhaEixo = isDark ? '#374151' : '#cbd5e1'
  const corCardTooltip = isDark ? '#1f2937' : '#ffffff'
  const corBordaTooltip = isDark ? '#374151' : '#e2e8f0'

  if (loading) {
    return (
      <div className={`p-16 text-center font-medium transition-colors duration-300 min-h-screen flex items-center justify-center ${
        isDark ? 'bg-[#0b0f19] text-gray-400' : 'bg-gray-50 text-gray-500'
      }`}>
        Analisando dados do sistema...
      </div>
    )
  }
  
  if (erro) return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className={`p-6 rounded-xl border transition-colors ${isDark ? 'bg-red-950/40 text-red-400 border-red-900/60' : 'bg-red-50 text-red-700 border-red-200'}`}>
        <h2 className="text-lg font-bold mb-2">Erro de Carregamento</h2>
        <p>{erro}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard de Atendimento</h1>
          <p className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Visão geral dos seus indicadores de suporte.</p>
        </div>
        
        <div className={`p-1 rounded-lg border inline-flex shadow-sm transition-colors ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
          <button onClick={() => setPeriodo('7')} className={`px-4 py-1.5 text-sm rounded-md transition ${periodo === '7' ? (isDark ? 'bg-blue-950 text-blue-400 font-medium' : 'bg-blue-50 text-blue-700 font-medium') : (isDark ? 'text-gray-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-50')}`}>7 dias</button>
          <button onClick={() => setPeriodo('30')} className={`px-4 py-1.5 text-sm rounded-md transition ${periodo === '30' ? (isDark ? 'bg-blue-950 text-blue-400 font-medium' : 'bg-blue-50 text-blue-700 font-medium') : (isDark ? 'text-gray-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-50')}`}>30 dias</button>
          <button onClick={() => setPeriodo('all')} className={`px-4 py-1.5 text-sm rounded-md transition ${periodo === 'all' ? (isDark ? 'bg-blue-950 text-blue-400 font-medium' : 'bg-blue-50 text-blue-700 font-medium') : (isDark ? 'text-gray-400 hover:bg-gray-900' : 'text-gray-600 hover:bg-gray-50')}`}>Tudo</button>
        </div>
      </div>

      {/* 🚀 AQUI ESTÁ A CORREÇÃO: CARDS DE KPIs SEPARADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* CARDS NEUTROS (Volume) */}
        {[
          { icon: PresentationChartLineIcon, label: 'Total Abertos', value: stats.total, style: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200', iconColor: 'text-blue-500' },
          { icon: ClockIcon, label: 'Pendentes', value: stats.abertos, style: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200', iconColor: 'text-orange-500' },
          { icon: CheckBadgeIcon, label: 'Finalizados', value: stats.finalizados, style: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200', iconColor: 'text-emerald-500' },
        ].map((card, idx) => (
          <div key={`neutral-${idx}`} className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${card.style}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${card.iconColor}`}><card.icon className="w-5 h-5" /></div>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</h3>
          </div>
        ))}

        {/* CARDS COM INTELIGÊNCIA OKR (TMR, TMA e NPS) */}
        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${getCorTmr(stats.tmr.raw)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20 text-purple-600 dark:text-purple-400"><BoltIcon className="w-5 h-5" /></div>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Média Resposta</p>
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.tmr.texto}</h3>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${getCorTma(stats.tma.raw)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20 text-indigo-600 dark:text-indigo-400"><ClockIcon className="w-5 h-5" /></div>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Média Atendimento</p>
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.tma.texto}</h3>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors duration-300 ${getCorNps(stats.npsMedio)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20 text-pink-600 dark:text-pink-400"><FaceSmileIcon className="w-5 h-5" /></div>
              <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Média NPS</p>
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.npsMedio > 0 ? stats.npsMedio : '-'} <span className="text-sm font-normal opacity-60">/ 10</span>
            </h3>
        </div>
      </div>

      <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[400px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-6">
          <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Evolução Mensal de Aberturas</h3>
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
                <XAxis dataKey="mesAno" tick={{fontSize: 12, fill: corTextoEixo}} stroke={corLinhaEixo} />
                <YAxis tick={{fontSize: 12, fill: corTextoEixo}} stroke={corLinhaEixo} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderRadius: '8px', border: `1px solid ${corBordaTooltip}`, color: isDark ? '#fff' : '#000' }} />
                <Area type="monotone" dataKey="Chamados Abertos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#corChamados)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {ticketsFiltrados.length === 0 ? (
        <div className={`p-12 text-center rounded-xl border transition-colors ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          Nenhum chamado encontrado para os filtros operacionais deste período.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><ChartBarIcon className="w-4 h-4 text-gray-400" /> Distribuição de Status</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosStatus} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {dadosStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: 'transparent'}} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: corTextoEixo }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400" /> Distribuição por Tipo
            </h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosTipoChamado} innerRadius={0} outerRadius={80} dataKey="value">
                    {dadosTipoChamado.map((entry, index) => <Cell key={`cell-tipo-${index}`} fill={CORES[(index + 2) % CORES.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: 'transparent'}} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><ChartBarIcon className="w-4 h-4 text-gray-400" /> Gargalos de Engenharia</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEstadoDev} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" tick={{fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
                  <Bar dataKey="chamados" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><ChartBarIcon className="w-4 h-4 text-gray-400" /> Chamados por Aplicação</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAplicacao} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><FunnelIcon className="w-4 h-4 text-gray-400" /> Distribuição por Workflow</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosWorkflow} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" tick={{fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
                  <Bar dataKey="total" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><TagIcon className="w-4 h-4 text-gray-400" /> Volume por Categoria</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosCategoria} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
                  <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <BriefcaseIcon className="w-4 h-4 text-gray-400" /> Top 5 Clientes (Volume)
            </h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosClientes} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" tick={{fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
                  <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] lg:col-span-1 xl:col-span-2 transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <UserGroupIcon className="w-4 h-4 text-gray-400" /> Tipos de Perfil (Volume)
            </h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTipoPerfil} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <XAxis type="number" tick={{fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
                  <Bar dataKey="total" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col h-[350px] transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-gray-200' : 'text-gray-800'}`}><UsersIcon className="w-4 h-4 text-gray-400" /> Top 5 Agentes (Abertura)</h3>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAgentes} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <YAxis tick={{fontSize: 11, fill: corTextoEixo}} stroke={corLinhaEixo} />
                  <Tooltip contentStyle={{ backgroundColor: corCardTooltip, borderColor: corBordaTooltip }} cursor={{fill: isDark ? '#1f2937' : '#f8fafc'}} />
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