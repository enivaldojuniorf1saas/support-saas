import { supabase } from '../lib/supabase'

export const ticketService = {
  async create(payload) {
    if (!payload?.title) throw new Error('Título é obrigatório')
    if (!payload?.customer_name) throw new Error('Nome do cliente é obrigatório')

    const { data, error } = await supabase
      .from('tickets')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async list({ status, assignedTo, createdBy, page = 1, pageSize = 10 } = {}) {
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

    if (status) query = query.eq('status', status)
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
      `) // <-- Garanta que tem o !changed_by aqui também
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

  // NOVO: Função para atualizar o Estado de Desenvolvimento
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

  // 3. Sistema de Comentários / Interações
  async addComment(ticketId, userId, note, newStatus = null) {
    const payload = {
      ticket_id: ticketId,
      changed_by: userId,
      note: note,
    }
    
    // Só envia o new_status se ele realmente existir (mudança de status)
    if (newStatus) {
      payload.new_status = newStatus
    }

    const { data, error } = await supabase
      .from('ticket_history')
      .insert(payload)
      .select('*, agent:profiles!changed_by(full_name)')
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
}