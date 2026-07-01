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
    const { message } = JSON.parse(rawBody)

    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim() 
    if (!apiKey) throw new Error("A chave GEMINI_API_KEY não foi encontrada na nuvem.")
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const genAI = new GoogleGenerativeAI(apiKey)

    // 🚀 ATUALIZAÇÃO 2026: Novo modelo oficial de Embeddings do Google
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
    const embedResult = await embeddingModel.embedContent(message)
    const query_embedding = embedResult.embedding.values

    const { data: manuais, error: matchError } = await supabase.rpc('match_manuais', {
      query_embedding,
      match_threshold: 0.5, 
      match_count: 3
    })

    if (matchError) throw matchError

    // ------------------------------------------------------------------
    // 🛡️ PASSO 3: Monta a Memória Invisível com a TRAVA ANTI-ALUCINAÇÃO
    // ------------------------------------------------------------------
    let memoriaInvisivel = ''
    
    if (manuais && manuais.length > 0) {
      memoriaInvisivel = `Você é o Assistente Virtual Oficial do F1SaaS. 
      REGRA DE OURO: Você DEVE responder APENAS e EXCLUSIVAMENTE com base nos manuais fornecidos abaixo. 
      Se o cliente perguntar algo que NÃO ESTÁ escrito nestes manuais, você NÃO DEVE usar seu conhecimento externo. 
      Neste caso, responda EXATAMENTE isto: "Desculpe, mas não encontrei essa informação na minha base de conhecimento. Por favor, acione a equipe de suporte humano para que possamos te ajudar com precisão."
      Seja sempre educado, amigável e direto.
      
      Aqui estão os manuais encontrados para esta pergunta:\n\n`
      
      manuais.forEach((m: any) => {
        memoriaInvisivel += `[MANUAL: ${m.titulo}]\n${m.conteudo}\n\n`
      })
    } else {
      memoriaInvisivel = `Você é o Assistente Virtual Oficial do F1SaaS. 
      A busca não encontrou nenhum manual relacionado à pergunta do cliente.
      Sua única resposta deve ser: "Desculpe, não encontrei nenhuma regra ou manual sobre isso na minha base de conhecimento. Posso te ajudar com alguma outra dúvida sobre o sistema?"`
    }

    // 🚀 ATUALIZAÇÃO 2026: Novo modelo de Chat 
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const chatResult = await chatModel.generateContent({
      contents: [
        { role: "user", parts: [{ text: memoriaInvisivel }] },
        { role: "model", parts: [{ text: "Entendido! Lerei estes manuais rigorosamente e responderei APENAS com base neles, sem inventar informações." }] },
        { role: "user", parts: [{ text: message }] }
      ]
    })

    const textResponse = chatResult.response.text()

    return new Response(JSON.stringify({ reply: textResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("Erro capturado:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})