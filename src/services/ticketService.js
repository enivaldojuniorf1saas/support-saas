import { supabase } from '../lib/supabase'


export const ticketService = {
  async create(payload) {
    if (!payload?.title) throw new Error('Título é obrigatório')
    if (!payload?.customer_name) throw new Error('Nome do cliente é obrigatório')

    const { data: lastTickets, error: fetchError } = await supabase
      .from('tickets')
      .select('ticket_number')
      .order('created_at', { ascending: false })
      .limit(1)

    let nextNumber = 1 

    if (lastTickets && lastTickets.length > 0 && lastTickets[0].ticket_number) {
      const lastNum = parseInt(String(lastTickets[0].ticket_number).replace(/\D/g, '')) || 0
      nextNumber = lastNum + 1
    }

    

    payload.ticket_number = nextNumber.toString()

    const { data, error } = await supabase
      .from('tickets')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('tickets')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 🔄 ATUALIZADO: Motor de busca em formato "Funil" com o NOVO FILTRO DE PRIORIDADE
  async list({ status, type, priority, startDate, endDate, assignedTo, createdBy, search = '', page = 1, pageSize = 10 } = {}) {
    let query = supabase
      .from('tickets')
      .select(`
        id, ticket_number, title, status, priority, customer_name, customer_email,
        nps_score, response_time_minutes, resolution_time_minutes, created_at, updated_at,
        estado, workflow, solicitante, tipo_chamado, aplicacao, tipo_ticket,
        tipo_perfil, categoria,
        creator:profiles!created_by(full_name),
        assignee:profiles!assigned_to(full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false }) 

    if (search) {
      const cleanSearch = search.replace('#', '').trim()
      const isNumeric = /^\d+$/.test(cleanSearch)
      
      if (isNumeric) {
        query = query.ilike('ticket_number::text', `%${cleanSearch}%`)
      } else {
        query = query.or(`title.ilike.%${cleanSearch}%,customer_name.ilike.%${cleanSearch}%`)
      }
    }

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('tipo_chamado', type)
    
    // 🚀 FILTRO: Prioridade
    // ⚠️ O dropdown da tela envia o LABEL (ex: "Urgente", "Média"), mas o banco
    // guarda o valor em outro formato (ex: "CRITICA", "MEDIA"). Por isso é
    // necessário traduzir o label para o valor real da coluna antes do .eq,
    // senão o filtro nunca casa com nenhuma linha.
    const PRIORITY_LABEL_TO_DB = {
      'Urgente': 'CRITICA',
      'Alta': 'ALTA',
      'Média': 'MEDIA',
      'Media': 'MEDIA',
      'Baixa': 'BAIXA',
    }

    if (priority) {
      if (priority === 'Nenhuma') {
        // Se o usuário quiser ver os sem prioridade, buscamos os vazios, nulos ou que ficaram marcados como "Selecionar" no form
        query = query.or('priority.is.null,priority.eq."",priority.eq."Selecionar"')
      } else {
        const dbValue = PRIORITY_LABEL_TO_DB[priority] || priority
        query = query.eq('priority', dbValue)
      }
    }
    
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`).toISOString()
      const end = new Date(`${endDate}T23:59:59.999`).toISOString()
      query = query.gte('created_at', start).lte('created_at', end)
    } else if (startDate) {
      const start = new Date(`${startDate}T00:00:00`).toISOString()
      query = query.gte('created_at', start)
    } else if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999`).toISOString()
      query = query.lte('created_at', end)
    }

    if (assignedTo) query = query.eq('assigned_to', assignedTo)
    if (createdBy) query = query.eq('created_by', createdBy)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:profiles!created_by(full_name, role),
        assignee:profiles!assigned_to(full_name, role),
        history:ticket_history(*, agent:profiles!changed_by(full_name)) 
      `) 
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateStatus(id, newStatus) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateEstado(id, novoEstado) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ estado: novoEstado })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async assignTicket(ticketId, agentId) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ assigned_to: agentId })
      .eq('id', ticketId)
      .select('*, assignee:profiles!assigned_to(full_name, role)')
      .single()
    if (error) throw error
    return data
  },

  async addComment(ticketId, userId, note, newStatus = null, oldStatus = null) {
    const payload = {
      ticket_id: ticketId,
      changed_by: userId,
      note: note,
    }
    
    if (newStatus) {
      payload.new_status = newStatus
    }

    if (oldStatus) {
      payload.old_status = oldStatus
    }

    const { data, error } = await supabase
      .from('ticket_history')
      .insert([payload])
      .select(`
        *,
        agent:profiles!ticket_history_changed_by_fkey(id, full_name)
      `)
      .single()

    if (error) throw error
    return data
  },

  async importTickets(ticketsData) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketsData)
    if (error) throw error
    return data
  },

  async closeWithNps(id, { nps_score, nps_comment }) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: 'FECHADO', nps_score, nps_comment })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async archiveTicket(id) {
    try {
      const { error: historyError } = await supabase
        .from('ticket_history')
        .delete()
        .eq('ticket_id', id)

      if (historyError) throw historyError

      const { data, error: ticketError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (ticketError) throw ticketError
      return true
      
    } catch (error) {
      console.error("Erro no serviço ao arquivar chamado:", error)
      throw error 
    }
  },
  
  async getDashboardMetrics() {
    const { data, error } = await supabase
      .from('tickets')
      .select('workflow, categoria')
      .not('status', 'eq', 'FECHADO') 

    if (error) throw error

    const workflowAgrupado = data.reduce((acc, ticket) => {
      const wf = ticket.workflow || 'Não classificado'
      acc[wf] = (acc[wf] || 0) + 1
      return acc
    }, {})

    const categoriaAgrupada = data.reduce((acc, ticket) => {
      const cat = ticket.categoria || 'Sem categoria'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    const formatChartData = (obj) => {
      return Object.entries(obj)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    }

    return {
      totalAtivos: data.length,
      porWorkflow: formatChartData(workflowAgrupado),
      porCategoria: formatChartData(categoriaAgrupada)
    }
  }
}