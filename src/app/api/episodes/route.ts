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
  try {
    const body = await request.json();
    const { missionId, missionTitle, recordingIds } = body;

    if (!missionId) {
      return NextResponse.json(
        { error: 'ID da missão é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar gravações da missão
    const allRecordings = await getRecordingsByMission(missionId);
    
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

    if (selectedRecordings.length < 1) {
      return NextResponse.json(
        { error: 'Necessário pelo menos 1 gravação para gerar episódio' },
        { status: 400 }
      );
    }

    // Filtrar apenas gravações com transcrição
    const recordingsWithTranscription = selectedRecordings.filter(r => r.transcription);
    
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

    if (!gptResponse.ok) {
      const error = await gptResponse.json();
      console.error('Erro GPT:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar episódio' },
        { status: 500 }
      );
    }

    const gptResult = await gptResponse.json();
    const contentText = gptResult.choices[0]?.message?.content;
    
    let episodeContent;
    try {
      episodeContent = JSON.parse(contentText);
    } catch {
      console.error('Erro ao parsear:', contentText);
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA' },
        { status: 500 }
      );
    }

    // Criar episódio
    const episode: StoredEpisode = {
      id: `ep_${Date.now()}`,
      missionId,
      missionTitle,
      title: episodeContent.title,
      summary: episodeContent.summary,
      script: episodeContent.script,
      recordingIds: approvedRecordings.map(r => r.id),
      totalRecordings: approvedRecordings.length,
      keyInsights: episodeContent.keyInsights,
      status: 'revisao',
      createdAt: new Date().toISOString(),
    };

    const saved = await addEpisode(episode);

    if (!saved) {
      return NextResponse.json(
        { error: 'Erro ao salvar episódio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      episode: saved,
      message: 'Episódio gerado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao gerar episódio:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar episódio' },
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
