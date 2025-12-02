import { NextRequest, NextResponse } from 'next/server';
import { 
  addEpisode, 
  getEpisodes, 
  getEpisodeById, 
  updateEpisode,
  getRecordingsByMission,
  StoredEpisode 
} from '@/lib/store';

// GET - Listar episódios
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const episode = await getEpisodeById(id);
      if (!episode) {
        return NextResponse.json({ error: 'Episódio não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, episode });
    }

    const episodes = await getEpisodes();
    return NextResponse.json({
      success: true,
      episodes,
      total: episodes.length,
    });
  } catch (error) {
    console.error('Erro ao buscar episódios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar episódios' },
      { status: 500 }
    );
  }
}

// POST - Gerar novo episódio de podcast
export async function POST(request: NextRequest) {
  console.log('=== API EPISODES POST ===');
  
  try {
    const body = await request.json();
    const { missionId, missionTitle, recordingIds } = body;

    console.log('Dados recebidos:', { missionId, missionTitle, recordingIds });

    if (!missionId) {
      return NextResponse.json(
        { error: 'ID da missão é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar gravações da missão
    console.log('Buscando gravações da missão:', missionId);
    const allRecordings = await getRecordingsByMission(missionId);
    console.log('Gravações encontradas:', allRecordings.length);
    
    // Se recordingIds foi passado, filtrar apenas essas gravações
    let selectedRecordings;
    if (recordingIds && recordingIds.length > 0) {
      selectedRecordings = allRecordings.filter(r => recordingIds.includes(r.id));
    } else {
      // Fallback: usar gravações aprovadas/transcritas
      selectedRecordings = allRecordings.filter(r => 
        r.status === 'aprovado' || r.status === 'transcrito'
      );
    }

    console.log('Gravações selecionadas:', selectedRecordings.length);

    if (selectedRecordings.length < 1) {
      return NextResponse.json(
        { error: 'Necessário pelo menos 1 gravação para gerar episódio' },
        { status: 400 }
      );
    }

    // Filtrar apenas gravações com transcrição
    const recordingsWithTranscription = selectedRecordings.filter(r => r.transcription);
    console.log('Gravações com transcrição:', recordingsWithTranscription.length);
    
    if (recordingsWithTranscription.length < 1) {
      return NextResponse.json(
        { error: 'Necessário pelo menos 1 gravação transcrita para gerar episódio' },
        { status: 400 }
      );
    }

    const approvedRecordings = recordingsWithTranscription;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada' },
        { status: 500 }
      );
    }

    // Compilar todas as transcrições
    const transcriptions = approvedRecordings.map((r, i) => 
      `[Relato ${i + 1} - ${r.promotorName} em ${r.storeName}, ${r.storeCity}]\n${r.transcription}`
    ).join('\n\n');

    // Gerar resumo e script do podcast com GPT-4
    const prompt = `Você é um produtor de podcast de trade marketing. Analise os relatos dos promotores de campo abaixo e crie um episódio de podcast.

MISSÃO: ${missionTitle}
NÚMERO DE RELATOS: ${approvedRecordings.length}

TRANSCRIÇÕES DOS RELATOS:
${transcriptions}

---

Crie um episódio de podcast seguindo este formato JSON:
{
  "title": "<título chamativo para o episódio, max 60 caracteres>",
  "summary": "<resumo executivo de 2-3 parágrafos destacando os principais achados>",
  "script": "<script completo para narração do podcast, 2-3 minutos de leitura, em tom profissional mas acessível. Inclua: abertura, principais insights, detalhes relevantes, conclusão com recomendações>",
  "keyInsights": [<array de 4-6 insights principais em frases curtas>]
}

O script deve:
- Ter entre 300-500 palavras
- Começar com uma introdução envolvente
- Mencionar dados específicos dos relatos
- Terminar com recomendações acionáveis
- Usar linguagem clara e profissional

Responda APENAS com o JSON, sem texto adicional.`;

    console.log('Enviando para GPT-4o-mini...');
    console.log('Tamanho do prompt:', prompt.length, 'caracteres');
    
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
        max_tokens: 1500,
      }),
    });

    console.log('Resposta GPT - Status:', gptResponse.status);

    if (!gptResponse.ok) {
      const error = await gptResponse.json();
      console.error('Erro GPT:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Erro ao gerar episódio: ' + (error.error?.message || 'Erro desconhecido') },
        { status: 500 }
      );
    }

    const gptResult = await gptResponse.json();
    const contentText = gptResult.choices[0]?.message?.content;
    
    console.log('Resposta GPT recebida, tamanho:', contentText?.length);
    
    let episodeContent;
    try {
      // Tentar limpar o JSON se tiver texto extra
      let jsonText = contentText || '';
      
      // Remover markdown code blocks de várias formas
      jsonText = jsonText
        .replace(/^```json\s*/i, '')  // Remove ```json do início
        .replace(/^```\s*/i, '')       // Remove ``` do início
        .replace(/\s*```$/i, '')       // Remove ``` do final
        .replace(/^json\s*/i, '')      // Remove "json" solto no início
        .trim();
      
      // Se ainda começar com algum texto antes do {, encontrar o {
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
      }
      
      console.log('JSON limpo (primeiros 200 chars):', jsonText.slice(0, 200));
      
      episodeContent = JSON.parse(jsonText);
      console.log('JSON parseado com sucesso');
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.error('Conteúdo recebido:', contentText?.slice(0, 500));
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA. Tente novamente.' },
        { status: 500 }
      );
    }

    // Criar episódio
    const episode: StoredEpisode = {
      id: `ep_${Date.now()}`,
      missionId,
      missionTitle: missionTitle || 'Episódio',
      title: episodeContent.title || 'Novo Episódio',
      summary: episodeContent.summary || '',
      script: episodeContent.script || '',
      recordingIds: approvedRecordings.map(r => r.id),
      totalRecordings: approvedRecordings.length,
      keyInsights: episodeContent.keyInsights || [],
      status: 'revisao',
      createdAt: new Date().toISOString(),
    };

    console.log('Salvando episódio no Supabase...');
    const saved = await addEpisode(episode);

    if (!saved) {
      console.error('Erro ao salvar episódio no Supabase');
      return NextResponse.json(
        { error: 'Erro ao salvar episódio no banco de dados' },
        { status: 500 }
      );
    }

    console.log('Episódio salvo com sucesso:', saved.id);

    return NextResponse.json({
      success: true,
      episode: saved,
      message: 'Episódio gerado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao gerar episódio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao gerar episódio: ' + errorMessage },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar episódio (editar script, publicar, etc)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do episódio é obrigatório' },
        { status: 400 }
      );
    }

    if (updates.status === 'publicado') {
      updates.publishedAt = new Date().toISOString();
    }

    await updateEpisode(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Episódio atualizado!',
    });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar' },
      { status: 500 }
    );
  }
}
