import { NextRequest, NextResponse } from 'next/server';

// API para transcrição de áudio usando OpenAI Whisper

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const missionId = formData.get('missionId') as string;
    const storeId = formData.get('storeId') as string;
    const promotorId = formData.get('promotorId') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Arquivo de áudio não fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/mpeg'];
    if (!allowedTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
      return NextResponse.json(
        { error: 'Formato de áudio não suportado' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 25MB.' },
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

    // Converter File para Buffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Criar FormData para OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append('file', new Blob([audioBuffer], { type: audioFile.type }), 'audio.webm');
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'pt');
    openaiFormData.append('response_format', 'json');
    
    // Chamar API do Whisper
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: openaiFormData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.json();
      console.error('Erro Whisper:', error);
      return NextResponse.json(
        { error: 'Erro na transcrição: ' + (error.error?.message || 'Erro desconhecido') },
        { status: 500 }
      );
    }

    const whisperResult = await whisperResponse.json();
    
    const recording = {
      id: `rec_${Date.now()}`,
      missionId,
      storeId,
      promotorId,
      transcription: whisperResult.text,
      status: 'transcrito' as const,
      createdAt: new Date().toISOString(),
      points: 50,
    };

    return NextResponse.json({
      success: true,
      recording,
      transcription: whisperResult.text,
      message: 'Áudio transcrito com sucesso!',
    });
  } catch (error) {
    console.error('Erro na transcrição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar áudio' },
      { status: 500 }
    );
  }
}
