import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata requisições de preflight do CORS (comum no React)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Mensagem vazia' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pega as variáveis de ambiente do próprio Supabase (Chaves seguras)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // 1. PASSO: Transformar a pergunta do cliente em um Vetor (Embedding) usando o Gemini
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: message }] }
        })
      }
    )
    
    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.embedding?.values

    if (!queryEmbedding) {
      throw new Error('Falha ao gerar embedding da pergunta no Gemini.')
    }

    // 2. PASSO: Buscar no banco public.knowledge_base qual trecho do manual é relevante
    const { data: documents, error: matchError } = await supabaseClient.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.35, // Margem de similaridade (35% ou mais parecido)
        match_count: 3         // Traz os 3 trechos mais relevantes do manual
      }
    )

    if (matchError) throw matchError

    // Agrupa os trechos encontrados para entregar para a IA ler
    const contextText = documents && documents.length > 0
      ? documents.map((doc: any) => `DOCUMENTO: ${doc.title}\nCONTEÚDO:\n${doc.content}`).join('\n\n')
      : 'Nenhum documento específico encontrado nos manuais para esta dúvida.'

    // 3. PASSO: Enviar o contexto + a pergunta para o Gemini responder o cliente
    const promptSystem = `Você é o Assistente Virtual inteligente do sistema Support SaaS.
Seu objetivo é ajudar usuários externos a resolverem dúvidas sobre o sistema utilizando APENAS os fragmentos de manuais fornecidos abaixo.

Regras rígidas:
1. Responda de forma clara, educada e direta baseando-se estritamente no contexto do manual.
2. Se a resposta não estiver clara ou não puder ser deduzida do contexto fornecido, diga cordialmente que não localizou a resposta no manual e oriente-o a clicar no botão para falar com o suporte via WhatsApp.
3. Não invente caminhos, botões ou funções que não estejam no manual fornecido.

CONTEXTO DOS MANUAIS DO SISTEMA:
${contextText}`

    const chatResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: `${promptSystem}\n\nPERGUNTA DO USUÁRIO: ${message}` }]
          }]
        })
      }
    )

    const chatData = await chatResponse.json()
    const botReply = chatData.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, tive um problema ao processar sua resposta.'

    return new Response(JSON.stringify({ response: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})