import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
console.log('SUPABASE:', {
    url: supabaseUrl,
    key: supabaseKey ? `${supabaseKey.slice(0, 10)}...${supabaseKey.slice(-4)}` : 'undefined'
})