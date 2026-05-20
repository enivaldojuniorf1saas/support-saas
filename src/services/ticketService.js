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

    async list({ status, assignedTo, createdBy } = {}) {
        let query = supabase
            .from('tickets')
            .select(`
        *,
        creator:profiles!created_by(full_name),
        assignee:profiles!assigned_to(full_name)
      `)
            .order('created_at', { ascending: false })

        if (status) query = query.eq('status', status)
        if (assignedTo) query = query.eq('assigned_to', assignedTo)
        if (createdBy) query = query.eq('created_by', createdBy)

        const { data, error } = await query
        if (error) throw error
        return data
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
        *,
        creator:profiles!created_by(full_name, role),
        assignee:profiles!assigned_to(full_name, role),
        history:ticket_history(*, agent:profiles(full_name))
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    async updateStatus(id, newStatus) {
        const VALID_TRANSITIONS = {
            ABERTO: ['EM_ATENDIMENTO'],
            EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'RESOLVIDO'],
            AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'RESOLVIDO'],
            RESOLVIDO: ['FECHADO'],
            FECHADO: [],
        }

        const { data: current, error: fetchError } = await supabase
            .from('tickets')
            .select('status')
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError

        if (!VALID_TRANSITIONS[current.status]?.includes(newStatus)) {
            throw new Error(`Transição inválida: ${current.status} → ${newStatus}`)
        }

        const { data, error } = await supabase
            .from('tickets')
            .update({ status: newStatus })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async closeWithNps(id, { nps_score, nps_comment }) {
        if (nps_score === undefined || nps_score < 0 || nps_score > 10) {
            throw new Error('NPS deve estar entre 0 e 10')
        }

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