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
    const { relato } = await req.json()

    if (!relato) {
      throw new Error("O relato do cliente não foi fornecido.")
    }

    // 1. O prompt agora exige estritamente um formato JSON
    const systemPrompt = `Você é um Engenheiro de Requisitos e Analista de Triagem (Nível 2).
Sua missão é receber relatos brutos de clientes e estruturá-los para o sistema Ocara.

REGRAS:
1. Retorne APENAS um objeto JSON válido. Não adicione marcações de código markdown.
2. O JSON deve ter duas chaves exatas: "titulo" e "descricao".
3. Em "titulo", crie um título curto e direto para o chamado.
4. Em "descricao", crie o corpo estruturado SEM colocar a linha de título de volta.

MODELO DO JSON ESPERADO:
{
  "titulo": "Resumo do problema em poucas palavras",
  "descricao": "**Tipo:** [Bug / Feature / Chore]\\n**Persona Envolvida:** [Ex: Administrador]\\n**Contexto/Dor do Cliente:** [Resumo]\\n\\n**Cenário:**\\n[Descreva tecnicamente]\\n\\n**Passos para Reproduzir:**\\n1. [Passo 1]\\n2. [Passo 2]\\n\\n**Direcionamento Visual:** \\n> [⚠️ EQUIPE DE SUPORTE: COLOQUE AQUI O PRINT/VÍDEO DA TELA E O ID DO USUÁRIO]"
}`

    const apiKey = Deno.env.get('AI_API_KEY')
    
    if (!apiKey) {
      throw new Error("Chave de API (AI_API_KEY) não encontrada no servidor.")
    }

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // 2. Este comando obriga o Gemini a garantir que a saída é um JSON perfeito
        generationConfig: {
          responseMimeType: "application/json"
        },
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nRelato original do cliente:\n"${relato}"` }] }
        ]
      })
    })

    const aiData = await aiResponse.json()
    
    if (!aiResponse.ok || aiData.error) {
      console.error("ERRO DO GEMINI:", aiData)
      throw new Error(aiData.error?.message || "Erro desconhecido na API da IA")
    }
    
    // 3. Pegamos a resposta (que agora é um JSON em texto) e transformamos em objeto
    // 3. Pegamos a resposta, removemos qualquer formatação extra (crases de markdown) e transformamos em objeto
    let responseText = aiData.candidates[0].content.parts[0].text
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    const parsedData = JSON.parse(responseText)

    // 4. Devolvemos as duas informações separadinhas para a sua tela!
    return new Response(
      JSON.stringify({ 
        titulo: parsedData.titulo, 
        descricao: parsedData.descricao 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    // 4. Devolvemos as duas informações separadinhas para a sua tela!
    return new Response(
      JSON.stringify({ 
        titulo: parsedData.titulo, 
        descricao: parsedData.descricao 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("ERRO NA EDGE FUNCTION:", error.message, error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})