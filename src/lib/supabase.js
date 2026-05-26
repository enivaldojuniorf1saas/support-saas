import { createClient } from '@supabase/supabase-js'

// No Vite, a leitura correta de variáveis de ambiente é através do 'import.meta.env'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sistema de diagnóstico automático no Console (F12) para garantir que o .env foi lido
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 ERRO CRÍTICO NO FRONTEND: O Vite não conseguiu ler o seu arquivo .env.local! ' +
    'Verifique se o arquivo está na raiz do projeto e reinicie o terminal.'
  )
} else {
  console.log('✅ Conexão com o Supabase configurada com sucesso!')
}

// Inicializa e exporta o cliente oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey)