import { NextRequest, NextResponse } from 'next/server';

// API para transcrição de áudio usando OpenAI Whisper

export async function POST(request: NextRequest) {
  console.log('=== API TRANSCRIBE CHAMADA ===');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const missionId = formData.get('missionId') as string;
    const storeId = formData.get('storeId') as string;
    const promotorId = formData.get('promotorId') as string;

    console.log('Dados recebidos:', {
      hasAudio: !!audioFile,
      audioType: audioFile?.type,
      audioSize: audioFile?.size,
      missionId,
      storeId,
      promotorId,
    });

    if (!audioFile) {
      console.error('Erro: Arquivo de áudio não fornecido');
      return NextResponse.json(
        { error: 'Arquivo de áudio não fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo - aceitar mais formatos
    const audioType = audioFile.type || 'audio/webm';
    console.log('Tipo do áudio:', audioType);
    
    // Aceitar qualquer tipo de áudio
    if (!audioType.startsWith('audio/') && !audioType.includes('webm') && !audioType.includes('octet-stream')) {
      console.error('Erro: Formato não suportado:', audioType);
      return NextResponse.json(
        { error: `Formato de áudio não suportado: ${audioType}` },
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
      console.error('Erro: OPENAI_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada' },
        { status: 500 }
      );
    }

    console.log('OpenAI API Key configurada, iniciando transcrição...');

    // Converter File para Buffer
    const audioBuffer = await audioFile.arrayBuffer();
    console.log('Buffer do áudio criado, tamanho:', audioBuffer.byteLength);
    
    // Criar FormData para OpenAI
    const openaiFormData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    openaiFormData.append('file', audioBlob, 'audio.webm');
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'pt');
    openaiFormData.append('response_format', 'json');
    
    console.log('Enviando para OpenAI Whisper...');
    
    // Chamar API do Whisper
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: openaiFormData,
    });

    console.log('Resposta do Whisper - Status:', whisperResponse.status);

    if (!whisperResponse.ok) {
      const error = await whisperResponse.json();
      console.error('Erro Whisper:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Erro na transcrição: ' + (error.error?.message || 'Erro desconhecido') },
        { status: 500 }
      );
    }

    const whisperResult = await whisperResponse.json();
    console.log('Transcrição recebida:', whisperResult.text?.slice(0, 100) + '...');
    
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
