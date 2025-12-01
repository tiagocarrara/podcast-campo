import { NextRequest, NextResponse } from 'next/server';

// API para análise de relato usando GPT-4
// Compara a transcrição com o guia da missão para verificar aderência

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcription, missionTitle, missionQuestion, missionCategory, missionGuide } = body;

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcrição não fornecida' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada' },
        { status: 500 }
      );
    }

    // Formatar o guia como lista numerada
    const guideList = missionGuide && missionGuide.length > 0 
      ? missionGuide.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')
      : 'Sem guia específico';

    const prompt = `Você é um analista de trade marketing avaliando relatos de promotores de campo.

MISSÃO: ${missionTitle}
PERGUNTA: ${missionQuestion || 'Relato livre'}
CATEGORIA: ${missionCategory}

GUIA/CHECKLIST DA MISSÃO (pontos que o promotor deveria abordar):
${guideList}

TRANSCRIÇÃO DO RELATO DO PROMOTOR:
"${transcription}"

---

Sua tarefa é avaliar a ADERÊNCIA do relato ao guia da missão. Compare o que o promotor disse com cada ponto do guia.

Retorne um JSON com exatamente este formato:
{
  "score": <número de 0 a 100 representando a aderência ao guia>,
  "covered": [<array de strings - pontos do guia que o promotor COBRIU no relato>],
  "missing": [<array de strings - pontos do guia que o promotor NÃO MENCIONOU e poderia ter abordado>],
  "summary": "<resumo de 1 frase do que o promotor relatou>"
}

Regras:
- O score deve refletir quantos pontos do guia foram cobertos
- Em "covered", liste os pontos que ele abordou de alguma forma (mesmo que parcialmente)
- Em "missing", liste APENAS pontos do guia que ele esqueceu e que seriam relevantes
- Seja objetivo e construtivo

Responda APENAS com o JSON, sem texto adicional.`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.json();
      console.error('Erro GPT:', error);
      return NextResponse.json(
        { error: 'Erro na análise: ' + (error.error?.message || 'Erro desconhecido') },
        { status: 500 }
      );
    }

    const gptResult = await gptResponse.json();
    const analysisText = gptResult.choices[0]?.message?.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.error('Erro ao parsear resposta:', analysisText);
      // Fallback se o JSON não for válido
      analysis = {
        score: 75,
        feedback: ['Relato recebido com sucesso'],
        improvements: ['Não foi possível analisar detalhadamente'],
        summary: 'Relato processado'
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar relato' },
      { status: 500 }
    );
  }
}

