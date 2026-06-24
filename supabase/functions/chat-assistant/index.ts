import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Chave da API não encontrada no servidor.')
    }

    // 🚀 Ajustado para o modelo 1.5 Flash (A versão mais estável e rápida)
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const geminiResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ 
            text: `Você é um assistente de suporte técnico amigável do sistema F1SaaS. 
                   Responda de forma clara, educada e curta. 
                   Pergunta do usuário: "${message}"` 
          }]
        }]
      })
    })

    const geminiData = await geminiResponse.json()

    // 🛡️ PROTEÇÃO 1: Se o Google retornar um erro de limite ou API
    if (!geminiResponse.ok) {
      console.error("Erro retornado pelo Google:", JSON.stringify(geminiData))
      // 🚀 AGORA ELE VAI DEVOLVER O ERRO EXATO DO GOOGLE PARA O REACT:
      throw new Error(`O Google recusou: ${JSON.stringify(geminiData)}`)
    }s

    // 🛡️ PROTEÇÃO 2: Se a resposta for bloqueada por filtros de segurança
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error("Resposta bloqueada ou vazia:", geminiData)
      throw new Error("Não consegui gerar uma resposta para essa mensagem devido aos filtros de segurança.")
    }

    // 🚀 Extração segura do texto
    const iaText = geminiData.candidates[0].content?.parts[0]?.text || "Desculpe, a resposta gerada estava vazia."

    return new Response(JSON.stringify({ reply: iaText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Agora o erro real será enviado para o seu console do React!
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido'
    console.error("Erro na Edge Function:", errorMessage)
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, 
    })
  }
})