import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai' 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    if (!rawBody) throw new Error("A requisição chegou vazia do React.")
    const { record_id, texto } = JSON.parse(rawBody)

    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
    if (!apiKey) throw new Error("A chave GEMINI_API_KEY não foi encontrada.")

    const genAI = new GoogleGenerativeAI(apiKey)

    // 🚀 ATUALIZAÇÃO 2026: Novo modelo oficial de Embeddings do Google
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
    const embedResult = await embeddingModel.embedContent(texto)
    const embedding = embedResult.embedding.values

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    )

    const { error } = await supabase
      .from('manuais')
      .update({ embedding })
      .eq('id', record_id)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("Erro capturado:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})