import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeById, updateEpisode } from '@/lib/store';

// POST - Gerar narração do episódio usando OpenAI TTS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episodeId } = body;

    if (!episodeId) {
      return NextResponse.json(
        { error: 'ID do episódio é obrigatório' },
        { status: 400 }
      );
    }

    const episode = await getEpisodeById(episodeId);
    if (!episode) {
      return NextResponse.json(
        { error: 'Episódio não encontrado' },
        { status: 404 }
      );
    }

    if (!episode.script) {
      return NextResponse.json(
        { error: 'Episódio não possui script para narrar' },
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

    // Gerar áudio com OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx', // Vozes: alloy, echo, fable, onyx, nova, shimmer
        input: episode.script,
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.json();
      console.error('Erro TTS:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar narração: ' + (error.error?.message || 'Erro desconhecido') },
        { status: 500 }
      );
    }

    // Converter para base64
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

    // Atualizar episódio com o áudio
    await updateEpisode(episodeId, {
      audioUrl: audioDataUrl,
      status: 'revisao',
    });

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
      message: 'Narração gerada com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao gerar narração:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar narração' },
      { status: 500 }
    );
  }
}
